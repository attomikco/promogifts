import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const hasImage = product.images?.length > 0 && product.images[0]

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
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
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
        <p className="mt-2 font-display text-lg font-bold text-[var(--brand)]">
          ${Number(product.price).toFixed(2)} MXN
        </p>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <span className="block rounded-lg bg-[var(--brand)] py-2 text-center text-sm font-semibold text-white transition group-hover:bg-[var(--brand-dark)]">
          Cotizar
        </span>
      </div>
    </Link>
  )
}
