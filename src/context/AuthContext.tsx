import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Session,
  clearSession,
  loadSession,
  saveSession,
} from '../api/session';
import { clearCookieJar } from '../api/cookies';

interface AuthState {
  session: Session | null;
  loading: boolean;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then((s) => setSession(s))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (s: Session) => {
    await saveSession(s);
    setSession(s);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    await clearCookieJar().catch(() => undefined);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signOut }),
    [session, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
