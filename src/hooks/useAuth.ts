// src/hooks/useAuth.ts

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// Define the shape of our Profile
export interface Profile {
  id: string;
  username: string;
  is_admin: boolean;
  avatar_url?: string;
  status: 'Online' | 'Offline' | 'In-Game';
  total_vp: number;
  total_wins: number;
  total_games_played: number;
}

// Combine Supabase User and our custom Profile
export interface UserProfile extends User {
  profile: Profile | null;
}

// Define what our store will provide
interface AuthStoreState {
  user: UserProfile | null;
  loading: boolean;
  session: Session | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error: string | null }>;
  handleSignOut: () => Promise<{ success: boolean; error: string | null }>;
  updateUser: (newProfileData: Profile) => void;
  init: () => void; // Initialization function
}

// Helper function to fetch profile
const fetchUserProfile = async (authUser: User): Promise<UserProfile | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.warn(
        'Error fetching profile, setting user.profile to null:',
        error.message,
      );
      return {
        ...authUser,
        profile: null, // Keep user logged in, but mark profile as missing/failed
      };
    } else if (profile) {
      return {
        ...authUser,
        profile: profile as Profile,
      };
    }
    // No profile found, but no error (e.g., new user)
    return {
      ...authUser,
      profile: null,
    };
  } catch (error) {
    console.error('Failed to fetch profile (critical exception):', error);
    return {
      ...authUser,
      profile: null, // Keep base User object
    };
  }
};

let initialized = false;

export const useAuth = create<AuthStoreState>((set, get) => ({
  // --- Initial State ---
  user: null,
  loading: true,
  session: null,

  // --- Actions ---
  login: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
    
    // onAuthStateChange will handle setting the user and loading state
    return { success: true, error: null };
  },

  handleSignOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
    
    // onAuthStateChange will handle clearing the user and setting loading
    return { success: true, error: null };
  },

  updateUser: (newProfileData) => {
    set((state) => {
      if (!state.user) return {};
      return {
        user: {
          ...state.user,
          profile: newProfileData,
        },
      };
    });
  },

  // --- Initialization ---
  init: () => {
    if (initialized) {
      return; // Ensure this runs only once
    }
    initialized = true;

    // 1. Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        set({ session });
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          set({ user: userProfile, loading: false });
        } else {
          set({ loading: false });
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        set({ loading: false });
      });

    // 2. Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed', event, session);
      set({ session });
      const authUser = session?.user ?? null;

      if (authUser) {
        // User signed in or session was refreshed
        // Only re-fetch profile if user is different
        if (get().user?.id !== authUser.id) {
          set({ loading: true });
          const userProfile = await fetchUserProfile(authUser);
          set({ user: userProfile, loading: false });
        } else {
          // Same user, no need to re-fetch, just ensure loading is false
          set({ loading: false });
        }
      } else {
        // User signed out
        set({ user: null, loading: false });
      }
    });
  },
}));