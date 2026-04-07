import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import ProductCard from '@/components/ProductCard'
import RandomProducts from '@/components/RandomProducts'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, type Product } from '@/lib/types'

const CATEGORY_COLORS: Record<string, string> = {
  escritura: '#3D3CB8',
  bebidas: '#E53935',
  tecnologia: '#F9A825',
  oficina: '#00897B',
  bolsas: '#5C6BC0',
  llaveros: '#8E24AA',
  sets: '#F4511E',
  navidad: '#C62828',
  paraguas: '#0288D1',
  decoracion: '#6D4C41',
}

const TRUST_ITEMS = [
  'Personalización de logo',
  'Envío a toda la República',
  'Cotización en 24h',
  'Más de 1,000 productos',
  'Calidad garantizada',
  'Precios competitivos',
  'Atención personalizada',
  '15+ años de experiencia',
]

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: featured }, { data: recentPool }, { data: minPrices }] =
    await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_published', true)
        .limit(50),
      supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .limit(100),
      supabase.rpc('get_min_prices_by_category').then((res) => res),
    ])

  function hasWorkingImage(p: Product) {
    return p.images?.length > 0 &&
      typeof p.images[0] === 'string' &&
      p.images[0].startsWith('http') &&
      !p.images[0].includes('/wp/')
  }

  // Shuffle and pick random subsets, preferring products with images
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const featuredPool = (featured ?? []) as Product[]
  const featuredWithImages = featuredPool.filter(hasWorkingImage)
  const featuredProducts = shuffle(
    featuredWithImages.length >= 4 ? featuredWithImages : featuredPool
  ).slice(0, 4)

  const allRecent = (recentPool ?? []) as Product[]
  const recentWithImages = allRecent.filter(hasWorkingImage)
  const recentProducts = shuffle(
    recentWithImages.length >= 8 ? recentWithImages : allRecent
  ).slice(0, 8)

  const priceMap: Record<string, number> = {}
  if (minPrices && Array.isArray(minPrices)) {
    for (const row of minPrices) {
      priceMap[row.category] = row.min_price
    }
  }

  const categoryImages: Record<string, string> = {}
  const catSlugs = CATEGORIES.map((c) => c.slug)

  // First try published products for category images
  const { data: sampleProducts } = await supabase
    .from('products')
    .select('category, images')
    .eq('is_published', true)
    .in('category', catSlugs)
    .not('images', 'eq', '{}')
    .order('created_at', { ascending: false })
    .limit(200)

  if (sampleProducts) {
    for (const p of sampleProducts) {
      const img = p.images?.[0]
      if (!categoryImages[p.category] && typeof img === 'string' && img.startsWith('http') && !img.includes('/wp/')) {
        categoryImages[p.category] = img
      }
    }
  }

  // For categories still missing an image, try unpublished products
  const missingCats = catSlugs.filter((s) => !categoryImages[s])
  if (missingCats.length > 0) {
    const { data: fallbackProducts } = await supabase
      .from('products')
      .select('category, images')
      .in('category', missingCats)
      .not('images', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(50)

    if (fallbackProducts) {
      for (const p of fallbackProducts) {
        const img = p.images?.[0]
        if (!categoryImages[p.category] && typeof img === 'string' && img.startsWith('http') && !img.includes('/wp/')) {
          categoryImages[p.category] = img
        }
      }
    }
  }

  // JSON-LD for homepage
  const homepageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Promogifts',
        url: 'https://promogifts.com.mx',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'ventas@promogifts.com.mx',
          contactType: 'sales',
          areaServed: 'MX',
          availableLanguage: 'Spanish',
        },
      },
      {
        '@type': 'WebSite',
        name: 'Promogifts México',
        url: 'https://promogifts.com.mx',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://promogifts.com.mx/productos?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      ...(featuredProducts.length > 0
        ? [
            {
              '@type': 'ItemList',
              name: 'Productos Destacados',
              itemListElement: featuredProducts.slice(0, 10).map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: p.name,
                url: `https://promogifts.com.mx/productos/${p.slug}`,
                ...(p.images?.[0]?.startsWith('http') ? { image: p.images[0] } : {}),
              })),
            },
          ]
        : []),
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '¿Cuál es el pedido mínimo de artículos promocionales?', acceptedAnswer: { '@type': 'Answer', text: 'El pedido mínimo varía según el producto, pero en general manejamos desde 50 piezas. Para artículos premium o sets corporativos, podemos trabajar con cantidades menores.' } },
          { '@type': 'Question', name: '¿Cuánto tiempo tarda la producción de productos promocionales?', acceptedAnswer: { '@type': 'Answer', text: 'El tiempo de producción estándar es de 10 a 15 días hábiles después de la aprobación del diseño. El envío a cualquier parte de México tarda de 3 a 5 días adicionales.' } },
          { '@type': 'Question', name: '¿Qué técnicas de personalización ofrecen para logos?', acceptedAnswer: { '@type': 'Answer', text: 'Ofrecemos serigrafía, grabado láser, sublimación, bordado, impresión digital UV y tampografía. Recomendamos la mejor técnica según el material del producto.' } },
          { '@type': 'Question', name: '¿Hacen envíos de artículos promocionales a todo México?', acceptedAnswer: { '@type': 'Answer', text: 'Sí, realizamos envíos a toda la República Mexicana con servicio de paquetería con rastreo incluido.' } },
          { '@type': 'Question', name: '¿Emiten factura fiscal CFDI?', acceptedAnswer: { '@type': 'Answer', text: 'Sí, emitimos factura CFDI en todas nuestras operaciones.' } },
          { '@type': 'Question', name: '¿Puedo ver una muestra antes de hacer mi pedido?', acceptedAnswer: { '@type': 'Answer', text: 'Sí, podemos enviar muestras físicas o mockups digitales antes de la producción para que apruebes el diseño, los colores y la calidad.' } },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />

      <Nav />
      <Hero />

      {/* Category cards */}
      <section className="relative z-10 -mt-16 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIES.map((cat) => {
              const color = CATEGORY_COLORS[cat.slug] || '#3D3CB8'
              const minPrice = priceMap[cat.slug]
              const img = categoryImages[cat.slug]

              return (
                <Link
                  key={cat.slug}
                  href={`/productos?cat=${cat.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className="flex aspect-square items-center justify-center p-4"
                    style={{ backgroundColor: color }}
                  >
                    {typeof img === 'string' && img.startsWith('http') ? (
                      <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
                        <Image
                          src={img}
                          alt={`${cat.label} - Artículos Promocionales`}
                          fill
                          sizes="(max-width: 640px) 50vw, 20vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-5xl">{cat.emoji}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col items-center p-4 text-center">
                    <h3 className="font-semibold text-[var(--black)]">{cat.label}</h3>
                    {minPrice != null && (
                      <p className="mt-1 text-xs text-[var(--mid)]">
                        Desde ${Number(minPrice).toFixed(2)} por unidad
                      </p>
                    )}
                    <span
                      className="mt-3 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition group-hover:opacity-90"
                      style={{ backgroundColor: color }}
                    >
                      Ver Productos
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="overflow-hidden bg-[var(--brand)] py-3">
        <div className="animate-marquee flex w-max gap-8">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <span key={i} className="whitespace-nowrap text-sm font-medium text-white">
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Quienes Somos */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[var(--black)] sm:text-4xl">Quienes Somos</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--mid)]">
              En Promogifts somos tus aliados y buscamos ofrecerte lo mejor. Estamos comprometidos con ofrecer la mayor variedad de productos promocionales en México y el mejor servicio a nuestros clientes.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Difunde tu marca',
                desc: 'Encuentra productos únicos y funcionales que promuevan tu marca.',
                icon: (
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Calidad Garantizada',
                desc: 'Te ofrecemos una gran selección de productos de la mejor calidad.',
                icon: (
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Variedad de Productos',
                desc: 'La mayor variedad de productos promocionales y regalos para oficina en México.',
                icon: (
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Nuestro Servicio',
                desc: 'Atención personalizada que te dejará satisfecho con todos nuestros servicios.',
                icon: (
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-[var(--light)]/60 bg-white p-6 text-center transition hover:shadow-lg">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-pale)] text-[var(--brand)]">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--black)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mid)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <RandomProducts
            initial={featuredProducts}
            title="Productos Destacados"
            subtitle="La mayor variedad de productos promocionales en México"
          />
        </section>
      )}

      {/* Ideal para Eventos */}
      <section className="bg-[var(--brand)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Regalos Corporativos para Cada Ocasión
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Artículos promocionales ideales para eventos empresariales, ferias, conferencias y más.
              Haz que tu marca destaque en cada momento.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Ferias y Exposiciones',
                desc: 'Atrae visitantes a tu stand con artículos promocionales llamativos. Bolígrafos, lanyards, bolsas y USB personalizados que tus prospectos conservarán.',
                icon: (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Eventos Corporativos',
                desc: 'Kits de bienvenida, regalos para conferencias y artículos premium para reuniones ejecutivas. Personalización con tu logotipo en cada pieza.',
                icon: (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Lanzamientos de Producto',
                desc: 'Causa una primera impresión memorable. Sets exclusivos, termos grabados y artículos tecnológicos que refuerzan el posicionamiento de tu nueva marca.',
                icon: (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Fin de Año y Navidad',
                desc: 'Sorprende a tus empleados y clientes con regalos navideños personalizados. Canastas, sets premium y artículos decorativos con tu marca.',
                icon: (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Capacitaciones y Talleres',
                desc: 'Libretas, bolígrafos, carpetas y mochilas personalizadas para asistentes. Todo lo que necesitas para que tu evento sea profesional y recordado.',
                icon: (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: 'Campañas de Marketing',
                desc: 'Refuerza tus campañas con productos tangibles que generen recordación de marca. Artículos útiles que tus clientes usarán todos los días.',
                icon: (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-white">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent products */}
      {recentProducts.length > 0 && (
        <section className="py-16">
          <RandomProducts
            initial={recentProducts}
            title="Explora Nuestro Catálogo"
            subtitle="Más de 1,000 artículos promocionales para tu empresa"
          />
        </section>
      )}

      {/* Nuestro Proceso */}
      <section className="bg-[var(--pale)] py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[var(--black)] sm:text-4xl">Cómo Funciona</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--mid)]">
              Cotiza tus artículos promocionales en 3 simples pasos y recibe tu pedido con personalización de logo.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: 'Elige y Cotiza', desc: 'Explora nuestro catálogo de más de 1,000 productos promocionales. Envíanos tu selección y recibe una cotización personalizada en menos de 24 horas.' },
              { step: '2', title: 'Aprueba el Diseño', desc: 'Nuestro equipo crea un mockup digital con tu logotipo para tu aprobación. Ajustamos colores, posición y tamaño hasta que quede perfecto.' },
              { step: '3', title: 'Recibe tu Pedido', desc: 'Producimos tu pedido en 10 a 15 días hábiles con las mejores técnicas de impresión. Envío con rastreo a toda la República Mexicana.' },
            ].map((item) => (
              <div key={item.step} className="relative rounded-xl border border-[var(--light)]/60 bg-white p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-xl font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[var(--black)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--mid)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content: Artículos Promocionales */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-[var(--black)] sm:text-4xl">
            Artículos Promocionales y Regalos Corporativos en México
          </h2>
          <div className="mt-8 space-y-6 text-[var(--mid)] leading-relaxed">
            <p>
              Los <strong className="text-[var(--black)]">artículos promocionales</strong> son una de las herramientas de marketing más efectivas para posicionar tu marca.
              A diferencia de la publicidad digital, un producto promocional tangible genera una conexión directa con tu cliente:
              cada vez que usa tu termo, bolígrafo o mochila con tu logo, tu marca gana visibilidad de manera orgánica.
            </p>
            <p>
              En <strong className="text-[var(--black)]">Promogifts</strong> ofrecemos la mayor variedad de
              <strong className="text-[var(--black)]"> regalos corporativos</strong> y productos promocionales en México.
              Nuestro catálogo incluye termos y tazas personalizadas, bolígrafos de calidad, artículos de tecnología como
              USB y cargadores portátiles, bolsas ecológicas, sets ejecutivos, llaveros, paraguas y mucho más.
            </p>
            <p>
              Cada artículo se personaliza con la técnica de impresión ideal para tu logotipo: serigrafía, grabado láser,
              sublimación, bordado o impresión digital. Nuestro equipo de diseño te asesora para lograr la mejor
              presentación en cada producto, asegurando que tu marca luzca profesional y memorable.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--light)]/60 bg-[var(--pale)] p-6">
              <h3 className="text-lg font-semibold text-[var(--black)]">Para Empresas</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--mid)]">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Regalos para clientes y prospectos</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Kits de bienvenida para empleados</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Material para stands en ferias</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Regalos de fin de año corporativos</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Incentivos para equipos de ventas</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--light)]/60 bg-[var(--pale)] p-6">
              <h3 className="text-lg font-semibold text-[var(--black)]">Para Eventos</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--mid)]">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Congresos y conferencias</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Ferias y exposiciones comerciales</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Lanzamientos de producto</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Eventos deportivos y torneos de golf</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[var(--brand)]">&#10003;</span> Graduaciones y eventos académicos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--pale)] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-[var(--black)] sm:text-4xl">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 text-center text-[var(--mid)]">
            Todo lo que necesitas saber sobre nuestros artículos promocionales
          </p>
          <div className="mt-10 space-y-6">
            {[
              {
                q: '¿Cuál es el pedido mínimo?',
                a: 'El pedido mínimo varía según el producto, pero en general manejamos desde 50 piezas. Para artículos premium o sets corporativos, podemos trabajar con cantidades menores. Contáctanos para una cotización a tu medida.',
              },
              {
                q: '¿Cuánto tiempo tarda la producción?',
                a: 'El tiempo de producción estándar es de 10 a 15 días hábiles después de la aprobación del diseño. Para pedidos urgentes, ofrecemos servicio express con tiempos reducidos. El envío a cualquier parte de México tarda de 3 a 5 días adicionales.',
              },
              {
                q: '¿Qué técnicas de personalización ofrecen?',
                a: 'Ofrecemos serigrafía, grabado láser, sublimación, bordado, impresión digital UV y tampografía. Nuestro equipo recomienda la mejor técnica según el material del producto y tu diseño para lograr el mejor resultado.',
              },
              {
                q: '¿Hacen envíos a todo México?',
                a: 'Sí, realizamos envíos a toda la República Mexicana con servicio de paquetería con rastreo incluido. También podemos coordinar entregas en punto para pedidos grandes en la Ciudad de México y área metropolitana.',
              },
              {
                q: '¿Emiten factura fiscal?',
                a: 'Sí, emitimos factura CFDI en todas nuestras operaciones. Solicítala al momento de tu compra proporcionando tus datos fiscales.',
              },
              {
                q: '¿Puedo ver una muestra antes de mi pedido?',
                a: 'Sí, podemos enviar muestras físicas o virtuales (mockups digitales) antes de la producción para que apruebes el diseño, los colores y la calidad del producto.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-[var(--light)]/60 bg-white p-6">
                <h3 className="font-semibold text-[var(--black)]">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mid)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section className="bg-[var(--pale)] py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-[var(--black)]">
                Estamos para servirte, contáctanos
              </h2>
              <p className="mt-4 text-[var(--mid)]">
                Promogifts — tu mejor opción para artículos promocionales y regalos para empresas.
              </p>
              <p className="mt-6 text-sm text-[var(--mid)]">
                Estaremos en contacto a la brevedad.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-[var(--mid)]">
                  <svg className="h-5 w-5 text-[var(--brand)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <a href="tel:+525556821145" className="block transition hover:text-[var(--brand)]">(+52 55) 5682 1145</a>
                    <a href="tel:+525530297582" className="block transition hover:text-[var(--brand)]">(+52 55) 3029 7582</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--mid)]">
                  <svg className="h-5 w-5 text-[var(--brand)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <a href="mailto:ventas@promogifts.com.mx" className="transition hover:text-[var(--brand)]">ventas@promogifts.com.mx</a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-[var(--light)]/60 bg-white p-6 sm:p-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* WhatsApp float */}
      <a href="https://wa.me/525530297582?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-110" style={{ backgroundColor: '#25D366' }} aria-label="Contactar por WhatsApp">
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </>
  )
}
