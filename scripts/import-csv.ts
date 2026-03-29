import { config } from 'dotenv'
config({ path: '.env.local' })

import { createReadStream, readFileSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PROGRESS_FILE = 'scripts/import-progress.json'

// --- Progress tracking ---

function loadProgress(): Set<string> {
  try {
    const data = readFileSync(PROGRESS_FILE, 'utf-8')
    return new Set(JSON.parse(data) as string[])
  } catch {
    return new Set()
  }
}

function saveProgress(skus: Set<string>) {
  writeFileSync(PROGRESS_FILE, JSON.stringify([...skus], null, 2))
}

// --- Category mapping ---

const TAG_TO_CATEGORY: [string[], string][] = [
  [['tazas-termos-y-cilindros'], 'bebidas'],
  [['boligrafos-de-plastico', 'boligrafos-touch-pad', 'boligrafos-y-plumas-elite', 'escritura'], 'escritura'],
  [['electronicos'], 'tecnologia'],
  [['mochilas-y-maletas'], 'bolsas'],
  [['oficina-y-escritorio'], 'oficina'],
  [['llaveros'], 'llaveros'],
  [['productos-temporada-navidad'], 'navidad'],
  [['decoracion'], 'decoracion'],
  [['sol-y-lluvia'], 'paraguas'],
  [['golf'], 'golf'],
  [['gorras'], 'gorras'],
  [['herramientas'], 'herramientas'],
  [['hogar'], 'hogar'],
  [['juegos'], 'juegos'],
  [['relojes'], 'relojes'],
  [['textiles'], 'textiles'],
  [['deportes'], 'deportes'],
  [['bar'], 'bar'],
  [['articulos-de-piel'], 'piel'],
  [['reconocimientos-y-trofeos'], 'trofeos'],
  [['salud-belleza'], 'salud'],
  [['accesorios', 'articulos-nuevos'], 'accesorios'],
  [['mundial'], 'mundial'],
]

function mapCategory(tagsRaw: string): string {
  const tags = tagsRaw
    .replace(/^\{|\}$/g, '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  for (const [slugs, category] of TAG_TO_CATEGORY) {
    for (const tag of tags) {
      if (slugs.includes(tag)) return category
    }
  }
  return 'otros'
}

// --- Text cleaning ---

function cleanText(str: string): string {
  return str
    .replace(/[êÊ]/g, '')
    .replace(/â€[^\s]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[Cc]odigo\s*-?\s*[A-Z0-9]+\s*$/i, '')
    .trim()
}

function cleanName(str: string): string {
  const cleaned = cleanText(str)
  return cleaned
    .split(/\s+/)
    .map((word) => {
      // Keep all-caps product codes as-is (e.g. PG299)
      if (/^[A-Z0-9]+$/.test(word) && word.length >= 2) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

// --- Slug generation ---

function generateSlug(name: string, sku: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const skuPart = sku.toLowerCase()
  const slug = skuPart ? `${base}-${skuPart}` : base
  return slug.slice(0, 200)
}

// --- Price parsing from extra HTML ---

function parsePriceFromExtra(extra: string): number | null {
  if (!extra) return null
  // Find all MXN prices in the HTML
  const prices: number[] = []
  const regex = /\$([\d,.]+)\s*MXN/g
  let match
  while ((match = regex.exec(extra)) !== null) {
    const val = parseFloat(match[1].replace(/,/g, ''))
    if (!isNaN(val) && val > 0) prices.push(val)
  }
  // Return the lowest price (highest quantity tier)
  if (prices.length === 0) return null
  return Math.min(...prices)
}

// --- Image URL ---

function buildImageUrl(image: string, imageUrl: string): string {
  if (image && image.trim()) {
    return `https://promogifts.com.mx/media/${image.trim()}`
  }
  if (imageUrl && imageUrl.trim()) {
    return imageUrl.trim()
  }
  return ''
}

// --- Helpers ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- Main ---

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npm run import-csv -- <path-to-csv>')
    process.exit(1)
  }

  console.log(`📂 Reading CSV: ${csvPath}\n`)

  const savedSkus = loadProgress()
  if (savedSkus.size > 0) {
    console.log(`📌 Resuming — ${savedSkus.size} SKUs already imported\n`)
  }

  // Read all records first
  const records: Record<string, string>[] = []
  const parser = createReadStream(csvPath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  )
  for await (const record of parser) {
    records.push(record)
  }

  console.log(`📋 Found ${records.length} rows in CSV\n`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < records.length; i++) {
    const row = records[i]
    const sku = (row.code || '').trim()

    if (!sku) {
      console.log(`[${i + 1}/${records.length}] ⚠️ Skipped: no SKU`)
      skipped++
      continue
    }

    if (savedSkus.has(sku)) {
      skipped++
      continue
    }

    const name = cleanName(row.title || '')
    if (!name) {
      console.log(`[${i + 1}/${records.length}] ⚠️ Skipped: ${sku} - no name`)
      skipped++
      continue
    }

    const slug = generateSlug(name, sku)
    const category = mapCategory(row.tags || '')

    // Price: try extra field first, fall back to price column
    const extraPrice = parsePriceFromExtra(row.extra || '')
    const basePrice = parseFloat((row.price || '0').replace(/,/g, ''))
    const price = extraPrice ?? (isNaN(basePrice) ? 0 : basePrice)

    const imageUrl = buildImageUrl(row.image || '', row.image_url || '')

    const isFeatured = (row.featured || '').trim().toLowerCase() === 't'

    console.log(`[${i + 1}/${records.length}] Importing: ${name} (${sku})`)

    try {
      const { error } = await supabase.from('products').upsert(
        {
          sku,
          name,
          slug,
          category,
          price,
          images: imageUrl ? [imageUrl] : [],
          is_published: false,
          is_featured: isFeatured,
          ai_enriched_at: null,
          ai_description: null,
          ai_short_desc: null,
        },
        { onConflict: 'sku' }
      )

      if (error) {
        console.log(`   ❌ DB error: ${error.message}`)
        errors++
      } else {
        imported++
        savedSkus.add(sku)
        // Save progress every 50 products
        if (imported % 50 === 0) {
          saveProgress(savedSkus)
          console.log(`   💾 Progress saved (${savedSkus.size} SKUs)`)
        }
      }
    } catch (err) {
      console.log(
        `   ❌ Error: ${err instanceof Error ? err.message : err}`
      )
      errors++
    }

    await delay(50)
  }

  // Final save
  saveProgress(savedSkus)

  // Get total count from DB
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  console.log(`\n=============================`)
  console.log(`✅ Imported: ${imported}`)
  console.log(`⚠️ Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📦 Total in DB: ${count ?? 'unknown'}`)
  console.log(`=============================`)
}

main().catch(console.error)
