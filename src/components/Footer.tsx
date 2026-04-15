import Link from 'next/link'
import Image from 'next/image'
import { CATEGORIES } from '@/lib/types'

const FOOTER_CATEGORIES = CATEGORIES.slice(0, 5)

export default function Footer() {
  return (
    <footer className="bg-[var(--black)] text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* Col 1 — Logo */}
        <div>
          <Link href="/">
            <Image src="/logo.jpg" alt="Promo & gifts" width={80} height={60} style={{ width: 80, height: 'auto' }} />
          </Link>
          <p className="mt-4 text-sm leading-relaxed">
            Artículos promocionales y regalos corporativos con
            personalización de logo para empresas en México.
          </p>
        </div>

        {/* Col 2 — Categorías Populares */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Categorías Populares
          </h4>
          <ul className="space-y-2 text-sm">
            {FOOTER_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/productos?cat=${cat.slug}`}
                  className="transition hover:text-white"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Contacto */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Contacto
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="tel:+525556821145" className="transition hover:text-white">
                (+52 55) 5682 1145
              </a>
            </li>
            <li>
              <a href="tel:+525530297582" className="transition hover:text-white">
                (+52 55) 3029 7582
              </a>
            </li>
            <li>
              <a href="mailto:info@promogifts.com.mx" className="transition hover:text-white">
                info@promogifts.com.mx
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4 — Links */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Empresa
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/nosotros" className="transition hover:text-white">Nosotros</Link>
            </li>
            <li>
              <Link href="/productos" className="transition hover:text-white">Productos</Link>
            </li>
            <li>
              <Link href="/preguntas-frecuentes" className="transition hover:text-white">FAQ</Link>
            </li>
            <li>
              <Link href="/contacto" className="transition hover:text-white">Contacto</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} Promogifts, SA de CV. Todos los derechos reservados.</p>
          <p>Sitio diseñado por Attomik</p>
        </div>
      </div>
    </footer>
  )
}
