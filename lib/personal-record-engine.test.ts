import { describe, it, expect } from 'vitest'
import {
  detectPersonalRecord,
  computeExercisePrVault,
  extractWeightLbs,
  normalizeExerciseNameKey,
} from './personal-record-engine'

describe('Personal Record (PR) & 1RM Telemetry Engine', () => {
  it('normalizes exercise names accurately', () => {
    expect(normalizeExerciseNameKey('Barbell Bench Press')).toBe('barbellbenchpress')
    expect(normalizeExerciseNameKey('  Dumbbell Squat To Overhead Press  ')).toBe('dumbbellsquattooverheadpress')
  })

  it('extracts weight in lbs correctly from kg or lbs', () => {
    expect(extractWeightLbs({ weightLbs: 225 })).toBe(225)
    expect(extractWeightLbs({ weight_kg: 100 })).toBe(220.5)
  })

  it('detects a first-time PR record correctly', () => {
    const currentSet = {
      exerciseName: 'Barbell Back Squat',
      weightLbs: 225,
      reps: 5,
    }
    const result = detectPersonalRecord(currentSet, [])
    expect(result.isNewPr).toBe(true)
    expect(result.isFirstRecord).toBe(true)
    expect(result.new1RmLbs).toBeGreaterThan(225)
  })

  it('detects when an athlete breaks their all-time PR', () => {
    const priorHistory = [
      { exercise_name: 'Barbell Bench Press', weight_kg: 83.91, reps: 5, session_date: '2026-08-01' }, // ~185 lbs x 5 => ~210 1RM
      { exercise_name: 'Barbell Bench Press', weight_kg: 92.98, reps: 5, session_date: '2026-08-10' }, // ~205 lbs x 5 => ~233 1RM
    ]

    const newPrSet = {
      exerciseName: 'Barbell Bench Press',
      weightLbs: 225, // 225 x 5 => ~256 1RM
      reps: 5,
    }

    const result = detectPersonalRecord(newPrSet, priorHistory)
    expect(result.isNewPr).toBe(true)
    expect(result.isFirstRecord).toBe(false)
    expect(result.deltaLbs).toBeGreaterThan(15)
    expect(result.percentageIncrease).toBeGreaterThan(5)
  })

  it('correctly rejects sub-maximal or non-PR sets', () => {
    const priorHistory = [
      { exercise_name: 'Deadlift', weightLbs: 315, reps: 5, session_date: '2026-08-01' }, // 315 x 5 => ~359 1RM
    ]

    const lightSet = {
      exerciseName: 'Deadlift',
      weightLbs: 225,
      reps: 5,
    }

    const result = detectPersonalRecord(lightSet, priorHistory)
    expect(result.isNewPr).toBe(false)
    expect(result.deltaLbs).toBe(0)
  })

  it('ignores warm-up sets from PR calculations', () => {
    const priorHistory = [
      { exercise_name: 'Overhead Press', weightLbs: 135, reps: 5, is_warmup: false },
    ]

    const warmupSet = {
      exerciseName: 'Overhead Press',
      weightLbs: 185,
      reps: 10,
      isWarmup: true,
    }

    const result = detectPersonalRecord(warmupSet, priorHistory)
    expect(result.isNewPr).toBe(false)
  })

  it('computes complete exercise PR vault with progression curves', () => {
    const logs = [
      { exercise_name: 'Incline DB Press', weightLbs: 60, reps: 10, session_date: '2026-08-01' },
      { exercise_name: 'Incline DB Press', weightLbs: 70, reps: 8, session_date: '2026-08-15' },
      { exercise_name: 'Incline DB Press', weightLbs: 75, reps: 8, session_date: '2026-08-29' },
      { exercise_name: 'Incline DB Press', weightLbs: 40, reps: 10, is_warmup: true, session_date: '2026-08-29' },
    ]

    const vault = computeExercisePrVault(logs)
    const dbPressPr = vault.get(normalizeExerciseNameKey('Incline DB Press'))

    expect(dbPressPr).toBeDefined()
    expect(dbPressPr?.totalSetsLogged).toBe(3) // Excluded 1 warmup
    expect(dbPressPr?.bestSetWeightLbs).toBe(75)
    expect(dbPressPr?.progressionCurve.length).toBe(3)
    expect(dbPressPr?.allTimeBest1RmLbs).toBeGreaterThan(85)
  })
})
