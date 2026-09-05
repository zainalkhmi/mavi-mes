import React from 'react';
import { cn } from '../utils/cn';

export function Textarea({
  children,
  isInvalid = false,
  isDisabled = false,
  className,
  ...props
}) {
  const borderClass = isInvalid
    ? 'border-rose-500 focus-within:ring-2 focus-within:ring-rose-400/30'
    : 'border-slate-300 dark:border-slate-700 focus-within:border-[#714b67] focus-within:ring-2 focus-within:ring-[#714b67]/20';

  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-slate-900 border rounded-xl p-3 transition-colors duration-150',
        borderClass,
        isDisabled && 'opacity-60 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TextareaInput({
  className,
  placeholder,
  value,
  defaultValue,
  onChange,
  rows = 3,
  ...props
}) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      className={cn(
        'w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-y text-sm',
        className
      )}
      {...props}
    />
  );
}
