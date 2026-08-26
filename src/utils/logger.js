/**
 * logger.js
 * =====================================================
 * Structured Logging Utility
 * Provides consistent logging across the application
 * =====================================================
 */

// Log levels
const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = import.meta.env.DEV ? LEVELS.DEBUG : LEVELS.INFO;

// Log store for debugging
const logStore = [];
const MAX_LOGS = 500;

// Categories for filtering
const CATEGORIES = {
  AUTH: 'auth',
  API: 'api',
  APP: 'app',
  SYSTEM: 'system',
  PERFORMANCE: 'perf',
  ERROR: 'error',
};

/**
 * Format log entry
 */
function formatEntry(level, category, message, data) {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
    trace: import.meta.env.DEV ? new Error().stack : null,
  };
}

/**
 * Store log entry
 */
function storeEntry(entry) {
  logStore.unshift(entry);
  if (logStore.length > MAX_LOGS) {
    logStore.pop();
  }
}

/**
 * Get logs from store
 * @param {Object} filters
 * @returns {Array}
 */
export function getLogs(filters = {}) {
  let logs = [...logStore];

  if (filters.level) {
    logs = logs.filter(l => l.level === filters.level);
  }
  if (filters.category) {
    logs = logs.filter(l => l.category === filters.category);
  }
  if (filters.since) {
    logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.since));
  }

  return logs.slice(0, filters.limit || 100);
}

/**
 * Clear logs
 */
export function clearLogs() {
  logStore.length = 0;
}

/**
 * Log debug message
 */
export function debug(category, message, data) {
  if (currentLevel <= LEVELS.DEBUG) {
    const entry = formatEntry('DEBUG', category, message, data);
    storeEntry(entry);
    console.debug(`[${category}]`, message, data || '');
  }
}

/**
 * Log info message
 */
export function info(category, message, data) {
  if (currentLevel <= LEVELS.INFO) {
    const entry = formatEntry('INFO', category, message, data);
    storeEntry(entry);
    console.info(`[${category}]`, message, data || '');
  }
}

/**
 * Log warning message
 */
export function warn(category, message, data) {
  if (currentLevel <= LEVELS.WARN) {
    const entry = formatEntry('WARN', category, message, data);
    storeEntry(entry);
    console.warn(`[${category}]`, message, data || '');
  }
}

/**
 * Log error message
 */
export function error(category, message, data) {
  if (currentLevel <= LEVELS.ERROR) {
    const entry = formatEntry('ERROR', category, message, data);
    storeEntry(entry);
    console.error(`[${category}]`, message, data || '');
  }
}

// ─── Convenience loggers ────────────────────────────────────────────────────

export const authLogger = {
  debug: (msg, data) => debug(CATEGORIES.AUTH, msg, data),
  info: (msg, data) => info(CATEGORIES.AUTH, msg, data),
  warn: (msg, data) => warn(CATEGORIES.AUTH, msg, data),
  error: (msg, data) => error(CATEGORIES.AUTH, msg, data),
};

export const apiLogger = {
  debug: (msg, data) => debug(CATEGORIES.API, msg, data),
  info: (msg, data) => info(CATEGORIES.API, msg, data),
  warn: (msg, data) => warn(CATEGORIES.API, msg, data),
  error: (msg, data) => error(CATEGORIES.API, msg, data),
};

export const appLogger = {
  debug: (msg, data) => debug(CATEGORIES.APP, msg, data),
  info: (msg, data) => info(CATEGORIES.APP, msg, data),
  warn: (msg, data) => warn(CATEGORIES.APP, msg, data),
  error: (msg, data) => error(CATEGORIES.APP, msg, data),
};

export const systemLogger = {
  debug: (msg, data) => debug(CATEGORIES.SYSTEM, msg, data),
  info: (msg, data) => info(CATEGORIES.SYSTEM, msg, data),
  warn: (msg, data) => warn(CATEGORIES.SYSTEM, msg, data),
  error: (msg, data) => error(CATEGORIES.SYSTEM, msg, data),
};

export const perfLogger = {
  debug: (msg, data) => debug(CATEGORIES.PERFORMANCE, msg, data),
  info: (msg, data) => info(CATEGORIES.PERFORMANCE, msg, data),
  warn: (msg, data) => warn(CATEGORIES.PERFORMANCE, msg, data),
  error: (msg, data) => error(CATEGORIES.PERFORMANCE, msg, data),
};

// ─── API Request Logger ──────────────────────────────────────────────────────

/**
 * Wrap fetch with logging
 * @param {Function} fetchFn
 * @returns {Function}
 */
export function withLogging(fetchFn) {
  return async (url, options = {}) => {
    const start = performance.now();
    const requestId = crypto.randomUUID?.() || Math.random().toString(36).substring(7);

    apiLogger.debug(`[${requestId}] → ${options.method || 'GET'} ${url}`, {
      requestId,
      method: options.method || 'GET',
      url,
    });

    try {
      const response = await fetchFn(url, options);
      const duration = performance.now() - start;

      apiLogger.info(`[${requestId}] ← ${response.status} (${duration.toFixed(0)}ms) ${url}`, {
        requestId,
        status: response.status,
        duration: duration.toFixed(0),
        url,
      });

      return response;
    } catch (err) {
      const duration = performance.now() - start;

      apiLogger.error(`[${requestId}] ✗ Error (${duration.toFixed(0)}ms) ${url}`, {
        requestId,
        error: err.message,
        duration: duration.toFixed(0),
        url,
      });

      throw err;
    }
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export default {
  debug,
  info,
  warn,
  error,
  getLogs,
  clearLogs,
  CATEGORIES,
  LEVELS,
  authLogger,
  apiLogger,
  appLogger,
  systemLogger,
  perfLogger,
  withLogging,
};
