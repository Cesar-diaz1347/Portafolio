import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Demo del portafolio: base relativa para servirse desde /demos/pokedex/.
  base: './',
  plugins: [react()],
  server: {
    port: 5173
  }
})
