import React, { useState, createContext, useContext } from 'react';
import { cn } from '../utils/cn';
import { ChevronDown } from 'lucide-react';

const AccordionContext = createContext({
  openItems: [],
  toggleItem: () => {}
});

export function Accordion({
  children,
  type = 'single', // single | multiple
  defaultValue = [],
  className
}) {
  const [openItems, setOpenItems] = useState(
    Array.isArray(defaultValue) ? defaultValue : (defaultValue ? [defaultValue] : [])
  );

  const toggleItem = (val) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(val) ? [] : [val];
      }
      return prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn('w-full divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = createContext({ value: '', isOpen: false });

export function AccordionItem({ value, children, className }) {
  const { openItems } = useContext(AccordionContext);
  const isOpen = openItems.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div className={cn('bg-white dark:bg-[#1e1e2d]', className)}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionHeader({ children, className }) {
  return <div className={cn('flex', className)}>{children}</div>;
}

export function AccordionTrigger({ children, className }) {
  const { toggleItem } = useContext(AccordionContext);
  const { value, isOpen } = useContext(AccordionItemContext);

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        'flex items-center justify-between w-full px-5 py-4 text-left font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none',
        className
      )}
    >
      {children}
      <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0', isOpen && 'rotate-180')} />
    </button>
  );
}

export function AccordionTitleText({ children, className }) {
  return <span className={cn('text-sm font-semibold', className)}>{children}</span>;
}

export function AccordionIcon({ as: Component, className }) {
  if (!Component) return null;
  return <Component className={cn('w-4 h-4 shrink-0', className)} />;
}

export function AccordionContent({ children, className }) {
  const { isOpen } = useContext(AccordionItemContext);
  if (!isOpen) return null;

  return (
    <div className={cn('px-5 pb-4 pt-1 text-sm text-slate-600 dark:text-slate-300 animate-in fade-in', className)}>
      {children}
    </div>
  );
}

export function AccordionContentText({ children, className }) {
  return <p className={cn('leading-relaxed', className)}>{children}</p>;
}
