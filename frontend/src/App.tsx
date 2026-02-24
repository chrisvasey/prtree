import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
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

const DEFAULT_REPO = 'facebook/react';
type LayoutMode = 'horizontal' | 'vertical';

function applyLayout(nodes: GraphNode[], layoutMode: LayoutMode): GraphNode[] {
  if (layoutMode === 'horizontal') {
    return nodes;
  }

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.y,
      y: node.position.x
    }
  }));
}

function toReactFlowNodes(nodes: GraphNode[]): Node[] {
  return nodes.map((node) => {
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
          width: 260
        }
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
        width: 300,
        padding: '10px 12px',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)'
      }
    };
  });
}

function toReactFlowEdges(edges: GraphResponse['edges']): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: false,
    style: {
      stroke: '#64748b',
      strokeWidth: 1.4
    }
  }));
}

export default function App() {
  const reactFlow = useReactFlow();

  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pullCount, setPullCount] = useState(0);
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeById = useMemo(() => {
    return new Map(rawNodes.map((node) => [node.id, node]));
  }, [rawNodes]);

  const selected = selectedNodeId ? nodeById.get(selectedNodeId) : undefined;
  const rootNodeId = useMemo(() => rawNodes.find((node) => node.type === 'repo')?.id ?? null, [rawNodes]);

  useEffect(() => {
    if (rawNodes.length === 0) {
      setNodes([]);
      return;
    }

    setNodes(toReactFlowNodes(applyLayout(rawNodes, layoutMode)));

    requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.24, duration: 350 });
    });
  }, [layoutMode, rawNodes, reactFlow, setNodes]);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ repo: repo.trim(), state: stateFilter });
      const response = await fetch(`/api/graph?${query.toString()}`);
      const payload = (await response.json()) as GraphResponse | { error: string };

      if (!response.ok) {
        throw new Error('error' in payload ? payload.error : 'Failed to load graph.');
      }

      const graph = payload as GraphResponse;
      setRawNodes(graph.nodes);
      setPullCount(graph.pullCount);
      setSelectedNodeId(null);
      setEdges(toReactFlowEdges(graph.edges));
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unknown error while loading graph.';
      setError(message);
      setNodes([]);
      setEdges([]);
      setRawNodes([]);
      setPullCount(0);
      setSelectedNodeId(null);
    } finally {
      setLoading(false);
    }
  }, [repo, stateFilter, setEdges, setNodes]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  const onNodeClick = useCallback<NodeMouseHandler>((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const focusSelected = useCallback(() => {
    if (!selected) {
      return;
    }

    const node = reactFlow.getNode(selected.id);
    if (!node) {
      return;
    }

    reactFlow.fitView({
      nodes: [node],
      duration: 380,
      padding: 0.8,
      maxZoom: 1.3
    });
  }, [reactFlow, selected]);

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

    const node = reactFlow.getNode(rootNodeId);
    if (!node) {
      return;
    }

    setSelectedNodeId(rootNodeId);
    reactFlow.fitView({
      nodes: [node],
      duration: 380,
      padding: 0.8,
      maxZoom: 1.3
    });
  }, [reactFlow, rootNodeId]);

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
            <select value={layoutMode} onChange={(event) => setLayoutMode(event.target.value as LayoutMode)}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
          <button onClick={() => void loadGraph()} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={focusRoot} disabled={!rootNodeId}>
            Focus Root
          </button>
        </div>
        <div className="meta-row">
          <span>{pullCount} pull requests</span>
          {error ? <span className="error">{error}</span> : null}
        </div>
      </header>

      <main className="canvas-layout">
        <section className="flow-panel">
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
