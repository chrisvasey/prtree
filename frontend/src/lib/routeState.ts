import type { GraphNode } from '../types';

const REPO_PATTERN = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

export function isValidRepo(repo: string): boolean {
  return REPO_PATTERN.test(repo);
}

export function parseRepo(repo: string): { owner: string; name: string } | null {
  const normalized = repo.trim();
  if (!isValidRepo(normalized)) {
    return null;
  }

  const [owner, name] = normalized.split('/');
  if (!owner || !name) {
    return null;
  }

  return { owner, name };
}

export function repoFromRouteParams(owner?: string, repo?: string): string | null {
  if (!owner || !repo) {
    return null;
  }

  const normalizedRepo = `${owner}/${repo}`;
  return isValidRepo(normalizedRepo) ? normalizedRepo : null;
}

export function normalizeFocusParam(focus?: string | null): string | null {
  if (!focus) {
    return null;
  }

  const trimmed = focus.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export function buildRepoPath(repo: string, focus?: string | null): string | null {
  const parsed = parseRepo(repo);
  if (!parsed) {
    return null;
  }

  const basePath = `/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.name)}`;
  if (!focus || !focus.trim()) {
    return basePath;
  }

  return `${basePath}/${encodeURIComponent(focus.trim())}`;
}

function parsePullRequestNumber(focus: string): number | null {
  const prPatterns = [/^#?(\d+)$/, /^pr:(\d+)$/i, /^pr-(\d+)$/i];

  for (const pattern of prPatterns) {
    const match = focus.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

export function findFocusedNodeId(nodes: GraphNode[], focus: string | null): string | null {
  if (!focus) {
    return null;
  }

  const normalizedFocus = focus.trim();
  if (!normalizedFocus) {
    return null;
  }

  const directIdMatch = nodes.find((node) => node.type === 'pr' && node.id === normalizedFocus);
  if (directIdMatch?.type === 'pr') {
    return directIdMatch.id;
  }

  const pullNumber = parsePullRequestNumber(normalizedFocus);
  if (pullNumber !== null) {
    const pullRequestNode = nodes.find((node) => node.type === 'pr' && node.data.number === pullNumber);
    if (pullRequestNode?.type === 'pr') {
      return pullRequestNode.id;
    }
  }

  const branchMatch = nodes.find((node) => node.type === 'pr' && node.data.headRef === normalizedFocus);
  return branchMatch?.type === 'pr' ? branchMatch.id : null;
}

export function focusParamFromNode(node: GraphNode): string | null {
  return node.type === 'pr' ? node.data.headRef : null;
}
