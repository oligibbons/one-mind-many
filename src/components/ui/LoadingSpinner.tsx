import React from 'react';
import clsx from 'clsx';
// Use your project's icon for a thematic loader
import GameIcon from '/OneMindMany Icon PNG Orange.png';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
}) => {
  // Map size prop to valid Tailwind CSS classes
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <img
        src={GameIcon}
        alt="Loading..."
        className={clsx(
          'animate-pulse opacity-75', // Thematic pulse animation
          sizeClasses[size]
        )}
      />
    </div>
  );
};