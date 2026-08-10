import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Puerto propio de Mansole: 5173/5174 los usan otros proyectos locales
    port: 5180,
    strictPort: false,
  }
})

