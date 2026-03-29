import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ is_published: true })
      .eq('is_published', false)
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: data?.length ?? 0 })
  } catch (err) {
    console.error('Bulk publish error:', err)
    return NextResponse.json({ error: 'Error al publicar' }, { status: 500 })
  }
}
