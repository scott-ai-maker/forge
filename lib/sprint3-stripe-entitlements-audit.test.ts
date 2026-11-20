import { describe, expect, it } from 'vitest'
import {
  inferForgeTierFromPackageName,
  isRecurringMembershipPackageName,
} from '@/lib/addon-entitlements'
import { FORGE_MEMBERSHIPS } from '@/lib/forge-memberships'
import { FORGE_TIER_ENTITLEMENTS, inferForgeTierFromPackageNameClient } from '@/lib/tierEntitlements'
import { STANDALONE_PRODUCTS } from '@/lib/stripe'

describe('Sprint 3 — Stripe Entitlements, Bonus Escalation Fix & Core/Plus/Audit Alignment', () => {
  it('never escalates 1-on-1 screening bonuses or one-time session add-ons to coach_support (#20)', () => {
    expect(isRecurringMembershipPackageName('Founding Member 1-on-1 Movement Screening Bonus')).toBe(false)
    expect(isRecurringMembershipPackageName('1-on-1 Live Movement Screen Add-On')).toBe(false)
    expect(isRecurringMembershipPackageName('Coach Scheduled Session Credit')).toBe(false)
    expect(isRecurringMembershipPackageName('Core')).toBe(true)
    expect(isRecurringMembershipPackageName('Plus')).toBe(true)
    expect(isRecurringMembershipPackageName('Coach Support')).toBe(true)

    expect(inferForgeTierFromPackageName('Founding Member 1-on-1 Movement Screening Bonus', 1)).toBe('core_lab')
    expect(inferForgeTierFromPackageNameClient('Founding Member 1-on-1 Movement Screening Bonus', 1)).toBe('core_lab')
    expect(inferForgeTierFromPackageName('Core', 1)).toBe('core_lab')
    expect(inferForgeTierFromPackageName('Plus', 0)).toBe('plus')
    expect(inferForgeTierFromPackageName('Coach Support', 0)).toBe('coach_support')
  })

  it('aligns Core Lab 1-time onboarding Form Lab credit, Plus 4/mo reviews, and $97 standalone audit', () => {
    const core = FORGE_MEMBERSHIPS.find(m => m.id === 'forge-core')
    expect(core?.onboardingFeatures).toEqual([{ feature: 'video-review', uses: 1 }])

    const plus = FORGE_MEMBERSHIPS.find(m => m.id === 'forge-pro-athlete')
    expect(plus?.includedFeatures?.find(f => f.feature === 'video-review')?.uses).toBe(4)
    expect(FORGE_TIER_ENTITLEMENTS.plus.monthlyFormLabCredits).toBe(4)

    const audit = STANDALONE_PRODUCTS.find(p => p.id === 'ai-postural-audit')
    expect(audit?.upsellCreditCents).toBe(0)
    expect(audit?.deliverables.join(' ')).not.toContain('$97 credit')
  })
})
