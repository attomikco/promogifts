import ProductForm from '@/components/admin/ProductForm'

export default function NuevoProductoPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-[var(--black)]">
        Nuevo producto
      </h1>
      <ProductForm />
    </div>
  )
}
