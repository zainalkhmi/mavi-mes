/**
 * appHealthMonitor.js
 * =====================================================
 * Application Health Monitoring Service
 * Tracks app health, performance, and user activity
 * =====================================================
 */

import { captureMessage, addBreadcrumb } from './sentry';

// Health check intervals
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute
const PERFORMANCE_SAMPLE_RATE = 0.1; // 10% of actions

// Health state
const state = {
  isOnline: navigator.onLine,
  lastHealthCheck: null,
  lastOnline: Date.now(),
  lastOffline: null,
  healthScore: 100,
  metrics: {
    apiCalls: 0,
    apiFailures: 0,
    pageLoads: 0,
    errors: 0,
    warnings: 0,
  },
  performance: {
    avgPageLoad: 0,
    avgApiResponse: 0,
    slowApiCalls: 0,
  },
  listeners: new Set(),
};

// ─── Online/Offline Detection ───────────────────────────────────────────────

window.addEventListener('online', () => {
  state.isOnline = true;
  state.lastOnline = Date.now();
  addBreadcrumb('system', 'Connection restored', {
    offlineDuration: state.lastOffline ? Date.now() - state.lastOffline : 0,
  });
  notifyListeners('online');
});

window.addEventListener('offline', () => {
  state.isOnline = false;
  state.lastOffline = Date.now();
  captureMessage('Application went offline', 'warning');
  addBreadcrumb('system', 'Connection lost');
  notifyListeners('offline');
});

// ─── Health Checks ──────────────────────────────────────────────────────────

/**
 * Perform health check
 * @returns {Object} Health status
 */
export function performHealthCheck() {
  const checks = [];
  let score = 100;

  // Check 1: Online status
  if (!state.isOnline) {
    checks.push({ name: 'network', status: 'error', message: 'Offline' });
    score -= 30;
  } else {
    checks.push({ name: 'network', status: 'ok', message: 'Online' });
  }

  // Check 2: API failure rate
  const apiFailureRate = state.metrics.apiCalls > 0
    ? state.metrics.apiFailures / state.metrics.apiCalls
    : 0;

  if (apiFailureRate > 0.5) {
    checks.push({ name: 'api', status: 'error', message: `${(apiFailureRate * 100).toFixed(1)}% failure rate` });
    score -= 25;
  } else if (apiFailureRate > 0.1) {
    checks.push({ name: 'api', status: 'warning', message: `${(apiFailureRate * 100).toFixed(1)}% failure rate` });
    score -= 10;
  } else {
    checks.push({ name: 'api', status: 'ok', message: 'Healthy' });
  }

  // Check 3: Error rate
  const errorRate = state.metrics.pageLoads > 0
    ? state.metrics.errors / state.metrics.pageLoads
    : 0;

  if (errorRate > 0.1) {
    checks.push({ name: 'errors', status: 'error', message: `${errorRate * 100}% error rate` });
    score -= 25;
  } else if (errorRate > 0.01) {
    checks.push({ name: 'errors', status: 'warning', message: `${errorRate * 100}% error rate` });
    score -= 10;
  } else {
    checks.push({ name: 'errors', status: 'ok', message: 'No errors' });
  }

  // Check 4: Performance
  if (state.performance.avgApiResponse > 5000) {
    checks.push({ name: 'performance', status: 'error', message: `Slow API: ${state.performance.avgApiResponse}ms` });
    score -= 20;
  } else if (state.performance.avgApiResponse > 2000) {
    checks.push({ name: 'performance', status: 'warning', message: `Slow API: ${state.performance.avgApiResponse}ms` });
    score -= 5;
  } else {
    checks.push({ name: 'performance', status: 'ok', message: 'Good' });
  }

  const healthStatus = {
    timestamp: new Date().toISOString(),
    score: Math.max(0, score),
    status: score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy',
    checks,
    isOnline: state.isOnline,
    metrics: { ...state.metrics },
    performance: { ...state.performance },
  };

  state.lastHealthCheck = healthStatus;
  state.healthScore = healthStatus.score;

  return healthStatus;
}

/**
 * Get current health status
 * @returns {Object}
 */
export function getHealthStatus() {
  return {
    ...state.lastHealthCheck,
    isOnline: state.isOnline,
    healthScore: state.healthScore,
  };
}

// ─── Metrics Tracking ──────────────────────────────────────────────────────

/**
 * Record an API call
 * @param {Object} options
 */
export function recordApiCall({ success, duration, endpoint, statusCode }) {
  state.metrics.apiCalls++;

  if (!success) {
    state.metrics.apiFailures++;
  }

  // Update average API response time
  const prevAvg = state.performance.avgApiResponse;
  const prevCount = state.metrics.apiCalls - 1;
  state.performance.avgApiResponse =
    prevCount > 0
      ? (prevAvg * prevCount + duration) / state.metrics.apiCalls
      : duration;

  // Track slow API calls
  if (duration > 5000) {
    state.performance.slowApiCalls++;
    addBreadcrumb('performance', `Slow API: ${endpoint}`, {
      duration,
      statusCode,
    });
  }

  // Sample API failures for Sentry
  if (!success && Math.random() < 0.1) {
    captureMessage(`API failure: ${endpoint}`, 'error');
  }

  notifyListeners('apiCall', { success, duration, endpoint });
}

/**
 * Record a page load
 * @param {number} duration - Load time in ms
 */
export function recordPageLoad(duration) {
  state.metrics.pageLoads++;

  const prevAvg = state.performance.avgPageLoad;
  const prevCount = state.metrics.pageLoads - 1;
  state.performance.avgPageLoad =
    prevCount > 0
      ? (prevAvg * prevCount + duration) / state.metrics.pageLoads
      : duration;

  // Track slow page loads
  if (duration > 3000) {
    addBreadcrumb('performance', `Slow page load: ${window.location.pathname}`, {
      duration,
    });
  }
}

/**
 * Record an error
 */
export function recordError() {
  state.metrics.errors++;
  notifyListeners('error');
}

/**
 * Record a warning
 */
export function recordWarning() {
  state.metrics.warnings++;
  notifyListeners('warning');
}

/**
 * Reset metrics
 */
export function resetMetrics() {
  state.metrics = {
    apiCalls: 0,
    apiFailures: 0,
    pageLoads: 0,
    errors: 0,
    warnings: 0,
  };
  state.performance = {
    avgPageLoad: 0,
    avgApiResponse: 0,
    slowApiCalls: 0,
  };
  notifyListeners('reset');
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

/**
 * Subscribe to health events
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function addHealthListener(callback) {
  state.listeners.add(callback);
  return () => state.listeners.delete(callback);
}

function notifyListeners(event, data) {
  state.listeners.forEach(callback => {
    try {
      callback(event, data);
    } catch (e) {
      console.error('Health listener error:', e);
    }
  });
}

// ─── Periodic Health Check ──────────────────────────────────────────────────

let healthCheckInterval = null;

/**
 * Start periodic health checks
 */
export function startHealthChecks() {
  if (healthCheckInterval) return;

  // Initial check
  performHealthCheck();

  // Periodic checks
  healthCheckInterval = setInterval(() => {
    const status = performHealthCheck();

    // Alert on degraded health
    if (status.status === 'unhealthy') {
      captureMessage('Application health: UNHEALTHY', 'error');
    } else if (status.status === 'degraded') {
      captureMessage('Application health: DEGRADED', 'warning');
    }
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * Stop periodic health checks
 */
export function stopHealthChecks() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

// ─── Performance Markers ────────────────────────────────────────────────────

/**
 * Start a performance timer
 * @param {string} name
 * @returns {Function} End timer function
 */
export function startTimer(name) {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    addBreadcrumb('performance', `${name} completed`, { duration: `${duration.toFixed(2)}ms` });
    return duration;
  };
}

/**
 * Measure a function's performance
 * @param {string} name
 * @param {Function} fn
 * @returns {any}
 */
export function measure(name, fn) {
  const end = startTimer(name);
  try {
    const result = fn();
    end();
    return result;
  } catch (e) {
    end();
    throw e;
  }
}

// ─── User Activity Tracking ─────────────────────────────────────────────────

let activityTimeout = null;
let lastActivity = Date.now();

/**
 * Track user activity
 */
export function trackActivity() {
  lastActivity = Date.now();

  // Debounce
  if (activityTimeout) clearTimeout(activityTimeout);

  activityTimeout = setTimeout(() => {
    const idleTime = Date.now() - lastActivity;

    if (idleTime > 300000) { // 5 minutes
      addBreadcrumb('user', 'User became idle', { idleTime });
    }
  }, 300000);
}

// Track user interactions
['click', 'scroll', 'keypress', 'mousemove'].forEach(event => {
  document.addEventListener(event, trackActivity, { passive: true });
});

// ─── Get Metrics Summary ────────────────────────────────────────────────────

/**
 * Get metrics summary
 * @returns {Object}
 */
export function getMetricsSummary() {
  const apiFailureRate = state.metrics.apiCalls > 0
    ? (state.metrics.apiFailures / state.metrics.apiCalls * 100).toFixed(2)
    : '0.00';

  return {
    apiCalls: state.metrics.apiCalls,
    apiFailures: state.metrics.apiFailures,
    apiFailureRate: `${apiFailureRate}%`,
    pageLoads: state.metrics.pageLoads,
    errors: state.metrics.errors,
    warnings: state.metrics.warnings,
    avgPageLoad: `${state.performance.avgPageLoad.toFixed(0)}ms`,
    avgApiResponse: `${state.performance.avgApiResponse.toFixed(0)}ms`,
    slowApiCalls: state.performance.slowApiCalls,
    isOnline: state.isOnline,
    healthScore: state.healthScore,
    lastOnline: state.lastOnline,
    lastOffline: state.lastOffline,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export default {
  performHealthCheck,
  getHealthStatus,
  recordApiCall,
  recordPageLoad,
  recordError,
  recordWarning,
  resetMetrics,
  addHealthListener,
  startHealthChecks,
  stopHealthChecks,
  startTimer,
  measure,
  getMetricsSummary,
  trackActivity,
};
