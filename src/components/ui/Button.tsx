import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'game';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  as: Component = 'button', // <-- This line is correct
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  ...props
}, ref) => {

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none paper-texture';

  const variantClasses = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-slate-500',
    outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 focus-visible:ring-slate-500',
    ghost: 'bg-transparent hover:bg-slate-800 focus-visible:ring-slate-500',
    game: 'game-button',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 py-3 text-base',
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: variant === 'game' ? 1.05 : 1.03 },
    tap: { scale: variant === 'game' ? 0.95 : 0.97 }
  };

  // --- THIS IS THE FIX ---
  // We create a dynamic component that is either 'button' or 'Link'
  // and wrap it with 'motion'.
  const MotionComponent = motion(Component);

  return (
    // We render the dynamic MotionComponent here instead of a hard-coded 'motion.button'
    <MotionComponent
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || props.disabled}
      style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
      {...props} // This correctly passes 'to="/login"' to the Link component
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </MotionComponent>
  );
});

Button.displayName = 'Button';