declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function pushToDataLayer(event: Record<string, any>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)
}

// --- Named conversion events (Promogifts) ---

export function trackGenerateLead(data: Record<string, any>) {
  pushToDataLayer({ event: 'generate_lead', ...data })
}

export function trackAddToQuote(data: { product_sku?: string; product_name?: string }) {
  pushToDataLayer({ event: 'add_to_quote', ...data })
}

export function trackContactWhatsApp(data: { product_sku?: string } = {}) {
  pushToDataLayer({ event: 'contact_whatsapp', ...data })
}

export function trackContactPhone(data: { product_sku?: string } = {}) {
  pushToDataLayer({ event: 'contact_phone', ...data })
}
