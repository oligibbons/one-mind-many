// src/layouts/AuthLayout.tsx

import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Navbar } from '../components/layout/Navbar'; // <-- NEW: Import Navbar
import { Footer } from '../components/layout/Footer'; // <-- NEW: Import Footer

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app/main-menu" replace />;
  }

  // --- FIX: Wrap the <Outlet> with the Navbar and Footer ---
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-200">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};