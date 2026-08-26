/**
 * supabaseAuth.js
 * =====================================================
 * Supabase Authentication Service for Mavi MES
 * Replaces localStorage-based auth with proper SaaS auth
 * =====================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (set in .env.local)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
let supabase = null;

export function getSupabaseAuth() {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Auth] Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      return null;
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'mavi_mes_auth_token',
      },
    });
  }
  return supabase;
}

// ─── Auth State ───────────────────────────────────────────────────────────────

/**
 * Get current session
 * @returns {Promise<Session|null>}
 */
export async function getCurrentSession() {
  const client = getSupabaseAuth();
  if (!client) return null;

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    return session;
  } catch (err) {
    console.error('[Auth] Failed to get session:', err);
    return null;
  }
}

/**
 * Get current user
 * @returns {Promise<User|null>}
 */
export async function getCurrentUser() {
  const client = getSupabaseAuth();
  if (!client) return null;

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    return user;
  } catch (err) {
    // AuthSessionMissingError is expected when no user is logged in — not an error
    if (err?.name !== 'AuthSessionMissingError') {
      console.error('[Auth] Failed to get user:', err);
    }
    return null;
  }
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with (event, session)
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  const client = getSupabaseAuth();
  if (!client) return () => {};

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => subscription.unsubscribe();
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: User, error?: string}>}
 */
export async function signInWithEmail(email, password) {
  const client = getSupabaseAuth();
  if (!client) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error('[Auth] Sign in error:', error.message);
      return { success: false, error: error.message };
    }

    // After successful sign in, ensure user has organization
    await ensureUserOrganization(data.user);

    return { success: true, user: data.user };
  } catch (err) {
    console.error('[Auth] Unexpected sign in error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

/**
 * Sign up with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} name - Display name
 * @param {string} organizationName - Company/organization name
 * @returns {Promise<{success: boolean, user?: User, error?: string}>}
 */
export async function signUpWithEmail(email, password, name, organizationName) {
  const client = getSupabaseAuth();
  if (!client) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }
    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' };
    }
    if (!organizationName || organizationName.trim().length < 2) {
      return { success: false, error: 'Organization name must be at least 2 characters' };
    }

    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          organization_name: organizationName.trim(),
        },
      },
    });

    if (error) {
      console.error('[Auth] Sign up error:', error.message);
      return { success: false, error: error.message };
    }

    // If email confirmation is disabled, create organization immediately
    if (data.user && !data.session) {
      // User needs to confirm email - organization will be created after confirmation
      return {
        success: true,
        user: data.user,
        needsConfirmation: true,
        message: 'Please check your email to confirm your account'
      };
    }

    // User created and logged in - create their organization
    if (data.user) {
      await createOrganizationForUser(data.user, organizationName.trim());
    }

    return { success: true, user: data.user };
  } catch (err) {
    console.error('[Auth] Unexpected sign up error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ─── OAuth Sign In ─────────────────────────────────────────────────────────────

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 * @param {'google'|'github'|'azure'|'keycloak'} provider
 * @param {string} organizationName - Required for first-time OAuth users
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signInWithOAuth(provider, organizationName = '') {
  const client = getSupabaseAuth();
  if (!client) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: organizationName ? { organization_name: organizationName } : undefined,
      },
    });

    if (error) {
      console.error('[Auth] OAuth error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  } catch (err) {
    console.error('[Auth] Unexpected OAuth error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Sign out current user
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signOut() {
  const client = getSupabaseAuth();
  if (!client) return { success: false, error: 'Not configured' };

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      console.error('[Auth] Sign out error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[Auth] Unexpected sign out error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ─── Password Reset ─────────────────────────────────────────────────────────────

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendPasswordReset(email) {
  const client = getSupabaseAuth();
  if (!client) return { success: false, error: 'Not configured' };

  try {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update password for logged-in user
 * @param {string} newPassword
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePassword(newPassword) {
  const client = getSupabaseAuth();
  if (!client) return { success: false, error: 'Not configured' };

  try {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    const { error } = await client.auth.updateUser({ password: newPassword });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ─── Update Profile ─────────────────────────────────────────────────────────────

/**
 * Update user profile (metadata)
 * @param {Object} metadata - { name, avatar_url, etc. }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateProfile(metadata) {
  const client = getSupabaseAuth();
  if (!client) return { success: false, error: 'Not configured' };

  try {
    const { error } = await client.auth.updateUser({
      data: metadata,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ─── Organization Helpers ──────────────────────────────────────────────────────

/**
 * Create organization for a new user
 * @param {User} user
 * @param {string} organizationName
 * @returns {Promise<Organization|null>}
 */
export async function createOrganizationForUser(user, organizationName) {
  const client = getSupabaseAuth();
  if (!client) return null;

  try {
    // Generate slug from organization name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create organization
    const { data: org, error: orgError } = await client
      .from('organizations')
      .insert({
        name: organizationName,
        slug: `${slug}-${Date.now().toString(36)}`, // Unique slug
        plan: 'free', // Free tier
        owner_id: user.id,
      })
      .select()
      .single();

    if (orgError) {
      console.error('[Auth] Failed to create organization:', orgError);
      return null;
    }

    // Add user as owner of organization
    const { error: memberError } = await client
      .from('organization_members')
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('[Auth] Failed to add user as org member:', memberError);
    }

    // Update user metadata with current organization
    await client.auth.updateUser({
      data: { current_organization_id: org.id },
    });

    return org;
  } catch (err) {
    console.error('[Auth] Unexpected error creating organization:', err);
    return null;
  }
}

/**
 * Ensure user has an organization (for OAuth users or users created via other means)
 * @param {User} user
 * @returns {Promise<void>}
 */
async function ensureUserOrganization(user) {
  const client = getSupabaseAuth();
  if (!client) return;

  try {
    // Check if user already has membership
    const { data: memberships } = await client
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1);

    if (memberships && memberships.length > 0) {
      // User already has organization, update metadata
      await client.auth.updateUser({
        data: { current_organization_id: memberships[0].organization_id },
      });
      return;
    }

    // User doesn't have organization - create default one
    // Use user's email or name as organization name
    const orgName = user.user_metadata?.organization_name ||
                    user.user_metadata?.name ||
                    `${user.email.split('@')[0]}'s Organization`;

    await createOrganizationForUser(user, orgName);
  } catch (err) {
    console.error('[Auth] Error ensuring user organization:', err);
  }
}

/**
 * Get user's organizations
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getUserOrganizations(userId) {
  const client = getSupabaseAuth();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('organization_members')
      .select(`
        role,
        joined_at,
        organization:organizations (
          id,
          name,
          slug,
          plan,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Auth] Failed to get user organizations:', err);
    return [];
  }
}

/**
 * Switch current organization
 * @param {string} organizationId
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function switchOrganization(organizationId) {
  const client = getSupabaseAuth();
  if (!client) return { success: false, error: 'Not configured' };

  try {
    // Verify user is member of this organization
    const session = await getCurrentSession();
    if (!session) return { success: false, error: 'Not authenticated' };

    const { data, error } = await client
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Not a member of this organization' };
    }

    // Update user's current organization
    const { error: updateError } = await client.auth.updateUser({
      data: { current_organization_id: organizationId },
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ─── Role Helpers ───────────────────────────────────────────────────────────────

/**
 * Get user's role in current organization
 * @param {string} organizationId
 * @returns {Promise<string|null>}
 */
export async function getUserRole(organizationId) {
  const client = getSupabaseAuth();
  if (!client) return null;

  try {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data, error } = await client
      .from('organization_members')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', organizationId)
      .single();

    if (error) return null;
    return data?.role || null;
  } catch (err) {
    return null;
  }
}

/**
 * Check if user has permission in organization
 * @param {string} organizationId
 * @param {string} permission - e.g., 'admin', 'member', 'viewer'
 * @returns {Promise<boolean>}
 */
export async function hasPermission(organizationId, permission) {
  const roleHierarchy = {
    owner: ['owner', 'admin', 'member', 'viewer'],
    admin: ['admin', 'member', 'viewer'],
    member: ['member', 'viewer'],
    viewer: ['viewer'],
  };

  const userRole = await getUserRole(organizationId);
  if (!userRole) return false;

  const allowedRoles = roleHierarchy[userRole] || [];
  return allowedRoles.includes(permission);
}

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── Demo Mode (for development without Supabase) ──────────────────────────────

/**
 * Check if running in demo mode (no Supabase configured)
 * @returns {boolean}
 */
export function isDemoMode() {
  return !SUPABASE_URL || !SUPABASE_ANON_KEY;
}

/**
 * Check if Supabase is configured and ready
 * @returns {boolean}
 */
export function isSupabaseReady() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ─── Exports ───────────────────────────────────────────────────────────────────

export default {
  getSupabaseAuth,
  getCurrentSession,
  getCurrentUser,
  onAuthChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  signOut,
  sendPasswordReset,
  updatePassword,
  updateProfile,
  getUserOrganizations,
  switchOrganization,
  getUserRole,
  hasPermission,
  isValidEmail,
  validatePassword,
  isDemoMode,
};
