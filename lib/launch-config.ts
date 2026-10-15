/**
 * Forge Athletic Launch & Unmasking Configuration
 *
 * Target Go-Live Date Strategy:
 * Friday, November 20, 2026 at 06:00:00 EST.
 *
 * Strategic Holiday Rush Timing Rationale:
 * 1. Exactly 6 days before Thanksgiving (Nov 26) and 1 week before Black Friday (Nov 27).
 * 2. Front-runs the high-friction holiday party and travel season, capturing motivated
 *    professionals looking to protect posture, joints, and energy BEFORE holiday disruptions.
 * 3. Provides a 5-week runway to establish structured training habits before the crowded,
 *    high-churn January resolutioner noise.
 * 4. Allows Founding Members to complete their 1-on-1 movement assessments and receive their
 *    custom NASM OPT™ program before Thanksgiving dinner.
 */

export const DEFAULT_GO_LIVE_DATE_ISO = '2026-11-20T06:00:00-05:00'

export const LAUNCH_CAMPAIGN_INFO = {
  title: 'The Holiday Pre-Launch Unmasking',
  dateFormatted: 'Friday, November 20, 2026',
  timeFormatted: '06:00 AM EST',
  tagline: 'Don’t wait for January to repair what November broke.',
  cohortCap: 50,
  cohortClaimedInitial: 38,
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
