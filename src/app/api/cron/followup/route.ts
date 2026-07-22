import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { followupEmail, digestEmail, type QuoteItem } from '@/lib/email'

const ADMIN_EMAILS = ['info@promogifts.com.mx', 'pablo@attomik.co']
const MAX_PER_RUN = 20
const DAY_MS = 24 * 60 * 60 * 1000

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'Promogifts <info@promogifts.com.mx>'
}

type Lead = {
  id: string
  name?: string | null
  email: string
  product_name?: string | null
  quantity?: number | null
  items?: QuoteItem[] | null
  status: string
  created_at: string
}

function productLabel(lead: Lead): string {
  if (Array.isArray(lead.items) && lead.items.length > 0) {
    return lead.items.map((i) => i.name).join(', ')
  }
  return lead.product_name ?? 'tu solicitud'
}

export async function GET(request: Request) {
  // --- Auth ---
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const windowStart = new Date(now - 7 * DAY_MS).toISOString() // 7 days ago
  const windowEnd = new Date(now - DAY_MS).toISOString() // 24h ago

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  if (!resend) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  // --- Follow-up: leads 24h–7d old, not yet followed up ---
  const { data: leadsData } = await supabaseAdmin
    .from('quote_requests')
    .select('id, name, email, product_name, quantity, items, status, created_at')
    .eq('status', 'new')
    .is('followup_sent_at', null)
    .gte('created_at', windowStart)
    .lte('created_at', windowEnd)
    .order('created_at', { ascending: true })
    .limit(MAX_PER_RUN)

  const leads = (leadsData ?? []) as Lead[]
  let sent = 0
  const errors: string[] = []

  for (const lead of leads) {
    try {
      const email = followupEmail({ name: lead.name ?? undefined, productLabel: productLabel(lead) })
      const { error } = await resend.emails.send({
        from: fromEmail(),
        to: [lead.email],
        subject: email.subject,
        html: email.html,
      })
      if (error) {
        errors.push(`${lead.id}: ${error.message}`)
        continue
      }
      await supabaseAdmin
        .from('quote_requests')
        .update({ followup_sent_at: nowIso, status: 'followed_up' })
        .eq('id', lead.id)
      sent++
    } catch (e) {
      errors.push(`${lead.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // --- Monday digest: open leads from the last 14 days ---
  let digestSent = false
  const isMonday = new Date(now).getUTCDay() === 1
  if (isMonday) {
    try {
      const digestStart = new Date(now - 14 * DAY_MS).toISOString()
      const { data: openData } = await supabaseAdmin
        .from('quote_requests')
        .select('id, name, email, product_name, quantity, items, status, created_at')
        .in('status', ['new', 'followed_up'])
        .gte('created_at', digestStart)
        .order('created_at', { ascending: true })

      const open = (openData ?? []) as Lead[]
      const digest = digestEmail(
        open.map((l) => ({
          name: l.name ?? undefined,
          productLabel: productLabel(l),
          quantity: l.quantity,
          daysWaiting: Math.floor((now - new Date(l.created_at).getTime()) / DAY_MS),
          status: l.status,
        }))
      )
      const { error } = await resend.emails.send({
        from: fromEmail(),
        to: ADMIN_EMAILS,
        subject: digest.subject,
        html: digest.html,
      })
      if (error) errors.push(`digest: ${error.message}`)
      else digestSent = true
    } catch (e) {
      errors.push(`digest: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json({
    ok: true,
    followups_sent: sent,
    candidates: leads.length,
    digest_sent: digestSent,
    errors,
  })
}
