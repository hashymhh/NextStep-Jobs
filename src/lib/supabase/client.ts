import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  !supabaseUrl.includes('example.com')
);

let cachedClient: SupabaseClient | null = null;

/**
 * Creates or retrieves the Supabase client.
 * If a Clerk token getter is provided, it injects the custom Authorization header
 * to satisfy Supabase Clerk Third-Party Auth integration (auth.jwt()->>'sub').
 */
export const getSupabaseClient = (getToken?: () => Promise<string | null>): SupabaseClient | null => {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (getToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken();
          const headers = new Headers(options.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    });
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedClient;
};
