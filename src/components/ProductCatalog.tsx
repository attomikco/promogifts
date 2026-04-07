'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, type Product } from '@/lib/types'
import ProductCard from './ProductCard'

const PAGE_SIZE = 24
const SORT_OPTIONS = [
  { value: 'random', label: 'Aleatorio' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre: A-Z' },
  { value: 'name-desc', label: 'Nombre: Z-A' },
]

type Filters = {
  search: string
  category: string
  priceMin: string
  priceMax: string
  sort: string
}

export default function ProductCatalog({
  initialCategory,
  initialQuery,
}: {
  initialCategory?: string
  initialQuery?: string
}) {
  const [filters, setFilters] = useState<Filters>({
    search: initialQuery || '',
    category: initialCategory || '',
    priceMin: '',
    priceMax: '',
    sort: 'random',
  })
  const [searchInput, setSearchInput] = useState(filters.search)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [randomPool, setRandomPool] = useState<Product[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const supabase = useMemo(() => createClient(), [])

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }))
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  // Fetch products when filters change
  const fetchProducts = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_published', true)

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.search.trim()) {
        const term = `%${filters.search.trim()}%`
        query = query.or(
          `name.ilike.${term},ai_short_desc.ilike.${term},ai_keywords.cs.{${filters.search.trim().toLowerCase()}}`
        )
      }

      if (filters.priceMin) {
        query = query.gte('price', parseFloat(filters.priceMin))
      }
      if (filters.priceMax) {
        query = query.lte('price', parseFloat(filters.priceMax))
      }

      const isRandom = filters.sort === 'random'

      switch (filters.sort) {
        case 'price-asc':
          query = query.order('price', { ascending: true })
          break
        case 'price-desc':
          query = query.order('price', { ascending: false })
          break
        case 'name-asc':
          query = query.order('name', { ascending: true })
          break
        case 'name-desc':
          query = query.order('name', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      if (isRandom && !append) {
        // For random: fetch a large pool and shuffle
        const { data: allData, count: totalCount } = await query.range(0, 499)
        const pool = (allData ?? []) as Product[]
        const total = totalCount ?? 0
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[pool[i], pool[j]] = [pool[j], pool[i]]
        }
        setProducts(pool.slice(0, PAGE_SIZE))
        setTotalCount(total)
        setHasMore(PAGE_SIZE < pool.length)
        setRandomPool(pool)
      } else if (isRandom && append) {
        // Load more from the shuffled pool
        const nextSlice = randomPool.slice(products.length, products.length + PAGE_SIZE)
        setProducts((prev) => [...prev, ...nextSlice])
        setHasMore(products.length + nextSlice.length < randomPool.length)
      } else {
        const { data, count } = await query.range(offset, offset + PAGE_SIZE - 1)
        const fetched = (data ?? []) as Product[]
        const total = count ?? 0

        if (append) {
          setProducts((prev) => [...prev, ...fetched])
        } else {
          setProducts(fetched)
          setRandomPool([])
        }
        setTotalCount(total)
        setHasMore(offset + fetched.length < total)
      }
      setLoading(false)
      setLoadingMore(false)
    },
    [supabase, filters]
  )

  useEffect(() => {
    fetchProducts(0, false)
  }, [fetchProducts])

  // Update URL without navigation
  useEffect(() => {
    const sp = new URLSearchParams()
    if (filters.category) sp.set('cat', filters.category)
    if (filters.search) sp.set('q', filters.search)
    const qs = sp.toString()
    const url = `/productos${qs ? `?${qs}` : ''}`
    window.history.replaceState(null, '', url)
  }, [filters.category, filters.search])

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  function clearFilters() {
    setSearchInput('')
    setFilters({ search: '', category: '', priceMin: '', priceMax: '', sort: 'newest' })
  }

  const hasActiveFilters =
    filters.category || filters.search || filters.priceMin || filters.priceMax

  const activeCategory = CATEGORIES.find((c) => c.slug === filters.category)

  return (
    <>
      {/* Search bar */}
      <div className="border-b border-[var(--light)]/40 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--mid)]"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5L17 17" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar productos... ej: termo, USB, bolsa ecológica, bolígrafo"
              className="w-full rounded-xl border border-[var(--light)] bg-[var(--pale)] py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-[var(--mid)]/60 focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/20 sm:text-base"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--mid)] transition hover:text-[var(--black)]"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category pills + filter toggle */}
      <div className="border-b border-[var(--light)]/40 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-3 py-4">
            <div className="flex flex-1 gap-2 overflow-x-auto">
              <button
                onClick={() => updateFilter('category', '')}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  !filters.category
                    ? 'bg-[var(--brand)] text-white'
                    : 'bg-[var(--pale)] text-[var(--mid)] hover:bg-[var(--light)]'
                }`}
              >
                Todos
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() =>
                    updateFilter('category', filters.category === c.slug ? '' : c.slug)
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    filters.category === c.slug
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[var(--pale)] text-[var(--mid)] hover:bg-[var(--light)]'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                filtersOpen || filters.priceMin || filters.priceMax
                  ? 'border-[var(--brand)] bg-[var(--brand-pale)] text-[var(--brand)]'
                  : 'border-[var(--light)] text-[var(--mid)] hover:bg-[var(--pale)]'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Filtros
            </button>
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div className="border-t border-[var(--light)]/40 pb-4 pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-xs font-medium text-[var(--mid)]">
                    Precio mínimo (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={filters.priceMin}
                    onChange={(e) => updateFilter('priceMin', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-[var(--light)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] sm:w-36"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-xs font-medium text-[var(--mid)]">
                    Precio máximo (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={filters.priceMax}
                    onChange={(e) => updateFilter('priceMax', e.target.value)}
                    placeholder="Sin límite"
                    className="w-full rounded-lg border border-[var(--light)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] sm:w-36"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-xs font-medium text-[var(--mid)]">
                    Ordenar por
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="w-full rounded-lg border border-[var(--light)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] sm:w-48"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--black)] sm:text-3xl">
              {activeCategory
                ? `${activeCategory.emoji} ${activeCategory.label}`
                : filters.search
                  ? `Resultados para "${filters.search}"`
                  : 'Todos los artículos'}
            </h1>
            <p className="mt-1 text-sm text-[var(--mid)]">
              {loading
                ? 'Buscando...'
                : `${totalCount.toLocaleString('es-MX')} producto${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          {/* Sort shortcut (desktop) */}
          <div className="hidden sm:block">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="rounded-lg border border-[var(--light)] px-3 py-2 text-sm text-[var(--mid)] outline-none transition focus:border-[var(--brand)]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-[var(--light)]/60">
                <div className="aspect-square bg-[var(--pale)]" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-[var(--light)]" />
                  <div className="h-5 w-1/3 rounded bg-[var(--light)]" />
                </div>
                <div className="px-4 pb-4">
                  <div className="h-9 rounded-lg bg-[var(--light)]" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => fetchProducts(products.length, true)}
                  disabled={loadingMore}
                  className="rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más productos'}
                </button>
              </div>
            )}

            {!hasMore && products.length > PAGE_SIZE && (
              <p className="mt-12 text-center text-sm text-[var(--mid)]">
                Has visto todos los productos
              </p>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-5xl">&#128230;</p>
            <h2 className="mt-4 text-xl font-bold text-[var(--black)]">
              No se encontraron productos
            </h2>
            <p className="mt-2 text-[var(--mid)]">
              Intenta con otro término de búsqueda o ajusta los filtros.
            </p>
            <button
              onClick={clearFilters}
              className="mt-6 inline-block rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
            >
              Ver todos los productos
            </button>
          </div>
        )}
      </div>
    </>
  )
}
