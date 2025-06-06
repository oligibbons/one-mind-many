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
    try {
      setLoading(true);
      setError(null);

      console.log('Checking auth status...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('Session:', session);
      if (sessionError) console.error('Session Error:', sessionError);

      if (!session?.user) {
        console.log('No user session found.');
        setUser(null);
        setIsAdmin(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('id', session.user.id)
        .single();

      console.log('User data:', userData);
      if (userError) console.error('User Query Error:', userError);

      if (userData) {
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
        console.log('User successfully authenticated:', userData);
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setError(error.message);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      setUser(null);
      setIsAdmin(false);
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await checkAuth();
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
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
            console.log('User signed in:', userData);
            navigate('/game');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        if (!mounted) return;
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
