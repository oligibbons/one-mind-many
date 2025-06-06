import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const AdminRoute = ({ children, redirectTo = "/game" }: AdminRouteProps) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || !isAdmin) {
    console.log('Redirecting non-admin user to game page.');
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
