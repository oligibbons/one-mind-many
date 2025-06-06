import { createContext, useState, useEffect, ReactNode } from 'react';
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

  const checkAuth = async () => {
    console.log('checkAuth is being called');
    try {
      setLoading(true);
      setError(null);
      console.log('Calling supabase.auth.getSession()');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session data:', session, 'Session error:', sessionError);

      if (sessionError) throw sessionError;
      if (!session?.user) {
        console.log('No user in session.');
        setUser(null);
        setIsAdmin(false);
        return;
      }

      console.log('Fetching user data from Supabase...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('id', session.user.id)
        .single();
      console.log('User data:', userData, 'User error:', userError);

      if (userError) throw userError;

      if (userData) {
        console.log('Setting user and isAdmin state.');
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setError(error.message);
      setUser(null);
      setIsAdmin(false);
    } finally {
      console.log('Auth check finished.');
      setLoading(false);
    }
  };

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
    let mounted = true;

    const initialize = async () => {
      console.log('Initializing authentication check...');
      await checkAuth();
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session);
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username, email, role')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (userError) throw userError;

          if (userData) {
            setUser(userData);
            setIsAdmin(userData.role === 'admin');
            navigate('/game');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        if (!mounted) return;
        console.log('User signed out.');
        setUser(null);
        setIsAdmin(false);
        navigate('/');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, error, checkAuth, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
