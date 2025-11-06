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

// Define what our context will provide
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<{ success: boolean; error: string | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1. Get initial session
    // We set loading to true *before* this effect, so it's already loading
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          // If we have a session, fetch the profile.
          // fetchUserProfile will set loading to false in its 'finally' block.
          fetchUserProfile(session.user);
        } else {
          // No session, we are done loading.
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setLoading(false);
      });

    // 2. Listen for auth changes
    console.log('AuthContext Debug: supabase.auth object:', supabase.auth);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed', event, session);
        setSession(session);
        const currentUser = session?.user ?? null;

        if (currentUser) {
          // User signed in or session was refreshed
          // fetchUserProfile will handle setting the user and setting loading to false.
          await fetchUserProfile(currentUser);
        } else {
          // User signed out
          setUser(null);
          setLoading(false); // We are done loading
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  
  // --- THIS IS THE FIX ---
  // The dependency array MUST be empty [].
  // We only want this effect to run ONCE when the app first mounts.
  // My previous inclusion of `[loading]` caused an infinite loop.
  }, []); 

  // Helper function to fetch profile and set user state
  const fetchUserProfile = async (authUser: User) => {
    // Do not set loading(true) here, it causes flicker on refresh
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error.message);
        setUser(null); // Set user to null if profile fails
      } else if (profile) {
        setUser({
          ...authUser,
          profile: profile,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUser(null);
    } finally {
      // This is crucial: always stop loading *after* we are done.
      setLoading(false);
    }
  };

  // Define the actual login function
  const login = async (email: string, password: string) => {
    setLoading(true); // Start loading
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false); // Stop loading if login fails
      return { success: false, error: error.message };
    }
    
    // If login is successful, the `onAuthStateChange` listener will fire,
    // which then calls `fetchUserProfile`, which will set loading to false
    // when it finishes.
    return { success: true, error: null };
  };

  // Define the logout function
  const logout = async () => {
    setLoading(true); // Start loading
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setLoading(false); // Stop loading if logout fails
      return { success: false, error: error.message };
    }
    
    // `onAuthStateChange` will fire, set user to null, and set loading to false
    return { success: true, error: null };
  };

  const value = {
    user,
    loading,
    session,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};