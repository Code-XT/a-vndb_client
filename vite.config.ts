import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icons/favicon-16x16.png',
          'icons/favicon-32x32.png',
          'icons/apple-touch-icon.png',
          'icons/maskable-icon-192.png',
          'icons/maskable-icon-512.png',
        ],
        manifest: {
          name: '𝚅𝙽/И𝙴𝚇𝚄𝚂',
          short_name: 'VN/N',
          description: 'A fast, responsive client for the Visual Novel Database (vndb.org).',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          theme_color: '#0f1117',
          background_color: '#0f1117',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
          categories: ['entertainment', 'games'],
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api/kana': {
          target: 'https://api.vndb.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/kana/, '/kana'),
          secure: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});