import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { backend } from './backend';
import type { SessionUser } from './types';

type AuthState = { user: SessionUser | null; isAdmin: boolean; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    let active = true;
    let latest = 0;

    async function apply(user: SessionUser | null) {
      const seq = ++latest;
      const isAdmin = user ? await backend.isAdmin().catch(() => false) : false;
      // Abaikan hasil lama bila status masuk berubah lagi selama pengecekan admin.
      if (active && seq === latest) setState({ user, isAdmin, loading: false });
    }

    backend
      .getUser()
      .then(apply)
      .catch(() => apply(null));
    // Ditunda: Supabase menyarankan tidak memanggil API-nya langsung di dalam callback auth.
    const unsubscribe = backend.onAuthChange((user) => setTimeout(() => apply(user), 0));
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
