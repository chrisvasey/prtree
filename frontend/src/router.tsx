import { useCallback } from 'react';
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate
} from '@tanstack/react-router';

import App from './App';
import { buildRepoPath, normalizeFocusParam, repoFromRouteParams } from './lib/routeState';

function useRepoNavigator() {
  const navigate = useNavigate();

  return useCallback(
    (repo: string, focus?: string | null) => {
      const path = buildRepoPath(repo, focus);
      if (!path) {
        return;
      }

      void navigate({ to: path });
    },
    [navigate]
  );
}

function HomeRouteComponent() {
  const navigateToRepo = useRepoNavigator();

  return <App routeRepo={null} routeFocus={null} navigateToRepo={navigateToRepo} />;
}

function RepoRouteComponent() {
  const navigateToRepo = useRepoNavigator();
  const params = repoRoute.useParams();
  const routeRepo = repoFromRouteParams(params.owner, params.repo);

  return <App routeRepo={routeRepo} routeFocus={null} navigateToRepo={navigateToRepo} />;
}

function FocusRouteComponent() {
  const navigateToRepo = useRepoNavigator();
  const params = focusRoute.useParams();
  const routeRepo = repoFromRouteParams(params.owner, params.repo);
  const routeFocus = normalizeFocusParam(params.focus);

  return <App routeRepo={routeRepo} routeFocus={routeFocus} navigateToRepo={navigateToRepo} />;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeRouteComponent
});

const repoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$owner/$repo',
  component: RepoRouteComponent
});

const focusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$owner/$repo/$focus',
  component: FocusRouteComponent
});

const routeTree = rootRoute.addChildren([homeRoute, repoRoute, focusRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
