import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// Security headers for production
const securityHeaders = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=*, microphone=*, geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://cdn.jsdelivr.net blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.storage https://*.googleusercontent.com https://images.unsplash.com https://w0.peakpx.com",
    "media-src 'self' blob: data: https://assets.mixkit.co https://*.mixkit.co",
    "connect-src 'self' http: https: ws: wss: data: blob:",
    "frame-src 'self' blob: data: http://localhost:* http://127.0.0.1:* https://*.mandor.cloud https://mandor.cloud",
    "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.mandor.cloud https://mandor.cloud https://*.vercel.app",
  ].join('; '),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Mandor MES CORE',
        short_name: 'MandorMES',
        description: 'Advanced Manufacturing Execution System',
        theme_color: '#2563eb',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 20000000,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Aggressive caching for better performance
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 200, // Increased from 100
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Cache images from Supabase
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@supabase/supabase-js',
      'dexie',
      'i18next',
      'react-i18next',
      'zustand',
      'zod'
    ],
    // Pre-bundle these for faster dev server startup
    exclude: [
      // Heavy libraries that should be lazily loaded
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
    },
    // Security headers for development
    headers: {
      ...securityHeaders,
      // Relax CSP for dev
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' ws://localhost:* http://localhost:* https://cdn.jsdelivr.net blob:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.storage https://*.googleusercontent.com https://images.unsplash.com https://w0.peakpx.com",
        "media-src 'self' blob: data: https://assets.mixkit.co https://*.mixkit.co",
        "connect-src 'self' http: https: ws: wss: data: blob:",
        "frame-src 'self' blob: data: http://localhost:* http://127.0.0.1:* https://*.mandor.cloud https://mandor.cloud",
        "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.mandor.cloud https://mandor.cloud https://*.vercel.app",
      ].join('; '),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Security headers for production build
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-3d';
            }
            if (id.includes('blockly')) {
              return 'vendor-blockly';
            }
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('reactflow') || id.includes('@reactflow')) {
              return 'vendor-flow';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('jspdf') || id.includes('xlsx') || id.includes('html2canvas')) {
              return 'vendor-pdf-excel';
            }
            if (id.includes('html5-qrcode') || id.includes('react-qr-code') || id.includes('jsqr')) {
              return 'vendor-media';
            }
            if (id.includes('i18next') || id.includes('react-i18next') || id.includes('mqtt') || id.includes('dexie')) {
              return 'vendor-services';
            }
            if (id.includes('zod')) {
              return 'vendor-validation';
            }
          }
        }
      }
    }
  }
})
