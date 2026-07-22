import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED = new Set(['new', 'followed_up', 'replied', 'closed'])

export async function POST(request: Request) {
  // Defense-in-depth: proxy.ts already gates /api/admin/**, but verify here too.
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, status } = await request.json().catch(() => ({}))
  if (!id || typeof id !== 'string' || !ALLOWED.has(status)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('quote_requests')
    .update({ status })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
