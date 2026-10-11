import { useEffect, useRef } from 'react'
import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  NavLink,
  Select,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
  type SelectProps,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom'

import { DemoBanner } from './components/DemoBanner'
import { MONEDAS_DISPONIBLES, useCurrency, type MonedaCode } from './context/CurrencyContext'

function SelectorMoneda(props: Omit<SelectProps, 'data' | 'value' | 'onChange'>) {
  const { currency, setCurrency } = useCurrency()
  return (
    <Select
      value={currency}
      onChange={(value) => value && setCurrency(value as MonedaCode)}
      data={MONEDAS_DISPONIBLES.map((m) => ({ value: m.code, label: m.label }))}
      aria-label="Moneda"
      allowDeselect={false}
      {...props}
    />
  )
}

function App() {
  const location = useLocation()
  // Demo del portafolio: en pantallas < sm el menú lateral se pliega tras el Burger.
  const [menuAbierto, { toggle: alternarMenu, close: cerrarMenu }] = useDisclosure(false)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const { setColorScheme } = useMantineColorScheme()
  const esquema = useComputedColorScheme('light')

  // Escape cierra el menú móvil y devuelve el foco al Burger.
  useEffect(() => {
    if (!menuAbierto) return undefined
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      cerrarMenu()
      burgerRef.current?.focus()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [menuAbierto, cerrarMenu])

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !menuAbierto } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              ref={burgerRef}
              opened={menuAbierto}
              onClick={alternarMenu}
              hiddenFrom="sm"
              size="sm"
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              aria-controls="menu-lateral"
            />
            <Title order={3}>Control de Pagos</Title>
          </Group>
          <Group wrap="nowrap">
            <SelectorMoneda visibleFrom="sm" w={220} />
            <ActionIcon
              variant="default"
              size="lg"
              onClick={() => setColorScheme(esquema === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar modo oscuro/claro"
            >
              {esquema === 'dark' ? '☀️' : '🌙'}
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" id="menu-lateral" aria-label="Navegación">
        <NavLink
          component={RouterNavLink}
          to="/"
          label="Dashboard"
          active={location.pathname === '/'}
          onClick={cerrarMenu}
        />
        <NavLink
          component={RouterNavLink}
          to="/deudas"
          label="Deudas"
          active={location.pathname.startsWith('/deudas')}
          onClick={cerrarMenu}
        />
        {/* En móvil la moneda se elige desde el menú: la cabecera no tiene sitio. */}
        <Box hiddenFrom="sm" mt="md">
          <SelectorMoneda label="Moneda" />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <DemoBanner />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default App
