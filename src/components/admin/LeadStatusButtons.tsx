'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LeadStatusButtons({
  id,
  status,
}: {
  id: string
  status: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function setStatus(next: string) {
    setLoading(next)
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const btn =
    'rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-50'

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setStatus('replied')}
        disabled={loading !== null || status === 'replied'}
        className={`${btn} ${
          status === 'replied'
            ? 'bg-green-100 text-green-700'
            : 'border border-green-200 text-green-600 hover:bg-green-50'
        }`}
      >
        {loading === 'replied' ? '...' : 'Respondido'}
      </button>
      <button
        type="button"
        onClick={() => setStatus('closed')}
        disabled={loading !== null || status === 'closed'}
        className={`${btn} ${
          status === 'closed'
            ? 'bg-gray-200 text-gray-600'
            : 'border border-[var(--light)] text-[var(--mid)] hover:bg-[var(--pale)]'
        }`}
      >
        {loading === 'closed' ? '...' : 'Cerrar'}
      </button>
    </div>
  )
}
