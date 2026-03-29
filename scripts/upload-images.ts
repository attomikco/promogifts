import { config } from 'dotenv'
config({ path: '.env.local' })

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'products'
const PROGRESS_FILE = 'scripts/image-progress.json'

// --- Progress tracking ---

function loadProgress(): Set<string> {
  try {
    const data = readFileSync(PROGRESS_FILE, 'utf-8')
    return new Set(JSON.parse(data) as string[])
  } catch {
    return new Set()
  }
}

function saveProgress(paths: Set<string>) {
  writeFileSync(PROGRESS_FILE, JSON.stringify([...paths], null, 2))
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- Collect local files recursively ---

function collectFiles(dir: string): string[] {
  const files: string[] = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        files.push(...collectFiles(full))
      } else if (/\.(jpe?g|png|gif|webp|svg)$/i.test(entry)) {
        files.push(full)
      }
    }
  } catch (err) {
    console.log(`⚠️ Could not read directory ${dir}: ${err instanceof Error ? err.message : err}`)
  }
  return files
}

// --- Mime type from extension ---

function mimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return map[ext || ''] || 'application/octet-stream'
}

// --- Part 1: Upload local Django images ---

async function uploadLocalImages(uploaded: Set<string>) {
  const mediaDir = join(homedir(), 'Downloads', 'promogifts-media', 'images')
  console.log(`\n📂 Part 1: Scanning ${mediaDir}...\n`)

  const files = collectFiles(mediaDir)
  console.log(`Found ${files.length} image files\n`)

  let uploadedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]
    const filename = basename(filePath)
    const storagePath = `images/${filename}`

    console.log(`[${i + 1}/${files.length}] Uploading: ${filename}`)

    if (uploaded.has(storagePath)) {
      skippedCount++
      continue
    }

    try {
      const buffer = readFileSync(filePath)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          upsert: true,
          contentType: mimeType(filename),
        })

      if (uploadError) {
        console.log(`   ❌ Upload error: ${uploadError.message}`)
        errorCount++
        await delay(100)
        continue
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      // Find product where images array contains this filename
      const { data: products } = await supabase
        .from('products')
        .select('id, images')
        .like('images', `%${filename}%`)

      if (products && products.length > 0) {
        for (const product of products) {
          await supabase
            .from('products')
            .update({ images: [publicUrl] })
            .eq('id', product.id)
        }
        console.log(`   ✅ Uploaded + updated ${products.length} product(s)`)
      } else {
        console.log(`   ✅ Uploaded (no matching product found)`)
      }

      uploaded.add(storagePath)
      uploadedCount++

      if (uploadedCount % 50 === 0) {
        saveProgress(uploaded)
        console.log(`   💾 Progress saved (${uploaded.size} total)`)
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err instanceof Error ? err.message : err}`)
      errorCount++
    }

    await delay(100)
  }

  console.log(`\n📊 Part 1 done: ${uploadedCount} uploaded, ${skippedCount} skipped, ${errorCount} errors`)
  return { uploaded: uploadedCount, skipped: skippedCount, errors: errorCount }
}

// --- Part 2: Download + upload WordPress images ---

async function uploadWordPressImages(uploaded: Set<string>) {
  console.log(`\n📂 Part 2: Fetching products with WordPress images...\n`)

  // Fetch all products whose first image contains the WordPress IP
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, images')
    .like('images', '%107.170.248.90%')

  if (error) {
    console.log(`❌ Query error: ${error.message}`)
    return { uploaded: 0, skipped: 0, errors: 1 }
  }

  if (!products || products.length === 0) {
    console.log('No products with WordPress images found.')
    return { uploaded: 0, skipped: 0, errors: 0 }
  }

  console.log(`Found ${products.length} products with WordPress images\n`)

  let uploadedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const imageUrl = (product.images as string[])?.[0]

    if (!imageUrl) {
      skippedCount++
      continue
    }

    // Extract filename from URL
    const urlParts = imageUrl.split('/')
    const filename = urlParts[urlParts.length - 1] || `wp-${product.sku}.jpg`
    const storagePath = `wp/${filename}`

    console.log(`[${i + 1}/${products.length}] Downloading: ${filename} (${product.sku})`)

    if (uploaded.has(storagePath)) {
      skippedCount++
      continue
    }

    try {
      const res = await fetch(imageUrl)
      if (!res.ok) {
        console.log(`   ⚠️ HTTP ${res.status} — skipping`)
        skippedCount++
        await delay(100)
        continue
      }

      const buffer = Buffer.from(await res.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          upsert: true,
          contentType: res.headers.get('content-type') || mimeType(filename),
        })

      if (uploadError) {
        console.log(`   ❌ Upload error: ${uploadError.message}`)
        errorCount++
        await delay(100)
        continue
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath)

      await supabase
        .from('products')
        .update({ images: [urlData.publicUrl] })
        .eq('id', product.id)

      console.log(`   ✅ Uploaded + updated`)
      uploaded.add(storagePath)
      uploadedCount++

      if (uploadedCount % 50 === 0) {
        saveProgress(uploaded)
        console.log(`   💾 Progress saved (${uploaded.size} total)`)
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err instanceof Error ? err.message : err}`)
      errorCount++
    }

    await delay(100)
  }

  console.log(`\n📊 Part 2 done: ${uploadedCount} uploaded, ${skippedCount} skipped, ${errorCount} errors`)
  return { uploaded: uploadedCount, skipped: skippedCount, errors: errorCount }
}

// --- Main ---

async function main() {
  console.log('🚀 Starting image upload to Supabase Storage...')

  const uploaded = loadProgress()
  if (uploaded.size > 0) {
    console.log(`📌 Resuming — ${uploaded.size} images already uploaded`)
  }

  const p1 = await uploadLocalImages(uploaded)
  const p2 = await uploadWordPressImages(uploaded)

  // Final save
  saveProgress(uploaded)

  const totalUploaded = p1.uploaded + p2.uploaded
  const totalSkipped = p1.skipped + p2.skipped
  const totalErrors = p1.errors + p2.errors

  console.log(`\n=============================`)
  console.log(`✅ Uploaded: ${totalUploaded}`)
  console.log(`⏭️ Skipped: ${totalSkipped}`)
  console.log(`❌ Errors: ${totalErrors}`)
  console.log(`📦 Total tracked: ${uploaded.size}`)
  console.log(`=============================`)
}

main().catch(console.error)
