import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-extrabold rounded-control border-2 border-blackstone transition-all duration-100 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none neo-press';

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5 shadow-brutal-sm',
    md: 'h-12 px-4 text-sm gap-2 shadow-brutal',
    lg: 'h-14 px-6 text-base gap-2.5 shadow-brutal-lg',
  };

  const variantStyles = {
    primary: 'bg-slate-navy text-white hover:bg-slate-navy-dark',
    secondary: 'bg-surface text-blackstone hover:bg-canvas',
    destructive: 'bg-white text-danger border-danger hover:bg-danger/5',
    outline: 'bg-transparent text-blackstone hover:bg-blackstone/5',
    ghost: 'bg-transparent text-blackstone border-transparent shadow-none hover:bg-blackstone/5 neo-press-none',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className
        )
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
