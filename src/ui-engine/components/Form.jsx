import React, { createContext, useContext } from 'react';
import { cn } from '../utils/cn';
import { AlertCircle } from 'lucide-react';

const FormContext = createContext({
  isInvalid: false,
  isRequired: false,
  isDisabled: false,
  isReadOnly: false,
  size: 'md'
});

export function Form({ children, className, onSubmit, ...props }) {
  const handleSubmit = (e) => {
    if (onSubmit) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4 w-full', className)} {...props}>
      {children}
    </form>
  );
}

export function FormControl({
  children,
  isInvalid = false,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  size = 'md',
  className
}) {
  return (
    <FormContext.Provider value={{ isInvalid, isRequired, isDisabled, isReadOnly, size }}>
      <div className={cn('flex flex-col gap-1.5 w-full', className)}>
        {children}
      </div>
    </FormContext.Provider>
  );
}

export function FormControlLabel({ children, className }) {
  const { isRequired } = useContext(FormContext);
  return (
    <div className={cn('flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300', className)}>
      {children}
      {isRequired && <span className="text-rose-500">*</span>}
    </div>
  );
}

export function FormControlLabelText({ children, className }) {
  return <span className={cn('', className)}>{children}</span>;
}

export function FormControlHelper({ children, className }) {
  const { isInvalid } = useContext(FormContext);
  if (isInvalid) return null;

  return (
    <div className={cn('text-[11px] text-slate-500 dark:text-slate-400', className)}>
      {children}
    </div>
  );
}

export function FormControlHelperText({ children, className }) {
  return <span className={className}>{children}</span>;
}

export function FormControlError({ children, className }) {
  const { isInvalid } = useContext(FormContext);
  if (!isInvalid) return null;

  return (
    <div className={cn('flex items-center gap-1 text-[11px] text-rose-500 font-medium animate-in fade-in', className)}>
      {children}
    </div>
  );
}

export function FormControlErrorText({ children, className }) {
  return <span className={className}>{children}</span>;
}

export function FormControlErrorIcon({ as: Component, className }) {
  const IconComponent = Component || AlertCircle;
  return <IconComponent className={cn('w-3.5 h-3.5 shrink-0', className)} />;
}
