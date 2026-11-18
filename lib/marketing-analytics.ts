export type MarketingEventPayload = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void
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

/**
 * First-party / privacy-preserving marketing event dispatcher.
 * Forge Athletic maintains a strict Zero Google Analytics / Zero Behavioral Ad Pixel policy (#52).
 */
export function trackMarketingEvent(eventName: string, payload: MarketingEventPayload = {}) {
  if (typeof window === 'undefined') return

  const normalized = normalizePayload(payload) as Record<string, string | number | boolean | null>

  window.plausible?.(eventName, { props: plausiblePayload(normalized) })
  window.dispatchEvent(new CustomEvent('sgf:marketing-event', { detail: { eventName, payload: normalized } }))

  if (process.env.NODE_ENV !== 'production') {
    console.info('[marketing-event]', eventName, normalized)
  }
}
