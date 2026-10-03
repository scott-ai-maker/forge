import { describe, it, expect } from 'vitest'
import { MOBILE_APPS_CONFIG, getMobileAppStoreLinks } from './mobile-apps-config'

describe('MOBILE_APPS_CONFIG', () => {
  it('defines valid iOS and Android app metadata', () => {
    expect(MOBILE_APPS_CONFIG.ios.platform).toBe('ios')
    expect(MOBILE_APPS_CONFIG.ios.bundleId).toBe('com.gordonathletic.app')
    expect(MOBILE_APPS_CONFIG.ios.url).toBeDefined()
    expect(MOBILE_APPS_CONFIG.ios.url).toContain('http')
    expect(MOBILE_APPS_CONFIG.ios.minVersion).toContain('iOS')
    expect(MOBILE_APPS_CONFIG.ios.keyFeatures.length).toBeGreaterThan(0)

    expect(MOBILE_APPS_CONFIG.android.platform).toBe('android')
    expect(MOBILE_APPS_CONFIG.android.bundleId).toBe('com.gordonathletic.app')
    expect(MOBILE_APPS_CONFIG.android.url).toBeDefined()
    expect(MOBILE_APPS_CONFIG.android.url).toContain('http')
    expect(MOBILE_APPS_CONFIG.android.minVersion).toContain('Android')
    expect(MOBILE_APPS_CONFIG.android.keyFeatures.length).toBeGreaterThan(0)
  })

  it('includes key mobile marketing highlights', () => {
    expect(MOBILE_APPS_CONFIG.highlights.length).toBeGreaterThanOrEqual(4)
    const titles = MOBILE_APPS_CONFIG.highlights.map(h => h.title)
    expect(titles).toContain('Background Telemetry Sync')
    expect(titles).toContain('Offline Gym Logging')
  })

  it('getMobileAppStoreLinks returns valid store links for both platforms', () => {
    const links = getMobileAppStoreLinks()
    expect(links.ios).toBe(MOBILE_APPS_CONFIG.ios.url)
    expect(links.android).toBe(MOBILE_APPS_CONFIG.android.url)
    expect(links.iosBadge).toBe(MOBILE_APPS_CONFIG.ios.badgeText)
    expect(links.androidBadge).toBe(MOBILE_APPS_CONFIG.android.badgeText)
  })
})

