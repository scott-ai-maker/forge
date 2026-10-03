import { describe, it, expect } from 'vitest'
import { computeVolumeOverloadTelemetry } from '@/lib/volume-overload-engine'

describe('VolumeOverloadMiniHud Logic Integration', () => {
  it('correctly calculates current session volume and compares with prior session', () => {
    const historicalLogs = [
      { exerciseName: 'Barbell Bench Press', weightLbs: 225, reps: 5, sessionDate: '2026-09-04' },
      { exerciseName: 'Barbell Bench Press', weightLbs: 225, reps: 5, sessionDate: '2026-09-04' },
      { exerciseName: 'Barbell Bench Press', weightLbs: 230, reps: 5, sessionDate: '2026-09-11' },
      { exerciseName: 'Barbell Bench Press', weightLbs: 230, reps: 5, sessionDate: '2026-09-11' },
    ]

    const result = computeVolumeOverloadTelemetry({
      exerciseName: 'Barbell Bench Press',
      currentSessionDate: '2026-09-11',
      allExerciseLogs: historicalLogs,
      preferredUnits: 'imperial',
    })

    expect(result.currentSessionVolume).toBe(2300)
    expect(result.previousSessionVolume).toBe(2250)
    expect(result.volumeDelta).toBe(50)
    expect(result.volumeDeltaPct).toBeCloseTo(2.2, 1)
  })

  it('correctly reports pristine fatigue when all sets maintain high velocity', () => {
    const logs = [
      { exerciseName: 'Squat', weightLbs: 315, reps: 3, sessionDate: '2026-09-11' },
      { exerciseName: 'Squat', weightLbs: 315, reps: 3, sessionDate: '2026-09-11' },
    ]

    const result = computeVolumeOverloadTelemetry({
      exerciseName: 'Squat',
      currentSessionDate: '2026-09-11',
      allExerciseLogs: logs,
    })

    expect(result.fatigueStatus).toBe('pristine')
    expect(result.currentFatiguePct).toBe(0)
  })

  it('correctly flags elevated fatigue when velocity/reps drop significantly', () => {
    const logs = [
      { exerciseName: 'Lat Pulldown', weightLbs: 180, reps: 12, sessionDate: '2026-09-11' },
      { exerciseName: 'Lat Pulldown', weightLbs: 180, reps: 10, sessionDate: '2026-09-11' },
      { exerciseName: 'Lat Pulldown', weightLbs: 180, reps: 7, sessionDate: '2026-09-11' },
    ]

    const result = computeVolumeOverloadTelemetry({
      exerciseName: 'Lat Pulldown',
      currentSessionDate: '2026-09-11',
      allExerciseLogs: logs,
    })

    expect(result.fatigueStatus).toBe('elevated')
    expect(result.currentFatiguePct).toBeGreaterThanOrEqual(10)
  })
})
