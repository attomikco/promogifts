import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ProductForm from '@/components/admin/ProductForm'
import type { Product } from '@/lib/types'

export default async function EditProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const product = data as Product

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--black)]">
        Editar: {product.name}
      </h1>
      <ProductForm product={product} />
    </div>
  )
}
