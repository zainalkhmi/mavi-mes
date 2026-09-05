import React, { useState, createContext, useContext } from 'react';
import { cn } from '../utils/cn';
import { ChevronDown, Check } from 'lucide-react';

const SelectContext = createContext({
  isOpen: false,
  setIsOpen: () => {},
  selectedValue: null,
  setSelectedValue: () => {},
  selectedLabel: null,
  setSelectedLabel: () => {},
  isDisabled: false
});

export function Select({
  children,
  selectedValue,
  onValueChange,
  isDisabled = false,
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [val, setVal] = useState(selectedValue || '');
  const [label, setLabel] = useState('');

  const handleSelect = (itemVal, itemLabel) => {
    setVal(itemVal);
    setLabel(itemLabel);
    if (onValueChange) onValueChange(itemVal);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        setIsOpen,
        selectedValue: selectedValue !== undefined ? selectedValue : val,
        setSelectedValue: handleSelect,
        selectedLabel: label,
        setSelectedLabel: setLabel,
        isDisabled
      }}
    >
      <div className={cn('relative w-full', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className }) {
  const { isOpen, setIsOpen, isDisabled } = useContext(SelectContext);

  return (
    <div
      onClick={() => !isDisabled && setIsOpen(!isOpen)}
      className={cn(
        'flex items-center justify-between w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer text-sm transition-colors select-none',
        isOpen && 'border-[#714b67] ring-2 ring-[#714b67]/20',
        isDisabled && 'opacity-60 bg-slate-50 dark:bg-slate-800 cursor-not-allowed',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectInput({ placeholder = 'Select option...', className }) {
  const { selectedLabel, selectedValue } = useContext(SelectContext);

  return (
    <span className={cn('truncate', !selectedValue && 'text-slate-400', className)}>
      {selectedLabel || selectedValue || placeholder}
    </span>
  );
}

export function SelectIcon({ as: Component, className }) {
  const IconComponent = Component || ChevronDown;
  const { isOpen } = useContext(SelectContext);
  return (
    <IconComponent
      className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', isOpen && 'rotate-180', className)}
    />
  );
}

export function SelectPortal({ children }) {
  const { isOpen } = useContext(SelectContext);
  if (!isOpen) return null;
  return <>{children}</>;
}

export function SelectBackdrop({ onClick }) {
  const { setIsOpen } = useContext(SelectContext);
  return (
    <div
      onClick={() => {
        setIsOpen(false);
        if (onClick) onClick();
      }}
      className="fixed inset-0 z-40 bg-transparent"
    />
  );
}

export function SelectContent({ children, className }) {
  return (
    <div
      className={cn(
        'absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-sm animate-in fade-in zoom-in-95',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({ label, value, isDisabled = false, className }) {
  const { selectedValue, setSelectedValue } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      onClick={() => {
        if (!isDisabled) setSelectedValue(value, label);
      }}
      className={cn(
        'flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors text-slate-800 dark:text-slate-100 select-none',
        isSelected ? 'bg-[#714b67]/10 text-[#714b67] dark:text-[#dcbfd3] font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span>{label}</span>
      {isSelected && <Check className="w-4 h-4 text-[#714b67] dark:text-[#dcbfd3]" />}
    </div>
  );
}
