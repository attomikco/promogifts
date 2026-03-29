export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--brand)]" style={{ minHeight: 420 }}>
      {/* Particle network background */}
      <div className="hero-particles pointer-events-none absolute inset-0" />
      <div className="brand-gradient pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <h1 className="text-5xl leading-tight text-white sm:text-6xl lg:text-7xl">
          <span className="font-light">Promogifts</span>
          <br />
          <span className="font-bold">Promocionales</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
          Artículos Promocionales y Regalos para Empresas en México
        </p>
      </div>
    </section>
  )
}
