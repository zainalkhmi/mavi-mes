import React from 'react';
import { cn } from '../utils/cn';

export function Navigation({ children, className }) {
  return (
    <nav className={cn('flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1e1e2d] border-b border-slate-200 dark:border-slate-800', className)}>
      {children}
    </nav>
  );
}

export function NavigationBrand({ children, className }) {
  return (
    <div className={cn('flex items-center gap-2.5 font-bold text-base text-slate-800 dark:text-slate-100', className)}>
      {children}
    </div>
  );
}

export function NavigationItems({ children, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}

export function NavigationItem({ children, active = false, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors',
        active
          ? 'bg-[#714b67] text-white shadow-xs'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        className
      )}
    >
      {children}
    </button>
  );
}
