import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import ContactForm from '@/components/ContactForm'
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
  const hasImg = product.images?.[0]?.startsWith('http') && !product.images[0].includes('/wp/')
  const img = hasImg ? product.images[0] : undefined

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
  const hasImage = product.images?.[0]?.startsWith('http') && !product.images[0].includes('/wp/')
  const altText = `${product.name} - Artículo Promocional Personalizado`

  // All valid images (skip /wp/)
  const validImages = (product.images ?? []).filter(
    (img: string) => typeof img === 'string' && img.startsWith('http') && !img.includes('/wp/')
  )

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
    description: product.ai_description ?? product.ai_short_desc ?? `${product.name} - Artículo promocional personalizado con tu logo`,
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
                    href={`/productos?cat=${categoryInfo.slug}`}
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

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/525530297582?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Cotizar por WhatsApp
                </a>
                <a
                  href={`mailto:ventas@promogifts.com.mx?subject=Cotización: ${product.name} (${product.sku})`}
                  className="rounded-full border border-[var(--brand)] px-6 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-pale)]"
                >
                  Cotizar por correo
                </a>
                <a
                  href="tel:+525530297582"
                  className="rounded-full border border-[var(--light)] px-6 py-3 text-sm font-semibold text-[var(--mid)] transition hover:bg-[var(--pale)]"
                >
                  Llamar
                </a>
              </div>

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
                {product.ai_description ? (
                  <div className="mt-4 leading-relaxed text-[var(--mid)]">
                    {product.ai_description}
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
