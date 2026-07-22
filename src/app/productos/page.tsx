import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Breadcrumbs from '@/components/Breadcrumbs'
import ProductCatalog from '@/components/ProductCatalog'
import Footer from '@/components/Footer'
import { CATEGORIES } from '@/lib/types'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams

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

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>
}) {
  const { cat, q } = await searchParams

  // Categories now live on dedicated SEO pages. Static redirects can't match
  // query params, so redirect ?cat= server-side to /categoria/[slug].
  if (cat && CATEGORIES.some((c) => c.slug === cat)) {
    redirect(`/categoria/${cat}`)
  }

  const breadcrumbs = [{ label: 'Inicio', href: '/' }, { label: 'Productos' }]

  return (
    <>
      <Nav />
      <Breadcrumbs items={breadcrumbs} />

      <main className="flex-1">
        {/* Server-rendered, indexable category links */}
        <section className="border-b border-[var(--light)]/40 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--mid)]">
              Explora por categoría
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categoria/${c.slug}`}
                  className="rounded-full border border-[var(--light)] bg-[var(--pale)] px-4 py-2 text-sm font-medium text-[var(--mid)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  {c.emoji} {c.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ProductCatalog initialQuery={q} />
      </main>

      <Footer />
    </>
  )
}
