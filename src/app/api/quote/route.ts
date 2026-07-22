// quote_requests columns (see migration in AGENTS report):
//   name, company, email, phone, product_name, product_sku, quantity, message,
//   items jsonb, status text default 'new', followup_sent_at timestamptz,
//   created_at timestamptz default now()

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  adminQuoteEmail,
  customerQuoteEmail,
  type QuoteItem,
} from '@/lib/email'

const ADMIN_EMAILS = ['info@promogifts.com.mx', 'pablo@attomik.co']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'Promogifts <info@promogifts.com.mx>'
}

function normalizeItems(body: any): QuoteItem[] {
  if (Array.isArray(body.items)) {
    return body.items
      .filter((it: any) => it && (it.name || it.sku))
      .map((it: any) => ({
        name: String(it.name ?? it.sku),
        sku: it.sku ? String(it.sku) : null,
        quantity: it.quantity != null ? Number(it.quantity) : null,
      }))
  }
  if (body.productName) {
    return [
      {
        name: String(body.productName),
        sku: body.productSku ? String(body.productSku) : null,
        quantity: body.quantity != null ? Number(body.quantity) : null,
      },
    ]
  }
  return []
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, company, email, phone, message } = body

    // --- Anti-spam honeypot: pretend success, do nothing ---
    if (body.website) {
      return NextResponse.json({ success: true })
    }

    if (!email || !EMAIL_RE.test(String(email))) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const items = normalizeItems(body)
    const isCart = Array.isArray(body.items) && items.length > 0
    const isProductQuote = items.length > 0

    // Denormalized single-product fields (backward compatible + admin display)
    const primary = items[0]
    const productName = isCart
      ? `${primary.name}${items.length > 1 ? ` +${items.length - 1} más` : ''}`
      : (primary?.name ?? null)
    const productSku = primary?.sku ?? null
    const quantity = isCart ? null : (primary?.quantity ?? null)

    // --- Save lead ---
    await supabaseAdmin.from('quote_requests').insert({
      name,
      company,
      email,
      phone,
      product_name: productName,
      product_sku: productSku,
      quantity,
      message,
      items: isProductQuote ? items : null,
      status: 'new',
    })

    // --- Admin notification (required) ---
    if (!process.env.RESEND_API_KEY) {
      console.error('Quote: RESEND_API_KEY is not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const resend = getResend()
    const admin = adminQuoteEmail({
      name,
      company,
      email,
      phone,
      message,
      items: isCart ? items : undefined,
      productName: !isCart ? (primary?.name ?? undefined) : undefined,
      productSku: !isCart ? (primary?.sku ?? undefined) : undefined,
      quantity: !isCart ? (primary?.quantity ?? undefined) : undefined,
    })

    const { data, error } = await resend.emails.send({
      from: fromEmail(),
      to: ADMIN_EMAILS,
      replyTo: email,
      subject: admin.subject,
      html: admin.html,
    })

    if (error) {
      console.error('Quote: Resend admin send failed:', error)
      return NextResponse.json(
        { error: `Resend: ${error.message || 'unknown error'}` },
        { status: 500 }
      )
    }
    console.log('Quote: admin email ok, id=', data?.id)

    // --- Customer auto-reply (best-effort; never fails the request) ---
    try {
      const customer = customerQuoteEmail({
        name,
        items: isCart ? items : undefined,
        productName: !isCart ? (primary?.name ?? undefined) : undefined,
        productSku: !isCart ? (primary?.sku ?? undefined) : undefined,
        quantity: !isCart ? (primary?.quantity ?? undefined) : undefined,
      })
      const { error: custErr } = await resend.emails.send({
        from: fromEmail(),
        to: [email],
        subject: customer.subject,
        html: customer.html,
      })
      if (custErr) console.error('Quote: customer auto-reply failed:', custErr)
    } catch (e) {
      console.error('Quote: customer auto-reply threw:', e)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Quote error:', err)
    return NextResponse.json({ error: 'Error al enviar cotización' }, { status: 500 })
  }
}
