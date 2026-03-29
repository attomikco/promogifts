import Link from 'next/link'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CATEGORIES, type Product } from '@/lib/types'
import SearchInput from '@/components/admin/SearchInput'
import BulkPublishButton from '@/components/admin/BulkPublishButton'

const PER_PAGE = 50

function buildHref(params: { q?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return `/admin/productos${qs ? `?${qs}` : ''}`
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const from = (currentPage - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  }

  const { data, count } = await query.range(from, to)
  const products = (data ?? []) as Product[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  // Draft count for bulk publish
  const { count: draftCount } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)

  const showingFrom = totalCount === 0 ? 0 : from + 1
  const showingTo = Math.min(from + PER_PAGE, totalCount)
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--black)]">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[var(--mid)]">
            {totalCount.toLocaleString('es-MX')} producto
            {totalCount !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BulkPublishButton draftCount={draftCount ?? 0} />
          <Link
            href="/admin/productos/nuevo"
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
          >
            + Agregar producto
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <SearchInput />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--light)]/60 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--light)]/40 bg-[var(--pale)]">
              <th className="w-12 px-4 py-3" />
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
              const hasImage = product.images?.length > 0 && product.images[0]
              return (
                <tr
                  key={product.id}
                  className={`border-b border-[var(--light)]/30 transition hover:bg-[var(--brand-pale)]/30 ${
                    i % 2 === 1 ? 'bg-[var(--pale)]/50' : ''
                  }`}
                >
                  <td className="px-4 py-2">
                    <Link href={`/admin/productos/${product.id}`} className="block">
                      {hasImage ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded object-cover"
                          style={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded bg-[var(--pale)] text-lg">
                          📦
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="font-mono text-xs text-[var(--mid)] hover:text-[var(--brand)]"
                    >
                      {product.sku}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="font-medium text-[var(--black)] hover:text-[var(--brand)]"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--mid)]">
                    {cat ? `${cat.emoji} ${cat.label}` : product.category}
                  </td>
                  <td className="px-4 py-3 text-[var(--black)]">
                    ${Number(product.price).toFixed(2)} MXN
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
                      <span className="text-green-600" title="Enriquecido">✓</span>
                    ) : (
                      <span className="text-orange-400" title="Pendiente">⏳</span>
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
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--mid)]">
                  {q ? (
                    <>
                      No se encontraron productos para &quot;{q}&quot;.{' '}
                      <Link
                        href="/admin/productos"
                        className="font-medium text-[var(--brand)] hover:underline"
                      >
                        Ver todos
                      </Link>
                    </>
                  ) : (
                    <>
                      No hay productos aún.{' '}
                      <Link
                        href="/admin/productos/nuevo"
                        className="font-medium text-[var(--brand)] hover:underline"
                      >
                        Agrega el primero
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-[var(--mid)]">
            Mostrando {showingFrom.toLocaleString('es-MX')}-
            {showingTo.toLocaleString('es-MX')} de{' '}
            {totalCount.toLocaleString('es-MX')} productos
          </p>
          <div className="flex items-center gap-1">
            {currentPage > 1 ? (
              <Link
                href={buildHref({ q, page: currentPage - 1 })}
                className="rounded-lg border border-[var(--light)] px-3 py-1.5 text-sm font-medium text-[var(--mid)] transition hover:bg-[var(--pale)]"
              >
                Anterior
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-[var(--light)]/50 px-3 py-1.5 text-sm font-medium text-[var(--light)]">
                Anterior
              </span>
            )}

            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-sm text-[var(--mid)]">
                  ...
                </span>
              ) : (
                <Link
                  key={p}
                  href={buildHref({ q, page: p })}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                    p === currentPage
                      ? 'bg-[var(--brand)] text-white'
                      : 'text-[var(--mid)] hover:bg-[var(--pale)]'
                  }`}
                >
                  {p}
                </Link>
              )
            )}

            {currentPage < totalPages ? (
              <Link
                href={buildHref({ q, page: currentPage + 1 })}
                className="rounded-lg border border-[var(--light)] px-3 py-1.5 text-sm font-medium text-[var(--mid)] transition hover:bg-[var(--pale)]"
              >
                Siguiente
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-[var(--light)]/50 px-3 py-1.5 text-sm font-medium text-[var(--light)]">
                Siguiente
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
