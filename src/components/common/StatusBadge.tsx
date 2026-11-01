import React from 'react';
import { UserStatus } from '../../types';

interface StatusBadgeProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3.5 h-3.5 border-2',
    lg: 'w-4 h-4 border-2',
  }[size];

  switch (status) {
    case 'ONLINE':
      return (
        <span
          title="Online"
          className={`rounded-full bg-[#23a55a] border-[#2b2d31] inline-block shrink-0 ${sizeClasses} ${className}`}
        />
      );
    case 'IDLE':
      return (
        <span
          title="Idle"
          className={`rounded-full bg-[#f0b232] border-[#2b2d31] inline-block shrink-0 relative ${sizeClasses} ${className}`}
        >
          <span className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full bg-[#2b2d31]" />
        </span>
      );
    case 'DND':
      return (
        <span
          title="Do Not Disturb"
          className={`rounded-full bg-[#f23f43] border-[#2b2d31] inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-0.5 bg-white rounded-xs" />
        </span>
      );
    case 'OFFLINE':
    default:
      return (
        <span
          title="Offline"
          className={`rounded-full bg-[#80848e] border-[#2b2d31] inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2b2d31]" />
        </span>
      );
  }
};
