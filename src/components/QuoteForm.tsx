'use client'

import { useState } from 'react'
import { trackGenerateLead } from '@/lib/gtm'

const inputClass =
  'w-full rounded-lg border border-[var(--light)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]'

export default function QuoteForm({
  productName,
  productSku,
  minQty,
}: {
  productName: string
  productSku: string
  minQty: number
}) {
  const safeMin = Math.max(1, minQty || 1)
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    quantity: String(safeMin),
    message: '',
    website: '', // honeypot
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const quantity = Math.max(safeMin, parseInt(form.quantity, 10) || safeMin)

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone,
          message: form.message,
          website: form.website,
          productName,
          productSku,
          quantity,
        }),
      })

      if (res.ok) {
        setResult({
          ok: true,
          msg: 'Recibimos tu solicitud — te respondemos en menos de 4 horas hábiles.',
        })
        trackGenerateLead({
          product_sku: productSku,
          product_name: productName,
          quantity,
          method: 'form',
        })
        setForm({
          name: '',
          company: '',
          email: '',
          phone: '',
          quantity: String(safeMin),
          message: '',
          website: '',
        })
      } else {
        setResult({ ok: false, msg: 'Error al enviar. Intenta de nuevo o escríbenos por WhatsApp.' })
      }
    } catch {
      setResult({ ok: false, msg: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  if (result?.ok) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-4 text-sm text-green-700">
        <p className="font-semibold">¡Solicitud recibida! 🎉</p>
        <p className="mt-1">{result.msg}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot — hidden from users, catches bots */}
      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <label>
          No llenar este campo
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--black)]">Nombre *</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--black)]">Empresa *</label>
          <input required value={form.company} onChange={(e) => update('company', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--black)]">Email *</label>
          <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--black)]">Teléfono / WhatsApp *</label>
          <input required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--black)]">
          Cantidad * <span className="font-normal text-[var(--mid)]">(mínimo {safeMin} pz)</span>
        </label>
        <input
          required
          type="number"
          min={safeMin}
          step={1}
          value={form.quantity}
          onChange={(e) => update('quantity', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--black)]">Mensaje (opcional)</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          placeholder="Cuéntanos sobre la impresión de tu logo, colores de tinta y fecha de entrega deseada."
          className={inputClass}
        />
      </div>

      {result && !result.ok && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{result.msg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
      >
        {loading ? 'Enviando...' : 'Solicitar cotización'}
      </button>
    </form>
  )
}
