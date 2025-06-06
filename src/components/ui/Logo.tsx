import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  clickable?: boolean;
}

const Logo = ({ size = 'md', variant = 'full', clickable = true }: LogoProps) => {
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

  const content = (
    <motion.div 
      className="flex items-center gap-2"
      initial="initial"
      whileHover={clickable ? "hover" : "initial"}
      style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
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
          style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
        >
          <span className="text-white">One Mind,</span>
          <span className="text-orange-500"> Many</span>
        </motion.div>
      )}
    </motion.div>
  );

  return content;
};

export default Logo;