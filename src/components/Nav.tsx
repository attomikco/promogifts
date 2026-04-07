'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--light)]/60 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/">
          <Image src="/logo.jpg" alt="Promo & gifts" width={80} height={60} style={{ width: 80, height: 'auto' }} />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-[var(--mid)] md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[var(--black)]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* CTA — hidden on mobile when menu is open */}
          <Link
            href="https://wa.me/525530297582?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] sm:inline-block"
          >
            Contacto
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--mid)] transition hover:bg-[var(--pale)] md:hidden"
            aria-label="Menú"
          >
            {open ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[var(--light)]/40 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--black)] transition hover:bg-[var(--pale)]"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://wa.me/525530297582?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
