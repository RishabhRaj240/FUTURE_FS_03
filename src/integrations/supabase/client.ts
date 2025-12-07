import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { logEnvStatus } from '@/utils/env-check';

// Get environment variables (Vite automatically loads .env files)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Debug: Log environment variable status (only in development)
if (import.meta.env.DEV) {
  logEnvStatus();
}

// Validate environment variables and provide helpful error messages
if (!SUPABASE_URL) {
  console.error(
    '❌ Missing VITE_SUPABASE_URL environment variable.\n' +
    'Please check your .env file in the root directory.\n' +
    'Make sure it contains: VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'Note: You must restart your dev server after creating/updating .env file!'
  );
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    '❌ Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable.\n' +
    'Please check your .env file in the root directory.\n' +
    'Make sure it contains: VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here\n' +
    'Note: You must restart your dev server after creating/updating .env file!'
  );
}

// Create Supabase client with fallback values to prevent app crash
// The BackendCheck component will show an error message if these are invalid
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder-key',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-client-info': 'creative-hub@1.0.0',
      },
    },
  }
);

// Helper function to check if Supabase is properly configured
export const checkSupabaseConnection = async (): Promise<boolean> => {
  // First check if env vars are set
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return false;
  }

  // Check if using placeholder values
  if (
    SUPABASE_URL.includes('placeholder') ||
    SUPABASE_PUBLISHABLE_KEY.includes('placeholder')
  ) {
    return false;
  }

  try {
    // Try a simple query to verify connection
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    // PGRST116 is "not found" which is fine - it means we connected successfully
    // Other errors indicate connection issues
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};

// Export a function to check if env vars are configured
export const isSupabaseConfigured = (): boolean => {
  return !!(
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    !SUPABASE_URL.includes('placeholder') &&
    !SUPABASE_PUBLISHABLE_KEY.includes('placeholder')
  );
};