// Shared helpers for product image storage.
// Pure module (no server-only imports) so it can be used from both the
// upload Route Handler and the browser ImageManager component.

export const PRODUCTS_BUCKET = 'products'

/** Max images kept in `products.images` for a single product. */
export const MAX_IMAGES = 8

/** Max size per uploaded file (~5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number]

const EXT_BY_MIME: Record<AcceptedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function isAcceptedMimeType(type: string): type is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type)
}

export function extForMime(mime: AcceptedMimeType): string {
  return EXT_BY_MIME[mime]
}

/** Lowercase, ASCII, hyphenated slug of a filename (extension stripped). */
export function slugifyFilename(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'imagen'
}

/**
 * Collision-safe object path inside the `products` bucket:
 * `<sku>/<timestamp>-<slug>.<ext>` (new per-SKU convention; legacy
 * `images/` and `wp/` files are left untouched).
 */
export function buildStoragePath(
  sku: string,
  originalName: string,
  mime: AcceptedMimeType,
  timestamp: number
): string {
  const skuSlug =
    sku
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'sku'
  return `${skuSlug}/${timestamp}-${slugifyFilename(originalName)}.${extForMime(mime)}`
}

const PUBLIC_PREFIX = `/storage/v1/object/public/${PRODUCTS_BUCKET}/`

/**
 * Extract the in-bucket object path from a full public URL, or null if the
 * URL doesn't point at the products bucket.
 */
export function storagePathFromPublicUrl(url: string): string | null {
  const idx = url.indexOf(PUBLIC_PREFIX)
  if (idx === -1) return null
  const raw = url.slice(idx + PUBLIC_PREFIX.length)
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
