// Branded email templates for Promogifts (Mexican Spanish, brand color #3D3CB8).
// Shared by /api/quote (admin + customer) and /api/cron/followup.

const BRAND = '#3D3CB8'
const BORDER = '#DDDDF0'
const TEXT = '#1A1A2E'
const MUTED = '#6B6B8A'
const WHATSAPP_NUMBER = '525530297582'

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type QuoteItem = { name: string; sku?: string | null; quantity?: number | null }

function whatsappUrl(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

function whatsappButton(text: string, label = 'Escríbenos por WhatsApp') {
  return `
    <a href="${whatsappUrl(text)}" target="_blank"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:9999px;font-size:14px">
      ${escapeHtml(label)}
    </a>`
}

function shell(title: string, inner: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:${BRAND};padding:24px 32px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;color:#fff;font-size:20px">${escapeHtml(title)}</h1>
    </div>
    <div style="border:1px solid ${BORDER};border-top:0;border-radius:0 0 12px 12px;padding:24px 28px;color:${TEXT}">
      ${inner}
    </div>
    <p style="margin-top:16px;font-size:12px;color:${MUTED};text-align:center">
      Promogifts &mdash; Artículos promocionales personalizados &middot; promogifts.com.mx
    </p>
  </div>`
}

function keyValueTable(rows: { label: string; value: unknown }[]): string {
  const body = rows
    .filter((r) => r.value !== undefined && r.value !== null && String(r.value) !== '')
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};font-weight:600;color:${TEXT};width:130px;vertical-align:top">${escapeHtml(r.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};color:${MUTED}">${escapeHtml(String(r.value))}</td>
        </tr>`
    )
    .join('')
  return `<table style="border-collapse:collapse;width:100%">${body}</table>`
}

function itemsTable(items: QuoteItem[]): string {
  const rows = items
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};color:${TEXT}">${escapeHtml(it.name)}${it.sku ? ` <span style="color:${MUTED};font-size:12px">(${escapeHtml(String(it.sku))})</span>` : ''}</td>
          <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};color:${MUTED};text-align:right;white-space:nowrap">${escapeHtml(String(it.quantity ?? '-'))} pz</td>
        </tr>`
    )
    .join('')
  return `
    <table style="border-collapse:collapse;width:100%;margin-top:8px">
      <thead>
        <tr>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:${MUTED};border-bottom:2px solid ${BORDER}">Producto</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:${MUTED};border-bottom:2px solid ${BORDER}">Cantidad</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ---------- Admin notification ----------

export function adminQuoteEmail(opts: {
  name?: string
  company?: string
  email: string
  phone?: string
  message?: string
  items?: QuoteItem[]
  // single-product legacy fields
  productName?: string
  productSku?: string
  quantity?: number
}): { subject: string; html: string } {
  const { name, company, email, phone, message, items, productName, productSku, quantity } = opts
  const isCart = Array.isArray(items) && items.length > 0
  const isProduct = !!productName

  const subject = isCart
    ? `Nueva cotización (${items!.length} producto${items!.length !== 1 ? 's' : ''}) de ${name || 'un visitante'}`
    : isProduct
      ? `Nueva cotización: ${productName} (${productSku || 'N/A'})`
      : `Nuevo mensaje de contacto de ${name || 'un visitante'}`

  const contactRows = keyValueTable([
    { label: 'Nombre', value: name },
    { label: 'Empresa', value: company },
    { label: 'Email', value: email },
    { label: 'Teléfono', value: phone },
    ...(isProduct && !isCart
      ? [
          { label: 'Producto', value: `${productName} (${productSku || '-'})` },
          { label: 'Cantidad', value: quantity },
        ]
      : []),
    { label: 'Mensaje', value: message },
  ])

  const inner = `
    ${contactRows}
    ${isCart ? `<h2 style="font-size:15px;color:${TEXT};margin:20px 0 0">Productos solicitados</h2>${itemsTable(items!)}` : ''}
  `
  return {
    subject,
    html: shell(isCart || isProduct ? 'Nueva Solicitud de Cotización' : 'Nuevo Mensaje de Contacto', inner),
  }
}

// ---------- Customer auto-reply ----------

export function customerQuoteEmail(opts: {
  name?: string
  items?: QuoteItem[]
  productName?: string
  productSku?: string
  quantity?: number
}): { subject: string; html: string } {
  const { name, items, productName, productSku, quantity } = opts
  const isCart = Array.isArray(items) && items.length > 0
  const greeting = name ? `Hola ${escapeHtml(name.split(' ')[0])},` : 'Hola,'

  const summary = isCart
    ? itemsTable(items!)
    : productName
      ? itemsTable([{ name: productName, sku: productSku, quantity }])
      : ''

  const inner = `
    <p style="margin:0 0 12px;font-size:15px">${greeting}</p>
    <p style="margin:0 0 12px;color:${MUTED};line-height:1.6">
      Recibimos tu solicitud de cotización. Un asesor la está revisando y te
      responderá con precios y disponibilidad en <strong style="color:${TEXT}">menos de 4 horas hábiles</strong>.
    </p>
    ${summary ? `<h2 style="font-size:15px;color:${TEXT};margin:20px 0 0">Resumen de tu solicitud</h2>${summary}` : ''}
    <p style="margin:20px 0 12px;color:${MUTED};line-height:1.6">
      ¿Es urgente? Escríbenos por WhatsApp y te atendemos de inmediato:
    </p>
    <p style="margin:0 0 8px">
      ${whatsappButton('Hola, acabo de enviar una solicitud de cotización y me gustaría avanzar.', 'Continuar por WhatsApp')}
    </p>
    <p style="margin:20px 0 0;color:${MUTED};line-height:1.6">
      Gracias por considerar a Promogifts para tus artículos promocionales.
    </p>
  `
  return { subject: 'Recibimos tu solicitud de cotización — Promogifts', html: shell('Gracias por tu solicitud', inner) }
}

// ---------- Follow-up (customer) ----------

export function followupEmail(opts: { name?: string; productLabel?: string }): {
  subject: string
  html: string
} {
  const { name, productLabel } = opts
  const greeting = name ? `Hola ${escapeHtml(name.split(' ')[0])},` : 'Hola,'
  const inner = `
    <p style="margin:0 0 12px;font-size:15px">${greeting}</p>
    <p style="margin:0 0 12px;color:${MUTED};line-height:1.6">
      Te escribimos para dar seguimiento a tu solicitud${productLabel ? ` de <strong style="color:${TEXT}">${escapeHtml(productLabel)}</strong>` : ''}.
      ¿Pudiste revisar nuestra propuesta? Seguimos atentos para resolver cualquier duda
      sobre precios por volumen, personalización de logo o tiempos de entrega.
    </p>
    <p style="margin:0 0 8px">
      ${whatsappButton('Hola, quisiera retomar mi cotización con Promogifts.', 'Retomar por WhatsApp')}
    </p>
    <p style="margin:20px 0 0;color:${MUTED};line-height:1.6">
      Estamos para ayudarte. — Equipo Promogifts
    </p>
  `
  return { subject: 'Seguimos atentos a tu cotización — Promogifts', html: shell('¿Cómo vamos con tu cotización?', inner) }
}

// ---------- Weekly admin digest ----------

export function digestEmail(
  leads: {
    name?: string
    productLabel: string
    quantity?: number | null
    daysWaiting: number
    status: string
  }[]
): { subject: string; html: string } {
  const rows = leads
    .map(
      (l) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDER};color:${TEXT}">${escapeHtml(l.name || '-')}</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDER};color:${MUTED}">${escapeHtml(l.productLabel)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDER};color:${MUTED};text-align:right">${escapeHtml(String(l.quantity ?? '-'))}</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDER};color:${MUTED};text-align:right">${l.daysWaiting} d</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDER};color:${MUTED}">${escapeHtml(l.status)}</td>
        </tr>`
    )
    .join('')
  const inner = `
    <p style="margin:0 0 12px;color:${MUTED};line-height:1.6">
      Leads abiertos de los últimos 14 días (${leads.length}):
    </p>
    <table style="border-collapse:collapse;width:100%">
      <thead>
        <tr>
          ${['Cliente', 'Producto', 'Cant.', 'Espera', 'Estado']
            .map(
              (h, i) =>
                `<th style="padding:8px 10px;text-align:${i >= 2 && i <= 3 ? 'right' : 'left'};font-size:12px;color:${MUTED};border-bottom:2px solid ${BORDER}">${h}</th>`
            )
            .join('')}
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" style="padding:16px;text-align:center;color:${MUTED}">Sin leads abiertos 🎉</td></tr>`}</tbody>
    </table>
  `
  return { subject: `Resumen semanal de leads — ${leads.length} abierto${leads.length !== 1 ? 's' : ''}`, html: shell('Resumen semanal de leads', inner) }
}
