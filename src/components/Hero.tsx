import Link from 'next/link'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--brand)]" style={{ minHeight: 320 }}>
      {/* Particle network background */}
      <div className="hero-particles pointer-events-none absolute inset-0" />
      <div className="brand-gradient pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-28">
        <h1 className="text-4xl leading-tight text-white sm:text-6xl lg:text-7xl">
          <span className="font-light">Promogifts</span>
          <br />
          <span className="font-bold">Promocionales</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
          Artículos Promocionales y Regalos Corporativos para Empresas en México
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <WhatsAppButton
            message="Hola, quiero una cotización de artículos promocionales"
            label="Cotizar por WhatsApp"
            className="rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          />
          <Link
            href="/productos"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-white/90"
          >
            Ver Catálogo
          </Link>
        </div>
      </div>
    </section>
  )
}
