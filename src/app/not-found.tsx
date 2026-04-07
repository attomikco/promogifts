import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <p className="text-6xl">&#128270;</p>
        <h1 className="mt-6 text-3xl font-bold text-[var(--black)]">
          Página no encontrada
        </h1>
        <p className="mt-3 max-w-md text-center text-[var(--mid)]">
          Lo sentimos, no pudimos encontrar la página que buscas.
          Es posible que haya sido movida o que la URL sea incorrecta.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
          >
            Ir al inicio
          </Link>
          <Link
            href="/productos"
            className="rounded-full border border-[var(--brand)] px-6 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-pale)]"
          >
            Ver productos
          </Link>
          <Link
            href="/contacto"
            className="rounded-full border border-[var(--light)] px-6 py-3 text-sm font-semibold text-[var(--mid)] transition hover:bg-[var(--pale)]"
          >
            Contacto
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
