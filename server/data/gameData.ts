// src/components/layout/Navbar.tsx

import { useState } from 'react'; // <-- NEW: Import useState
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import {
  LogOut,
  User,
  Shield,
  Home,
  Menu, // <-- NEW: Hamburger icon
  X, // <-- NEW: Close icon
} from 'lucide-react';
import { usePresenceStore } from '../../stores/usePresenceStore';

export const Navbar = () => {
  const { user, profile, handleSignOut } = useAuth();
  const navigate = useNavigate();
  const { clearPresence } = usePresenceStore();

  // --- NEW: State for mobile menu ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // --- END NEW ---

  const onSignOut = async () => {
    // Clear presence state *before* signing out
    clearPresence();
    await handleSignOut();
    navigate('/');
  };

  const NavLinkItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)} // <-- NEW: Close menu on click
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-orange-600/20 text-orange-400'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left Side: Logo */}
          <div className="flex-shrink-0">
            <Link to={user ? '/main-menu' : '/'} className="flex items-center gap-2">
              <Logo width="30" height="30" />
              <span className="text-lg font-bold text-white">
                M.O.P.
              </span>
            </Link>
          </div>

          {/* Center: Desktop Nav Links */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <NavLinkItem to="/main-menu">
              <Home className="h-4 w-4" />
              Main Menu
            </NavLinkItem>
            {user && (
              <NavLinkItem to={`/profile/${user.id}`}>
                <User className="h-4 w-4" />
                My Profile
              </NavLinkItem>
            )}
            {profile?.is_admin && (
              <NavLinkItem to="/admin">
                <Shield className="h-4 w-4" />
                Admin
              </NavLinkItem>
            )}
          </div>

          {/* Right Side: Auth Button or Mobile Menu Toggle */}
          <div className="flex items-center">
            <div className="hidden md:block">
              {user ? (
                <Button variant="ghost" size="sm" onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button as={Link} to="/login" variant="ghost" size="sm">
                  Sign In
                </Button>
              )}
            </div>

            {/* --- NEW: Mobile Menu Toggle Button --- */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
            {/* --- END NEW --- */}

          </div>
        </div>
      </div>

      {/* --- NEW: Mobile Menu --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            <NavLinkItem to="/main-menu">
              <Home className="h-4 w-4" />
              Main Menu
            </NavLinkItem>
            {user && (
              <NavLinkItem to={`/profile/${user.id}`}>
                <User className="h-4 w-4" />
                My Profile
              </NavLinkItem>
            )}
            {profile?.is_admin && (
              <NavLinkItem to="/admin">
                <Shield className="h-4 w-4" />
                Admin
              </NavLinkItem>
            )}
            {user ? (
              <button
                onClick={onSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <NavLinkItem to="/login">
                Sign In
              </NavLinkItem>
            )}
          </div>
        </div>
      )}
      {/* --- END NEW --- */}
    </nav>
  );
};