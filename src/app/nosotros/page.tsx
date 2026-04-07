import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Breadcrumbs from '@/components/Breadcrumbs'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Nosotros | Sobre Promogifts México',
  description:
    'Más de 15 años de experiencia en artículos promocionales en México. Conoce a Promogifts: nuestra historia, equipo y compromiso con la calidad.',
  alternates: { canonical: 'https://promogifts.com.mx/nosotros' },
}

const STATS = [
  { value: '15+', label: 'Años de experiencia' },
  { value: '1,000+', label: 'Productos disponibles' },
  { value: '500+', label: 'Empresas atendidas' },
  { value: '50,000+', label: 'Pedidos entregados' },
]

export default function NosotrosPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Promogifts',
    url: 'https://promogifts.com.mx',
    email: 'ventas@promogifts.com.mx',
    description: 'Artículos promocionales y regalos corporativos en México',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ciudad de México',
      addressRegion: 'CDMX',
      addressCountry: 'MX',
    },
    openingHours: 'Mo-Fr 09:00-18:00',
    priceRange: '$$',
    areaServed: { '@type': 'Country', name: 'México' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Nosotros' }]} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--brand)] py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Hacemos memorable tu marca
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Más de 15 años creando experiencias de marca a través de artículos promocionales de calidad.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-[var(--light)]/40 bg-white py-12">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-[var(--brand)]">{s.value}</p>
                <p className="mt-1 text-sm text-[var(--mid)]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-[var(--black)]">Nuestra Historia</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-[var(--mid)]">
              <p>
                Promogifts nació de la convicción de que los artículos promocionales son una de las herramientas de marketing más efectivas y memorables. Desde nuestros inicios, nos dedicamos a ofrecer productos de calidad que ayuden a las empresas mexicanas a fortalecer su imagen de marca.
              </p>
              <p>
                Con más de 15 años en el mercado, hemos atendido a más de 500 empresas en toda la República Mexicana, desde startups hasta corporativos multinacionales. Nuestro catálogo cuenta con más de 1,000 productos que van desde bolígrafos y termos hasta tecnología y sets corporativos premium.
              </p>
              <p>
                Lo que nos distingue es nuestro compromiso con la atención personalizada: cada cliente recibe asesoría experta para seleccionar los productos ideales, la mejor técnica de personalización y la propuesta que se ajuste a su presupuesto.
              </p>
            </div>

            <h2 className="mt-12 text-2xl font-bold text-[var(--black)]">Nuestro Proceso</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                { step: '1', title: 'Cotización', desc: 'Recibe una propuesta personalizada en menos de 24 horas.' },
                { step: '2', title: 'Diseño', desc: 'Aprueba el mockup digital con tu logo antes de producir.' },
                { step: '3', title: 'Entrega', desc: 'Producción en 10-15 días con envío y rastreo incluido.' },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-[var(--light)]/60 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-semibold text-[var(--black)]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[var(--mid)]">{item.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-12 text-2xl font-bold text-[var(--black)]">¿Por qué Promogifts?</h2>
            <ul className="mt-6 space-y-3">
              {[
                'Más de 15 años de experiencia en el mercado mexicano',
                'Catálogo de más de 1,000 productos actualizados',
                'Asesoría personalizada en cada proyecto',
                'Precios competitivos con descuentos por volumen',
                'Envíos a toda la República Mexicana',
                'Garantía de calidad en todos nuestros productos',
                'Factura fiscal CFDI incluida',
                'Tecnología de IA para descripciones de producto optimizadas',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[var(--mid)]">
                  <span className="mt-1 text-[var(--brand)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--brand)] py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-white">¿Listo para trabajar juntos?</h2>
            <p className="mt-4 text-lg text-white/80">
              Contáctanos y recibe una cotización gratuita en menos de 24 horas.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contacto" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-white/90">
                Contactar
              </Link>
              <Link href="/productos" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
