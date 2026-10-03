/**
 * Gordon Athletic Advisory — In-Gym Helper & Telemetry Companion Platform Utilities
 * 
 * Provides unified platform detection across PWA, iOS, and Android helper apps,
 * companion mode enforcement, in-gym telemetry focus, and zero-purchase compliance
 * guardrails for Apple App Store (Guideline 3.1.3), Google Play multiplatform reader
 * policies, and standalone Progressive Web App (PWA) standards.
 */

import { Capacitor } from '@capacitor/core'
import { useState, useEffect } from 'react'

export const WEB_PORTAL_URL = 'https://gordonathleticadvisory.com'

export const COMPANION_BILLING_DISCLOSURE =
  'Gordon Athletic Advisory Gym Companion: Memberships, retainers, and billing methods are configured and managed exclusively on our web portal. Visit gordonathleticadvisory.com in your web browser to manage your account or modify your retainer.'

/**
 * Returns true if currently running inside a native Capacitor mobile container (iOS or Android).
 */
export function isNativePlatform(): boolean {
  try {
    return typeof Capacitor?.isNativePlatform === 'function' ? Capacitor.isNativePlatform() : false
  } catch {
    return false
  }
}

/**
 * Returns true if running inside the native iOS Capacitor shell.
 */
export function isNativeIOS(): boolean {
  try {
    return isNativePlatform() && Capacitor.getPlatform() === 'ios'
  } catch {
    return false
  }
}

/**
 * Returns true if running inside the native Android Capacitor shell.
 */
export function isNativeAndroid(): boolean {
  try {
    return isNativePlatform() && Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

/**
 * Returns true if running in standalone Progressive Web App (PWA) mode.
 * Detects display-mode: standalone, iOS Safari standalone, Android app referrer,
 * or companion query flag.
 */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // 1. Standard CSS display-mode: standalone or window-controls-overlay
    if (window.matchMedia?.('(display-mode: standalone)').matches ||
        window.matchMedia?.('(display-mode: window-controls-overlay)').matches) {
      return true
    }

    // 2. iOS Safari "Add to Home Screen" standalone flag
    if ((window.navigator as unknown as { standalone?: boolean })?.standalone === true) {
      return true
    }

    // 3. Android Trusted Web Activity / Installed PWA referrer
    if (typeof document !== 'undefined' && document.referrer?.includes('android-app://')) {
      return true
    }

    // 4. URL query parameter flag (e.g. start_url launched from manifest)
    const search = window.location?.search || ''
    if (search.includes('source=pwa') || search.includes('mode=companion') || search.includes('mode=helper')) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Returns true if the app is operating as a mobile gym helper / companion app
 * across any of the supported platforms: Native iOS, Native Android, or Standalone PWA.
 */
export function isCompanionApp(): boolean {
  return isNativePlatform() || isPwaStandalone()
}

/**
 * Alias for isCompanionApp() reflecting its role as an in-gym helper app.
 */
export const isHelperApp = isCompanionApp

/**
 * Determines whether financial checkout and purchases are permitted.
 * Strictly false within native mobile and PWA helper apps; true on desktop/standard web.
 */
export function canMakePurchases(): boolean {
  return !isCompanionApp()
}

export type CompanionPlatform = 'ios' | 'android' | 'pwa' | 'web'

/**
 * Returns current platform descriptor: 'ios', 'android', 'pwa', or 'web'.
 */
export function getCompanionPlatform(): CompanionPlatform {
  if (isNativeIOS()) return 'ios'
  if (isNativeAndroid()) return 'android'
  if (isPwaStandalone()) return 'pwa'
  return 'web'
}

export const getHelperPlatform = getCompanionPlatform

export interface HelperAppModeState {
  isHelper: boolean
  isNative: boolean
  isPwa: boolean
  platform: CompanionPlatform
  isMounted: boolean
}

/**
 * Client-side React hook for hydration-safe companion/helper mode detection.
 */
export function useHelperAppMode(): HelperAppModeState {
  const [state, setState] = useState<HelperAppModeState>({
    isHelper: false,
    isNative: false,
    isPwa: false,
    platform: 'web',
    isMounted: false,
  })

  useEffect(() => {
    const isNative = isNativePlatform()
    const isPwa = isPwaStandalone()
    const isHelper = isNative || isPwa
    const platform = getCompanionPlatform()

    setState({
      isHelper,
      isNative,
      isPwa,
      platform,
      isMounted: true,
    })
  }, [])

  return state
}
