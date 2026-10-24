import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9',
      lg: 'text-base px-6 py-2.5 gap-2.5 h-11',
    };

    const variantStyles = {
      primary:
        'bg-[#0A66C2] text-white hover:bg-[#004182] focus:ring-[#0A66C2] dark:bg-[#71B7FB] dark:text-[#1B1F23] dark:hover:bg-[#98CBFF]',
      secondary:
        'border border-[#0A66C2] text-[#0A66C2] bg-transparent hover:bg-[#EBF4FD] hover:border-2 focus:ring-[#0A66C2] dark:border-[#71B7FB] dark:text-[#71B7FB] dark:hover:bg-[#12283E]',
      tertiary:
        'text-[#666666] hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10 focus:ring-black/20',
      danger:
        'bg-[#CC1016] text-white hover:bg-[#A30D11] focus:ring-[#CC1016] dark:bg-[#E02424] dark:hover:bg-[#B91C1C]',
      ghost:
        'text-current hover:bg-black/5 dark:hover:bg-white/5 focus:ring-black/10',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
