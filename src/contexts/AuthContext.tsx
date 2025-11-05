// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback, // <-- NEW
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types/game'; // Assuming Profile is in game.d.ts

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => void; // <-- NEW
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- NEW: useCallback for fetching profile ---
  const fetchProfile = useCallback(async (authedUser: User) => {
    try {
      const { data, error }_ = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authedUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    }
  }, []);

  // --- NEW: Public function to refresh profile ---
  const refreshProfile = useCallback(() => {
    if (user) {
      fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    setLoading(true);

    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      setSession(currentSession);
      const currentUser = currentSession?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser);
      }
      
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event);
        setSession(newSession);
        const currentUser = newSession?.user || null;
        setUser(currentUser);

        if (event === 'SIGNED_IN' && currentUser) {
          setLoading(true);
          await fetchProfile(currentUser);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        } else if (event === 'USER_UPDATED' && currentUser) {
          // e.g., if email is confirmed or password changed
          await fetchProfile(currentUser);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = {
    user,
    session,
    profile,
    loading,
    refreshProfile, // <-- NEW
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = ()_ => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};