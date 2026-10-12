import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

const apiTarget = process.env.PLAYCOCK_API_TARGET ?? 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': apiTarget,
    },
  },
})
