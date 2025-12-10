import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,avif}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ui-avatars\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatars-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'D4D HUB',
        short_name: 'D4D',
        description: 'Next-Gen Social Media Platform',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        display: 'standalone',
        icon: 'public/logo_icon.png',
        start_url: '/',
        shortcuts: [
          {
            name: 'Home',
            url: '/',
            icons: [
              {
                src: '/src/assets/icons/home.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Explore',
            url: '/explore',
            icons: [
              {
                src: '/src/assets/icons/explore.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Reels',
            url: '/reels',
            icons: [
              {
                src: '/src/assets/icons/reels.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-icons', 'framer-motion'],
          'api-vendor': ['axios', 'socket.io-client'],
          'utils-vendor': ['date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000kb
    sourcemap: false, // Disable sourcemaps in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug'] // Remove specific console functions
      },
      mangle: true,
      keep_classnames: false,
      keep_fnames: false
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: []
  },
  server: {
    port: 5001,
    host: true,
    strictPort: true,
    allowedHosts: ['d4dhub.com', 'api.d4dhub.com', 'www.d4dhub.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        secure: false,
        // Add timeout and retry options
        timeout: 30000,
        proxyTimeout: 30000
      }
    }
  },
  preview: {
    port: 5001,
    host: true,
    strictPort: true
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "src/styles/variables.scss";`
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@context': '/src/context',
      '@assets': '/src/assets'
    }
  }
});