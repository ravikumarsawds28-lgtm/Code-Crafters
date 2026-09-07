import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:5001',
      '/workouts': 'http://localhost:5001',
      '/goals': 'http://localhost:5001',
      '/health-stats': 'http://localhost:5001',
      '/reports': 'http://localhost:5001',
    },
  },
})
