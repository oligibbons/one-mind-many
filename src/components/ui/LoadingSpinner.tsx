import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

const LoadingSpinner = ({ 
  size = 'md', 
  fullScreen = false,
  text = 'Loading...'
}: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className={`border-4 border-slate-700 border-t-orange-500 rounded-full ${sizeMap[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className="mt-4 text-slate-400\" style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}>{text}</p>}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950/90 z-50">
        {spinner}
      </div>
    );
  }
  
  return spinner;
};

export default LoadingSpinner;