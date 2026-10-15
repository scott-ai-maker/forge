import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  DEFAULT_GO_LIVE_DATE_ISO,
  LAUNCH_CAMPAIGN_INFO,
  calculateTimeRemaining,
  isSiteUnmasked,
} from '@/lib/launch-config'

describe('HolidayUnmaskingSplash & Parked Pre-Launch Engine', () => {
  const componentSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/marketing/HolidayUnmaskingSplash.tsx'),
    'utf-8'
  )
  const homePageSource = fs.readFileSync(
    path.resolve(process.cwd(), 'app/page.tsx'),
    'utf-8'
  )

  it('verifies target go-live date is positioned for optimal holiday rush timing', () => {
    const goLiveDate = new Date(DEFAULT_GO_LIVE_DATE_ISO)
    expect(goLiveDate.getFullYear()).toBe(2026)
    expect(goLiveDate.getMonth()).toBe(10) // November (0-indexed)
    expect(goLiveDate.getDate()).toBe(20) // Friday, Nov 20, 2026
    expect(goLiveDate.getHours()).toBe(6) // 06:00 AM EST

    // Ensure it falls before Thanksgiving (Nov 26, 2026) and Black Friday (Nov 27, 2026)
    const thanksgiving2026 = new Date('2026-11-26T00:00:00-05:00')
    const blackFriday2026 = new Date('2026-11-27T00:00:00-05:00')
    expect(goLiveDate.getTime()).toBeLessThan(thanksgiving2026.getTime())
    expect(goLiveDate.getTime()).toBeLessThan(blackFriday2026.getTime())
  })

  it('validates countdown ticker math correctly decrements towards launch date', () => {
    const launch = new Date('2026-11-20T06:00:00-05:00')
    const simulatedNow = new Date('2026-11-10T06:00:00-05:00') // 10 days out

    const result = calculateTimeRemaining(launch, simulatedNow)
    expect(result.days).toBe(10)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
    expect(result.isLive).toBe(false)
  })

  it('verifies HolidayUnmaskingSplash contains all key branding, countdown, and pass minting tokens', () => {
    expect(componentSource).toContain('THE UNMASKING')
    expect(componentSource).toContain('Precision Science. Unbreakable Bodies.')
    expect(componentSource).toContain('/api/waitlist')
    expect(componentSource).toContain('FORGE-HOLIDAY-2026-')
    expect(componentSource).toContain('holiday_unmasking_drop')
    expect(componentSource).toContain('CLAIM FOUNDING MEMBER PASS')
    expect(componentSource).toContain('Lifetime Rate Lock')
    expect(componentSource).toContain('Pre-Holiday 1-on-1 Screening')
    expect(componentSource).toContain('Member Sign In')
    expect(componentSource).toContain('Coach Portal')
    expect(componentSource).toContain('Founding Partner Pass')
    expect(componentSource).toContain('Metabolic Health & Sleep Recovery')
    expect(componentSource.toLowerCase()).not.toContain('executive')
    expect(componentSource).toContain('First 50 Founding Members')
    expect(componentSource).toContain('12 of 50 Spots Left')
  })

  it('verifies root app/page.tsx gates visitors to HolidayUnmaskingSplash while parked', () => {
    expect(homePageSource).toContain('HolidayUnmaskingSplash')
    expect(homePageSource).toContain('isSiteUnmasked')
    expect(homePageSource).toContain('searchParams')
  })

  it('verifies staff preview route exists and allows unmasked inspection', () => {
    const previewRoutePath = path.resolve(process.cwd(), 'app/preview/page.tsx')
    expect(fs.existsSync(previewRoutePath)).toBe(true)

    const previewSource = fs.readFileSync(previewRoutePath, 'utf-8')
    expect(previewSource).toContain('FullMarketingHome')
    expect(previewSource).toContain('isPreview={true}')
  })

  it('verifies cohort cap of 50 with initial reservation allocation', () => {
    expect(LAUNCH_CAMPAIGN_INFO.cohortCap).toBe(50)
    expect(LAUNCH_CAMPAIGN_INFO.cohortClaimedInitial).toBe(38)
    const remaining = LAUNCH_CAMPAIGN_INFO.cohortCap - LAUNCH_CAMPAIGN_INFO.cohortClaimedInitial
    expect(remaining).toBe(12)
  })
})
