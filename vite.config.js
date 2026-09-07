import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// By default in local development, the local dev server is completely disconnected from Neon DB.
// To explicitly test with Neon DB locally, start with VITE_ENABLE_LOCAL_DB=true.
const enableLocalDb = process.env.VITE_ENABLE_LOCAL_DB === 'true';

export default defineConfig({
  plugins: [
    react(),
    ...(enableLocalDb ? [{
      name: 'neon-api-middleware',
      async configureServer(server) {
        const { apiHandler } = await import('./server/api.js');
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            return apiHandler(req, res, next);
          }
          next();
        });
      }
    }] : [])
  ],
  server: { port: 5175, open: true, host: 'localhost' },
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})