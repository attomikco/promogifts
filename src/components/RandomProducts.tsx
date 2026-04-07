'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'

export default function RandomProducts({
  initial,
  title,
  subtitle,
}: {
  initial: Product[]
  title: string
  subtitle: string
}) {
  const [products, setProducts] = useState(initial)
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  async function loadNew() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .limit(100)

    if (data) {
      const withImages = (data as Product[]).filter(
        (p) =>
          p.images?.length > 0 &&
          typeof p.images[0] === 'string' &&
          p.images[0].startsWith('http') &&
          !p.images[0].includes('/wp/')
      )
      // Shuffle
      for (let i = withImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[withImages[i], withImages[j]] = [withImages[j], withImages[i]]
      }
      setProducts(withImages.slice(0, 8))
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--black)]">{title}</h2>
          <p className="mt-2 text-[var(--mid)]">{subtitle}</p>
        </div>
        <button
          onClick={loadNew}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-pale)] disabled:opacity-50"
        >
          <svg
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loading ? 'Cargando...' : 'Ver otros productos'}
        </button>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
