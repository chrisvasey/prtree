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
import type { AuthUser } from './lib/auth';
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
const MIN_AUTO_FIT_ZOOM = 0.62;

interface AppProps {
  routeRepo: string | null;
  routeFocus: string | null;
  navigateToRepo: (repo: string, focus?: string | null) => void;
  user: AuthUser;
  onLogout: () => Promise<void>;
}

interface LoadGraphOptions {
  preserveSelectedNodeId?: string | null;
  preserveFocusedPrId?: string | null;
  routeFocusParam?: string | null;
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

export default function App({ routeRepo, routeFocus, navigateToRepo, user, onLogout }: AppProps) {
  const reactFlow = useReactFlow();
  const requestIdRef = useRef(0);
  const fitRafRef = useRef<number | null>(null);
  const fitRetryRafRef = useRef<number | null>(null);

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
  const [loadedStateFilter, setLoadedStateFilter] = useState<'open' | 'closed' | 'all' | null>(null);
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
  const rootNode = useMemo(() => rawNodes.find((node) => node.type === 'repo') ?? null, [rawNodes]);
  const rootNodeId = rootNode?.id ?? null;

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

  const visiblePrOptions = useMemo(
    () =>
      visibleGraph.nodes
        .filter((node): node is GraphNode & { type: 'pr' } => node.type === 'pr')
        .sort((left, right) => left.data.number - right.data.number)
        .map((node) => ({
          id: node.id,
          label: `#${node.data.number} ${node.data.title}`
        })),
    [visibleGraph.nodes]
  );

  const positionedNodes = useMemo(
    () => positionGraph(visibleGraph.nodes, visibleGraph.edges, layoutMode),
    [layoutMode, visibleGraph.edges, visibleGraph.nodes]
  );

  const activeRepo = loadedRepo ?? routeRepo ?? null;

  const focusedLabel = useMemo(() => {
    if (focusedPr) {
      return `Focusing: PR #${focusedPr.data.number} ${focusedPr.data.title}`;
    }

    if (rootNode) {
      return `Focusing: Repo ${rootNode.data.label}`;
    }

    return null;
  }, [focusedPr, rootNode]);

  useEffect(() => {
    const trimmedRepo = repo.trim();
    const titleRepo = activeRepo ?? (trimmedRepo || null);

    if (loading) {
      document.title = titleRepo ? `Loading ${titleRepo} · prtree` : 'Loading · prtree';
      return;
    }

    if (focusedPr && titleRepo) {
      document.title = `Focusing: PR #${focusedPr.data.number} · ${titleRepo} · prtree`;
      return;
    }

    if (rootNode && titleRepo) {
      document.title = `Focusing: Repo · ${titleRepo} · prtree`;
      return;
    }

    if (titleRepo) {
      document.title = `${titleRepo} · prtree`;
      return;
    }

    document.title = 'prtree';
  }, [activeRepo, focusedPr, loading, repo, rootNode]);

  useEffect(() => {
    if (positionedNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    setNodes(toReactFlowNodes(positionedNodes, layoutMode, themeMode));
    setEdges(toReactFlowEdges(visibleGraph.edges, themeMode));

    if (fitRafRef.current !== null) {
      cancelAnimationFrame(fitRafRef.current);
      fitRafRef.current = null;
    }
    if (fitRetryRafRef.current !== null) {
      cancelAnimationFrame(fitRetryRafRef.current);
      fitRetryRafRef.current = null;
    }

    fitRafRef.current = requestAnimationFrame(() => {
      fitRafRef.current = null;

      const fitGraph = (): void => {
        const fitOptions = {
          padding: 0.24,
          duration: 350,
          minZoom: MIN_AUTO_FIT_ZOOM,
          maxZoom: 1
        };

        reactFlow.fitView(fitOptions);
        fitRetryRafRef.current = requestAnimationFrame(() => {
          fitRetryRafRef.current = null;
          if (!reactFlow.fitView(fitOptions)) {
            reactFlow.fitView(fitOptions);
          }
        });
      };

      if (pendingFitNodeId) {
        const targetNode = reactFlow.getNode(pendingFitNodeId);
        if (targetNode) {
          reactFlow.fitView({
            nodes: [targetNode],
            duration: 380,
            padding: 0.8,
            maxZoom: 1.3
          });
        } else {
          fitGraph();
        }

        setPendingFitNodeId(null);
        setPendingFitGraph(false);
        return;
      }

      if (pendingFitGraph) {
        fitGraph();
        setPendingFitGraph(false);
      }
    });

    return () => {
      if (fitRafRef.current !== null) {
        cancelAnimationFrame(fitRafRef.current);
        fitRafRef.current = null;
      }
      if (fitRetryRafRef.current !== null) {
        cancelAnimationFrame(fitRetryRafRef.current);
        fitRetryRafRef.current = null;
      }
    };
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
    async (targetRepo: string, targetState: 'open' | 'closed' | 'all', options?: LoadGraphOptions) => {
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

        if (response.status === 401) {
          window.location.href = '/auth/login';
          return;
        }

        if (!response.ok) {
          throw new Error('error' in payload ? payload.error : 'Failed to load graph.');
        }

        const graph = payload as GraphResponse;
        const preservedSelectedNodeId = options?.preserveSelectedNodeId ?? null;
        const preservedFocusedPrId = options?.preserveFocusedPrId ?? null;
        const routeFocusedNodeId = findFocusedNodeId(graph.nodes, options?.routeFocusParam ?? null);
        const hasPreservedSelectedNode = preservedSelectedNodeId
          ? graph.nodes.some((node) => node.id === preservedSelectedNodeId)
          : false;
        const hasPreservedFocusedPr = preservedFocusedPrId
          ? graph.nodes.some((node) => node.id === preservedFocusedPrId && node.type === 'pr')
          : false;
        const hasRouteFocusedPr = routeFocusedNodeId
          ? graph.nodes.some((node) => node.id === routeFocusedNodeId && node.type === 'pr')
          : false;
        const shouldFitRouteFocusedPr = Boolean(options?.routeFocusParam && hasRouteFocusedPr);
        const nextFocusedPrId = hasPreservedFocusedPr ? preservedFocusedPrId : routeFocusedNodeId;
        const nextSelectedNodeId = hasPreservedSelectedNode ? preservedSelectedNodeId : nextFocusedPrId;

        setLoadedRepo(graph.repo);
        setLoadedStateFilter(targetState);
        setRepo(graph.repo);
        setRawNodes(graph.nodes);
        setRawEdges(graph.edges);
        setPullCount(graph.pullCount);
        setSelectedNodeId(nextSelectedNodeId);
        setFocusedPrId(nextFocusedPrId);
        setPendingFitNodeId(shouldFitRouteFocusedPr ? routeFocusedNodeId : null);
        setPendingFitGraph(!shouldFitRouteFocusedPr);
        setHasLoadedGraph(true);
      } catch (fetchError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message = fetchError instanceof Error ? fetchError.message : 'Unknown error while loading graph.';
        setError(message);
        setLoadedRepo(null);
        setLoadedStateFilter(null);
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
    const needsReload = !hasLoadedGraph || loadedRepo !== routeRepo || loadedStateFilter !== stateFilter;
    if (!needsReload) {
      return;
    }

    void loadGraph(routeRepo, stateFilter, { routeFocusParam: routeFocus });
  }, [hasLoadedGraph, loadGraph, loadedRepo, loadedStateFilter, routeFocus, routeRepo, stateFilter]);

  useEffect(() => {
    if (!routeRepo) {
      requestIdRef.current += 1;
      setRepo('');
      setLoadedRepo(null);
      setLoadedStateFilter(null);
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
      setPendingFitNodeId(focusNodeId);
      setPendingFitGraph(false);
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

  const onPrSelectFromSearch = useCallback(
    (nodeId: string) => {
      focusNodeById(nodeId, true);
    },
    [focusNodeById]
  );

  const onRefresh = useCallback(() => {
    const targetRepo = (activeRepo ?? repo).trim();
    if (!targetRepo) {
      setError('Enter a repository in owner/repo format and press Go.');
      return;
    }

    void loadGraph(targetRepo, stateFilter, {
      preserveSelectedNodeId: selectedNodeId,
      preserveFocusedPrId: focusedPrId
    });
  }, [activeRepo, focusedPrId, loadGraph, repo, selectedNodeId, stateFilter]);

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
  const showGraphStatus = !loading && pullCount > 0;

  return (
    <div className="grid h-full grid-rows-[auto_1fr] bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_42%,_#e2e8f0_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#0b1120_42%,_#020617_100%)] dark:text-slate-100">
      <HeaderControls
        repo={repo}
        loading={loading}
        canRefresh={Boolean((activeRepo ?? repo).trim())}
        themeMode={themeMode}
        stateFilter={stateFilter}
        layoutMode={layoutMode}
        hasRoot={Boolean(rootNodeId)}
        hasFocusedPr={Boolean(focusedPr)}
        prSearchOptions={visiblePrOptions}
        onRepoChange={setRepo}
        onStateFilterChange={setStateFilter}
        onLayoutModeChange={onLayoutModeChange}
        onPrSelect={onPrSelectFromSearch}
        onGo={() => goToRepo()}
        onRefresh={onRefresh}
        onToggleTheme={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onFocusRoot={focusRoot}
        onUnfocus={unfocusGraph}
        user={user}
        onLogout={onLogout}
      />

      <main className={`relative grid min-h-0 ${showSidebar ? 'grid-cols-1 lg:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>
        {showGraphStatus || error ? (
          <div className="pointer-events-none absolute left-3 top-2 z-30 flex max-w-[44rem] flex-col items-start gap-1 text-left">
            {showGraphStatus ? (
              <span className="rounded-md bg-white/85 px-2 py-1 text-sm text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/85 dark:text-slate-200">
                {pullCount} pull requests
              </span>
            ) : null}
            {showGraphStatus && focusedLabel ? (
              <span className="max-w-[44rem] truncate rounded-md bg-white/85 px-2 py-1 text-sm text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/85 dark:text-slate-200">
                {focusedLabel}
              </span>
            ) : null}
            {error ? (
              <span className="max-w-[44rem] truncate rounded-md bg-rose-50/95 px-2 py-1 text-sm font-medium text-rose-700 shadow-sm backdrop-blur dark:bg-rose-950/60 dark:text-rose-300">
                {error}
              </span>
            ) : null}
          </div>
        ) : null}

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
            minZoom={0.25}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            fitView
            fitViewOptions={{ padding: 0.24, minZoom: MIN_AUTO_FIT_ZOOM, maxZoom: 1 }}
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
