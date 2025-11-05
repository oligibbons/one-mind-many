// src/contexts/AuthContext.tsx

import React, {
  createContext,
  // useContext, // <-- REMOVED (no longer needed in this file)
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types/game'; // Import our Profile type

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null; // <-- NEW
  loading: boolean;
}

// --- MODIFIED: Added 'export' ---
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // <-- NEW
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      const session = data.session;
      setSession(session);
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        // --- NEW: Fetch profile on load ---
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile on load:', profileError);
        } else {
          setProfile(profileData as Profile);
        }
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setSession(session);
        const user = session?.user ?? null;
        setUser(user);

        // --- NEW: Fetch profile on auth change ---
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile on change:', profileError.message);
            setProfile(null); // Clear profile if fetch fails
          } else {
            setProfile(profileData as Profile);
          }
        } else {
          setProfile(null); // Clear profile on logout
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    profile, // <-- NEW
    loading,
  };

  // Don't render children until we've checked for a session
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// --- MODIFIED: Removed the duplicate useAuth hook ---
// (The correct one is in src/hooks/useAuth.ts)