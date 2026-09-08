/**
 * SwipeableRow Component - Android Native Pattern
 * List item with swipe-to-reveal actions
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';
import { Trash2, Archive, Edit, Star } from 'lucide-react';

export function SwipeableRow({
  children,
  leftActions = [],    // [{ icon, label, color, onPress }]
  rightActions = [],   // [{ icon, label, color, onPress }]
  swipeThreshold = 80, // px to trigger full action
  disabled = false,
  onSwipeLeft,
  onSwipeRight,
  className,
  ...props
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, isTracking: false, direction: null });
  const contentRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isTracking: true,
      direction: null
    };
  }, [disabled]);

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current.isTracking || disabled) return;

    const dx = e.touches[0].clientX - touchRef.current.startX;
    const dy = e.touches[0].clientY - touchRef.current.startY;

    // Determine direction on first significant move
    if (!touchRef.current.direction) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        touchRef.current.direction = 'horizontal';
      } else if (Math.abs(dy) > 10) {
        touchRef.current.direction = 'vertical';
        touchRef.current.isTracking = false;
        return;
      } else {
        return;
      }
    }

    if (touchRef.current.direction !== 'horizontal') return;
    e.preventDefault();

    // Clamp based on available actions
    const maxRight = leftActions.length > 0 ? swipeThreshold * 1.5 : 0;
    const maxLeft = rightActions.length > 0 ? swipeThreshold * 1.5 : 0;
    const clampedDx = Math.max(-maxLeft, Math.min(maxRight, dx));

    setOffsetX(clampedDx);
    setIsSwiping(true);
  }, [disabled, leftActions, rightActions, swipeThreshold]);

  const handleTouchEnd = useCallback(() => {
    touchRef.current.isTracking = false;

    if (Math.abs(offsetX) >= swipeThreshold) {
      // Trigger haptic
      if (navigator.vibrate) {
        try { navigator.vibrate(10); } catch {}
      }

      if (offsetX > 0 && leftActions.length > 0) {
        // Full left-to-right swipe -> trigger first left action
        if (onSwipeRight) onSwipeRight();
        else if (leftActions[0]?.onPress) leftActions[0].onPress();
      } else if (offsetX < 0 && rightActions.length > 0) {
        // Full right-to-left swipe -> trigger first right action
        if (onSwipeLeft) onSwipeLeft();
        else if (rightActions[0]?.onPress) rightActions[0].onPress();
      }
    }

    setIsSwiping(false);
    setOffsetX(0);
  }, [offsetX, swipeThreshold, leftActions, rightActions, onSwipeLeft, onSwipeRight]);

  const renderActions = (actions, side) => {
    if (actions.length === 0) return null;

    return (
      <div
        className={cn(
          'absolute top-0 bottom-0 flex items-stretch',
          side === 'left' ? 'left-0' : 'right-0'
        )}
        style={{
          width: `${Math.abs(offsetX)}px`,
          overflow: 'hidden'
        }}
      >
        {actions.map((action, i) => {
          const Icon = action.icon || (side === 'right' ? Trash2 : Archive);
          const bgColor = action.color || (side === 'right' ? '#ef4444' : '#22c55e');

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (action.onPress) action.onPress();
                setOffsetX(0);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-white text-xs font-medium transition-opacity"
              style={{
                backgroundColor: bgColor,
                opacity: Math.min(Math.abs(offsetX) / swipeThreshold, 1),
                minWidth: '64px'
              }}
            >
              <Icon className="w-5 h-5" />
              {action.label && <span>{action.label}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* Left actions (revealed by swiping right) */}
      {offsetX > 0 && renderActions(leftActions, 'left')}

      {/* Right actions (revealed by swiping left) */}
      {offsetX < 0 && renderActions(rightActions, 'right')}

      {/* Main content */}
      <div
        ref={contentRef}
        className={cn('relative bg-white dark:bg-[#1e1e2d] z-10', isSwiping ? 'swiping' : '')}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Pre-configured action helpers
export const SwipeDeleteAction = (onPress) => ({
  icon: Trash2,
  label: 'Hapus',
  color: '#ef4444',
  onPress
});

export const SwipeArchiveAction = (onPress) => ({
  icon: Archive,
  label: 'Arsip',
  color: '#6366f1',
  onPress
});

export const SwipeEditAction = (onPress) => ({
  icon: Edit,
  label: 'Edit',
  color: '#f59e0b',
  onPress
});

export const SwipeFavoriteAction = (onPress) => ({
  icon: Star,
  label: 'Favorit',
  color: '#eab308',
  onPress
});

export default SwipeableRow;
