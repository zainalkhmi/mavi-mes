import React, { createContext, useContext } from 'react';
import { cn } from '../utils/cn';
import { Check } from 'lucide-react';

const CheckboxContext = createContext({
  isChecked: false,
  isDisabled: false,
  onChange: () => {}
});

export function Checkbox({
  children,
  isChecked = false,
  defaultIsChecked = false,
  onChange,
  isDisabled = false,
  size = 'md', // sm | md | lg
  className,
  ...props
}) {
  const [checked, setChecked] = React.useState(defaultIsChecked);
  const currentChecked = isChecked !== undefined ? isChecked : checked;

  const handleToggle = () => {
    if (isDisabled) return;
    const next = !currentChecked;
    setChecked(next);
    if (onChange) onChange(next);
  };

  return (
    <CheckboxContext.Provider value={{ isChecked: currentChecked, isDisabled, onChange: handleToggle, size }}>
      <label
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center gap-2.5 cursor-pointer select-none group',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </label>
    </CheckboxContext.Provider>
  );
}

export function CheckboxIndicator({ className }) {
  const { isChecked, size } = useContext(CheckboxContext);

  const sizeBox = {
    sm: 'w-4 h-4 rounded',
    md: 'w-5 h-5 rounded-md',
    lg: 'w-6 h-6 rounded-lg'
  }[size] || 'w-5 h-5 rounded-md';

  return (
    <div
      className={cn(
        'flex items-center justify-center border transition-all duration-150',
        sizeBox,
        isChecked
          ? 'bg-[#714b67] border-[#714b67] text-white shadow-sm'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-[#714b67]',
        className
      )}
    >
      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
    </div>
  );
}

export function CheckboxLabel({ children, className }) {
  const { size } = useContext(CheckboxContext);
  const sizeText = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size] || 'text-sm';

  return (
    <span className={cn('text-slate-800 dark:text-slate-100 font-medium', sizeText, className)}>
      {children}
    </span>
  );
}

export function CheckboxIcon({ as: Component, className }) {
  const IconComponent = Component || Check;
  return <IconComponent className={cn('w-3.5 h-3.5', className)} />;
}

export function CheckboxGroup({ children, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {children}
    </div>
  );
}
