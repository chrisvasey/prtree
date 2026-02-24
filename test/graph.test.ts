import { describe, expect, test } from 'bun:test';

import { buildPullRequestGraph } from '../src/graph';
import type { PullRequestSummary } from '../src/types';

const samplePulls: PullRequestSummary[] = [
  {
    number: 10,
    title: 'Base feature',
    state: 'open',
    url: 'https://github.com/acme/repo/pull/10',
    headRef: 'feature/base',
    baseRef: 'main',
    updatedAt: '2026-02-20T10:00:00Z',
    draft: false
  },
  {
    number: 11,
    title: 'Stacked on base',
    state: 'open',
    url: 'https://github.com/acme/repo/pull/11',
    headRef: 'feature/child',
    baseRef: 'feature/base',
    updatedAt: '2026-02-20T11:00:00Z',
    draft: false
  },
  {
    number: 12,
    title: 'Independent',
    state: 'closed',
    url: 'https://github.com/acme/repo/pull/12',
    headRef: 'fix/one',
    baseRef: 'main',
    updatedAt: '2026-02-20T09:00:00Z',
    draft: false
  }
];

describe('buildPullRequestGraph', () => {
  test('creates a repo node and one node per PR', () => {
    const graph = buildPullRequestGraph('acme/repo', samplePulls);

    expect(graph.nodes.length).toBe(4);
    expect(graph.nodes.some((node) => node.id === 'repo:acme/repo' && node.type === 'repo')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'pr:10')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'pr:11')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'pr:12')).toBe(true);
  });

  test('links stacked PRs to parent PR when base ref matches head ref', () => {
    const graph = buildPullRequestGraph('acme/repo', samplePulls);

    expect(graph.edges).toContainEqual({
      id: 'e-pr:10-pr:11',
      source: 'pr:10',
      target: 'pr:11'
    });
  });

  test('links non-stacked PRs back to repository root', () => {
    const graph = buildPullRequestGraph('acme/repo', samplePulls);

    expect(graph.edges).toContainEqual({
      id: 'e-repo:acme/repo-pr:10',
      source: 'repo:acme/repo',
      target: 'pr:10'
    });
    expect(graph.edges).toContainEqual({
      id: 'e-repo:acme/repo-pr:12',
      source: 'repo:acme/repo',
      target: 'pr:12'
    });
  });

  test('positions children farther right than root', () => {
    const graph = buildPullRequestGraph('acme/repo', samplePulls);

    const root = graph.nodes.find((node) => node.id === 'repo:acme/repo');
    const child = graph.nodes.find((node) => node.id === 'pr:10');

    expect(root).toBeDefined();
    expect(child).toBeDefined();
    expect((child?.position.x ?? 0) > (root?.position.x ?? 0)).toBe(true);
  });
});
