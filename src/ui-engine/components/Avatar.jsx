import React from 'react';
import { cn } from '../utils/cn';

export function Avatar({
  children,
  size = 'md', // xs | sm | md | lg | xl
  className,
  ...props
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  }[size] || 'w-10 h-10 text-sm';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold overflow-hidden select-none',
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallbackText({ children, className }) {
  return <span className={cn('uppercase font-bold', className)}>{children}</span>;
}

export function AvatarImage({ src, alt = 'Avatar', className }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={cn('w-full h-full object-cover', className)}
    />
  );
}

export function AvatarBadge({ className }) {
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900',
        className
      )}
    />
  );
}
