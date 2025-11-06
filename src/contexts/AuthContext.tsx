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

// --- NEW: Define what our context will provide ---
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  session: Session | null;
  // --- FIX 1: Add the auth functions we need ---
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<{ success: boolean; error: string | null }>;
  // Add register if you have a register page
  // register: (/*...args*/) => ...
}

// FIX 1: Added 'export' so src/hooks/useAuth.ts can import this context.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  // FIX 2: Removed extra '=' sign from 'useState'
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1. Get initial session
    setLoading(true); // Start loading
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

    // FIX 3: ADDED DIAGNOSTIC LOGGING
    console.log('AuthContext Debug: supabase.auth object:', supabase.auth);

    // FIX 4: Corrected typo from 'onAuthStateChanged' (v1) to 'onAuthStateChange' (v2+)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed', event, session);
        setSession(session);
        const currentUser = session?.user ?? null;

        if (currentUser) {
          // Don't set loading(true) here, causes flicker
          await fetchUserProfile(currentUser);
        } else {
          setUser(null);
          // Only set loading false if it's not an initial load
          if (loading) setLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loading]); // Added 'loading' dependency

  // Helper function to fetch profile and set user state
  const fetchUserProfile = async (authUser: User) => {
    // setLoading(true); // This is now handled in the useEffect/login
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
      // This is crucial: always stop loading
      if (loading) setLoading(false);
    }
  };

  // --- FIX 2: Define the actual login function ---
  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
    
    // Auth state change listener will handle fetching the profile and setting the user
    // We keep loading=true until the listener is done
    return { success: true, error: null };
  };

  // --- FIX 3: Define the logout function ---
  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
    
    // Auth state listener will set user to null
    // We can manually set user to null here to speed it up
    setUser(null);
    setSession(null);
    setLoading(false);
    return { success: true, error: null };
  };


  // --- FIX 4: Pass the new functions in the provider value ---
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