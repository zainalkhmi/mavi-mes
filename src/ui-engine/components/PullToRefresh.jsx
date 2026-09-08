/**
 * PullToRefresh Component - Android Native Pattern
 * Wraps content to add pull-to-refresh gesture behavior
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';
import { Loader2 } from 'lucide-react';

export function PullToRefresh({
  children,
  onRefresh,
  isRefreshing = false,
  threshold = 80,       // pixels to pull before triggering
  maxPull = 120,         // maximum pull distance
  indicatorColor = '#714b67',
  className,
  ...props
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchRef = useRef({ startY: 0, isTracking: false });
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop <= 0) {
      touchRef.current = {
        startY: e.touches[0].clientY,
        isTracking: true
      };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current.isTracking || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchRef.current.startY;

    if (diff > 0) {
      // Apply resistance curve
      const resistance = 0.4;
      const adjustedDiff = Math.min(diff * resistance, maxPull);
      setPullDistance(adjustedDiff);
      setIsPulling(true);
      e.preventDefault();
    }
  }, [isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(() => {
    touchRef.current.isTracking = false;

    if (pullDistance >= threshold && onRefresh && !isRefreshing) {
      // Trigger haptic
      if (navigator.vibrate) {
        try { navigator.vibrate(15); } catch {}
      }
      onRefresh();
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh, isRefreshing]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = isPulling || isRefreshing;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center transition-transform"
        style={{
          top: '-40px',
          transform: `translateX(-50%) translateY(${showIndicator ? (isRefreshing ? threshold * 0.6 : pullDistance) : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
          opacity: showIndicator ? 1 : 0
        }}
      >
        <div
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
          {isRefreshing ? (
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: indicatorColor }}
            />
          ) : (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              style={{
                color: indicatorColor,
                transform: `rotate(${progress * 360}deg)`,
                transition: isPulling ? 'none' : 'transform 0.2s ease'
              }}
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 56.5} 56.5`}
                transform="rotate(-90 12 12)"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto mavi-scroll-momentum"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isPulling ? `translateY(${pullDistance * 0.3}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
