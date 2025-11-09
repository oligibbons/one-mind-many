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
  handleSignOut: () => Promise<{ success: boolean; error: string | null }>; // <-- FIX: Renamed from logout
  updateUser: (newProfileData: Profile) => void; // <-- FIX: Added updateUser
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true
  const [session, setSession] = useState<Session | null>(null);

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
        // FIX: On any Supabase API error (like the 500 RLS error),
        // keep the user authenticated but explicitly set the profile to null.
        console.warn('Error fetching profile, setting user.profile to null:', error.message);
        setUser({
          ...authUser,
          profile: null, // Keep user logged in, but mark profile as missing/failed
        });
      } else if (profile) {
        setUser({
          ...authUser,
          profile: profile as Profile,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile (critical exception):', error);
      // FIX: On any critical exception (e.g., network timeout), keep the base User object.
      // This ensures the authenticated state is preserved.
      setUser({
        ...authUser,
        profile: null,
      });
    } finally {
      // This is crucial: always stop loading *after* we are done.
      setLoading(false);
    }
  };

  // --- FIX: Added updateUser function ---
  // Helper function to update just the profile part of the user
  const updateUser = (newProfileData: Profile) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        profile: newProfileData,
      };
    });
  };

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
    console.log('AuthContext Debug: supabase.auth object:', supabase.auth);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed', event, session);
        setSession(session);
        const currentUser = session?.user ?? null;

        if (currentUser) {
          // User signed in or session was refreshed
          // We run the fetch in the background and unblock the UI immediately
          fetchUserProfile(currentUser);
          setLoading(false);
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

  // The dependency array MUST be empty [].
  }, []);

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
    // which then calls `fetchUserProfile` and sets loading to false.
    return { success: true, error: null };
  };

  // --- FIX: Renamed 'logout' to 'handleSignOut' ---
  const handleSignOut = async () => {
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
    handleSignOut, // <-- FIX: Use new function name
    updateUser,     // <-- FIX: Add new function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};