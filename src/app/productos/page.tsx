import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Breadcrumbs from '@/components/Breadcrumbs'
import ProductCatalog from '@/components/ProductCatalog'
import Footer from '@/components/Footer'
import { CATEGORIES } from '@/lib/types'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>
}): Promise<Metadata> {
  const { cat, q } = await searchParams
  const activeCategory = CATEGORIES.find((c) => c.slug === cat)

  if (activeCategory) {
    return {
      title: `${activeCategory.label} Personalizados | Artículos Promocionales`,
      description: `Explora nuestra colección de ${activeCategory.label.toLowerCase()} promocionales personalizados con tu logo. Precios desde mayoreo, envíos a todo México. Cotiza gratis.`,
      alternates: {
        canonical: `https://promogifts.com.mx/productos?cat=${cat}`,
      },
    }
  }

  if (q) {
    return {
      title: `Resultados para "${q}" | Artículos Promocionales`,
      description: `Resultados de búsqueda para "${q}" en nuestro catálogo de artículos promocionales. Más de 1,000 productos con personalización de logo.`,
    }
  }

  return {
    title: 'Catálogo de Artículos Promocionales',
    description:
      'Explora nuestro catálogo completo de artículos promocionales: termos, bolsas, plumas, tecnología y más. Personalización de logo y envíos a todo México.',
    alternates: {
      canonical: 'https://promogifts.com.mx/productos',
    },
  }
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>
}) {
  const { cat, q } = await searchParams
  const activeCategory = CATEGORIES.find((c) => c.slug === cat)

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: activeCategory ? '/productos' : undefined },
    ...(activeCategory ? [{ label: activeCategory.label }] : []),
  ]

  return (
    <>
      <Nav />
      <Breadcrumbs items={breadcrumbs} />

      <main className="flex-1">
        <ProductCatalog initialCategory={cat} initialQuery={q} />
      </main>

      <Footer />
    </>
  )
}
