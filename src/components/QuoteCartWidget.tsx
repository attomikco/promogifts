'use client'

import Link from 'next/link'
import { useQuoteCart } from '@/components/QuoteCartProvider'

export default function QuoteCartWidget() {
  const { count, ready } = useQuoteCart()

  if (!ready || count === 0) return null

  return (
    <Link
      href="/cotizacion"
      // Sits above the WhatsApp FAB (bottom-6) where present.
      className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[var(--brand-dark)] hover:scale-105"
      aria-label={`Ver mi cotización (${count})`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3h2l.4 2m0 0L7 13h10l2-8H5.4zM7 13l-1.2 5h12" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1" fill="currentColor" />
        <circle cx="17" cy="20" r="1" fill="currentColor" />
      </svg>
      Mi cotización
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[var(--brand)]">
        {count}
      </span>
    </Link>
  )
}
