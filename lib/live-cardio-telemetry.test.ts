import { describe, it, expect } from 'vitest'
import {
  calculateLiveCaloricBurn,
  evaluateLiveCardioTelemetry,
} from './live-cardio-telemetry'

describe('Live Cardiorespiratory & Caloric Telemetry Engine', () => {
  it('calculates zero calories for zero duration or BPM', () => {
    expect(calculateLiveCaloricBurn({ bpm: 0, durationSeconds: 100 })).toEqual({
      caloriesBurned: 0,
      caloriesPerMinute: 0,
    })
    expect(calculateLiveCaloricBurn({ bpm: 140, durationSeconds: 0 })).toEqual({
      caloriesBurned: 0,
      caloriesPerMinute: 0,
    })
  })

  it('calculates realistic caloric burn for moderate workout session', () => {
    // 30 min at 145 BPM, 80kg male age 30
    const result = calculateLiveCaloricBurn({
      bpm: 145,
      durationSeconds: 1800, // 30 mins
      weightKg: 80,
      age: 30,
      gender: 'male',
    })

    expect(result.caloriesPerMinute).toBeGreaterThan(8)
    expect(result.caloriesPerMinute).toBeLessThan(18)
    expect(result.caloriesBurned).toBeGreaterThan(250)
    expect(result.caloriesBurned).toBeLessThan(550)
  })

  it('correctly maps heart rate into NASM Zone 2 threshold and Tanaka %HRmax', () => {
    const age = 30 // Tanaka HRmax = 208 - (0.7 * 30) = 187
    const bpm = 150 // 150 / 187 = 80% HRmax => Zone 2 (76-85%)
    const duration = 900 // 15 mins

    const telemetry = evaluateLiveCardioTelemetry(bpm, duration, { age, weightKg: 75 })

    expect(telemetry.currentBpm).toBe(150)
    expect(telemetry.hrMaxBpm).toBe(187)
    expect(telemetry.hrPercentMax).toBe(80)
    expect(telemetry.zoneCode).toBe('zone2')
    expect(telemetry.zoneColor).toBe('#F59E0B')
    expect(telemetry.caloriesBurned).toBeGreaterThan(100)
  })

  it('identifies Zone 3 peak anaerobic intensity at high heart rates and stays consistent for older athletes', () => {
    const age = 60 // Tanaka HRmax = 208 - (0.7 * 60) = 166
    const bpm = 156 // 156 / 166 = 94% HRmax => Zone 3 (86-95%)
    const duration = 600

    const telemetry = evaluateLiveCardioTelemetry(bpm, duration, {
      age,
      hasHeartMedications: true,
    })
    expect(telemetry.hrMaxBpm).toBe(166)
    expect(telemetry.hrPercentMax).toBe(94)
    expect(telemetry.zoneCode).toBe('zone3')
    expect(telemetry.isMedicationSuppressed).toBe(true)
    expect(telemetry.zoneDescription).toContain('Medication Alert')
  })

  it('guards non-finite BPM and duration inputs gracefully', () => {
    expect(calculateLiveCaloricBurn({ bpm: Number.NaN, durationSeconds: 600 })).toEqual({
      caloriesBurned: 0,
      caloriesPerMinute: 0,
    })
    const nanTelemetry = evaluateLiveCardioTelemetry(Number.NaN, Number.NaN, { age: Number.NaN })
    expect(Number.isFinite(nanTelemetry.currentBpm)).toBe(true)
    expect(Number.isFinite(nanTelemetry.hrPercentMax)).toBe(true)
    expect(nanTelemetry.caloriesBurned).toBe(0)
  })
})
