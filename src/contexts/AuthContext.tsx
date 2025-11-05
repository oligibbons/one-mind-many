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
import { Profile } from '../types/game';

interface AuthUser extends User {
  profile: Profile;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  updateUser: (updatedProfile: Profile) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start as true

  const fetchProfile = useCallback(async (authedUser: User) => {
    try {
      // This is the new API route from server/routes/auth.js
      // It correctly fetches the user and their profile data
      const { data, error } = await api.get('/auth/user');
      if (error) throw error;
      setUser(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching full user profile:', error.message);
      // If profile fetch fails, the user is in a bad state. Log them out.
      await supabase.auth.signOut();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setLoading(true); // Ensure loading is true on mount
    
    // This flag ensures we only set loading to false ONCE,
    // on the very first auth event.
    let initialAuthProcessed = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        // If the user exists but isn't in our state, fetch their profile.
        // This handles the initial sign-in.
        if (!user) {
            await fetchProfile(session.user);
        } else if (_event === 'USER_UPDATED') {
            // This handles re-fetching data if the user changes their email/pass
            await fetchProfile(session.user);
        }
      } else {
        // This handles sign-out
        setUser(null);
      }
      
      // Only set loading to false on the *first* auth event (initial load)
      if (!initialAuthProcessed) {
        setLoading(false);
        initialAuthProcessed = true;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, user]); // Add 'user' to dependency array

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
        {/* This will now use your new thematic spinner */}
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