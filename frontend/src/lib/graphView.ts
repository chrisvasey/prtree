import { Position, type Edge, type Node } from '@xyflow/react';

import type { GraphNode, GraphResponse } from '../types';

export type LayoutMode = 'horizontal' | 'vertical';
export type ThemeMode = 'light' | 'dark';

const HORIZONTAL_GAP = 430;
const VERTICAL_GAP = 170;
const REPO_NODE_WIDTH = 280;
const PR_NODE_WIDTH = 360;
const NODE_HEIGHT = 72;

export function filterGraphByFocusedPr(
  nodes: GraphNode[],
  edges: GraphResponse['edges'],
  focusedPrId: string | null
): { nodes: GraphNode[]; edges: GraphResponse['edges'] } {
  if (!focusedPrId || !nodes.some((node) => node.id === focusedPrId)) {
    return { nodes, edges };
  }

  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    const upstream = parents.get(edge.target) ?? [];
    upstream.push(edge.source);
    parents.set(edge.target, upstream);

    const downstream = children.get(edge.source) ?? [];
    downstream.push(edge.target);
    children.set(edge.source, downstream);
  }

  const visibleIds = new Set<string>([focusedPrId]);

  const ancestorQueue = [focusedPrId];
  while (ancestorQueue.length > 0) {
    const current = ancestorQueue.shift();
    if (!current) {
      break;
    }

    for (const parentId of parents.get(current) ?? []) {
      if (visibleIds.has(parentId)) {
        continue;
      }

      visibleIds.add(parentId);
      ancestorQueue.push(parentId);
    }
  }

  const descendantQueue = [focusedPrId];
  while (descendantQueue.length > 0) {
    const current = descendantQueue.shift();
    if (!current) {
      break;
    }

    for (const childId of children.get(current) ?? []) {
      if (visibleIds.has(childId)) {
        continue;
      }

      visibleIds.add(childId);
      descendantQueue.push(childId);
    }
  }

  return {
    nodes: nodes.filter((node) => visibleIds.has(node.id)),
    edges: edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
  };
}

export function positionGraph(nodes: GraphNode[], edges: GraphResponse['edges'], layoutMode: LayoutMode): GraphNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const rootId = nodes.find((node) => node.type === 'repo')?.id ?? nodes[0]?.id;
  if (!rootId) {
    return nodes;
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    const list = children.get(edge.source) ?? [];
    list.push(edge.target);
    children.set(edge.source, list);
  }

  const compareNodeIds = (leftId: string, rightId: string): number => {
    const left = nodeById.get(leftId);
    const right = nodeById.get(rightId);

    if (!left || !right) {
      return leftId.localeCompare(rightId);
    }

    if (left.type === 'repo') {
      return -1;
    }

    if (right.type === 'repo') {
      return 1;
    }

    return left.data.number - right.data.number;
  };

  for (const [source, childIds] of children) {
    children.set(source, [...childIds].sort(compareNodeIds));
  }

  const depthByNode = new Map<string, number>([[rootId, 0]]);
  const yByNode = new Map<string, number>();
  let nextLeafY = 0;

  const assignTree = (nodeId: string, depth: number): number => {
    depthByNode.set(nodeId, depth);
    const childIds = children.get(nodeId) ?? [];

    if (childIds.length === 0) {
      const y = nextLeafY;
      yByNode.set(nodeId, y);
      nextLeafY += VERTICAL_GAP;
      return y;
    }

    const childYValues = childIds.map((childId) => assignTree(childId, depth + 1));
    const minY = childYValues[0] ?? 0;
    const maxY = childYValues[childYValues.length - 1] ?? minY;
    const centeredY = (minY + maxY) / 2;
    yByNode.set(nodeId, centeredY);
    return centeredY;
  };

  assignTree(rootId, 0);

  for (const node of nodes) {
    if (!yByNode.has(node.id)) {
      yByNode.set(node.id, nextLeafY);
      nextLeafY += VERTICAL_GAP;
      if (!depthByNode.has(node.id)) {
        depthByNode.set(node.id, 1);
      }
    }
  }

  return nodes.map((node) => {
    const depth = depthByNode.get(node.id) ?? 1;
    const treePosition = {
      x: depth * HORIZONTAL_GAP,
      y: yByNode.get(node.id) ?? 0
    };

    const position =
      layoutMode === 'horizontal'
        ? treePosition
        : {
            x: treePosition.y,
            y: treePosition.x
          };

    return {
      ...node,
      position
    };
  });
}

export function toReactFlowNodes(nodes: GraphNode[], layoutMode: LayoutMode, themeMode: ThemeMode): Node[] {
  const isDark = themeMode === 'dark';

  return nodes.map((node) => {
    const horizontalHandles = {
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
    const verticalHandles = {
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top
    };
    const handlePositions = layoutMode === 'horizontal' ? horizontalHandles : verticalHandles;

    if (node.type === 'repo') {
      return {
        id: node.id,
        type: 'input',
        position: node.position,
        data: {
          label: node.data.label
        },
        style: {
          borderRadius: 12,
          border: `2px solid ${isDark ? '#14b8a6' : '#0f766e'}`,
          background: isDark ? '#115e59' : '#ccfbf1',
          color: isDark ? '#f0fdfa' : '#042f2e',
          fontWeight: 700,
          width: REPO_NODE_WIDTH,
          height: NODE_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'normal',
          lineHeight: 1.25,
          textAlign: 'center',
          wordBreak: 'break-word',
          overflow: 'hidden',
          padding: '0 12px',
          boxShadow: isDark ? '0 14px 26px rgba(2, 6, 23, 0.45)' : '0 10px 24px rgba(15, 23, 42, 0.08)'
        },
        ...handlePositions
      };
    }

    const pr = node.data;
    const isOpen = pr.state === 'open';

    return {
      id: node.id,
      position: node.position,
      data: {
        label: `#${pr.number} ${pr.title}`
      },
      style: {
        borderRadius: 10,
        border: `1px solid ${isOpen ? (isDark ? '#16a34a' : '#15803d') : isDark ? '#475569' : '#9ca3af'}`,
        background: isOpen ? (isDark ? '#052e16' : '#f0fdf4') : isDark ? '#0f172a' : '#f8fafc',
        color: isDark ? '#e2e8f0' : '#0f172a',
        width: PR_NODE_WIDTH,
        height: NODE_HEIGHT,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        whiteSpace: 'normal',
        lineHeight: 1.25,
        wordBreak: 'break-word',
        overflow: 'hidden',
        boxShadow: isDark ? '0 14px 26px rgba(2, 6, 23, 0.45)' : '0 10px 24px rgba(15, 23, 42, 0.08)'
      },
      ...handlePositions
    };
  });
}

export function toReactFlowEdges(edges: GraphResponse['edges'], themeMode: ThemeMode): Edge[] {
  const strokeColor = themeMode === 'dark' ? '#475569' : '#64748b';

  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'straight',
    animated: false,
    style: {
      stroke: strokeColor,
      strokeWidth: 1.4
    }
  }));
}

export function getMiniMapNodeColor(node: Node, themeMode: ThemeMode): string {
  const isDark = themeMode === 'dark';

  if (node.id.startsWith('repo:')) {
    return isDark ? '#14b8a6' : '#0f766e';
  }

  if (node.id.startsWith('pr:')) {
    return isDark ? '#38bdf8' : '#0369a1';
  }

  return isDark ? '#64748b' : '#94a3b8';
}

export function getMiniMapNodeStrokeColor(node: Node, themeMode: ThemeMode): string {
  const isDark = themeMode === 'dark';

  if (node.id.startsWith('repo:')) {
    return isDark ? '#99f6e4' : '#0f766e';
  }

  if (node.id.startsWith('pr:')) {
    return isDark ? '#7dd3fc' : '#075985';
  }

  return isDark ? '#94a3b8' : '#64748b';
}
