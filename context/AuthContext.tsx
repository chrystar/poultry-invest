import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  is_admin?: boolean;
  notify_reservation_updates?: boolean;
  notify_new_ventures?: boolean;
  notify_general_updates?: boolean;
};

type SignUpResult = { error: string | null; needsConfirmation: boolean };

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (name: string, email: string, phone: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Returns needsConfirmation: true whenever Supabase created the account
  // but withheld a session — i.e. email confirmation is required.
  const signUp = async (name: string, email: string, phone: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: 'poultryinvest://auth-callback',
      },
    });

    if (error) return { error: error.message, needsConfirmation: false };
    if (!data.user) return { error: 'Registration failed. Please try again.', needsConfirmation: false };

    // No session back from signUp = confirmation email was sent and is required.
    const needsConfirmation = !data.session;

    return { error: null, needsConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Supabase's generic message is confusing when the real cause is an unconfirmed email.
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { error: 'Please confirm your email before signing in. Check your inbox for the confirmation link.' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id);
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: 'poultryinvest://auth-callback' },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signUp, signIn, signOut, refreshProfile, resendConfirmation }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}