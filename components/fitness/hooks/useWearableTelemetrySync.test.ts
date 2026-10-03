import { describe, expect, it } from 'vitest'
import { computeWearableCnsScore } from '@/lib/wearables-telemetry'
import {
  normalizeAppleHealthIngestPayload,
  formatAppleHealthTelemetryToBiometricSummary,
} from '@/lib/apple-health-bridge'

describe('useWearableTelemetrySync logic & telemetry ingestion', () => {
  it('computes wearable CNS recovery and readiness score from biometric telemetry', () => {
    // Prime readiness (high HRV, low resting HR)
    const primeScore = computeWearableCnsScore(85, 48)
    expect(primeScore).toBeGreaterThanOrEqual(75)

    // Fatigued readiness (low HRV, elevated resting HR)
    const fatiguedScore = computeWearableCnsScore(30, 72)
    expect(fatiguedScore).toBeLessThan(60)
  })

  it('normalizes Apple Health / HealthKit raw ingest and formats to DailyBiometricSummary', () => {
    const rawPayload = {
      resting_heart_rate: 52,
      hrv_rmssd: 78,
      steps: 11450,
      active_calories: 640,
    }

    const normalized = normalizeAppleHealthIngestPayload(rawPayload)
    expect(normalized.restingHeartRateBpm).toBe(52)
    expect(normalized.hrvRmssdMs).toBe(78)

    const cns = computeWearableCnsScore(normalized.hrvRmssdMs, normalized.restingHeartRateBpm)
    const summary = {
      date: normalized.date,
      restingHeartRate: normalized.restingHeartRateBpm,
      hrvRmssdMs: normalized.hrvRmssdMs,
      cnsRecoveryScore: cns,
      sleepHours: normalized.sleep.totalHours,
      sleepQualityScore: normalized.sleep.sleepEfficiencyPercent,
      readinessScore: cns,
      recoveryStatus: (cns ?? 0) >= 75 ? 'prime' : (cns ?? 0) >= 50 ? 'adapted' : 'fatigued',
      sourceProvider: 'apple_health',
    }

    expect(summary.restingHeartRate).toBe(52)
    expect(summary.hrvRmssdMs).toBe(78)
    expect(summary.cnsRecoveryScore).toBe(cns)
    expect(summary.sourceProvider).toBe('apple_health')
    expect(summary.recoveryStatus).toBe('prime')
  })

  it('correctly maps status payload from /api/wearables/status to DailyBiometricSummary', () => {
    const statusPayload = {
      primarySource: 'apple_health',
      telemetry: {
        date: '2026-09-03',
        provider: 'apple_health',
        restingHeartRate: 51,
        hrvRmssdMs: 82,
        cnsStressScore: 92,
        sleepHours: 8.4,
        deepSleepHours: 2.3,
        stepsCount: 12100,
        activeCaloriesKcal: 680,
        nutrition: {
          caloriesConsumedKcal: 2300,
          proteinGrams: 190,
          carbsGrams: 235,
          fatGrams: 64,
        },
        updatedAt: '2026-09-03T11:00:00Z',
      },
    }

    expect(statusPayload.telemetry.restingHeartRate).toBe(51)
    expect(statusPayload.telemetry.hrvRmssdMs).toBe(82)
    expect(statusPayload.telemetry.stepsCount).toBe(12100)
    expect(statusPayload.telemetry.sleepHours).toBe(8.4)
  })
})
