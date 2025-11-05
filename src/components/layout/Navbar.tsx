// src/components/layout/Navbar.tsx

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { User, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, loading } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-orange-400 font-bold'
      : 'text-gray-300 hover:text-orange-400';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex-shrink-0">
              <Logo className="h-10 w-auto text-orange-500" />
            </Link>
            <div className="hidden space-x-4 md:flex">
              <NavLink to="/how-to-play" className={getNavLinkClass}>
                How to Play
              </NavLink>
              {profile?.is_admin && (
                <NavLink to="/admin" className={getNavLinkClass}>
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          {/* Auth Status */}
          <div className="flex items-center">
            {loading ? (
              <div className="h-5 w-24 animate-pulse rounded-md bg-gray-700" />
            ) : user ? (
              // --- Logged In ---
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-sm text-gray-300">
                  <User size={16} className="mr-2 text-orange-400" />
                  {profile?.username || user.email}
                </span>
                <Button
                  as={Link}
                  to="/menu"
                  variant="default"
                  size="sm"
                >
                  Main Menu
                </Button>
                <Link
                  to="/settings"
                  title="Settings / Log Out"
                  className="text-gray-400 hover:text-orange-400"
                >
                  <LogOut size={20} />
                </Link>
              </div>
            ) : (
              // --- Logged Out ---
              <div className="flex items-center space-x-2">
                <Button
                  as={Link}
                  to="/login"
                  variant="outline"
                  size="sm"
                >
                  Log In
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="default"
                  size="sm"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};