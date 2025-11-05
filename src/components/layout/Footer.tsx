// src/components/layout/Footer.tsx

import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-700 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} One Mind, Many. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link 
              to="/menu" 
              className="text-sm text-gray-400 hover:text-orange-400"
            >
              Game
            </Link>
            <Link 
              to="/how-to-play" 
              className="text-sm text-gray-400 hover:text-orange-400"
            >
              Rules
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};