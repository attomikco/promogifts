'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuoteCart } from '@/components/QuoteCartProvider'
import { trackGenerateLead } from '@/lib/gtm'

const inputClass =
  'w-full rounded-lg border border-[var(--light)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]'

export default function CotizacionClient() {
  const { items, updateQuantity, removeItem, clear, ready } = useQuoteCart()
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
    website: '', // honeypot
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    const payloadItems = items.map((i) => ({ sku: i.sku, name: i.name, quantity: i.quantity }))

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items: payloadItems }),
      })

      if (res.ok) {
        trackGenerateLead({
          method: 'quote_cart',
          items_count: items.length,
          skus: items.map((i) => i.sku),
        })
        clear()
        setDone(true)
      } else {
        setError('Error al enviar. Intenta de nuevo o escríbenos por WhatsApp.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--black)]">¡Solicitud recibida!</h1>
        <p className="mt-2 text-[var(--mid)]">
          Recibimos tu cotización — te respondemos en menos de 4 horas hábiles.
        </p>
        <Link
          href="/productos"
          className="mt-8 inline-block rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
        >
          Seguir explorando productos
        </Link>
      </div>
    )
  }

  if (ready && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--black)]">Tu cotización está vacía</h1>
        <p className="mt-2 text-[var(--mid)]">
          Agrega productos desde el catálogo para solicitar una cotización en bloque.
        </p>
        <Link
          href="/productos"
          className="mt-8 inline-block rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
        >
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--black)] sm:text-3xl">Mi cotización</h1>
      <p className="mt-1 text-sm text-[var(--mid)]">
        Revisa tus productos y cantidades, y envíanos tus datos para recibir una cotización personalizada.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="divide-y divide-[var(--light)]/50 rounded-xl border border-[var(--light)]/60 bg-white">
            {items.map((item) => {
              const hasImage = item.image?.startsWith('http')
              return (
                <div key={item.sku} className="flex items-center gap-4 p-4">
                  <Link
                    href={`/productos/${item.slug}`}
                    className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--pale)]"
                  >
                    {hasImage ? (
                      <Image src={item.image!} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/productos/${item.slug}`}
                      className="block truncate font-medium text-[var(--black)] hover:text-[var(--brand)]"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-[var(--mid)]">
                      ${Number(item.price).toFixed(2)} MXN / unidad
                    </p>
                    <p className="text-xs text-[var(--mid)]">Mínimo {item.minQty} pz</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="number"
                      min={item.minQty}
                      step={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.sku, parseInt(e.target.value, 10) || item.minQty)}
                      className="w-24 rounded-lg border border-[var(--light)] px-2 py-1.5 text-right text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      aria-label={`Cantidad de ${item.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.sku)}
                      className="text-xs font-medium text-red-500 transition hover:text-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="sticky top-24 space-y-3 rounded-xl border border-[var(--light)]/60 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-[var(--black)]">Tus datos</h2>
            <p className="text-sm text-[var(--mid)]">Respuesta en menos de 4 horas hábiles.</p>

            {/* Honeypot */}
            <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
              <label>
                No llenar
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => update('website', e.target.value)}
                />
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--black)]">Nombre *</label>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--black)]">Empresa *</label>
              <input required value={form.company} onChange={(e) => update('company', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--black)]">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--black)]">Teléfono / WhatsApp *</label>
              <input required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--black)]">Mensaje (opcional)</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Impresión de logo, colores, fecha de entrega deseada..."
                className={inputClass}
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
            >
              {loading ? 'Enviando...' : `Solicitar cotización (${items.length})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
