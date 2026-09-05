import React from 'react';
import { cn } from '../utils/cn';
import { Search } from 'lucide-react';

export function Command({ children, className }) {
  return (
    <div className={cn('w-full bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function CommandInput({ placeholder = 'Type a command or search...', value, onChange, onValueChange, className }) {
  const handleChange = (e) => {
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(e.target.value);
  };

  return (
    <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
      <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={cn(
          'w-full py-3 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none',
          className
        )}
      />
    </div>
  );
}

export function CommandList({ children, className }) {
  return (
    <div className={cn('max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40', className)}>
      {children}
    </div>
  );
}

export function CommandItem({ children, onSelect, className }) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-[#714b67]/10 hover:text-[#714b67] dark:hover:text-[#dcbfd3] transition-colors select-none',
        className
      )}
    >
      {children}
    </div>
  );
}
