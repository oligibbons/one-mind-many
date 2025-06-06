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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      setUser(userData);
      setIsAdmin(userData.role === 'admin');
    } catch (err) {
      console.error('Auth check error:', err);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, email, role')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
          navigate('/game');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, error, checkAuth, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};