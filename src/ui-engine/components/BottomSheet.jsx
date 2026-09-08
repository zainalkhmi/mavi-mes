/**
 * BottomSheet Component - Material Design 3
 * Draggable bottom sheet with snap points
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';

export function BottomSheet({
  isOpen = false,
  onClose,
  children,
  snapPoints = [0.5, 0.92],  // fraction of viewport height
  defaultSnap = 0,            // index into snapPoints
  showDragHandle = true,
  showBackdrop = true,
  closeOnBackdropPress = true,
  className
}) {
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, startHeight: 0, isDragging: false });
  const [currentHeight, setCurrentHeight] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Set initial height when opened
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      const vh = window.innerHeight;
      setCurrentHeight(vh * snapPoints[defaultSnap]);
    }
  }, [isOpen, defaultSnap, snapPoints]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setCurrentHeight(null);
      setIsClosing(false);
      if (onClose) onClose();
    }, 250);
  }, [onClose]);

  const handleDragStart = useCallback((e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      startY: clientY,
      startHeight: currentHeight || 0,
      isDragging: true
    };
  }, [currentHeight]);

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = dragRef.current.startY - clientY;
    const newHeight = Math.max(100, dragRef.current.startHeight + deltaY);
    const maxHeight = window.innerHeight * 0.95;
    setCurrentHeight(Math.min(newHeight, maxHeight));
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;

    const vh = window.innerHeight;
    const currentFraction = (currentHeight || 0) / vh;

    // Snap to closest snap point, or close if dragged below threshold
    if (currentFraction < 0.15) {
      handleClose();
      return;
    }

    let closestSnap = snapPoints[0];
    let minDist = Math.abs(currentFraction - snapPoints[0]);
    for (let i = 1; i < snapPoints.length; i++) {
      const dist = Math.abs(currentFraction - snapPoints[i]);
      if (dist < minDist) {
        minDist = dist;
        closestSnap = snapPoints[i];
      }
    }
    setCurrentHeight(vh * closestSnap);
  }, [currentHeight, snapPoints, handleClose]);

  // Attach global listeners during drag
  useEffect(() => {
    const handleGlobalMove = (e) => handleDragMove(e);
    const handleGlobalEnd = () => handleDragEnd();

    if (dragRef.current.isDragging) {
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalEnd);
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      {showBackdrop && (
        <div
          onClick={closeOnBackdropPress ? handleClose : undefined}
          className={cn(
            'fixed inset-0 bg-black/40 backdrop-blur-[2px]',
            isClosing ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            animation: isClosing
              ? 'mavi-backdrop-fadeout 250ms ease forwards'
              : 'mavi-backdrop-fadein 250ms ease forwards',
            transition: 'opacity 250ms ease'
          }}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e1e2d] rounded-t-[28px] flex flex-col',
          'shadow-[0_-8px_30px_rgba(0,0,0,0.12)]',
          className
        )}
        style={{
          height: currentHeight ? `${currentHeight}px` : 'auto',
          maxHeight: '95vh',
          transition: dragRef.current.isDragging ? 'none' : 'height 0.3s cubic-bezier(0.2, 0, 0, 1)',
          animation: !isClosing
            ? 'mavi-bottomsheet-slide-up 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) forwards'
            : 'mavi-bottomsheet-slide-down 0.25s cubic-bezier(0.3, 0, 0.8, 0.15) forwards'
        }}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div
            className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none touch-none"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 mavi-scroll-momentum">
          {children}
        </div>
      </div>
    </div>
  );
}

export function BottomSheetHeader({ children, onClose, className }) {
  return (
    <div className={cn('flex items-center justify-between px-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3', className)}>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{children}</h3>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          style={{ minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function BottomSheetBody({ children, className }) {
  return <div className={cn('flex-1', className)}>{children}</div>;
}

export function BottomSheetFooter({ children, className }) {
  return (
    <div className={cn(
      'px-2 pt-3 pb-[env(safe-area-inset-bottom)] border-t border-slate-100 dark:border-slate-800 flex items-center gap-3',
      className
    )}>
      {children}
    </div>
  );
}

export default BottomSheet;
