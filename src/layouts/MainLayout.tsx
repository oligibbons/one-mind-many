// src/layouts/MainLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-gray-200">
      <Navbar />
      <main className="flex-1">
        {/* All child routes (e.g., HomePage, MainMenuPage) will render here */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};