import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { apiHandler } from './server/api.js'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'neon-api-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            return apiHandler(req, res, next);
          }
          next();
        });
      }
    }
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