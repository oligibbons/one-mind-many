import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <AlertTriangle className="w-20 h-20 text-orange-500 mx-auto" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          404 - Page Not Found
        </h1>
        
        <p className="text-xl text-slate-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/">
          <Button leftIcon={<Home size={18} />}>
            Return Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;