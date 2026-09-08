/**
 * SegmentedButton Component - Material Design 3
 * Toggle between 2-5 mutually exclusive options
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { Check } from 'lucide-react';
import useRipple from '../utils/useRipple';

export function SegmentedButton({
  segments = [],          // [{ value, label, icon }]
  value,                  // controlled value
  defaultValue,           // uncontrolled default
  onChange,
  size = 'md',            // sm | md | lg
  multiSelect = false,    // allow multiple selections
  showCheckmark = true,   // show checkmark on selected
  fullWidth = false,
  disabled = false,
  className,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(
    defaultValue || (multiSelect ? [] : segments[0]?.value)
  );
  const indicatorRef = useRef(null);
  const containerRef = useRef(null);
  const segmentRefs = useRef({});

  const currentValue = value !== undefined ? value : internalValue;

  const isSelected = (val) => {
    if (multiSelect) return Array.isArray(currentValue) && currentValue.includes(val);
    return currentValue === val;
  };

  const handleSelect = (val) => {
    if (disabled) return;

    let nextValue;
    if (multiSelect) {
      const arr = Array.isArray(currentValue) ? [...currentValue] : [];
      if (arr.includes(val)) {
        nextValue = arr.filter(v => v !== val);
      } else {
        nextValue = [...arr, val];
      }
    } else {
      nextValue = val;
    }

    setInternalValue(nextValue);
    if (onChange) onChange(nextValue);

    // Haptic
    if (navigator.vibrate) {
      try { navigator.vibrate(6); } catch {}
    }
  };

  // Animate indicator for single-select
  useEffect(() => {
    if (multiSelect || !indicatorRef.current || !containerRef.current) return;

    const activeEl = segmentRefs.current[currentValue];
    if (activeEl) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      indicatorRef.current.style.left = `${activeRect.left - containerRect.left}px`;
      indicatorRef.current.style.width = `${activeRect.width}px`;
    }
  }, [currentValue, multiSelect, segments]);

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  }[size] || 'h-10 text-sm';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex items-center rounded-full border border-slate-300 dark:border-slate-700 overflow-hidden',
        fullWidth ? 'w-full' : '',
        disabled && 'opacity-50 pointer-events-none',
        sizeClasses,
        className
      )}
      role="group"
      {...props}
    >
      {/* Sliding indicator (single-select only) */}
      {!multiSelect && (
        <div
          ref={indicatorRef}
          className="absolute top-0 bottom-0 bg-[#714b67]/10 dark:bg-[#714b67]/20 rounded-full mavi-segmented-indicator z-0"
        />
      )}

      {segments.map((segment, i) => {
        const selected = isSelected(segment.value);
        const Icon = segment.icon;

        return (
          <SegmentButton
            key={segment.value}
            ref={(el) => { segmentRefs.current[segment.value] = el; }}
            selected={selected}
            onClick={() => handleSelect(segment.value)}
            showDivider={i > 0}
            fullWidth={fullWidth}
            showCheckmark={showCheckmark}
            disabled={disabled}
            icon={Icon}
            size={size}
          >
            {segment.label}
          </SegmentButton>
        );
      })}
    </div>
  );
}

const SegmentButton = React.forwardRef(({
  children,
  selected,
  onClick,
  showDivider,
  fullWidth,
  showCheckmark,
  disabled,
  icon: Icon,
  size
}, ref) => {
  const { rippleRef, handleRipple, rippleContainerStyle } = useRipple({
    color: '#714b67',
    opacity: 0.12,
    disabled
  });

  const handleClick = (e) => {
    handleRipple(e);
    onClick();
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <button
      ref={(el) => {
        rippleRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative z-10 inline-flex items-center justify-center gap-1.5 px-4 font-medium transition-colors select-none cursor-pointer h-full',
        fullWidth ? 'flex-1' : '',
        selected
          ? 'text-[#714b67] dark:text-[#dcbfd3]'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
        showDivider && !selected ? 'border-l border-slate-300 dark:border-slate-700' : '',
        'focus:outline-none'
      )}
      style={rippleContainerStyle}
    >
      {showCheckmark && selected && (
        <Check className="shrink-0" style={{ width: iconSize, height: iconSize }} strokeWidth={2.5} />
      )}
      {Icon && !(showCheckmark && selected) && (
        <Icon className="shrink-0" style={{ width: iconSize, height: iconSize }} />
      )}
      <span className="truncate">{children}</span>
    </button>
  );
});

SegmentButton.displayName = 'SegmentButton';

export default SegmentedButton;
