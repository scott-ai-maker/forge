import { describe, it, expect } from 'vitest'
import {
  computeVolumeOverloadTelemetry,
  normalizeExerciseKey,
  type HistoricalSetLogInput,
} from './volume-overload-engine'

describe('Volume & Progressive Overload Engine', () => {
  it('normalizes exercise keys reliably', () => {
    expect(normalizeExerciseKey('Barbell Bench Press')).toBe('barbellbenchpress')
    expect(normalizeExerciseKey('Dumbbell RDL (Romanian Deadlift)')).toBe('dumbbellrdlromaniandeadlift')
  })

  it('computes volume tonnage across current session sets', () => {
    const logs: HistoricalSetLogInput[] = [
      { exerciseName: 'Barbell Bench Press', weightLbs: 225, reps: 5, sessionDate: '2026-09-11' },
      { exerciseName: 'Barbell Bench Press', weightLbs: 225, reps: 5, sessionDate: '2026-09-11' },
      { exerciseName: 'Barbell Bench Press', weightLbs: 225, reps: 5, sessionDate: '2026-09-11' },
    ]

    const result = computeVolumeOverloadTelemetry({
      exerciseName: 'Barbell Bench Press',
      currentSessionDate: '2026-09-11',
      allExerciseLogs: logs,
      preferredUnits: 'imperial',
    })

    // 225 * 5 = 1125 per set * 3 sets = 3375 lbs
    expect(result.currentSessionVolume).toBe(3375)
    expect(result.currentSessionSetsCount).toBe(3)
    expect(result.currentSessionRepsCount).toBe(15)
    expect(result.peakEstimated1RmLbs).toBeGreaterThanOrEqual(250)
    expect(result.currentFatiguePct).toBe(0)
    expect(result.fatigueStatus).toBe('pristine')
  })

  it('calculates volume delta vs previous session correctly', () => {
    const logs: HistoricalSetLogInput[] = [
      // Previous session
      { exerciseName: 'Barbell Back Squat', weightLbs: 315, reps: 5, sessionDate: '2026-09-04' },
      { exerciseName: 'Barbell Back Squat', weightLbs: 315, reps: 5, sessionDate: '2026-09-04' }, // 3150 lbs total
      // Current session
      { exerciseName: 'Barbell Back Squat', weightLbs: 325, reps: 5, sessionDate: '2026-09-11' },
      { exerciseName: 'Barbell Back Squat', weightLbs: 325, reps: 5, sessionDate: '2026-09-11' }, // 3250 lbs total
    ]

    const result = computeVolumeOverloadTelemetry({
      exerciseName: 'Barbell Back Squat',
      currentSessionDate: '2026-09-11',
      allExerciseLogs: logs,
      preferredUnits: 'imperial',
    })

    expect(result.previousSessionVolume).toBe(3150)
    expect(result.currentSessionVolume).toBe(3250)
    expect(result.volumeDelta).toBe(100)
    expect(result.volumeDeltaPct).toBeCloseTo(3.2, 1)
  })

  it('detects fatigue degradation across sets accurately', () => {
    const logs: HistoricalSetLogInput[] = [
      // Set 1: 200 lbs x 10 reps (Est 1RM ~ 267 lbs)
      { exerciseName: 'Dumbbell Incline Press', weightLbs: 200, reps: 10, sessionDate: '2026-09-11' },
      // Set 2: 200 lbs x 9 reps
      { exerciseName: 'Dumbbell Incline Press', weightLbs: 200, reps: 9, sessionDate: '2026-09-11' },
      // Set 3: 200 lbs x 6 reps (dropoff > 10%)
      { exerciseName: 'Dumbbell Incline Press', weightLbs: 200, reps: 6, sessionDate: '2026-09-11' },
    ]

    const result = computeVolumeOverloadTelemetry({
      exerciseName: 'Dumbbell Incline Press',
      currentSessionDate: '2026-09-11',
      allExerciseLogs: logs,
      preferredUnits: 'imperial',
    })

    expect(result.setsTrajectory.length).toBe(3)
    expect(result.setsTrajectory[0].fatigueDropoffPct).toBe(0)
    expect(result.setsTrajectory[2].fatigueDropoffPct).toBeGreaterThan(10)
    expect(result.fatigueStatus).toBe('elevated')
    expect(result.fatigueGuidance).toContain('Elevated neuromuscular fatigue')
  })

  it('triggers NASM 2-for-2 progressive overload when final set exceeds target reps by 2+ across 2 sessions', () => {
    const logs: HistoricalSetLogInput[] = [
      // Session 1: Target is 10 reps, final set is 12 reps
      { exerciseName: 'Barbell Bench Press', weightLbs: 185, reps: 10, sessionDate: '2026-09-04' },
      { exerciseName: 'Barbell Bench Press', weightLbs: 185, reps: 12, sessionDate: '2026-09-04' },
      // Session 2: Target is 10 reps, final set is 13 reps
      { exerciseName: 'Barbell Bench Press', weightLbs: 185, reps: 10, sessionDate: '2026-09-11' },
      { exerciseName: 'Barbell Bench Press', weightLbs: 185, reps: 13, sessionDate: '2026-09-11' },
    ]

    const result = computeVolumeOverloadTelemetry({
      exerciseName: 'Barbell Bench Press',
      targetRepsText: '10',
      currentSessionDate: '2026-09-11',
      allExerciseLogs: logs,
    })

    expect(result.nasm2For2.eligibleForProgression).toBe(true)
    expect(result.nasm2For2.recommendedWeightIncreaseLbs).toBeGreaterThanOrEqual(5)
  })
})
