import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glowing' | 'game';
  border?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  className = '',
  variant = 'default',
  border = true,
  children,
  ...props
}, ref) => {
  
  const baseClasses = 'rounded-lg bg-slate-900/70 backdrop-blur-sm shadow-md overflow-hidden paper-texture-dark';
  
  const variantClasses = {
    default: '',
    interactive: 'transition-all hover:shadow-lg hover:bg-slate-800/70 cursor-pointer',
    glowing: 'animate-glow',
    game: 'game-card',
  };
  
  const borderClasses = border ? 'border border-slate-800' : '';
  
  const cardVariants = {
    initial: { scale: 1 },
    hover: variant === 'interactive' ? { scale: 1.02 } : {},
  };

  return (
    <motion.div
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${borderClasses} ${className}`}
      {...props}
      initial="initial"
      whileHover="hover"
      variants={cardVariants}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

export default Card;