// src/components/layout/Navbar.tsx

import React from 'react';
import { Link, NavLink, useNavigate }from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { User, LogOut, Gamepad2, Users, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient'; // <-- NEW IMPORT
import clsx from 'clsx'; // <-- NEW IMPORT

export const Navbar: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate(); // <-- NEW

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-brand-orange font-bold flex items-center gap-2'
      : 'text-gray-300 hover:text-brand-orange flex items-center gap-2';

  // --- NEW: Logout Handler ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Navigate to home page on logout
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex-shrink-0">
              <Logo size="sm" />
            </Link>
            <div className="hidden space-x-4 md:flex">
              {/* These are the main app navigation links */}
              {user && (
                <>
                  <NavLink to="/app/main-menu" className={getNavLinkClass}>
                    <User size={16} />
                    Main Menu
                  </NavLink>
                  <NavLink to="/app/lobbies" className={getNavLinkClass}>
                    <Gamepad2 size={16} />
                    Find Game
                  </NavLink>
                  <NavLink to="/app/friends" className={getNavLinkClass}>
                    <Users size={16} />
                    Friends
                  </NavLink>
                </>
              )}
              <NavLink to="/how-to-play" className={getNavLinkClass}>
                <HelpCircle size={16} />
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
            ) : user && profile ? (
              // --- Logged In ---
              <div className="flex items-center space-x-4">
                <NavLink 
                  to={`/app/profile/${profile.id}`} 
                  className={getNavLinkClass}
                  title="View Profile"
                >
                  <User size={16} />
                  {profile.username}
                </NavLink>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Log Out"
                  className="text-gray-400 hover:text-brand-orange"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            ) : !user ? (
              // --- Logged Out ---
              <div className="flex items-center space-x-2">
                <Button
                  as={Link}
                  to="/login"
                  variant="outline"
                  size="sm"
                  className="btn-outline"
                >
                  Log In
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="default"
                  size="sm"
                  className="btn-primary"
                >
                  Register
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};