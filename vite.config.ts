import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png'],
      manifest: {
        name: 'Market Academy',
        short_name: 'Market Academy',
        description: 'Learn the Indian stock market from beginner to advanced — free and offline.',
        theme_color: '#0a1222',
        background_color: '#0a1222',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        // Latest news when online; the last saved copy when offline.
        runtimeCaching: [{ urlPattern: /news\.json$/, handler: 'NetworkFirst', options: { cacheName: 'news', networkTimeoutSeconds: 6 } }],
      },
    }),
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
})
