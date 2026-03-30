import type { Session } from '@supabase/supabase-js';

import { getSupabaseClient } from '../../lib/supabase';

export async function ensureAnonymousSession(): Promise<Session> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session) {
    return session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error(
      'Supabase did not return a session for the anonymous user.',
    );
  }

  return data.session;
}
