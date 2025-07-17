import inject from '@medusajs/admin-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import inspect from 'vite-plugin-inspect';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const BASE = env.VITE_MEDUSA_BASE || '/';
  const BACKEND_URL =
    env.VITE_MEDUSA_BACKEND_URL || 'http://localhost:9000';
  const STOREFRONT_URL =
    env.VITE_MEDUSA_STOREFRONT_URL ||
    'http://localhost:8000';
  const PUBLISHABLE_API_KEY =
    env.VITE_PUBLISHABLE_API_KEY || '';
  const TALK_JS_APP_ID = env.VITE_TALK_JS_APP_ID || '';
  const DISABLE_SELLERS_REGISTRATION =
    env.VITE_DISABLE_SELLERS_REGISTRATION || 'false';

  /**
   * Add this to your .env file to specify the project to load admin extensions from.
   */
  const MEDUSA_PROJECT = env.VITE_MEDUSA_PROJECT || null;
  const sources = MEDUSA_PROJECT ? [MEDUSA_PROJECT] : [];

  return {
    plugins: [
      inspect(),
      // Using default React plugin settings
      react(),
      inject({
        sources,
      }),
    ],
    define: {
      __BASE__: JSON.stringify(BASE),
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
      __STOREFRONT_URL__: JSON.stringify(STOREFRONT_URL),
      __PUBLISHABLE_API_KEY__: JSON.stringify(
        PUBLISHABLE_API_KEY
      ),
      __TALK_JS_APP_ID__: JSON.stringify(TALK_JS_APP_ID),
      __DISABLE_SELLERS_REGISTRATION__: JSON.stringify(
        DISABLE_SELLERS_REGISTRATION
      ),
    },
    server: {
      open: true,
      proxy: {
        '/vendor': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: 'localhost',
          withCredentials: true
        }
      },
      hmr: {
        // Increase timeout for HMR connections
        timeout: 5000,
        // Improve error overlay
        overlay: true
      }
    },
    optimizeDeps: {
      entries: [],
      // Pre-bundle these dependencies to avoid optimization during development
      include: ['recharts', 'copy-to-clipboard', '@tanstack/react-query'],
    },
    resolve: {
      // Improve module resolution
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        external: [
          'talkjs',
          // 'recharts',
          'react-day-picker',
          'react-day-picker/src/style.css',
        ],
      },
    },
  };
});
