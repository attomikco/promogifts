import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-[var(--black)] px-4 py-6 text-white">
        <Link href="/admin/productos" className="mb-8 text-xl font-bold tracking-tight">
          <span className="text-[var(--brand)]">PROMO</span>
          <span className="text-white">GIFTS</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <Link
            href="/admin/productos"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Productos
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            + Agregar producto
          </Link>
        </nav>

        <div className="border-t border-white/10 pt-4">
          <p className="mb-2 truncate text-xs text-white/40">{user?.email ?? ''}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[var(--pale)] p-8">{children}</main>
    </div>
  )
}
