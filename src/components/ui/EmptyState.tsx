import React from 'react';
import { Button } from './Button';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#1B1F23] rounded-[8px] border border-[#E0DFDC] dark:border-[#38434F] ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-3">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-[#191919] dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-[#666666] dark:text-gray-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this section. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#1B1F23] rounded-[8px] border border-red-200 dark:border-red-900/40 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-[#CC1016] dark:text-[#E02424] flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#CC1016] dark:text-[#E02424] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#666666] dark:text-gray-400 max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
