/**
 * sanitize.js
 * =====================================================
 * Security utilities for XSS prevention and input sanitization
 * =====================================================
 */

import { z } from 'zod';

// ─── XSS Prevention ─────────────────────────────────────────────────────────

/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities
 * @param {string} str
 * @returns {string}
 */
export function unescapeHtml(str) {
  if (!str) return '';
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  };
  return String(str).replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#3D);/g, match => entities[match] || match);
}

/**
 * Strip all HTML tags from string
 * @param {string} str
 * @returns {string}
 */
export function stripHtml(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '');
}

/**
 * Sanitize HTML but allow certain safe tags
 * @param {string} str
 * @param {string[]} allowedTags - e.g. ['p', 'br', 'strong', 'em']
 * @returns {string}
 */
export function sanitizeHtml(str, allowedTags = []) {
  if (!str) return '';

  // First escape all HTML
  let sanitized = escapeHtml(str);

  // Then decode allowed tags
  allowedTags.forEach(tag => {
    const upper = tag.toUpperCase();
    sanitized = sanitized
      .replace(new RegExp(`&lt;${upper}(?:\\s[^&]*)?&gt;`, 'gi'), `<${tag}>`)
      .replace(new RegExp(`&lt;/${upper}&gt;`, 'gi'), `</${tag}>`);
  });

  return sanitized;
}

/**
 * Sanitize CSS - remove dangerous properties
 * @param {string} css
 * @returns {string}
 */
export function sanitizeCss(css) {
  if (!css) return '';

  // Block dangerous CSS properties
  const dangerous = [
    /expression\s*\(/gi,
    /url\s*\(\s*javascript:/gi,
    /behavior\s*:/gi,
    /-moz-binding\s*:/gi,
    /@import/gi,
  ];

  let sanitized = css;
  dangerous.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized;
}

// ─── SQL Injection Prevention ────────────────────────────────────────────────

/**
 * Escape special characters for SQL-like contexts
 * Note: This is a defense-in-depth measure. Always use parameterized queries!
 * @param {string} str
 * @returns {string}
 */
export function escapeSql(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

/**
 * Validate string contains only safe characters
 * @param {string} str
 * @param {RegExp} pattern
 * @returns {boolean}
 */
export function matchesPattern(str, pattern = /^[a-zA-Z0-9_-]*$/) {
  if (!str) return true;
  return pattern.test(str);
}

// ─── URL Sanitization ────────────────────────────────────────────────────────

/**
 * Validate and sanitize URL
 * @param {string} url
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Remove javascript: and data: URLs
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validate URL is from allowed domain
 * @param {string} url
 * @param {string[]} allowedDomains
 * @returns {boolean}
 */
export function isAllowedDomain(url, allowedDomains = []) {
  if (!url || allowedDomains.length === 0) return true;

  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain => {
      if (domain.startsWith('.')) {
        return parsed.hostname.endsWith(domain);
      }
      return parsed.hostname === domain;
    });
  } catch {
    return false;
  }
}

// ─── Input Validation ────────────────────────────────────────────────────────

/**
 * Sanitize filename - remove dangerous characters
 * @param {string} filename
 * @returns {string}
 */
export function sanitizeFilename(filename) {
  if (!filename) return '';
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255);
}

/**
 * Sanitize variable/identifier name
 * @param {string} name
 * @returns {string}
 */
export function sanitizeIdentifier(name) {
  if (!name) return '';
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .substring(0, 100);
}

/**
 * Sanitize JSON string for safe eval/parse
 * @param {string} json
 * @returns {string}
 */
export function sanitizeJson(json) {
  if (!json) return '{}';

  // Remove potential code injection patterns
  return json
    .replace(/\$\{.*?\}/g, '') // Remove ${...} template literals
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, 'data-removed-'); // Remove event handlers
}

// ─── Content Security ─────────────────────────────────────────────────────────

/**
 * Check if content contains potential XSS patterns
 * @param {string} content
 * @returns {boolean}
 */
export function containsXssPatterns(content) {
  if (!content) return false;

  const patterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /on\w+\s*=\s*[^\s>]+/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /<link[\s\S]*?>/gi,
    /<meta[\s\S]*?>/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*javascript:/gi,
  ];

  return patterns.some(pattern => pattern.test(content));
}

/**
 * Sanitize rich text content (for WYSIWYG editors)
 * @param {string} content
 * @returns {string}
 */
export function sanitizeRichText(content) {
  if (!content) return '';

  let sanitized = content;

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove data: URLs (except for images)
  sanitized = sanitized.replace(/data\s*:\s*(?!image\/(png|jpeg|jpg|gif|webp))/gi, '');

  // Remove style attributes with expressions
  sanitized = sanitized.replace(/style\s*=\s*"[^"]*expression[^"]*"/gi, '');

  return sanitized;
}

// ─── Schema Validation ────────────────────────────────────────────────────────

/**
 * Schema for any user-provided string
 */
export const safeStringSchema = z.string()
  .max(10000, 'Input too long')
  .transform(val => escapeHtml(val));

/**
 * Schema for SQL identifiers (table names, column names)
 */
export const sqlIdentifierSchema = z.string()
  .regex(/^[a-z][a-z0-9_]*$/, 'Invalid identifier format')
  .max(64, 'Identifier too long');

/**
 * Schema for JSON input
 */
export const safeJsonSchema = z.string()
  .max(1000000, 'JSON too large')
  .transform(val => sanitizeJson(val));

// ─── Rate Limiting Helpers ────────────────────────────────────────────────────

/**
 * Simple in-memory rate limiter for client-side
 * Note: Real rate limiting should be done server-side
 */
export class ClientRateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  /**
   * Check if request is allowed
   * @param {string} key
   * @returns {boolean}
   */
  isAllowed(key = 'default') {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps
    const valid = timestamps.filter(ts => now - ts < this.windowMs);

    if (valid.length >= this.maxRequests) {
      this.requests.set(key, valid);
      return false;
    }

    valid.push(now);
    this.requests.set(key, valid);
    return true;
  }

  /**
   * Get remaining requests
   * @param {string} key
   * @returns {number}
   */
  remaining(key = 'default') {
    const timestamps = this.requests.get(key) || [];
    const now = Date.now();
    const valid = timestamps.filter(ts => now - ts < this.windowMs);
    return Math.max(0, this.maxRequests - valid.length);
  }

  /**
   * Reset rate limit for key
   * @param {string} key
   */
  reset(key = 'default') {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear() {
    this.requests.clear();
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default {
  escapeHtml,
  unescapeHtml,
  stripHtml,
  sanitizeHtml,
  sanitizeCss,
  escapeSql,
  matchesPattern,
  sanitizeUrl,
  isAllowedDomain,
  sanitizeFilename,
  sanitizeIdentifier,
  sanitizeJson,
  containsXssPatterns,
  sanitizeRichText,
  safeStringSchema,
  sqlIdentifierSchema,
  safeJsonSchema,
  ClientRateLimiter,
};
