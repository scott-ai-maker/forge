import { describe, expect, it } from 'vitest'
import { buildEntitlementGrant, buildMembershipEntitlementGrants, summarizeAllFeatureAccess, summarizeFeatureAccess, type AddonEntitlementRow } from '@/lib/addon-entitlements'
import { getForgeMembership } from '@/lib/forge-memberships'
import { getForgeAddon } from '@/lib/forge-addons'

const now = new Date('2026-10-04T00:00:00Z')
const row = (over: Partial<AddonEntitlementRow>): AddonEntitlementRow => ({
  id: 'e1', feature: 'video-review', uses_total: 4, uses_remaining: 4, expires_at: '2026-12-01T00:00:00Z', ...over,
})

describe('add-on entitlements', () => {
  it('builds grants with the right window and metering', () => {
    const grant = buildEntitlementGrant(getForgeAddon('addon-video-review-pack')!, 'c1', 'pi_1', now)!
    expect(grant).toMatchObject({ feature: 'video-review', uses_total: 4, uses_remaining: 4, stripe_payment_id: 'pi_1' })
    expect(grant.expires_at).toBe('2027-01-02T00:00:00.000Z')
    const travel = buildEntitlementGrant(getForgeAddon('addon-travel-pass')!, 'c1', 'pi_2', now)!
    expect(travel.uses_remaining).toBeNull()
    expect(travel.expires_at).toBe('2026-11-03T00:00:00.000Z')
  })

  it('does not grant entitlements for session-credit add-ons', () => {
    expect(buildEntitlementGrant(getForgeAddon('addon-private-session-4')!, 'c1', 'pi_3', now)).toBeNull()
  })

  it('treats expired or fully used purchases as locked', () => {
    expect(summarizeFeatureAccess([row({ expires_at: '2026-10-03T00:00:00Z' })], 'video-review', now).active).toBe(false)
    expect(summarizeFeatureAccess([row({ uses_remaining: 0 })], 'video-review', now).active).toBe(false)
    expect(summarizeFeatureAccess([], 'nutrition', now).active).toBe(false)
  })

  it('stacks uses across purchases and ignores other features', () => {
    const rows = [row({ id: 'a', uses_remaining: 1 }), row({ id: 'b', uses_remaining: 4, expires_at: '2027-01-01T00:00:00Z' }), row({ id: 'c', feature: 'travel', uses_total: null, uses_remaining: null })]
    expect(summarizeFeatureAccess(rows, 'video-review', now)).toEqual({ active: true, expiresAt: '2027-01-01T00:00:00Z', usesRemaining: 5 })
    const all = summarizeAllFeatureAccess(rows, now)
    expect(all.travel).toMatchObject({ active: true, usesRemaining: null })
    expect(all.nutrition.active).toBe(false)
  })

  it('grants membership-included features per paid invoice with a short grace window', () => {
    const grants = buildMembershipEntitlementGrants(getForgeMembership('forge-pro-athlete')!, 'c1', 'in_1', now)
    expect(grants.map(g => g.feature)).toEqual(['nutrition', 'travel', 'video-review'])
    expect(new Set(grants.map(g => g.stripe_payment_id)).size).toBe(3)
    expect(grants[2]).toMatchObject({ uses_total: 2, uses_remaining: 2, expires_at: '2026-11-08T00:00:00.000Z' })
    expect(buildMembershipEntitlementGrants(getForgeMembership('forge-core')!, 'c1', 'in_2', now)).toEqual([])
  })
})
