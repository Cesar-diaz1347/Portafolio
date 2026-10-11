import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '../../styles/tokens.css'
import '../../styles/global.css'
import App from './App.tsx'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('No se encontró el elemento #root en la página de la demo.')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
