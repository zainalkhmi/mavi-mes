import React from 'react';
import { cn } from '../utils/cn';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  action = 'primary', // primary | secondary | positive | negative | default
  variant = 'solid', // solid | outline | link
  size = 'md', // xs | sm | md | lg | xl
  isDisabled = false,
  isLoading = false,
  onPress,
  onClick,
  className,
  ...props
}) {
  const handleClick = (e) => {
    if (isDisabled || isLoading) return;
    if (onPress) onPress(e);
    if (onClick) onClick(e);
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-md',
    sm: 'px-3 py-1.5 text-xs font-medium gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm font-semibold gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-base font-semibold gap-2.5 rounded-xl',
    xl: 'px-6 py-3 text-lg font-bold gap-3 rounded-2xl'
  }[size] || 'px-4 py-2 text-sm font-semibold gap-2 rounded-xl';

  const actionSolid = {
    primary: 'bg-[#714b67] text-white hover:bg-[#5d3d54] active:bg-[#4d3246] shadow-sm',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900',
    positive: 'bg-[#008784] text-white hover:bg-[#00706d] active:bg-[#005c59] shadow-sm',
    negative: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
    default: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100'
  }[action] || 'bg-[#714b67] text-white';

  const actionOutline = {
    primary: 'border border-[#714b67] text-[#714b67] hover:bg-[#714b67]/10 dark:text-[#dcbfd3]',
    secondary: 'border border-slate-400 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
    positive: 'border border-[#008784] text-[#008784] hover:bg-[#008784]/10 dark:text-[#5eead4]',
    negative: 'border border-rose-600 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40',
    default: 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
  }[action] || 'border border-slate-300 text-slate-700';

  const actionLink = {
    primary: 'text-[#714b67] hover:underline p-0 bg-transparent',
    secondary: 'text-slate-700 hover:underline p-0 bg-transparent dark:text-slate-300',
    positive: 'text-[#008784] hover:underline p-0 bg-transparent',
    negative: 'text-rose-600 hover:underline p-0 bg-transparent',
    default: 'text-slate-600 hover:underline p-0 bg-transparent'
  }[action] || 'text-[#714b67] hover:underline p-0';

  const variantClass = variant === 'solid' ? actionSolid : (variant === 'outline' ? actionOutline : actionLink);

  return (
    <button
      type="button"
      disabled={isDisabled || isLoading}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#714b67]/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        sizeClasses,
        variantClass,
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {children}
    </button>
  );
}

export function ButtonText({ children, className }) {
  return <span className={cn('truncate', className)}>{children}</span>;
}

export function ButtonIcon({ as: Component, icon, className }) {
  const IconComponent = Component || icon;
  if (!IconComponent) return null;
  return <IconComponent className={cn('w-4 h-4 shrink-0', className)} />;
}

export function ButtonGroup({ children, space = 'md', isAttached = false, className }) {
  const spaceClass = {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-3'
  }[space] || 'gap-2';

  return (
    <div className={cn('inline-flex items-center', isAttached ? 'divide-x divide-slate-200 dark:divide-slate-700 -space-x-px' : spaceClass, className)}>
      {children}
    </div>
  );
}

export function ButtonSpinner({ className }) {
  return <Loader2 className={cn('w-4 h-4 animate-spin', className)} />;
}
