import React from 'react';

export const Skeleton: React.FC<{
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}> = ({ className = '', variant = 'rectangular', width, height }) => {
  const variantStyles = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4 my-1',
  };

  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-gray-200 dark:bg-gray-700/60 ${variantStyles[variant]} ${className}`}
    />
  );
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1B1F23] rounded-[8px] border border-[#E0DFDC] dark:border-[#38434F] p-4 flex flex-col gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-48 w-full mt-2 rounded-lg" />
      <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
};
