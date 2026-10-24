import React from 'react';
import { ShieldCheck, CheckCircle } from 'lucide-react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple' | 'verified';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  className = '',
  icon,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
  };

  const variantStyles = {
    primary:
      'bg-[#0A66C2]/10 text-[#0A66C2] dark:bg-[#71B7FB]/15 dark:text-[#71B7FB]',
    secondary:
      'bg-gray-100 text-[#666666] dark:bg-gray-800 dark:text-gray-300',
    success:
      'bg-[#E6F4EA] text-[#057642] dark:bg-[#0B291A] dark:text-[#34A853]',
    warning:
      'bg-[#FEF7E0] text-[#C37D16] dark:bg-[#332509] dark:text-[#F9AB00]',
    danger:
      'bg-[#FCE8E6] text-[#CC1016] dark:bg-[#331314] dark:text-[#EA4335]',
    purple:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    verified:
      'bg-[#0A66C2] text-white dark:bg-[#71B7FB] dark:text-gray-900',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
};

export const VerifiedBadge: React.FC<{ role?: string; className?: string }> = ({
  role = 'recruiter',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] dark:text-[#71B7FB] bg-[#0A66C2]/10 dark:bg-[#71B7FB]/15 px-2 py-0.5 rounded-full ${className}`}
      title={role === 'admin' ? 'NextStep Platform Administrator' : 'Verified Recruiter'}
    >
      {role === 'admin' ? (
        <ShieldCheck className="w-3.5 h-3.5" />
      ) : (
        <CheckCircle className="w-3.5 h-3.5" />
      )}
      <span>{role === 'admin' ? 'Admin' : 'Verified Recruiter'}</span>
    </span>
  );
};
