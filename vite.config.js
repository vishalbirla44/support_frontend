import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
    define: {
    global: 'globalThis',   // ← fixes "global is not defined" for simple-peer
  },
  server: {
    port: 5173,
    strictPort: false
  }
})