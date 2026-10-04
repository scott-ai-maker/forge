import { describe, expect, it } from 'vitest'
import { FORGE_MEMBERSHIPS, getForgeMembership, getForgeMembershipPrice, getMembershipDisplayName, getMembershipsIncluding } from '@/lib/forge-memberships'

describe('Forge Athletic membership catalog', () => {
  it('defines the specified memberships, prices, and features', () => {
    expect(FORGE_MEMBERSHIPS).toHaveLength(3)
    expect(FORGE_MEMBERSHIPS[0]).toMatchObject({
      id: 'forge-core',
      monthlyPriceCents: 1999,
      annualPriceCents: 14900,
      trialDays: 7,
    })
    expect(FORGE_MEMBERSHIPS[1]).toMatchObject({
      id: 'forge-pro-athlete',
      monthlyPriceCents: 4900,
    })
    expect(FORGE_MEMBERSHIPS[2]).toMatchObject({
      id: 'forge-transformation-direct',
      monthlyPriceCents: 19900,
    })
    expect(FORGE_MEMBERSHIPS[2].features).toContain('Quarterly video reviews with Coach Scott Gordon')
    expect(FORGE_MEMBERSHIPS[2].features).toContain('Direct messaging with your coach')
  })

  it('provides annual billing only for Core', () => {
    const core = getForgeMembership('forge-core')
    const pro = getForgeMembership('forge-pro-athlete')
    expect(core).toBeDefined()
    expect(pro).toBeDefined()
    expect(getForgeMembershipPrice(core!, 'annual')).toEqual({ amountCents: 14900, interval: 'year' })
    expect(getForgeMembershipPrice(pro!, 'annual')).toBeUndefined()
  })

  it('includes self-serve tools only in Plus and Coach Support', () => {
    expect(getForgeMembership('forge-core')!.includedFeatures).toBeUndefined()
    expect(getMembershipsIncluding('nutrition').map(m => m.id)).toEqual(['forge-pro-athlete', 'forge-transformation-direct'])
    const video = (id: string) => getForgeMembership(id)!.includedFeatures!.find(f => f.feature === 'video-review')!.uses
    expect(video('forge-transformation-direct')).toBeGreaterThan(video('forge-pro-athlete')!)
  })

  it('shows accessible membership names for older saved package names', () => {
    expect(getMembershipDisplayName('Core Membership')).toBe('Core')
    expect(getMembershipDisplayName('Pro Athlete')).toBe('Plus')
    expect(getMembershipDisplayName('Transformation Direct')).toBe('Coach Support')
    expect(getMembershipDisplayName('Executive 1:1 Master')).toBe('One-to-one coaching')
    expect(getMembershipDisplayName('Hybrid Concierge')).toBe('Hybrid Coaching')
    expect(getMembershipDisplayName('Autonomous Digital Lab')).toBe('Digital Training')
    expect(getMembershipDisplayName('Corporate Executive Retainer')).toBe('Team Wellness')
    expect(getMembershipDisplayName('Custom package')).toBe('Custom package')
  })
})
