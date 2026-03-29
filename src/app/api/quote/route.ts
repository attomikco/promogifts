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

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
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

    // Send email via Resend
    const resend = getResend()
    await resend.emails.send({
      from: 'Promogifts <onboarding@resend.dev>',
      to: 'ventas@promogifts.com.mx',
      subject: `Nueva cotización: ${productName || 'General'} (${productSku || 'N/A'})`,
      html: `
        <h2>Nueva solicitud de cotización</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Nombre</td><td style="padding:8px;border-bottom:1px solid #eee">${name || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Empresa</td><td style="padding:8px;border-bottom:1px solid #eee">${company || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${email}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Teléfono</td><td style="padding:8px;border-bottom:1px solid #eee">${phone || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Producto</td><td style="padding:8px;border-bottom:1px solid #eee">${productName || '-'} (${productSku || '-'})</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Cantidad</td><td style="padding:8px;border-bottom:1px solid #eee">${quantity || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Mensaje</td><td style="padding:8px;border-bottom:1px solid #eee">${message || '-'}</td></tr>
        </table>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Quote error:', err)
    return NextResponse.json({ error: 'Error al enviar cotización' }, { status: 500 })
  }
}
