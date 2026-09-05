import React from 'react';
import { cn } from '../utils/cn';

export function Toast({
  children,
  action = 'info', // info | success | warning | error
  className,
  ...props
}) {
  const actionStyles = {
    info: 'bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800 text-slate-800 dark:text-slate-100',
    success: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
    warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    error: 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
  }[action] || 'bg-white border-slate-200 text-slate-800';

  return (
    <div
      role="status"
      className={cn('p-4 rounded-xl border shadow-lg flex flex-col gap-1 max-w-sm', actionStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ToastTitle({ children, className }) {
  return <div className={cn('text-sm font-bold', className)}>{children}</div>;
}

export function ToastDescription({ children, className }) {
  return <div className={cn('text-xs opacity-90 leading-relaxed', className)}>{children}</div>;
}
