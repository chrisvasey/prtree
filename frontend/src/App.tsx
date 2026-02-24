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

type LayoutMode = 'horizontal' | 'vertical';
type ThemeMode = 'light' | 'dark';

const EXAMPLE_REPOS = ['facebook/react', 'oven-sh/bun', 'vercel/next.js', 'microsoft/TypeScript'];
const HORIZONTAL_GAP = 430;
const VERTICAL_GAP = 170;
const REPO_NODE_WIDTH = 280;
const PR_NODE_WIDTH = 360;
const NODE_HEIGHT = 72;
const THEME_STORAGE_KEY = 'prtree-theme';

const labelClass = 'grid gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300';
const inputClass =
  'h-9 min-w-[220px] rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/25';
const selectClass =
  'h-9 min-w-[130px] rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/25';
const primaryButtonClass =
  'h-9 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500';
const secondaryButtonClass =
  'h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

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

function toReactFlowNodes(nodes: GraphNode[], layoutMode: LayoutMode, themeMode: ThemeMode): Node[] {
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

function toReactFlowEdges(edges: GraphResponse['edges'], themeMode: ThemeMode): Edge[] {
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

function getMiniMapNodeColor(node: Node, themeMode: ThemeMode): string {
  const isDark = themeMode === 'dark';

  if (node.id.startsWith('repo:')) {
    return isDark ? '#14b8a6' : '#0f766e';
  }

  if (node.id.startsWith('pr:')) {
    return isDark ? '#38bdf8' : '#0369a1';
  }

  return isDark ? '#64748b' : '#94a3b8';
}

function getMiniMapNodeStrokeColor(node: Node, themeMode: ThemeMode): string {
  const isDark = themeMode === 'dark';

  if (node.id.startsWith('repo:')) {
    return isDark ? '#99f6e4' : '#0f766e';
  }

  if (node.id.startsWith('pr:')) {
    return isDark ? '#7dd3fc' : '#075985';
  }

  return isDark ? '#94a3b8' : '#64748b';
}

export default function App() {
  const reactFlow = useReactFlow();

  const [repo, setRepo] = useState('');
  const [exampleRepo, setExampleRepo] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
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
  const isDarkTheme = themeMode === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.style.colorScheme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const nodeById = useMemo(() => {
    return new Map(rawNodes.map((node) => [node.id, node]));
  }, [rawNodes]);

  const selected = selectedNodeId ? nodeById.get(selectedNodeId) : undefined;
  const showSidebar = Boolean(selected);
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

    setNodes(toReactFlowNodes(positionedNodes, layoutMode, themeMode));
    setEdges(toReactFlowEdges(visibleGraph.edges, themeMode));

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
  }, [
    layoutMode,
    pendingFitGraph,
    pendingFitNodeId,
    positionedNodes,
    reactFlow,
    setEdges,
    setNodes,
    themeMode,
    visibleGraph.edges
  ]);

  const loadGraph = useCallback(async (repoOverride?: string) => {
    const normalizedRepo = (repoOverride ?? repo).trim();
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

  const focusNodeById = useCallback(
    (nodeId: string) => {
      const node = nodeById.get(nodeId);
      if (!node) {
        return;
      }

      setSelectedNodeId(nodeId);

      if (node.type === 'pr') {
        setFocusedPrId(nodeId);
        setPendingFitNodeId(null);
        setPendingFitGraph(true);
        return;
      }

      setFocusedPrId(null);
      setPendingFitNodeId(nodeId);
      setPendingFitGraph(false);
    },
    [nodeById]
  );

  const onNodeDoubleClick = useCallback<NodeMouseHandler>(
    (_event, node) => {
      focusNodeById(node.id);
    },
    [focusNodeById]
  );

  const focusSelected = useCallback(() => {
    if (!selected?.id) {
      return;
    }
    focusNodeById(selected.id);
  }, [focusNodeById, selected]);

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
    <div className="grid h-full grid-rows-[auto_1fr] bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_42%,_#e2e8f0_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#0b1120_42%,_#020617_100%)] dark:text-slate-100">
      <header className="flex flex-col gap-2.5 border-b border-sky-100/80 bg-slate-50/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 text-xl font-semibold tracking-tight">prtree</h1>
          <button
            className={secondaryButtonClass}
            onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className={labelClass}>
            <span>Repo</span>
            <input
              className={inputClass}
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="owner/repo"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <label className={labelClass}>
            <span>State</span>
            <select
              className={selectClass}
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value as 'open' | 'closed' | 'all')}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
          </label>

          <label className={labelClass}>
            <span>Layout</span>
            <select
              className={selectClass}
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

          <button className={primaryButtonClass} onClick={() => void loadGraph()} disabled={loading}>
            {loading ? 'Loading...' : 'Go'}
          </button>
          <button className={secondaryButtonClass} onClick={focusRoot} disabled={!rootNodeId}>
            Focus Root
          </button>
          {focusedPr ? (
            <button className={secondaryButtonClass} onClick={unfocusGraph}>
              Unfocus
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <span>{pullCount} pull requests</span>
          {focusedPr ? (
            <span>
              Focusing #{focusedPr.data.number} {focusedPr.data.title}
            </span>
          ) : null}
          {error ? <span className="font-medium text-rose-700 dark:text-rose-400">{error}</span> : null}
        </div>
      </header>

      <main className={`grid min-h-0 ${showSidebar ? 'grid-cols-1 lg:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>
        <section className="relative min-h-0">
          {loading ? (
            <div
              className="absolute inset-4 z-20 flex items-center justify-center rounded-xl border border-slate-300/70 bg-white/70 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/70"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3 rounded-lg bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-200">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-600 dark:border-t-teal-400" />
                Loading {repo.trim() || 'repository'}...
              </div>
            </div>
          ) : null}

          {showInitialState ? (
            <div className="absolute inset-4 z-10 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-400/70 bg-white/75 px-6 py-8 text-center backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/75">
              <h2 className="m-0 text-4xl font-semibold tracking-tight sm:text-5xl">Choose a Repository</h2>
              <p className="m-0 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                Enter an <span className="font-mono text-base">owner/repo</span>, pick an example, or type your own.
              </p>
              <label className="grid w-full max-w-[520px] gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Examples</span>
                <select
                  className={`${selectClass} h-11 w-full min-w-0 text-base`}
                  value={exampleRepo}
                  disabled={loading}
                  onChange={(event) => {
                    const value = event.target.value;
                    setExampleRepo(value);
                    if (value) {
                      setRepo(value);
                      void loadGraph(value);
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
            className="bg-white/30 dark:bg-slate-950/30"
            colorMode={themeMode}
            minZoom={0.1}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            fitView
          >
            <MiniMap
              pannable
              zoomable
              bgColor={isDarkTheme ? '#020617' : '#f8fafc'}
              maskColor={isDarkTheme ? 'rgba(15, 23, 42, 0.58)' : 'rgba(226, 232, 240, 0.7)'}
              maskStrokeColor={isDarkTheme ? '#334155' : '#94a3b8'}
              maskStrokeWidth={1}
              nodeColor={(node) => getMiniMapNodeColor(node, themeMode)}
              nodeStrokeColor={(node) => getMiniMapNodeStrokeColor(node, themeMode)}
              nodeStrokeWidth={2}
            />
            <Controls />
            <Background
              variant={BackgroundVariant.Dots}
              size={1.2}
              gap={22}
              color={isDarkTheme ? '#334155' : '#cbd5e1'}
            />
          </ReactFlow>
        </section>

        {selected ? (
          <aside className="overflow-y-auto border-t border-slate-300/80 bg-white/85 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/70 lg:border-t-0 lg:border-l">
            {selected.type === 'repo' ? (
            <div>
              <h2 className="m-0 mb-3 text-lg font-semibold">{selected.data.label}</h2>
              <button className={primaryButtonClass} onClick={focusSelected}>
                Focus Node
              </button>
            </div>
          ) : (
            <div>
              <h2 className="m-0 mb-3 text-lg font-semibold">
                #{selected.data.number} {selected.data.title}
              </h2>
              <p className="mb-2 text-sm">
                <strong className="font-semibold">State:</strong> {selected.data.state}
              </p>
              <p className="mb-2 text-sm">
                <strong className="font-semibold">Head:</strong> {selected.data.headRef}
              </p>
              <p className="mb-4 text-sm">
                <strong className="font-semibold">Base:</strong> {selected.data.baseRef}
              </p>
              <div className="flex gap-2.5">
                <button className={primaryButtonClass} onClick={focusSelected}>
                  Focus PR
                </button>
                <button className={secondaryButtonClass} onClick={openSelectedPullRequest}>
                  Open PR
                </button>
              </div>
            </div>
            )}
          </aside>
        ) : null}
      </main>
    </div>
  );
}
