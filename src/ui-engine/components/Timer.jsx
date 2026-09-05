/**
 * Timer Component for GlueStack UI
 * Supports countdown, countup, and stopwatch modes
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from '../components';

export default function Timer({
  value = 0,
  duration = 0,
  mode = 'countdown', // 'countdown' | 'countup' | 'stopwatch'
  size = 'md',
  variant = 'default', // 'default' | 'pill' | 'large'
  showHours = true,
  autoStart = false,
  onTick,
  onComplete,
  onReset,
  label,
  labelPosition = 'top', // 'top' | 'bottom'
  accentColor = '#714b67',
  isRunning: externalIsRunning,
  onToggle,
}) {
  const [internalRunning, setInternalRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(value);
  const [startTime, setStartTime] = useState(null);
  const [initialValue, setInitialValue] = useState(value);
  const intervalRef = useRef(null);
  const isRunning = externalIsRunning !== undefined ? externalIsRunning : internalRunning;

  const isControlled = externalIsRunning !== undefined;

  useEffect(() => {
    if (isRunning) {
      if (!startTime) {
        setStartTime(Date.now() - elapsed * 1000);
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newElapsed = Math.floor((now - startTime) / 1000);
        setElapsed(newElapsed);

        if (onTick) {
          onTick(newElapsed);
        }

        if (mode === 'countdown' && duration > 0 && newElapsed >= duration) {
          if (!isControlled) {
            setInternalRunning(false);
          }
          setElapsed(duration);
          if (onComplete) onComplete();
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTime, duration, mode, isControlled]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (showHours || hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getDisplayValue = () => {
    if (mode === 'countdown' && duration > 0) {
      return formatTime(duration - elapsed);
    }
    return formatTime(elapsed);
  };

  const handleReset = () => {
    if (!isControlled) {
      setInternalRunning(false);
    }
    setElapsed(value || 0);
    setStartTime(null);
    if (onReset) onReset();
  };

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle(!isRunning);
    } else {
      setInternalRunning(!internalRunning);
    }
  };

  const sizeClasses = {
    sm: { fontSize: '1.25rem', padding: '8px 12px' },
    md: { fontSize: '1.75rem', padding: '12px 16px' },
    lg: { fontSize: '2.5rem', padding: '16px 24px' },
  };

  const variantStyles = {
    default: {
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
    },
    pill: {
      backgroundColor: accentColor,
      border: 'none',
      borderRadius: '9999px',
      color: 'white',
    },
    large: {
      backgroundColor: '#1e293b',
      border: 'none',
      borderRadius: '16px',
      color: 'white',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;
  const currentSize = sizeClasses[size] || sizeClasses.md;

  const isOvertime = mode === 'countdown' && elapsed > duration && duration > 0;
  const isWarning = mode === 'countdown' && duration > 0 && (duration - elapsed) <= 60 && elapsed < duration;

  return (
    <Box className="flex flex-col gap-2">
      {label && labelPosition === 'top' && (
        <Text size="sm" className={`font-semibold ${variant === 'pill' ? 'text-white' : 'text-slate-600'}`}>
          {label}
        </Text>
      )}

      <Box
        className="flex items-center gap-3"
        style={{
          ...currentVariant,
          ...currentSize,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: isOvertime ? '#ef4444' : isWarning ? '#f59e0b' : (variant === 'pill' || variant === 'large') ? 'white' : '#0f172a',
        }}
      >
        {mode === 'countdown' && (
          <Box
            className={`w-3 h-3 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: isOvertime ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e' }}
          />
        )}
        <Text
          style={{
            fontFamily: 'monospace',
            fontSize: currentSize.fontSize,
            fontWeight: 'bold',
          }}
        >
          {getDisplayValue()}
        </Text>
        {mode === 'countdown' && isOvertime && (
          <Text size="sm" className="text-red-500 font-bold">OVERTIME</Text>
        )}
      </Box>

      <Box className="flex gap-2">
        <Box
          as="button"
          onClick={handleToggle}
          className="flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all"
          style={{
            backgroundColor: isRunning ? '#f59e0b' : '#22c55e',
            color: 'white',
          }}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </Box>
        <Box
          as="button"
          onClick={handleReset}
          className="flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all"
          style={{
            backgroundColor: '#64748b',
            color: 'white',
          }}
        >
          ↺ Reset
        </Box>
      </Box>

      {label && labelPosition === 'bottom' && (
        <Text size="sm" className={`font-medium ${variant === 'pill' ? 'text-white/80' : 'text-slate-500'}`}>
          {label}
        </Text>
      )}
    </Box>
  );
}
