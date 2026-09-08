/**
 * Slider Component - Material Design 3
 * Continuous or discrete value selector
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';

export function Slider({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onChangeEnd,
  label,
  showValue = true,
  showTicks = false,
  disabled = false,
  size = 'md',        // sm | md | lg
  color = '#714b67',
  className,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const trackRef = useRef(null);

  const currentValue = value !== undefined ? value : internalValue;
  const fraction = (currentValue - min) / (max - min);

  const updateValue = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const rawFraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + rawFraction * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    setInternalValue(clampedValue);
    if (onChange) onChange(clampedValue);
  }, [min, max, step, onChange]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    setIsDragging(true);
    setShowTooltip(true);
    updateValue(e.clientX);

    const handleMove = (ev) => updateValue(ev.clientX);
    const handleUp = () => {
      setIsDragging(false);
      setShowTooltip(false);
      if (onChangeEnd) onChangeEnd(currentValue);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [disabled, updateValue, onChangeEnd, currentValue]);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    setIsDragging(true);
    setShowTooltip(true);
    updateValue(e.touches[0].clientX);

    const handleMove = (ev) => {
      ev.preventDefault();
      updateValue(ev.touches[0].clientX);
    };
    const handleEnd = () => {
      setIsDragging(false);
      setShowTooltip(false);
      if (onChangeEnd) onChangeEnd(currentValue);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  }, [disabled, updateValue, onChangeEnd, currentValue]);

  const trackHeight = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }[size] || 'h-1.5';
  const thumbSize = { sm: 16, md: 20, lg: 24 }[size] || 20;

  // Calculate tick positions
  const ticks = [];
  if (showTicks && step > 0) {
    for (let v = min; v <= max; v += step) {
      ticks.push((v - min) / (max - min));
    }
  }

  return (
    <div className={cn('w-full', disabled && 'opacity-50', className)} {...props}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold tabular-nums" style={{ color: disabled ? '#94a3b8' : color }}>
              {currentValue}
            </span>
          )}
        </div>
      )}

      {/* Track container — enlarged for touch target */}
      <div
        ref={trackRef}
        className="relative w-full cursor-pointer"
        style={{
          height: `${Math.max(thumbSize + 16, 48)}px`,
          display: 'flex',
          alignItems: 'center',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Inactive track */}
        <div className={cn('absolute left-0 right-0 rounded-full bg-slate-200 dark:bg-slate-700', trackHeight)} />

        {/* Active track */}
        <div
          className={cn('absolute left-0 rounded-full', trackHeight)}
          style={{
            width: `${fraction * 100}%`,
            backgroundColor: disabled ? '#94a3b8' : color,
            transition: isDragging ? 'none' : 'width 0.1s ease'
          }}
        />

        {/* Ticks */}
        {showTicks && ticks.map((pos, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `calc(${pos * 100}% - 2px)`,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: pos <= fraction ? 'rgba(255,255,255,0.7)' : '#94a3b8'
            }}
          />
        ))}

        {/* Thumb */}
        <div
          className="absolute z-10"
          style={{
            left: `calc(${fraction * 100}% - ${thumbSize / 2}px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            transition: isDragging ? 'none' : 'left 0.1s ease'
          }}
        >
          {/* Tooltip */}
          {showTooltip && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-full text-white text-xs font-bold whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {currentValue}
              {/* Arrow */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `5px solid ${color}`
                }}
              />
            </div>
          )}

          {/* Thumb circle */}
          <div
            className="rounded-full shadow-md transition-transform"
            style={{
              width: `${thumbSize}px`,
              height: `${thumbSize}px`,
              backgroundColor: disabled ? '#94a3b8' : color,
              transform: isDragging ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isDragging ? `0 0 0 8px ${color}20` : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * RangeSlider - Dual-thumb range selection
 */
export function RangeSlider({
  values = [20, 80],
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  showValues = true,
  disabled = false,
  color = '#714b67',
  className,
  ...props
}) {
  const [internalValues, setInternalValues] = useState(values);
  const [activeThumb, setActiveThumb] = useState(null);
  const trackRef = useRef(null);

  const currentValues = values || internalValues;
  const [low, high] = currentValues;
  const lowFraction = (low - min) / (max - min);
  const highFraction = (high - min) / (max - min);

  const updateThumb = useCallback((clientX, thumbIndex) => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const rawFraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + rawFraction * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    const newValues = [...currentValues];
    if (thumbIndex === 0) {
      newValues[0] = Math.min(clampedValue, newValues[1] - step);
    } else {
      newValues[1] = Math.max(clampedValue, newValues[0] + step);
    }

    setInternalValues(newValues);
    if (onChange) onChange(newValues);
  }, [min, max, step, currentValues, onChange]);

  const handleStart = useCallback((e, thumbIndex) => {
    if (disabled) return;
    e.stopPropagation();
    setActiveThumb(thumbIndex);

    const getClientX = (ev) => ev.touches ? ev.touches[0].clientX : ev.clientX;

    const handleMove = (ev) => {
      ev.preventDefault();
      updateThumb(getClientX(ev), thumbIndex);
    };
    const handleEnd = () => {
      setActiveThumb(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  }, [disabled, updateThumb]);

  return (
    <div className={cn('w-full', disabled && 'opacity-50', className)} {...props}>
      {(label || showValues) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValues && (
            <span className="text-sm font-semibold tabular-nums" style={{ color: disabled ? '#94a3b8' : color }}>
              {low} – {high}
            </span>
          )}
        </div>
      )}

      <div
        ref={trackRef}
        className="relative w-full"
        style={{ height: '48px', display: 'flex', alignItems: 'center', touchAction: 'none' }}
      >
        {/* Full track */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />

        {/* Active range */}
        <div
          className="absolute h-1.5 rounded-full"
          style={{
            left: `${lowFraction * 100}%`,
            width: `${(highFraction - lowFraction) * 100}%`,
            backgroundColor: disabled ? '#94a3b8' : color
          }}
        />

        {/* Low thumb */}
        <div
          className="absolute z-10 cursor-pointer"
          style={{ left: `calc(${lowFraction * 100}% - 10px)`, top: '50%', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => handleStart(e, 0)}
          onTouchStart={(e) => handleStart(e, 0)}
        >
          <div
            className="w-5 h-5 rounded-full shadow-md"
            style={{
              backgroundColor: disabled ? '#94a3b8' : color,
              transform: activeThumb === 0 ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.15s ease',
              boxShadow: activeThumb === 0 ? `0 0 0 8px ${color}20` : '0 1px 3px rgba(0,0,0,0.2)'
            }}
          />
        </div>

        {/* High thumb */}
        <div
          className="absolute z-10 cursor-pointer"
          style={{ left: `calc(${highFraction * 100}% - 10px)`, top: '50%', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => handleStart(e, 1)}
          onTouchStart={(e) => handleStart(e, 1)}
        >
          <div
            className="w-5 h-5 rounded-full shadow-md"
            style={{
              backgroundColor: disabled ? '#94a3b8' : color,
              transform: activeThumb === 1 ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.15s ease',
              boxShadow: activeThumb === 1 ? `0 0 0 8px ${color}20` : '0 1px 3px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Slider;
