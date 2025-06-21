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
      console.log('🔍 Checking Supabase connection and auth state...');
      
      // Test basic Supabase connection
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Supabase connection error:', sessionError);
        throw sessionError;
      }
      
      console.log('✅ Supabase connection successful');
      
      if (session?.user) {
        console.log('👤 User session found:', {
          userId: session.user.id,
          email: session.user.email,
          lastSignIn: session.user.last_sign_in_at
        });
        
        await fetchUserProfile(session.user.id, session.access_token);
      } else {
        console.log('🚫 No active user session found');
        setUser(null);
        setIsAdmin(false);
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('💥 Auth check error:', error);
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
      console.log('📋 Fetching user profile for:', userId);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        throw error;
      }

      if (userData) {
        console.log('✅ User profile loaded:', {
          username: userData.username,
          email: userData.email,
          role: userData.role
        });
        
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
      console.error('💥 Error fetching user profile:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.user || !data.session) {
        console.error('❌ No user data returned from login');
        return { success: false, error: 'No user data returned' };
      }

      console.log('✅ Login successful for user:', data.user.id);

      // Store the access token in localStorage
      localStorage.setItem('token', data.session.access_token);

      // Fetch user profile and store user data
      await fetchUserProfile(data.user.id, data.session.access_token);
      
      // Update last login timestamp
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', data.user.id);
      
      if (updateError) {
        console.warn('⚠️ Failed to update last login timestamp:', updateError);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('💥 Login exception:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ Logout complete');
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