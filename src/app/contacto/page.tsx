import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Breadcrumbs from '@/components/Breadcrumbs'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Contacto | Cotiza Artículos Promocionales',
  description:
    'Contáctanos para cotizar artículos promocionales personalizados. Respuesta en menos de 24 horas. WhatsApp, email o formulario. Promogifts México.',
  alternates: { canonical: 'https://promogifts.com.mx/contacto' },
}

export default function ContactoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Promogifts',
    url: 'https://promogifts.com.mx',
    email: 'hola@promogifts.com.mx',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ciudad de México',
      addressRegion: 'CDMX',
      addressCountry: 'MX',
    },
    openingHours: 'Mo-Fr 09:00-18:00',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Contacto' }]} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Left — info */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-[var(--black)]">Contáctanos</h1>
              <p className="mt-3 text-[var(--mid)]">
                ¿Necesitas artículos promocionales? Escríbenos y recibe tu cotización en menos de 24 horas.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--black)]">Email</h3>
                  <a href="mailto:hola@promogifts.com.mx" className="mt-1 block text-sm text-[var(--brand)]">
                    hola@promogifts.com.mx
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--black)]">WhatsApp</h3>
                  <a
                    href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-[var(--brand)]"
                  >
                    Enviar mensaje por WhatsApp
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--black)]">Horario</h3>
                  <p className="mt-1 text-sm text-[var(--mid)]">Lunes a Viernes, 9:00 – 18:00 hrs</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--black)]">Ubicación</h3>
                  <p className="mt-1 text-sm text-[var(--mid)]">Ciudad de México, México</p>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="mt-8 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[var(--pale)]">
                <p className="text-sm text-[var(--mid)]">Google Maps</p>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-[var(--light)]/60 bg-white p-6 sm:p-8">
                <h2 className="mb-6 text-xl font-bold text-[var(--black)]">
                  Envíanos un mensaje
                </h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
