import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  DEFAULT_GO_LIVE_DATE_ISO,
  LAUNCH_CAMPAIGN_INFO,
  calculateTimeRemaining,
} from '@/lib/launch-config'

describe('HolidayUnmaskingSplash & Overhauled Public Landing Showcase', () => {
  const componentSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/marketing/HolidayUnmaskingSplash.tsx'),
    'utf-8'
  )
  const homePageSource = fs.readFileSync(
    path.resolve(process.cwd(), 'app/page.tsx'),
    'utf-8'
  )
  const sneakPeekSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/marketing/AppSneakPeekShowcase.tsx'),
    'utf-8'
  )
  const pricingGridSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/packages/FoundingRateLockPricingGrid.tsx'),
    'utf-8'
  )
  const socialProofSource = fs.readFileSync(
    path.resolve(process.cwd(), 'lib/landingSocialProof.ts'),
    'utf-8'
  )

  it('verifies target go-live date is positioned for Monday, January 4, 2027 at 06:00 AM EST', () => {
    const goLiveDate = new Date(DEFAULT_GO_LIVE_DATE_ISO)
    expect(goLiveDate.getFullYear()).toBe(2027)
    expect(goLiveDate.getMonth()).toBe(0) // January (0-indexed)
    expect(goLiveDate.getDate()).toBe(4) // Monday, Jan 4, 2027
    expect(goLiveDate.getHours()).toBe(6) // 06:00 AM EST

    const newYear2027 = new Date('2027-01-01T00:00:00-05:00')
    expect(goLiveDate.getTime()).toBeGreaterThan(newYear2027.getTime())
  })

  it('validates countdown ticker math correctly decrements towards launch date', () => {
    const launch = new Date('2027-01-04T06:00:00-05:00')
    const simulatedNow = new Date('2026-12-15T06:00:00-05:00') // 20 days out

    const result = calculateTimeRemaining(launch, simulatedNow)
    expect(result.days).toBe(20)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
    expect(result.isLive).toBe(false)
  })

  it('verifies grounded Hero copy, showcase video, SMS friction guardrail, and pass minting tokens', () => {
    const normalizedComponent = componentSource.replace(/\s+/g, ' ')
    expect(normalizedComponent).toContain(
      'FOUNDING COHORT (50 SPOTS) · OPENS MONDAY, JAN 4, 2027 AT 6:00 AM EST'
    )
    expect(normalizedComponent).toContain('Start 2027 with joint-first precision—not a 3-week resolution.')
    expect(normalizedComponent).toContain(
      'A real NASM-certified personal trainer at your side—combining 33-point phone camera posture screening, Coach Gordon’s real voice pacing every rep, and direct email or text access whenever you want human eyes on your training.'
    )
    expect(normalizedComponent).toContain('Claim Your Founding Member Pass →')
    expect(normalizedComponent).toContain('Add SMS launch alert (optional)')
    expect(normalizedComponent).toContain(
      'Includes your Founding Member Continuous Tier Rate Lock, a complimentary 1-on-1 kickoff movement screening with Coach Gordon, and 1 free 30-day Founding Partner Pass to gift a spouse or friend.'
    )
    expect(componentSource).toContain('/videos/forge-black-friday-showcase.mp4')
    expect(componentSource).toContain('/images/forge-black-friday-showcase-poster.jpg')
    expect(componentSource).toContain('/api/waitlist')

    const showcaseVideoPath = path.resolve(
      process.cwd(),
      'public/videos/forge-black-friday-showcase.mp4'
    )
    expect(fs.existsSync(showcaseVideoPath)).toBe(true)
    expect(fs.statSync(showcaseVideoPath).size).toBeGreaterThan(1024 * 1024)

    expect(homePageSource).toContain('BlackFridayShowcaseSection')
    expect(componentSource).toContain('FORGE-HOLIDAY-2026-')
    expect(componentSource).toContain('holiday_unmasking_drop')
    expect(componentSource).toContain('HOLIDAY_DEAL_PROMO')
    expect(componentSource).toContain('Member Sign In')
    expect(componentSource).toContain('Coach Portal')
    expect(componentSource).toContain('Founding Partner Pass')
    expect(componentSource.toLowerCase()).not.toContain('executive')
    expect(componentSource).toContain('Founding Launch Registration')
    expect(componentSource).not.toContain('Spots Left')
    expect(componentSource).not.toContain('Math.random() * 36')
  })

  it('verifies all 6 smooth-scroll navigation anchors exist and zero benched Live Studio / $180 strings remain', () => {
    for (const anchor of [
      '#sneak-peek',
      '#features',
      '#how-it-works',
      '#coach',
      '#pricing',
      '#faq',
    ]) {
      expect(componentSource).toContain(anchor)
      expect(homePageSource).toContain(anchor)
    }

    const combinedPublicMarketing = [
      componentSource,
      homePageSource,
      sneakPeekSource,
      pricingGridSource,
      socialProofSource,
    ].join('\n')

    expect(combinedPublicMarketing).not.toMatch(/live studio/i)
    expect(combinedPublicMarketing).not.toContain('$180')
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

  it('verifies truthful 15-seat active Coach Support roster cap with zero fabricated claimed-spot counters', () => {
    expect(LAUNCH_CAMPAIGN_INFO.activeCoachSupportRosterCap).toBe(15)
    expect('cohortClaimedInitial' in LAUNCH_CAMPAIGN_INFO).toBe(false)
  })

  it('verifies Precision Training Sanctuary, Clinical Sports Science, and Human + AI manifesto tokens across marketing surfaces', () => {
    expect(componentSource).toContain('CLINICAL SPORTS SCIENCE')
    expect(componentSource).toContain('The Precision Training Sanctuary')
    expect(componentSource).toContain('Uninterrupted Flow State')
    expect(componentSource).toContain('Best Tools × Best Coaching')
    expect(componentSource).toContain('Results-Driven Flywheel')

    expect(homePageSource).toContain('The Precision Training Sanctuary')
    expect(homePageSource).toContain('CLINICAL SPORTS SCIENCE')
    expect(homePageSource).toContain('Best Tools × Best Coaching')

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
