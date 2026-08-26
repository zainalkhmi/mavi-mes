/**
 * securityHeaders.js
 * =====================================================
 * Security headers configuration for Vite
 * =====================================================
 */

export const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Disable some browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    // Scripts: self + inline for Vite HMR + trusted CDNs
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://cdn.jsdelivr.net blob:",
    // Styles: self + inline + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    // Fonts: Google Fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: self + data URIs + Supabase storage + external URLs
    "img-src 'self' data: https://*.supabase.co https://*.supabase.storage https://*.googleusercontent.com blob:",
    // Connect: API endpoints
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com",
    // Frames: none
    "frame-ancestors 'none'",
    // Media: self + blob
    "media-src 'self' blob:",
    // Objects: none
    "object-src 'none'",
    // Base URI: self
    "base-uri 'self'",
    // Form action: self
    "form-action 'self'",
  ].join('; '),
};

// ─── Vite Config Headers (for vite.config.js) ─────────────────────────────────

/**
 * Get headers object for Vite dev server
 * @param {boolean} isProduction
 * @returns {Object}
 */
export function getSecurityHeaders(isProduction = false) {
  const headers = { ...securityHeaders };

  // Relax some restrictions in development
  if (!isProduction) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' ws://localhost:* http://localhost:*",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.storage",
      "connect-src 'self' ws://localhost:* http://localhost:* https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; ');
  }

  return headers;
}

// ─── CORS Configuration ───────────────────────────────────────────────────────

/**
 * Allowed origins for CORS
 * In production, this should match your domain
 */
export const corsOrigins = {
  development: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  staging: [
    'https://staging.mavi.mes',
    'https://*.vercel.app', // Vercel preview deployments
  ],
  production: [
    'https://mavi.mes',
    'https://www.mavi.mes',
  ],
};

/**
 * Get CORS config for Supabase Edge Functions
 */
export const corsConfig = {
  cors: {
    // Allow these origins
    origin: process.env.NODE_ENV === 'production'
      ? corsOrigins.production
      : [...corsOrigins.development, ...corsOrigins.staging],

    // Allow these methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Allow these headers
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Client-Info',
      'apikey',
      'X-API-Key',
    ],

    // Expose these headers to client
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],

    // Credentials support
    credentials: true,

    // Cache preflight
    maxAge: 86400, // 24 hours
  },
};

// ─── Rate Limiting Config ─────────────────────────────────────────────────────

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimits = {
  // Auth endpoints - stricter limits
  '/auth/*': {
    max: 10, // 10 requests
    window: 60 * 1000, // per minute
    message: 'Too many authentication attempts. Please try again later.',
  },

  // API endpoints
  '/api/*': {
    max: 100, // 100 requests
    window: 60 * 1000, // per minute
    message: 'Too many requests. Please slow down.',
  },

  // AI/Expensive operations
  '/api/ai/*': {
    max: 20, // 20 requests
    window: 60 * 1000, // per minute
    message: 'AI request limit reached. Please try again later.',
  },

  // File uploads
  '/api/upload/*': {
    max: 10, // 10 requests
    window: 60 * 1000, // per minute
    message: 'Upload limit reached. Please try again later.',
  },

  // Webhooks
  '/api/webhook/*': {
    max: 1000, // 1000 requests
    window: 60 * 1000, // per minute
    message: 'Webhook rate limit exceeded.',
  },
};

// ─── Security Utilities ────────────────────────────────────────────────────────

/**
 * Check if running in secure context (HTTPS)
 * @returns {boolean}
 */
export function isSecureContext() {
  return window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
}

/**
 * Get security report for debugging
 * @returns {Object}
 */
export function getSecurityReport() {
  return {
    isSecureContext: isSecureContext(),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    referrer: document.referrer,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    userAgent: navigator.userAgent,
  };
}
