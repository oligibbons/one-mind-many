// src/contexts/AuthContext.tsx
import React, { useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

// This component's only job is to initialize the auth store
// when the app first loads. It no longer provides a context.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get the init function from our auth store
  const initAuth = useAuth((state) => state.init);

  useEffect(() => {
    // Run the initialization logic on mount
    initAuth();
  }, [initAuth]);

  // We no longer need to pass any value, as useAuth is a global store
  return <>{children}</>;
};

// ---
// The old context and interfaces are no longer needed here.
// They have been moved into src/hooks/useAuth.ts
// ---
// export interface Profile { ... }
// export interface UserProfile extends User { ... }
// interface AuthContextType { ... }
// export const AuthContext = createContext<AuthContextType | undefined>(undefined);