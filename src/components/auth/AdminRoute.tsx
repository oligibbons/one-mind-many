// src/components/auth/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner'; // <-- Corrected import

export const AdminRoute = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/menu" replace />;
  }

  return <Outlet />;
};