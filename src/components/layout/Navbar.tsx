import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // <-- THIS IS THE CORRECTED IMPORT PATH
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false); // Close menu on logout
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Common classes for NavLink for active state
  const getDesktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-lg font-medium transition-colors ${
      isActive
        ? 'text-primary-400'
        : 'text-gray-200 hover:text-primary-400'
    }`;

  const getMobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-4 text-3xl text-center font-medium transition-colors ${
      isActive
        ? 'text-primary-400'
        : 'text-gray-100 hover:text-primary-400'
    }`;

  const renderLinks = (isMobile: boolean) => {
    const linkClass = isMobile ? getMobileLinkClass : getDesktopLinkClass;

    if (user) {
      // Logged-in user links
      return (
        <>
          <NavLink
            to="/main-menu"
            className={linkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Main Menu
          </NavLink>
          <NavLink
            to="/friends"
            className={linkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Friends
          </NavLink>
          <NavLink
            to="/profile"
            className={linkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Profile
          </NavLink>
          {user.is_admin && (
            <NavLink
              to="/admin"
              className={linkClass}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin
            </NavLink>
          )}
          <Button
            onClick={handleLogout}
            variant="danger"
            className={isMobile ? 'w-full py-4 text-3xl' : 'text-lg'}
          >
            Logout
          </Button>
        </>
      );
    }

    // Logged-out user links
    return (
      <>
        <NavLink
          to="/how-to-play"
          className={linkClass}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          How to Play
        </NavLink>
        <NavLink
          to="/login"
          className={linkClass}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Login
        </NavLink>
        <NavLink
          to="/register"
          className={linkClass}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Register
        </NavLink>
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 bg-opacity-80 backdrop-blur-md shadow-lg text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo - links to main menu if logged in, homepage if logged out */}
        <NavLink
          to={user ? '/main-menu' : '/'}
          aria-label="Home page"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Logo />
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          {renderLinks(false)}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="text-white p-2"
          >
            <Menu size={32} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 w-full h-dvh bg-gray-950 z-50 p-4"
          >
            <div className="flex justify-between items-center mb-10">
              <Logo />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="text-white p-2"
              >
                <X size={40} />
              </button>
            </div>
            <div className="flex flex-col space-y-8 mt-16">
              {renderLinks(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};