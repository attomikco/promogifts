// Run first: npx playwright install chromium

import { config } from 'dotenv'
config({ path: '.env.local' })

import { readFileSync, writeFileSync } from 'fs'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PROGRESS_FILE = 'scripts/progress.json'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Cache-Control': 'max-age=0',
}

// --- Progress tracking ---

function loadProgress(): Set<string> {
  try {
    const data = readFileSync(PROGRESS_FILE, 'utf-8')
    const skus: string[] = JSON.parse(data)
    return new Set(skus)
  } catch {
    return new Set()
  }
}

function saveProgress(savedSkus: Set<string>) {
  writeFileSync(PROGRESS_FILE, JSON.stringify([...savedSkus], null, 2))
}

// --- Category mapping ---

const CATEGORIES_TO_SCRAPE = [
  'accesorios',
  'articulos-de-piel',
  'articulos-nuevos',
  'bar',
  'boligrafos-de-plastico',
  'boligrafos-touch-pad',
  'boligrafos-y-plumas-elite',
  'decoracion',
  'deportes',
  'electronicos',
  'encendedores',
  'escritura',
  'golf',
  'gorras',
  'herramientas',
  'hogar',
  'juegos',
  'llaveros',
  'mochilas-y-maletas',
  'mundial',
  'oficina-y-escritorio',
  'productos-temporada-navidad',
  'reconocimientos-y-trofeos',
  'relojes',
  'salud-belleza',
  'sol-y-lluvia',
  'tazas-termos-y-cilindros',
  'textiles',
]

const CATEGORY_MAP: Record<string, string> = {
  'boligrafos-de-plastico': 'escritura',
  'boligrafos-touch-pad': 'escritura',
  'boligrafos-y-plumas-elite': 'escritura',
  escritura: 'escritura',
  'tazas-termos-y-cilindros': 'bebidas',
  electronicos: 'tecnologia',
  'mochilas-y-maletas': 'bolsas',
  'oficina-y-escritorio': 'oficina',
  llaveros: 'llaveros',
  'productos-temporada-navidad': 'navidad',
  decoracion: 'decoracion',
  'sol-y-lluvia': 'paraguas',
  accesorios: 'accesorios',
  'articulos-nuevos': 'accesorios',
  'articulos-de-piel': 'piel',
  bar: 'bar',
  deportes: 'deportes',
  encendedores: 'accesorios',
  golf: 'golf',
  gorras: 'gorras',
  herramientas: 'herramientas',
  hogar: 'hogar',
  juegos: 'juegos',
  mundial: 'mundial',
  'reconocimientos-y-trofeos': 'trofeos',
  relojes: 'relojes',
  'salud-belleza': 'salud',
  textiles: 'textiles',
}

// --- Helpers ---

function cleanText(str: string): string {
  return str
    .replace(/[êÊ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*codigo\s*-?\s*[A-Z0-9]+\s*$/i, '')
}

function generateSlug(name: string, sku: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const skuPart = sku.toLowerCase().replace(/[^a-z0-9]/g, '')
  return skuPart ? `${base}-${skuPart}` : base
}

function parsePrice(str: string): number {
  const match = str.replace(/,/g, '').match(/\$?([\d.]+)/)
  if (!match) return 0
  const val = parseFloat(match[1])
  return isNaN(val) ? 0 : val
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay(min: number, max: number): Promise<void> {
  return delay(Math.random() * (max - min) + min)
}

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<Response | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (res.ok) return res
      console.log(
        `⚠️ HTTP ${res.status} for ${url} (attempt ${attempt}/${retries})`
      )
    } catch (err) {
      console.log(
        `⚠️ Fetch error for ${url} (attempt ${attempt}/${retries}): ${
          err instanceof Error ? err.message : err
        }`
      )
    }
    if (attempt < retries) {
      console.log(`   Retrying in 10s...`)
      await delay(10000)
    }
  }
  return null
}

// --- Scrape categories with Playwright ---

async function scrapeCategories(): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>()

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  for (const cat of CATEGORIES_TO_SCRAPE) {
    const url = `https://promogifts.com.mx/productos/${cat}/`
    console.log(`📂 Scraping category: ${cat}...`)

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page
        .waitForSelector('a[href*="/producto/"]', { timeout: 15000 })
        .catch(() => {
          // Some categories might be empty
        })

      const links = await page.$$eval('a[href*="/producto/"]', (anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter(Boolean)
      )

      let count = 0
      for (const link of links) {
        if (!link) continue
        const fullUrl = link.startsWith('http')
          ? link
          : `https://promogifts.com.mx${link}`

        if (!urlMap.has(fullUrl)) {
          urlMap.set(fullUrl, cat)
          count++
        }
      }
      console.log(`   Found ${count} new product URLs (${links.length} total links)`)
    } catch (err) {
      console.log(
        `⚠️ Error scraping category ${cat}: ${err instanceof Error ? err.message : err}`
      )
    }

    await randomDelay(8000, 12000)
  }

  await browser.close()
  return urlMap
}

// --- Scrape individual product pages ---

interface ProductData {
  sku: string
  name: string
  slug: string
  category: string
  price: number
  min_qty: number
  images: string[]
  colors: string[]
  ai_keywords: string[]
  ai_use_cases: string[]
  ai_selling_points: string[]
  is_published: boolean
  is_featured: boolean
}

async function scrapeProduct(
  url: string,
  sourceCategory: string
): Promise<ProductData | null> {
  const res = await fetchWithRetry(url)
  if (!res) {
    console.log(`⚠️ Skipped: ${url} - all retries failed`)
    return null
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  // SKU
  const sku = ($('#code').val() as string)?.trim()
  if (!sku) {
    console.log(`⚠️ Skipped: ${url} - no SKU found`)
    return null
  }

  // Name
  const h1 = $('h1').first()
  h1.find('small').remove()
  const name = cleanText(h1.text())

  if (!name) {
    console.log(`⚠️ Skipped: ${url} - no name found`)
    return null
  }

  // Price
  const priceText = $('.d-block.h3.mb-2').first().text()
  const price = parsePrice(priceText)
  if (price === 0) {
    console.log(`⚠️ Warning: ${name} (${sku}) - price is $0`)
  }

  // Image
  const images: string[] = []
  $('img[src*="/wp-content/uploads/"]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) {
      const fullSrc = src.startsWith('http')
        ? src
        : `https://promogifts.com.mx${src}`
      if (!images.includes(fullSrc)) {
        images.push(fullSrc)
      }
    }
  })

  // Category mapping
  const category = CATEGORY_MAP[sourceCategory] || sourceCategory

  // Slug
  const slug = generateSlug(name, sku)

  return {
    sku,
    name,
    slug,
    category,
    price,
    min_qty: 100,
    images,
    colors: [],
    ai_keywords: [],
    ai_use_cases: [],
    ai_selling_points: [],
    is_published: false,
    is_featured: false,
  }
}

// --- Main ---

async function main() {
  console.log('🚀 Starting Promogifts scraper...\n')

  const savedSkus = loadProgress()
  if (savedSkus.size > 0) {
    console.log(`📌 Resuming — ${savedSkus.size} SKUs already saved\n`)
  }

  // Step 1: Collect product URLs from categories
  const urlMap = await scrapeCategories()
  console.log(`\n📋 Total unique product URLs: ${urlMap.size}\n`)

  // Step 2: Scrape each product page in batches
  let saved = 0
  let skipped = 0
  const entries = Array.from(urlMap.entries())
  const BATCH_SIZE = 10

  for (let batch = 0; batch < entries.length; batch += BATCH_SIZE) {
    const batchEntries = entries.slice(batch, batch + BATCH_SIZE)
    const batchNum = Math.floor(batch / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(entries.length / BATCH_SIZE)
    console.log(`\n--- Batch ${batchNum}/${totalBatches} ---`)

    for (let i = 0; i < batchEntries.length; i++) {
      const [url, sourceCategory] = batchEntries[i]
      const globalIndex = batch + i + 1
      console.log(`[${globalIndex}/${entries.length}] Fetching: ${url}`)

      try {
        const product = await scrapeProduct(url, sourceCategory)

        if (!product) {
          skipped++
          await randomDelay(3000, 6000)
          continue
        }

        // Skip if already saved in a previous run
        if (savedSkus.has(product.sku)) {
          console.log(`⏭️ Already saved: ${product.name} (${product.sku})`)
          saved++
          await randomDelay(3000, 6000)
          continue
        }

        const { error } = await supabase
          .from('products')
          .upsert(product, { onConflict: 'sku' })

        if (error) {
          console.log(`⚠️ DB error for ${product.sku}: ${error.message}`)
          skipped++
        } else {
          console.log(`✅ Saved: ${product.name} (${product.sku})`)
          savedSkus.add(product.sku)
          saveProgress(savedSkus)
          saved++
        }
      } catch (err) {
        console.log(
          `⚠️ Skipped: ${url} - ${err instanceof Error ? err.message : err}`
        )
        skipped++
      }

      await randomDelay(3000, 6000)
    }

    // Pause between batches (unless last batch)
    if (batch + BATCH_SIZE < entries.length) {
      console.log(`⏸️ Batch done. Pausing 15s...`)
      await delay(15000)
    }
  }

  console.log(
    `\n🎉 Done! ${entries.length} products scraped, ${saved} saved, ${skipped} skipped`
  )
}

main().catch(console.error)
