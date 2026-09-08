import React from 'react';
import { cn } from '../utils/cn';
import useRipple from '../utils/useRipple';

export function BottomNavigation({ children, className }) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1e1e2d]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center justify-around shadow-lg shadow-black/5',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
  const { rippleRef, handleRipple, rippleContainerStyle } = useRipple({
    color: active ? '#714b67' : 'currentColor',
    opacity: 0.1,
    centered: true
  });

  const handleClick = (e) => {
    handleRipple(e);
    // Haptic feedback
    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch {}
    }
    if (onClick) onClick(e);
  };

  return (
    <button
      ref={rippleRef}
      type="button"
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors select-none rounded-2xl',
        active
          ? 'text-[#714b67] dark:text-[#dcbfd3] font-bold'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
        className
      )}
      style={{ ...rippleContainerStyle, minHeight: '48px' }}
    >
      <div className="relative">
        {/* Active indicator pill (MD3 pattern) */}
        {active && (
          <div className="absolute -inset-x-3 -inset-y-0.5 rounded-full bg-[#714b67]/10 dark:bg-[#714b67]/20" />
        )}
        {Icon && <Icon className={cn('w-5 h-5 relative z-10 transition-transform', active && 'scale-110')} />}
        {badge !== null && (
          <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-bold z-20">
            {badge}
          </span>
        )}
      </div>
      <span>{label}</span>
    </button>
  );
}

