// src/layouts/AuthLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Link } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-gray-200">
      <Link to="/" className="mb-8">
        <Logo className="h-20 w-auto text-orange-500" />
      </Link>
      
      {/* Outlet for Login and Register pages */}
      <Outlet />
    </div>
  );
};