import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';

export function Dropdown({ children, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative inline-block text-left', className)}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === DropdownTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen((prev) => !prev),
            isOpen
          });
        }
        if (child.type === DropdownMenu) {
          return isOpen ? React.cloneElement(child, { onClose: () => setIsOpen(false) }) : null;
        }
        return child;
      })}
    </div>
  );
}

export function DropdownTrigger({ children, onClick, className }) {
  return (
    <div onClick={onClick} className={cn('cursor-pointer inline-flex', className)}>
      {children}
    </div>
  );
}

export function DropdownMenu({ children, onClose, className }) {
  return (
    <div
      className={cn(
        'absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 focus:outline-none animate-in fade-in zoom-in-95',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;
        return React.cloneElement(child, {
          onItemClick: () => {
            if (child.props.onClick) child.props.onClick();
            if (onClose) onClose();
          }
        });
      })}
    </div>
  );
}

export function MenuItem({ children, onItemClick, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onItemClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function MenuItemLabel({ children, className }) {
  return <span className={cn('truncate font-medium', className)}>{children}</span>;
}
