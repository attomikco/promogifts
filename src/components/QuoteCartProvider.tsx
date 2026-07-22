'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'pg_quote_cart'

export type QuoteCartItem = {
  sku: string
  name: string
  slug: string
  image?: string
  price: number
  minQty: number
  quantity: number
}

type QuoteCartContextValue = {
  items: QuoteCartItem[]
  addItem: (item: Omit<QuoteCartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (sku: string) => void
  updateQuantity: (sku: string, quantity: number) => void
  clear: () => void
  count: number
  hasItem: (sku: string) => boolean
  ready: boolean
}

const QuoteCartContext = createContext<QuoteCartContextValue | null>(null)

function isValidItem(x: unknown): x is QuoteCartItem {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.sku === 'string' && typeof o.name === 'string' && typeof o.slug === 'string'
}

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>([])
  const [ready, setReady] = useState(false)

  // Hydrate from localStorage — client only.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed.filter(isValidItem))
      }
    } catch {
      // ignore malformed storage
    }
    setReady(true)
  }, [])

  // Persist whenever items change (after hydration).
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore quota / private-mode errors
    }
  }, [items, ready])

  const addItem = useCallback<QuoteCartContextValue['addItem']>((item) => {
    setItems((prev) => {
      const qty = Math.max(1, item.quantity ?? item.minQty ?? 1)
      const existing = prev.find((i) => i.sku === item.sku)
      if (existing) {
        // Already in cart — keep existing quantity (idempotent add).
        return prev
      }
      const { quantity: _omit, ...rest } = item
      return [...prev, { ...rest, quantity: qty }]
    })
  }, [])

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku))
  }, [])

  const updateQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.sku === sku ? { ...i, quantity: Math.max(i.minQty || 1, Math.floor(quantity) || i.minQty || 1) } : i
      )
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<QuoteCartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      count: items.length,
      hasItem: (sku: string) => items.some((i) => i.sku === sku),
      ready,
    }),
    [items, addItem, removeItem, updateQuantity, clear, ready]
  )

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>
}

export function useQuoteCart(): QuoteCartContextValue {
  const ctx = useContext(QuoteCartContext)
  if (!ctx) throw new Error('useQuoteCart must be used within a QuoteCartProvider')
  return ctx
}
