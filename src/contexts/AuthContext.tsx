// src/contexts/AuthContext.tsx
import React, { useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

// This component's only job is to initialize the auth store
// when the app first loads.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get the init function from our auth store
  const initAuth = useAuth((state) => state.init);

  useEffect(() => {
    // initAuth() now returns the cleanup function
    const cleanup = initAuth();

    // The cleanup function will be called on unmount, or
    // before the effect runs again in StrictMode.
    return () => {
      cleanup();
    };
  }, [initAuth]);

  return <>{children}</>;
};