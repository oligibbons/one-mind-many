// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// Define the shape of our Profile
export interface Profile {
  id: string;
  username: string;
  is_admin: boolean;
  avatar_url?: string;
  status: 'Online' | 'Offline' | 'In-Game';
  // Add other profile fields as needed
  total_vp: number;
  total_wins: number;
  total_games_played: number;
}

// Combine Supabase User and our custom Profile
export interface UserProfile extends User {
  profile: Profile | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchUserProfile(session.user);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setLoading(false);
      });

    // 2. Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChanged(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;

        if (currentUser) {
          await fetchUserProfile(currentUser);
        } else {
          setUser(null);
          setLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch profile and set user state
  const fetchUserProfile = async (authUser: User) => {
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // This can happen if the user is created but the profile trigger hasn't run yet.
        // We log the error but treat the user as logged out for now.
        console.warn('Error fetching profile:', error.message);
        setUser(null);
      } else if (profile) {
        setUser({
          ...authUser,
          profile: profile,
        });
      }
    } catch (error) {
      // Catch any other synchronous error
      console.error('Failed to fetch profile:', error);
      setUser(null);
    } finally {
      // This is crucial: always stop loading
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = ()_ => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};