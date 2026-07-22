'use client'

import { useQuoteCart } from '@/components/QuoteCartProvider'
import { trackAddToQuote, trackContactPhone, trackContactWhatsApp } from '@/lib/gtm'

const PHONE = '+525530297582'
const WHATSAPP_NUMBER = '525530297582'

export type CTAProduct = {
  sku: string
  name: string
  slug: string
  image?: string
  price: number
  minQty: number
}

export default function ProductCTAs({ product }: { product: CTAProduct }) {
  const { addItem, hasItem, ready } = useQuoteCart()
  const added = ready && hasItem(product.sku)

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa cotizar: ${product.name} (SKU: ${product.sku})`
  )

  function handleAdd() {
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
    <div className="mt-8 space-y-3">
      <div className="flex flex-wrap gap-3">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackContactWhatsApp({ product_sku: product.sku })}
          className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Cotizar por WhatsApp
        </a>
        <a
          href={`tel:${PHONE}`}
          onClick={() => trackContactPhone({ product_sku: product.sku })}
          className="rounded-full border border-[var(--light)] px-6 py-3 text-sm font-semibold text-[var(--mid)] transition hover:bg-[var(--pale)]"
        >
          Llamar
        </a>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={added}
        className={`flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition sm:w-auto ${
          added
            ? 'border-green-300 bg-green-50 text-green-700'
            : 'border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-pale)]'
        }`}
      >
        {added ? (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
            </svg>
            Agregado a tu cotización
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4v12M4 10h12" strokeLinecap="round" />
            </svg>
            Agregar a mi cotización
          </>
        )}
      </button>
    </div>
  )
}
