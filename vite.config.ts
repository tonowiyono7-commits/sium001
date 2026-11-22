import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  const hmrEnabled = process.env.DISABLE_HMR !== 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'assets/aistudio/1000971623-removebg-preview_cbe2eda9.png',
          'assets/aistudio/Logo_Tri_Brata__1___1__7bf85ea6.png',
          'assets/aistudio/tb__1__e5e5aec3.png',
        ],
        manifest: {
          id: '/',
          name: 'SIUM',
          short_name: 'SIUM',
          description:
            'Aplikasi SIUM pembuat surat dinas dan pengelola jadwal piket harian yang berjalan 100% offline.',
          theme_color: '#17130f',
          background_color: '#17130f',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/\.well-known\//, /^\/__\//],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'pwa-no-hmr-dev-sw-fix',
        apply: 'serve',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            if (hmrEnabled) {
              return html;
            }
            return html.replace(
              /<script id="vite-plugin-pwa:register-dev-sw"[\s\S]*?<\/script>/,
              `<script id="vite-plugin-pwa:register-dev-sw" type="module">if('serviceWorker' in navigator){navigator.serviceWorker.register('/dev-sw.js?dev-sw',{scope:'/',type:'module'}).catch(()=>{});}</script>`
            );
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: hmrEnabled,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: hmrEnabled ? {} : null,
    },
  };
});
