import Link from 'next/link'

const PREVIEW_CARDS = [
  { emoji: '\uD83C\uDF81', name: 'Sets Corporativos', price: 189 },
  { emoji: '\u2615', name: 'Termos Premium', price: 85 },
  { emoji: '\uD83C\uDF92', name: 'Mochilas Ejecutivas', price: 220 },
  { emoji: '\u270F\uFE0F', name: 'Sets de Escritura', price: 45 },
]

const STATS = [
  { value: '+1,000', label: 'Productos' },
  { value: '+500', label: 'Empresas' },
  { value: '15+', label: 'A\u00F1os' },
]

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-[var(--black)]"
      style={{ minHeight: 560 }}
    >
      {/* Background */}
      <div className="brand-gradient pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        {/* Left column */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--brand)]">
            Art&iacute;culos Promocionales en M&eacute;xico
          </p>
          <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Regalos que hacen{' '}
            <span className="text-[var(--brand)]">memorable</span> tu marca
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/70">
            M&aacute;s de 1,000 productos promocionales con personalizaci&oacute;n de logo.
            Env&iacute;os a toda la Rep&uacute;blica Mexicana.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/productos"
              className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
            >
              Ver cat&aacute;logo &rarr;
            </Link>
            <Link
              href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cotizaci&oacute;n gratuita
            </Link>
          </div>

          <div className="mt-10 flex gap-8 border-t border-white/10 pt-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — hidden on mobile */}
        <div className="hidden grid-cols-2 gap-4 lg:grid">
          {PREVIEW_CARDS.map((card) => (
            <div
              key={card.name}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm"
            >
              <span className="text-4xl">{card.emoji}</span>
              <p className="mt-3 font-semibold text-white">{card.name}</p>
              <p className="mt-1 text-sm text-white/50">
                Desde ${card.price} MXN
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
