/**
 * vitest.config.js
 * =====================================================
 * Vitest configuration for Mavi MES
 * =====================================================
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],

  test: {
    // Test environment
    environment: 'jsdom',

    // Global test utilities
    globals: true,

    // Setup files
    setupFiles: ['./src/test/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/*.config.mjs',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/coverage/**',
        '**/mock/**',
        '**/*.test.js',
        '**/*.spec.js',
        '**/types/**',
        '**/vite.config.js',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },

    // Test patterns
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'src/**/*.spec.{js,jsx,ts,tsx}',
      'tests/**/*.test.{js,jsx,ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.d.ts',
    ],

    // Test timeout (30 seconds)
    testTimeout: 30000,

    // Hook timeout (10 seconds)
    hookTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,

    // Uncomment for watch mode during development
    // watch: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/user-event',
    ],
  },
});
