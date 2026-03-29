import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const hasImage = product.images?.length > 0 && product.images[0]

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--light)]/60 bg-white transition hover:shadow-lg"
    >
      {/* Image area */}
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
          <span className="text-6xl">{'\uD83C\uDF81'}</span>
        )}

        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--brand-pale)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
            Destacado
          </span>
        )}

        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[var(--black)]/80 px-2 py-0.5 text-[10px] font-medium text-white">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          IA
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--mid)]">
          {product.sku}
        </p>
        <h3 className="mt-1 font-semibold leading-snug text-[var(--black)] group-hover:text-[var(--brand)]">
          {product.name}
        </h3>
        {product.ai_short_desc && (
          <p className="mt-1.5 line-clamp-2 text-sm text-[var(--mid)]">
            {product.ai_short_desc}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--light)]/40 px-4 py-3">
        <div>
          <span className="font-display text-lg font-bold text-[var(--brand)]">
            ${product.price} MXN
          </span>
          <span className="ml-2 text-xs text-[var(--mid)]">
            M&iacute;n. {product.min_qty} pzas
          </span>
        </div>
        <span className="rounded-full bg-[var(--brand-pale)] px-3 py-1 text-xs font-semibold text-[var(--brand)] transition group-hover:bg-[var(--brand)] group-hover:text-white">
          Cotizar &rarr;
        </span>
      </div>
    </Link>
  )
}
