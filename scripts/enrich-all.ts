import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const API_URL = 'http://localhost:3001/api/enrich'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🤖 Fetching products to enrich...\n')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku')
    .is('ai_enriched_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch products:', error.message)
    return
  }

  if (!products || products.length === 0) {
    console.log('✅ All products are already enriched!')
    return
  }

  console.log(`📋 Found ${products.length} products to enrich\n`)

  let enriched = 0
  const failures: string[] = []

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    console.log(
      `Enriching ${i + 1}/${products.length}: ${product.name} (${product.sku})...`
    )

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data.error || `HTTP ${res.status}`
        console.log(`   ⚠️ Failed: ${msg}`)
        failures.push(`${product.sku}: ${msg}`)
      } else {
        console.log(`   ✅ Done`)
        enriched++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`   ⚠️ Error: ${msg}`)
      failures.push(`${product.sku}: ${msg}`)
    }

    await delay(3000)
  }

  console.log(`\n🎉 Enrichment complete!`)
  console.log(`   ✅ Enriched: ${enriched}/${products.length}`)

  if (failures.length > 0) {
    console.log(`   ❌ Failures: ${failures.length}`)
    failures.forEach((f) => console.log(`      - ${f}`))
  }
}

main().catch(console.error)
