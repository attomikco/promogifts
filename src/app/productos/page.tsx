import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import Breadcrumbs from '@/components/Breadcrumbs'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, type Product } from '@/lib/types'

const PER_PAGE = 24

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>
}): Promise<Metadata> {
  const { cat, q } = await searchParams
  const activeCategory = CATEGORIES.find((c) => c.slug === cat)

  if (activeCategory) {
    return {
      title: `${activeCategory.label} Personalizados | Artículos Promocionales`,
      description: `Explora nuestra colección de ${activeCategory.label.toLowerCase()} promocionales personalizados con tu logo. Precios desde mayoreo, envíos a todo México. Cotiza gratis.`,
      alternates: {
        canonical: `https://promogifts.com.mx/productos?cat=${cat}`,
      },
    }
  }

  if (q) {
    return {
      title: `Resultados para "${q}" | Artículos Promocionales`,
      description: `Resultados de búsqueda para "${q}" en nuestro catálogo de artículos promocionales. Más de 1,000 productos con personalización de logo.`,
    }
  }

  return {
    title: 'Catálogo de Artículos Promocionales',
    description:
      'Explora nuestro catálogo completo de artículos promocionales: termos, bolsas, plumas, tecnología y más. Personalización de logo y envíos a todo México.',
    alternates: {
      canonical: 'https://promogifts.com.mx/productos',
    },
  }
}

function buildHref(params: { cat?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.cat) sp.set('cat', params.cat)
  if (params.q) sp.set('q', params.q)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return `/productos${qs ? `?${qs}` : ''}`
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; page?: string }>
}) {
  const { cat, q, page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const from = (currentPage - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (cat) query = query.eq('category', cat)
  if (q) query = query.textSearch('name', q, { config: 'spanish' })

  const { data, count } = await query.range(from, to)
  const products = (data ?? []) as Product[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  const activeCategory = CATEGORIES.find((c) => c.slug === cat)
  const showingFrom = totalCount === 0 ? 0 : from + 1
  const showingTo = Math.min(from + PER_PAGE, totalCount)
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: activeCategory ? '/productos' : undefined },
    ...(activeCategory ? [{ label: activeCategory.label }] : []),
  ]

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: activeCategory ? `${activeCategory.label} Promocionales` : 'Catálogo de Artículos Promocionales',
    numberOfItems: totalCount,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: from + i + 1,
      name: p.name,
      url: `https://promogifts.com.mx/productos/${p.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />
      <Breadcrumbs items={breadcrumbs} />

      <main className="flex-1">
        <div className="border-b border-[var(--light)]/40 bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h1 className="text-3xl font-bold text-[var(--black)] sm:text-4xl">
              {activeCategory
                ? `${activeCategory.emoji} ${activeCategory.label}`
                : 'Todos los artículos'}
            </h1>
            <p className="mt-2 text-[var(--mid)]">
              {totalCount.toLocaleString('es-MX')} producto
              {totalCount !== 1 ? 's' : ''} encontrado
              {totalCount !== 1 ? 's' : ''}
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
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex flex-col items-center gap-4">
                  <p className="text-sm text-[var(--mid)]">
                    Mostrando {showingFrom.toLocaleString('es-MX')}-
                    {showingTo.toLocaleString('es-MX')} de{' '}
                    {totalCount.toLocaleString('es-MX')} productos
                  </p>
                  <div className="flex items-center gap-1">
                    {currentPage > 1 ? (
                      <Link href={buildHref({ cat, q, page: currentPage - 1 })} className="rounded-lg border border-[var(--light)] px-3 py-2 text-sm font-medium text-[var(--mid)] transition hover:bg-[var(--pale)]">
                        Anterior
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed rounded-lg border border-[var(--light)]/50 px-3 py-2 text-sm font-medium text-[var(--light)]">Anterior</span>
                    )}
                    {pageNumbers.map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-[var(--mid)]">...</span>
                      ) : (
                        <Link key={p} href={buildHref({ cat, q, page: p })} className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${p === currentPage ? 'bg-[var(--brand)] text-white' : 'text-[var(--mid)] hover:bg-[var(--pale)]'}`}>
                          {p}
                        </Link>
                      )
                    )}
                    {currentPage < totalPages ? (
                      <Link href={buildHref({ cat, q, page: currentPage + 1 })} className="rounded-lg border border-[var(--light)] px-3 py-2 text-sm font-medium text-[var(--mid)] transition hover:bg-[var(--pale)]">
                        Siguiente
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed rounded-lg border border-[var(--light)]/50 px-3 py-2 text-sm font-medium text-[var(--light)]">Siguiente</span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-5xl">📦</p>
              <h2 className="mt-4 text-xl font-bold text-[var(--black)]">No se encontraron productos</h2>
              <p className="mt-2 text-[var(--mid)]">Intenta con otra categoría o término de búsqueda.</p>
              <Link href="/productos" className="mt-6 inline-block rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]">
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
