/**
 * Forge Athletic — Mobile App Store & Promotional Configuration
 * 
 * Centralized configuration for Apple App Store and Google Play Store metadata,
 * marketing highlights, and download links. Easily customizable or overridable
 * via environment variables.
 */

export interface MobileAppInfo {
  platform: 'ios' | 'android' | 'pwa'
  storeName: string
  name: string
  bundleId: string
  url: string
  minVersion: string
  badgeText: string
  tagline: string
  keyFeatures: string[]
  isPlaceholder?: boolean
}

export interface MobileMarketingConfig {
  headline: string
  subheadline: string
  description: string
  ios: MobileAppInfo
  android: MobileAppInfo
  pwa: MobileAppInfo
  highlights: Array<{
    icon: string
    title: string
    description: string
  }>
}

export const MOBILE_APPS_CONFIG: MobileMarketingConfig = {
  headline: 'INSTALLABLE PROGRESSIVE WEB APP & TRAINING COMPANION',
  subheadline: 'Live Today as a Zero-Download PWA · Native iOS & Android Companions Coming Soon',
  description:
    'Install Forge Athletic directly to your iPhone or Android Home Screen today for local 33-point camera posture checks, Coach Gordon’s real voice pacing, offline workout logging, and adaptive NASM OPT™ sessions.',
  ios: {
    platform: 'ios',
    storeName: 'Apple App Store',
    name: 'Forge Athletic for iOS',
    bundleId: 'com.forgeathletic.app',
    url: process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/forge-athletic/id0000000000',
    minVersion: 'iOS 16.0+',
    badgeText: 'iOS Companion · Coming Soon',
    tagline: 'Native iOS Companion (Planned Release)',
    isPlaceholder: true,
    keyFeatures: [
      'Full workout tracking and NASM OPT™ phase progression',
      'Local on-device 33-point camera posture & readiness checks',
      'Offline in-gym set logging with automatic sync',
      'Coach Gordon’s real voice tempo and rest pacing',
    ],
  },
  android: {
    platform: 'android',
    storeName: 'Google Play Store',
    name: 'Forge Athletic for Android',
    bundleId: 'com.forgeathletic.app',
    url: process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.forgeathletic.app',
    minVersion: 'Android 10.0+',
    badgeText: 'Android Companion · Coming Soon',
    tagline: 'Native Android Companion (Planned Release)',
    isPlaceholder: true,
    keyFeatures: [
      'Full workout tracking and NASM OPT™ phase progression',
      'Local on-device 33-point camera posture & readiness checks',
      'Offline in-gym set logging with automatic sync',
      'Async Form Lab video capture & direct coach messaging',
    ],
  },
  pwa: {
    platform: 'pwa',
    storeName: 'Progressive Web App',
    name: 'Forge Athletic Web Companion',
    bundleId: 'app.forge-athletic.pwa',
    url: '/dashboard/fitness?source=pwa',
    minVersion: 'Any Modern Browser (Safari, Chrome, Edge)',
    badgeText: 'Install Web App',
    tagline: 'Instant Zero-Download In-Gym Workout Companion',
    isPlaceholder: false,
    keyFeatures: [
      'Instant Home Screen installation on iOS Safari & Android Chrome',
      'Full offline set, rep, weight, and RPE tracking with auto-sync',
      'Local in-browser 33-point MediaPipe posture & readiness screening',
      'Coach Gordon’s real voice tempo, rest cues & 10-second joint regressions',
    ],
  },
  highlights: [
    {
      icon: 'radio',
      title: 'Zero-Upload Camera Screening',
      description:
        'Run 33-point posture checks, overhead squat screens, and 30-second readiness checks locally in your mobile browser with zero cloud video uploads.',
    },
    {
      icon: 'lightning',
      title: 'Offline Gym Logging',
      description:
        'Log sets, reps, tempos, and RPE even with weak cellular signal in apartment or hotel gyms. Syncs automatically when reconnected.',
    },
    {
      icon: 'music',
      title: 'Real Voice Pacing',
      description:
        'Hands-free tempo counts, pre-workout briefings, and rest cues recorded in Coach Gordon’s real voice so your phone stays propped across the room.',
    },
    {
      icon: 'video-studio',
      title: 'Async Form Lab Reviews',
      description:
        'Capture guided 45-degree lift clips directly from your phone for frame-by-frame coaching feedback from Coach Gordon.',
    },
  ],
}

/**
 * Checks if an Apple App Store URL is a placeholder/mock URL
 */
export function isPlaceholderAppStoreUrl(url?: string): boolean {
  if (!url) return true
  return url.includes('id0000000000') || url.includes('id000000000') || url.includes('id000000') || url === '#'
}

/**
 * Checks if a Google Play Store URL is a placeholder/mock URL
 */
export function isPlaceholderPlayStoreUrl(url?: string): boolean {
  if (!url) return true
  return (
    ((url.includes('com.forgeathletic.app') || url.includes('com.gordonathletic.app')) &&
      !process.env.NEXT_PUBLIC_PLAY_STORE_LIVE) ||
    url === '#'
  )
}

/**
 * Returns active store URLs for iOS, Android, and PWA along with placeholder flags
 */
export function getMobileAppStoreLinks() {
  return {
    ios: MOBILE_APPS_CONFIG.ios.url,
    android: MOBILE_APPS_CONFIG.android.url,
    pwa: MOBILE_APPS_CONFIG.pwa.url,
    iosBadge: MOBILE_APPS_CONFIG.ios.badgeText,
    androidBadge: MOBILE_APPS_CONFIG.android.badgeText,
    pwaBadge: MOBILE_APPS_CONFIG.pwa.badgeText,
    isIosPlaceholder: isPlaceholderAppStoreUrl(MOBILE_APPS_CONFIG.ios.url),
    isAndroidPlaceholder: isPlaceholderPlayStoreUrl(MOBILE_APPS_CONFIG.android.url),
  }
}


