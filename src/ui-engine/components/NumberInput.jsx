/**
 * NumberInput Component for GlueStack UI
 * Numeric input with increment/decrement buttons
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, Input, InputField } from '../components';

export default function NumberInput({
  value: initialValue = 0,
  min = 0,
  max = 999999,
  step = 1,
  placeholder = '0',
  label,
  helperText,
  errorText,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'outline', // 'outline' | 'rounded' | 'underlined'
  isDisabled = false,
  isInvalid = false,
  showStepper = true,
  stepperPosition = 'right', // 'right' | 'attached'
  onChange,
  onBlur,
  onFocus,
  prefix,
  suffix,
  decimals = 0, // Number of decimal places
  showThousandsSeparator = true,
}) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const value = initialValue !== undefined ? initialValue : internalValue;

  const handleChange = useCallback((e) => {
    let newValue = e.target.value;

    // Handle empty input
    if (newValue === '' || newValue === '-') {
      setInternalValue(newValue);
      onChange?.(newValue === '' ? 0 : newValue);
      return;
    }

    // Parse and validate
    let numValue = parseFloat(newValue);

    if (isNaN(numValue)) {
      return;
    }

    // Clamp to min/max
    numValue = Math.max(min, Math.min(max, numValue));

    setInternalValue(numValue);
    onChange?.(numValue);
  }, [min, max, onChange]);

  const handleStep = useCallback((direction) => {
    let newValue = value;
    if (typeof value === 'string') {
      newValue = parseFloat(value) || 0;
    }

    newValue = direction === 'increment'
      ? Math.min(max, newValue + step)
      : Math.max(min, newValue - step);

    setInternalValue(newValue);
    onChange?.(newValue);
  }, [value, min, max, step, onChange]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);

    // Round to decimal places on blur
    if (typeof value === 'number') {
      const rounded = parseFloat(value.toFixed(decimals));
      setInternalValue(rounded);
      onChange?.(rounded);
    }

    onBlur?.(e);
  };

  const formatValue = (val) => {
    if (val === '' || val === '-') return val;
    if (typeof val === 'string' && isNaN(parseFloat(val))) return val;

    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numVal)) return '';

    if (showThousandsSeparator) {
      return numVal.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    return numVal.toFixed(decimals);
  };

  const sizeConfig = {
    sm: { height: 'h-8', fontSize: 'text-sm', stepperSize: 'w-8' },
    md: { height: 'h-10', fontSize: 'text-base', stepperSize: 'w-10' },
    lg: { height: 'h-12', fontSize: 'text-lg', stepperSize: 'w-12' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  const borderColor = isInvalid
    ? '#ef4444'
    : isFocused
      ? '#714b67'
      : '#e2e8f0';

  if (stepperPosition === 'attached') {
    return (
      <Box className="flex flex-col gap-1">
        {label && (
          <Text size="sm" className={`font-medium ${isInvalid ? 'text-red-500' : 'text-slate-700'}`}>
            {label}
          </Text>
        )}
        <Box className="flex">
          <Box
            as="button"
            type="button"
            onClick={() => handleStep('decrement')}
            disabled={isDisabled || value <= min}
            className={`${config.stepperSize} ${config.height} rounded-l-lg flex items-center justify-center font-bold transition-colors border border-r-0 ${isDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200'}`}
            style={{ borderColor }}
          >
            <Text className="text-slate-600">−</Text>
          </Box>
          <Box className="relative flex-1">
            {prefix && (
              <Text className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                {prefix}
              </Text>
            )}
            <Input
              type="text"
              inputMode="decimal"
              value={isFocused ? value : formatValue(value)}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={isDisabled}
              placeholder={placeholder}
              className={`${config.height} text-center rounded-none border-x-0 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
              style={{
                fontSize: config.fontSize,
                borderColor,
                fontWeight: '600',
              }}
            />
            {suffix && (
              <Text className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {suffix}
              </Text>
            )}
          </Box>
          <Box
            as="button"
            type="button"
            onClick={() => handleStep('increment')}
            disabled={isDisabled || value >= max}
            className={`${config.stepperSize} ${config.height} rounded-r-lg flex items-center justify-center font-bold transition-colors border border-l-0 ${isDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200'}`}
            style={{ borderColor }}
          >
            <Text className="text-slate-600">+</Text>
          </Box>
        </Box>
        {(helperText || errorText) && (
          <Text size="xs" className={isInvalid ? 'text-red-500' : 'text-slate-500'}>
            {isInvalid ? errorText : helperText}
          </Text>
        )}
      </Box>
    );
  }

  // Right position stepper
  return (
    <Box className="flex flex-col gap-1">
      {label && (
        <Text size="sm" className={`font-medium ${isInvalid ? 'text-red-500' : 'text-slate-700'}`}>
          {label}
        </Text>
      )}
      <Box className="flex gap-2">
        <Box className="relative flex-1">
          {prefix && (
            <Text className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
              {prefix}
            </Text>
          )}
          <Input
            type="text"
            inputMode="decimal"
            value={isFocused ? value : formatValue(value)}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={isDisabled}
            isInvalid={isInvalid}
            placeholder={placeholder}
            className={`${config.height} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
            style={{
              fontSize: config.fontSize,
              fontWeight: '600',
            }}
          />
          {suffix && (
            <Text className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {suffix}
            </Text>
          )}
        </Box>
        {showStepper && (
          <Box className="flex flex-col gap-1">
            <Box
              as="button"
              type="button"
              onClick={() => handleStep('increment')}
              disabled={isDisabled || value >= max}
              className={`${config.stepperSize} ${config.height} rounded-lg flex items-center justify-center font-bold transition-colors ${isDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-200 hover:bg-slate-300'}`}
            >
              <Text className="text-slate-600 text-lg">▲</Text>
            </Box>
            <Box
              as="button"
              type="button"
              onClick={() => handleStep('decrement')}
              disabled={isDisabled || value <= min}
              className={`${config.stepperSize} ${config.height} rounded-lg flex items-center justify-center font-bold transition-colors ${isDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-200 hover:bg-slate-300'}`}
            >
              <Text className="text-slate-600 text-lg">▼</Text>
            </Box>
          </Box>
        )}
      </Box>
      {(helperText || errorText) && (
        <Text size="xs" className={isInvalid ? 'text-red-500' : 'text-slate-500'}>
          {isInvalid ? errorText : helperText}
        </Text>
      )}
    </Box>
  );
}
