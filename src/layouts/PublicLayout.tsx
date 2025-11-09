// src/layouts/PublicLayout.tsx

import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar'; // <-- NEW: Import Navbar
import { Footer } from '../components/layout/Footer'; // <-- NEW: Import Footer

/**
 * PublicLayout
 * This layout is for public-facing pages like the Homepage and How to Play.
 * ---
 * FIX: This layout originally had its own simple header, causing the
 * "weird cream gradient" issue. It is now updated to use the
 * main <Navbar /> and <Footer /> components for a consistent
 * look, feel, and mobile experience across the entire site.
 */
export const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* <-- NEW: Added main Navbar */}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer /> {/* <-- NEW: Added main Footer */}
    </div>
  );
};

export default PublicLayout;