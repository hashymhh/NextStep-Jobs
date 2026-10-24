import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  verified?: boolean;
  openToWork?: boolean;
  openToHiring?: boolean;
  className?: string;
}

const AVATAR_PALETTE = [
  '#0A66C2',
  '#0F766E',
  '#1D4ED8',
  '#047857',
  '#334155',
  '#1E3A8A',
  '#0369A1',
  '#115E59',
];

function getInitials(name: string): string {
  const parts = (name || 'Member').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  verified = false,
  openToWork = false,
  openToHiring = false,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: { dim: 'w-6 h-6 text-[10px]', ring: 'ring-1' },
    sm: { dim: 'w-8 h-8 text-xs', ring: 'ring-2' },
    md: { dim: 'w-12 h-12 text-sm', ring: 'ring-2' },
    lg: { dim: 'w-16 h-16 text-base', ring: 'ring-[3px]' },
    xl: { dim: 'w-24 h-24 text-xl', ring: 'ring-4' },
    '2xl': { dim: 'w-32 h-32 text-2xl', ring: 'ring-4' },
  };

  const currentSize = sizeMap[size];
  const initials = getInitials(name);
  const bgColor = getColorForName(name);

  const ringColor = openToWork
    ? 'ring-[#057642] ring-offset-2 ring-offset-white dark:ring-offset-[#161B22]'
    : openToHiring
    ? 'ring-[#0A66C2] ring-offset-2 ring-offset-white dark:ring-offset-[#161B22]'
    : '';

  const showImage = Boolean(src) && !imgError;

  return (
    <div className={`relative inline-block select-none flex-shrink-0 ${className}`}>
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-semibold tracking-tight text-white ${
          currentSize.dim
        } ${ringColor ? `${currentSize.ring} ${ringColor}` : ''}`}
        style={!showImage ? { backgroundColor: bgColor } : undefined}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>

      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-[#161B22] rounded-full text-[#0A66C2] dark:text-[#71B7FB] shadow-xs"
          title="Verified Professional"
        >
          <CheckCircle2
            className={size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
            fill="currentColor"
            stroke="white"
          />
        </span>
      )}
    </div>
  );
};
