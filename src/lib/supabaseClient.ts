import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  }
});

// Add error handling and retry logic for token refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token');
  } else if (event === 'USER_UPDATED') {
    console.log('User data updated');
  }
});

// Add automatic retry for failed requests
const maxRetries = 3;
let currentRetry = 0;

// Handle token refresh
const handleTokenRefresh = async () => {
  try {
    if (currentRetry < maxRetries) {
      currentRetry++;
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Failed to refresh token:', error);
  } finally {
    currentRetry = 0;
  }
};

// Export the token refresh handler for use in other parts of the application
export { handleTokenRefresh };