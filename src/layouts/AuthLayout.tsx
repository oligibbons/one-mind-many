import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/ui/Logo';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-center md:justify-start md:pl-8">
        <Logo size="lg" />
      </div>
      
      <motion.div
        className="w-full max-w-md p-8 rounded-lg border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Outlet />
      </motion.div>
      
      <motion.div 
        className="mt-8 text-center text-sm text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        &copy; {new Date().getFullYear()} One Mind, Many. All rights reserved.
      </motion.div>
    </div>
  );
};

export default AuthLayout;