import { describe, expect, it } from 'vitest'
import { FORGE_ADDONS, getForgeAddonByFeature, getForgeAddon, getForgeAddonPerSessionCents, getForgeAddonsByCategory } from '@/lib/forge-addons'

describe('Forge Athletic add-on catalog', () => {
  it('has unique ids and positive whole-cent prices', () => {
    expect(new Set(FORGE_ADDONS.map(a => a.id)).size).toBe(FORGE_ADDONS.length)
    for (const addon of FORGE_ADDONS) {
      expect(Number.isInteger(addon.priceCents)).toBe(true)
      expect(addon.priceCents).toBeGreaterThan(0)
    }
  })

  it('keeps the catalog focused so buyers are not overwhelmed', () => {
    expect(getForgeAddonsByCategory('advanced-feature')).toHaveLength(4)
    expect(getForgeAddonsByCategory('private-session')).toHaveLength(3)
    expect(FORGE_ADDONS.filter(a => a.popular)).toHaveLength(1)
  })

  it('prices session packs below single-session list price with accurate savings', () => {
    const single = getForgeAddon('addon-private-session-single')!
    for (const addon of getForgeAddonsByCategory('private-session')) {
      expect(addon.priceCents / addon.sessions).toBeLessThanOrEqual(single.priceCents)
      if (addon.sessions > 1) {
        expect(addon.listPriceCents).toBe(single.priceCents * addon.sessions)
      }
    }
    expect(getForgeAddonPerSessionCents(getForgeAddon('addon-private-session-4')!)).toBe(16500)
    expect(getForgeAddonPerSessionCents(single)).toBeUndefined()
  })

  it('keeps private-session credits aligned with session counts', () => {
    expect(getForgeAddon('addon-private-session-8')!.sessions).toBe(8)
    expect(getForgeAddon('addon-video-review-pack')!.sessions).toBe(0)
  })

  it('gives every unlockable feature exactly one add-on with an access window', () => {
    for (const feature of ['video-review', 'nutrition', 'travel'] as const) {
      const addon = getForgeAddonByFeature(feature)
      expect(addon?.accessDays).toBeGreaterThan(0)
      expect(FORGE_ADDONS.filter(a => a.unlocks === feature)).toHaveLength(1)
    }
    expect(getForgeAddonByFeature('video-review')?.uses).toBe(4)
  })
})
