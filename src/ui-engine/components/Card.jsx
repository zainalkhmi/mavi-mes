import React from 'react';
import { cn } from '../utils/cn';
import useRipple from '../utils/useRipple';

export function Card({
  children,
  size = 'md', // sm | md | lg
  variant = 'elevated', // elevated | outline | filled
  interactive,
  onClick,
  onPress,
  className,
  style,
  ...props
}) {
  const isInteractive = interactive || Boolean(onClick || onPress);
  const { rippleRef, handleRipple, rippleContainerStyle } = useRipple({
    color: 'currentColor',
    opacity: 0.08,
    disabled: !isInteractive
  });

  const handleClick = (e) => {
    if (isInteractive) {
      handleRipple(e);
      if (onClick) onClick(e);
      if (onPress) onPress(e);
    }
  };

  const sizeClasses = {
    sm: 'p-3 rounded-xl',
    md: 'p-4 sm:p-5 rounded-2xl',
    lg: 'p-6 rounded-3xl'
  }[size] || 'p-4 sm:p-5 rounded-2xl';

  const variantClasses = {
    elevated: 'bg-white dark:bg-[#1e1e2d] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-md transition-shadow',
    outline: 'bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-700 hover:border-slate-300',
    filled: 'bg-slate-50 dark:bg-slate-800/80 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
  }[variant] || 'bg-white dark:bg-[#1e1e2d] border border-slate-100 dark:border-slate-800 shadow-sm';

  return (
    <div
      ref={isInteractive ? rippleRef : undefined}
      onClick={isInteractive ? handleClick : onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={cn(
        'transition-all duration-200 text-slate-800 dark:text-slate-100',
        isInteractive && 'cursor-pointer select-none active:scale-[0.99]',
        sizeClasses,
        variantClasses,
        className
      )}
      style={{
        ...(isInteractive ? rippleContainerStyle : {}),
        ...style
      }}
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
