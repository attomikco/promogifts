'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, type Product } from '@/lib/types'

function slugify(name: string, sku: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const skuPart = sku.toLowerCase().replace(/[^a-z0-9]/g, '')
  return skuPart ? `${base}-${skuPart}` : base
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const isEditing = !!product

  const [sku, setSku] = useState(product?.sku ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugManual, setSlugManual] = useState(false)
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0].slug)
  const [price, setPrice] = useState(product?.price ?? 0)
  const [minQty, setMinQty] = useState(product?.min_qty ?? 100)
  const [dimensions, setDimensions] = useState(product?.dimensions ?? '')
  const [material, setMaterial] = useState(product?.material ?? '')
  const [colors, setColors] = useState(product?.colors?.join(', ') ?? '')
  const [isPublished, setIsPublished] = useState(product?.is_published ?? false)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)

  // AI fields
  const [shortDesc, setShortDesc] = useState(product?.ai_short_desc ?? '')
  const [description, setDescription] = useState(product?.ai_description ?? '')
  const [metaTitle, setMetaTitle] = useState(product?.ai_meta_title ?? '')
  const [metaDesc, setMetaDesc] = useState(product?.ai_meta_desc ?? '')
  const [keywords, setKeywords] = useState(product?.ai_keywords?.join(', ') ?? '')
  const [useCases, setUseCases] = useState(product?.ai_use_cases?.join(', ') ?? '')
  const [sellingPoints, setSellingPoints] = useState(
    product?.ai_selling_points?.join(', ') ?? ''
  )

  const [enriching, setEnriching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManual) {
      setSlug(slugify(value, sku))
    }
  }

  function handleSkuChange(value: string) {
    setSku(value)
    if (!slugManual) {
      setSlug(slugify(name, value))
    }
  }

  async function handleEnrich() {
    setEnriching(true)
    setError('')

    const body = isEditing
      ? { productId: product.id }
      : { name, sku, category, price, dimensions, material }

    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al enriquecer')
      }

      const data = await res.json()
      setShortDesc(data.short_desc ?? '')
      setDescription(data.description ?? '')
      setMetaTitle(data.meta_title ?? '')
      setMetaDesc(data.meta_desc ?? '')
      setKeywords(Array.isArray(data.keywords) ? data.keywords.join(', ') : '')
      setUseCases(Array.isArray(data.use_cases) ? data.use_cases.join(', ') : '')
      setSellingPoints(
        Array.isArray(data.selling_points) ? data.selling_points.join(', ') : ''
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enriquecer')
    } finally {
      setEnriching(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      sku,
      name,
      slug,
      category,
      price,
      min_qty: minQty,
      dimensions: dimensions || null,
      material: material || null,
      colors: colors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      images: product?.images ?? [],
      is_published: isPublished,
      is_featured: isFeatured,
      ai_short_desc: shortDesc || null,
      ai_description: description || null,
      ai_meta_title: metaTitle || null,
      ai_meta_desc: metaDesc || null,
      ai_keywords: keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      ai_use_cases: useCases
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
      ai_selling_points: sellingPoints
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }

    try {
      const url = isEditing
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      router.push('/admin/productos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[var(--light)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]'

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Basic fields */}
      <div className="rounded-xl border border-[var(--light)]/60 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--mid)]">
          Información básica
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">SKU</label>
            <input
              required
              value={sku}
              onChange={(e) => handleSkuChange(e.target.value)}
              className={inputClass}
              placeholder="PG001"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputClass}
              placeholder="Thermo Cosmo 500ml"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManual(true)
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Precio MXN</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cantidad mínima</label>
            <input
              type="number"
              min={1}
              value={minQty}
              onChange={(e) => setMinQty(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Dimensiones</label>
            <input
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              className={inputClass}
              placeholder="22 x 7 cm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Material</label>
            <input
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputClass}
              placeholder="Acero inoxidable"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Colores disponibles
            </label>
            <input
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              className={inputClass}
              placeholder="plateado, negro, azul"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[var(--brand)]"
              />
              Publicado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[var(--brand)]"
              />
              Destacado
            </label>
          </div>
        </div>
      </div>

      {/* AI fields */}
      <div className="rounded-xl border-2 border-[var(--brand)]/20 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
            Contenido IA
          </h2>
          <button
            type="button"
            onClick={handleEnrich}
            disabled={enriching || (!isEditing && !name)}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-50"
          >
            {enriching ? 'Enriqueciendo...' : 'Enriquecer con IA'}
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Descripción corta</label>
            <textarea
              rows={2}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Descripción larga SEO
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center justify-between text-sm font-medium">
              Meta title
              <span className={metaTitle.length > 60 ? 'text-red-500' : 'text-[var(--mid)]'}>
                {metaTitle.length}/60
              </span>
            </label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center justify-between text-sm font-medium">
              Meta description
              <span className={metaDesc.length > 155 ? 'text-red-500' : 'text-[var(--mid)]'}>
                {metaDesc.length}/155
              </span>
            </label>
            <textarea
              rows={3}
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Keywords (separadas por coma)
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Casos de uso (separados por coma)
            </label>
            <input
              value={useCases}
              onChange={(e) => setUseCases(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Puntos de venta (separados por coma)
            </label>
            <input
              value={sellingPoints}
              onChange={(e) => setSellingPoints(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/productos')}
          className="rounded-lg border border-[var(--light)] px-6 py-2.5 text-sm font-medium text-[var(--mid)] transition hover:bg-[var(--pale)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
