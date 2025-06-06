import { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  checkAuth: async () => {},
  logout: async () => {},
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  
  // Use refs to prevent race conditions
  const isCheckingAuth = useRef(false);
  const mounted = useRef(true);
  const hasInitialized = useRef(false);

  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth.current) {
      console.log('Auth check already in progress, skipping...');
      return;
    }

    console.log('checkAuth is being called');
    isCheckingAuth.current = true;
    
    try {
      setError(null);
      console.log('Calling supabase.auth.getSession()');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session data:', session, 'Session error:', sessionError);

      if (!mounted.current) return;

      if (sessionError) throw sessionError;
      
      if (!session?.user) {
        console.log('No user in session.');
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('Fetching user data from Supabase...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('id', session.user.id)
        .single();
      
      console.log('User data:', userData, 'User error:', userError);

      if (!mounted.current) return;

      if (userError) throw userError;

      if (userData) {
        console.log('Setting user and isAdmin state.');
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      
      if (!mounted.current) return;
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Unable to connect to authentication service. Please check your internet connection and try again.';
      } else if (error.message === 'Request timeout') {
        errorMessage = 'Authentication request timed out. Please try again.';
      }
      
      setError(errorMessage);
      setUser(null);
      setIsAdmin(false);
    } finally {
      if (mounted.current) {
        console.log('Auth check finished.');
        setLoading(false);
      }
      isCheckingAuth.current = false;
    }
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Calling supabase.auth.signOut()');

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      console.log('Logout successful.');
      setUser(null);
      setIsAdmin(false);
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      console.log('Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in via auth state change');
        try {
          // Clear any existing errors
          setError(null);
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username, email, role')
            .eq('id', session.user.id)
            .single();

          if (!mounted.current) return;

          if (userError) throw userError;

          if (userData) {
            console.log('Setting user data from auth state change');
            setUser(userData);
            setIsAdmin(userData.role === 'admin');
            setLoading(false); // Explicitly set loading to false here
            
            // Navigate after a short delay to ensure state is updated
            setTimeout(() => {
              if (mounted.current) {
                console.log('Navigating to /game');
                navigate('/game');
              }
            }, 100);
          }
        } catch (err) {
          console.error('Error fetching user data on sign in:', err);
          if (mounted.current) {
            setError('Failed to load user data');
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out via auth state change');
        if (mounted.current) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          navigate('/');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
        // Don't need to do anything special here
      } else if (event === 'INITIAL_SESSION') {
        console.log('Initial session event');
        // Handle initial session
        if (session?.user && !hasInitialized.current) {
          hasInitialized.current = true;
          // Don't call checkAuth here to avoid race condition
        } else if (!session?.user) {
          setLoading(false);
        }
      }
    });

    // Only do initial auth check if we haven't initialized yet
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      checkAuth();
    }

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [checkAuth, navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, error, checkAuth, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};