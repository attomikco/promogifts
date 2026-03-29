import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CATEGORIES, type Product } from '@/lib/types'

export default async function AdminProductosPage() {
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const products = (data ?? []) as Product[]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--black)]">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[var(--mid)]">
            {products.length} producto{products.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
        >
          + Agregar producto
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--light)]/60 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--light)]/40 bg-[var(--pale)]">
              <th className="px-4 py-3 font-medium text-[var(--mid)]">SKU</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Nombre</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Categoría</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Precio</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Estado</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">IA</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => {
              const cat = CATEGORIES.find((c) => c.slug === product.category)
              return (
                <tr
                  key={product.id}
                  className={`border-b border-[var(--light)]/30 ${
                    i % 2 === 1 ? 'bg-[var(--pale)]/50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[var(--mid)]">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--black)]">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-[var(--mid)]">
                    {cat ? `${cat.emoji} ${cat.label}` : product.category}
                  </td>
                  <td className="px-4 py-3 text-[var(--black)]">
                    ${product.price}
                  </td>
                  <td className="px-4 py-3">
                    {product.is_published ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Publicado
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Borrador
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.ai_enriched_at ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        ✓ Enriquecido
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-sm font-medium text-[var(--brand)] hover:underline"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/productos/${product.slug}`}
                        target="_blank"
                        className="text-sm font-medium text-[var(--mid)] hover:underline"
                      >
                        Ver
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--mid)]">
                  No hay productos aún.{' '}
                  <Link
                    href="/admin/productos/nuevo"
                    className="font-medium text-[var(--brand)] hover:underline"
                  >
                    Agrega el primero
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
