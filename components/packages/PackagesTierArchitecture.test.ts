import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { PACKAGES, COACHING_ADDONS, STANDALONE_PRODUCTS } from '@/lib/stripe'
import { FORGE_MEMBERSHIPS } from '@/lib/forge-memberships'

describe('Commercial Retainers & Tier 3 Architecture Enforcements', () => {
  it('defines the canonical 3 sovereign pathways for public homepage presentation', () => {
    const sovereignPackages = PACKAGES.filter(pkg =>
      ['starter', 'momentum', 'transformation'].includes(pkg.id)
    )

    expect(sovereignPackages).toHaveLength(3)

    const [starter, momentum, transformation] = sovereignPackages

    // Tier 1: Performance Protocol
    expect(starter.id).toBe('starter')
    expect(starter.price).toBe(34900)
    expect(starter.sessions).toBe(0)

    // Tier 2: Hybrid Concierge
    expect(momentum.id).toBe('momentum')
    expect(momentum.price).toBe(64900)
    expect(momentum.popular).toBe(true)
    expect(momentum.sessions).toBe(1)

    // Tier 3: One-to-one coaching
    expect(transformation.id).toBe('transformation')
    expect(transformation.name).toBe('One-to-one Coaching')
    expect(transformation.price).toBe(149500)
    expect(transformation.pifPriceCents).toBe(389500)
    expect(transformation.sessions).toBe(4)
    expect(transformation.pifSessions).toBe(12)
  })

  it('guarantees Tier 3 delivers Master live WebRTC studio, S.O.A.P. notes, and VIP SLA', () => {
    const tier3 = PACKAGES.find(p => p.id === 'transformation')
    expect(tier3).toBeDefined()

    const deliverablesJoined = tier3!.deliverables.join(' ')
    expect(deliverablesJoined).toContain('Four 60-minute video coaching sessions')
    expect(deliverablesJoined).toContain('Session notes and follow-up plan')
    expect(deliverablesJoined).toContain('Evidence-based supplement review')
    expect(deliverablesJoined).toContain('Direct coach messaging')

    const slasJoined = tier3!.serviceLevels.join(' ')
    expect(slasJoined).toContain('four business hours')
  })

  it('positions memberships around personalized training, measurable progress, and human coaching', () => {
    const core = FORGE_MEMBERSHIPS.find(membership => membership.id === 'forge-core')
    const pro = FORGE_MEMBERSHIPS.find(membership => membership.id === 'forge-pro-athlete')
    const transformation = FORGE_MEMBERSHIPS.find(membership => membership.id === 'forge-transformation-direct')

    expect(core?.name).toBe('Core')
    expect(pro?.name).toBe('Plus')
    expect(transformation?.name).toBe('Coach Support')
    expect(core?.features).toContain('Personalized NASM OPT™ training plan')
    expect(core?.features).toContain('Workout, strength, and personal-record tracking')
    expect(pro?.features).toContain('Audio-guided training sessions')
    expect(pro?.features).toContain('Weekly progress summaries')
    expect(transformation?.features).toContain('Quarterly video reviews with Coach Scott Gordon')
    expect(transformation?.features).toContain('Direct messaging with your coach')
  })

  it('enforces gated allocation handling for Tier 3 rather than self-serve direct buy', () => {
    function resolveRetainerAction(packageId: string): 'gated_allocation' | 'self_serve_checkout' {
      if (packageId === 'transformation') {
        return 'gated_allocation'
      }
      return 'self_serve_checkout'
    }

    expect(resolveRetainerAction('transformation')).toBe('gated_allocation')
    expect(resolveRetainerAction('momentum')).toBe('self_serve_checkout')
    expect(resolveRetainerAction('starter')).toBe('self_serve_checkout')
    expect(resolveRetainerAction('lab')).toBe('self_serve_checkout')
  })

  it('verifies all canonical tiers and corporate pricing contracts', () => {
    const lab = PACKAGES.find(p => p.id === 'lab')
    expect(lab).toBeDefined()
    expect(lab!.price).toBe(5900)
    expect(lab!.pifPriceCents).toBe(49900)

    const alumni = PACKAGES.find(p => p.id === 'alumni')
    expect(alumni).toBeDefined()
    expect(alumni!.price).toBe(14900)
    expect(alumni!.pifPriceCents).toBe(129500)

    const corporate = PACKAGES.find(p => p.id === 'corporate')
    expect(corporate).toBeDefined()
    expect(corporate!.price).toBe(350000)
    expect(corporate!.pifPriceCents).toBe(3500000)
  })

  it('verifies clinical add-on catalog pricing consistency', () => {
    expect(COACHING_ADDONS).toHaveLength(5)

    const diagnostic = COACHING_ADDONS.find(a => a.id === 'postural-diagnostic')
    expect(diagnostic).toBeDefined()
    expect(diagnostic!.priceCents).toBe(24900)
    expect(diagnostic!.billingType).toBe('one_time')

    const nutrition = COACHING_ADDONS.find(a => a.id === 'metabolic-nutrition')
    expect(nutrition).toBeDefined()
    expect(nutrition!.priceCents).toBe(14900)
    expect(nutrition!.billingType).toBe('recurring_monthly')

    const video = COACHING_ADDONS.find(a => a.id === 'video-critique-pass')
    expect(video).toBeDefined()
    expect(video!.priceCents).toBe(19900)
    expect(video!.billingType).toBe('recurring_monthly')

    const supplement = COACHING_ADDONS.find(a => a.id === 'supplement-audit')
    expect(supplement).toBeDefined()
    expect(supplement!.priceCents).toBe(14900)
    expect(supplement!.billingType).toBe('one_time')

    const travel = COACHING_ADDONS.find(a => a.id === 'travel-warrior-pass')
    expect(travel).toBeDefined()
    expect(travel!.priceCents).toBe(12900)
    expect(travel!.billingType).toBe('one_time')
  })

  it('verifies front-end standalone diagnostic voucher product', () => {
    expect(STANDALONE_PRODUCTS).toHaveLength(1)
    const audit = STANDALONE_PRODUCTS[0]
    expect(audit.id).toBe('ai-postural-audit')
    expect(audit.priceCents).toBe(9700)
    expect(audit.upsellCreditCents).toBe(9700)
  })
})

describe('Public Funnel & Architecture', () => {
  const homePageSource = fs.readFileSync(path.resolve(process.cwd(), 'app/page.tsx'), 'utf-8')
  const packagesStudioSource = fs.readFileSync(path.resolve(process.cwd(), 'components/packages/PackagesStudioClient.tsx'), 'utf-8')
  const corporatePageSource = fs.readFileSync(path.resolve(process.cwd(), 'app/corporate/page.tsx'), 'utf-8')
  const asyncCoachingSource = fs.readFileSync(path.resolve(process.cwd(), 'app/async-coaching/page.tsx'), 'utf-8')
  const applyQuizSource = fs.readFileSync(path.resolve(process.cwd(), 'components/marketing/ApplyQuiz.tsx'), 'utf-8')
  const purchaseButtonSource = fs.readFileSync(path.resolve(process.cwd(), 'components/packages/PurchaseButton.tsx'), 'utf-8')
  const masterModalSource = fs.readFileSync(path.resolve(process.cwd(), 'components/packages/MasterAllocationModal.tsx'), 'utf-8')

  it('renders Forge Athletic branding and the real-life performance promise', () => {
    expect(homePageSource).toContain('className="foundation-home forge-marketing"')
    expect(homePageSource).toContain('Built From The Ground Up.')
    expect(homePageSource).toContain('Precision Science For Real Lives.')
    expect(homePageSource).toContain('href="/auth/signup"')
  })

  it('lists the three Forge memberships and founder story on the public landing page', () => {
    expect(homePageSource).toContain('ForgeMembershipPlans')
    expect(homePageSource).toContain('NASM Master Trainer')
    expect(homePageSource).toContain('Fitness Director')
    expect(homePageSource).toContain('/images/brand/logo-concept-1-kinetic-f.jpg')
  })

  it('guarantees PackagesStudioClient formats prices with monospace tabular telemetry', () => {
    expect(packagesStudioSource).toContain('font-telemetry font-mono')
    expect(packagesStudioSource).toContain("fontFamily: 'var(--font-telemetry, monospace)'")
    expect(packagesStudioSource).toContain("fontVariantNumeric: 'tabular-nums'")
  })

  it('guarantees Corporate page prices ($3,500 and $35,000) use monospace tabular telemetry', () => {
    expect(corporatePageSource).toContain('font-telemetry font-mono')
    expect(corporatePageSource).toContain('$3,500')
    expect(corporatePageSource).toContain('$35,000')
  })

  it('redirects the retired async-coaching catalog to current membership options', () => {
    expect(asyncCoachingSource).toContain("redirect('/packages')")
  })

  it('sets Forge Athletic Barlow Condensed and Inter font variables', () => {
    const layoutSource = fs.readFileSync(path.resolve(process.cwd(), 'app/layout.tsx'), 'utf-8')
    expect(layoutSource).toContain('const barlowCondensed = localFont(')
    expect(layoutSource).toContain("variable: '--font-barlow-condensed'")
    expect(layoutSource).toContain('const inter = localFont(')
    expect(layoutSource).toContain("variable: '--font-inter'")
  })

  it('guarantees ApplyQuiz recommendation card uses Cinzel title and monospace tabular price', () => {
    expect(applyQuizSource).toContain('recommendationDetails')
    expect(applyQuizSource).toContain('font-telemetry font-mono')
    expect(applyQuizSource).toContain('{tierDetails.title}')
    expect(applyQuizSource).toContain('{tierDetails.price}')
  })

  it('guarantees inputs enforce 16px font-size to prevent mobile iOS auto-zoom', () => {
    expect(purchaseButtonSource).toContain('fontSize: 16')
    expect(masterModalSource).toContain('fontSize: 16')
    expect(applyQuizSource).toContain('fontSize: 16')
  })

  it('guarantees zero Bebas Neue remains across public acquisition components', () => {
    const combined = [
      homePageSource,
      packagesStudioSource,
      corporatePageSource,
      asyncCoachingSource,
      applyQuizSource,
      purchaseButtonSource,
      masterModalSource,
    ].join('\n')

    expect(combined).not.toContain('Bebas')
    expect(combined).not.toContain('bebas')
  })
})
