import 'react-native-url-polyfill/auto';

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { CreateSightingScreen } from './src/features/sightings/CreateSightingScreen';
import { getSupabaseClient, isSupabaseConfigured } from './src/lib/supabase';

export default function App() {
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseClient();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <CreateSightingScreen />;
}
