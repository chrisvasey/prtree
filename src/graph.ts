import type {
  GraphEdge,
  GraphNode,
  PullRequestGraph,
  PullRequestSummary
} from './types';

const HORIZONTAL_GAP = 320;
const VERTICAL_GAP = 140;

function getDepthByNode(rootId: string, edges: GraphEdge[], nodeIds: string[]): Map<string, number> {
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    const list = children.get(edge.source) ?? [];
    list.push(edge.target);
    children.set(edge.source, list);
  }

  const depth = new Map<string, number>([[rootId, 0]]);
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const source = queue.shift();
    if (!source) {
      break;
    }

    const sourceDepth = depth.get(source) ?? 0;
    const next = children.get(source) ?? [];

    for (const target of next) {
      const currentDepth = depth.get(target);
      const candidateDepth = sourceDepth + 1;
      if (currentDepth === undefined || candidateDepth < currentDepth) {
        depth.set(target, candidateDepth);
        queue.push(target);
      }
    }
  }

  // Any disconnected nodes are still placed on depth 1.
  for (const id of nodeIds) {
    if (!depth.has(id)) {
      depth.set(id, 1);
    }
  }

  return depth;
}

function pickParent(
  pr: PullRequestSummary,
  byHeadRef: Map<string, PullRequestSummary[]>
): PullRequestSummary | undefined {
  const candidates = (byHeadRef.get(pr.baseRef) ?? []).filter((candidate) => candidate.number !== pr.number);

  if (candidates.length === 0) {
    return undefined;
  }

  candidates.sort((left, right) => {
    const byUpdatedAt = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    if (byUpdatedAt !== 0) {
      return byUpdatedAt;
    }

    return right.number - left.number;
  });

  return candidates[0];
}

function positionNodes(nodes: GraphNode[], rootId: string, edges: GraphEdge[]): GraphNode[] {
  const nodeIds = nodes.map((node) => node.id);
  const depthByNode = getDepthByNode(rootId, edges, nodeIds);
  const groups = new Map<number, GraphNode[]>();

  for (const node of nodes) {
    const depth = depthByNode.get(node.id) ?? 1;
    const list = groups.get(depth) ?? [];
    list.push(node);
    groups.set(depth, list);
  }

  const positioned: GraphNode[] = [];
  const depths = Array.from(groups.keys()).sort((a, b) => a - b);

  for (const depth of depths) {
    const group = groups.get(depth) ?? [];

    group.sort((left, right) => {
      if (left.type === 'repo') {
        return -1;
      }
      if (right.type === 'repo') {
        return 1;
      }
      return left.data.number - right.data.number;
    });

    for (let index = 0; index < group.length; index += 1) {
      const node = group[index];
      positioned.push({
        ...node,
        position: {
          x: depth * HORIZONTAL_GAP,
          y: index * VERTICAL_GAP
        }
      });
    }
  }

  return positioned;
}

export function buildPullRequestGraph(repo: string, pullRequests: PullRequestSummary[]): PullRequestGraph {
  const repoId = `repo:${repo}`;

  const nodes: GraphNode[] = [
    {
      id: repoId,
      type: 'repo',
      position: { x: 0, y: 0 },
      data: { label: repo }
    }
  ];

  const byHeadRef = new Map<string, PullRequestSummary[]>();
  for (const pr of pullRequests) {
    const list = byHeadRef.get(pr.headRef) ?? [];
    list.push(pr);
    byHeadRef.set(pr.headRef, list);
  }

  for (const pr of pullRequests) {
    nodes.push({
      id: `pr:${pr.number}`,
      type: 'pr',
      position: { x: 0, y: 0 },
      data: {
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.url,
        headRef: pr.headRef,
        baseRef: pr.baseRef,
        authorLogin: pr.authorLogin,
        authorAvatarUrl: pr.authorAvatarUrl,
        openedAt: pr.openedAt,
        subscription: pr.subscription,
        draft: pr.draft
      }
    });
  }

  const edges: GraphEdge[] = [];

  for (const pr of pullRequests) {
    const parent = pickParent(pr, byHeadRef);
    const source = parent ? `pr:${parent.number}` : repoId;
    const target = `pr:${pr.number}`;

    edges.push({
      id: `e-${source}-${target}`,
      source,
      target
    });
  }

  return {
    nodes: positionNodes(nodes, repoId, edges),
    edges
  };
}
