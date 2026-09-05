import React from 'react';
import { cn } from '../utils/cn';

export function FAB({
  children,
  placement = 'bottom right', // bottom right | bottom left | bottom center
  size = 'md', // sm | md | lg
  action = 'primary', // primary | secondary | positive
  onPress,
  onClick,
  className,
  ...props
}) {
  const placementClasses = {
    'bottom right': 'bottom-20 right-5 sm:bottom-6 sm:right-6',
    'bottom left': 'bottom-20 left-5 sm:bottom-6 sm:left-6',
    'bottom center': 'bottom-20 left-1/2 -translate-x-1/2 sm:bottom-6'
  }[placement] || 'bottom-20 right-5 sm:bottom-6 sm:right-6';

  const sizeClasses = {
    sm: 'h-10 px-3.5 gap-1.5 text-xs rounded-full',
    md: 'h-13 px-5 gap-2 text-sm rounded-full',
    lg: 'h-15 px-6 gap-2.5 text-base rounded-full'
  }[size] || 'h-13 px-5 gap-2 text-sm rounded-full';

  const actionClasses = {
    primary: 'bg-[#714b67] text-white hover:bg-[#5e3e56] shadow-lg shadow-[#714b67]/30',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-black/20',
    positive: 'bg-[#008784] text-white hover:bg-[#007370] shadow-lg shadow-[#008784]/30'
  }[action] || 'bg-[#714b67] text-white shadow-lg';

  const handleClick = (e) => {
    if (onPress) onPress(e);
    if (onClick) onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'fixed z-40 inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 active:scale-95 cursor-pointer select-none',
        placementClasses,
        sizeClasses,
        actionClasses,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function FabLabel({ children, className }) {
  return <span className={cn('whitespace-nowrap', className)}>{children}</span>;
}

export function FabIcon({ as: Component, className }) {
  if (!Component) return null;
  return <Component className={cn('w-5 h-5 shrink-0', className)} />;
}
