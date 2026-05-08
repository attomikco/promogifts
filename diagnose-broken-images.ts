// diagnose-broken-images.ts
// Run with: npx tsx diagnose-broken-images.ts
//
// Scans every product's image_url, checks if it returns 200,
// and groups failures by reason so you know exactly what to fix.

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Product = {
  id: string
  slug: string
  name: string
  images: string[] | null
  is_published: boolean
}

type Result = {
  id: string
  slug: string
  name: string
  url: string | null
  status: number | string
  reason: string
  is_published: boolean
  image_count: number
}

async function checkUrl(url: string): Promise<{ status: number | string; reason: string }> {
  if (!url) return { status: 'EMPTY', reason: 'No URL in DB' }

  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok) return { status: res.status, reason: 'OK' }

    // Categorize failure
    let reason = `HTTP ${res.status}`
    if (res.status === 404) {
      if (url.includes('supabase')) reason = 'Supabase: file missing in bucket'
      else if (url.match(/\d+\.\d+\.\d+\.\d+/)) reason = 'Old WordPress IP (server down or moved)'
      else reason = 'Source server returned 404'
    } else if (res.status === 403) {
      reason = url.includes('supabase')
        ? 'Supabase: bucket not public OR object private'
        : 'Source forbidden'
    } else if (res.status >= 500) {
      reason = 'Source server error'
    }
    return { status: res.status, reason }
  } catch (err: any) {
    return { status: 'NETWORK', reason: `Fetch failed: ${err.message}` }
  }
}

async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = []
  const pageSize = 1000
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, name, images, is_published')
      .order('name')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as Product[]))
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

async function main() {
  console.log('Fetching all products...')
  const products = await fetchAllProducts()

  console.log(`Checking ${products.length} products (only first image per product)...\n`)

  const results: Result[] = []
  const concurrency = 10
  for (let i = 0; i < products.length; i += concurrency) {
    const batch = products.slice(i, i + concurrency)
    const checked = await Promise.all(
      batch.map(async (p) => {
        const firstImage = p.images?.[0] ?? ''
        const { status, reason } = await checkUrl(firstImage)
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          url: firstImage || null,
          status,
          reason,
          is_published: p.is_published,
          image_count: p.images?.length ?? 0,
        } as Result
      })
    )
    results.push(...checked)
    process.stdout.write(`\rChecked ${Math.min(i + concurrency, products.length)}/${products.length}`)
  }
  console.log('\n')

  // Group by reason
  const broken = results.filter((r) => r.reason !== 'OK')
  const grouped: Record<string, Result[]> = {}
  for (const r of broken) {
    grouped[r.reason] = grouped[r.reason] || []
    grouped[r.reason].push(r)
  }

  console.log('=== SUMMARY ===')
  console.log(`Total products:  ${results.length}`)
  console.log(`Working images:  ${results.length - broken.length}`)
  console.log(`Broken images:   ${broken.length}\n`)

  console.log('=== BREAKDOWN BY REASON ===')
  for (const [reason, items] of Object.entries(grouped).sort(
    (a, b) => b[1].length - a[1].length
  )) {
    console.log(`\n[${items.length}]  ${reason}`)
    items.slice(0, 5).forEach((r) => {
      console.log(`   - ${r.name} (${r.slug})`)
      console.log(`     ${r.url ?? '(null)'}`)
    })
    if (items.length > 5) console.log(`   ...and ${items.length - 5} more`)
  }

  // Write full list to file for follow-up
  const fs = await import('fs/promises')
  await fs.writeFile(
    'broken-images-report.json',
    JSON.stringify(broken, null, 2)
  )
  console.log('\nFull report written to broken-images-report.json')
}

main()
