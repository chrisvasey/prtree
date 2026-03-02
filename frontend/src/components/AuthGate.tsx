import { ReactFlowProvider } from '@xyflow/react';

import { useAuth } from '../lib/auth';
import { AppRouterProvider } from '../router';
import { LoginPage } from './LoginPage';

export function AuthGate() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_42%,_#e2e8f0_100%)] dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#0b1120_42%,_#020617_100%)]">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-600 dark:border-t-teal-400" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <ReactFlowProvider>
      <AppRouterProvider user={user} logout={logout} />
    </ReactFlowProvider>
  );
}
