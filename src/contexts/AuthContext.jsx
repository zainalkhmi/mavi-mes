/**
 * AuthContext.jsx
 * =====================================================
 * React Context for Authentication State Management
 * =====================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCurrentSession,
  getCurrentUser,
  onAuthChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  signOut,
  sendPasswordReset,
  updateProfile,
  getUserOrganizations,
  switchOrganization,
  getUserRole,
  isDemoMode,
} from '../utils/supabaseAuth';

// Create context
const AuthContext = createContext(null);

// Provider component
export function AuthProvider({ children }) {
  // State
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isDemo] = useState(isDemoMode);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const [sessionData, userData] = await Promise.all([
          getCurrentSession(),
          getCurrentUser(),
        ]);

        if (isMounted) {
          setSession(sessionData);

          // If logged in, load organizations and get role
          if (userData) {
            // Try to get user's organization membership to get role
            try {
              const orgs = await getUserOrganizations(userData.id);
              if (orgs && orgs.length > 0) {
                const currentOrgId = userData.user_metadata?.current_organization_id;
                const currentOrg = orgs.find(o => o.organization?.id === currentOrgId) || orgs[0];
                if (currentOrg?.role) {
                  // Add role to user object
                  userData.role = currentOrg.role;
                  setUserRole(currentOrg.role);
                  console.log('[AuthContext] Initial role set:', currentOrg.role);
                }
              }
            } catch (orgErr) {
              console.error('[AuthContext] Failed to get initial role:', orgErr);
            }

            setUser(userData);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Init error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = onAuthChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);

      if (isMounted) {
        setSession(session);

        if (session?.user) {
          // Get role from organization membership
          let userWithRole = session.user;

          try {
            const orgs = await getUserOrganizations(session.user.id);
            if (orgs && orgs.length > 0) {
              const currentOrgId = session.user.user_metadata?.current_organization_id;
              const currentOrg = orgs.find(o => o.organization?.id === currentOrgId) || orgs[0];
              if (currentOrg?.role) {
                // Create new user object with role
                userWithRole = { ...session.user, role: currentOrg.role };
                setUserRole(currentOrg.role);
                console.log('[AuthContext] Auth state change - role set:', currentOrg.role);
              }
            }
          } catch (orgErr) {
            console.error('[AuthContext] Failed to get role on auth change:', orgErr);
          }

          setUser(userWithRole);
        } else {
          setUser(null);
          setOrganizations([]);
          setCurrentOrganization(null);
          setUserRole(null);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Load user's organizations
  const loadOrganizations = async (userId) => {
    try {
      console.log('[AuthContext] Loading organizations for user:', userId);

      let orgs = await getUserOrganizations(userId);

      console.log('[AuthContext] Raw organizations result:', orgs);

      // If no organizations exist (e.g., OAuth user), create a default one
      if (!orgs || orgs.length === 0) {
        console.log('[AuthContext] No organizations found, creating default...');

        // Get user email to create org name
        const currentUser = await getCurrentUser();
        const email = currentUser?.email || '';
        const name = email.split('@')[0] || 'My Organization';
        const orgName = `${name}'s Organization`;

        try {
          const { createOrganizationForUser } = await import('../utils/supabaseAuth');
          await createOrganizationForUser(currentUser, orgName);

          // Reload organizations after creation
          orgs = await getUserOrganizations(userId);
        } catch (orgErr) {
          console.error('[AuthContext] Failed to create organization:', orgErr);
        }
      }

      if (orgs && orgs.length > 0) {
        console.log('[AuthContext] Organizations loaded:', orgs);
        setOrganizations(orgs);

        // Set current organization from user metadata or first org
        const currentOrgId = user?.user_metadata?.current_organization_id;
        const currentOrg = orgs.find(o => o.organization?.id === currentOrgId) || orgs[0];

        console.log('[AuthContext] Selected org:', currentOrg);

        if (currentOrg) {
          setCurrentOrganization(currentOrg.organization);
          setUserRole(currentOrg.role);
          console.log('[AuthContext] Set userRole to:', currentOrg.role);

          // Also update user object with role
          if (currentOrg.role) {
            setUser(prev => {
              const updated = prev ? { ...prev, role: currentOrg.role } : null;
              console.log('[AuthContext] Updated user object:', updated);
              return updated;
            });
          }
        }
      } else {
        setOrganizations([]);
        setCurrentOrganization(null);
        setUserRole(null);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load organizations:', err);
    }
  };

  // Actions
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithEmail(email, password);

      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, name, organizationName) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signUpWithEmail(email, password, name, organizationName);

      if (result.success) {
        if (result.needsConfirmation) {
          // User needs to confirm email
          return { success: true, needsConfirmation: true };
        }
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithOAuth = useCallback(async (provider, organizationName) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithOAuth(provider, organizationName);

      if (result.success) {
        // OAuth will redirect, so we don't set loading false here
        return { success: true, url: result.url };
      } else {
        setError(result.error);
        setLoading(false);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'OAuth login failed';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await signOut();

      if (result.success) {
        setUser(null);
        setSession(null);
        setOrganizations([]);
        setCurrentOrganization(null);
        setUserRole(null);
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMsg = err.message || 'Logout failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sendPasswordReset(email);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMsg = err.message || 'Password reset failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (metadata) => {
    setError(null);

    try {
      const result = await updateProfile(metadata);

      if (result.success) {
        // Refresh user data
        const updatedUser = await getCurrentUser();
        setUser(updatedUser);
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMsg = err.message || 'Profile update failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const switchToOrganization = useCallback(async (organizationId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await switchOrganization(organizationId);

      if (result.success) {
        // Update current organization state
        const org = organizations.find(o => o.organization?.id === organizationId);
        if (org) {
          setCurrentOrganization(org.organization);
          setUserRole(org.role);
        }
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMsg = err.message || 'Organization switch failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [organizations]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed values
  const isAuthenticated = !!user && !!session;
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isMember = userRole && ['owner', 'admin', 'member'].includes(userRole);
  const isViewer = userRole === 'viewer';

  // Context value
  const value = {
    // State
    user,
    session,
    loading,
    error,
    organizations,
    currentOrganization,
    userRole,
    isDemo,

    // Computed
    isAuthenticated,
    isOwner,
    isAdmin,
    isMember,
    isViewer,

    // Actions
    login,
    register,
    loginWithOAuth,
    logout,
    resetPassword,
    updateUserProfile,
    switchToOrganization,
    clearError,
    loadOrganizations,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Export context for advanced use cases
export { AuthContext };
