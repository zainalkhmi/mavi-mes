import React from 'react';
import { cn } from '../utils/cn';

export function Card({
  children,
  size = 'md', // sm | md | lg
  variant = 'elevated', // elevated | outline | filled
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'p-3 rounded-xl',
    md: 'p-4 sm:p-5 rounded-2xl',
    lg: 'p-6 rounded-3xl'
  }[size] || 'p-4 sm:p-5 rounded-2xl';

  const variantClasses = {
    elevated: 'bg-white dark:bg-[#1e1e2d] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none',
    outline: 'bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-700',
    filled: 'bg-slate-50 dark:bg-slate-800/80 border border-transparent'
  }[variant] || 'bg-white dark:bg-[#1e1e2d] border border-slate-100 dark:border-slate-800 shadow-sm';

  return (
    <div
      className={cn(
        'transition-all duration-200 text-slate-800 dark:text-slate-100',
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn('text-slate-800 dark:text-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  );
}
