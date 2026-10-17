import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import type { VitePluginPWAAPI } from 'vite-plugin-pwa';

// Keep the manifest (app name, icons) out of the offline cache so installing
// always reads the current name from the server, never a stale cached copy.
function manifestOnlineOnly(): Plugin {
  let api: VitePluginPWAAPI | undefined;
  return {
    name: 'koaabooks:manifest-online-only',
    apply: 'build',
    configResolved(config) {
      api = config.plugins.find(p => p.name === 'vite-plugin-pwa')?.api as VitePluginPWAAPI | undefined;
    },
    buildStart() {
      api?.extendManifestEntries(entries =>
        entries.filter(e => (typeof e === 'string' ? e : e.url) !== 'manifest.webmanifest'));
    },
  };
}

// BASE_PATH: URL prefix the app is served under ('/' on Cloudflare,
// '/<repo>/' on GitHub Pages).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['apple-touch-icon.png', 'favicon.png'],
      manifest: {
        name: 'Koaabooks',
        short_name: 'Koaabooks',
        description: 'Koaabooks: track expenses and income, with monthly and tax summaries.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#022c22',
        theme_color: '#065f46',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything is precached so the app opens offline.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
    manifestOnlineOnly(),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
});
