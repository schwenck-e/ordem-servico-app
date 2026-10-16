import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/remix-run/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('/@tanstack/react-query') || id.includes('/@tanstack/query-core')) {
              return 'vendor-query';
            }
            if (id.includes('/lucide-react')) {
              return 'vendor-icons';
            }
            if (
              id.includes('/zod') ||
              id.includes('/react-hook-form') ||
              id.includes('/@hookform')
            ) {
              return 'vendor-forms';
            }
            if (id.includes('/clsx') || id.includes('/tailwind-merge')) {
              return 'vendor-ui-utils';
            }
          }
        },
      },
    },
  },
});
