import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  bordered = true,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`rounded-[8px] bg-white dark:bg-[#1B1F23] text-[#191919] dark:text-white/90 ${
        bordered ? 'border border-[#E0DFDC] dark:border-[#38434F]' : ''
      } shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-150 ${
        paddingStyles[padding]
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
