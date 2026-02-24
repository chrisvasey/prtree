import { describe, expect, test } from 'bun:test';

import { createApp } from '../src/app';
import type { PullRequestSummary } from '../src/types';

const pulls: PullRequestSummary[] = [
  {
    number: 7,
    title: 'Example PR',
    state: 'open',
    url: 'https://github.com/acme/repo/pull/7',
    headRef: 'feature/example',
    baseRef: 'main',
    updatedAt: '2026-02-20T10:00:00Z',
    draft: false
  }
];

describe('GET /api/graph', () => {
  test('returns graph data for a valid repo query', async () => {
    const app = createApp({
      fetchPullRequests: async () => pulls
    });

    const response = await app.request('/api/graph?repo=acme/repo&state=open');
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      repo: string;
      pullCount: number;
      nodes: Array<{ id: string }>;
      edges: Array<{ id: string }>;
    };

    expect(payload.repo).toBe('acme/repo');
    expect(payload.pullCount).toBe(1);
    expect(payload.nodes.some((node) => node.id === 'repo:acme/repo')).toBe(true);
    expect(payload.nodes.some((node) => node.id === 'pr:7')).toBe(true);
    expect(payload.edges.length).toBe(1);
  });

  test('returns 400 for invalid repo format', async () => {
    const app = createApp({
      fetchPullRequests: async () => pulls
    });

    const response = await app.request('/api/graph?repo=bad-format');
    expect(response.status).toBe(400);

    const payload = (await response.json()) as { error: string };
    expect(payload.error).toContain('owner/repo');
  });

  test('returns 400 for invalid state value', async () => {
    const app = createApp({
      fetchPullRequests: async () => pulls
    });

    const response = await app.request('/api/graph?repo=acme/repo&state=merged');
    expect(response.status).toBe(400);
  });

  test('returns 502 when fetcher fails', async () => {
    const app = createApp({
      fetchPullRequests: async () => {
        throw new Error('boom');
      }
    });

    const response = await app.request('/api/graph?repo=acme/repo');
    expect(response.status).toBe(502);

    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe('boom');
  });
});
