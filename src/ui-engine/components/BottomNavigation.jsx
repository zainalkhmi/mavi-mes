import React from 'react';
import { cn } from '../utils/cn';

export function BottomNavigation({ children, className }) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1e1e2d]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center justify-around shadow-lg shadow-black/5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BottomNavigationItem({
  icon: Icon,
  label,
  active = false,
  badge = null,
  onClick,
  className
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors select-none',
        active
          ? 'text-[#714b67] dark:text-[#dcbfd3] font-bold'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
        className
      )}
    >
      <div className="relative">
        {Icon && <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />}
        {badge !== null && (
          <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-bold">
            {badge}
          </span>
        )}
      </div>
      <span>{label}</span>
    </button>
  );
}
