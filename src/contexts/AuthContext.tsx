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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (userError) throw userError;

      // If no user profile exists, create one
      if (!userData) {
        const username = session.user.user_metadata.username || session.user.email?.split('@')[0];
        const { data: newUserData, error: createError } = await supabase
          .from('users')
          .insert([{
            id: session.user.id,
            username,
            email: session.user.email,
            role: 'user'
          }])
          .select('id, username, email, role')
          .single();

        if (createError) throw createError;

        setUser(newUserData);
        setIsAdmin(newUserData.role === 'admin');
        return;
      }

      setUser(userData);
      setIsAdmin(userData.role === 'admin');
    } catch (error) {
      console.error('Auth check error:', error);
      await supabase.auth.signOut();
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
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkAuth();
        navigate('/game');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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