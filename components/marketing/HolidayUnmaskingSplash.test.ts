import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  DEFAULT_GO_LIVE_DATE_ISO,
  LAUNCH_CAMPAIGN_INFO,
  calculateTimeRemaining,
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

  it('verifies target go-live date is positioned for the Black Friday launch event', () => {
    const goLiveDate = new Date(DEFAULT_GO_LIVE_DATE_ISO)
    expect(goLiveDate.getFullYear()).toBe(2026)
    expect(goLiveDate.getMonth()).toBe(10) // November (0-indexed)
    expect(goLiveDate.getDate()).toBe(27) // Black Friday, Nov 27, 2026
    expect(goLiveDate.getHours()).toBe(6) // 06:00 AM EST

    // Ensure it falls right after Thanksgiving (Nov 26, 2026) on Black Friday (Nov 27, 2026)
    const thanksgiving2026 = new Date('2026-11-26T00:00:00-05:00')
    const cyberMonday2026 = new Date('2026-11-30T23:59:59-05:00')
    expect(goLiveDate.getTime()).toBeGreaterThan(thanksgiving2026.getTime())
    expect(goLiveDate.getTime()).toBeLessThan(cyberMonday2026.getTime())
  })

  it('validates countdown ticker math correctly decrements towards launch date', () => {
    const launch = new Date('2026-11-27T06:00:00-05:00')
    const simulatedNow = new Date('2026-11-07T06:00:00-05:00') // 20 days out

    const result = calculateTimeRemaining(launch, simulatedNow)
    expect(result.days).toBe(20)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
    expect(result.isLive).toBe(false)
  })

  it('verifies HolidayUnmaskingSplash contains all key branding, showcase video, countdown, and pass minting tokens', () => {
    expect(componentSource).toContain('THE UNMASKING')
    expect(componentSource).toContain('Precision Science. Unbreakable Bodies.')
    expect(componentSource).toContain('/videos/forge-black-friday-showcase.mp4')
    expect(componentSource).toContain('/images/forge-black-friday-showcase-poster.jpg')
    expect(componentSource).toContain('BLACK FRIDAY DOORBUSTER VAULT')
    expect(componentSource).toContain('MUST JOIN ON BLACK FRIDAY (NOV 27) TO UNLOCK DEEP DISCOUNTS')
    expect(componentSource).toContain('/api/waitlist')

    const showcaseVideoPath = path.resolve(process.cwd(), 'public/videos/forge-black-friday-showcase.mp4')
    expect(fs.existsSync(showcaseVideoPath)).toBe(true)
    expect(fs.statSync(showcaseVideoPath).size).toBeGreaterThan(1024 * 1024)

    expect(homePageSource).toContain('BlackFridayShowcaseSection')
    expect(componentSource).toContain('FORGE-HOLIDAY-2026-')
    expect(componentSource).toContain('holiday_unmasking_drop')
    expect(componentSource).toContain('CLAIM FOUNDING MEMBER PASS')
    expect(componentSource).toContain('25% Lifetime Rate Lock')
    expect(componentSource).toContain('Free 60-Min Pre-Holiday Screening')
    expect(componentSource).toContain('HOLIDAY_DEAL_PROMO')
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

  it('verifies Precision Training Sanctuary, Clinical Sports Science, and Human + AI manifesto tokens across marketing surfaces', () => {
    // Splash page assertions
    expect(componentSource).toContain('CLINICAL SPORTS SCIENCE')
    expect(componentSource).toContain('The Precision Training Sanctuary')
    expect(componentSource).toContain('Uninterrupted Flow State')
    expect(componentSource).toContain('Best Tools × Best Coaching')
    expect(componentSource).toContain('Results-Driven Flywheel')

    // Home page assertions
    expect(homePageSource).toContain('The Precision Training Sanctuary')
    expect(homePageSource).toContain('CLINICAL SPORTS SCIENCE')
    expect(homePageSource).toContain('Best Tools × Best Coaching')

    // Master manifesto document validation
    const manifestoPath = path.resolve(process.cwd(), 'docs/brand-strategy-manifesto.md')
    expect(fs.existsSync(manifestoPath)).toBe(true)
    const manifestoContent = fs.readFileSync(manifestoPath, 'utf-8')
    expect(manifestoContent).toContain('The Precision Training Sanctuary')
    expect(manifestoContent).toContain('Clinical Sports Science')
    expect(manifestoContent).toContain('The Triad of Organic Growth')
    expect(manifestoContent).toContain('HIGH-INTENT ORGANIC SEO')
    expect(manifestoContent).toContain('RECOMMENDATION & REFERRAL ENGINE')
    expect(manifestoContent).toContain('THE GOAL-ACHIEVING APP (THE MOAT)')
    expect(manifestoContent).toContain('THE BEST COMPUTATIONAL TOOLS')
    expect(manifestoContent).toContain('THE BEST MASTER COACHING')
  })
})

