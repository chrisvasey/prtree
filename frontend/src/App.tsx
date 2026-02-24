import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler
} from '@xyflow/react';

import type { GraphNode, GraphResponse } from './types';
import './styles.css';

type LayoutMode = 'horizontal' | 'vertical';
const EXAMPLE_REPOS = ['facebook/react', 'oven-sh/bun', 'vercel/next.js', 'microsoft/TypeScript'];
const HORIZONTAL_GAP = 430;
const VERTICAL_GAP = 170;
const REPO_NODE_WIDTH = 280;
const PR_NODE_WIDTH = 360;
const NODE_HEIGHT = 72;

function filterGraphByFocusedPr(
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

function positionGraph(nodes: GraphNode[], edges: GraphResponse['edges'], layoutMode: LayoutMode): GraphNode[] {
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

  // Place disconnected nodes after the main tree.
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

function toReactFlowNodes(nodes: GraphNode[], layoutMode: LayoutMode): Node[] {
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
          border: '2px solid #0f766e',
          background: '#ccfbf1',
          color: '#042f2e',
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
          padding: '0 12px'
        },
        ...handlePositions
      };
    }

    const pr = node.data;

    return {
      id: node.id,
      position: node.position,
      data: {
        label: `#${pr.number} ${pr.title}`
      },
      style: {
        borderRadius: 10,
        border: `1px solid ${pr.state === 'open' ? '#15803d' : '#9ca3af'}`,
        background: pr.state === 'open' ? '#f0fdf4' : '#f8fafc',
        color: '#0f172a',
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
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)'
      },
      ...handlePositions
    };
  });
}

function toReactFlowEdges(edges: GraphResponse['edges']): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'straight',
    animated: false,
    style: {
      stroke: '#64748b',
      strokeWidth: 1.4
    }
  }));
}

export default function App() {
  const reactFlow = useReactFlow();

  const [repo, setRepo] = useState('');
  const [exampleRepo, setExampleRepo] = useState('');
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedGraph, setHasLoadedGraph] = useState(false);
  const [pullCount, setPullCount] = useState(0);
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);
  const [rawEdges, setRawEdges] = useState<GraphResponse['edges']>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusedPrId, setFocusedPrId] = useState<string | null>(null);
  const [pendingFitGraph, setPendingFitGraph] = useState(false);
  const [pendingFitNodeId, setPendingFitNodeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeById = useMemo(() => {
    return new Map(rawNodes.map((node) => [node.id, node]));
  }, [rawNodes]);

  const selected = selectedNodeId ? nodeById.get(selectedNodeId) : undefined;
  const rootNodeId = useMemo(() => rawNodes.find((node) => node.type === 'repo')?.id ?? null, [rawNodes]);
  const showInitialState = !hasLoadedGraph && !loading && rawNodes.length === 0;
  const focusedPr = useMemo(() => {
    if (!focusedPrId) {
      return null;
    }
    const node = rawNodes.find((candidate) => candidate.id === focusedPrId && candidate.type === 'pr');
    return node?.type === 'pr' ? node : null;
  }, [focusedPrId, rawNodes]);
  const visibleGraph = useMemo(
    () => filterGraphByFocusedPr(rawNodes, rawEdges, focusedPrId),
    [focusedPrId, rawEdges, rawNodes]
  );
  const positionedNodes = useMemo(
    () => positionGraph(visibleGraph.nodes, visibleGraph.edges, layoutMode),
    [layoutMode, visibleGraph.edges, visibleGraph.nodes]
  );

  useEffect(() => {
    if (positionedNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    setNodes(toReactFlowNodes(positionedNodes, layoutMode));
    setEdges(toReactFlowEdges(visibleGraph.edges));

    requestAnimationFrame(() => {
      if (pendingFitNodeId) {
        const targetNode = reactFlow.getNode(pendingFitNodeId);
        if (targetNode) {
          reactFlow.fitView({
            nodes: [targetNode],
            duration: 380,
            padding: 0.8,
            maxZoom: 1.3
          });
        }
        setPendingFitNodeId(null);
        setPendingFitGraph(false);
        return;
      }

      if (pendingFitGraph) {
        reactFlow.fitView({ padding: 0.24, duration: 350 });
        setPendingFitGraph(false);
      }
    });
  }, [layoutMode, pendingFitGraph, pendingFitNodeId, positionedNodes, reactFlow, setEdges, setNodes, visibleGraph.edges]);

  const loadGraph = useCallback(async () => {
    const normalizedRepo = repo.trim();
    if (!normalizedRepo) {
      setError('Enter a repository in owner/repo format and press Go.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ repo: normalizedRepo, state: stateFilter });
      const response = await fetch(`/api/graph?${query.toString()}`);
      const payload = (await response.json()) as GraphResponse | { error: string };

      if (!response.ok) {
        throw new Error('error' in payload ? payload.error : 'Failed to load graph.');
      }

      const graph = payload as GraphResponse;
      setRawNodes(graph.nodes);
      setRawEdges(graph.edges);
      setPullCount(graph.pullCount);
      setSelectedNodeId(null);
      setFocusedPrId(null);
      setPendingFitNodeId(null);
      setPendingFitGraph(true);
      setHasLoadedGraph(true);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unknown error while loading graph.';
      setError(message);
      setRawNodes([]);
      setRawEdges([]);
      setPullCount(0);
      setSelectedNodeId(null);
      setFocusedPrId(null);
      setPendingFitNodeId(null);
      setPendingFitGraph(false);
      setHasLoadedGraph(true);
    } finally {
      setLoading(false);
    }
  }, [repo, stateFilter]);

  const onNodeClick = useCallback<NodeMouseHandler>((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const focusSelected = useCallback(() => {
    if (!selected) {
      return;
    }

    if (selected.type === 'pr') {
      setFocusedPrId(selected.id);
      setPendingFitNodeId(null);
      setPendingFitGraph(true);
      return;
    }

    setFocusedPrId(null);
    setPendingFitNodeId(selected.id);
    setPendingFitGraph(false);
  }, [selected]);

  const openSelectedPullRequest = useCallback(() => {
    if (!selected || selected.type !== 'pr') {
      return;
    }

    const pullRequest = selected.data;
    window.open(pullRequest.url, '_blank', 'noopener,noreferrer');
  }, [selected]);

  const focusRoot = useCallback(() => {
    if (!rootNodeId) {
      return;
    }

    setSelectedNodeId(rootNodeId);
    setFocusedPrId(null);
    setPendingFitNodeId(rootNodeId);
    setPendingFitGraph(false);
  }, [rootNodeId]);

  const unfocusGraph = useCallback(() => {
    if (!focusedPrId) {
      return;
    }

    setFocusedPrId(null);
    setPendingFitNodeId(null);
    setPendingFitGraph(true);
  }, [focusedPrId]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>prtree</h1>
        <div className="controls-row">
          <label>
            Repo
            <input
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="owner/repo"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <label>
            State
            <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as 'open' | 'closed' | 'all')}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
          </label>
          <label>
            Layout
            <select
              value={layoutMode}
              onChange={(event) => {
                setLayoutMode(event.target.value as LayoutMode);
                setPendingFitNodeId(null);
                setPendingFitGraph(true);
              }}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
          <button onClick={() => void loadGraph()} disabled={loading}>
            {loading ? 'Loading...' : 'Go'}
          </button>
          <button onClick={focusRoot} disabled={!rootNodeId}>
            Focus Root
          </button>
          {focusedPr ? <button onClick={unfocusGraph}>Unfocus</button> : null}
        </div>
        <div className="meta-row">
          <span>{pullCount} pull requests</span>
          {focusedPr ? <span>Focusing #{focusedPr.data.number} {focusedPr.data.title}</span> : null}
          {error ? <span className="error">{error}</span> : null}
        </div>
      </header>

      <main className="canvas-layout">
        <section className="flow-panel">
          {showInitialState ? (
            <div className="initial-state">
              <h2>Choose a Repository</h2>
              <p>Enter an `owner/repo`, pick an example, then press Go.</p>
              <label className="initial-state-example">
                Examples
                <select
                  value={exampleRepo}
                  onChange={(event) => {
                    const value = event.target.value;
                    setExampleRepo(value);
                    if (value) {
                      setRepo(value);
                    }
                  }}
                >
                  <option value="">Select example...</option>
                  {EXAMPLE_REPOS.map((example) => (
                    <option key={example} value={example}>
                      {example}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          >
            <MiniMap pannable zoomable />
            <Controls />
            <Background variant={BackgroundVariant.Dots} size={1.2} gap={22} color="#d1d5db" />
          </ReactFlow>
        </section>

        <aside className="side-panel">
          {!selected ? (
            <div className="empty-state">Select a node to focus it or open its PR.</div>
          ) : selected.type === 'repo' ? (
            <div>
              <h2>{selected.data.label}</h2>
              <button onClick={focusSelected}>Focus Node</button>
            </div>
          ) : (
            <div>
              <h2>
                #{selected.data.number} {selected.data.title}
              </h2>
              <p>
                <strong>State:</strong> {selected.data.state}
              </p>
              <p>
                <strong>Head:</strong> {selected.data.headRef}
              </p>
              <p>
                <strong>Base:</strong> {selected.data.baseRef}
              </p>
              <div className="side-actions">
                <button onClick={focusSelected}>Focus PR</button>
                <button onClick={openSelectedPullRequest}>Open PR</button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
