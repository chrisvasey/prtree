import { useCallback, useEffect, useState } from 'react';

export interface AuthUser {
  login: string;
  avatarUrl: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/auth/me')
      .then(async (response) => {
        if (cancelled) return;

        if (response.ok) {
          const data = (await response.json()) as { authenticated: boolean; user: AuthUser };
          if (!cancelled && data.authenticated) {
            setUser(data.user);
          }
        }
      })
      .catch(() => {
        // Not authenticated
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    window.location.href = '/auth/login';
  }, []);

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.reload();
  }, []);

  return { user, loading, login, logout };
}
