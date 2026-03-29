export type Product = {
  id: string
  sku: string
  name: string
  slug: string
  category: string
  price: number
  min_qty: number
  dimensions?: string
  material?: string
  colors: string[]
  images: string[]
  ai_description?: string
  ai_short_desc?: string
  ai_meta_title?: string
  ai_meta_desc?: string
  ai_keywords: string[]
  ai_use_cases: string[]
  ai_selling_points: string[]
  ai_enriched_at?: string
  is_published: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export const CATEGORIES = [
  { slug: 'bebidas', label: 'Bebidas', emoji: '\u2615' },
  { slug: 'escritura', label: 'Escritura', emoji: '\u270F\uFE0F' },
  { slug: 'tecnologia', label: 'Tecnolog\u00EDa', emoji: '\uD83D\uDCA1' },
  { slug: 'bolsas', label: 'Bolsas', emoji: '\uD83C\uDF92' },
  { slug: 'oficina', label: 'Oficina', emoji: '\uD83D\uDCD3' },
  { slug: 'llaveros', label: 'Llaveros', emoji: '\uD83D\uDDDD\uFE0F' },
  { slug: 'sets', label: 'Sets', emoji: '\uD83C\uDF81' },
  { slug: 'navidad', label: 'Navidad', emoji: '\uD83C\uDF84' },
  { slug: 'paraguas', label: 'Paraguas', emoji: '\u2602\uFE0F' },
  { slug: 'decoracion', label: 'Decoraci\u00F3n', emoji: '\uD83D\uDDBC\uFE0F' },
] as const
