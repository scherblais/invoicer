import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Demo build is served from the /invoicer/ project path on GitHub Pages.
  base: process.env.VITE_DEMO ? '/invoicer/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})
