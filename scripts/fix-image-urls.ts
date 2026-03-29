import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const BUCKET = 'products'
const CHUNK_SIZE = 500

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildStorageUrl(oldUrl: string): string | null {
  if (!oldUrl) return null

  const filename = oldUrl.split('/').pop()
  if (!filename) return null

  let storagePath: string

  if (oldUrl.includes('promogifts.com.mx/media') || oldUrl.startsWith('images/')) {
    storagePath = `images/${filename}`
  } else if (oldUrl.includes('107.170.248.90') || oldUrl.includes('/wp-content/uploads/')) {
    storagePath = `wp/${filename}`
  } else {
    return null
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

async function fetchAllProducts() {
  const all: { id: string; name: string; sku: string; images: string[] }[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, images')
      .range(from, from + CHUNK_SIZE - 1)

    if (error) {
      console.log(`❌ Fetch error at offset ${from}: ${error.message}`)
      break
    }

    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < CHUNK_SIZE) break
    from += CHUNK_SIZE
  }

  return all
}

async function main() {
  console.log('🔧 Fixing product image URLs...\n')

  const products = await fetchAllProducts()
  console.log(`📋 Found ${products.length} products\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const images = product.images as string[] | null

    if (!images || images.length === 0 || !images[0]) {
      skipped++
      continue
    }

    const oldUrl = images[0]

    // Already pointing to Supabase Storage
    if (oldUrl.includes('supabase.co')) {
      skipped++
      continue
    }

    const newUrl = buildStorageUrl(oldUrl)
    if (!newUrl) {
      console.log(`[${i + 1}/${products.length}] ⚠️ Unknown URL format: ${oldUrl} (${product.sku})`)
      skipped++
      continue
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ images: [newUrl] })
        .eq('id', product.id)

      if (error) {
        console.log(`[${i + 1}/${products.length}] ❌ DB error for ${product.sku}: ${error.message}`)
        errors++
      } else {
        console.log(`[${i + 1}/${products.length}] ✅ Updated: ${product.name} (${product.sku})`)
        updated++
      }
    } catch (err) {
      console.log(`[${i + 1}/${products.length}] ❌ Error: ${err instanceof Error ? err.message : err}`)
      errors++
    }

    await delay(50)
  }

  console.log(`\n=============================`)
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️ Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`=============================`)
}

main().catch(console.error)
