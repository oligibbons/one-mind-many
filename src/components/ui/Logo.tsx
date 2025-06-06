import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

const Logo = ({ size = 'md', variant = 'full' }: LogoProps) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };
  
  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 }
  };
  
  const textVariants = {
    initial: { opacity: 1 },
    hover: { opacity: 1 }
  };

  return (
    <Link to="/">
      <motion.div 
        className="flex items-center gap-2 logo brand"
        initial="initial"
        whileHover="hover"
      >
        <motion.div 
          className="text-orange-500"
          variants={iconVariants}
        >
          <Brain size={size === 'sm' ? 24 : size === 'md' ? 28 : 32} />
        </motion.div>
        
        {variant === 'full' && (
          <motion.div 
            className={`font-bold tracking-tight ${sizeClasses[size]}`}
            variants={textVariants}
            style={{ fontFamily: "'CustomHeading', 'SpaceGrotesk', system-ui, sans-serif" }}
          >
            <span className="text-white">One Mind,</span>
            <span className="text-orange-500"> Many</span>
          </motion.div>
        )}
      </motion.div>
    </Link>
  );
};

export default Logo;