import React from 'react';

export const Box = React.forwardRef(({ 
  children, 
  className = '', 
  as: Component = 'div', 
  ...props 
}, ref) => {
  return (
    <Component ref={ref} className={className} {...props}>
      {children}
    </Component>
  );
});

Box.displayName = 'Box';

export const HStack = React.forwardRef(({ 
  children, 
  className = '', 
  space = 'md', 
  reversed = false, 
  ...props 
}, ref) => {
  const spaceClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
    '2xl': 'gap-8'
  };
  const gapClass = spaceClasses[space] || 'gap-3';
  return (
    <div ref={ref} className={`flex flex-row items-center ${reversed ? 'flex-row-reverse' : ''} ${gapClass} ${className}`} {...props}>
      {children}
    </div>
  );
});

HStack.displayName = 'HStack';

export const VStack = React.forwardRef(({ 
  children, 
  className = '', 
  space = 'md', 
  reversed = false, 
  ...props 
}, ref) => {
  const spaceClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
    '2xl': 'gap-8'
  };
  const gapClass = spaceClasses[space] || 'gap-3';
  return (
    <div ref={ref} className={`flex flex-col ${reversed ? 'flex-col-reverse' : ''} ${gapClass} ${className}`} {...props}>
      {children}
    </div>
  );
});

VStack.displayName = 'VStack';

export const Center = React.forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div ref={ref} className={`flex items-center justify-center ${className}`} {...props}>
      {children}
    </div>
  );
});

Center.displayName = 'Center';

export default Box;
