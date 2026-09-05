import React from 'react';

const sizeClasses = {
  '2xs': 'text-[10px]',
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl'
};

export const Text = React.forwardRef(({ 
  children, 
  className = '', 
  size = 'md', 
  bold = false, 
  italic = false, 
  underline = false, 
  strikeThrough = false, 
  as: Component = 'span', 
  ...props 
}, ref) => {
  const sizeClass = size ? sizeClasses[size] || '' : '';
  const classes = [
    sizeClass,
    bold ? 'font-bold' : '',
    italic ? 'italic' : '',
    underline ? 'underline' : '',
    strikeThrough ? 'line-through' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component ref={ref} className={classes} {...props}>
      {children}
    </Component>
  );
});

Text.displayName = 'Text';
export default Text;
