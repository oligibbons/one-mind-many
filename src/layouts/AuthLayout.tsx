// src/layouts/AuthLayout.tsx

import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Card } from '../components/ui/Card'; // <-- NEW: Using Card for consistent styling

export const AuthLayout = () => {
  return (
    // --- FIX: Removed 'bg-gray-800' to allow global body style to show ---
    <div className="flex flex-col min-h-screen text-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        {/* --- FIX: Using 'game-card' for consistent app-wide styling --- */}
        <Card className="game-card w-full max-w-md p-8">
          <Outlet />
        </Card>
      </main>
      <Footer />
    </div>
  );
};

// --- Removed 'export default AuthLayout' ---