import React, { useState, useMemo, useCallback } from 'react';
import { maviDesignTokens } from '../tokens/theme';
import { GluestackContext } from './useGluestack';

export function GluestackUIProvider({
  children,
  colorMode: initialColorMode = 'light',
  tokens = maviDesignTokens,
  config = {}
}) {
  const [colorMode, setColorMode] = useState(() => {
    if (typeof document !== 'undefined') {
      const existingTheme = document.documentElement.getAttribute('data-theme');
      if (existingTheme === 'dark' || existingTheme === 'light') {
        return existingTheme;
      }
    }
    return initialColorMode;
  });

  const [toasts, setToasts] = useState([]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const closeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ id, title, description, action = 'info', duration = 3500 }) => {
    const toastId = id || Math.random().toString(36).slice(2);
    const newToast = { id: toastId, title, description, action };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        closeToast(toastId);
      }, duration);
    }
  }, [closeToast]);

  const contextValue = useMemo(() => ({
    colorMode,
    toggleColorMode,
    setColorMode,
    tokens,
    toasts,
    showToast,
    closeToast,
    config
  }), [colorMode, toggleColorMode, tokens, toasts, showToast, closeToast, config]);

  return (
    <GluestackContext.Provider value={contextValue}>
      <div 
        className={`gluestack-scope ${colorMode === 'dark' ? 'dark' : ''} text-slate-800 dark:text-slate-100 font-sans`}
        data-theme={colorMode}
        style={{
          '--gluestack-primary': tokens.colors.primary.DEFAULT,
          '--gluestack-teal': tokens.colors.teal.DEFAULT,
          '--gluestack-danger': tokens.colors.danger.DEFAULT,
          '--gluestack-warning': tokens.colors.warning.DEFAULT,
          '--gluestack-success': tokens.colors.success.DEFAULT
        }}
      >
        {children}

        {/* Global Toast Portal */}
        {toasts.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm animate-in fade-in slide-in-from-bottom-2 ${
                  toast.action === 'error' || toast.action === 'danger'
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-100'
                    : toast.action === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100'
                    : toast.action === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100'
                    : 'bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100'
                }`}
              >
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                {toast.description && <div className="text-xs opacity-90 mt-0.5">{toast.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </GluestackContext.Provider>
  );
}
