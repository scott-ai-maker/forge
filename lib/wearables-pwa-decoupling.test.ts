import { describe, it, expect } from 'vitest'
import {
  computeWearableCnsScore,
  type DailyBiometricSummary,
  WEARABLE_PROVIDERS,
} from './wearables-telemetry'
import {
  isNativeMobile,
  isNativeIOS,
  isNativeAndroid,
  getNativePlatform,
} from './native-healthkit-bridge'

describe('Wearables PWA Decoupling & Readability', () => {
  it('identifies web/PWA runtime as non-native platform by default in browser/node environment', () => {
    expect(isNativeMobile()).toBe(false)
    expect(isNativeIOS()).toBe(false)
    expect(isNativeAndroid()).toBe(false)
    expect(getNativePlatform()).toBe('web')
  })

  it('correctly provides human-readable biometric telemetry summary for PWA rendering', () => {
    const sampleTelemetry: DailyBiometricSummary = {
      date: '2026-08-31',
      provider: 'apple_health',
      restingHeartRate: 52,
      hrvRmssdMs: 76,
      sleepHours: 8.2,
      deepSleepHours: 2.3,
      stepsCount: 11200,
      activeCaloriesKcal: 720,
      nutrition: {
        caloriesConsumedKcal: 2450,
        proteinGrams: 195,
        carbsGrams: 240,
        fatGrams: 65,
      },
      updatedAt: '2026-08-31T14:30:00.000Z',
    }

    const cnsScore = computeWearableCnsScore(
      sampleTelemetry.hrvRmssdMs!,
      sampleTelemetry.restingHeartRate!
    )

    expect(cnsScore).toBeGreaterThanOrEqual(70)
    expect(cnsScore).toBeLessThanOrEqual(100)
    expect(sampleTelemetry.nutrition?.proteinGrams).toBe(195)
    expect(sampleTelemetry.sleepHours).toBe(8.2)
  })

  it('has providers defined for Apple Health and Google Fit / Health Connect', () => {
    expect(WEARABLE_PROVIDERS.apple_health).toBeDefined()
    expect(WEARABLE_PROVIDERS.apple_health.name).toContain('Apple Health')
    expect(WEARABLE_PROVIDERS.google_fit).toBeDefined()
    expect(WEARABLE_PROVIDERS.google_fit.name).toContain('Google Health Connect')
  })
})
