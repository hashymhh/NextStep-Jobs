import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#191919] dark:text-gray-200">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-500 pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full text-sm rounded-md border transition-colors duration-150 py-2 px-3 bg-white dark:bg-[#1B1F23] text-[#191919] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] dark:focus:ring-[#71B7FB] ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              error
                ? 'border-[#CC1016] focus:ring-[#CC1016]'
                : 'border-[#E0DFDC] dark:border-[#38434F] hover:border-gray-400 dark:hover:border-gray-500'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-gray-500 flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-[#CC1016] dark:text-[#E02424] font-medium">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
