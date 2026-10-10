/**
 * Forge Athletic — Unified Native Mobile Capabilities & Telemetry Suite
 * 
 * Provides comprehensive native capabilities for both iOS and Android:
 * 1. Hardware Haptics Engine (Taptic Engine / Vibration)
 * 2. Device & Battery Telemetry Ingestion
 * 3. Network Connectivity & Offline Awareness
 * 4. Screen Wake Lock & Keep-Awake Management for Gym Workouts
 * 5. Native Status Bar Obsidian Theming
 * 6. App Lifecycle, Deep Linking & Android Back Button Interceptors
 * 7. Unified Telemetry Readiness Diagnostic Harness
 */

import { Capacitor } from '@capacitor/core'
import { App, type AppState, type URLOpenListenerEvent } from '@capacitor/app'
import { Device, type DeviceInfo, type BatteryInfo } from '@capacitor/device'
import { Network, type ConnectionStatus } from '@capacitor/network'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'

import {
  isNativeMobile,
  isNativeIOS,
  isNativeAndroid,
  getNativePlatform,
  isNativeHealthKitAvailable,
  getNativeHealthKitStatus,
  getNativeTelemetryDiagnostics,
  resolveSyncEndpoint,
} from './native-healthkit-bridge'

// ============================================================================
// 1. HARDWARE HAPTICS CAPABILITIES
// ============================================================================

export type HapticStyle = 'light' | 'medium' | 'heavy'
export type HapticNotifyStyle = 'SUCCESS' | 'WARNING' | 'ERROR'

/**
 * Triggers subtle native tactile vibration:
 * - Uses native iOS Taptic Engine / Android Vibrator via @capacitor/haptics
 * - Falls back to standard navigator.vibrate on mobile web browsers
 * - Fails silently with zero exceptions on unsupported browsers
 */
export async function hapticTap(): Promise<void> {
  try {
    if (isNativeMobile()) {
      await Haptics.impact({ style: ImpactStyle.Light })
      return
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15)
    }
  } catch {
    // Silent fallback
  }
}

/**
 * Triggers impact haptic with variable intensity (light, medium, heavy)
 */
export async function hapticImpact(style: HapticStyle = 'medium'): Promise<void> {
  try {
    if (isNativeMobile()) {
      const capStyle =
        style === 'heavy'
          ? ImpactStyle.Heavy
          : style === 'light'
          ? ImpactStyle.Light
          : ImpactStyle.Medium
      await Haptics.impact({ style: capStyle })
      return
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(style === 'heavy' ? 40 : style === 'light' ? 15 : 25)
    }
  } catch {}
}

/**
 * Triggers distinct notification haptic (success on PR/sync, warning, error)
 */
export async function hapticNotification(type: HapticNotifyStyle = 'SUCCESS'): Promise<void> {
  try {
    if (isNativeMobile()) {
      const capType =
        type === 'ERROR'
          ? NotificationType.Error
          : type === 'WARNING'
          ? NotificationType.Warning
          : NotificationType.Success
      await Haptics.notification({ type: capType })
      return
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(type === 'SUCCESS' ? [30, 60, 40] : [50, 100, 50])
    }
  } catch {}
}

/**
 * Triggers subtle selection tick (for scrolling pickers or carousel changes)
 */
export async function hapticSelection(): Promise<void> {
  try {
    if (isNativeMobile()) {
      await Haptics.selectionChanged()
      return
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  } catch {}
}

/**
 * Countdown timer warning pulse (e.g. 3-2-1 rest timer warning)
 */
export async function hapticRestTimerTick(): Promise<void> {
  try {
    if (isNativeMobile()) {
      await Haptics.impact({ style: ImpactStyle.Medium })
      return
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30)
    }
  } catch {}
}

// ============================================================================
// 2. DEVICE & BATTERY TELEMETRY
// ============================================================================

export interface NativeDeviceTelemetry {
  model: string
  platform: 'ios' | 'android' | 'web'
  operatingSystem: string
  osVersion: string
  manufacturer: string
  isVirtual: boolean
  appVersion: string
  appBuild: string
}

export interface NativeBatteryTelemetry {
  batteryLevelPercent: number | null
  levelPercent: number | null
  isCharging: boolean | null
}

/**
 * Queries native device hardware metadata
 */
export async function getNativeDeviceInfo(): Promise<NativeDeviceTelemetry> {
  const fallbackPlatform = getNativePlatform()

  try {
    const [info, appInfo] = await Promise.all([
      Device.getInfo().catch(() => null),
      App.getInfo().catch(() => null),
    ])

    return {
      model: info?.model || (fallbackPlatform === 'ios' ? 'iPhone' : fallbackPlatform === 'android' ? 'Android Device' : 'Web Browser'),
      platform: (info?.platform as 'ios' | 'android' | 'web') || fallbackPlatform,
      operatingSystem: info?.operatingSystem || fallbackPlatform,
      osVersion: info?.osVersion || 'unknown',
      manufacturer: info?.manufacturer || (fallbackPlatform === 'ios' ? 'Apple' : 'Google/OEM'),
      isVirtual: Boolean(info?.isVirtual),
      appVersion: appInfo?.version || '1.36.1',
      appBuild: appInfo?.build || '1',
    }
  } catch {
    return {
      model: fallbackPlatform === 'ios' ? 'iPhone' : fallbackPlatform === 'android' ? 'Android Device' : 'Browser',
      platform: fallbackPlatform,
      operatingSystem: fallbackPlatform,
      osVersion: 'unknown',
      manufacturer: fallbackPlatform === 'ios' ? 'Apple' : 'Google',
      isVirtual: false,
      appVersion: '1.36.1',
      appBuild: '1',
    }
  }
}

/**
 * Queries native battery telemetry (crucial for long in-gym training sessions)
 */
export async function getNativeBatteryInfo(): Promise<NativeBatteryTelemetry> {
  try {
    if (isNativeMobile()) {
      const battery = await Device.getBatteryInfo()
      const pct =
        typeof battery?.batteryLevel === 'number'
          ? Math.round(battery.batteryLevel * 100)
          : null
      return {
        batteryLevelPercent: pct,
        levelPercent: pct,
        isCharging: typeof battery?.isCharging === 'boolean' ? battery.isCharging : null,
      }
    }

    if (typeof navigator !== 'undefined') {
      const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> }
      if (typeof nav.getBattery === 'function') {
        const b = await nav.getBattery()
        const pct = Math.round(b.level * 100)
        return {
          batteryLevelPercent: pct,
          levelPercent: pct,
          isCharging: b.charging,
        }
      }
    }
  } catch {}

  return { batteryLevelPercent: null, levelPercent: null, isCharging: null }
}

// ============================================================================
// 3. NETWORK TELEMETRY & CONNECTIVITY
// ============================================================================

export interface NativeNetworkTelemetry {
  connected: boolean
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown'
}

/**
 * Retrieves current network status
 */
export async function getNativeNetworkStatus(): Promise<NativeNetworkTelemetry> {
  try {
    const status = await Network.getStatus()
    if (status && typeof status.connected === 'boolean') {
      return {
        connected: Boolean(status.connected),
        connectionType: (status.connectionType as NativeNetworkTelemetry['connectionType']) || 'unknown',
      }
    }
  } catch {}

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  return {
    connected: online,
    connectionType: online ? 'unknown' : 'none',
  }
}

/**
 * Subscribes to network connectivity state changes (online/offline transitions)
 */
export function subscribeToNetworkStatus(
  callback: (status: NativeNetworkTelemetry) => void
): () => void {
  let handle: { remove: () => void } | null = null

  void (async () => {
    try {
      handle = await Network.addListener('networkStatusChange', status => {
        callback({
          connected: Boolean(status.connected),
          connectionType: status.connectionType as NativeNetworkTelemetry['connectionType'],
        })
      })
    } catch {
      if (typeof window !== 'undefined') {
        const onOnline = () => callback({ connected: true, connectionType: 'unknown' })
        const onOffline = () => callback({ connected: false, connectionType: 'none' })
        window.addEventListener('online', onOnline)
        window.addEventListener('offline', onOffline)
        handle = {
          remove: () => {
            window.removeEventListener('online', onOnline)
            window.removeEventListener('offline', onOffline)
          },
        }
      }
    }
  })()

  return () => {
    if (handle) handle.remove()
  }
}

// ============================================================================
// 4. SCREEN KEEP-AWAKE / WAKE LOCK MANAGEMENT
// ============================================================================

let activeWakeLock: any = null

/**
 * Requests display keep-awake (prevents screen dimming or sleeping during in-gym workouts)
 */
export async function requestKeepAwake(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      activeWakeLock = await (navigator as any).wakeLock.request('screen')
      activeWakeLock.addEventListener('release', () => {
        activeWakeLock = null
      })
      return true
    }
  } catch {
    // Wake Lock unsupported or denied
  }
  return false
}

/**
 * Releases display keep-awake lock
 */
export async function releaseKeepAwake(): Promise<void> {
  try {
    if (activeWakeLock) {
      await activeWakeLock.release()
      activeWakeLock = null
    }
  } catch {}
}

// ============================================================================
// 5. NATIVE STATUS BAR THEMING
// ============================================================================

/**
 * Configures the native iOS & Android status bar to match Forge Athletic Obsidian luxury branding (#080E14)
 */
export async function configureNativeStatusBar(): Promise<void> {
  if (!isNativeMobile()) return

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    if (isNativeAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#080E14' })
    }
  } catch (err) {
    console.warn('[NativeStatusBar] Notice configuring status bar:', err)
  }
}

// ============================================================================
// 6. APP LIFECYCLE, DEEP LINKING & BACK BUTTON
// ============================================================================

/**
 * Subscribes to app foreground resume events.
 * Crucial for triggering instantaneous telemetry synchronization when the athlete re-opens the app.
 */
export function onAppResume(callback: () => void): () => void {
  let handle: { remove: () => void } | null = null

  void (async () => {
    try {
      if (isNativeMobile()) {
        handle = await App.addListener('appStateChange', (state: AppState) => {
          if (state.isActive) {
            callback()
          }
        })
        return
      }

      if (typeof document !== 'undefined') {
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            callback()
          }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        window.addEventListener('focus', callback)
        handle = {
          remove: () => {
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('focus', callback)
          },
        }
      }
    } catch {}
  })()

  return () => {
    if (handle) handle.remove()
  }
}

/**
 * Subscribes to native app URL opening (deep links like forge:// or universal links)
 */
export function onAppUrlOpen(callback: (url: string) => void): () => void {
  if (!isNativeMobile()) return () => {}

  let handle: { remove: () => void } | null = null

  void (async () => {
    try {
      handle = await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        if (event.url) {
          callback(event.url)
        }
      })
    } catch {}
  })()

  return () => {
    if (handle) handle.remove()
  }
}

/**
 * Intercepts the Android hardware back button to prevent accidental app exit during active workouts
 */
export function onAndroidBackButton(handler: (canGoBack: boolean) => void): () => void {
  if (!isNativeAndroid()) return () => {}

  let handle: { remove: () => void } | null = null

  void (async () => {
    try {
      handle = await App.addListener('backButton', (data: { canGoBack: boolean }) => {
        handler(data.canGoBack)
      })
    } catch {}
  })()

  return () => {
    if (handle) handle.remove()
  }
}

// ============================================================================
// 7. UNIFIED TELEMETRY READINESS DIAGNOSTIC HARNESS
// ============================================================================

export interface NativeTelemetryReadinessReport {
  isNative: boolean
  platform: 'ios' | 'android' | 'web'
  healthHardwareAvailable: boolean
  authorizationStatus: string
  backgroundDeliveryActive: boolean
  backgroundSyncIntervalMinutes: number
  backendUrl: string
  lastSyncTimestamp: string | null
  device: NativeDeviceTelemetry
  battery: NativeBatteryTelemetry
  network: NativeNetworkTelemetry
  telemetryReady: boolean
  diagnosticsSummary: string
}

/**
 * Comprehensive diagnostic check verifying that both iOS and Android native containers
 * are fully wired and operational for continuous telemetry ingestion and background delivery.
 */
export async function checkNativeTelemetryReadiness(): Promise<NativeTelemetryReadinessReport> {
  const isNative = isNativeMobile()
  const platform = getNativePlatform()

  const [device, battery, network, isAvail, authStatus, nativeDiag] = await Promise.all([
    getNativeDeviceInfo(),
    getNativeBatteryInfo(),
    getNativeNetworkStatus(),
    isNativeHealthKitAvailable().catch(() => false),
    getNativeHealthKitStatus().catch(() => ({ authorized: false, status: 'unavailable' })),
    getNativeTelemetryDiagnostics().catch(() => null),
  ])

  const healthHardwareAvailable = nativeDiag?.healthKitAvailable ?? isAvail
  const authorizationStatus = nativeDiag?.authorizationStatus ?? authStatus.status
  const backgroundDeliveryActive = nativeDiag?.backgroundDeliveryEnabled ?? (authStatus.authorized && isNative)
  const backgroundSyncIntervalMinutes = nativeDiag?.backgroundSyncIntervalMinutes ?? 60
  const backendUrl = nativeDiag?.backendUrl ?? resolveSyncEndpoint('/api/wearables/sync')
  const lastSyncTimestamp = nativeDiag?.lastSyncTimestamp || null

  const isAuth = authorizationStatus === 'authorized' || authStatus.authorized
  const telemetryReady = Boolean(isNative ? (healthHardwareAvailable && isAuth) : true)

  const summary = isNative
    ? `Native ${platform.toUpperCase()} telemetry is ${telemetryReady ? 'FULLY ACTIVE' : 'AWAITING AUTHORIZATION'} (Provider: ${platform === 'ios' ? 'Apple HealthKit' : 'Android Health Connect'}, Battery: ${battery.batteryLevelPercent !== null ? `${battery.batteryLevelPercent}%` : 'N/A'}, Net: ${network.connectionType.toUpperCase()})`
    : 'Web/PWA client operational with backend cloud telemetry synchronization.'

  return {
    isNative,
    platform,
    healthHardwareAvailable,
    authorizationStatus,
    backgroundDeliveryActive,
    backgroundSyncIntervalMinutes,
    backendUrl,
    lastSyncTimestamp,
    device,
    battery,
    network,
    telemetryReady,
    diagnosticsSummary: summary,
  }
}
