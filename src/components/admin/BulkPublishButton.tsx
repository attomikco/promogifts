'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BulkPublishButton({ draftCount }: { draftCount: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  if (draftCount === 0) return null

  async function handlePublish() {
    if (!confirm(`¿Publicar ${draftCount} borradores?`)) return
    setLoading(true)
    setResult('')

    try {
      const res = await fetch('/api/admin/products/bulk-publish', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResult(`✅ ${data.count} productos publicados`)
        router.refresh()
      } else {
        setResult(`❌ ${data.error}`)
      }
    } catch {
      setResult('❌ Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePublish}
        disabled={loading}
        className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50"
      >
        {loading ? 'Publicando...' : `Publicar ${draftCount} borradores`}
      </button>
      {result && <span className="text-xs">{result}</span>}
    </div>
  )
}
