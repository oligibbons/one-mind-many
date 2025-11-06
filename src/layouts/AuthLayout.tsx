// src/layouts/AuthLayout.tsx

import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const AuthLayout: React.FC = () => {
  const { user, loading } = useAuth();

  // 1. While the AuthContext is loading, show a full-screen spinner
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-gray-200">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 2. After loading, if a user IS logged in, redirect to the main app
  if (user) {
    return <Navigate to="/app/main-menu" replace />;
  }

  // 3. If no user is logged in, show the public pages (Login, Register, Home)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-gray-200">
      <Link to="/" className="mb-8">
        <Logo className="h-20 w-auto text-orange-500" />
      </Link>
      
      {/* Outlet for Login and Register pages */}
      <Outlet />
    </div>
  );
};