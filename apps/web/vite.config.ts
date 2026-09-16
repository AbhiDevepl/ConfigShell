import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Vite's default port. The API server owns 3000; running both used to
      // collide, which is why this is no longer 3000.
      port: 5173,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        // Setup-plan generation goes to the API server (`pnpm --filter server dev`).
        // Proxying rather than calling an absolute URL keeps the browser on one
        // origin, so there is no CORS configuration and no credentials story.
        // `pnpm dev` from the repository root starts both processes.
        '/api': {
          target: process.env.CONFIGSHELL_API_URL ?? 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
