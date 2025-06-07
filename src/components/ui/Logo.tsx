import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  clickable?: boolean;
}

const Logo = ({ size = 'md', variant = 'full', clickable = true }: LogoProps) => {
  const sizeClasses = {
    sm: { height: '32px', fontSize: 'text-lg' },
    md: { height: '40px', fontSize: 'text-xl' },
    lg: { height: '48px', fontSize: 'text-2xl' },
  };
  
  const logoVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 }
  };

  const content = (
    <motion.div 
      className="flex items-center gap-3"
      initial="initial"
      whileHover={clickable ? "hover" : "initial"}
      variants={logoVariants}
    >
      <motion.img
        src="/OneMindMay Logo - long.png"
        alt="One Mind, Many"
        style={{ height: sizeClasses[size].height }}
        className="object-contain"
        variants={{
          initial: { scale: 1 },
          hover: { scale: 1.02 }
        }}
      />
    </motion.div>
  );

  if (clickable) {
    return (
      <Link to="/" className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;