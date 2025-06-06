import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    ...(user 
      ? [
          { name: 'Play', path: '/game' },
          { name: 'Friends', path: '/game/friends' },
          { name: 'Settings', path: '/game/settings' },
          ...(isAdmin ? [{ name: 'Admin', path: '/admin' }] : []),
        ] 
      : []
    ),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" onClick={closeMenu}>
            <Logo size="md" />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors nav-link ${
                  isActive(link.path)
                    ? 'text-orange-500'
                    : 'text-slate-300 hover:text-white'
                }`}
                style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-slate-300" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>
                  <User size={16} className="inline mr-1" />
                  {user.username}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => logout()}
                  leftIcon={<LogOut size={16} />}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/auth/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-slate-300 hover:text-white focus:outline-none"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-1 px-4 pb-3 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block py-2 text-base font-medium nav-link ${
                    isActive(link.path)
                      ? 'text-orange-500'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}
                  onClick={closeMenu}
                >
                  {link.name}
                </Link>
              ))}
              
              {user ? (
                <div className="pt-4 pb-3 border-t border-slate-700">
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0 bg-slate-800 rounded-full p-1">
                      <User size={24} className="text-orange-500" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white" style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}>{user.username}</div>
                      <div className="text-sm font-medium text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <button
                      onClick={() => {
                        logout();
                        closeMenu();
                      }}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
                      style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}
                    >
                      <LogOut size={16} className="inline mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 pb-3 border-t border-slate-700 flex flex-col space-y-2">
                  <Link to="/auth/login" onClick={closeMenu}>
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth/register" onClick={closeMenu}>
                    <Button variant="primary" className="w-full">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;