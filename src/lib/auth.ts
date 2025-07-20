import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const signUp = async (email: string, password: string, fullName?: string, username?: string) => {
  cleanupAuthState();
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    // Continue even if this fails
  }

  const redirectUrl = `${window.location.origin}/`;
  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        username: username
      }
    }
  });
  // Also insert into users table for username lookup
  if (!error && username) {
    await supabase.from('users').insert({ email, username, full_name: fullName });
  }
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  cleanupAuthState();
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    // Continue even if this fails
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  cleanupAuthState();
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    // Ignore errors
  }
  window.location.href = '/auth';
};

export { supabase };