/**
 * Skeleton Component for GlueStack UI
 * Loading placeholder while data is being fetched
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from '../components';

export default function Skeleton({
  variant = 'text', // 'text' | 'circular' | 'rectangular' | 'card'
  width,
  height,
  className = '',
  animation = 'pulse', // 'pulse' | 'wave' | 'none'
  color = '#e2e8f0',
  highlightColor = '#f1f5f9',
  lines = 3,
  size = 'md', // For 'text' variant: 'sm' | 'md' | 'lg'
  children,
}) {
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    if (animation === 'wave') {
      setShimmer(true);
    }
  }, [animation]);

  const sizeConfig = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
  };

  const animationClass = {
    pulse: 'animate-pulse',
    wave: shimmer ? 'animate-pulse' : '', // Simplified, could add wave animation
    none: '',
  }[animation];

  const baseStyles = {
    backgroundColor: color,
    borderRadius: variant === 'circular' ? '50%' : '8px',
  };

  if (variant === 'card') {
    return (
      <Box
        className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${animationClass} ${className}`}
        style={baseStyles}
      >
        <Box className="flex items-start gap-3">
          <Box
            className="w-12 h-12 rounded-lg"
            style={{ backgroundColor: highlightColor }}
          />
          <Box className="flex-1">
            <Box
              className={`h-4 rounded ${animationClass}`}
              style={{ width: '60%', backgroundColor: highlightColor }}
            />
            <Box
              className={`h-3 rounded mt-2 ${animationClass}`}
              style={{ width: '80%', backgroundColor: highlightColor }}
            />
            <Box
              className={`h-3 rounded mt-1 ${animationClass}`}
              style={{ width: '40%', backgroundColor: highlightColor }}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  if (variant === 'text') {
    return (
      <Box className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => {
          const isLast = i === lines - 1;
          return (
            <Box
              key={i}
              className={`${sizeConfig[size]} ${animationClass} rounded`}
              style={{
                width: isLast ? '60%' : '100%',
                backgroundColor: color,
              }}
            />
          );
        })}
      </Box>
    );
  }

  return (
    <Box
      className={animationClass}
      style={{
        ...baseStyles,
        width: width || (variant === 'circular' ? height || 40 : '100%'),
        height: height || (variant === 'circular' ? width || 40 : 20),
      }}
    />
  );
}

// Preset skeleton loaders
export function SkeletonList({ count = 3, size = 'md' }) {
  return (
    <Box className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
          <Skeleton variant="circular" width={40} height={40} />
          <Box className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" size={size} />
            <Skeleton variant="text" width="40%" size="sm" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <Box className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <Box className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <Box className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" size="md" />
          <Skeleton variant="text" width="40%" size="sm" />
        </Box>
      </Box>
      <Skeleton variant="text" lines={lines} size="sm" />
    </Box>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <Box className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <Box className="flex gap-4 p-4 bg-slate-50 border-b border-slate-200">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={i === 0 ? 60 : 80} size="sm" />
        ))}
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          className={`flex gap-4 p-4 ${rowIndex < rows - 1 ? 'border-b border-slate-100' : ''}`}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={colIndex === 0 ? 60 : 80}
              size="sm"
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export function SkeletonDashboard() {
  return (
    <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* KPI Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Box key={i} className="bg-white rounded-xl border border-slate-200 p-4">
          <Skeleton variant="text" width={60} size="sm" />
          <Skeleton variant="text" width={100} size="lg" className="mt-2" />
        </Box>
      ))}

      {/* Chart */}
      <Box className="col-span-1 md:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
        <Skeleton variant="text" width={120} size="md" />
        <Box className="h-48 mt-4 flex items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              className="flex-1"
              height={`${Math.random() * 60 + 40}%`}
            />
          ))}
        </Box>
      </Box>

      {/* Recent Activity */}
      <Box className="bg-white rounded-xl border border-slate-200 p-4">
        <Skeleton variant="text" width={100} size="md" />
        <Box className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} className="flex items-center gap-3">
              <Skeleton variant="circular" width={32} height={32} />
              <Box className="flex-1 space-y-1">
                <Skeleton variant="text" width="70%" size="sm" />
                <Skeleton variant="text" width="40%" size="sm" />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
