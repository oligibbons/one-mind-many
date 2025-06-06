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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  const checkAuth = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    if (!session?.user) {
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
    
    if (userError) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    if (userData) {
      setUser(userData);
      setIsAdmin(userData.role === 'admin');
    }
    
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, email, role')
          .eq('id', session.user.id)
          .single();
        
        if (!userError && userData) {
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

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        checkAuth,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};