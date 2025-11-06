// src/components/layout/Footer.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import {
  Twitter,
  Facebook,
  Twitch,
  MessageSquare, // Using for Discord
  Reddit,
  Instagram,
  Youtube, // Using for TikTok as lucide doesn't have it
} from 'lucide-react';

// Helper component for social icons
const SocialIcon: React.FC<{ href: string; icon: React.ElementType; label: string }> = ({
  href,
  icon: Icon,
  label,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="text-gray-400 transition-colors hover:text-brand-orange"
  >
    <Icon className="h-6 w-6" />
  </a>
);

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-700 bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Column 1: Logo and Copyright */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Logo size="md" clickable={true} />
            <p className="mt-4 text-sm">
              One Pawn. Many Minds.
            </p>
            <p className="mt-2 text-sm">
              &copy; {new Date().getFullYear()} One Mind, Many. All rights reserved.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-white">Navigate</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-brand-orange">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/app/main-menu" className="text-sm hover:text-brand-orange">
                  Main Menu
                </Link>
              </li>
              <li>
                <Link to="/how-to-play" className="text-sm hover:text-brand-orange">
                  How to Play
                </Link>
              </li>
              <li>
                <Link to="/app/lobbies" className="text-sm hover:text-brand-orange">
                  Find a Game
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Social Links */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-white">Join the Community</h3>
            <p className="mt-4 text-sm">
              Follow us on social media for updates, community games, and more.
            </p>
            <div className="mt-4 flex justify-center space-x-5 md:justify-start">
              <SocialIcon href="#" icon={Twitter} label="X (formerly Twitter)" />
              <SocialIcon href="#" icon={MessageSquare} label="Discord" />
              <SocialIcon href="#" icon={Twitch} label="Twitch" />
              <SocialIcon href="#" icon={Instagram} label="Instagram" />
              <SocialIcon href="#" icon={Youtube} label="TikTok" />
              <SocialIcon href="#" icon={Facebook} label="Facebook" />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};