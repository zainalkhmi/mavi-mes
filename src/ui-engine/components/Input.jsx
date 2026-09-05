import React, { createContext, useContext } from 'react';
import { cn } from '../utils/cn';

const InputContext = createContext({
  size: 'md',
  isDisabled: false,
  isInvalid: false,
  isReadOnly: false
});

export function Input({
  children,
  size = 'md', // sm | md | lg | xl
  variant = 'outline', // outline | rounded | underlinned
  isDisabled = false,
  isInvalid = false,
  isReadOnly = false,
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'h-8 text-xs px-2.5 rounded-lg',
    md: 'h-10 text-sm px-3.5 rounded-xl',
    lg: 'h-12 text-base px-4 rounded-xl',
    xl: 'h-14 text-lg px-5 rounded-2xl'
  }[size] || 'h-10 text-sm px-3.5 rounded-xl';

  const borderClass = isInvalid
    ? 'border-rose-500 focus-within:ring-2 focus-within:ring-rose-400/30'
    : 'border-slate-300 dark:border-slate-700 focus-within:border-[#714b67] focus-within:ring-2 focus-within:ring-[#714b67]/20';

  return (
    <InputContext.Provider value={{ size, isDisabled, isInvalid, isReadOnly }}>
      <div
        className={cn(
          'flex items-center w-full bg-white dark:bg-slate-900 border transition-colors duration-150',
          variant === 'rounded' ? 'rounded-full' : (variant === 'underlinned' ? 'border-t-0 border-x-0 rounded-none' : ''),
          borderClass,
          sizeClasses,
          isDisabled && 'opacity-60 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </InputContext.Provider>
  );
}

export function InputField({
  className,
  placeholder,
  value,
  defaultValue,
  onChange,
  onChangeText,
  type = 'text',
  ...props
}) {
  const { isDisabled, isReadOnly } = useContext(InputContext);

  const handleChange = (e) => {
    if (onChange) onChange(e);
    if (onChangeText) onChangeText(e.target.value);
  };

  return (
    <input
      type={type}
      disabled={isDisabled}
      readOnly={isReadOnly}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      className={cn(
        'w-full h-full bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none text-inherit',
        isDisabled && 'cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}

export function InputIcon({ as: Component, icon, className }) {
  const IconComponent = Component || icon;
  if (!IconComponent) return null;
  return <IconComponent className={cn('w-4 h-4 text-slate-400 shrink-0 mr-2', className)} />;
}

export function InputSlot({ children, className, onPress, onClick }) {
  return (
    <div
      onClick={onPress || onClick}
      className={cn('flex items-center text-slate-400 cursor-pointer select-none', className)}
    >
      {children}
    </div>
  );
}
