import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, supabaseEnabled } from '@/lib/supabase';
import { demoAuth, type DemoSession } from '@/lib/demoAuth';
import { setTokenProvider } from '@/lib/api';
import { profileApi } from '@/lib/services';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  usingDemoAuth: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo-auth token holder (used when Supabase is not configured)
  const [demoSession, setDemoSession] = useState<DemoSession | null>(demoAuth.currentSession());

  // Register the token provider used by the API client.
  useEffect(() => {
    if (supabaseEnabled && supabase) {
      const client = supabase;
      setTokenProvider(async () => {
        const { data } = await client.auth.getSession();
        return data.session?.access_token ?? null;
      });
    } else {
      setTokenProvider(() => demoAuth.currentSession()?.token ?? null);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const p = await profileApi.me();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  // Initialize session state
  useEffect(() => {
    let active = true;
    async function init() {
      if (supabaseEnabled && supabase) {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (active && session) {
          setUserId(session.user.id);
          setEmail(session.user.email ?? null);
          await loadProfile();
        }
        supabase.auth.onAuthStateChange(async (_event, s) => {
          setUserId(s?.user.id ?? null);
          setEmail(s?.user.email ?? null);
          if (s) await loadProfile();
          else setProfile(null);
        });
      } else {
        const s = demoAuth.currentSession();
        if (active && s) {
          setUserId(s.userId);
          setEmail(s.email);
          await loadProfile();
        }
      }
      if (active) setLoading(false);
    }
    init();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (emailArg: string, password: string) => {
    if (supabaseEnabled && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: emailArg, password });
      if (error) throw new Error(error.message);
      await loadProfile();
    } else {
      const s = demoAuth.signIn(emailArg, password);
      setDemoSession(s);
      setUserId(s.userId);
      setEmail(s.email);
      await syncDemoProfile(s);
    }
  };

  const signUp = async (emailArg: string, password: string, name: string, role: UserRole) => {
    if (supabaseEnabled && supabase) {
      const { error } = await supabase.auth.signUp({
        email: emailArg,
        password,
        options: { data: { name, role } },
      });
      if (error) throw new Error(error.message);
      // Create/update the backend profile (works once a session exists).
      try {
        await profileApi.update({ name, email: emailArg, role });
      } catch {
        /* profile will be created on first authenticated request */
      }
      await loadProfile();
    } else {
      const s = demoAuth.signUp(emailArg, password, name, role);
      setDemoSession(s);
      setUserId(s.userId);
      setEmail(s.email);
      await syncDemoProfile(s);
    }
  };

  const syncDemoProfile = async (s: DemoSession) => {
    try {
      const p = await profileApi.update({ name: s.name, email: s.email, role: s.role });
      setProfile(p);
    } catch {
      await loadProfile();
    }
  };

  const signOut = async () => {
    if (supabaseEnabled && supabase) {
      await supabase.auth.signOut();
    } else {
      demoAuth.signOut();
      setDemoSession(null);
    }
    setUserId(null);
    setEmail(null);
    setProfile(null);
  };

  const resetPassword = async (emailArg: string) => {
    if (supabaseEnabled && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(emailArg, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw new Error(error.message);
    } else {
      throw new Error(
        'A recuperação de senha requer a configuração do Supabase. No modo demo, crie uma nova conta.',
      );
    }
  };

  const value = useMemo<AuthState>(
    () => ({
      userId,
      email,
      profile,
      loading,
      isAuthenticated: Boolean(userId),
      usingDemoAuth: !supabaseEnabled,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile: loadProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, email, profile, loading, demoSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
