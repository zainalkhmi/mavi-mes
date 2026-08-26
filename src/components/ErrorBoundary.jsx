/**
 * ErrorBoundary.jsx
 * =====================================================
 * Global React Error Boundary with Sentry integration
 * Catches and reports React errors
 * =====================================================
 */

import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';

// Optional Sentry integration
let Sentry = null;
if (typeof require !== 'undefined') {
  try {
    Sentry = require('@sentry/react')?.captureException;
  } catch (e) {
    // Sentry not configured
  }
}

/**
 * Global Error Boundary Component
 * Wraps the app to catch React errors
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }

    // Report to Sentry if available
    if (Sentry) {
      Sentry(error, {
        extra: {
          componentStack: errorInfo?.componentStack,
        },
      });
    }

    // Store error info for details display
    this.setState({ errorInfo });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            {/* Icon */}
            <div style={styles.iconContainer}>
              <AlertTriangle size={48} color="#dc2626" />
            </div>

            {/* Title */}
            <h1 style={styles.title}>Something went wrong</h1>

            {/* Description */}
            <p style={styles.description}>
              We encountered an unexpected error. This has been reported and we'll
              work on fixing it.
            </p>

            {/* Error Message (sanitized) */}
            {this.state.error?.message && (
              <div style={styles.errorMessage}>
                {this.state.error.message}
              </div>
            )}

            {/* Actions */}
            <div style={styles.actions}>
              <button
                onClick={this.handleReload}
                style={styles.primaryButton}
              >
                <RefreshCw size={18} />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={styles.secondaryButton}
              >
                <Home size={18} />
                Go Home
              </button>
            </div>

            {/* Show Details (Development Only) */}
            {(import.meta.env.DEV || this.state.showDetails) && this.state.errorInfo && (
              <div style={styles.detailsSection}>
                <button
                  onClick={this.toggleDetails}
                  style={styles.detailsToggle}
                >
                  <Bug size={16} />
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                  {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {this.state.showDetails && (
                  <div style={styles.stackTrace}>
                    <h4 style={styles.stackTitle}>Component Stack:</h4>
                    <pre style={styles.stackPre}>
                      {this.state.errorInfo.componentStack}
                    </pre>

                    <h4 style={styles.stackTitle}>Error:</h4>
                    <pre style={styles.stackPre}>
                      {this.state.error?.toString()}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Simple Error Fallback Component ─────────────────────────────────────────

/**
 * Simple functional error fallback for components
 * Use inside components that might fail
 */
export function ErrorFallback({ error, resetError }) {
  return (
    <div style={styles.fallbackContainer}>
      <AlertTriangle size={24} color="#dc2626" />
      <div style={styles.fallbackContent}>
        <h4 style={styles.fallbackTitle}>Error</h4>
        <p style={styles.fallbackMessage}>
          {error?.message || 'An unexpected error occurred'}
        </p>
        {resetError && (
          <button onClick={resetError} style={styles.resetButton}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Async Error Handler ─────────────────────────────────────────────────────

/**
 * HOC to wrap async operations with error handling
 * @param {Promise} promise
 * @returns {Promise}
 */
export function withErrorHandling(promise) {
  return promise.catch(error => {
    if (Sentry) {
      Sentry(error);
    }
    console.error('Async error:', error);
    throw error;
  });
}

/**
 * Hook for handling async errors in components
 */
export function useAsyncError() {
  const [, setError] = React.useState();

  return React.useCallback((error) => {
    setError(() => {
      if (Sentry) {
        Sentry(error);
      }
      return error;
    });
  }, []);
}

// ─── API Error Handler ───────────────────────────────────────────────────────

/**
 * Handle API errors consistently
 * @param {Error} error
 * @param {Function} fallbackMessage
 * @returns {string}
 */
export function handleApiError(error, fallbackMessage = 'An error occurred') {
  // Network error
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return data?.message || 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'Resource not found.';
    case 429:
      return 'Too many requests. Please wait a moment.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return data?.message || fallbackMessage;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 12px',
  },
  description: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px',
    lineHeight: '1.6',
  },
  errorMessage: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#dc2626',
    marginBottom: '24px',
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  detailsSection: {
    marginTop: '32px',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '24px',
  },
  detailsToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer',
    margin: '0 auto',
  },
  stackTrace: {
    marginTop: '16px',
    textAlign: 'left',
  },
  stackTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    margin: '16px 0 8px',
  },
  stackPre: {
    padding: '12px',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    overflow: 'auto',
    maxHeight: '300px',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  fallbackContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    margin: '16px 0',
  },
  fallbackContent: {
    flex: 1,
  },
  fallbackTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 4px',
  },
  fallbackMessage: {
    fontSize: '13px',
    color: '#991b1b',
    margin: 0,
  },
  resetButton: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

export default ErrorBoundary;
