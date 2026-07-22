'use client'

import { useQuoteCart } from '@/components/QuoteCartProvider'
import { trackAddToQuote } from '@/lib/gtm'

export type AddToQuoteProduct = {
  sku: string
  name: string
  slug: string
  image?: string
  price: number
  minQty: number
}

export default function AddToQuoteButton({ product }: { product: AddToQuoteProduct }) {
  const { addItem, hasItem, ready } = useQuoteCart()
  const added = ready && hasItem(product.sku)

  function handleClick(e: React.MouseEvent) {
    // The whole card is a <Link>; do not navigate when adding.
    e.preventDefault()
    e.stopPropagation()
    if (added) return
    addItem({
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      minQty: product.minQty,
    })
    trackAddToQuote({ product_sku: product.sku, product_name: product.name })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={added ? 'Ya está en tu cotización' : 'Agregar a mi cotización'}
      title={added ? 'En tu cotización' : 'Agregar a mi cotización'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
        added
          ? 'border-green-300 bg-green-50 text-green-600'
          : 'border-[var(--light)] bg-white text-[var(--brand)] hover:border-[var(--brand)] hover:bg-[var(--brand-pale)]'
      }`}
    >
      {added ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 4v12M4 10h12" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
