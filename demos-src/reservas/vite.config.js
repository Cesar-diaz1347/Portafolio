import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ⚠️ IMPORTANTE PARA GITHUB PAGES ⚠️
// GitHub Pages sirve los repos de proyecto en:
//   https://<tu-usuario>.github.io/<nombre-del-repo>/
// Por eso "base" tiene que coincidir EXACTO con el nombre de tu
// repositorio. Si tu repo se llama distinto a "reserva-almuerzo-app",
// cambia la línea de abajo. Por ejemplo, si tu repo es "cafeteria-app":
//   base: '/cafeteria-app/',
//
// Si en cambio usas un repo de usuario/organización (se llama
// "<tu-usuario>.github.io") o un dominio propio, deja base: '/'.
export default defineConfig({
  plugins: [react()],
  // Demo del portafolio: base relativa para servirse desde /demos/reservas/.
  base: './',
});
