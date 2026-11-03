import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'income' | 'expense' | 'profit' | 'loss' | 'neutral' | 'offline';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  ...props
}) => {
  const variantStyles = {
    income: 'bg-citron-lime-tint text-blackstone border border-citron-lime',
    expense: 'bg-vivid-amber-tint text-blackstone border border-vivid-amber',
    profit: 'bg-citron-lime-tint text-blackstone border border-citron-lime',
    loss: 'bg-vivid-amber-tint text-blackstone border border-vivid-amber',
    neutral: 'bg-surface text-blackstone border border-blackstone',
    offline: 'bg-white text-blackstone border border-blackstone shadow-brutal-sm',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold leading-tight select-none',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
