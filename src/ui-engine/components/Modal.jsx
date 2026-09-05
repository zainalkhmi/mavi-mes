import React from 'react';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';

export function Modal({
  isOpen = false,
  children,
  className
}) {
  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto', className)}>
      {children}
    </div>
  );
}

export function ModalBackdrop({ onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in',
        className
      )}
    />
  );
}

export function ModalContent({ children, size = 'md', className }) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full w-full h-full rounded-none'
  }[size] || 'max-w-md';

  return (
    <div
      className={cn(
        'relative z-10 w-full bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150',
        sizeClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalHeader({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800', className)}>
      <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}

export function ModalCloseButton({ onClose, className }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        'p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
        className
      )}
    >
      <X className="w-4 h-4" />
    </button>
  );
}

export function ModalBody({ children, className }) {
  return (
    <div className={cn('px-6 py-4 max-h-[70vh] overflow-y-auto text-sm text-slate-600 dark:text-slate-300', className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30', className)}>
      {children}
    </div>
  );
}

// Alias Dialog to Modal for complete API compatibility
export const Dialog = Modal;
export const DialogBackdrop = ModalBackdrop;
export const DialogContent = ModalContent;
export const DialogHeader = ModalHeader;
export const DialogCloseButton = ModalCloseButton;
export const DialogBody = ModalBody;
export const DialogFooter = ModalFooter;
