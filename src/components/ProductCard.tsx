import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import AddToQuoteButton from '@/components/AddToQuoteButton'

// ProductCard accepts either a full Product or the trimmed card shape used by
// the SEO category pages (only card columns are fetched there).
export type CardProduct = Pick<
  Product,
  'id' | 'sku' | 'name' | 'slug' | 'price' | 'min_qty' | 'images'
>

export default function ProductCard({
  product,
  priority = false,
}: {
  product: CardProduct
  priority?: boolean
}) {
  const hasImage =
    product.images?.length > 0 &&
    typeof product.images[0] === 'string' &&
    product.images[0].startsWith('http')
  const altText = `${product.name} - Artículo Promocional Personalizado`

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--light)]/60 bg-white transition hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative flex aspect-square items-center justify-center bg-[var(--pale)]">
        {hasImage ? (
          <Image
            src={product.images[0]}
            alt={altText}
            title={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
          />
        ) : (
          <span className="text-5xl">📦</span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-[var(--black)] group-hover:text-[var(--brand)]">
          {product.name}
        </h3>
        <p className="mt-2 text-lg font-bold text-[var(--brand)]">
          ${Number(product.price).toFixed(2)} MXN
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <span className="block flex-1 rounded-lg bg-[var(--brand)] py-2 text-center text-sm font-semibold text-white transition group-hover:bg-[var(--brand-dark)]">
          Cotizar
        </span>
        <AddToQuoteButton
          product={{
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            image: hasImage ? product.images[0] : undefined,
            price: product.price,
            minQty: product.min_qty,
          }}
        />
      </div>
    </Link>
  )
}
