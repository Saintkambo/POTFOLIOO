import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadowSize?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  shadowSize = 'lg',
  ...props
}) => {
  const shadowStyles = {
    sm: 'shadow-brutal-sm',
    md: 'shadow-brutal',
    lg: 'shadow-brutal-lg',
    none: 'shadow-none',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface border-2 border-blackstone rounded-card p-4',
          shadowStyles[shadowSize],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
