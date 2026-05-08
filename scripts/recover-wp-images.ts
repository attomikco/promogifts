// scripts/recover-wp-images.ts
// Re-fetches missing images from the legacy WordPress server (107.170.248.90)
// and uploads them to Supabase Storage at products/wp/<filename>.
//
// IMPORTANT: legacy files are not at <base>/<filename>; they are nested under
// /wp-content/uploads/YYYY/MM/<filename>. So Phase 1 builds a filename->URL
// index by crawling each month directory once (cached to disk for resumability).
// Phase 2 then resolves each broken filename to its real URL, downloads it,
// and uploads to Supabase Storage.
//
// Run:           npx tsx scripts/recover-wp-images.ts
// Dry run:       npx tsx scripts/recover-wp-images.ts --dry-run
// Refresh index: npx tsx scripts/recover-wp-images.ts --refresh-index

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs/promises'

dotenv.config({ path: '.env.local' })

const DRY_RUN = process.argv.includes('--dry-run')
const REFRESH_INDEX = process.argv.includes('--refresh-index')
const CONCURRENCY = 5
const LEGACY_BASE = 'http://107.170.248.90/wp-content/uploads'
const BUCKET = 'products'
const STORAGE_PREFIX = 'wp'
const REPORT_PATH = 'broken-images-report.json'
const FAIL_LOG = 'recover-wp-images-failures.json'
const INDEX_CACHE = 'scripts/wp-legacy-index.json'
const YEARS = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type BrokenEntry = {
  id: string
  slug: string
  name: string
  url: string | null
  status: number | string
  reason: string
}

type Outcome =
  | { ok: true; filename: string; bytes: number; skipped: 'exists' | 'dry-run' | null }
  | { ok: false; filename: string; stage: 'parse' | 'index' | 'fetch' | 'upload'; error: string; httpStatus?: number }

function extractFilename(url: string): string | null {
  const m = url.match(/\/wp\/([^/?#]+)$/)
  return m ? decodeURIComponent(m[1]) : null
}

// Phase 1 — Build the filename -> URL index by crawling each YYYY/MM/.
// Apache mod_autoindex returns an HTML listing; we extract href="<file>".
async function fetchListing(year: number, month: string): Promise<string[]> {
  const url = `${LEGACY_BASE}/${year}/${month}/`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return []
    const html = await res.text()
    // Match all href values; skip anchors that contain a slash (subdirs/parent links)
    const matches = [...html.matchAll(/href="([^"?]+)"/g)]
      .map((m) => m[1])
      .filter((h) => !h.includes('/') && /\.(jpe?g|png|gif|webp)$/i.test(h))
    return matches
  } catch {
    return []
  }
}

async function buildIndex(): Promise<Record<string, string>> {
  const index: Record<string, string> = {}
  let dupes = 0
  let monthsDone = 0
  const total = YEARS.length * MONTHS.length

  for (const year of YEARS) {
    // Crawl months for this year in parallel (12 concurrent listings)
    const lists = await Promise.all(MONTHS.map((m) => fetchListing(year, m).then((files) => ({ m, files }))))
    for (const { m, files } of lists) {
      monthsDone++
      for (const f of files) {
        // Skip WP-generated thumbnails like FOO-150x150.jpg, keep the original FOO.jpg
        if (/-\d+x\d+\.[a-z]+$/i.test(f)) continue
        if (index[f]) {
          dupes++
          continue // keep first occurrence
        }
        index[f] = `${LEGACY_BASE}/${year}/${m}/${f}`
      }
    }
    process.stdout.write(`\rIndexing… ${monthsDone}/${total} months, ${Object.keys(index).length} files, ${dupes} dupes`)
  }
  console.log('')
  return index
}

async function loadOrBuildIndex(): Promise<Record<string, string>> {
  if (!REFRESH_INDEX) {
    try {
      const cached = await fs.readFile(INDEX_CACHE, 'utf-8')
      const idx = JSON.parse(cached) as Record<string, string>
      console.log(`Loaded cached legacy index: ${Object.keys(idx).length} files`)
      return idx
    } catch {
      // fall through to build
    }
  }
  console.log('Building legacy URL index (one-time crawl of /YYYY/MM/)…')
  const idx = await buildIndex()
  await fs.writeFile(INDEX_CACHE, JSON.stringify(idx, null, 2))
  console.log(`Cached legacy index → ${INDEX_CACHE} (${Object.keys(idx).length} files)`)
  return idx
}

// Phase 2 — Existence check, fetch, upload.
async function existsInBucket(filename: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(STORAGE_PREFIX, { search: filename, limit: 1 })
  if (error) return false
  return !!data?.some((f) => f.name === filename)
}

async function fetchLegacy(url: string): Promise<{ buf: Buffer; contentType: string } | { error: string; httpStatus?: number }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) return { error: `HTTP ${res.status}`, httpStatus: res.status }
    const ct = res.headers.get('content-type') || 'image/jpeg'
    const ab = await res.arrayBuffer()
    return { buf: Buffer.from(ab), contentType: ct }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'fetch threw' }
  }
}

async function uploadOne(filename: string, buf: Buffer, contentType: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${STORAGE_PREFIX}/${filename}`, buf, {
      contentType,
      upsert: false,
      cacheControl: '31536000',
    })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function processOne(entry: BrokenEntry, index: Record<string, string>): Promise<Outcome> {
  if (!entry.url) return { ok: false, filename: '(null)', stage: 'parse', error: 'no url' }
  const filename = extractFilename(entry.url)
  if (!filename) return { ok: false, filename: entry.url, stage: 'parse', error: 'could not extract filename' }

  if (await existsInBucket(filename)) {
    return { ok: true, filename, bytes: 0, skipped: 'exists' }
  }

  const legacyUrl = index[filename]
  if (!legacyUrl) {
    return { ok: false, filename, stage: 'index', error: 'not found on legacy server' }
  }

  if (DRY_RUN) {
    return { ok: true, filename, bytes: 0, skipped: 'dry-run' }
  }

  const fetched = await fetchLegacy(legacyUrl)
  if ('error' in fetched) {
    return { ok: false, filename, stage: 'fetch', error: fetched.error, httpStatus: fetched.httpStatus }
  }

  const uploaded = await uploadOne(filename, fetched.buf, fetched.contentType)
  if (!uploaded.ok) {
    return { ok: false, filename, stage: 'upload', error: uploaded.error }
  }
  return { ok: true, filename, bytes: fetched.buf.length, skipped: null }
}

async function main() {
  const raw = await fs.readFile(REPORT_PATH, 'utf-8')
  const entries: BrokenEntry[] = JSON.parse(raw)
  console.log(`Loaded ${entries.length} broken entries${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log(`Bucket: ${BUCKET}, prefix: ${STORAGE_PREFIX}/`)
  console.log(`Concurrency: ${CONCURRENCY}\n`)

  const index = await loadOrBuildIndex()

  // Pre-resolve so we know how many will hit the index vs miss
  const filenames = entries.map((e) => (e.url ? extractFilename(e.url) : null))
  const inIndex = filenames.filter((f) => f && index[f]).length
  const missing = filenames.filter((f) => f && !index[f]).length
  console.log(`\nIndex match: ${inIndex} / ${entries.length}  (missing on legacy: ${missing})\n`)

  const results: Outcome[] = []
  let done = 0

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY)
    const outcomes = await Promise.all(batch.map((e) => processOne(e, index)))
    results.push(...outcomes)
    done += batch.length
    const ok = results.filter((r) => r.ok).length
    const fail = results.length - ok
    process.stdout.write(`\r${done}/${entries.length}  ok=${ok}  fail=${fail}`)
  }
  console.log('\n')

  const uploaded = results.filter((r): r is Extract<Outcome, { ok: true }> => r.ok && r.skipped === null)
  const skippedExists = results.filter((r): r is Extract<Outcome, { ok: true }> => r.ok && r.skipped === 'exists')
  const skippedDry = results.filter((r): r is Extract<Outcome, { ok: true }> => r.ok && r.skipped === 'dry-run')
  const failed = results.filter((r): r is Extract<Outcome, { ok: false }> => !r.ok)

  console.log('=== RESULT ===')
  console.log(`Uploaded:                        ${uploaded.length}`)
  console.log(`Skipped (already in bucket):     ${skippedExists.length}`)
  console.log(`Skipped (dry-run, would upload): ${skippedDry.length}`)
  console.log(`Failed:                          ${failed.length}`)
  if (uploaded.length > 0) {
    const totalBytes = uploaded.reduce((s, r) => s + r.bytes, 0)
    console.log(`Total bytes:                     ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
  }

  if (failed.length > 0) {
    const buckets: Record<string, typeof failed> = {}
    for (const f of failed) {
      const key = `${f.stage}${f.httpStatus ? ` HTTP ${f.httpStatus}` : ''} — ${f.error}`
      buckets[key] ||= []
      buckets[key].push(f)
    }
    console.log('\n=== FAILURE BREAKDOWN ===')
    for (const [k, v] of Object.entries(buckets).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`[${v.length}] ${k}`)
      v.slice(0, 5).forEach((f) => console.log(`   - ${f.filename}`))
      if (v.length > 5) console.log(`   ...and ${v.length - 5} more`)
    }
    await fs.writeFile(FAIL_LOG, JSON.stringify(failed, null, 2))
    console.log(`\nFull failure list: ${FAIL_LOG}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
