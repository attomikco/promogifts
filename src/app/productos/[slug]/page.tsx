import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import ContactForm from '@/components/ContactForm'
import QuoteForm from '@/components/QuoteForm'
import ProductCTAs from '@/components/ProductCTAs'
import Breadcrumbs from '@/components/Breadcrumbs'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, type Product } from '@/lib/types'

type Props = { params: Promise<{ slug: string }> }

function resolveDescription(p: Product): string | null {
  const ai = p.ai_description?.trim()
  if (ai) return ai
  const original = p.description?.trim()
  if (original) return original
  return null
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
  const hasImg = product.images?.[0]?.startsWith('http')
  const img = hasImg ? product.images[0] : undefined
  const resolved = resolveDescription(product)
  const metaDescription =
    product.ai_meta_desc ||
    resolved ||
    `Compra ${product.name} personalizado con tu logo. Desde ${product.min_qty} piezas. Entrega en toda la República Mexicana. Cotiza gratis.`
  const socialDescription =
    product.ai_meta_desc ?? resolved ?? product.ai_short_desc ?? undefined

  return {
    title:
      product.ai_meta_title ||
      `${product.name} | Artículos Promocionales | Promogifts México`,
    description: metaDescription,
    keywords: product.ai_keywords?.join(', '),
    openGraph: {
      title: product.ai_meta_title ?? product.name,
      description: socialDescription,
      url: `https://promogifts.com.mx/productos/${product.slug}`,
      type: 'website',
      ...(img ? { images: [{ url: img, width: 800, height: 800, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.ai_meta_title ?? product.name,
      description: socialDescription,
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

  const validImages = (product.images ?? []).filter(
    (img: string) => typeof img === 'string' && img.startsWith('http')
  )

  // Related (same category) + also interested (different categories)
  // Fetch more than needed so we can prioritize products with working images
  const [{ data: relatedData }, { data: alsoData }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(20),
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .neq('category', product.category)
      .neq('id', product.id)
      .limit(20),
  ])

  function hasWorkingImage(p: Product) {
    return p.images?.length > 0 &&
      typeof p.images[0] === 'string' &&
      p.images[0].startsWith('http')
  }

  const related = ((relatedData ?? []) as Product[]).filter(hasWorkingImage).slice(0, 4)
  const alsoInterested = ((alsoData ?? []) as Product[]).filter(hasWorkingImage).slice(0, 4)

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    ...(categoryInfo
      ? [{ label: categoryInfo.label, href: `/categoria/${categoryInfo.slug}` }]
      : []),
    { label: product.name },
  ]

  const resolvedDescription = resolveDescription(product)

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: resolvedDescription ?? product.ai_short_desc ?? `${product.name} - Artículo promocional personalizado con tu logo`,
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
        {/* Hero section */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Image gallery */}
            <div>
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
                  <span className="text-8xl">&#127873;</span>
                )}
              </div>
              {/* Thumbnail strip */}
              {validImages.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {validImages.map((img: string, i: number) => (
                    <div
                      key={i}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-[var(--light)] bg-[var(--pale)]"
                    >
                      <Image
                        src={img}
                        alt={`${product.name} - Vista ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--mid)]">
                  SKU: {product.sku}
                </span>
                {categoryInfo && (
                  <Link
                    href={`/categoria/${categoryInfo.slug}`}
                    className="rounded-full bg-[var(--brand-pale)] px-3 py-1 text-xs font-medium text-[var(--brand)] transition hover:bg-[var(--brand-pale)]/80"
                  >
                    {categoryInfo.emoji} {categoryInfo.label}
                  </Link>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-bold text-[var(--black)] sm:text-4xl">
                {product.name}
              </h1>

              {product.ai_short_desc && (
                <p className="mt-4 text-lg leading-relaxed text-[var(--mid)]">
                  {product.ai_short_desc}
                </p>
              )}

              {/* Price block */}
              <div className="mt-6 rounded-xl bg-[var(--pale)] p-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[var(--brand)]">
                    ${Number(product.price).toFixed(2)} MXN
                  </span>
                  <span className="text-sm text-[var(--mid)]">por unidad</span>
                </div>
                <p className="mt-2 text-sm text-[var(--mid)]">
                  Pedido mínimo: <strong className="text-[var(--black)]">{product.min_qty} piezas</strong>
                </p>
                <p className="mt-1 text-sm text-[var(--mid)]">
                  Precio personalizado por volumen — cotiza para descuentos mayoreo
                </p>
              </div>

              {/* Selling points */}
              {product.ai_selling_points?.length > 0 && (
                <ul className="mt-6 space-y-2">
                  {product.ai_selling_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-[var(--brand)]">&#10003;</span>
                      <span className="text-[var(--black)]">{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Specs */}
              {(product.dimensions || product.material || product.colors?.length > 0) && (
                <div className="mt-6 rounded-xl border border-[var(--light)]/60 p-5">
                  <h3 className="text-sm font-semibold text-[var(--black)]">Especificaciones</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    {product.dimensions && (
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 font-medium text-[var(--mid)]">Dimensiones</dt>
                        <dd className="text-[var(--black)]">{product.dimensions}</dd>
                      </div>
                    )}
                    {product.material && (
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 font-medium text-[var(--mid)]">Material</dt>
                        <dd className="text-[var(--black)]">{product.material}</dd>
                      </div>
                    )}
                    {product.colors?.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 font-medium text-[var(--mid)]">Colores</dt>
                        <dd className="text-[var(--black)]">{product.colors.join(', ')}</dd>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 font-medium text-[var(--mid)]">Categoría</dt>
                      <dd className="text-[var(--black)]">{categoryInfo?.label ?? product.category}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Inline quote form */}
              <div className="mt-8 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-pale)]/40 p-5">
                <h2 className="text-lg font-semibold text-[var(--black)]">Cotiza este producto</h2>
                <p className="mt-1 text-sm text-[var(--mid)]">Respuesta el mismo día hábil.</p>
                <div className="mt-4">
                  <QuoteForm
                    productName={product.name}
                    productSku={product.sku}
                    minQty={product.min_qty}
                  />
                </div>
              </div>

              {/* CTA buttons (WhatsApp primary, phone secondary) + add to quote */}
              <ProductCTAs
                product={{
                  sku: product.sku,
                  name: product.name,
                  slug: product.slug,
                  image: hasImage ? product.images[0] : undefined,
                  price: product.price,
                  minQty: product.min_qty,
                }}
              />

              {/* Trust signals */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { icon: '&#128666;', text: 'Envío a todo México' },
                  { icon: '&#9989;', text: 'Personalización de logo' },
                  { icon: '&#128176;', text: 'Factura CFDI incluida' },
                  { icon: '&#9201;', text: 'Cotización en 24h' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs text-[var(--mid)]">
                    <span dangerouslySetInnerHTML={{ __html: item.icon }} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description + details tabs area */}
        <div className="border-t border-[var(--light)]/40 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              {/* Description */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-[var(--black)]">Descripción del Producto</h2>
                {resolvedDescription ? (
                  <div className="mt-4 leading-relaxed text-[var(--mid)]">
                    {resolvedDescription}
                  </div>
                ) : (
                  <div className="mt-4 space-y-4 leading-relaxed text-[var(--mid)]">
                    <p>
                      El <strong className="text-[var(--black)]">{product.name}</strong> es un artículo
                      promocional ideal para personalizar con el logotipo de tu empresa.
                      {categoryInfo && (
                        <> Pertenece a nuestra categoría de <strong className="text-[var(--black)]">{categoryInfo.label}</strong>, una de las más populares para regalos corporativos y campañas de marketing.</>
                      )}
                    </p>
                    <p>
                      Con un precio de <strong className="text-[var(--black)]">${Number(product.price).toFixed(2)} MXN por unidad</strong> y
                      un pedido mínimo de {product.min_qty} piezas, es una opción accesible para empresas de todos los tamaños.
                      Ofrecemos personalización profesional con tu logo mediante las mejores técnicas de impresión:
                      serigrafía, grabado láser, sublimación, tampografía o impresión digital.
                    </p>
                    <p>
                      Ideal para ferias comerciales, eventos corporativos, kits de bienvenida,
                      regalos de fin de año y campañas de marketing. Solicita tu cotización y recibe
                      un mockup digital sin compromiso.
                    </p>
                  </div>
                )}

                {/* Use cases */}
                {product.ai_use_cases?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[var(--black)]">Ideal para</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.ai_use_cases.map((uc, i) => (
                        <span key={i} className="rounded-full bg-[var(--brand-pale)] px-4 py-2 text-sm font-medium text-[var(--brand)]">
                          {uc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {product.ai_keywords?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[var(--black)]">Relacionado con</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.ai_keywords.map((kw, i) => (
                        <Link
                          key={i}
                          href={`/productos?q=${encodeURIComponent(kw)}`}
                          className="rounded-full border border-[var(--light)] px-3 py-1.5 text-xs text-[var(--mid)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                        >
                          {kw}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personalization info */}
                <div className="mt-10 rounded-xl bg-[var(--pale)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--black)]">Personalización Disponible</h3>
                  <p className="mt-2 text-sm text-[var(--mid)]">
                    Todos nuestros productos se pueden personalizar con el logotipo de tu empresa.
                    Técnicas disponibles según el producto:
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      { name: 'Serigrafía', desc: 'Ideal para superficies planas, colores sólidos y tirajes altos' },
                      { name: 'Grabado Láser', desc: 'Acabado premium en metales, cuero y maderas' },
                      { name: 'Sublimación', desc: 'Impresión full color en superficies blancas o claras' },
                      { name: 'Tampografía', desc: 'Perfecta para superficies curvas e irregulares' },
                    ].map((tech) => (
                      <div key={tech.name} className="rounded-lg border border-[var(--light)]/60 bg-white p-3">
                        <p className="text-sm font-medium text-[var(--black)]">{tech.name}</p>
                        <p className="mt-1 text-xs text-[var(--mid)]">{tech.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar: quick quote form */}
              <div>
                <div className="sticky top-24 rounded-xl border border-[var(--light)]/60 bg-white p-6">
                  <h3 className="text-lg font-semibold text-[var(--black)]">
                    Cotiza este producto
                  </h3>
                  <p className="mt-1 text-sm text-[var(--mid)]">
                    Recibe tu cotización personalizada en menos de 24 horas.
                  </p>
                  <div className="mt-4">
                    <ContactForm />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process strip */}
        <div className="border-t border-[var(--light)]/40 bg-[var(--pale)]">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
            {[
              { step: '1', title: 'Cotiza', desc: 'Envíanos tu solicitud y recibe precio personalizado en 24h' },
              { step: '2', title: 'Aprueba', desc: 'Revisa el mockup con tu logo antes de producción' },
              { step: '3', title: 'Recibe', desc: 'Producción en 10-15 días con envío a todo México' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-semibold text-[var(--black)]">{item.title}</h4>
                  <p className="mt-1 text-sm text-[var(--mid)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-[var(--black)]">Productos relacionados</h2>
              <p className="mt-2 text-sm text-[var(--mid)]">
                Más artículos de {categoryInfo?.label ?? 'esta categoría'} para personalizar con tu logo
              </p>
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
          <section className="bg-[var(--pale)] py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-[var(--black)]">También te puede interesar</h2>
              <p className="mt-2 text-sm text-[var(--mid)]">
                Explora otras categorías de artículos promocionales
              </p>
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
