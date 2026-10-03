import { describe, expect, it } from 'vitest'
import { FORGE_MEMBERSHIPS, getForgeMembership, getForgeMembershipPrice } from '@/lib/forge-memberships'

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
    expect(FORGE_MEMBERSHIPS[2].features).toContain('Quarterly asynchronous video critiques')
    expect(FORGE_MEMBERSHIPS[2].features).toContain('Direct review by Coach Scott Gordon')
  })

  it('provides annual billing only for Core Membership', () => {
    const core = getForgeMembership('forge-core')
    const pro = getForgeMembership('forge-pro-athlete')
    expect(core).toBeDefined()
    expect(pro).toBeDefined()
    expect(getForgeMembershipPrice(core!, 'annual')).toEqual({ amountCents: 14900, interval: 'year' })
    expect(getForgeMembershipPrice(pro!, 'annual')).toBeUndefined()
  })
})
