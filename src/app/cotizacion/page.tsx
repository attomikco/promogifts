import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Breadcrumbs from '@/components/Breadcrumbs'
import CotizacionClient from '@/components/CotizacionClient'

export const metadata: Metadata = {
  title: 'Mi cotización',
  robots: { index: false, follow: false },
}

export default function CotizacionPage() {
  return (
    <>
      <Nav />
      <Breadcrumbs
        items={[{ label: 'Inicio', href: '/' }, { label: 'Mi cotización' }]}
      />
      <main className="flex-1">
        <CotizacionClient />
      </main>
      <Footer />
    </>
  )
}
