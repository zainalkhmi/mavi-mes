import React from 'react';
import { cn } from '../utils/cn';

export function Badge({
  children,
  action = 'info', // info | success | warning | error | muted
  variant = 'solid', // solid | outline
  size = 'md', // sm | md | lg
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-md',
    md: 'px-2.5 py-0.5 text-xs gap-1.5 rounded-lg',
    lg: 'px-3 py-1 text-sm gap-2 rounded-xl'
  }[size] || 'px-2.5 py-0.5 text-xs gap-1.5 rounded-lg';

  const actionSolid = {
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    error: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    muted: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }[action] || 'bg-slate-100 text-slate-700';

  const actionOutline = {
    info: 'border border-sky-400 text-sky-700 dark:text-sky-300',
    success: 'border border-emerald-500 text-emerald-700 dark:text-emerald-300',
    warning: 'border border-amber-500 text-amber-700 dark:text-amber-300',
    error: 'border border-rose-500 text-rose-700 dark:text-rose-300',
    muted: 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
  }[action] || 'border border-slate-300 text-slate-600';

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold select-none shrink-0 tracking-wide',
        sizeClasses,
        variant === 'outline' ? actionOutline : actionSolid,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function BadgeText({ children, className }) {
  return <span className={cn('truncate', className)}>{children}</span>;
}

export function BadgeIcon({ as: Component, className }) {
  if (!Component) return null;
  return <Component className={cn('w-3 h-3 shrink-0', className)} />;
}
