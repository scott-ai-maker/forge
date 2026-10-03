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

  it('correctly maps heart rate into NASM Zone 2 threshold and %HRmax', () => {
    const age = 30 // HRmax = 190
    const bpm = 150 // ~79% HRmax => Zone 2 (76-85%)
    const duration = 900 // 15 mins

    const telemetry = evaluateLiveCardioTelemetry(bpm, duration, { age, weightKg: 75 })

    expect(telemetry.currentBpm).toBe(150)
    expect(telemetry.hrMaxBpm).toBe(190)
    expect(telemetry.hrPercentMax).toBe(79)
    expect(telemetry.zoneCode).toBe('zone2')
    expect(telemetry.zoneColor).toBe('#F59E0B')
    expect(telemetry.caloriesBurned).toBeGreaterThan(100)
  })

  it('identifies Zone 3 peak anaerobic intensity at high heart rates', () => {
    const age = 30 // HRmax = 190
    const bpm = 175 // ~92% HRmax => Zone 3 (86-95%)
    const duration = 600

    const telemetry = evaluateLiveCardioTelemetry(bpm, duration, { age })
    expect(telemetry.zoneCode).toBe('zone3')
    expect(telemetry.hrPercentMax).toBeGreaterThan(90)
  })
})
