import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, leftIcon, rightElement, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blackstone/50 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full h-12 px-3.5 bg-surface text-blackstone font-medium rounded-control border-2 border-blackstone outline-none transition-all',
                'focus:ring-2 focus:ring-electric-sky focus:border-blackstone',
                leftIcon && 'pl-10',
                rightElement && 'pr-10',
                error && 'border-danger focus:ring-danger',
                className
              )
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p role="alert" className="text-xs font-bold text-danger mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-text-secondary mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
