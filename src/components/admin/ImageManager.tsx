'use client'

import { useRef, useState } from 'react'
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES,
  isAcceptedMimeType,
} from '@/lib/storage'

type PendingStatus = 'pending' | 'uploading' | 'done' | 'error'
type PendingItem = { name: string; status: PendingStatus; message?: string }

const ENDPOINT = (productId: string) => `/api/admin/products/${productId}/images`

export default function ImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string
  images: string[]
  onChange: (images: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const atLimit = images.length >= MAX_IMAGES

  async function uploadFiles(fileList: File[]) {
    if (fileList.length === 0) return
    setError('')

    const accepted: File[] = []
    const rejected: PendingItem[] = []
    let projected = images.length

    for (const file of fileList) {
      if (!isAcceptedMimeType(file.type)) {
        rejected.push({
          name: file.name,
          status: 'error',
          message: 'Formato no permitido (usa JPG, PNG o WebP)',
        })
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push({ name: file.name, status: 'error', message: 'Supera el máximo de 5 MB' })
      } else if (projected >= MAX_IMAGES) {
        rejected.push({
          name: file.name,
          status: 'error',
          message: `Límite de ${MAX_IMAGES} imágenes alcanzado`,
        })
      } else {
        projected++
        accepted.push(file)
      }
    }

    // Accepted items first so their index lines up with the upload loop.
    setPending([
      ...accepted.map((f): PendingItem => ({ name: f.name, status: 'pending' })),
      ...rejected,
    ])

    if (accepted.length === 0) return
    setBusy(true)

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i]
      setPending((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'uploading' } : it))
      )

      try {
        const formData = new FormData()
        formData.append('files', file)
        const res = await fetch(ENDPOINT(productId), { method: 'POST', body: formData })
        const data = (await res.json()) as { images?: string[]; error?: string }
        if (!res.ok || !data.images) {
          throw new Error(data.error || 'Error al subir la imagen')
        }
        onChange(data.images)
        setPending((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'done' } : it))
        )
      } catch (err) {
        setPending((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'error',
                  message: err instanceof Error ? err.message : 'Error al subir',
                }
              : it
          )
        )
      }
    }

    setBusy(false)
    // Clear the successfully-uploaded chips shortly after; keep any errors.
    setTimeout(() => {
      setPending((prev) => prev.filter((it) => it.status === 'error'))
    }, 2500)
  }

  async function persistOrder(next: string[]) {
    const previous = images
    onChange(next) // optimistic
    setBusy(true)
    setError('')
    try {
      const res = await fetch(ENDPOINT(productId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: next }),
      })
      const data = (await res.json()) as { images?: string[]; error?: string }
      if (!res.ok || !data.images) throw new Error(data.error || 'Error al reordenar')
      onChange(data.images)
    } catch (err) {
      onChange(previous) // revert
      setError(err instanceof Error ? err.message : 'No se pudo reordenar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(url: string) {
    if (!window.confirm('¿Eliminar esta imagen? Esta acción no se puede deshacer.')) return
    setDeleting(url)
    setError('')
    try {
      const res = await fetch(ENDPOINT(productId), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = (await res.json()) as { images?: string[]; error?: string }
      if (!res.ok || !data.images) throw new Error(data.error || 'Error al eliminar')
      onChange(data.images)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la imagen')
    } finally {
      setDeleting(null)
    }
  }

  function moveImage(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persistOrder(next)
  }

  function makePrimary(url: string) {
    persistOrder([url, ...images.filter((u) => u !== url)])
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (busy) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) uploadFiles(files)
  }

  const accept = ACCEPTED_MIME_TYPES.join(',')

  return (
    <div className="rounded-xl border border-[var(--light)]/60 bg-white p-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-[var(--mid)]">
        Imágenes
      </h2>
      <p className="mb-4 text-xs text-[var(--mid)]">
        La <strong className="text-[var(--brand)]">primera imagen</strong> es la que se
        muestra en el catálogo. Arrastra las miniaturas para reordenarlas. Máximo{' '}
        {MAX_IMAGES} imágenes · JPG, PNG o WebP · hasta 5 MB cada una.
      </p>

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((url, index) => {
            const isPrimary = index === 0
            const isBeingDeleted = deleting === url
            return (
              <li
                key={url}
                draggable={!busy}
                onDragStart={() => setDragIndex(index)}
                onDragEnter={() => setOverIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={() => {
                  if (dragIndex !== null && overIndex !== null) moveImage(dragIndex, overIndex)
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                className={`group relative overflow-hidden rounded-lg border bg-[var(--pale)] transition ${
                  isPrimary ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]' : 'border-[var(--light)]'
                } ${overIndex === index && dragIndex !== null ? 'ring-2 ring-[var(--brand-light)]' : ''} ${
                  busy ? '' : 'cursor-grab'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={isPrimary ? 'Imagen principal del producto' : `Imagen ${index + 1}`}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                  draggable={false}
                />

                {isPrimary && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-[var(--brand)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Principal
                  </span>
                )}

                {isBeingDeleted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-[var(--mid)]">
                    Eliminando…
                  </div>
                )}

                {/* Actions */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                  {!isPrimary ? (
                    <button
                      type="button"
                      onClick={() => makePrimary(url)}
                      disabled={busy}
                      className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)] transition hover:bg-white disabled:opacity-50"
                      title="Usar como imagen principal"
                    >
                      ★ Principal
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(url)}
                    disabled={busy || isBeingDeleted}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 transition hover:bg-white disabled:opacity-50"
                    title="Eliminar imagen"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Drop zone / picker */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy && !atLimit) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? 'border-[var(--brand)] bg-[var(--brand-pale)]'
            : 'border-[var(--light)] bg-[var(--pale)]'
        } ${atLimit ? 'opacity-60' : ''}`}
      >
        <p className="text-sm text-[var(--mid)]">
          {atLimit
            ? `Alcanzaste el máximo de ${MAX_IMAGES} imágenes`
            : 'Arrastra imágenes aquí'}
        </p>
        {!atLimit && (
          <>
            <p className="my-1 text-xs text-[var(--mid)]">o</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-50"
            >
              {busy ? 'Subiendo…' : 'Seleccionar archivos'}
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = '' // allow re-selecting the same file
            uploadFiles(files)
          }}
        />
      </div>

      {/* Per-file upload state */}
      {pending.length > 0 && (
        <ul className="mt-3 space-y-1">
          {pending.map((it, idx) => (
            <li
              key={`${it.name}-${idx}`}
              className="flex items-center justify-between gap-2 rounded-md bg-[var(--pale)] px-3 py-1.5 text-xs"
            >
              <span className="truncate text-[var(--black)]">{it.name}</span>
              <span
                className={
                  it.status === 'error'
                    ? 'shrink-0 font-medium text-red-600'
                    : it.status === 'done'
                      ? 'shrink-0 font-medium text-green-600'
                      : 'shrink-0 text-[var(--mid)]'
                }
              >
                {it.status === 'uploading' && 'Subiendo…'}
                {it.status === 'pending' && 'En espera'}
                {it.status === 'done' && '✓ Listo'}
                {it.status === 'error' && (it.message ?? 'Error')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
