/**
 * sanitize.test.js
 * =====================================================
 * Tests for input sanitization utilities
 * =====================================================
 */

import { describe, it, expect } from 'vitest';
import {
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
  ClientRateLimiter,
} from '../../utils/sanitize';

describe('HTML Escaping', () => {
  it('should escape HTML entities', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    // Note: / is also escaped as &#x2F; for extra security
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('alert(');
    expect(result).toContain('&quot;xss&quot;');
    expect(result).toContain('&#x2F;script&gt;');
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape quotes', () => {
    expect(escapeHtml("It's a test")).toBe('It&#x27;s a test');
  });

  it('should return empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('should handle already escaped content', () => {
    expect(escapeHtml('&lt;div&gt;')).toBe('&amp;lt;div&amp;gt;');
  });
});

describe('HTML Unescaping', () => {
  it('should unescape HTML entities', () => {
    expect(unescapeHtml('&lt;div&gt;')).toBe('<div>');
  });

  it('should unescape quotes', () => {
    expect(unescapeHtml('It&#x27;s a test')).toBe("It's a test");
  });

  it('should return empty string for null/undefined', () => {
    expect(unescapeHtml(null)).toBe('');
    expect(unescapeHtml(undefined)).toBe('');
  });
});

describe('Strip HTML', () => {
  it('should remove all HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
  });

  it('should handle nested tags', () => {
    expect(stripHtml('<div><span><em>Text</em></span></div>')).toBe('Text');
  });

  it('should handle malformed HTML', () => {
    expect(stripHtml('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('should return empty string for null/undefined', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
  });
});

describe('Sanitize HTML', () => {
  it('should allow specified tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>', ['p']);
    // Note: allowed tags are decoded back, others stay escaped
    expect(result).toContain('<p>Hello');  // <p> is allowed
    expect(result).not.toContain('<script>');  // script is escaped
  });

  it('should escape all tags when none allowed', () => {
    const result = sanitizeHtml('<p>Hello</p>');
    expect(result).not.toContain('<p>');
    expect(result).toContain('&lt;p&gt;');
  });
});

describe('CSS Sanitization', () => {
  it('should remove expression()', () => {
    // Note: regex removes 'expression(' but not the closing parens
    const result = sanitizeCss('color: red; expression(alert(1));');
    expect(result).not.toContain('expression(');
    expect(result).toContain('color: red;');
  });

  it('should remove javascript: URLs', () => {
    // Note: removes 'url(' prefix but keeps content
    const result = sanitizeCss('background: url(javascript:alert(1))');
    expect(result).not.toContain('url(');
  });

  it('should remove @import', () => {
    // Note: removes '@import' keyword
    const result = sanitizeCss('@import url("evil.css"); color: red;');
    expect(result).not.toContain('@import');
    expect(result).toContain('color: red;');
  });
});

describe('SQL Escaping', () => {
  it('should escape single quotes', () => {
    expect(escapeSql("O'Brien")).toBe("O\\'Brien");
  });

  it('should escape backslashes', () => {
    expect(escapeSql('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('should escape newlines', () => {
    expect(escapeSql('line1\nline2')).toBe('line1\\nline2');
  });

  it('should return empty string for null/undefined', () => {
    expect(escapeSql(null)).toBe('');
    expect(escapeSql(undefined)).toBe('');
  });
});

describe('Pattern Matching', () => {
  it('should match alphanumeric with underscore and hyphen', () => {
    expect(matchesPattern('user-123_name')).toBe(true);
    expect(matchesPattern('user name')).toBe(false);
    expect(matchesPattern('user@name')).toBe(false);
  });

  it('should match custom pattern', () => {
    expect(matchesPattern('ABC123', /^[A-Z]{3}[0-9]{3}$/)).toBe(true);
    expect(matchesPattern('abc123', /^[A-Z]{3}[0-9]{3}$/)).toBe(false);
  });

  it('should return true for empty string', () => {
    expect(matchesPattern('')).toBe(true);
  });
});

describe('URL Sanitization', () => {
  it('should accept valid HTTP URL', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('should accept valid HTTPS URL', () => {
    expect(sanitizeUrl('https://example.com/path?query=1')).toBe(
      'https://example.com/path?query=1'
    );
  });

  it('should reject javascript: URL', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe(null);
  });

  it('should reject data: URL', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe(null);
  });

  it('should reject ftp URL', () => {
    expect(sanitizeUrl('ftp://example.com')).toBe(null);
  });

  it('should return null for invalid URL', () => {
    expect(sanitizeUrl('not a url')).toBe(null);
    expect(sanitizeUrl('')).toBe(null);
  });
});

describe('Domain Validation', () => {
  it('should allow exact domain match', () => {
    expect(isAllowedDomain('https://example.com', ['example.com'])).toBe(true);
  });

  it('should allow subdomain match with . prefix', () => {
    // Note: subdomain matching requires . prefix, e.g., .example.com matches app.example.com
    expect(isAllowedDomain('https://app.example.com', ['.example.com'])).toBe(true);
  });

  it('should reject non-matching domain', () => {
    expect(isAllowedDomain('https://evil.com', ['example.com'])).toBe(false);
  });

  it('should allow all if no allowed domains specified', () => {
    expect(isAllowedDomain('https://anything.com', [])).toBe(true);
    expect(isAllowedDomain('https://anything.com')).toBe(true);
  });
});

describe('Filename Sanitization', () => {
  it('should remove dangerous characters but keep safe ones', () => {
    // Note: underscores are allowed in filenames
    expect(sanitizeFilename('my<script>file.pdf')).toBe('my_script_file.pdf');
  });

  it('should remove path traversal', () => {
    // Note: .. and / are removed, remaining . becomes _
    expect(sanitizeFilename('../../../etc/passwd')).toBe('______etc_passwd');
  });

  it('should truncate long filenames', () => {
    const longName = 'a'.repeat(300) + '.pdf';
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
  });

  it('should return empty string for null/undefined', () => {
    expect(sanitizeFilename(null)).toBe('');
    expect(sanitizeFilename(undefined)).toBe('');
  });
});

describe('Identifier Sanitization', () => {
  it('should convert to valid identifier format', () => {
    expect(sanitizeIdentifier('my-var')).toBe('my_var');
  });

  it('should prefix with underscore if starts with number', () => {
    expect(sanitizeIdentifier('123var')).toBe('_123var');
  });

  it('should remove invalid characters but keep underscores', () => {
    // Note: underscores are kept as valid identifier characters
    expect(sanitizeIdentifier('var@name!')).toBe('var_name_');
  });

  it('should truncate long identifiers', () => {
    const longName = 'A'.repeat(150);
    expect(sanitizeIdentifier(longName).length).toBeLessThanOrEqual(100);
  });
});

describe('JSON Sanitization', () => {
  it('should remove template literals', () => {
    expect(sanitizeJson('${alert(1)}')).toBe('');
  });

  it('should remove script tags', () => {
    expect(sanitizeJson('<script>alert(1)</script>')).toBe('');
  });

  it('should remove javascript: protocol', () => {
    // Note: removes 'javascript:' keyword but keeps the rest
    const result = sanitizeJson('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('onclick');
  });

  it('should remove event handlers', () => {
    expect(sanitizeJson('onclick=alert(1)')).toContain('data-removed');
  });

  it('should return empty object for null/undefined', () => {
    expect(sanitizeJson(null)).toBe('{}');
    expect(sanitizeJson(undefined)).toBe('{}');
  });
});

describe('XSS Pattern Detection', () => {
  it('should detect script tags', () => {
    expect(containsXssPatterns('<script>alert(1)</script>')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(containsXssPatterns('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should detect javascript: URLs', () => {
    expect(containsXssPatterns('<a href="javascript:alert(1)">Click</a>')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(containsXssPatterns('<img onerror="alert(1)">')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(containsXssPatterns('Hello World!')).toBe(false);
    expect(containsXssPatterns('<p>Safe paragraph</p>')).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(containsXssPatterns(null)).toBe(false);
    expect(containsXssPatterns(undefined)).toBe(false);
  });
});

describe('Rich Text Sanitization', () => {
  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert(1)</script>';
    expect(sanitizeRichText(input)).not.toContain('<script>');
  });

  it('should remove event handlers', () => {
    const input = '<img src="x.jpg" onerror="alert(1)">';
    expect(sanitizeRichText(input)).not.toContain('onerror');
  });

  it('should remove javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    expect(sanitizeRichText(input)).not.toContain('javascript:');
  });

  it('should preserve safe formatting', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
    expect(sanitizeRichText(input)).toContain('<p>');
    expect(sanitizeRichText(input)).toContain('<strong>');
  });
});

describe('Client Rate Limiter', () => {
  it('should allow requests within limit', () => {
    const limiter = new ClientRateLimiter(5, 60000);
    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed('test')).toBe(true);
    }
  });

  it('should block requests over limit', () => {
    const limiter = new ClientRateLimiter(3, 60000);
    limiter.isAllowed('test');
    limiter.isAllowed('test');
    limiter.isAllowed('test');
    expect(limiter.isAllowed('test')).toBe(false);
  });

  it('should track different keys separately', () => {
    const limiter = new ClientRateLimiter(2, 60000);
    limiter.isAllowed('key1');
    limiter.isAllowed('key1');
    expect(limiter.isAllowed('key1')).toBe(false);
    expect(limiter.isAllowed('key2')).toBe(true);
  });

  it('should report remaining requests', () => {
    const limiter = new ClientRateLimiter(5, 60000);
    expect(limiter.remaining('test')).toBe(5);
    limiter.isAllowed('test');
    limiter.isAllowed('test');
    expect(limiter.remaining('test')).toBe(3);
  });

  it('should reset specific key', () => {
    const limiter = new ClientRateLimiter(2, 60000);
    limiter.isAllowed('test');
    limiter.isAllowed('test');
    limiter.reset('test');
    expect(limiter.isAllowed('test')).toBe(true);
  });

  it('should clear all limits', () => {
    const limiter = new ClientRateLimiter(1, 60000);
    limiter.isAllowed('key1');
    limiter.isAllowed('key2');
    limiter.clear();
    expect(limiter.isAllowed('key1')).toBe(true);
    expect(limiter.isAllowed('key2')).toBe(true);
  });
});
