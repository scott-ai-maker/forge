import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  DEFAULT_GO_LIVE_DATE_ISO,
  LAUNCH_CAMPAIGN_INFO,
  calculateTimeRemaining,
} from '@/lib/launch-config'

describe('HolidayUnmaskingSplash & Streamlined Jan 4 Founding Cohort Landing', () => {
  const componentSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/marketing/HolidayUnmaskingSplash.tsx'),
    'utf-8'
  )
  const liveHomeSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/marketing/LiveLandingHome.tsx'),
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
    expect(goLiveDate.getMonth()).toBe(0)
    expect(goLiveDate.getDate()).toBe(4)
    expect(goLiveDate.getHours()).toBe(6)

    const newYear2027 = new Date('2027-01-01T00:00:00-05:00')
    expect(goLiveDate.getTime()).toBeGreaterThan(newYear2027.getTime())
  })

  it('validates countdown ticker math correctly decrements towards launch date', () => {
    const launch = new Date('2027-01-04T06:00:00-05:00')
    const simulatedNow = new Date('2026-12-15T06:00:00-05:00')

    const result = calculateTimeRemaining(launch, simulatedNow)
    expect(result.days).toBe(20)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
    expect(result.isLive).toBe(false)
  })

  it('verifies grounded Hero copy, HOLIDAY25 registration flow, and zero SFX/clutter gimmicks', () => {
    const normalizedComponent = componentSource.replace(/\s+/g, ' ')
    expect(normalizedComponent).toContain('Founding Cohort (50 Spots) · Opens Monday, Jan 4, 2027')
    expect(normalizedComponent).toContain('Start 2027 with joint-first precision—not a 3-week resolution.')
    expect(normalizedComponent).toContain('Claim Your Founding Member Pass →')
    expect(normalizedComponent).toContain('Add optional SMS launch alert')
    expect(componentSource).toContain('/api/waitlist')
    expect(componentSource).toContain('FORGE-FOUNDING-2027-')
    expect(componentSource).toContain('holiday_unmasking_drop')
    expect(componentSource).toContain('HOLIDAY_DEAL_PROMO')
    expect(componentSource).toContain('Member Sign In')
    expect(componentSource).toContain('Coach Portal')
    expect(componentSource).not.toContain('SFX MUTED')
    expect(componentSource).not.toContain('Spots Left')
    expect(componentSource).not.toContain('Math.random() * 36')
    expect(sneakPeekSource).not.toContain('FORGE LAB //')
  })

  it('verifies streamlined 4-link navigation anchors, active Live 1-on-1 & Team Studio ad-copy/pricing, and zero legacy clutter', () => {
    for (const anchor of ['#how-it-works', '#movement-lab', '#pricing', '#faq']) {
      expect(componentSource).toContain(anchor)
      expect(liveHomeSource).toContain(anchor)
    }

    const combinedPublicMarketing = [
      componentSource,
      liveHomeSource,
      homePageSource,
      sneakPeekSource,
      pricingGridSource,
      socialProofSource,
    ].join('\n')

    expect(combinedPublicMarketing).toMatch(/live.*video studio/i)
    expect(combinedPublicMarketing).toContain('$180')
    expect(combinedPublicMarketing).toContain('/corporate')
    expect(combinedPublicMarketing).not.toMatch(/chrono-dosing/i)
    expect(combinedPublicMarketing).not.toMatch(/tanaka/i)
  })

  it('verifies root app/page.tsx gates visitors to HolidayUnmaskingSplash while parked', () => {
    expect(homePageSource).toContain('HolidayUnmaskingSplash')
    expect(homePageSource).toContain('LiveLandingHome')
    expect(homePageSource).toContain('isSiteUnmasked')
    expect(homePageSource).toContain('searchParams')
  })

  it('verifies staff preview route exists and uses unified LiveLandingHome', () => {
    const previewRoutePath = path.resolve(process.cwd(), 'app/preview/page.tsx')
    expect(fs.existsSync(previewRoutePath)).toBe(true)

    const previewSource = fs.readFileSync(previewRoutePath, 'utf-8')
    expect(previewSource).toContain('LiveLandingHome')
    expect(previewSource).toContain('isPreview={true}')
  })

  it('verifies truthful 15-seat active Coach Support roster cap with zero fabricated claimed-spot counters', () => {
    expect(LAUNCH_CAMPAIGN_INFO.activeCoachSupportRosterCap).toBe(15)
    expect('cohortClaimedInitial' in LAUNCH_CAMPAIGN_INFO).toBe(false)
  })

  it('UAT: verifies every button, #anchor, and internal /route on the splash screen resolves to a real target', () => {
    const everydayMomentsSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/marketing/EverydayMomentsStrip.tsx'),
      'utf-8'
    )
    const faqSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/marketing/LandingFaqAccordion.tsx'),
      'utf-8'
    )
    const splashSurface = [
      componentSource,
      sneakPeekSource,
      everydayMomentsSource,
      pricingGridSource,
      faqSource,
    ].join('\n')

    // 1. Every same-page #anchor in HolidayUnmaskingSplash resolves to a real id="..." on the splash surface
    const samePageAnchors = Array.from(componentSource.matchAll(/href[:=]\s*['"]#([a-z0-9-]+)['"]/gi)).map(m => m[1])
    expect(samePageAnchors.length).toBeGreaterThanOrEqual(4)
    for (const anchorId of new Set(samePageAnchors)) {
      expect(splashSurface).toContain(`id="${anchorId}"`)
    }

    // 2. Top nav anchors match exact top-to-bottom section order (#movement-lab -> #how-it-works -> #pricing -> #faq)
    const movementIdx = componentSource.indexOf("href: '#movement-lab'")
    const howItWorksIdx = componentSource.indexOf("href: '#how-it-works'")
    const pricingIdx = componentSource.indexOf("href: '#pricing'")
    const faqIdx = componentSource.indexOf("href: '#faq'")
    expect(movementIdx).toBeGreaterThan(-1)
    expect(howItWorksIdx).toBeGreaterThan(movementIdx)
    expect(pricingIdx).toBeGreaterThan(howItWorksIdx)
    expect(faqIdx).toBeGreaterThan(pricingIdx)

    // 3. Every internal route linked from the splash screen & Movement Lab exists in app/**/page.tsx
    const allHrefs = Array.from(
      [componentSource, sneakPeekSource, pricingGridSource].join('\n').matchAll(/href=["'](\/[^"']*)["']/g)
    ).map(m => m[1])

    for (const rawHref of new Set(allHrefs)) {
      const [pathWithoutQuery] = rawHref.split('?')
      const [cleanPath, hash] = pathWithoutQuery.split('#')
      const routePageFile =
        cleanPath === '/'
          ? path.resolve(process.cwd(), 'app/page.tsx')
          : path.resolve(process.cwd(), `app${cleanPath}/page.tsx`)
      expect(fs.existsSync(routePageFile), `Missing page.tsx for splash link ${rawHref}`).toBe(true)

      if (hash) {
        const targetPageSource = fs.readFileSync(routePageFile, 'utf-8')
        expect(
          targetPageSource.includes(`id="${hash}"`) || targetPageSource.includes(`id='${hash}'`),
          `Missing anchor #${hash} on ${routePageFile}`
        ).toBe(true)
      }
    }
  })
})
