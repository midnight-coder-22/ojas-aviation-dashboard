import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],

  // Local development: http://localhost:5173/
  // Production/GitHub Pages: /ojas-aviation-dashboard/
  base: command === 'serve' ? '/' : '/ojas-aviation-dashboard/',
}))