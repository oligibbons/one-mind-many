import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- STYLE INJECTIONS ---

  // Define the custom font style object to apply to all links
  const linkFont = {
    fontFamily: "'CustomHeading', system-ui, sans-serif",
  };

  // Common classes for NavLink for active/hover "glow"
  const getDesktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xl tracking-wide transition-all duration-300 ${
      isActive
        ? 'text-primary-400 drop-shadow-[0_0_4px_theme(colors.primary.400)]'
        : 'text-gray-300 hover:text-primary-400 hover:drop-shadow-[0_0_4px_theme(colors.primary.400)]'
    }`;

  const getMobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-4 text-4xl text-center tracking-wider transition-all duration-300 ${
      isActive
        ? 'text-primary-400 drop-shadow-[0_0_6px_theme(colors.primary.400)]'
        : 'text-gray-200 hover:text-primary-400 hover:drop-shadow-[0_0_6px_theme(colors.primary.400)]'
    }`;

  // --- END STYLE INJECTIONS ---

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false); // Close menu on logout
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const renderLinks = (isMobile: boolean) => {
    const linkClass = isMobile ? getMobileLinkClass : getDesktopLinkClass;

    if (user) {
      // Logged-in user links
      return (
        <>
          <NavLink
            to="/main-menu"
            className={linkClass}
            style={linkFont}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Main Menu
          </NavLink>
          <NavLink
            to="/friends"
            className={linkClass}
            style={linkFont}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Friends
          </NavLink>
          <NavLink
            to="/profile"
            className={linkClass}
            style={linkFont}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Profile
          </NavLink>
          
          {/* --- FIX: Added Settings link --- */}
          <NavLink
            to="/settings"
            className={linkClass}
            style={linkFont}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Settings
          </NavLink>
          {/* --- END OF FIX --- */}
          
          {user.profile?.is_admin && (
            <NavLink
              to="/admin"
              className={linkClass}
              style={linkFont}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin
            </NavLink>
          )}

          <Button
            onClick={handleLogout}
            variant="danger"
            style={linkFont}
            className={
              isMobile
                ? 'w-full py-4 text-4xl tracking-wider'
                : 'text-xl tracking-wide'
            }
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
          style={linkFont}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          How to Play
        </NavLink>
        <NavLink
          to="/login"
          className={linkClass}
          style={linkFont}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Login
        </NavLink>
        <NavLink
          to="/register"
          className={linkClass}
          style={linkFont}
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
          className="transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_theme(colors.primary.500)] focus:outline-none focus:scale-110 focus:drop-shadow-[0_0_8px_theme(colors.primary.500)]"
        >
          <Logo />
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
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