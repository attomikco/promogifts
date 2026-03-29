import Link from 'next/link'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, type Product } from '@/lib/types'

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

  const [{ data: featured }, { data: recent }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_published', true)
      .limit(4),
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const featuredProducts = (featured ?? []) as Product[]
  const recentProducts = (recent ?? []) as Product[]

  return (
    <>
      <Nav />
      <Hero />

      {/* Trust bar */}
      <div className="overflow-hidden bg-[var(--brand)] py-3">
        <div className="animate-marquee flex w-max gap-8">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-sm font-medium text-white"
            >
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="bg-[var(--pale)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-[var(--black)]">
            Categorías
          </h2>
          <p className="mt-2 text-[var(--mid)]">
            Encuentra el artículo perfecto para tu marca
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/productos?cat=${cat.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-[var(--light)]/60 bg-white p-5 text-center transition hover:border-[var(--brand)]/30 hover:shadow-md"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-sm font-semibold text-[var(--black)]">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold text-[var(--black)]">
              Productos Destacados
            </h2>
            <p className="mt-2 text-[var(--mid)]">
              Lo más solicitado por nuestros clientes
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent products */}
      {recentProducts.length > 0 && (
        <section className="bg-[var(--pale)] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold text-[var(--black)]">
              Productos Recientes
            </h2>
            <p className="mt-2 text-[var(--mid)]">
              Los últimos artículos agregados a nuestro catálogo
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-[var(--brand)] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            ¿Listo para hacer memorable tu marca?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Solicita tu cotización gratuita y recibe una propuesta personalizada
            en menos de 24 horas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:hola@promogifts.com.mx"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-white/90"
            >
              Enviar correo
            </a>
            <a
              href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* WhatsApp float button */}
      <a
        href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-110"
        style={{ backgroundColor: '#25D366' }}
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </>
  )
}
