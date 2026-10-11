import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Demo del portafolio: base relativa para servirse desde /demos/control-cuentas/.
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5008',
    },
  },
})
