import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.access_token);
      } else {
        setUser(null);
        setIsAdmin(false);
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string, accessToken?: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (userData) {
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Store access token if provided
        if (accessToken) {
          localStorage.setItem('token', accessToken);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user || !data.session) {
        return { success: false, error: 'No user data returned' };
      }

      // Store the access token in localStorage
      localStorage.setItem('token', data.session.access_token);

      // Fetch user profile and store user data
      await fetchUserProfile(data.user.id, data.session.access_token);
      
      // Update last login timestamp
      await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', data.user.id);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};