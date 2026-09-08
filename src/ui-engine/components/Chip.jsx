/**
 * Chip Component - Material Design 3
 * Compact elements representing filters, selections, or actions
 */

import React from 'react';
import { cn } from '../utils/cn';
import { Check, X } from 'lucide-react';
import useRipple from '../utils/useRipple';

/**
 * Chip - Base chip component
 * @param {'assist'|'filter'|'input'|'suggestion'} variant - MD3 chip type
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} selected - Whether chip is in selected state
 * @param {boolean} elevated - Use elevated style
 */
export function Chip({
  children,
  variant = 'filter',    // assist | filter | input | suggestion
  size = 'md',            // sm | md | lg
  selected = false,
  elevated = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  onPress,
  onClick,
  onRemove,
  className,
  ...props
}) {
  const { rippleRef, handleRipple, rippleContainerStyle } = useRipple({
    color: selected ? '#714b67' : 'currentColor',
    opacity: 0.12,
    disabled
  });

  const handleClick = (e) => {
    handleRipple(e);
    if (disabled) return;
    if (onPress) onPress(e);
    if (onClick) onClick(e);
  };

  const sizeClasses = {
    sm: 'h-7 px-2.5 text-xs gap-1',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-sm gap-2'
  }[size] || 'h-8 px-3 text-sm gap-1.5';

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  const LeadingIcon = leadingIcon;
  const TrailingIcon = trailingIcon;

  // Selected state
  const selectedClasses = selected
    ? 'bg-[#714b67]/10 border-[#714b67]/30 text-[#714b67] dark:bg-[#714b67]/20 dark:text-[#dcbfd3]'
    : '';

  // Variant-specific base styles
  const variantBase = {
    assist: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
    filter: cn(
      'border text-slate-700 dark:text-slate-300',
      selected
        ? selectedClasses
        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
    ),
    input: cn(
      'border text-slate-700 dark:text-slate-300',
      selected
        ? selectedClasses
        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
    ),
    suggestion: cn(
      'border text-slate-700 dark:text-slate-300',
      selected
        ? selectedClasses
        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
    )
  }[variant] || 'border border-slate-300 text-slate-700';

  const elevatedClass = elevated
    ? 'shadow-sm border-transparent bg-white dark:bg-slate-800'
    : '';

  return (
    <button
      ref={rippleRef}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'mavi-chip inline-flex items-center justify-center rounded-lg font-medium select-none cursor-pointer',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[#714b67]/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses,
        variantBase,
        elevatedClass,
        className
      )}
      style={rippleContainerStyle}
      {...props}
    >
      {/* Selected checkmark for filter chips */}
      {variant === 'filter' && selected && (
        <Check className="shrink-0" style={{ width: iconSize, height: iconSize }} strokeWidth={2.5} />
      )}

      {/* Leading Icon */}
      {LeadingIcon && !(variant === 'filter' && selected) && (
        <LeadingIcon className="shrink-0" style={{ width: iconSize, height: iconSize }} />
      )}

      {/* Label */}
      <span className="truncate">{children}</span>

      {/* Trailing Icon or Remove button */}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          disabled={disabled}
        >
          <X style={{ width: iconSize - 2, height: iconSize - 2 }} />
        </button>
      ) : TrailingIcon ? (
        <TrailingIcon className="shrink-0" style={{ width: iconSize, height: iconSize }} />
      ) : null}
    </button>
  );
}

/**
 * ChipGroup - Container for multiple chips with scroll support
 */
export function ChipGroup({
  children,
  scrollable = true,
  wrap = false,
  gap = 'md',
  className
}) {
  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  }[gap] || 'gap-2';

  return (
    <div
      className={cn(
        'flex items-center',
        gapClasses,
        wrap ? 'flex-wrap' : 'overflow-x-auto mavi-scroll-hide',
        scrollable && !wrap ? 'pb-1' : '',
        className
      )}
    >
      {children}
    </div>
  );
}

// Aliases
export const FilterChip = (props) => <Chip variant="filter" {...props} />;
export const AssistChip = (props) => <Chip variant="assist" {...props} />;
export const InputChip = (props) => <Chip variant="input" {...props} />;
export const SuggestionChip = (props) => <Chip variant="suggestion" {...props} />;

export default Chip;
