import { config } from 'dotenv'
config({ path: '.env.local' })

import { createReadStream } from 'fs'
import { homedir } from 'os'
import path from 'path'
import { parse } from 'csv-parse'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CSV_PATH = path.join(homedir(), 'Downloads/promogifts-descriptions.csv')
const BATCH_SIZE = 500

type CsvRow = { code: string; description: string; extra: string }
type Cleaned = {
  sku: string
  skuKey: string
  description: string | null
  extra: string | null
}

function cleanText(input: string | undefined | null): string | null {
  if (!input) return null
  const cleaned = input
    .replace(/Ê/g, ' ')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length < 3) return null
  return cleaned
}

async function readCsv(): Promise<CsvRow[]> {
  const rows: CsvRow[] = []
  const parser = createReadStream(CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true, bom: true })
  )
  for await (const r of parser) rows.push(r as CsvRow)
  return rows
}

async function fetchAllProducts(): Promise<
  { sku: string; is_published: boolean | null }[]
> {
  const out: { sku: string; is_published: boolean | null }[] = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('sku, is_published')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Failed to fetch products: ${error.message}`)
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return out
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const apply = process.argv.includes('--apply')

  console.log(`📂 Reading ${CSV_PATH}`)
  const rawRows = await readCsv()
  console.log(`   ${rawRows.length} CSV rows\n`)

  console.log(`🧹 Cleaning rows…`)
  const cleanedRows: Cleaned[] = []
  let blankDescriptions = 0
  for (const r of rawRows) {
    const sku = (r.code || '').trim()
    if (!sku) continue
    const description = cleanText(r.description)
    const extra = cleanText(r.extra)
    if (!description) blankDescriptions++
    cleanedRows.push({
      sku,
      skuKey: sku.toLowerCase(),
      description,
      extra,
    })
  }
  console.log(`   ${cleanedRows.length} rows with SKU`)
  console.log(`   ${blankDescriptions} rows with no usable description\n`)

  console.log(`📦 Loading products from Supabase…`)
  const products = await fetchAllProducts()
  console.log(`   ${products.length} products in DB\n`)

  const skuToPublished = new Map<string, boolean>()
  for (const p of products) {
    skuToPublished.set(p.sku.trim().toLowerCase(), p.is_published === true)
  }

  const matched: Cleaned[] = []
  const unmatched: string[] = []
  for (const row of cleanedRows) {
    if (skuToPublished.has(row.skuKey)) matched.push(row)
    else unmatched.push(row.sku)
  }

  const wouldUpdateDescription = matched.filter((r) => r.description !== null)

  const matchedKeys = new Set(matched.map((r) => r.skuKey))
  const matchedWithDescKeys = new Set(
    wouldUpdateDescription.map((r) => r.skuKey)
  )
  let publishedMissingAfter = 0
  for (const p of products) {
    if (p.is_published !== true) continue
    const key = p.sku.trim().toLowerCase()
    if (!matchedKeys.has(key) || !matchedWithDescKeys.has(key)) {
      publishedMissingAfter++
    }
  }

  console.log(`=============================`)
  console.log(`📊 Dry-run summary`)
  console.log(`=============================`)
  console.log(`Total CSV rows                    : ${rawRows.length}`)
  console.log(`CSV rows with SKU                 : ${cleanedRows.length}`)
  console.log(`Matched a product by SKU          : ${matched.length}`)
  console.log(`Unmatched CSV codes               : ${unmatched.length}`)
  console.log(`Would set a description           : ${wouldUpdateDescription.length}`)
  console.log(
    `Published products missing desc after: ${publishedMissingAfter} / 3238`
  )

  if (unmatched.length > 0) {
    console.log(`\nFirst ${Math.min(20, unmatched.length)} unmatched codes:`)
    for (const code of unmatched.slice(0, 20)) console.log(`   - ${code}`)
  }
  console.log()

  if (!apply) {
    console.log(`(Dry run. Re-run with --apply to write changes.)`)
    return
  }

  console.log(`✍️  Applying updates in batches of ${BATCH_SIZE}…\n`)
  let updated = 0
  const failures: string[] = []

  for (const [i, batch] of chunk(matched, BATCH_SIZE).entries()) {
    const results = await Promise.all(
      batch.map((row) =>
        supabase
          .from('products')
          .update({ description: row.description, extra: row.extra })
          .eq('sku', row.sku)
          .select('sku')
      )
    )
    for (const [j, res] of results.entries()) {
      if (res.error) {
        failures.push(`${batch[j].sku}: ${res.error.message}`)
      } else if (!res.data || res.data.length === 0) {
        // Fallback: SKU may differ in case/whitespace; try case-insensitive
        const row = batch[j]
        const { data, error } = await supabase
          .from('products')
          .update({ description: row.description, extra: row.extra })
          .ilike('sku', row.sku)
          .select('sku')
        if (error) failures.push(`${row.sku}: ${error.message}`)
        else if (!data || data.length === 0)
          failures.push(`${row.sku}: no row matched`)
        else updated += data.length
      } else {
        updated += res.data.length
      }
    }
    console.log(
      `   batch ${i + 1}: ${updated} updated so far (${failures.length} failures)`
    )
  }

  console.log(`\n🔁 Verifying published-coverage from DB…`)
  const { count: missingAfter, error: missingErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .is('description', null)
  if (missingErr) console.log(`   ⚠️ verification failed: ${missingErr.message}`)

  console.log(`\n=============================`)
  console.log(`✅ Final report`)
  console.log(`=============================`)
  console.log(`Rows updated                          : ${updated}`)
  console.log(`Published products still missing desc : ${missingAfter ?? '?'}`)
  console.log(`Errors                                : ${failures.length}`)
  if (failures.length > 0) {
    console.log(`\nFirst ${Math.min(20, failures.length)} errors:`)
    for (const f of failures.slice(0, 20)) console.log(`   - ${f}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
