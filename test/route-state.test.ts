import { describe, expect, test } from 'bun:test';

import {
  buildRepoPath,
  findFocusedNodeId,
  focusParamFromNode,
  isValidRepo,
  normalizeFocusParam,
  parseRepo,
  repoFromRouteParams
} from '../frontend/src/lib/routeState';
import type { GraphNode } from '../frontend/src/types';

const sampleNodes: GraphNode[] = [
  {
    id: 'repo:acme/repo',
    type: 'repo',
    position: { x: 0, y: 0 },
    data: { label: 'acme/repo' }
  },
  {
    id: 'pr:10',
    type: 'pr',
    position: { x: 320, y: 0 },
    data: {
      number: 10,
      title: 'Base feature',
      state: 'open',
      url: 'https://github.com/acme/repo/pull/10',
      headRef: 'feature/base',
      baseRef: 'main',
      authorLogin: 'alice',
      authorAvatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      openedAt: '2026-02-18T10:00:00Z',
      subscription: 'subscribed',
      draft: false
    }
  },
  {
    id: 'pr:11',
    type: 'pr',
    position: { x: 640, y: 0 },
    data: {
      number: 11,
      title: 'Stacked PR',
      state: 'open',
      url: 'https://github.com/acme/repo/pull/11',
      headRef: 'feature/child',
      baseRef: 'feature/base',
      authorLogin: 'bob',
      authorAvatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
      openedAt: '2026-02-18T11:00:00Z',
      subscription: 'not-subscribed',
      draft: false
    }
  }
];

describe('routeState helpers', () => {
  test('validates and parses repos', () => {
    expect(isValidRepo('acme/repo')).toBe(true);
    expect(isValidRepo('acme')).toBe(false);

    expect(parseRepo(' acme/repo ')).toEqual({ owner: 'acme', name: 'repo' });
    expect(parseRepo('bad-format')).toBeNull();
  });

  test('builds repo paths with optional focus', () => {
    expect(buildRepoPath('acme/repo')).toBe('/acme/repo');
    expect(buildRepoPath('acme/repo', 'feature/base')).toBe('/acme/repo/feature%2Fbase');
    expect(buildRepoPath('bad-format')).toBeNull();
  });

  test('builds repo from route params', () => {
    expect(repoFromRouteParams('acme', 'repo')).toBe('acme/repo');
    expect(repoFromRouteParams('acme', 'bad/repo')).toBeNull();
  });

  test('normalizes focus params', () => {
    expect(normalizeFocusParam('feature%2Fbase')).toBe('feature/base');
    expect(normalizeFocusParam('  pr:10  ')).toBe('pr:10');
    expect(normalizeFocusParam('')).toBeNull();
  });

  test('finds focused PR ids by branch, id and number', () => {
    expect(findFocusedNodeId(sampleNodes, 'feature/child')).toBe('pr:11');
    expect(findFocusedNodeId(sampleNodes, 'pr:10')).toBe('pr:10');
    expect(findFocusedNodeId(sampleNodes, '11')).toBe('pr:11');
    expect(findFocusedNodeId(sampleNodes, '#10')).toBe('pr:10');
    expect(findFocusedNodeId(sampleNodes, 'pr-11')).toBe('pr:11');
    expect(findFocusedNodeId(sampleNodes, 'unknown')).toBeNull();
  });

  test('extracts focus params from PR nodes', () => {
    const repoNode = sampleNodes[0]!;
    const prNode = sampleNodes[1]!;

    expect(focusParamFromNode(repoNode)).toBeNull();
    expect(focusParamFromNode(prNode)).toBe('feature/base');
  });
});
