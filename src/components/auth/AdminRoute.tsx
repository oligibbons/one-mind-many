import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const AdminRoute = ({ children, redirectTo = "/game" }: AdminRouteProps) => {
  const { user, loading, isAdmin } = useAuth();

  // Show nothing while checking auth (no loading spinner to avoid issues)
  if (loading) {
    return null;
  }

  // Redirect if not authenticated or not admin
  if (!user || !isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render admin content
  return <>{children}</>;
};

export default AdminRoute;