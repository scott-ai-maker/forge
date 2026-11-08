/**
 * Forge Athletic Launch & Unmasking Configuration
 *
 * Target Go-Live Date Strategy:
 * Black Friday, November 27, 2026 at 06:00:00 EST.
 *
 * Strategic Black Friday Event Rationale:
 * 1. Flagship Black Friday Unmasking Event (Friday, Nov 27 at 06:00 AM EST), giving an exclusive
 *    3-week pre-launch waitlist runway to build high-intent Founding Member reservations.
 * 2. Captures peak Black Friday / Cyber Weekend attention right after Thanksgiving (Nov 26),
 *    when people are ready to lock in a structured game plan before December and January.
 * 3. Includes the Holiday Founding Member Deal (Code: HOLIDAY25): 25% Lifetime Rate Lock on any tier
 *    plus a complimentary 60-minute Pre-Holiday Movement Screen with Coach Gordon.
 */

export const DEFAULT_GO_LIVE_DATE_ISO = '2026-11-27T06:00:00-05:00'

export const HOLIDAY_DEAL_PROMO = {
  code: 'HOLIDAY25',
  discountPercent: 25,
  badge: 'BLACK FRIDAY FOUNDING DEAL · 25% LIFETIME RATE LOCK',
  headline: '25% Lifetime Rate Lock + Free 60-Min Pre-Holiday Movement Screen',
  summary:
    'Lock in 25% off any membership tier for life plus a complimentary 60-minute 1-on-1 remote movement screen with Coach Gordon.',
  expiresFormatted: 'Cyber Monday, November 30, 2026 at 11:59 PM EST',
} as const

export const LAUNCH_CAMPAIGN_INFO = {
  title: 'The Black Friday Pre-Launch Unmasking',
  dateFormatted: 'Black Friday, November 27, 2026',
  timeFormatted: '06:00 AM EST',
  tagline: 'Don’t wait for January to repair what November broke.',
  cohortCap: 50,
  cohortClaimedInitial: 38,
  promoCode: HOLIDAY_DEAL_PROMO.code,
  promoDiscountPercent: HOLIDAY_DEAL_PROMO.discountPercent,
  promoHeadline: HOLIDAY_DEAL_PROMO.headline,
} as const

/**
 * Returns the resolved go-live Date object, with support for environment override.
 */
export function getGoLiveDate(): Date {
  const envDate = process.env.NEXT_PUBLIC_GO_LIVE_DATE
  if (envDate) {
    const parsed = new Date(envDate)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return new Date(DEFAULT_GO_LIVE_DATE_ISO)
}

/**
 * Determines whether the public website should be unmasked.
 * Unmasked if:
 * 1. NEXT_PUBLIC_SITE_UNMASKED is explicitly set to 'true'
 * 2. Preview query parameter is present (e.g. ?preview=true)
 * 3. The current time has surpassed the target go-live date.
 */
export function isSiteUnmasked(previewParam?: string | null): boolean {
  if (process.env.NEXT_PUBLIC_SITE_UNMASKED === 'true') {
    return true
  }

  if (previewParam === 'true' || previewParam === '1' || previewParam === 'unmask') {
    return true
  }

  const goLiveTime = getGoLiveDate().getTime()
  return Date.now() >= goLiveTime
}

export interface TimeRemaining {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isLive: boolean
}

/**
 * Calculates remaining time until target date.
 */
export function calculateTimeRemaining(targetDate: Date, fromDate: Date = new Date()): TimeRemaining {
  const totalMs = targetDate.getTime() - fromDate.getTime()

  if (totalMs <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLive: true,
    }
  }

  const seconds = Math.floor((totalMs / 1000) % 60)
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60)
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24)
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24))

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isLive: false,
  }
}
