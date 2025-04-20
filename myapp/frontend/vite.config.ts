import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  }
})