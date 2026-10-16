import { describe, it, expect } from 'vitest'
import {
  AppleAppStoreBadgeSvg,
  GooglePlayBadgeSvg,
  PwaAppBadgeSvg,
  AppleLogoIcon,
  AndroidLogoIcon,
} from './AppStoreBadges'
import {
  MOBILE_APPS_CONFIG,
  isPlaceholderAppStoreUrl,
  isPlaceholderPlayStoreUrl,
  getMobileAppStoreLinks,
} from '@/lib/mobile-apps-config'

describe('AppStoreBadges & Placeholder Architecture', () => {
  it('renders official SVG badges for iOS, Android, and PWA with correct dimensions', () => {
    const iosBadge = AppleAppStoreBadgeSvg({ width: 140, height: 42 })
    expect(iosBadge).toBeDefined()
    expect(iosBadge.type).toBe('svg')
    expect(iosBadge.props.width).toBe(140)
    expect(iosBadge.props.height).toBe(42)

    const playBadge = GooglePlayBadgeSvg({ width: 140, height: 42 })
    expect(playBadge).toBeDefined()
    expect(playBadge.type).toBe('svg')
    expect(playBadge.props.width).toBe(140)
    expect(playBadge.props.height).toBe(42)

    const pwaBadge = PwaAppBadgeSvg({ width: 140, height: 42 })
    expect(pwaBadge).toBeDefined()
    expect(pwaBadge.type).toBe('svg')
    expect(pwaBadge.props.width).toBe(140)
    expect(pwaBadge.props.height).toBe(42)
  })

  it('renders Apple and Android vector logo icons', () => {
    const appleLogo = AppleLogoIcon({ size: 24, color: '#FFFFFF' })
    expect(appleLogo).toBeDefined()
    expect(appleLogo.props.width).toBe(24)

    const androidLogo = AndroidLogoIcon({ size: 24, color: '#3DDC84' })
    expect(androidLogo).toBeDefined()
    expect(androidLogo.props.width).toBe(24)
  })

  it('correctly detects placeholder store URLs for iOS and Android', () => {
    expect(isPlaceholderAppStoreUrl(MOBILE_APPS_CONFIG.ios.url)).toBe(true)
    expect(isPlaceholderPlayStoreUrl(MOBILE_APPS_CONFIG.android.url)).toBe(true)
    expect(isPlaceholderAppStoreUrl('https://apps.apple.com/app/forge-athletic/id1234567890')).toBe(false)
  })

  it('provides complete metadata for PWA, iOS, and Android platforms', () => {
    const links = getMobileAppStoreLinks()
    expect(links.ios).toBeDefined()
    expect(links.android).toBeDefined()
    expect(links.pwa).toBeDefined()
    expect(links.pwa).toBe('/dashboard/fitness?source=pwa')
    expect(links.isIosPlaceholder).toBe(true)
    expect(links.isAndroidPlaceholder).toBe(true)

    expect(MOBILE_APPS_CONFIG.pwa.storeName).toBe('Progressive Web App')
    expect(MOBILE_APPS_CONFIG.pwa.keyFeatures.length).toBeGreaterThanOrEqual(4)
    expect(MOBILE_APPS_CONFIG.ios.storeName).toBe('Apple App Store')
    expect(MOBILE_APPS_CONFIG.android.storeName).toBe('Google Play Store')
  })
})
