import Link from 'next/link'
import { CATEGORIES } from '@/lib/types'

const NAV_CATEGORIES = CATEGORIES.slice(0, 4)

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--light)]/40 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-[var(--brand)]">PROMO</span>
          <span className="text-[var(--black)]">GIFTS</span>
        </Link>

        {/* Center links — hidden on mobile */}
        <div className="hidden items-center gap-6 text-sm font-medium text-[var(--mid)] md:flex">
          <Link href="/productos" className="transition hover:text-[var(--black)]">
            Productos
          </Link>
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/productos?cat=${cat.slug}`}
              className="transition hover:text-[var(--black)]"
            >
              {cat.emoji} {cat.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/productos"
            className="hidden text-sm font-medium text-[var(--mid)] transition hover:text-[var(--black)] sm:block"
          >
            Buscar
          </Link>
          <Link
            href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
          >
            Cotizar gratis
          </Link>
        </div>
      </div>
    </nav>
  )
}
