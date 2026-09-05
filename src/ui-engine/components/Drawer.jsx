import React from 'react';
import { cn } from '../utils/cn';

export function Drawer({
  isOpen = false,
  children,
  className
}) {
  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 z-50 overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function DrawerBackdrop({ onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={cn('fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in', className)}
    />
  );
}

export function DrawerContent({ children, anchor = 'right', className }) {
  const anchorClasses = {
    right: 'right-0 top-0 bottom-0 w-full max-w-md animate-in slide-in-from-right duration-200 border-l',
    left: 'left-0 top-0 bottom-0 w-full max-w-md animate-in slide-in-from-left duration-200 border-r',
    bottom: 'bottom-0 left-0 right-0 max-h-[85vh] animate-in slide-in-from-bottom duration-200 border-t rounded-t-3xl',
    top: 'top-0 left-0 right-0 max-h-[85vh] animate-in slide-in-from-top duration-200 border-b rounded-b-3xl'
  }[anchor] || 'right-0 top-0 bottom-0 w-full max-w-md animate-in slide-in-from-right duration-200 border-l';

  return (
    <div
      className={cn(
        'fixed z-10 bg-white dark:bg-[#1e1e2d] border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col',
        anchorClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DrawerHeader({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800', className)}>
      <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}

export function DrawerBody({ children, className }) {
  return (
    <div className={cn('flex-1 px-6 py-4 overflow-y-auto text-slate-600 dark:text-slate-300', className)}>
      {children}
    </div>
  );
}

export function DrawerFooter({ children, className }) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
