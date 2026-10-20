import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { backend } from './backend';
import type { SessionUser } from './types';

type AuthState = { user: SessionUser | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;
    backend
      .getUser()
      .then((user) => active && setState({ user, loading: false }))
      .catch(() => active && setState({ user: null, loading: false }));
    const unsubscribe = backend.onAuthChange((user) => setState({ user, loading: false }));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
