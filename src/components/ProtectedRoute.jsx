/**
 * ProtectedRoute.jsx
 * =====================================================
 * Route guard component for protected pages
 * =====================================================
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute - Requires authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string[]} [props.roles] - Required roles (any of these)
 * @param {boolean} [props.requireOrganization] - Require active organization
 * @param {React.ReactNode} [props.fallback] - Custom loading/fallback
 */
export function ProtectedRoute({
  children,
  roles = [],
  requireOrganization = false,
  fallback = null,
}) {
  const {
    user,
    loading,
    isAuthenticated,
    userRole,
    currentOrganization,
  } = useAuth();

  const location = useLocation();

  // Show loading state
  if (loading) {
    return fallback || <LoadingFallback />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Require organization but none selected
  if (requireOrganization && !currentOrganization) {
    return <Navigate to="/select-organization" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (roles.length > 0) {
    const roleHierarchy = {
      owner: ['owner', 'admin', 'member', 'viewer'],
      admin: ['admin', 'member', 'viewer'],
      member: ['member', 'viewer'],
      viewer: ['viewer'],
    };

    const allowedRoles = roleHierarchy[userRole] || [];
    const hasRequiredRole = roles.some(role => allowedRoles.includes(role));

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

/**
 * AdminRoute - Requires admin/owner role
 */
export function AdminRoute({ children, fallback }) {
  return (
    <ProtectedRoute
      roles={['owner', 'admin']}
      fallback={fallback}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * EditorRoute - Requires member+ role (can edit apps)
 */
export function EditorRoute({ children, fallback }) {
  return (
    <ProtectedRoute
      roles={['owner', 'admin', 'member']}
      fallback={fallback}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * ViewerRoute - Any authenticated user
 */
export function ViewerRoute({ children, fallback }) {
  return (
    <ProtectedRoute fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * GuestRoute - Only for non-authenticated users (login, register pages)
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    // Redirect to previous page or dashboard
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e5e7eb',
        borderTopColor: '#7c3aed',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{
        marginTop: '16px',
        color: '#6b7280',
        fontSize: '0.875rem',
      }}>
        Loading...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * OrganizationGate - Requires specific organization access
 * @param {Object} props
 * @param {string[]} props.allowedPlans - e.g., ['professional', 'enterprise']
 * @param {React.ReactNode} props.upgradeMessage - Message for upgrade
 */
export function OrganizationGate({
  children,
  allowedPlans = [],
  upgradeMessage = null,
}) {
  const { currentOrganization } = useAuth();

  if (!currentOrganization) {
    return <Navigate to="/select-organization" replace />;
  }

  if (allowedPlans.length > 0 && !allowedPlans.includes(currentOrganization.plan)) {
    return upgradeMessage || (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <h2 style={{ color: '#111827', marginBottom: '8px' }}>
          Upgrade Required
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          This feature is not available on your current plan.
        </p>
        <a
          href="/billing"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#7c3aed',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          Upgrade Plan
        </a>
      </div>
    );
  }

  return children;
}

/**
 * PlanGate - Requires specific plan tier
 * @param {string[]} props.requiredPlans - e.g., ['professional', 'enterprise']
 * @param {React.ReactNode} props.children
 */
export function PlanGate({ requiredPlans = [], children }) {
  return (
    <OrganizationGate allowedPlans={requiredPlans}>
      {children}
    </OrganizationGate>
  );
}
