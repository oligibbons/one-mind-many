import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar'; // <-- IMPORT THIS
import { Footer } from '../components/layout/Footer'; // <-- IMPORT THIS

export const AuthLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      <Navbar /> {/* <-- ADD THIS */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-xl">
          <Outlet />
        </div>
      </main>
      <Footer /> {/* <-- ADD THIS FOR CONSISTENCY */}
    </div>
  );
};