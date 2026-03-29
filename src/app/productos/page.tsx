import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, type Product } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Catálogo de Artículos Promocionales',
  description:
    'Explora nuestro catálogo completo de artículos promocionales: termos, bolsas, plumas, tecnología y más. Personalización de logo y envíos a todo México.',
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>
}) {
  const { cat, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (cat) {
    query = query.eq('category', cat)
  }

  if (q) {
    query = query.textSearch('name', q, { config: 'spanish' })
  }

  const { data } = await query
  const products = (data ?? []) as Product[]

  const activeCategory = CATEGORIES.find((c) => c.slug === cat)

  return (
    <>
      <Nav />

      <main className="flex-1">
        {/* Header */}
        <div className="border-b border-[var(--light)]/40 bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h1 className="font-display text-3xl font-bold text-[var(--black)] sm:text-4xl">
              {activeCategory
                ? `${activeCategory.emoji} ${activeCategory.label}`
                : 'Todos los artículos'}
            </h1>
            <p className="mt-2 text-[var(--mid)]">
              {products.length} producto{products.length !== 1 ? 's' : ''}{' '}
              encontrado{products.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Category pills */}
        <div className="border-b border-[var(--light)]/40 bg-white">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
            <div className="flex gap-2 py-4">
              <Link
                href="/productos"
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  !cat
                    ? 'bg-[var(--brand)] text-white'
                    : 'bg-[var(--pale)] text-[var(--mid)] hover:bg-[var(--light)]'
                }`}
              >
                Todos
              </Link>
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/productos?cat=${c.slug}`}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    cat === c.slug
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[var(--pale)] text-[var(--mid)] hover:bg-[var(--light)]'
                  }`}
                >
                  {c.emoji} {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-5xl">📦</p>
              <h2 className="mt-4 font-display text-xl font-bold text-[var(--black)]">
                No se encontraron productos
              </h2>
              <p className="mt-2 text-[var(--mid)]">
                Intenta con otra categoría o término de búsqueda.
              </p>
              <Link
                href="/productos"
                className="mt-6 inline-block rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
              >
                Ver todos los productos
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
