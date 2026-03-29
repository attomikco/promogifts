'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
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

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setResult({ ok: true, msg: 'Mensaje enviado. Te contactaremos pronto.' })
        setForm({ name: '', company: '', email: '', phone: '', message: '' })
      } else {
        setResult({ ok: false, msg: 'Error al enviar. Intenta de nuevo.' })
      }
    } catch {
      setResult({ ok: false, msg: 'Error de conexión.' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[var(--light)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--black)]">Nombre</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--black)]">Empresa</label>
          <input value={form.company} onChange={(e) => update('company', e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--black)]">Email</label>
          <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--black)]">Teléfono</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--black)]">Mensaje</label>
        <textarea required rows={5} value={form.message} onChange={(e) => update('message', e.target.value)} className={inputClass} />
      </div>

      {result && (
        <p className={`rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {result.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60 sm:w-auto"
      >
        {loading ? 'Enviando...' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
