import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: false
      },

      includeAssets: ['favicon.ico', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'TORMAG Admin — Панель управления',
        short_name: 'TORMAG Admin',
        description: 'Панель управления маркетплейсом TORMAG.KZ',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        id: '/',
        icons: [
          {
            src: '/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: '/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/_ipx': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
      }
    }
  }
});
