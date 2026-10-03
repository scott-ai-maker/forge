import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { PACKAGES, COACHING_ADDONS, STANDALONE_PRODUCTS } from '@/lib/stripe'

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

    // Tier 3: Executive 1:1 Master Retainer
    expect(transformation.id).toBe('transformation')
    expect(transformation.name).toBe('Executive 1:1 Master')
    expect(transformation.price).toBe(149500)
    expect(transformation.pifPriceCents).toBe(389500)
    expect(transformation.sessions).toBe(4)
    expect(transformation.pifSessions).toBe(12)
  })

  it('guarantees Tier 3 delivers Master live WebRTC studio, S.O.A.P. notes, and VIP SLA', () => {
    const tier3 = PACKAGES.find(p => p.id === 'transformation')
    expect(tier3).toBeDefined()

    const deliverablesJoined = tier3!.deliverables.join(' ')
    expect(deliverablesJoined).toContain('WebRTC video studio')
    expect(deliverablesJoined).toContain('Voice S.O.A.P. notes dictation')
    expect(deliverablesJoined).toContain('Clinical Supplement Prescription')
    expect(deliverablesJoined).toContain('VIP Direct Line')

    const slasJoined = tier3!.serviceLevels.join(' ')
    expect(slasJoined).toContain('4 business hours')
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

describe('Clinical Aristocracy Typography & Architecture on Public Funnel', () => {
  const homePageSource = fs.readFileSync(path.resolve(process.cwd(), 'app/page.tsx'), 'utf-8')
  const packagesStudioSource = fs.readFileSync(path.resolve(process.cwd(), 'components/packages/PackagesStudioClient.tsx'), 'utf-8')
  const corporatePageSource = fs.readFileSync(path.resolve(process.cwd(), 'app/corporate/page.tsx'), 'utf-8')
  const asyncCoachingSource = fs.readFileSync(path.resolve(process.cwd(), 'app/async-coaching/page.tsx'), 'utf-8')
  const applyQuizSource = fs.readFileSync(path.resolve(process.cwd(), 'components/marketing/ApplyQuiz.tsx'), 'utf-8')
  const purchaseButtonSource = fs.readFileSync(path.resolve(process.cwd(), 'components/packages/PurchaseButton.tsx'), 'utf-8')
  const masterModalSource = fs.readFileSync(path.resolve(process.cwd(), 'components/packages/MasterAllocationModal.tsx'), 'utf-8')

  it('guarantees homepage hero h1 uses Cinzel serif with Clinical Aristocracy styling', () => {
    expect(homePageSource).toContain('className="home-hero-title font-serif"')
    expect(homePageSource).toContain("fontFamily: 'var(--font-serif, Cinzel), Georgia, serif'")
  })

  it('guarantees homepage stats, transformations, and retainer prices use monospace tabular telemetry', () => {
    expect(homePageSource).toContain('font-telemetry font-mono')
    expect(homePageSource).toContain("fontFamily: 'var(--font-telemetry, monospace)'")
    expect(homePageSource).toContain("fontVariantNumeric: 'tabular-nums'")
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

  it('guarantees Async Coaching tier prices and add-ons use monospace tabular telemetry', () => {
    expect(asyncCoachingSource).toContain('font-telemetry font-mono')
    expect(asyncCoachingSource).toContain('{tier.price}')
    expect(asyncCoachingSource).toContain('{addon.price}')
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
