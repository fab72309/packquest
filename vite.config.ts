import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.VITE_BASE_PATH?.trim() || '/'
const appBase = base.startsWith('/') ? base : `/${base}`
const normalizedBase = appBase.endsWith('/') ? appBase : `${appBase}/`

// https://vite.dev/config/
export default defineConfig({
  base: normalizedBase,
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'PackQuest',
      short_name: 'PackQuest',
      lang: 'fr',
      description: 'Préparer son sac en famille, à son rythme.',
      start_url: normalizedBase,
      scope: normalizedBase,
      display: 'standalone',
      background_color: '#f8f4e9',
      theme_color: '#153e34',
      icons: [
        { src: `${normalizedBase}icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${normalizedBase}icon-512.png`, sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: `${normalizedBase}index.html`,
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
    },
  })],
})
