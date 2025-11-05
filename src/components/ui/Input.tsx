import { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  label,
  error,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-slate-300"
          style={{ fontFamily: "'CustomHeading', 'Quicksand', system-ui, sans-serif" }}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          disabled={disabled}
          className={`
            block w-full rounded-md border px-3 py-2 text-sm text-white
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error 
              ? 'border-red-500 bg-red-950/10 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-slate-700 bg-slate-800/50 focus:border-orange-500 focus:ring-orange-500/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
            focus:outline-none focus:ring-2
            placeholder:text-slate-500
            transition-all duration-200
            ${className}
          `}
          style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          className="text-sm text-red-500"
          style={{ fontFamily: "'Quicksand', system-ui, sans-serif" }}
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Removed 'export default Input;'