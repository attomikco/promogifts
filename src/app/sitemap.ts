import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/lib/types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://promogifts.com.mx', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://promogifts.com.mx/productos', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://promogifts.com.mx/contacto', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://promogifts.com.mx/nosotros', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://promogifts.com.mx/preguntas-frecuentes', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `https://promogifts.com.mx/productos?cat=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // All published products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_published', true)

  const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `https://promogifts.com.mx/productos/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}
