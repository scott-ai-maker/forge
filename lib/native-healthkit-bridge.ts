/**
 * Gordon Athletic Advisory — Native HealthKit & Health Connect Capacitor Bridge
 * 
 * Direct TypeScript interface communicating with the native iOS HealthKit plugin
 * and Android Health Connect plugin (GAAHealthKit) supporting real-time background
 * delivery, biometric telemetry ingestion, and workout synchronization.
 */

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import type { RawAppleHealthIngestPayload } from './apple-health-bridge'
import type { RawGoogleHealthIngestPayload } from './google-health-bridge'

export type RawMobileHealthPayload = RawAppleHealthIngestPayload | RawGoogleHealthIngestPayload

export interface GAAHealthKitPluginInterface {
  isAvailable(): Promise<{ available: boolean; platform: string }>
  requestAuthorization(): Promise<{ success: boolean; authorized: boolean }>
  getAuthorizationStatus(): Promise<{ authorized: boolean; status: string }>
  enableBackgroundDelivery(): Promise<{ success: boolean; backgroundDeliveryEnabled: boolean }>
  queryLatestBiometrics(): Promise<RawMobileHealthPayload>
  syncHealthData(options?: {
    endpoint?: string
    authToken?: string
    userId?: string
  }): Promise<{
    success: boolean
    synced: boolean
    telemetry: RawMobileHealthPayload
  }>
  setSyncConfiguration(config: {
    endpoint?: string
    authToken?: string
    userId?: string
  }): Promise<{ success: boolean }>
  writeWorkout(workout: {
    activityType: string
    calories: number
    durationMinutes: number
    distanceMiles?: number
    avgHeartRate?: number
    completedAt?: string
  }): Promise<{ success: boolean }>
  getCurrentHeartRate?(): Promise<{ heartRate: number | null; timestamp?: string | null }>
  writeMindfulSession?(session: {
    durationMinutes: number
    completedAt?: string
  }): Promise<{ success: boolean }>
  addListener(
    eventName: 'onTelemetryUpdate',
    listenerFunc: (telemetry: RawMobileHealthPayload) => void
  ): Promise<PluginListenerHandle>
}

// Register the custom Capacitor Plugin
export const GAAHealthKitNative = registerPlugin<GAAHealthKitPluginInterface>('GAAHealthKit')

export function getNativeHealthPlugin(): GAAHealthKitPluginInterface {
  if (typeof window !== 'undefined') {
    const winCap = (window as unknown as { Capacitor?: { Plugins?: { GAAHealthKit?: GAAHealthKitPluginInterface } } }).Capacitor
    if (winCap?.Plugins?.GAAHealthKit) {
      return winCap.Plugins.GAAHealthKit
    }
  }
  return GAAHealthKitNative
}

/**
 * Checks whether the application is running inside a native iOS Capacitor shell.
 */
export function isNativeIOS(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
  } catch {
    return false
  }
}

/**
 * Checks whether the application is running inside a native Android Capacitor shell.
 */
export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

/**
 * Checks whether the application is running inside any native mobile container (iOS or Android).
 */
export function isNativeMobile(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Returns the current platform name: 'ios', 'android', or 'web'.
 */
export function getNativePlatform(): 'ios' | 'android' | 'web' {
  try {
    if (!Capacitor.isNativePlatform()) return 'web'
    const p = Capacitor.getPlatform()
    return p === 'ios' || p === 'android' ? p : 'web'
  } catch {
    return 'web'
  }
}

/**
 * Checks whether native HealthKit or Health Connect hardware & software is available on this device.
 */
export async function isNativeHealthKitAvailable(): Promise<boolean> {
  if (!isNativeMobile()) return false
  try {
    const plugin = getNativeHealthPlugin()
    const res = await plugin.isAvailable()
    return Boolean(res?.available)
  } catch (err) {
    console.warn('[GAAHealthKitBridge] Availability check error:', err)
    return false
  }
}

/**
 * Requests native mobile health read/write permissions for vitals, sleep, macros, and workouts.
 */
export async function requestNativeHealthKitPermissions(): Promise<{
  success: boolean
  authorized: boolean
  error?: string
}> {
  if (!isNativeMobile()) {
    return {
      success: false,
      authorized: false,
      error: 'Native Health integration is only available when running inside the Gordon Athletic Advisory mobile app.',
    }
  }

  try {
    const plugin = getNativeHealthPlugin()
    const res = await plugin.requestAuthorization()
    return {
      success: Boolean(res?.success),
      authorized: Boolean(res?.authorized),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      authorized: false,
      error: msg,
    }
  }
}

/**
 * Retrieves the current authorization status for HealthKit or Health Connect.
 */
export async function getNativeHealthKitStatus(): Promise<{
  authorized: boolean
  status: string
}> {
  if (!isNativeMobile()) {
    return { authorized: false, status: 'web_environment' }
  }

  try {
    const plugin = getNativeHealthPlugin()
    const res = await plugin.getAuthorizationStatus()
    return {
      authorized: Boolean(res?.authorized),
      status: res?.status || 'unknown',
    }
  } catch {
    return { authorized: false, status: 'error' }
  }
}

/**
 * Enables native mobile health background delivery and registers background workers/observers.
 */
export async function enableNativeHealthKitBackgroundDelivery(): Promise<{
  success: boolean
  backgroundDeliveryEnabled: boolean
  error?: string
}> {
  if (!isNativeMobile()) {
    return {
      success: false,
      backgroundDeliveryEnabled: false,
      error: 'Not in native mobile environment.',
    }
  }

  try {
    const plugin = getNativeHealthPlugin()
    const res = await plugin.enableBackgroundDelivery()
    return {
      success: Boolean(res?.success),
      backgroundDeliveryEnabled: Boolean(res?.backgroundDeliveryEnabled),
    }
  } catch (err) {
    return {
      success: false,
      backgroundDeliveryEnabled: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Queries the latest 24h biometrics, sleep stages, dietary nutrition, and workouts from Apple Health / Health Connect.
 */
export async function queryNativeHealthKitBiometrics(): Promise<RawMobileHealthPayload | null> {
  if (!isNativeMobile()) return null

  try {
    const plugin = getNativeHealthPlugin()
    const telemetry = await plugin.queryLatestBiometrics()
    return telemetry
  } catch (err) {
    console.warn('[GAAHealthKitBridge] Query telemetry failed:', err)
    return null
  }
}

/**
 * Queries the latest measured heart rate sample from Apple Health / Health Connect within the past 30 minutes.
 */
export async function getNativeCurrentHeartRate(): Promise<{
  heartRate: number | null
  timestamp?: string | null
}> {
  if (!isNativeMobile()) return { heartRate: null }

  try {
    const plugin = getNativeHealthPlugin()
    if (plugin.getCurrentHeartRate) {
      const res = await plugin.getCurrentHeartRate()
      return {
        heartRate: typeof res?.heartRate === 'number' ? Math.round(res.heartRate) : null,
        timestamp: res?.timestamp || null,
      }
    }
    const biometrics = await plugin.queryLatestBiometrics()
    const hr = (biometrics as any)?.heart_rate || (biometrics as any)?.heartRate || null
    return {
      heartRate: typeof hr === 'number' ? Math.round(hr) : null,
      timestamp: biometrics?.date || null,
    }
  } catch (err) {
    console.warn('[GAAHealthKitBridge] getNativeCurrentHeartRate notice:', err)
    return { heartRate: null }
  }
}

/**
 * Resolves a reliable absolute API endpoint for native background and manual syncing.
 */
export function resolveSyncEndpoint(endpoint?: string): string {
  if (endpoint && (endpoint.startsWith('http://') || endpoint.startsWith('https://'))) {
    return endpoint
  }
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
  const isInvalidOrigin =
    !origin ||
    origin.startsWith('capacitor://') ||
    origin.startsWith('ionic://') ||
    origin.startsWith('file://') ||
    origin.includes('localhost')

  const base = isInvalidOrigin ? 'https://forge-athletic.app' : origin
  const path = endpoint || '/api/wearables/sync'
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * Safely extracts the active Supabase access token and user ID in browser/webview environments.
 */
export async function getSupabaseAuthCredentials(): Promise<{ authToken?: string; userId?: string }> {
  try {
    if (typeof window === 'undefined') return {}
    const { createClient } = await import('@/lib/supabase-browser')
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      return {
        authToken: session.access_token,
        userId: session.user.id,
      }
    }
  } catch (err) {
    console.warn('[GAAHealthKitBridge] Notice fetching auth session:', err)
  }
  return {}
}

let authListenerRegistered = false

/**
 * Registers an auth state change observer to propagate refreshed session tokens to native mobile health stores.
 */
export function registerAuthSyncListener(): void {
  if (authListenerRegistered || typeof window === 'undefined' || !isNativeMobile()) return
  authListenerRegistered = true

  void (async () => {
    try {
      const { createClient } = await import('@/lib/supabase-browser')
      const supabase = createClient()
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session && isNativeMobile()) {
          const plugin = getNativeHealthPlugin()
          const endpoint = resolveSyncEndpoint('/api/wearables/sync')
          await plugin
            .setSyncConfiguration({
              endpoint,
              authToken: session.access_token,
              userId: session.user.id,
            })
            .catch(() => {})
        }
      })
    } catch {}
  })()
}

/**
 * Executes immediate manual or background Health sync to the GAA backend.
 */
export async function syncNativeHealthKitData(options?: {
  endpoint?: string
  authToken?: string
  userId?: string
}): Promise<{
  success: boolean
  synced: boolean
  telemetry?: RawMobileHealthPayload
  error?: string
}> {
  if (!isNativeMobile()) {
    return {
      success: false,
      synced: false,
      error: 'Native Health sync is unavailable outside the mobile app.',
    }
  }

  try {
    const creds = await getSupabaseAuthCredentials()
    const plugin = getNativeHealthPlugin()
    const resolvedEndpoint = resolveSyncEndpoint(options?.endpoint)

    const res = await plugin.syncHealthData({
      endpoint: resolvedEndpoint,
      authToken: options?.authToken || creds.authToken,
      userId: options?.userId || creds.userId,
    })
    return {
      success: Boolean(res?.success),
      synced: Boolean(res?.synced),
      telemetry: res?.telemetry,
    }
  } catch (err) {
    return {
      success: false,
      synced: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Writes a completed workout session into Apple Health or Android Health Connect.
 */
export async function saveWorkoutToNativeHealthKit(workout: {
  activityType: string
  calories: number
  durationMinutes: number
  distanceMiles?: number
  avgHeartRate?: number
  completedAt?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!isNativeMobile()) {
    return { success: false, error: 'Not running in native mobile environment' }
  }

  try {
    const res = await GAAHealthKitNative.writeWorkout(workout)
    return { success: Boolean(res?.success) }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Writes a completed mindfulness or breathwork session into Apple Health Mindful Minutes.
 */
export async function saveMindfulSessionToNativeHealthKit(session: {
  durationMinutes: number
  completedAt?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!isNativeMobile()) {
    return { success: false, error: 'Not running in native mobile environment' }
  }

  try {
    const plugin = getNativeHealthPlugin()
    if (plugin.writeMindfulSession) {
      const res = await plugin.writeMindfulSession(session)
      return { success: Boolean(res?.success) }
    }
    // Fallback via writeWorkout with activityType: 'mindfulness' which our native plugin handles
    const res = await plugin.writeWorkout({
      activityType: 'mindfulness',
      calories: 0,
      durationMinutes: session.durationMinutes,
      completedAt: session.completedAt,
    })
    return { success: Boolean(res?.success) }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Resolves an athletic activity string or cardio modality into an Apple HealthKit activity identifier.
 */
export function resolveAppleHealthActivityType(modalityOrType: string): {
  activityType: string
  displayName: string
  isMindfulness: boolean
} {
  const norm = (modalityOrType || '').toLowerCase().trim()

  if (
    norm.includes('mindful') ||
    norm.includes('meditat') ||
    norm.includes('breath') ||
    norm.includes('parasympathetic')
  ) {
    return {
      activityType: 'mindfulness',
      displayName: 'Mindful Minutes',
      isMindfulness: true,
    }
  }

  if (norm.includes('run') || norm.includes('sprint') || norm.includes('jog')) {
    return {
      activityType: 'running',
      displayName: 'Running',
      isMindfulness: false,
    }
  }

  if (norm.includes('walk') || norm.includes('incline') || norm.includes('hike')) {
    return {
      activityType: 'walking',
      displayName: 'Walking',
      isMindfulness: false,
    }
  }

  if (
    norm.includes('assault') ||
    norm.includes('air bike') ||
    norm.includes('hiit') ||
    norm.includes('sprint interval')
  ) {
    return {
      activityType: 'highIntensityIntervalTraining',
      displayName: 'High Intensity Interval Training',
      isMindfulness: false,
    }
  }

  if (norm.includes('bike') || norm.includes('cycl') || norm.includes('spin')) {
    return {
      activityType: 'cycling',
      displayName: 'Cycling',
      isMindfulness: false,
    }
  }

  if (norm.includes('row')) {
    return {
      activityType: 'rowing',
      displayName: 'Rowing',
      isMindfulness: false,
    }
  }

  if (norm.includes('stair') || norm.includes('step') || norm.includes('stairmaster')) {
    return {
      activityType: 'stairClimbing',
      displayName: 'Stair Climbing',
      isMindfulness: false,
    }
  }

  if (norm.includes('elliptical')) {
    return {
      activityType: 'elliptical',
      displayName: 'Elliptical',
      isMindfulness: false,
    }
  }

  if (norm.includes('swim') || norm.includes('pool')) {
    return {
      activityType: 'swimming',
      displayName: 'Swimming',
      isMindfulness: false,
    }
  }

  if (norm.includes('jump rope') || norm.includes('jumprope') || norm.includes('rope')) {
    return {
      activityType: 'jumpRope',
      displayName: 'Jump Rope',
      isMindfulness: false,
    }
  }

  if (norm.includes('ski') || norm.includes('skierg')) {
    return {
      activityType: 'crossCountrySkiing',
      displayName: 'Ski Erg',
      isMindfulness: false,
    }
  }

  if (norm.includes('treadmill')) {
    return {
      activityType: 'walking',
      displayName: 'Treadmill Walking',
      isMindfulness: false,
    }
  }

  if (
    norm.includes('cardio') ||
    norm.includes('aerobic') ||
    norm.includes('general modality') ||
    norm === 'other'
  ) {
    return {
      activityType: 'crossTraining',
      displayName: 'Cardio / Cross Training',
      isMindfulness: false,
    }
  }

  if (norm.includes('stretch') || norm.includes('flexibility') || norm.includes('cooldown')) {
    return {
      activityType: 'flexibility',
      displayName: 'Flexibility',
      isMindfulness: false,
    }
  }

  if (norm.includes('functional')) {
    return {
      activityType: 'functionalStrengthTraining',
      displayName: 'Functional Strength Training',
      isMindfulness: false,
    }
  }

  // Default for strength training
  return {
    activityType: 'traditionalStrengthTraining',
    displayName: 'Traditional Strength Training',
    isMindfulness: false,
  }
}

export interface AppleHealthActivitySyncPayload {
  type: 'strength' | 'cardio' | 'mindfulness'
  modality?: string
  title?: string
  notes?: string
  durationMinutes: number
  calories?: number
  distanceMiles?: number
  avgHeartRate?: number
  completedAt?: string
}

export interface ActivitySyncResult {
  success: boolean
  synced: boolean
  source: 'native-healthkit' | 'backend-wearables'
  targetCategory: string
  displayName: string
  error?: string
}

/**
 * Universal Apple Health synchronizer:
 * Routes workouts to native HealthKit and GAA cloud telemetry backend (/api/wearables/sync).
 * - Strength -> traditionalStrengthTraining
 * - Cardio -> exact modality (walking, running, cycling, rowing, etc.)
 * - Mindfulness -> mindfulSession (Mindful Minutes)
 */
export async function syncActivityToAppleHealth(
  activity: AppleHealthActivitySyncPayload
): Promise<ActivitySyncResult> {
  const safeDuration = Math.max(1, Math.round(activity.durationMinutes))
  const completedAt = activity.completedAt || new Date().toISOString()

  let resolvedActivity: ReturnType<typeof resolveAppleHealthActivityType>
  if (activity.type === 'mindfulness') {
    resolvedActivity = {
      activityType: 'mindfulness',
      displayName: 'Mindful Minutes',
      isMindfulness: true,
    }
  } else if (activity.type === 'strength') {
    resolvedActivity = resolveAppleHealthActivityType(
      activity.modality || 'traditionalStrengthTraining'
    )
    if (resolvedActivity.isMindfulness) {
      resolvedActivity = {
        activityType: 'traditionalStrengthTraining',
        displayName: 'Traditional Strength Training',
        isMindfulness: false,
      }
    }
  } else {
    // activity.type === 'cardio'
    resolvedActivity = resolveAppleHealthActivityType(activity.modality || 'cardio')
    // Guardrail: Under NO circumstances should a cardio activity resolve to traditionalStrengthTraining!
    if (resolvedActivity.activityType === 'traditionalStrengthTraining') {
      resolvedActivity = {
        activityType: 'crossTraining',
        displayName: 'Cardio / Cross Training',
        isMindfulness: false,
      }
    }
  }

  const safeCalories = activity.calories
    ? Math.round(activity.calories)
    : activity.type === 'mindfulness'
    ? 0
    : activity.type === 'strength'
    ? Math.max(120, Math.round(safeDuration * 6.5))
    : Math.max(80, Math.round(safeDuration * 7.5))

  let nativeSuccess = false
  let nativeError: string | undefined

  // 1. Native Mobile Sync (iOS HealthKit / Android Health Connect)
  if (isNativeMobile()) {
    if (resolvedActivity.isMindfulness) {
      const res = await saveMindfulSessionToNativeHealthKit({
        durationMinutes: safeDuration,
        completedAt,
      })
      nativeSuccess = res.success
      nativeError = res.error
    } else {
      const res = await saveWorkoutToNativeHealthKit({
        activityType: resolvedActivity.activityType,
        calories: safeCalories,
        durationMinutes: safeDuration,
        distanceMiles: activity.distanceMiles,
        avgHeartRate: activity.avgHeartRate,
        completedAt,
      })
      nativeSuccess = res.success
      nativeError = res.error
    }
  }

  // 2. Cloud Telemetry Sync (/api/wearables/sync)
  try {
    const payload: Record<string, unknown> = {
      provider: 'apple_health',
    }

    if (resolvedActivity.isMindfulness) {
      payload.mindfulSessions = [
        {
          name: activity.title || activity.notes || 'GAA Mindful Parasympathetic Cooldown',
          durationMinutes: safeDuration,
          completedAt,
        },
      ]
    } else {
      payload.workouts = [
        {
          name: activity.title || activity.notes || `${resolvedActivity.displayName} Session`,
          activityType: resolvedActivity.activityType,
          durationMinutes: safeDuration,
          activeCaloriesKcal: safeCalories,
          avgHeartRateBpm: activity.avgHeartRate,
          distanceMiles: activity.distanceMiles,
          completedAt,
        },
      ]
    }

    if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'test') {
      const targetEndpoint = resolveSyncEndpoint('/api/wearables/sync')
      void fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(err => console.warn('[AppleHealthSync] Cloud sync notice:', err))
    }
  } catch {}

  const isNative = isNativeMobile()
  const isSynced = isNative ? nativeSuccess : true

  return {
    success: isSynced,
    synced: isSynced,
    source: isNative ? 'native-healthkit' : 'backend-wearables',
    targetCategory: resolvedActivity.activityType,
    displayName: resolvedActivity.displayName,
    error: nativeError,
  }
}

/**
 * Subscribes to real-time telemetry updates broadcast from native health background delivery.
 */
export async function subscribeToNativeHealthKitUpdates(
  callback: (data: RawMobileHealthPayload) => void
): Promise<PluginListenerHandle | null> {
  if (!isNativeMobile()) return null

  try {
    const handle = await GAAHealthKitNative.addListener('onTelemetryUpdate', callback)
    return handle
  } catch (err) {
    console.warn('[GAAHealthKitBridge] AddListener error:', err)
    return null
  }
}

/**
 * Automatically initializes native Apple HealthKit / Health Connect:
 * 1. Verifies mobile environment and hardware availability.
 * 2. Prompts authorization sheet if not yet granted.
 * 3. Registers background observers and enables immediate background delivery.
 * 4. Queries latest 24h biometrics and returns the live payload.
 */
export async function autoInitializeNativeHealthKit(): Promise<{
  initialized: boolean
  telemetry: RawMobileHealthPayload | null
  error?: string
}> {
  if (!isNativeMobile()) {
    return { initialized: false, telemetry: null, error: 'Not running in native mobile environment.' }
  }

  try {
    const isAvail = await isNativeHealthKitAvailable()
    if (!isAvail) {
      return { initialized: false, telemetry: null, error: 'HealthKit unavailable on this device.' }
    }

    // 1. Check or request authorization
    const status = await getNativeHealthKitStatus()
    if (!status.authorized) {
      const authRes = await requestNativeHealthKitPermissions()
      if (!authRes.success) {
        console.warn('[GAAHealthKit] Authorization sheet completed with notice:', authRes.error)
      }
    }

    // 2. Enable background delivery
    void enableNativeHealthKitBackgroundDelivery().catch(err => {
      console.warn('[GAAHealthKit] Background delivery notice:', err)
    })

    // 3. Configure backend synchronization endpoint and credentials on native plugin
    registerAuthSyncListener()
    const creds = await getSupabaseAuthCredentials()
    const endpoint = resolveSyncEndpoint('/api/wearables/sync')
    const plugin = getNativeHealthPlugin()
    try {
      await plugin.setSyncConfiguration({
        endpoint,
        authToken: creds.authToken,
        userId: creds.userId,
      })
    } catch (confErr) {
      console.warn('[GAAHealthKit] setSyncConfiguration notice:', confErr)
    }

    // 4. Query latest biometrics
    const telemetry = await queryNativeHealthKitBiometrics()
    return {
      initialized: true,
      telemetry,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[GAAHealthKit] Auto-init error:', msg)
    return {
      initialized: false,
      telemetry: null,
      error: msg,
    }
  }
}
