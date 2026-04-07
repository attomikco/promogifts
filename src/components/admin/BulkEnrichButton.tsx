'use client'

import { useState } from 'react'

export default function BulkEnrichButton({
  pendingCount,
}: {
  pendingCount: number
}) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ enriched: 0, remaining: pendingCount })
  const [batchSize, setBatchSize] = useState(10)

  async function runBatch() {
    setRunning(true)
    try {
      const res = await fetch('/api/enrich/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: batchSize }),
      })
      const data = await res.json()
      setProgress((p) => ({
        enriched: p.enriched + (data.enriched ?? 0),
        remaining: data.remaining ?? p.remaining,
      }))
    } catch {
      // silently handle
    } finally {
      setRunning(false)
    }
  }

  async function runAll() {
    setRunning(true)
    let remaining = progress.remaining
    let totalEnriched = progress.enriched

    while (remaining > 0) {
      try {
        const res = await fetch('/api/enrich/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: batchSize }),
        })
        const data = await res.json()
        totalEnriched += data.enriched ?? 0
        remaining = data.remaining ?? 0
        setProgress({ enriched: totalEnriched, remaining })

        if ((data.enriched ?? 0) === 0) break
      } catch {
        break
      }
    }
    setRunning(false)
  }

  if (pendingCount === 0 && progress.remaining === 0) return null

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <select
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          disabled={running}
          className="rounded-lg border border-[var(--light)] px-2 py-1.5 text-xs"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <button
          onClick={runBatch}
          disabled={running || progress.remaining === 0}
          className="rounded-lg border border-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-pale)] disabled:opacity-50"
        >
          {running ? `Enriqueciendo...` : `Enriquecer lote`}
        </button>
        <button
          onClick={runAll}
          disabled={running || progress.remaining === 0}
          className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-50"
        >
          {running ? `${progress.enriched} listos...` : `Enriquecer todo`}
        </button>
      </div>
      <span className="text-xs text-[var(--mid)]">
        {progress.remaining.toLocaleString('es-MX')} pendientes
        {progress.enriched > 0 && ` · ${progress.enriched} enriquecidos`}
      </span>
    </div>
  )
}
