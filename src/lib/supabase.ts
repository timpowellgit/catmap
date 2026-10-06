import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import {
  describeSupabaseEnvironmentFailure,
  readSupabaseEnvironment,
  type SupabaseEnvironmentResult,
} from './environment';

export const supabaseEnvironment: SupabaseEnvironmentResult =
  readSupabaseEnvironment(process.env);

export const isSupabaseConfigured = supabaseEnvironment.isConfigured;

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseEnvironment.isConfigured) {
    throw new Error(describeSupabaseEnvironmentFailure(supabaseEnvironment));
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      supabaseEnvironment.environment.supabaseUrl,
      supabaseEnvironment.environment.supabasePublishableKey,
      {
        auth: {
          storage: AsyncStorage as any,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return supabaseClient;
}
