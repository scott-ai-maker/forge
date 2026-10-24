import { describe, it, expect } from 'vitest'
import {
  generateVitalLinkToken,
  normalizeVitalDailyPayload,
  getVitalApiBaseUrl,
} from '../lib/vital-health-bridge'
import {
  computeWearableCnsScore,
  calculateTimeInHeartRateZones,
} from '../lib/wearables-telemetry'
import {
  calculateNocturnalRhrDip,
  evaluateSleepStages,
} from '../lib/executive-sleep-engine'
import {
  calculateAcwr,
  calculateReadinessScore,
} from '../lib/readiness-telemetry'
import {
  verifyAppleHealthWebhookToken,
  verifyGoogleHealthWebhookToken,
} from '../lib/wearable-webhook-adapters'

describe('Executive Telemetry & Wearable Biometric Synchronization Pipeline Suite', () => {
  it('Scenario 1: Elite Adaptation & Parasympathetic Dominance (Green Gate)', () => {
    const rawPayload = {
      event_type: 'daily.data.apple_health.created',
      client_user_id: 'client-exec-haye',
      source: 'apple_health',
      data: {
        calendar_date: '2026-10-24',
        resting_hr: 48,
        hrv_rmssd: 88,
        steps: 11400,
        active_calories: 680,
        sleep: {
          duration_hours: 8.2,
          deep_hours: 2.3,
        },
        nutrition: {
          calories: 2550,
          protein: 215,
          carbs: 240,
          fat: 65,
        },
      },
    }

    const { userId, provider, summary } = normalizeVitalDailyPayload(rawPayload, 'client-exec-haye')
    expect(userId).toBe('client-exec-haye')
    expect(provider).toBe('apple_health')
    expect(summary.restingHeartRate).toBe(48)
    expect(summary.hrvRmssdMs).toBe(88)
    expect(summary.nutrition?.proteinGrams).toBe(215)

    // Sleep stages: 8.2h total, 2.3h deep, 2.1h rem, 3.4h light, 0.4h awake
    const sleep = evaluateSleepStages(8.2, 2.3, 2.1, 3.4, 0.4)
    expect(sleep.deepStatus).toBe('optimal')
    expect(sleep.remStatus).toBe('optimal')
    expect(sleep.deepPercent).toBeGreaterThanOrEqual(18)

    // Nocturnal RHR dip: 56 daytime -> 48 min
    const dip = calculateNocturnalRhrDip(56, 48)
    expect(dip.dipPercent).toBe(14.3)
    expect(dip.classification).toBe('normal_dipper')

    // CNS readiness score
    const cns = computeWearableCnsScore(summary.hrvRmssdMs, summary.restingHeartRate, 70, 52)
    expect(cns).toBeGreaterThanOrEqual(90)

    // ACWR sweet spot
    const acwr = calculateAcwr([400, 450, 0, 420, 480, 0, 450], 2200)
    expect(acwr.zone).toBe('Sweet Spot (Optimal Overload)')
    expect(acwr.deloadRecommended).toBe(false)

    // Readiness score
    const readiness = calculateReadinessScore({
      sleepHours: summary.sleepHours,
      sleepQuality: 9,
      restingHeartRate: summary.restingHeartRate,
      baselineRhr: 52,
      sorenessLevel: 2,
      stressLevel: 2,
      recentWorkloadUnits: [400, 450, 0, 420, 480, 0, 450],
      chronicAvgWeeklyWorkload: 2200,
    })
    expect(readiness.gate).toBe('GREEN')
    expect(readiness.workoutAction).toBe('proceed_normal')
    expect(readiness.rpeCap).toBe(9.5)
    expect(readiness.restIntervalAdjustmentSec).toBe(0)

    // Tanaka Cardio Zones
    const samples = [
      { timestamp: '2026-10-24T10:00:00Z', bpm: 110 },
      { timestamp: '2026-10-24T10:10:00Z', bpm: 125 }, // Zone 1
      { timestamp: '2026-10-24T10:20:00Z', bpm: 145 }, // Zone 2
      { timestamp: '2026-10-24T10:30:00Z', bpm: 165 }, // Zone 3
      { timestamp: '2026-10-24T10:40:00Z', bpm: 170 },
    ]
    const zones = calculateTimeInHeartRateZones(samples, 38)
    expect(zones.zone1Mins).toBeGreaterThan(0)
    expect(zones.zone2Mins).toBeGreaterThan(0)
    expect(zones.zone3Mins).toBeGreaterThan(0)
  })

  it('Scenario 2: Severe Overreaching & ACWR Workload Spike (Red Gate & Deload Trigger)', () => {
    // 4300 acute vs 2100 chronic -> ACWR 2.05
    const acwr = calculateAcwr([800, 850, 0, 950, 850, 0, 850], 2100)
    expect(acwr.zone).toBe('Danger Zone (OTS Risk)')
    expect(acwr.deloadRecommended).toBe(true)
    expect(acwr.injuryRiskPercentage).toBeGreaterThanOrEqual(35)

    // Suppressed HRV & elevated RHR
    const cns = computeWearableCnsScore(32, 64, 70, 52)
    expect(cns).toBeLessThanOrEqual(55)

    // Non-dipper classification
    const dip = calculateNocturnalRhrDip(66, 62)
    expect(dip.classification).toBe('non_dipper')

    // Red Gate decision & Active Deload generation
    const readiness = calculateReadinessScore({
      sleepHours: 4.8,
      sleepQuality: 3,
      restingHeartRate: 64,
      baselineRhr: 52,
      sorenessLevel: 8,
      stressLevel: 8,
      recentWorkloadUnits: [800, 850, 0, 950, 850, 0, 850],
      chronicAvgWeeklyWorkload: 2100,
    })
    expect(readiness.gate).toBe('RED')
    expect(readiness.workoutAction).toBe('trigger_deload')
    expect(readiness.deloadPlan).toBeDefined()
    expect(readiness.deloadPlan?.days.length).toBe(7)
    expect(readiness.deloadPlan?.volumeReduction).toContain('-40%')
    expect(readiness.deloadPlan?.days[0].rpeCap).toBe(7)
    expect(readiness.intensityMultiplier).toBeLessThanOrEqual(0.85)
  })

  it('Scenario 3: Moderate CNS Fatigue & Autoregulation Adjustment (Yellow Gate)', () => {
    const readiness = calculateReadinessScore({
      sleepHours: 6.4,
      sleepQuality: 6,
      restingHeartRate: 56,
      baselineRhr: 52,
      sorenessLevel: 6,
      stressLevel: 5,
      recentWorkloadUnits: [450, 500, 0, 480, 520, 0, 500],
      chronicAvgWeeklyWorkload: 2000,
    })
    expect(readiness.gate).toBe('YELLOW')
    expect(readiness.workoutAction).toBe('reduce_volume')
    expect(readiness.rpeCap).toBe(8.0)
    expect(readiness.restIntervalAdjustmentSec).toBe(30)
    expect(readiness.intensityMultiplier).toBe(0.85)
  })

  it('Scenario 4: Cryptographic Webhook Security & HIPAA (1996) Privacy Standard', async () => {
    const secret = 'forge_whsec_99a8b7c6d5e4f3a2b1c0'
    const validHeader = `Bearer ${secret}`
    const invalidHeader = 'Bearer forged_token_invalid_secret_99'

    expect(verifyAppleHealthWebhookToken(validHeader, secret)).toBe(true)
    expect(verifyAppleHealthWebhookToken(invalidHeader, secret)).toBe(false)
    expect(verifyGoogleHealthWebhookToken(validHeader, secret)).toBe(true)

    // Token creation and base URL security
    const link = await generateVitalLinkToken('client-hipaa-test', 'apple_health')
    expect(link.linkToken).toBeTruthy()
    expect(link.connectUrl).toContain('link.tryvital.io')
    expect(getVitalApiBaseUrl().startsWith('https://')).toBe(true)
  })
})
