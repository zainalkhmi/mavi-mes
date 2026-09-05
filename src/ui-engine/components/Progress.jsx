import React from 'react';
import { cn } from '../utils/cn';

export function Progress({
  value = 0,
  size = 'md', // xs | sm | md | lg
  children,
  className,
  ...props
}) {
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }[size] || 'h-2.5';

  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden', sizeClasses, className)}
      {...props}
    >
      {children ? children : <ProgressFilledTrack value={clamped} />}
    </div>
  );
}

export function ProgressFilledTrack({ value = 0, className }) {
  return (
    <div
      style={{ width: `${value}%` }}
      className={cn('h-full bg-[#714b67] rounded-full transition-all duration-300 ease-out', className)}
    />
  );
}
