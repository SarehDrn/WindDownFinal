import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Where the dev server forwards /api requests. Defaults to a backend running
// on the host; Docker Compose sets VITE_API_PROXY=http://backend:8000.
const apiProxyTarget = process.env.VITE_API_PROXY || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiProxyTarget, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    restoreMocks: true,
  },
})
