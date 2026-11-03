import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface IconTileProps {
  icon: React.ReactNode;
  variant?: 'income' | 'expense' | 'brand' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IconTile: React.FC<IconTileProps> = ({
  icon,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-tile',
    lg: 'w-11 h-11 rounded-xl',
  };

  const variantStyles = {
    income: 'bg-citron-lime text-blackstone border border-blackstone shadow-brutal-sm',
    expense: 'bg-vivid-amber text-blackstone border border-blackstone shadow-brutal-sm',
    brand: 'bg-slate-navy text-white border border-blackstone shadow-brutal-sm',
    neutral: 'bg-canvas text-blackstone border border-blackstone shadow-brutal-sm',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'flex items-center justify-center shrink-0 transition-transform select-none',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
    >
      {icon}
    </div>
  );
};
