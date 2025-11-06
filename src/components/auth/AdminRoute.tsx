// src/components/auth/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

export const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // FIX: Check for user.profile.is_admin
  if (!user?.profile?.is_admin) {
    // If the user is logged in but not an admin, show an error or redirect to main menu
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h1 className="text-3xl font-bold text-white">Access Denied</h1>
        <p className="text-lg text-gray-400">
          You do not have permission to view this page.
        </p>
        <Navigate to="/app/main-menu" replace />
      </div>
    );
  }

  // If user exists and is an admin, render the admin layout/pages
  return <Outlet />;
};