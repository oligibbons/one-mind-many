// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { api } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Profile } from '../types/game'; // Assuming you have this type

interface AuthUser extends User {
  profile: Profile;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  updateUser: (updatedProfile: Profile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authedUser: User) => {
    try {
      // Calls GET /api/auth/user
      const { data, error } = await api.get('/auth/user');
      
      if (error) throw error;
      
      setUser(data);
      return data;
      
    } catch (error: any) {
      console.error('Error fetching full user profile:', error.message);
      return null;
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        await fetchProfile(session.user);
      }
      
      setLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      
      if (session?.user) {
        if (_event === 'USER_UPDATED') {
          // Re-fetch profile on user update (e.g., email change)
          await fetchProfile(session.user);
        } else if (_event === 'SIGNED_IN') {
          // Fetch profile on sign in
          await fetchProfile(session.user);
        }
      } else {
        setUser(null);
      }
      
      // Stop loading only after auth state is fully processed
      if (loading) setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, loading]);

  // Function to allow components to update the user context
  // (e.g., after updating profile settings)
  const updateUser = (updatedProfile: Profile) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        profile: updatedProfile,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-charcoal">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};