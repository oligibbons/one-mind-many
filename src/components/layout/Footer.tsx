import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { motion } from 'framer-motion';
import { Github, Twitter, Book } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { icon: <Github size={20} />, href: '#', label: 'GitHub' },
    { icon: <Twitter size={20} />, href: '#', label: 'Twitter' },
  ];
  
  const footerLinks = [
    { name: 'Home', href: '/' },
    { name: 'How to Play', href: '/how-to-play' },
    { name: 'About', href: '/about' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ];
  
  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2, rotate: 5 }
  };

  return (
    <footer className="bg-slate-950/50 backdrop-blur-sm border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <Logo />
            <p className="text-slate-400 text-sm max-w-md">
              One Mind, Many is a social deduction game where players navigate through dynamic, 
              AI-driven scenarios where survival depends on cunning teamwork.
            </p>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-slate-400 hover:text-orange-500 transition-colors text-sm flex items-center"
                  >
                    {link.name === 'How to Play' && <Book size={16} className="mr-2" />}
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Social links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="text-slate-400 hover:text-orange-500 transition-colors"
                  initial="initial"
                  whileHover="hover"
                  variants={iconVariants}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} One Mind, Many. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm mt-4 sm:mt-0">
            Made with passion by game enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;