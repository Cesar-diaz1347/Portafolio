import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export const MONEDAS_DISPONIBLES = [
  { code: 'MXN', label: 'MXN — Peso mexicano' },
  { code: 'USD', label: 'USD — Dólar estadounidense' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'ARS', label: 'ARS — Peso argentino' },
  { code: 'COP', label: 'COP — Peso colombiano' },
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'PEN', label: 'PEN — Sol peruano' },
  { code: 'BRL', label: 'BRL — Real brasileño' },
  { code: 'GTQ', label: 'GTQ — Quetzal guatemalteco' },
  { code: 'GBP', label: 'GBP — Libra esterlina' },
] as const

export type MonedaCode = (typeof MONEDAS_DISPONIBLES)[number]['code']

const STORAGE_KEY = 'controlPagos.moneda'
const DEFAULT_CURRENCY: MonedaCode = 'MXN'

function readStoredCurrency(): MonedaCode {
  const stored = localStorage.getItem(STORAGE_KEY)
  const valida = MONEDAS_DISPONIBLES.some((m) => m.code === stored)
  return valida ? (stored as MonedaCode) : DEFAULT_CURRENCY
}

interface CurrencyContextValue {
  currency: MonedaCode
  setCurrency: (currency: MonedaCode) => void
  format: (value: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<MonedaCode>(readStoredCurrency)

  function setCurrency(value: MonedaCode) {
    localStorage.setItem(STORAGE_KEY, value)
    setCurrencyState(value)
  }

  const formatter = useMemo(
    () => new Intl.NumberFormat('es-MX', { style: 'currency', currency }),
    [currency],
  )

  const value = useMemo(
    () => ({ currency, setCurrency, format: (v: number) => formatter.format(v) }),
    [currency, formatter],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency debe usarse dentro de CurrencyProvider')
  return ctx
}
