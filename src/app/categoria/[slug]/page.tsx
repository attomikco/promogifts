import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Breadcrumbs from '@/components/Breadcrumbs'
import ProductCard, { type CardProduct } from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/lib/types'
import { CATEGORY_CONTENT } from '@/lib/category-content'

const PER_PAGE = 48
const BASE = 'https://promogifts.com.mx'
const CARD_COLUMNS = 'id, sku, name, slug, price, min_qty, images, category, ai_short_desc'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ pagina?: string }>
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { pagina } = await searchParams
  const content = CATEGORY_CONTENT[slug]
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!content || !category) return {}

  const page = Math.max(1, parseInt(pagina || '1', 10) || 1)
  const canonical = page > 1 ? `${BASE}/categoria/${slug}?pagina=${page}` : `${BASE}/categoria/${slug}`
  const titleSuffix = page > 1 ? ` — Página ${page}` : ''

  return {
    title: `${content.title}${titleSuffix} | Promogifts México`,
    description: content.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: `${content.h1} | Promogifts México`,
      description: content.metaDescription,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { pagina } = await searchParams

  const content = CATEGORY_CONTENT[slug]
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!content || !category) notFound()

  const page = Math.max(1, parseInt(pagina || '1', 10) || 1)
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = await createClient()
  const { data, count } = await supabase
    .from('products')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('is_published', true)
    .eq('category', slug)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const products = (data ?? []) as unknown as CardProduct[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))
  const otherCategories = CATEGORIES.filter((c) => c.slug !== slug)

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: category.label },
  ]

  const pageHref = (p: number) => (p > 1 ? `/categoria/${slug}?pagina=${p}` : `/categoria/${slug}`)

  // JSON-LD: CollectionPage + ItemList (first 10). BreadcrumbList is emitted by <Breadcrumbs>.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: content.h1,
        description: content.metaDescription,
        url: `${BASE}/categoria/${slug}`,
        isPartOf: { '@type': 'WebSite', name: 'Promogifts México', url: BASE },
      },
      {
        '@type': 'ItemList',
        name: content.title,
        numberOfItems: totalCount,
        itemListElement: products.slice(0, 10).map((p, i) => ({
          '@type': 'ListItem',
          position: from + i + 1,
          url: `${BASE}/productos/${p.slug}`,
          name: p.name,
        })),
      },
    ],
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
        {/* Intro / SEO header */}
        <header className="border-b border-[var(--light)]/40 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <h1 className="text-3xl font-bold text-[var(--black)] sm:text-4xl">
              {category.emoji} {content.h1}
            </h1>
            <p className="mt-4 max-w-3xl leading-relaxed text-[var(--mid)]">{content.intro}</p>
            <p className="mt-4 text-sm text-[var(--mid)]">
              {totalCount.toLocaleString('es-MX')} producto{totalCount !== 1 ? 's' : ''} en esta categoría
              {totalPages > 1 ? ` · Página ${page} de ${totalPages}` : ''}
            </p>
          </div>
        </header>

        {/* Product grid */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-5xl">📦</p>
              <h2 className="mt-4 text-xl font-bold text-[var(--black)]">
                Aún no hay productos publicados en esta categoría
              </h2>
              <p className="mt-2 text-[var(--mid)]">
                Escríbenos y con gusto te ayudamos a encontrar el artículo ideal.
              </p>
              <Link
                href="/productos"
                className="mt-6 inline-block rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
              >
                Ver todo el catálogo
              </Link>
            </div>
          )}

          {/* Pagination — real <a> links Google can follow */}
          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Paginación">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  rel="prev"
                  className="rounded-full border border-[var(--light)] px-5 py-2.5 text-sm font-semibold text-[var(--mid)] transition hover:bg-[var(--pale)]"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="rounded-full border border-[var(--light)]/50 px-5 py-2.5 text-sm font-semibold text-[var(--light)]">
                  ← Anterior
                </span>
              )}
              <span className="text-sm text-[var(--mid)]">
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  rel="next"
                  className="rounded-full border border-[var(--light)] px-5 py-2.5 text-sm font-semibold text-[var(--mid)] transition hover:bg-[var(--pale)]"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="rounded-full border border-[var(--light)]/50 px-5 py-2.5 text-sm font-semibold text-[var(--light)]">
                  Siguiente →
                </span>
              )}
            </nav>
          )}
        </div>

        {/* Internal links to other categories */}
        <section className="border-t border-[var(--light)]/40 bg-[var(--pale)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-bold text-[var(--black)]">Explora otras categorías</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {otherCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categoria/${c.slug}`}
                  className="rounded-full border border-[var(--light)] bg-white px-4 py-2 text-sm font-medium text-[var(--mid)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  {c.emoji} {c.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
