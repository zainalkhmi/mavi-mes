/**
 * Counter Component for GlueStack UI
 * Incremental/Decremental counter for parts counting
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, Button } from '../components';

export default function Counter({
  value: initialValue = 0,
  min = 0,
  max = 99999,
  step = 1,
  label,
  sublabel,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'default', // 'default' | 'pill' | 'card' | 'compact'
  showButtons = true,
  showDecrement = true,
  showIncrement = true,
  buttonStyle = 'circle', // 'circle' | 'square'
  colorScheme = 'default', // 'default' | 'success' | 'warning' | 'danger'
  onChange,
  onIncrement,
  onDecrement,
  disabled = false,
}) {
  const [value, setValue] = useState(initialValue);

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(value + step, max);
    setValue(newValue);
    onChange?.(newValue);
    onIncrement?.(newValue);
  }, [value, step, max, onChange, onIncrement]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(value - step, min);
    setValue(newValue);
    onChange?.(newValue);
    onDecrement?.(newValue);
  }, [value, step, min, onChange, onDecrement]);

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setValue(newValue);
      onChange?.(newValue);
    }
  };

  const getColorScheme = () => {
    switch (colorScheme) {
      case 'success': return { bg: '#22c55e', light: '#dcfce7' };
      case 'warning': return { bg: '#f59e0b', light: '#fef3c7' };
      case 'danger': return { bg: '#ef4444', light: '#fee2e2' };
      default: return { bg: '#714b67', light: '#f3e8ef' };
    }
  };

  const colors = getColorScheme();

  const sizeConfig = {
    sm: { fontSize: '1.5rem', buttonSize: 'w-8 h-8', padding: 'p-2' },
    md: { fontSize: '2rem', buttonSize: 'w-10 h-10', padding: 'p-3' },
    lg: { fontSize: '2.5rem', buttonSize: 'w-12 h-12', padding: 'p-4' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  const buttonClasses = buttonStyle === 'circle'
    ? 'rounded-full'
    : 'rounded-lg';

  if (variant === 'compact') {
    return (
      <Box className="flex items-center gap-2">
        {showDecrement && (
          <Box
            as="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className={`${config.buttonSize} ${buttonClasses} flex items-center justify-center font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: colors.bg }}
          >
            -
          </Box>
        )}
        <Box
          as="input"
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={`w-16 text-center font-bold rounded-lg border-2 outline-none ${config.fontSize} ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
          style={{
            borderColor: colors.bg,
            color: colors.bg,
            fontSize: config.fontSize,
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
        />
        {showIncrement && (
          <Box
            as="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className={`${config.buttonSize} ${buttonClasses} flex items-center justify-center font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: colors.bg }}
          >
            +
          </Box>
        )}
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Box className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        {label && (
          <Text size="sm" className="text-slate-500 font-medium mb-1">{label}</Text>
        )}
        <Text style={{ fontSize: config.fontSize }} className="font-bold text-slate-900 text-center">
          {value.toLocaleString()}
        </Text>
        {sublabel && (
          <Text size="xs" className="text-slate-400 text-center mt-1">{sublabel}</Text>
        )}
        {showButtons && (
          <Box className="flex justify-center gap-3 mt-3">
            {showDecrement && (
              <Box
                as="button"
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className={`${config.buttonSize} ${buttonClasses} flex items-center justify-center font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                -
              </Box>
            )}
            {showIncrement && (
              <Box
                as="button"
                onClick={handleIncrement}
                disabled={disabled || value >= max}
                className={`${config.buttonSize} ${buttonClasses} flex items-center justify-center font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: '#22c55e', color: 'white' }}
              >
                +
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }

  if (variant === 'pill') {
    return (
      <Box className="flex items-center gap-1">
        {showDecrement && (
          <Box
            as="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className={`${config.buttonSize} ${buttonClasses} flex items-center justify-center font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: colors.light, color: colors.bg }}
          >
            <Text style={{ fontSize: '1.25rem' }}>−</Text>
          </Box>
        )}
        <Box className="px-4 min-w-[80px] text-center">
          <Text style={{ fontSize: config.fontSize, color: colors.bg }} className="font-bold">
            {value.toLocaleString()}
          </Text>
        </Box>
        {showIncrement && (
          <Box
            as="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className={`${config.buttonSize} ${buttonClasses} flex items-center justify-center font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: colors.light, color: colors.bg }}
          >
            <Text style={{ fontSize: '1.25rem' }}>+</Text>
          </Box>
        )}
      </Box>
    );
  }

  // Default variant
  return (
    <Box className="flex flex-col gap-2">
      {label && (
        <Text size="sm" className="text-slate-600 font-semibold">{label}</Text>
      )}
      <Box className="flex items-center gap-3">
        {showDecrement && (
          <Box
            as="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className={`${config.buttonSize} ${buttonClasses} ${config.padding} flex items-center justify-center font-bold text-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            -
          </Box>
        )}
        <Box
          as="input"
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="flex-1 text-center font-bold rounded-xl border-2 border-slate-200 outline-none focus:border-slate-400 transition-colors"
          style={{
            fontSize: config.fontSize,
            padding: '12px',
            color: '#0f172a',
          }}
        />
        {showIncrement && (
          <Box
            as="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className={`${config.buttonSize} ${buttonClasses} ${config.padding} flex items-center justify-center font-bold text-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            style={{ backgroundColor: '#22c55e', color: 'white' }}
          >
            +
          </Box>
        )}
      </Box>
      {sublabel && (
        <Text size="xs" className="text-slate-400 text-center">{sublabel}</Text>
      )}
    </Box>
  );
}
