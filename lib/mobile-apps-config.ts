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
  headline: 'CONTINUOUS BIOMETRIC TELEMETRY & IN-GYM EXECUTION',
  subheadline: 'Available on iOS, Android & Progressive Web App',
  description:
    'Experience seamless 24/7 background biometric telemetry synchronization with Apple Health and Android Health Connect, real-time auditory cadence pacing, offline workout tracking, and 1:1 telestrator consultation studios on your mobile device.',
  ios: {
    platform: 'ios',
    storeName: 'Apple App Store',
    name: 'Forge Athletic for iOS',
    bundleId: 'com.gordonathletic.app',
    url: process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/forge-athletic/id0000000000',
    minVersion: 'iOS 16.0+',
    badgeText: 'Download on the App Store',
    tagline: 'Native HealthKit Background Delivery & Apple Watch Sync',
    isPlaceholder: true,
    keyFeatures: [
      '24/7 Native Apple HealthKit background delivery',
      'Apple Watch heart rate and HRV rMSSD synchronization',
      'Offline in-gym set logging with instant cloud catchup',
      'Real-time auditory cadences & Taptic Engine haptic pulses',
    ],
  },
  android: {
    platform: 'android',
    storeName: 'Google Play Store',
    name: 'Forge Athletic for Android',
    bundleId: 'com.gordonathletic.app',
    url: process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.gordonathletic.app',
    minVersion: 'Android 10.0+ (Health Connect)',
    badgeText: 'Get it on Google Play',
    tagline: 'Android Health Connect & Wear OS Telemetry Stream',
    isPlaceholder: true,
    keyFeatures: [
      'Automated Android Health Connect background sync',
      'Wear OS and Samsung Galaxy Watch telemetry ingestion',
      'Offline in-gym set logging with instant cloud catchup',
      '3D AI movement scanner & live WebRTC video consultation studio',
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
      'Tactile Barbell Plate Calculator & floating rest timer dock',
      'Real-time visual & auditory NASM OPT™ tempo cadence HUD',
    ],
  },
  highlights: [
    {
      icon: 'radio',
      title: 'Background Telemetry Sync',
      description:
        'Continuous automatic synchronization of Resting Heart Rate, HRV rMSSD, sleep stages, and active calorie burn via native Apple HealthKit and Android Health Connect.',
    },
    {
      icon: 'lightning',
      title: 'Offline Gym Logging',
      description:
        'Log sets, reps, tempos, and RPE even with zero cellular signal in basement hotel gyms. Syncs effortlessly when reconnected.',
    },
    {
      icon: 'music',
      title: 'Auditory Cadence & Haptics',
      description:
        'In-gym Cadence Pulse HUD and synthesized tempo cadences matching NASM OPT phases (4-2-1, 2-0-2, 1-1-1) with native Taptic Engine physical feedback.',
    },
    {
      icon: 'video-studio',
      title: '1:1 Video Telestrator Studio',
      description:
        'High-definition WebRTC video consults with live coach telestrator drawing, slow-motion movement replay, and automated SOAP notes.',
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
    (url.includes('com.gordonathletic.app') && !process.env.NEXT_PUBLIC_PLAY_STORE_LIVE) ||
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


