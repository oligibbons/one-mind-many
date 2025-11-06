// src/components/layout/Navbar.tsx

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { User, LogOut, Gamepad2, Users, HelpCircle, Menu, X, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import clsx from 'clsx';

export const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth(); // FIX: Get 'logout' from useAuth
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-brand-orange font-bold flex items-center gap-2'
      : 'text-gray-300 hover:text-brand-orange flex items-center gap-2';

  const getMobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'block rounded-md px-3 py-2 text-base font-medium',
      isActive
        ? 'bg-brand-orange text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
    );

  const handleLogout = async () => {
    await logout(); // FIX: Use 'logout' from context
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex-shrink-0" onClick={closeMobileMenu}>
              <Logo size="sm" />
            </Link>
            {/* --- DESKTOP NAV --- */}
            <div className="hidden space-x-4 md:flex">
              {user && user.profile && ( // FIX: Check for user.profile
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
              {user?.profile?.is_admin && ( // FIX: Check user.profile
                <NavLink to="/admin" className={getNavLinkClass}>
                  <Shield size={16} />
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          {/* --- DESKTOP Auth Status (FIXED) --- */}
          <div className="hidden items-center md:flex">
            {loading ? (
              <div className="h-5 w-24 animate-pulse rounded-md bg-gray-700" />
            ) : user && user.profile ? ( // FIX: Check for user.profile
              // --- Logged In (Desktop) ---
              <div className="flex items-center space-x-4">
                <NavLink
                  to={`/app/profile/${user.profile.id}`} // FIX: Use user.profile
                  className={getNavLinkClass}
                  title="View Profile"
                >
                  <User size={16} />
                  {user.profile.username} {/* FIX: Use user.profile */}
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
            ) : user && !user.profile ? ( // FIX: Handle user logged in but profile is null
              // This is the state right after sign-up before profile is created
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Loading profile...</span>
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
            ) : (
              // --- Logged Out (Desktop) ---
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
            )}
          </div>

          {/* --- NEW: Mobile Menu Button --- */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-brand-orange"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* --- NEW: Mobile Menu Dropdown --- */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-gray-900/95 shadow-lg backdrop-blur-md md:hidden">
          <div className="space-y-1 px-4 pt-2 pb-4">
            {loading ? (
              <div className="h-5 w-24 animate-pulse rounded-md bg-gray-700" />
            ) : user && user.profile ? ( // FIX: Check user.profile
              // --- Logged In (Mobile) ---
              <>
                <NavLink
                  to={`/app/profile/${user.profile.id}`}
                  className={getMobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  <User size={16} className="inline-block mr-2" />
                  Profile ({user.profile.username})
                </NavLink>
                <NavLink
                  to="/app/main-menu"
                  className={getMobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  <User size={16} className="inline-block mr-2" />
                  Main Menu
                </NavLink>
                <NavLink
                  to="/app/lobbies"
                  className={getMobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  <Gamepad2 size={16} className="inline-block mr-2" />
                  Find Game
                </NavLink>
                <NavLink
                  to="/app/friends"
                  className={getMobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  <Users size={16} className="inline-block mr-2" />
                  Friends
                </NavLink>
              </>
            ) : (
              // --- Logged Out (Mobile) ---
              <>
                <NavLink
                  to="/login"
                  className={getMobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/register"
                  className={getMobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  Register
                </NavLink>
              </>
            )}

            {/* Shared Links */}
            <NavLink
              to="/how-to-play"
              className={getMobileNavLinkClass}
              onClick={closeMobileMenu}
            >
              <HelpCircle size={16} className="inline-block mr-2" />
              How to Play
            </NavLink>
            {user?.profile?.is_admin && ( // FIX: Check user.profile
              <NavLink
                to="/admin"
                className={getMobileNavLinkClass}
                onClick={closeMobileMenu}
              >
                <Shield size={16} className="inline-block mr-2" />
                Admin
              </NavLink>
            )}
            
            {/* Logout Button (if logged in) */}
            {user && (
              <button
                onClick={handleLogout}
                className={clsx(
                  'block w-full rounded-md px-3 py-2 text-left text-base font-medium',
                  'text-gray-300 hover:bg-gray-700 hover:text-white',
                )}
              >
                <LogOut size={16} className="inline-block mr-2" />
                Log Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};