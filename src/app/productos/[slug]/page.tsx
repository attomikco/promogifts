import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, type Product } from '@/lib/types'

type Props = { params: Promise<{ slug: string }> }

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
  const img = product.images?.[0]?.startsWith('http') ? product.images[0] : undefined

  return {
    title:
      product.ai_meta_title ||
      `${product.name} | Artículos Promocionales | Promogifts México`,
    description:
      product.ai_meta_desc ||
      `Compra ${product.name} personalizado con tu logo. Desde ${product.min_qty} piezas. Entrega en toda la República Mexicana. Cotiza gratis.`,
    keywords: product.ai_keywords?.join(', '),
    openGraph: {
      title: product.ai_meta_title ?? product.name,
      description: product.ai_meta_desc ?? product.ai_short_desc ?? undefined,
      url: `https://promogifts.com.mx/productos/${product.slug}`,
      type: 'website',
      ...(img ? { images: [{ url: img, width: 800, height: 800, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.ai_meta_title ?? product.name,
      description: product.ai_meta_desc ?? product.ai_short_desc ?? undefined,
      ...(img ? { images: [img] } : {}),
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
  const hasImage = product.images?.[0]?.startsWith('http')
  const altText = `${product.name} - Artículo Promocional Personalizado`

  // Related (same category) + also interested (different categories)
  const [{ data: relatedData }, { data: alsoData }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(4),
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .neq('category', product.category)
      .neq('id', product.id)
      .limit(4),
  ])

  const related = (relatedData ?? []) as Product[]
  const alsoInterested = (alsoData ?? []) as Product[]

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa cotizar: ${product.name} (SKU: ${product.sku})`
  )

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    ...(categoryInfo
      ? [{ label: categoryInfo.label, href: `/productos?cat=${categoryInfo.slug}` }]
      : []),
    { label: product.name },
  ]

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.ai_description ?? product.ai_short_desc,
    sku: product.sku,
    ...(hasImage ? { image: product.images[0] } : {}),
    brand: { '@type': 'Brand', name: 'Promogifts' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'MXN',
      lowPrice: product.price,
      offerCount: 1,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Promogifts' },
    },
    ...(product.ai_keywords?.length ? { keywords: product.ai_keywords.join(', ') } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <Nav />
      <Breadcrumbs items={breadcrumbs} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Image */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[var(--pale)]">
              {hasImage ? (
                <Image
                  src={product.images[0]}
                  alt={altText}
                  title={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="text-8xl">🎁</span>
              )}
            </div>

            {/* Info */}
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

              <h1 className="mt-3 text-4xl font-black text-[var(--black)]">
                {product.name}
              </h1>

              {product.ai_short_desc && (
                <p className="mt-4 text-lg leading-relaxed text-[var(--mid)]">
                  {product.ai_short_desc}
                </p>
              )}

              <div className="mt-6">
                <span className="text-4xl font-black text-[var(--brand)]">
                  ${product.price} MXN
                </span>
                <p className="mt-1 text-sm text-[var(--mid)]">
                  Pedido mínimo: {product.min_qty} piezas
                </p>
              </div>

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

              {(product.dimensions || product.material) && (
                <div className="mt-6 rounded-xl bg-[var(--pale)] p-4">
                  <h3 className="text-sm font-semibold text-[var(--black)]">Especificaciones</h3>
                  <dl className="mt-2 space-y-1 text-sm">
                    {product.dimensions && (
                      <div className="flex gap-2">
                        <dt className="font-medium text-[var(--mid)]">Dimensiones:</dt>
                        <dd>{product.dimensions}</dd>
                      </div>
                    )}
                    {product.material && (
                      <div className="flex gap-2">
                        <dt className="font-medium text-[var(--mid)]">Material:</dt>
                        <dd>{product.material}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

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

          {product.ai_description && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-[var(--black)]">Descripción del producto</h2>
              <div className="mt-4 max-w-3xl leading-relaxed text-[var(--mid)]">
                {product.ai_description}
              </div>
            </section>
          )}

          {product.ai_use_cases.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-[var(--black)]">Casos de uso</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {product.ai_use_cases.map((uc, i) => (
                  <span key={i} className="rounded-full bg-[var(--brand-pale)] px-4 py-2 text-sm font-medium text-[var(--brand)]">
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
              <h2 className="text-2xl font-bold text-[var(--black)]">Productos relacionados</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Also interested */}
        {alsoInterested.length > 0 && (
          <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-[var(--black)]">También te puede interesar</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {alsoInterested.map((p) => (
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
