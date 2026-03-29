'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  function pushSearch(q: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (q) {
      params.set('q', q)
    } else {
      params.delete('q')
    }
    params.delete('page')
    router.push(`/admin/productos?${params.toString()}`)
  }

  function handleChange(q: string) {
    setValue(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => pushSearch(q), 300)
  }

  function handleClear() {
    setValue('')
    pushSearch('')
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar por nombre o SKU..."
        className="w-full rounded-lg border border-[var(--light)] px-3 py-2 pr-8 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--mid)] hover:text-[var(--black)]"
        >
          ✕
        </button>
      )}
    </div>
  )
}
