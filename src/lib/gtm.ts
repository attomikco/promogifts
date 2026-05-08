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
