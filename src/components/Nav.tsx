import Link from 'next/link'

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`leading-none ${className ?? ''}`}>
      <span className="block text-sm font-extrabold text-[var(--brand)]">
        Promo &amp;
      </span>
      <span
        className="block -mt-0.5 text-xl italic text-[var(--brand-light)]"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        gifts
      </span>
    </Link>
  )
}

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--light)]/60 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        {/* Center links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-[var(--mid)] md:flex">
          <Link href="/" className="transition hover:text-[var(--black)]">
            Inicio
          </Link>
          <Link href="/productos" className="flex items-center gap-1 transition hover:text-[var(--black)]">
            Productos
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/productos?featured=true" className="transition hover:text-[var(--black)]">
            Destacado
          </Link>
          <Link href="/productos" className="transition hover:text-[var(--black)]">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5L17 17" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* Right */}
        <Link
          href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
        >
          Contacto
        </Link>
      </div>
    </nav>
  )
}
