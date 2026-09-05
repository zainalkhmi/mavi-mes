import React, { useState } from 'react';
import { cn } from '../utils/cn';

export function Switch({
  value = false,
  defaultValue = false,
  onToggle,
  onValueChange,
  isDisabled = false,
  size = 'md', // sm | md | lg
  className,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isChecked = value !== undefined ? value : internalValue;

  const handleToggle = () => {
    if (isDisabled) return;
    const next = !isChecked;
    setInternalValue(next);
    if (onToggle) onToggle(next);
    if (onValueChange) onValueChange(next);
  };

  const dimensions = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
  }[size] || { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={isDisabled}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#714b67]/30',
        dimensions.track,
        isChecked ? 'bg-[#714b67]' : 'bg-slate-300 dark:bg-slate-700',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ml-0.5',
          dimensions.thumb,
          isChecked ? dimensions.translate : 'translate-x-0'
        )}
      />
    </button>
  );
}
