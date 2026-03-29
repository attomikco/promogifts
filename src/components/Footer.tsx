import Link from 'next/link'
import { CATEGORIES } from '@/lib/types'

const FOOTER_CATEGORIES = CATEGORIES.slice(0, 5)

export default function Footer() {
  return (
    <footer className="bg-[var(--black)] text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* Col 1 — Logo */}
        <div>
          <Link href="/" className="leading-none">
            <span className="block text-sm font-extrabold text-[var(--brand-light)]">
              Promo &amp;
            </span>
            <span
              className="-mt-0.5 block text-xl italic text-white"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              gifts
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed">
            Artículos promocionales y regalos corporativos con
            personalización de logo para empresas en México.
          </p>
        </div>

        {/* Col 2 — Categorías */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Categorías
          </h4>
          <ul className="space-y-2 text-sm">
            {FOOTER_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/productos?cat=${cat.slug}`}
                  className="transition hover:text-white"
                >
                  {cat.emoji} {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Empresa */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Empresa
          </h4>
          <ul className="space-y-2 text-sm">
            {['Nosotros', 'Proceso', 'FAQ', 'Blog', 'Contacto'].map((item) => (
              <li key={item}>
                <Link href="#" className="transition hover:text-white">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Contacto */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Contacto
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="mailto:hola@promogifts.com.mx" className="transition hover:text-white">
                hola@promogifts.com.mx
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/521XXXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                WhatsApp
              </a>
            </li>
            <li>Lun–Vie 9:00 – 18:00</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} Promogifts. Todos los derechos reservados.</p>
          <Link href="#" className="transition hover:text-white">
            Aviso de privacidad
          </Link>
        </div>
      </div>
    </footer>
  )
}
