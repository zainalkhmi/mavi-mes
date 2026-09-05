import React from 'react';
import { cn } from '../utils/cn';
import { Loader2 } from 'lucide-react';

export function Spinner({
  size = 'md', // sm | md | lg | xl
  color = '#714b67',
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }[size] || 'w-6 h-6';

  return (
    <Loader2
      style={{ color }}
      className={cn('animate-spin text-current shrink-0', sizeClasses, className)}
      {...props}
    />
  );
}
