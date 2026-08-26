/**
 * sentry.js
 * =====================================================
 * Sentry Error Tracking Integration
 * Captures and reports errors for debugging
 * =====================================================
 */

// Check if Sentry is configured
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_ENABLED = Boolean(SENTRY_DSN);

// Sentry instance (lazy loaded)
let sentry = null;

/**
 * Initialize Sentry
 * @returns {Promise|null>}
 */
export async function initSentry() {
  if (!IS_ENABLED) {
    console.log('[Sentry] Not configured. Set VITE_SENTRY_DSN to enable error tracking.');
    return null;
  }

  try {
    const { init, browserTracingIntegration, replayIntegration } = await import('@sentry/react');

    sentry = init({
      dsn: SENTRY_DSN,
      integrations: [
        browserTracingIntegration(),
        replayIntegration({
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        }),
      ],
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // Sampling rates
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // All sessions with errors

      // Ignore patterns
      ignoreErrors: [
        // Network errors
        /Network Error/i,
        /Failed to fetch/i,
        /Network request failed/i,

        // Browser extensions
        /chrome-extension:/i,
        /moz-extension:/i,
        /safari-extension:/i,

        // Third-party
        /ResizeObserver/i,
        /Non-Error promise rejection/i,

        // User abort
        /Aborted/i,
        /CancelledError/i,
      ],

      // Before send hook for filtering
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.headers;
          delete event.request.cookies;
        }

        // Add app context
        event.tags = {
          ...event.tags,
          app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
          app_env: import.meta.env.MODE || 'unknown',
        };

        return event;
      },
    });

    console.log('[Sentry] Initialized successfully');
    return sentry;
  } catch (err) {
    console.error('[Sentry] Failed to initialize:', err);
    return null;
  }
}

/**
 * Capture an error
 * @param {Error} error
 * @param {Object} context
 */
export function captureError(error, context = {}) {
  if (!IS_ENABLED) {
    console.error('[Error]', error, context);
    return;
  }

  try {
    const { captureException } = require('@sentry/react');
    captureException(error, { extra: context });
  } catch (err) {
    console.error('[Sentry] Failed to capture error:', err);
  }
}

/**
 * Capture a message
 * @param {string} message
 * @param {'debug'|'info'|'warning'|'error'} level
 */
export function captureMessage(message, level = 'info') {
  if (!IS_ENABLED) {
    console.log(`[${level}]`, message);
    return;
  }

  try {
    const { captureMessage } = require('@sentry/react');
    captureMessage(message, level);
  } catch (err) {
    console.error('[Sentry] Failed to capture message:', err);
  }
}

/**
 * Add breadcrumb for debugging
 * @param {string} category
 * @param {string} message
 * @param {Object} data
 */
export function addBreadcrumb(category, message, data = {}) {
  if (!IS_ENABLED) return;

  try {
    const { addBreadcrumb } = require('@sentry/react');
    addBreadcrumb({
      category,
      message,
      data,
      timestamp: Date.now(),
    });
  } catch (err) {
    // Ignore
  }
}

/**
 * Set user context
 * @param {Object} user
 */
export function setUser(user) {
  if (!IS_ENABLED) return;

  try {
    const { setUser } = require('@sentry/react');
    setUser({
      id: user?.id,
      email: user?.email,
      username: user?.user_metadata?.name || user?.email,
    });
  } catch (err) {
    // Ignore
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  if (!IS_ENABLED) return;

  try {
    const { setUser } = require('@sentry/react');
    setUser(null);
  } catch (err) {
    // Ignore
  }
}

/**
 * Set organization context
 * @param {Object} organization
 */
export function setOrganization(organization) {
  if (!IS_ENABLED) return;

  try {
    const { setTag } = require('@sentry/react');
    setTag('organization_id', organization?.id);
    setTag('organization_plan', organization?.plan || 'unknown');
  } catch (err) {
    // Ignore
  }
}

/**
 * Start a transaction for performance monitoring
 * @param {string} name
 * @param {Object} options
 * @returns {Transaction|null}
 */
export function startTransaction(name, options = {}) {
  if (!IS_ENABLED) return null;

  try {
    const { startTransaction } = require('@sentry/react');
    return startTransaction({
      name,
      op: options.op || 'custom',
      data: options.data || {},
    });
  } catch (err) {
    return null;
  }
}

/**
 * Get Sentry instance for advanced use
 * @returns {Object|null}
 */
export function getSentry() {
  return sentry;
}

/**
 * Check if Sentry is enabled
 * @returns {boolean}
 */
export function isSentryEnabled() {
  return IS_ENABLED;
}

// ─── React Integration ────────────────────────────────────────────────────────

/**
 * Get Sentry ErrorBoundary component
 * @returns {React.Component|null}
 */
export async function getErrorBoundary() {
  if (!IS_ENABLED) {
    // Return a simple fallback
    return null;
  }

  try {
    const { ErrorBoundary } = await import('@sentry/react');
    return ErrorBoundary;
  } catch (err) {
    return null;
  }
}

// ─── Browser Performance ─────────────────────────────────────────────────────

/**
 * Measure a function's execution time
 * @param {string} name
 * @param {Function} fn
 * @returns {any}
 */
export function measure(name, fn) {
  const start = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - start;

    addBreadcrumb('performance', `${name} completed`, { duration: `${duration.toFixed(2)}ms` });

    return result;
  } catch (err) {
    const duration = performance.now() - start;
    addBreadcrumb('performance', `${name} failed`, { duration: `${duration.toFixed(2)}ms`, error: err.message });
    throw err;
  }
}

/**
 * Measure async function execution
 * @param {string} name
 * @param {Function} fn
 * @returns {Promise<any>}
 */
export async function measureAsync(name, fn) {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    addBreadcrumb('performance', `${name} completed`, { duration: `${duration.toFixed(2)}ms` });

    return result;
  } catch (err) {
    const duration = performance.now() - start;
    captureError(err, { operation: name, duration });
    throw err;
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default {
  initSentry,
  captureError,
  captureMessage,
  addBreadcrumb,
  setUser,
  clearUser,
  setOrganization,
  startTransaction,
  getSentry,
  isSentryEnabled,
  getErrorBoundary,
  measure,
  measureAsync,
};
