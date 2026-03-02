import { createContext, useCallback, useContext } from 'react';
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate
} from '@tanstack/react-router';

import App from './App';
import type { AuthUser } from './lib/auth';
import { buildRepoPath, normalizeFocusParam, repoFromRouteParams } from './lib/routeState';

interface AuthContext {
  user: AuthUser;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext | null>(null);

function useAuthContext(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('Missing AuthCtx');
  return ctx;
}

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
  const { user, logout } = useAuthContext();

  return <App routeRepo={null} routeFocus={null} navigateToRepo={navigateToRepo} user={user} onLogout={logout} />;
}

function RepoRouteComponent() {
  const navigateToRepo = useRepoNavigator();
  const { user, logout } = useAuthContext();
  const params = repoRoute.useParams();
  const routeRepo = repoFromRouteParams(params.owner, params.repo);

  return <App routeRepo={routeRepo} routeFocus={null} navigateToRepo={navigateToRepo} user={user} onLogout={logout} />;
}

function FocusRouteComponent() {
  const navigateToRepo = useRepoNavigator();
  const { user, logout } = useAuthContext();
  const params = focusRoute.useParams();
  const routeRepo = repoFromRouteParams(params.owner, params.repo);
  const routeFocus = normalizeFocusParam(params.focus);

  return <App routeRepo={routeRepo} routeFocus={routeFocus} navigateToRepo={navigateToRepo} user={user} onLogout={logout} />;
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

interface AppRouterProviderProps {
  user: AuthUser;
  logout: () => Promise<void>;
}

export function AppRouterProvider({ user, logout }: AppRouterProviderProps) {
  return (
    <AuthCtx.Provider value={{ user, logout }}>
      <RouterProvider router={router} />
    </AuthCtx.Provider>
  );
}
