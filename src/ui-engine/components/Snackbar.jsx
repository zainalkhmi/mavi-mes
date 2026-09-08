/**
 * Snackbar Component - Material Design 3
 * Brief feedback messages at the bottom of the screen
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';

// ─── Snackbar Manager (imperative API) ─────────────────────

let _snackbarQueue = [];
let _snackbarSetState = null;

/**
 * Show a snackbar message (imperative API)
 * @param {Object} options
 * @param {string} options.message - The message text
 * @param {string} [options.actionLabel] - Optional action button label
 * @param {Function} [options.onAction] - Callback when action is pressed
 * @param {number} [options.duration=4000] - Auto-dismiss duration in ms (0 = persist)
 * @param {boolean} [options.showClose=false] - Show close button
 * @param {'default'|'error'|'success'} [options.variant='default'] - Visual variant
 */
export function showSnackbar({
  message,
  actionLabel,
  onAction,
  duration = 4000,
  showClose = false,
  variant = 'default'
}) {
  const id = Date.now() + Math.random();
  const item = { id, message, actionLabel, onAction, duration, showClose, variant, visible: true };
  _snackbarQueue.push(item);

  if (_snackbarSetState) {
    _snackbarSetState([..._snackbarQueue]);
  }

  if (duration > 0) {
    setTimeout(() => dismissSnackbar(id), duration);
  }

  return id;
}

export function dismissSnackbar(id) {
  const idx = _snackbarQueue.findIndex(s => s.id === id);
  if (idx !== -1) {
    _snackbarQueue[idx].visible = false;
    if (_snackbarSetState) _snackbarSetState([..._snackbarQueue]);

    // Remove after exit animation
    setTimeout(() => {
      _snackbarQueue = _snackbarQueue.filter(s => s.id !== id);
      if (_snackbarSetState) _snackbarSetState([..._snackbarQueue]);
    }, 300);
  }
}

// ─── Snackbar Host (place once in app root) ────────────────

export function SnackbarHost({ className }) {
  const [snackbars, setSnackbars] = useState([]);

  useEffect(() => {
    _snackbarSetState = setSnackbars;
    return () => { _snackbarSetState = null; };
  }, []);

  if (snackbars.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-2 items-center sm:items-end pointer-events-none',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {snackbars.map(snack => (
        <SnackbarItem key={snack.id} {...snack} />
      ))}
    </div>
  );
}

// ─── Individual Snackbar ───────────────────────────────────

function SnackbarItem({
  id,
  message,
  actionLabel,
  onAction,
  showClose,
  variant = 'default',
  visible
}) {
  const variantClasses = {
    default: 'bg-slate-800 dark:bg-slate-700 text-white',
    error: 'bg-rose-800 text-white',
    success: 'bg-emerald-800 text-white'
  }[variant] || 'bg-slate-800 text-white';

  const handleAction = useCallback(() => {
    if (onAction) onAction();
    dismissSnackbar(id);
  }, [id, onAction]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-md w-full sm:w-auto min-w-[280px]',
        'text-sm font-medium',
        variantClasses
      )}
      style={{
        animation: visible
          ? 'mavi-snackbar-enter 0.25s cubic-bezier(0.05, 0.7, 0.1, 1) forwards'
          : 'mavi-snackbar-exit 0.2s cubic-bezier(0.3, 0, 0.8, 0.15) forwards'
      }}
      role="status"
      aria-live="polite"
    >
      {/* Message */}
      <span className="flex-1 leading-snug">{message}</span>

      {/* Action Button */}
      {actionLabel && (
        <button
          type="button"
          onClick={handleAction}
          className="shrink-0 px-3 py-1 rounded-lg font-bold text-[#dcbfd3] hover:bg-white/10 transition-colors"
          style={{ minHeight: '36px' }}
        >
          {actionLabel}
        </button>
      )}

      {/* Close Button */}
      {showClose && (
        <button
          type="button"
          onClick={() => dismissSnackbar(id)}
          className="shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/70"
          style={{ minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Declarative Snackbar Component ────────────────────────

export function Snackbar({
  isOpen = false,
  message,
  actionLabel,
  onAction,
  onClose,
  variant = 'default',
  showClose = true,
  className
}) {
  if (!isOpen) return null;

  const variantClasses = {
    default: 'bg-slate-800 dark:bg-slate-700 text-white',
    error: 'bg-rose-800 text-white',
    success: 'bg-emerald-800 text-white'
  }[variant] || 'bg-slate-800 text-white';

  return (
    <div
      className={cn(
        'fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-md',
        'text-sm font-medium',
        variantClasses,
        className
      )}
      style={{
        animation: 'mavi-snackbar-enter 0.25s cubic-bezier(0.05, 0.7, 0.1, 1) forwards',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      role="status"
      aria-live="polite"
    >
      <span className="flex-1 leading-snug">{message}</span>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 px-3 py-1 rounded-lg font-bold text-[#dcbfd3] hover:bg-white/10 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      {showClose && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/70"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Snackbar;
