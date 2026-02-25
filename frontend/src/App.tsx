import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeMouseHandler
} from '@xyflow/react';

import { HeaderControls } from './components/HeaderControls';
import { InitialStatePanel } from './components/InitialStatePanel';
import { SelectedNodePanel } from './components/SelectedNodePanel';
import {
  filterGraphByFocusedPr,
  getMiniMapNodeColor,
  getMiniMapNodeStrokeColor,
  positionGraph,
  toReactFlowEdges,
  toReactFlowNodes,
  type LayoutMode,
  type ThemeMode
} from './lib/graphView';
import { buildRepoPath, findFocusedNodeId, focusParamFromNode, parseRepo } from './lib/routeState';
import { getInitialTheme, THEME_STORAGE_KEY } from './lib/theme';
import type { GraphNode, GraphResponse } from './types';

const EXAMPLE_REPOS = ['facebook/react', 'oven-sh/bun', 'vercel/next.js', 'microsoft/TypeScript'];

interface AppProps {
  routeRepo: string | null;
  routeFocus: string | null;
  navigateToRepo: (repo: string, focus?: string | null) => void;
}

function resetGraphState(
  setRawNodes: (nodes: GraphNode[]) => void,
  setRawEdges: (edges: GraphResponse['edges']) => void,
  setPullCount: (count: number) => void,
  setSelectedNodeId: (nodeId: string | null) => void,
  setFocusedPrId: (nodeId: string | null) => void,
  setPendingFitNodeId: (nodeId: string | null) => void,
  setPendingFitGraph: (value: boolean) => void
): void {
  setRawNodes([]);
  setRawEdges([]);
  setPullCount(0);
  setSelectedNodeId(null);
  setFocusedPrId(null);
  setPendingFitNodeId(null);
  setPendingFitGraph(false);
}

export default function App({ routeRepo, routeFocus, navigateToRepo }: AppProps) {
  const reactFlow = useReactFlow();
  const requestIdRef = useRef(0);

  const [repo, setRepo] = useState(routeRepo ?? '');
  const [exampleRepo, setExampleRepo] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedGraph, setHasLoadedGraph] = useState(false);
  const [pullCount, setPullCount] = useState(0);
  const [loadedRepo, setLoadedRepo] = useState<string | null>(routeRepo);
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

  const nodeById = useMemo(() => new Map(rawNodes.map((node) => [node.id, node])), [rawNodes]);
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : undefined;
  const rootNodeId = useMemo(() => rawNodes.find((node) => node.type === 'repo')?.id ?? null, [rawNodes]);

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

  const activeRepo = loadedRepo ?? routeRepo ?? null;

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

  const loadGraph = useCallback(
    async (targetRepo: string, targetState: 'open' | 'closed' | 'all') => {
      const normalizedRepo = targetRepo.trim();
      if (!normalizedRepo) {
        setError('Enter a repository in owner/repo format and press Go.');
        return;
      }

      setLoading(true);
      setError(null);
      const requestId = ++requestIdRef.current;

      try {
        const query = new URLSearchParams({ repo: normalizedRepo, state: targetState });
        const response = await fetch(`/api/graph?${query.toString()}`);
        const payload = (await response.json()) as GraphResponse | { error: string };

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          throw new Error('error' in payload ? payload.error : 'Failed to load graph.');
        }

        const graph = payload as GraphResponse;
        setLoadedRepo(graph.repo);
        setRepo(graph.repo);
        setRawNodes(graph.nodes);
        setRawEdges(graph.edges);
        setPullCount(graph.pullCount);
        setSelectedNodeId(null);
        setFocusedPrId(null);
        setPendingFitNodeId(null);
        setPendingFitGraph(true);
        setHasLoadedGraph(true);
      } catch (fetchError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message = fetchError instanceof Error ? fetchError.message : 'Unknown error while loading graph.';
        setError(message);
        setLoadedRepo(null);
        resetGraphState(
          setRawNodes,
          setRawEdges,
          setPullCount,
          setSelectedNodeId,
          setFocusedPrId,
          setPendingFitNodeId,
          setPendingFitGraph
        );
        setHasLoadedGraph(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!routeRepo) {
      return;
    }

    setRepo(routeRepo);
    void loadGraph(routeRepo, stateFilter);
  }, [loadGraph, routeRepo, stateFilter]);

  useEffect(() => {
    if (!routeRepo) {
      requestIdRef.current += 1;
      setRepo('');
      setLoadedRepo(null);
      setError(null);
      setHasLoadedGraph(false);
      resetGraphState(
        setRawNodes,
        setRawEdges,
        setPullCount,
        setSelectedNodeId,
        setFocusedPrId,
        setPendingFitNodeId,
        setPendingFitGraph
      );
    }
  }, [routeRepo]);

  useEffect(() => {
    const focusNodeId = findFocusedNodeId(rawNodes, routeFocus);

    if (!focusNodeId) {
      if (focusedPrId) {
        setFocusedPrId(null);
        setPendingFitNodeId(null);
        setPendingFitGraph(true);
      }
      return;
    }

    if (focusedPrId !== focusNodeId) {
      setSelectedNodeId(focusNodeId);
      setFocusedPrId(focusNodeId);
      setPendingFitNodeId(null);
      setPendingFitGraph(true);
    }
  }, [focusedPrId, rawNodes, routeFocus]);

  const onNodeClick = useCallback<NodeMouseHandler>((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const focusNodeById = useCallback(
    (nodeId: string, syncRoute: boolean) => {
      const node = nodeById.get(nodeId);
      if (!node) {
        return;
      }

      setSelectedNodeId(nodeId);

      if (node.type === 'pr') {
        setFocusedPrId(nodeId);
        setPendingFitNodeId(null);
        setPendingFitGraph(true);

        if (syncRoute && activeRepo) {
          const nextFocus = focusParamFromNode(node);
          navigateToRepo(activeRepo, nextFocus);
        }

        return;
      }

      setFocusedPrId(null);
      setPendingFitNodeId(nodeId);
      setPendingFitGraph(false);

      if (syncRoute && activeRepo) {
        navigateToRepo(activeRepo);
      }
    },
    [activeRepo, navigateToRepo, nodeById]
  );

  const onNodeDoubleClick = useCallback<NodeMouseHandler>(
    (_event, node) => {
      focusNodeById(node.id, true);
    },
    [focusNodeById]
  );

  const goToRepo = useCallback(
    (repoOverride?: string) => {
      const normalizedRepo = (repoOverride ?? repo).trim();
      if (!normalizedRepo) {
        setError('Enter a repository in owner/repo format and press Go.');
        return;
      }

      const parsedRepo = parseRepo(normalizedRepo);
      const path = buildRepoPath(normalizedRepo);
      if (!parsedRepo || !path) {
        setError('Enter a repository in owner/repo format and press Go.');
        return;
      }

      setError(null);
      const sameRoute = routeRepo === normalizedRepo && !routeFocus;
      if (sameRoute) {
        void loadGraph(normalizedRepo, stateFilter);
        return;
      }

      navigateToRepo(normalizedRepo);
    },
    [loadGraph, navigateToRepo, repo, routeFocus, routeRepo, stateFilter]
  );

  const onExampleSelect = useCallback(
    (value: string) => {
      setExampleRepo(value);
      if (!value) {
        return;
      }

      setRepo(value);
      goToRepo(value);
    },
    [goToRepo]
  );

  const onLayoutModeChange = useCallback((nextLayout: LayoutMode) => {
    setLayoutMode(nextLayout);
    setPendingFitNodeId(null);
    setPendingFitGraph(true);
  }, []);

  const focusSelected = useCallback(() => {
    if (!selectedNode?.id) {
      return;
    }

    focusNodeById(selectedNode.id, true);
  }, [focusNodeById, selectedNode]);

  const openSelectedPullRequest = useCallback(() => {
    if (!selectedNode || selectedNode.type !== 'pr') {
      return;
    }

    window.open(selectedNode.data.url, '_blank', 'noopener,noreferrer');
  }, [selectedNode]);

  const focusRoot = useCallback(() => {
    if (!rootNodeId) {
      return;
    }

    setSelectedNodeId(rootNodeId);
    setFocusedPrId(null);
    setPendingFitNodeId(rootNodeId);
    setPendingFitGraph(false);

    if (activeRepo) {
      navigateToRepo(activeRepo);
    }
  }, [activeRepo, navigateToRepo, rootNodeId]);

  const unfocusGraph = useCallback(() => {
    if (!focusedPrId) {
      return;
    }

    setFocusedPrId(null);
    setPendingFitNodeId(null);
    setPendingFitGraph(true);

    if (activeRepo) {
      navigateToRepo(activeRepo);
    }
  }, [activeRepo, focusedPrId, navigateToRepo]);

  const showSidebar = Boolean(selectedNode);
  const showInitialState = !routeRepo && !hasLoadedGraph && !loading && rawNodes.length === 0;
  const focusedLabel = focusedPr ? `Focusing #${focusedPr.data.number} ${focusedPr.data.title}` : null;

  return (
    <div className="grid h-full grid-rows-[auto_1fr] bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_42%,_#e2e8f0_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#0b1120_42%,_#020617_100%)] dark:text-slate-100">
      <HeaderControls
        repo={repo}
        pullCount={pullCount}
        focusedLabel={focusedLabel}
        loading={loading}
        error={error}
        themeMode={themeMode}
        stateFilter={stateFilter}
        layoutMode={layoutMode}
        hasRoot={Boolean(rootNodeId)}
        hasFocusedPr={Boolean(focusedPr)}
        onRepoChange={setRepo}
        onStateFilterChange={setStateFilter}
        onLayoutModeChange={onLayoutModeChange}
        onGo={() => goToRepo()}
        onToggleTheme={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onFocusRoot={focusRoot}
        onUnfocus={unfocusGraph}
      />

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
            <InitialStatePanel
              exampleRepo={exampleRepo}
              exampleRepos={EXAMPLE_REPOS}
              loading={loading}
              onExampleSelect={onExampleSelect}
            />
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

        {selectedNode ? (
          <SelectedNodePanel
            selectedNode={selectedNode}
            onFocusSelected={focusSelected}
            onOpenPullRequest={openSelectedPullRequest}
          />
        ) : null}
      </main>
    </div>
  );
}
