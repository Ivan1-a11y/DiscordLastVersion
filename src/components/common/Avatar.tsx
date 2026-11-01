import React from 'react';
import { UserStatus } from '../../types';
import { StatusBadge } from './StatusBadge';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  isSpeaking?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  isSpeaking = false,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6 text-[10px]', badgeSize: 'sm' as const, badgeOffset: '-bottom-0.5 -right-0.5' },
    sm: { box: 'w-8 h-8 text-xs', badgeSize: 'sm' as const, badgeOffset: '-bottom-0.5 -right-0.5' },
    md: { box: 'w-10 h-10 text-sm', badgeSize: 'md' as const, badgeOffset: '-bottom-1 -right-1' },
    lg: { box: 'w-16 h-16 text-lg', badgeSize: 'lg' as const, badgeOffset: 'bottom-0 right-0' },
    xl: { box: 'w-20 h-20 text-2xl', badgeSize: 'lg' as const, badgeOffset: 'bottom-0.5 right-0.5' },
  }[size];

  // Generate consistent initials
  const initials = (name || '?')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`relative inline-block select-none shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-semibold bg-[#5865F2] text-white transition-all duration-150 ${sizeMap.box} ${
          isSpeaking ? 'speaking-ring' : ''
        }`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <div className={`absolute ${sizeMap.badgeOffset}`}>
          <StatusBadge status={status} size={sizeMap.badgeSize} />
        </div>
      )}
    </div>
  );
};
