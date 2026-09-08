import { useCallback, useRef } from 'react';

/**
 * useRipple - Material Design 3 Ripple Effect Hook
 * 
 * Creates a native Android-style ripple effect on touch/click.
 * Uses CSS animations for 60fps performance.
 * 
 * @param {Object} options
 * @param {string} options.color - Ripple color (default: currentColor)
 * @param {number} options.opacity - Ripple opacity (default: 0.12 per MD3 spec)
 * @param {number} options.duration - Animation duration in ms (default: 400)
 * @param {boolean} options.disabled - Disable ripple
 * @param {boolean} options.centered - Always ripple from center
 * @param {boolean} options.haptic - Trigger haptic feedback (default: true)
 * @returns {{ rippleRef, handleRipple, rippleStyle }}
 */
export function useRipple({
  color = 'currentColor',
  opacity = 0.12,
  duration = 400,
  disabled = false,
  centered = false,
  haptic = true
} = {}) {
  const rippleRef = useRef(null);
  const timeoutRef = useRef(null);

  const triggerHaptic = useCallback(() => {
    if (haptic && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(8); } catch {}
    }
  }, [haptic]);

  const handleRipple = useCallback((e) => {
    if (disabled) return;

    const container = rippleRef.current;
    if (!container) return;

    triggerHaptic();

    // Clean up previous ripples
    const existingRipples = container.querySelectorAll('.mavi-ripple');
    existingRipples.forEach(r => {
      if (r.dataset.removing) return;
      r.dataset.removing = 'true';
      r.style.opacity = '0';
      setTimeout(() => r.remove(), 200);
    });

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;

    let x, y;
    if (centered) {
      x = rect.width / 2;
      y = rect.height / 2;
    } else {
      // Support both mouse and touch events
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      x = clientX - rect.left;
      y = clientY - rect.top;
    }

    const ripple = document.createElement('span');
    ripple.className = 'mavi-ripple';
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      background: ${color};
      opacity: ${opacity};
      border-radius: 50%;
      transform: scale(0);
      pointer-events: none;
      animation: mavi-ripple-expand ${duration}ms cubic-bezier(0.2, 0, 0, 1) forwards;
    `;

    container.appendChild(ripple);

    // Cleanup after animation
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      ripple.style.animation = `mavi-ripple-fade 200ms ease-out forwards`;
      setTimeout(() => {
        if (ripple.parentNode) ripple.remove();
      }, 200);
    }, duration);
  }, [color, opacity, duration, disabled, centered, triggerHaptic]);

  const rippleContainerStyle = {
    position: 'relative',
    overflow: 'hidden',
    // Ensure ripple stays within bounds
    isolation: 'isolate'
  };

  return {
    rippleRef,
    handleRipple,
    rippleContainerStyle
  };
}

/**
 * RippleOverlay - Standalone ripple component
 * Wrap any element to add ripple effect without modifying the element itself.
 * 
 * Usage:
 *   <RippleOverlay>
 *     <YourComponent />
 *   </RippleOverlay>
 */
export function RippleOverlay({
  children,
  color = 'currentColor',
  opacity = 0.12,
  duration = 400,
  disabled = false,
  centered = false,
  haptic = true,
  className = '',
  style = {},
  ...props
}) {
  const { rippleRef, handleRipple, rippleContainerStyle } = useRipple({
    color, opacity, duration, disabled, centered, haptic
  });

  return (
    <div
      ref={rippleRef}
      onClick={handleRipple}
      onTouchStart={handleRipple}
      className={className}
      style={{ ...rippleContainerStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export default useRipple;
