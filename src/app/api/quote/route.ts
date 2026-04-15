// SQL migration — run in Supabase SQL Editor:
// create table quote_requests (
//   id uuid primary key default gen_random_uuid(),
//   name text, company text, email text not null,
//   phone text, product_name text, product_sku text,
//   quantity integer, message text,
//   created_at timestamptz default now()
// );
// alter table quote_requests enable row level security;
// create policy "service role only" on quote_requests
//   for all using (auth.role() = 'service_role');

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'info@promogifts.com.mx'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, company, email, phone, productName, productSku, quantity, message } =
      body

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }

    // Save to DB
    await supabaseAdmin.from('quote_requests').insert({
      name,
      company,
      email,
      phone,
      product_name: productName,
      product_sku: productSku,
      quantity,
      message,
    })

    // Build email
    const isProductQuote = !!productName
    const subject = isProductQuote
      ? `Nueva cotización: ${productName} (${productSku || 'N/A'})`
      : `Nuevo mensaje de contacto de ${name || 'un visitante'}`

    const rows = [
      { label: 'Nombre', value: name },
      { label: 'Empresa', value: company },
      { label: 'Email', value: email },
      { label: 'Teléfono', value: phone },
      ...(isProductQuote
        ? [
            { label: 'Producto', value: `${productName} (${productSku || '-'})` },
            { label: 'Cantidad', value: quantity },
          ]
        : []),
      { label: 'Mensaje', value: message },
    ]

    const tableRows = rows
      .map(
        (r) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #DDDDF0;font-weight:600;color:#1A1A2E;width:120px;vertical-align:top">${r.label}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #DDDDF0;color:#6B6B8A">${escapeHtml(String(r.value || '-'))}</td>
        </tr>`
      )
      .join('')

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#3D3CB8;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">
            ${isProductQuote ? 'Nueva Solicitud de Cotización' : 'Nuevo Mensaje de Contacto'}
          </h1>
        </div>
        <div style="border:1px solid #DDDDF0;border-top:0;border-radius:0 0 12px 12px;padding:24px 0">
          <table style="border-collapse:collapse;width:100%">
            ${tableRows}
          </table>
        </div>
        <p style="margin-top:16px;font-size:12px;color:#6B6B8A;text-align:center">
          Este mensaje fue enviado desde el formulario de promogifts.com.mx
        </p>
      </div>
    `

    // Send email via Resend
    const resend = getResend()
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Promogifts <info@promogifts.com.mx>',
      to: ADMIN_EMAIL,
      replyTo: email,
      subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Quote error:', err)
    return NextResponse.json({ error: 'Error al enviar cotización' }, { status: 500 })
  }
}
