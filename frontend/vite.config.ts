import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Wallet/',
  plugins: [react()],
  server: {
    proxy: {
      '/auth':         'http://localhost:4000',
      '/accounts':     'http://localhost:4000',
      '/transactions': 'http://localhost:4000',
      '/kyc':          'http://localhost:4000',
      '/health':       'http://localhost:4000',
    },
  },
})
