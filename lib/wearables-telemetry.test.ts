import { describe, it, expect } from 'vitest'
import {
  WEARABLE_PROVIDERS,
  calculateTimeInHeartRateZones,
  computeWearableCnsScore,
  normalizeWearableWorkout,
} from './wearables-telemetry'

describe('Wearables & Biometric Telemetry Engine', () => {
  it('contains valid configurations for all major wearable providers', () => {
    expect(WEARABLE_PROVIDERS.apple_health.badge).toBe('Apple HealthKit')
    expect(WEARABLE_PROVIDERS.apple_health.supportedMetrics).toContain('hrv')
    expect(WEARABLE_PROVIDERS.google_fit.badge).toBe('Health Connect')
    expect(WEARABLE_PROVIDERS.google_fit.supportedMetrics).toContain('sleep')
  })

  it('correctly calculates time spent across Tanaka heart rate zones from samples', () => {
    const age = 30 // Tanaka max HR = 208 - (0.7 * 30) = 187 bpm
    // Zone 1: 122 - 140 bpm
    // Zone 2: 142 - 159 bpm
    // Zone 3: 161 - 178 bpm

    const baseTime = new Date('2026-08-23T10:00:00Z').getTime()
    const samples = [
      { timestamp: new Date(baseTime).toISOString(), bpm: 130 }, // Zone 1 (60s)
      { timestamp: new Date(baseTime + 60000).toISOString(), bpm: 150 }, // Zone 2 (60s)
      { timestamp: new Date(baseTime + 120000).toISOString(), bpm: 170 }, // Zone 3 (60s)
      { timestamp: new Date(baseTime + 180000).toISOString(), bpm: 100 }, // Recovery
      { timestamp: new Date(baseTime + 240000).toISOString(), bpm: 100 },
    ]

    const timeInZones = calculateTimeInHeartRateZones(samples, age)
    expect(timeInZones.zone1Mins).toBe(1)
    expect(timeInZones.zone2Mins).toBe(1)
    expect(timeInZones.zone3Mins).toBe(1)
    expect(timeInZones.recoveryMins).toBe(1)
  })

  it('accurately computes CNS readiness score from HRV and Resting HR', () => {
    // High HRV (85ms vs 65 baseline) and lower RHR (52 vs 58) -> Optimal recovery
    const optimalScore = computeWearableCnsScore(85, 52, 65, 58)
    expect(optimalScore).toBeGreaterThanOrEqual(90)

    // Depressed HRV (35ms vs 65 baseline) and elevated RHR (68 vs 58) -> High CNS strain
    const fatiguedScore = computeWearableCnsScore(35, 68, 65, 58)
    expect(fatiguedScore).toBeLessThan(70)
  })

  it('returns null for CNS score when no wearable HRV or RHR telemetry is provided', () => {
    expect(computeWearableCnsScore(null, null)).toBeNull()
    expect(computeWearableCnsScore(undefined, undefined)).toBeNull()
  })

  it('normalizes raw Apple Watch / Whoop workout payloads into standardized events', () => {
    const rawAppleWorkout = {
      id: 'apple-workout-991',
      activity_type: 'Incline Treadmill Walk',
      start_time: '2026-08-23T08:00:00Z',
      end_time: '2026-08-23T08:30:00Z',
      distance_meters: 3500,
      calories: 280,
      average_hr: 144,
      peak_hr: 165,
    }

    const normalized = normalizeWearableWorkout(rawAppleWorkout, 'apple_health', 35)
    expect(normalized.provider).toBe('apple_health')
    expect(normalized.durationMins).toBe(30)
    expect(normalized.distanceKm).toBe(3.5)
    expect(normalized.caloriesKcal).toBe(280)
    expect(normalized.avgHeartRate).toBe(144)
    expect(normalized.tanakaZone?.zoneCode).toBe('zone2')
    expect(normalized.tanakaZone?.zoneName).toContain('Zone 2')
  })
})
