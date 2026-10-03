export type MarketingEventPayload = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void
    dataLayer?: Array<Record<string, unknown>>
  }
}

function normalizePayload(payload: MarketingEventPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  )
}

function plausiblePayload(payload: Record<string, string | number | boolean | null>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null)
  ) as Record<string, string | number | boolean>
}

export function trackMarketingEvent(eventName: string, payload: MarketingEventPayload = {}) {
  if (typeof window === 'undefined') return

  const normalized = normalizePayload(payload) as Record<string, string | number | boolean | null>

  window.gtag?.('event', eventName, normalized)
  window.plausible?.(eventName, { props: plausiblePayload(normalized) })
  window.dataLayer?.push({ event: eventName, ...normalized })
  window.dispatchEvent(new CustomEvent('sgf:marketing-event', { detail: { eventName, payload: normalized } }))

  if (process.env.NODE_ENV !== 'production') {
    console.info('[marketing-event]', eventName, normalized)
  }
}
