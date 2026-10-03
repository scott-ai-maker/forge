import { describe, it, expect } from 'vitest'
import {
  calculateAcwr,
  calculateReadinessScore,
  generateDeloadMicrocycle,
} from './readiness-telemetry'

describe('Autonomous CNS Readiness & Dynamic Deload Engine', () => {
  it('calculates optimal Green readiness score when biometrics are fresh', () => {
    const res = calculateReadinessScore({
      sleepHours: 8.5,
      sleepQuality: 9,
      restingHeartRate: 50,
      baselineRhr: 52,
      sorenessLevel: 2,
      stressLevel: 2,
      recentWorkloadUnits: [400, 450, 0, 420, 450, 0, 400],
      chronicAvgWeeklyWorkload: 2150,
    })

    expect(res.gate).toBe('GREEN')
    expect(res.score).toBeGreaterThanOrEqual(90)
    expect(res.workoutAction).toBe('proceed_normal')
    expect(res.rpeCap).toBe(9.5)
    expect(res.restIntervalAdjustmentSec).toBe(0)
    expect(res.acwr.zone).toBe('Sweet Spot (Optimal Overload)')
  })

  it('calculates 100 score for perfect physiological recovery', () => {
    const res = calculateReadinessScore({
      sleepHours: 8.0,
      sleepQuality: 10,
      restingHeartRate: 50,
      baselineRhr: 52,
      sorenessLevel: 1,
      stressLevel: 1,
    })

    expect(res.score).toBe(100)
    expect(res.gate).toBe('GREEN')
  })

  it('evaluates default UI baseline inputs to Green gate (>= 80)', () => {
    const res = calculateReadinessScore({
      sleepHours: 7.9,
      sleepQuality: 8,
      restingHeartRate: 54,
      baselineRhr: 52,
      sorenessLevel: 3,
      stressLevel: 3,
    })

    expect(res.gate).toBe('GREEN')
    expect(res.score).toBeGreaterThanOrEqual(80)
  })

  it('calculates Yellow readiness score and recommends volume moderation when moderately fatigued', () => {
    const res = calculateReadinessScore({
      sleepHours: 6.5,
      sleepQuality: 6,
      restingHeartRate: 54,
      baselineRhr: 52,
      sorenessLevel: 6,
      stressLevel: 5,
    })

    expect(res.gate).toBe('YELLOW')
    expect(res.score).toBeGreaterThanOrEqual(55)
    expect(res.score).toBeLessThan(80)
    expect(res.workoutAction).toBe('reduce_volume')
    expect(res.rpeCap).toBe(8.0)
    expect(res.restIntervalAdjustmentSec).toBe(30)
  })

  it('triggers Red gate and generates a 1-Week Active Deload when ACWR exceeds 1.50', () => {
    const res = calculateReadinessScore({
      sleepHours: 5.5,
      sleepQuality: 4,
      restingHeartRate: 62,
      baselineRhr: 52, // +10 BPM elevated
      sorenessLevel: 8,
      stressLevel: 8,
      recentWorkloadUnits: [800, 850, 0, 900, 850, 0, 900], // 4300 acute
      chronicAvgWeeklyWorkload: 2200, // 4300 / 2200 = 1.95 ACWR (Extreme Danger)
    })

    expect(res.gate).toBe('RED')
    expect(res.workoutAction).toBe('trigger_deload')
    expect(res.acwr.deloadRecommended).toBe(true)
    expect(res.acwr.zone).toBe('Danger Zone (OTS Risk)')
    expect(res.deloadPlan).toBeDefined()
    expect(res.deloadPlan?.days.length).toBe(7)
    expect(res.deloadPlan?.volumeReduction).toContain('-40%')
  })

  it('generates a 7-day periodized active deload microcycle with CPT-7 Chapter 21 protocols', () => {
    const deload = generateDeloadMicrocycle()
    expect(deload.durationDays).toBe(7)
    expect(deload.days[0].volumeReductionPct).toBe(45)
    expect(deload.days[0].rpeCap).toBe(7)
    expect(deload.days[1].title).toContain('Parasympathetic Active Recovery')
  })

  it('returns NO_DATA gate and null score when no biometric or ACWR telemetry exists', () => {
    const res = calculateReadinessScore({})

    expect(res.gate).toBe('NO_DATA')
    expect(res.score).toBeNull()
    expect(res.hasTelemetry).toBe(false)
    expect(res.tier).toBe('Awaiting Telemetry')
    expect(res.color).toBe('#94A3B8')
    expect(res.acwr.hasData).toBe(false)
    expect(res.acwr.ratio).toBeNull()
    expect(res.acwr.zone).toBe('No Data')
  })

  it('returns NO_DATA gate when explicit null inputs are provided', () => {
    const res = calculateReadinessScore({
      sleepHours: null,
      sleepQuality: null,
      restingHeartRate: null,
      baselineRhr: null,
      sorenessLevel: null,
      stressLevel: null,
      recentWorkloadUnits: null,
      chronicAvgWeeklyWorkload: null,
    })

    expect(res.gate).toBe('NO_DATA')
    expect(res.score).toBeNull()
    expect(res.hasTelemetry).toBe(false)
  })

  it('returns No Data for ACWR when workload volume units are empty or zero', () => {
    const acwr = calculateAcwr([], 0)
    expect(acwr.hasData).toBe(false)
    expect(acwr.ratio).toBeNull()
    expect(acwr.zone).toBe('No Data')
    expect(acwr.injuryRiskPercentage).toBe(0)
    expect(acwr.deloadRecommended).toBe(false)
    expect(acwr.clinicalRationale).toContain('No workload telemetry')
  })

  it('calibrates baseline during cold start when acute workload has no established chronic baseline', () => {
    // Athlete logged 4000 acute units, but chronic weekly baseline is not yet established (0 or equals acute)
    const acwr = calculateAcwr([600, 600, 600, 600, 600, 500, 500], 0)
    expect(acwr.hasData).toBe(true)
    expect(acwr.isCalibrating).toBe(true)
    expect(acwr.ratio).toBe(1.00)
    expect(acwr.zone).toBe('Sweet Spot (Optimal Overload)')
    expect(acwr.deloadRecommended).toBe(false)
    expect(acwr.clinicalRationale).toContain('Baseline calibration')
  })
})
