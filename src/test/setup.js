/**
 * test/setup.js
 * =====================================================
 * Global test setup and mocks for Vitest
 * =====================================================
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Cleanup after each test ────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

// ─── Mock localStorage ──────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => {
      const keys = Object.keys(store);
      return keys[i] || null;
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// ─── Mock sessionStorage ────────────────────────────────────────────────────

const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// ─── Mock window.matchMedia ─────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── Mock ResizeObserver ────────────────────────────────────────────────────

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// ─── Mock IntersectionObserver ───────────────────────────────────────────────

class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserverMock;

// ─── Mock crypto.subtle (for HMAC) ──────────────────────────────────────────

const cryptoMock = {
  subtle: {
    importKey: vi.fn(),
    sign: vi.fn(),
    digest: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
  randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7)),
  getRandomValues: vi.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
};

Object.defineProperty(global, 'crypto', {
  value: cryptoMock,
});

// ─── Mock fetch ─────────────────────────────────────────────────────────────

global.fetch = vi.fn();

// ─── Mock Supabase client ───────────────────────────────────────────────────

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(() => ({
            then: vi.fn(),
          })),
          then: vi.fn(),
        })),
        then: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}));

// ─── Mock React Router ──────────────────────────────────────────────────────

vi.mock('react-router-dom', () => ({
  ...vi.requireActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', state: {} }),
  useParams: () => ({}),
}));

// ─── Mock toast ─────────────────────────────────────────────────────────────

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn(),
  },
  success: vi.fn(),
  error: vi.fn(),
  promise: vi.fn(),
}));

// ─── Mock Sentry ────────────────────────────────────────────────────────────

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  startTransaction: vi.fn(),
  getCurrentHub: vi.fn(),
  ErrorBoundary: ({ children }) => children,
}));

// ─── Mock window.Tauri ─────────────────────────────────────────────────────

Object.defineProperty(window, '__TAURI_INTERNALS__', {
  value: undefined,
  writable: true,
});

// ─── Custom matchers ────────────────────────────────────────────────────────

expect.extend({
  toBeWithinRange(received, min, max) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${min} - ${max}`,
    };
  },
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be a valid UUID`,
    };
  },
  toContainOnce(received, item) {
    const occurrences = received.filter(x => x === item).length;
    const pass = occurrences === 1;
    return {
      pass,
      message: () =>
        `expected ${received} to contain "${item}" exactly once, but found ${occurrences} times`,
    };
  },
});

// ─── Global test utilities ──────────────────────────────────────────────────

global.createMockUser = (overrides = {}) => ({
  id: 'test-user-id-' + Math.random().toString(36).substring(7),
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    ...overrides.metadata,
  },
  ...overrides,
});

global.createMockSession = (overrides = {}) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: global.createMockUser(),
  ...overrides,
});

global.createMockOrganization = (overrides = {}) => ({
  id: 'test-org-id-' + Math.random().toString(36).substring(7),
  name: 'Test Organization',
  slug: 'test-org-' + Math.random().toString(36).substring(7),
  plan: 'free',
  owner_id: 'test-user-id',
  settings: {},
  created_at: new Date().toISOString(),
  ...overrides,
});

// ─── Console error handling ─────────────────────────────────────────────────

// Suppress specific console errors in tests (optional)
// Uncomment to fail tests on console.error
// const originalError = console.error;
// console.error = (...args) => {
//   if (
//     typeof args[0] === 'string' &&
//     (args[0].includes('Warning:') || args[0].includes('Error:'))
//   ) {
//     throw new Error(args.join(' '));
//   }
//   originalError.call(console, ...args);
// };

// ─── Reset mocks between test files ────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});
