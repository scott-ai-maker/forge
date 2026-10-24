import { describe, it, expect } from 'vitest'
import {
  normalizeExerciseName,
  exerciseDraftKey,
  workoutDayTag,
  extractWorkoutDayTag,
  parseSetTarget,
  buildWorkoutSetPayload,
  type InlineSetDraft,
} from './useWorkoutSetLogger'

describe('useWorkoutSetLogger Mechanics & Biomechanical Offline Payload Builder', () => {
  it('normalizes exercise names into standardized lookup tokens', () => {
    expect(normalizeExerciseName('Barbell Bench Press')).toBe('barbellbenchpress')
    expect(normalizeExerciseName('Single-Leg Squat (Pistol)')).toBe('singlelegsquatpistol')
    expect(normalizeExerciseName('Romanian Deadlift (RDL)')).toBe('romaniandeadliftrdl')
    expect(normalizeExerciseName('45° Incline Dumbbell Press')).toBe('45inclinedumbbellpress')
  })

  it('generates consistent draft keys for workout days and exercises', () => {
    expect(exerciseDraftKey(1, 'Barbell Back Squat')).toBe('1-Barbell Back Squat')
    expect(exerciseDraftKey(3, 'Pull-Up')).toBe('3-Pull-Up')
  })

  it('creates and extracts workout day tags cleanly from set notes', () => {
    expect(workoutDayTag(1)).toBe('[day:1]')
    expect(workoutDayTag(4)).toBe('[day:4]')

    expect(extractWorkoutDayTag('[day:2] Felt smooth, no knee pain')).toBe(2)
    expect(extractWorkoutDayTag('RPE 9 [day:5] Final burn set')).toBe(5)
    expect(extractWorkoutDayTag('Notes without day tag')).toBeNull()
    expect(extractWorkoutDayTag(null)).toBeNull()
    expect(extractWorkoutDayTag(undefined)).toBeNull()
  })

  it('parses target set counts from diverse string and numeric formats', () => {
    expect(parseSetTarget(3)).toBe(3)
    expect(parseSetTarget('4')).toBe(4)
    expect(parseSetTarget('3 - 5')).toBe(5) // Upper bound of range
    expect(parseSetTarget('2-3')).toBe(3)
    expect(parseSetTarget(null)).toBe(3)
    expect(parseSetTarget(undefined)).toBe(3)
    expect(parseSetTarget('invalid')).toBe(3)
  })

  it('builds clinical workout set payloads with full tempo, RPE, and day tags for online and offline sync', () => {
    const draft: InlineSetDraft = {
      sessionDate: '2026-10-24',
      setNumber: '3',
      reps: '8',
      weight: '225',
      tempo: '4/2/1',
      restSeconds: '120',
      rpe: '8.5',
      rir: '1.5',
      isWarmup: false,
      notes: 'Controlled eccentric cadence, paused 2s in hole',
    }

    const payload = buildWorkoutSetPayload(
      draft,
      'Barbell Back Squat',
      1,
      '4/2/1',
      102.058, // 225 lbs in kg
      120
    )

    expect(payload.sessionDate).toBe('2026-10-24')
    expect(payload.exerciseName).toBe('Barbell Back Squat')
    expect(payload.setNumber).toBe(3)
    expect(payload.reps).toBe(8)
    expect(payload.weightKg).toBeCloseTo(102.058, 2)
    expect(payload.restSeconds).toBe(120)
    expect(payload.rpe).toBe(8.5)
    expect(payload.rir).toBe(1.5)
    expect(payload.isWarmup).toBe(false)
    expect(payload.tempo).toBe('4/2/1')
    expect(payload.notes).toBe('[day:1] Controlled eccentric cadence, paused 2s in hole')
  })

  it('handles warmup sets and undefined optional metrics without corrupting payload', () => {
    const warmupDraft: InlineSetDraft = {
      sessionDate: '2026-10-24',
      setNumber: '1',
      reps: '15',
      weight: '135',
      restSeconds: '60',
      rpe: '',
      rir: '',
      isWarmup: true,
      notes: '',
    }

    const payload = buildWorkoutSetPayload(
      warmupDraft,
      'Barbell Bench Press',
      2,
      '',
      61.23,
      60
    )

    expect(payload.setNumber).toBe(1)
    expect(payload.reps).toBe(15)
    expect(payload.isWarmup).toBe(true)
    expect(payload.rpe).toBeUndefined()
    expect(payload.rir).toBeUndefined()
    expect(payload.tempo).toBeUndefined()
    expect(payload.notes).toBe('[day:2]')
  })
})
