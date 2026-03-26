import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: 'client' | 'association' | 'admin';
  can_verify_reports: boolean;
  eco_points: number;
  level: number;
  reports_count: number;
  tasks_completed: number;
  streak_days: number;
  phone: string | null;
  bio: string | null;
  created_at: string;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isVerifier: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  skipLogin: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  profile: null,
  isVerifier: false,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  skipLogin: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isVerifier, setIsVerifier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState(false);

  // Fetch profile from DB
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() as any;

    if (data) {
      setProfile(data as Profile);
      setIsVerifier((data as Profile).can_verify_reports ?? false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        if (s?.user) fetchProfile(s.user.id);
      })
      .catch(() => {
        // Network error — continue without session
      })
      .finally(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setIsVerifier(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    } catch (e: any) {
      return e?.message || 'Error de red. Verifica tu conexion a internet.';
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) return error.message;

      // Email already taken (Supabase returns fake user with no identities)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return 'Ya existe una cuenta con ese correo. Intenta iniciar sesion.';
      }

      // Auto-login if no session was returned
      if (!data.session) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) return 'Cuenta creada pero fallo el auto-login: ' + loginError.message;
      }

      // Create profile manually (trigger may not exist)
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name,
        } as any).throwOnError();
      }

      return null;
    } catch (e: any) {
      console.error('[Auth] signUp exception:', e);
      return 'Error de conexion: ' + (e?.message || 'Verifica tu internet');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] signOut remote error (ignored):', e);
    }
    setSession(null);
    setProfile(null);
    setIsVerifier(false);
    setSkipped(false);
  };

  const skipLogin = () => {
    setSkipped(true);
    setIsVerifier(false);
  };

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isVerifier,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        skipLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
