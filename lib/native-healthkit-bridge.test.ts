import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isNativeIOS,
  isNativeAndroid,
  isNativeMobile,
  getNativePlatform,
  isNativeHealthKitAvailable,
  requestNativeHealthKitPermissions,
  getNativeHealthKitStatus,
  enableNativeHealthKitBackgroundDelivery,
  queryNativeHealthKitBiometrics,
  syncNativeHealthKitData,
  saveWorkoutToNativeHealthKit,
  saveMindfulSessionToNativeHealthKit,
  resolveAppleHealthActivityType,
  syncActivityToAppleHealth,
  subscribeToNativeHealthKitUpdates,
  getNativeCurrentHeartRate,
  GAAHealthKitNative,
  resolveSyncEndpoint,
} from './native-healthkit-bridge'
import { Capacitor } from '@capacitor/core'

vi.mock('@capacitor/core', async () => {
  const actual = await vi.importActual<typeof import('@capacitor/core')>('@capacitor/core')
  return {
    ...actual,
    Capacitor: {
      isNativePlatform: vi.fn(),
      getPlatform: vi.fn(),
    },
    registerPlugin: vi.fn(() => ({
      isAvailable: vi.fn(),
      requestAuthorization: vi.fn(),
      getAuthorizationStatus: vi.fn(),
      enableBackgroundDelivery: vi.fn(),
      queryLatestBiometrics: vi.fn(),
      syncHealthData: vi.fn(),
      setSyncConfiguration: vi.fn(),
      writeWorkout: vi.fn(),
      writeMindfulSession: vi.fn(),
      addListener: vi.fn(),
    })),
  }
})

describe('GAA Native HealthKit & Health Connect Bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Platform Detection', () => {
    it('returns true for isNativeIOS when on native iOS platform', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')

      expect(isNativeIOS()).toBe(true)
      expect(isNativeAndroid()).toBe(false)
      expect(isNativeMobile()).toBe(true)
      expect(getNativePlatform()).toBe('ios')
    })

    it('returns true for isNativeAndroid when on native Android platform', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')

      expect(isNativeAndroid()).toBe(true)
      expect(isNativeIOS()).toBe(false)
      expect(isNativeMobile()).toBe(true)
      expect(getNativePlatform()).toBe('android')
    })

    it('returns false for native platforms when in web browser environment', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web')

      expect(isNativeIOS()).toBe(false)
      expect(isNativeAndroid()).toBe(false)
      expect(isNativeMobile()).toBe(false)
      expect(getNativePlatform()).toBe('web')
    })
  })

  describe('Availability & Permissions', () => {
    it('returns false for isNativeHealthKitAvailable when not on mobile', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      const res = await isNativeHealthKitAvailable()
      expect(res).toBe(false)
    })

    it('returns true when HealthKit is available on iOS device', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(GAAHealthKitNative.isAvailable).mockResolvedValue({ available: true, platform: 'ios' })

      const res = await isNativeHealthKitAvailable()
      expect(res).toBe(true)
    })

    it('returns true when Health Connect is available on Android device', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(GAAHealthKitNative.isAvailable).mockResolvedValue({ available: true, platform: 'android' })

      const res = await isNativeHealthKitAvailable()
      expect(res).toBe(true)
    })

    it('requests authorization on iOS and returns success', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(GAAHealthKitNative.requestAuthorization).mockResolvedValue({ success: true, authorized: true })

      const res = await requestNativeHealthKitPermissions()
      expect(res.success).toBe(true)
      expect(res.authorized).toBe(true)
    })

    it('requests authorization on Android and returns success', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(GAAHealthKitNative.requestAuthorization).mockResolvedValue({ success: true, authorized: true })

      const res = await requestNativeHealthKitPermissions()
      expect(res.success).toBe(true)
      expect(res.authorized).toBe(true)
    })

    it('handles authorization error on web environment', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      const res = await requestNativeHealthKitPermissions()
      expect(res.success).toBe(false)
      expect(res.authorized).toBe(false)
      expect(res.error).toContain('only available when running inside the Forge Athletic mobile app')
    })

    it('retrieves authorization status on native mobile', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(GAAHealthKitNative.getAuthorizationStatus).mockResolvedValue({ authorized: true, status: 'authorized' })

      const res = await getNativeHealthKitStatus()
      expect(res.authorized).toBe(true)
      expect(res.status).toBe('authorized')
    })
  })

  describe('Background Delivery & Sync', () => {
    it('enables background delivery successfully on Android and iOS', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(GAAHealthKitNative.enableBackgroundDelivery).mockResolvedValue({
        success: true,
        backgroundDeliveryEnabled: true,
      })

      const res = await enableNativeHealthKitBackgroundDelivery()
      expect(res.success).toBe(true)
      expect(res.backgroundDeliveryEnabled).toBe(true)
    })

    it('queries latest biometrics payload', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      const mockPayload = {
        provider: 'google_fit' as const,
        resting_heart_rate: 54,
        hrv_rmssd: 78,
        steps: 9650,
        active_calories: 640,
      }
      vi.mocked(GAAHealthKitNative.queryLatestBiometrics).mockResolvedValue(mockPayload)

      const telemetry = await queryNativeHealthKitBiometrics()
      expect(telemetry?.resting_heart_rate).toBe(54)
      expect(telemetry?.hrv_rmssd).toBe(78)
      expect(telemetry?.steps).toBe(9650)
    })

    it('syncs telemetry to backend endpoint', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(GAAHealthKitNative.syncHealthData).mockResolvedValue({
        success: true,
        synced: true,
        telemetry: { resting_heart_rate: 54, hrv_rmssd: 78 },
      })

      const res = await syncNativeHealthKitData({ endpoint: '/api/wearables/sync', userId: 'user-android-123' })
      expect(res.success).toBe(true)
      expect(res.synced).toBe(true)
      expect(res.telemetry?.resting_heart_rate).toBe(54)
    })

    it('saves a completed workout to native health store', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(GAAHealthKitNative.writeWorkout).mockResolvedValue({ success: true })

      const res = await saveWorkoutToNativeHealthKit({
        activityType: 'running',
        calories: 450,
        durationMinutes: 35,
        distanceMiles: 3.5,
      })
      expect(res.success).toBe(true)
    })

    it('subscribes to telemetry update events', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      const mockRemove = vi.fn().mockResolvedValue(undefined)
      vi.mocked(GAAHealthKitNative.addListener).mockResolvedValue({ remove: mockRemove })

      const callback = vi.fn()
      const handle = await subscribeToNativeHealthKitUpdates(callback)
      expect(GAAHealthKitNative.addListener).toHaveBeenCalledWith('onTelemetryUpdate', callback)
      expect(handle).toBeDefined()
    })

    it('autoInitializes native healthkit and queries biometrics', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(GAAHealthKitNative.isAvailable).mockResolvedValue({ available: true, platform: 'ios' })
      vi.mocked(GAAHealthKitNative.getAuthorizationStatus).mockResolvedValue({ authorized: true, status: 'authorized' })
      vi.mocked(GAAHealthKitNative.setSyncConfiguration).mockResolvedValue({ success: true })
      vi.mocked(GAAHealthKitNative.queryLatestBiometrics).mockResolvedValue({
        resting_heart_rate: 52,
        hrv_rmssd: 82,
        steps: 10450,
      })

      const { autoInitializeNativeHealthKit } = await import('./native-healthkit-bridge')
      const res = await autoInitializeNativeHealthKit()

      expect(res.initialized).toBe(true)
      expect(res.telemetry?.resting_heart_rate).toBe(52)
      expect(res.telemetry?.hrv_rmssd).toBe(82)
      expect(GAAHealthKitNative.setSyncConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining('/api/wearables/sync'),
        })
      )
    })

    it('resolves relative sync endpoints to absolute URLs', () => {
      const resolvedRelative = resolveSyncEndpoint('/api/wearables/sync')
      expect(resolvedRelative.startsWith('http://') || resolvedRelative.startsWith('https://')).toBe(true)
      expect(resolvedRelative.endsWith('/api/wearables/sync')).toBe(true)

      const resolvedAbsolute = resolveSyncEndpoint('https://custom.domain.com/sync')
      expect(resolvedAbsolute).toBe('https://custom.domain.com/sync')
    })

    it('sanitizes capacitor:// and localhost origins to production endpoint', () => {
      try {
        vi.stubGlobal('window', { location: { origin: 'capacitor://localhost' } })
        const resolvedCapacitor = resolveSyncEndpoint('/api/wearables/sync')
        expect(resolvedCapacitor).toBe('https://forge-athletic.app/api/wearables/sync')

        vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } })
        const resolvedLocal = resolveSyncEndpoint('/api/wearables/sync')
        expect(resolvedLocal).toBe('https://forge-athletic.app/api/wearables/sync')
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  describe('Multi-Modal Apple Health Synchronization', () => {
    it('correctly maps various modalities and terms to exact Apple Health activity types', () => {
      expect(resolveAppleHealthActivityType('Treadmill Incline Walk')).toEqual({
        activityType: 'walking',
        displayName: 'Walking',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Outdoor Run / Walk')).toEqual({
        activityType: 'running',
        displayName: 'Running',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Stationary Bike')).toEqual({
        activityType: 'cycling',
        displayName: 'Cycling',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Assault / Air Bike')).toEqual({
        activityType: 'highIntensityIntervalTraining',
        displayName: 'High Intensity Interval Training',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Rowing Machine')).toEqual({
        activityType: 'rowing',
        displayName: 'Rowing',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Stairmaster')).toEqual({
        activityType: 'stairClimbing',
        displayName: 'Stair Climbing',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Elliptical')).toEqual({
        activityType: 'elliptical',
        displayName: 'Elliptical',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Cardio')).toEqual({
        activityType: 'crossTraining',
        displayName: 'Cardio / Cross Training',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Treadmill')).toEqual({
        activityType: 'walking',
        displayName: 'Treadmill Walking',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('General Modality')).toEqual({
        activityType: 'crossTraining',
        displayName: 'Cardio / Cross Training',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Swimming')).toEqual({
        activityType: 'swimming',
        displayName: 'Swimming',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Jump Rope')).toEqual({
        activityType: 'jumpRope',
        displayName: 'Jump Rope',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Ski Erg')).toEqual({
        activityType: 'crossCountrySkiing',
        displayName: 'Ski Erg',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Traditional Strength Training')).toEqual({
        activityType: 'traditionalStrengthTraining',
        displayName: 'Traditional Strength Training',
        isMindfulness: false,
      })

      expect(resolveAppleHealthActivityType('Mindfulness Cooldown')).toEqual({
        activityType: 'mindfulness',
        displayName: 'Mindful Minutes',
        isMindfulness: true,
      })

      expect(resolveAppleHealthActivityType('4-7-8 Parasympathetic Breathwork')).toEqual({
        activityType: 'mindfulness',
        displayName: 'Mindful Minutes',
        isMindfulness: true,
      })
    })

    it('saves mindfulness session to native HealthKit when on mobile', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(GAAHealthKitNative.writeMindfulSession!).mockResolvedValue({ success: true })

      const res = await saveMindfulSessionToNativeHealthKit({
        durationMinutes: 5,
        completedAt: '2026-09-08T16:00:00.000Z',
      })

      expect(res.success).toBe(true)
      expect(GAAHealthKitNative.writeMindfulSession).toHaveBeenCalledWith({
        durationMinutes: 5,
        completedAt: '2026-09-08T16:00:00.000Z',
      })
    })

    it('synchronizes strength workout with calculated volume and calories', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(GAAHealthKitNative.writeWorkout).mockResolvedValue({ success: true })

      const res = await syncActivityToAppleHealth({
        type: 'strength',
        title: 'Day 1: Hypertrophy Upper Body',
        durationMinutes: 45,
        calories: 320,
      })

      expect(res.success).toBe(true)
      expect(res.targetCategory).toBe('traditionalStrengthTraining')
      expect(res.displayName).toBe('Traditional Strength Training')
      expect(GAAHealthKitNative.writeWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'traditionalStrengthTraining',
          calories: 320,
          durationMinutes: 45,
        })
      )
    })

    it('synchronizes cardio with exact modality to Apple Health', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(GAAHealthKitNative.writeWorkout).mockResolvedValue({ success: true })

      const res = await syncActivityToAppleHealth({
        type: 'cardio',
        modality: 'Treadmill Incline Walk',
        title: 'AI Cardio: Zone 2 Engine',
        durationMinutes: 25,
        calories: 195,
        avgHeartRate: 128,
      })

      expect(res.success).toBe(true)
      expect(res.targetCategory).toBe('walking')
      expect(res.displayName).toBe('Walking')
      expect(GAAHealthKitNative.writeWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'walking',
          calories: 195,
          durationMinutes: 25,
        })
      )
    })

    it('ensures cardio sessions never resolve to traditionalStrengthTraining and forwards avgHeartRate', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(GAAHealthKitNative.writeWorkout).mockResolvedValue({ success: true })

      const res = await syncActivityToAppleHealth({
        type: 'cardio',
        modality: 'General Modality',
        durationMinutes: 30,
        calories: 220,
        avgHeartRate: 142,
      })

      expect(res.success).toBe(true)
      expect(res.targetCategory).toBe('crossTraining')
      expect(res.displayName).toBe('Cardio / Cross Training')
      expect(GAAHealthKitNative.writeWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'crossTraining',
          calories: 220,
          durationMinutes: 30,
          avgHeartRate: 142,
        })
      )
    })

    it('queries live heart rate from native HealthKit when available', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      GAAHealthKitNative.getCurrentHeartRate = vi.fn().mockResolvedValue({
        heartRate: 138,
        timestamp: '2026-09-14T16:00:00Z',
      })

      const hrRes = await getNativeCurrentHeartRate()
      expect(hrRes.heartRate).toBe(138)
      expect(hrRes.timestamp).toBe('2026-09-14T16:00:00Z')
    })
  })
})
