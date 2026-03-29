import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, type Product } from '@/lib/types'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return {}

  const product = data as Product

  return {
    title: product.ai_meta_title ?? product.name,
    description: product.ai_meta_desc ?? product.ai_short_desc,
    keywords: product.ai_keywords,
    openGraph: {
      title: product.ai_meta_title ?? product.name,
      description: product.ai_meta_desc ?? product.ai_short_desc ?? undefined,
      url: `https://promogifts.com.mx/productos/${product.slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://promogifts.com.mx/productos/${product.slug}`,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) notFound()

  const product = data as Product

  const categoryInfo = CATEGORIES.find((c) => c.slug === product.category)

  // Related products
  const { data: relatedData } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(4)

  const related = (relatedData ?? []) as Product[]

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa cotizar: ${product.name} (SKU: ${product.sku})`
  )

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.ai_description ?? product.ai_short_desc,
            sku: product.sku,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'MXN',
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />

      <Nav />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-[var(--light)]/40 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <nav className="flex gap-2 text-sm text-[var(--mid)]">
              <Link href="/" className="transition hover:text-[var(--black)]">
                Inicio
              </Link>
              <span>/</span>
              <Link
                href="/productos"
                className="transition hover:text-[var(--black)]"
              >
                Productos
              </Link>
              {categoryInfo && (
                <>
                  <span>/</span>
                  <Link
                    href={`/productos?cat=${categoryInfo.slug}`}
                    className="transition hover:text-[var(--black)]"
                  >
                    {categoryInfo.label}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-[var(--black)]">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product detail */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Left — Image */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[var(--pale)]">
              {product.images?.length > 0 && product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="text-8xl">🎁</span>
              )}
            </div>

            {/* Right — Info */}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--mid)]">
                  {product.sku}
                </span>
                {categoryInfo && (
                  <Link
                    href={`/productos?cat=${categoryInfo.slug}`}
                    className="rounded-full bg-[var(--brand-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]"
                  >
                    {categoryInfo.emoji} {categoryInfo.label}
                  </Link>
                )}
              </div>

              <h1 className="mt-3 font-display text-4xl font-black text-[var(--black)]">
                {product.name}
              </h1>

              {product.ai_short_desc && (
                <p className="mt-4 text-lg leading-relaxed text-[var(--mid)]">
                  {product.ai_short_desc}
                </p>
              )}

              <div className="mt-6">
                <span className="font-display text-4xl font-black text-[var(--brand)]">
                  ${product.price} MXN
                </span>
                <p className="mt-1 text-sm text-[var(--mid)]">
                  Pedido mínimo: {product.min_qty} piezas
                </p>
              </div>

              {/* Selling points */}
              {product.ai_selling_points.length > 0 && (
                <ul className="mt-6 space-y-2">
                  {product.ai_selling_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-[var(--brand)]">✓</span>
                      <span className="text-[var(--black)]">{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Specs */}
              {(product.dimensions || product.material) && (
                <div className="mt-6 rounded-xl bg-[var(--pale)] p-4">
                  <h3 className="text-sm font-semibold text-[var(--black)]">
                    Especificaciones
                  </h3>
                  <dl className="mt-2 space-y-1 text-sm">
                    {product.dimensions && (
                      <div className="flex gap-2">
                        <dt className="font-medium text-[var(--mid)]">
                          Dimensiones:
                        </dt>
                        <dd>{product.dimensions}</dd>
                      </div>
                    )}
                    {product.material && (
                      <div className="flex gap-2">
                        <dt className="font-medium text-[var(--mid)]">
                          Material:
                        </dt>
                        <dd>{product.material}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={`https://wa.me/521XXXXXXXXXX?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                >
                  Cotizar por WhatsApp →
                </a>
                <a
                  href={`mailto:hola@promogifts.com.mx?subject=Cotización: ${product.name} (${product.sku})`}
                  className="rounded-full border border-[var(--brand)] px-6 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-pale)]"
                >
                  Por correo
                </a>
              </div>
            </div>
          </div>

          {/* Full description */}
          {product.ai_description && (
            <section className="mt-16">
              <h2 className="font-display text-2xl font-bold text-[var(--black)]">
                Descripción del producto
              </h2>
              <div className="mt-4 max-w-3xl leading-relaxed text-[var(--mid)]">
                {product.ai_description}
              </div>
            </section>
          )}

          {/* Use cases */}
          {product.ai_use_cases.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-bold text-[var(--black)]">
                Casos de uso
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {product.ai_use_cases.map((uc, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-[var(--brand-pale)] px-4 py-2 text-sm font-medium text-[var(--brand)]"
                  >
                    {uc}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="border-t border-[var(--light)]/40 bg-[var(--pale)] py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h2 className="font-display text-2xl font-bold text-[var(--black)]">
                Productos relacionados
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}
