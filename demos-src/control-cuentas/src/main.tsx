import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './demo.css'

import { CurrencyProvider } from './context/CurrencyContext'
import { router } from './router'
import { debeReintentar } from './utils/errores'

// Demo del portafolio: 400 y 404 se muestran al momento (sin los 3 reintentos por defecto)
// y un 503 se reintenta una sola vez.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: debeReintentar },
  },
})

// Clave propia: todo cesar-diaz1347.github.io comparte el mismo localStorage.
const colorSchemeManager = localStorageColorSchemeManager({ key: 'controlPagos.colorScheme' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light" colorSchemeManager={colorSchemeManager}>
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <RouterProvider router={router} />
        </CurrencyProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
