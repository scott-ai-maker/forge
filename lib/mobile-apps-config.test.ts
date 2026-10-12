import { describe, it, expect } from 'vitest'
import {
  MOBILE_APPS_CONFIG,
  getMobileAppStoreLinks,
  isPlaceholderAppStoreUrl,
  isPlaceholderPlayStoreUrl,
} from './mobile-apps-config'

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

  it('defines valid PWA companion metadata', () => {
    expect(MOBILE_APPS_CONFIG.pwa).toBeDefined()
    expect(MOBILE_APPS_CONFIG.pwa.platform).toBe('pwa')
    expect(MOBILE_APPS_CONFIG.pwa.name).toBe('Forge Athletic Web Companion')
    expect(MOBILE_APPS_CONFIG.pwa.url).toContain('/dashboard/fitness?source=pwa')
    expect(MOBILE_APPS_CONFIG.pwa.badgeText).toBe('Install Web App')
    expect(MOBILE_APPS_CONFIG.pwa.keyFeatures.length).toBeGreaterThanOrEqual(4)
  })

  it('includes key mobile marketing highlights', () => {
    expect(MOBILE_APPS_CONFIG.highlights.length).toBeGreaterThanOrEqual(4)
    const titles = MOBILE_APPS_CONFIG.highlights.map(h => h.title)
    expect(titles).toContain('Background Telemetry Sync')
    expect(titles).toContain('Offline Gym Logging')
  })

  it('correctly identifies placeholder and production store URLs', () => {
    expect(isPlaceholderAppStoreUrl('https://apps.apple.com/app/forge-athletic/id0000000000')).toBe(true)
    expect(isPlaceholderAppStoreUrl('https://apps.apple.com/app/forge-athletic/id000000000')).toBe(true)
    expect(isPlaceholderAppStoreUrl('#')).toBe(true)
    expect(isPlaceholderAppStoreUrl(undefined)).toBe(true)
    expect(isPlaceholderAppStoreUrl('https://apps.apple.com/app/forge-athletic/id1234567890')).toBe(false)

    expect(isPlaceholderPlayStoreUrl('https://play.google.com/store/apps/details?id=com.gordonathletic.app')).toBe(true)
    expect(isPlaceholderPlayStoreUrl('#')).toBe(true)
    expect(isPlaceholderPlayStoreUrl(undefined)).toBe(true)
  })

  it('getMobileAppStoreLinks returns valid store links and placeholder flags for all platforms', () => {
    const links = getMobileAppStoreLinks()
    expect(links.ios).toBe(MOBILE_APPS_CONFIG.ios.url)
    expect(links.android).toBe(MOBILE_APPS_CONFIG.android.url)
    expect(links.pwa).toBe(MOBILE_APPS_CONFIG.pwa.url)
    expect(links.iosBadge).toBe(MOBILE_APPS_CONFIG.ios.badgeText)
    expect(links.androidBadge).toBe(MOBILE_APPS_CONFIG.android.badgeText)
    expect(links.pwaBadge).toBe(MOBILE_APPS_CONFIG.pwa.badgeText)
    expect(links.isIosPlaceholder).toBe(true)
    expect(links.isAndroidPlaceholder).toBe(true)
  })
})


