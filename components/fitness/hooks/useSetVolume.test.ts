import { describe, expect, it } from 'vitest'
import {
  normalizeExerciseName,
  parseSetTarget,
  formatVolumeDisplay,
  computeExerciseProgression,
  computeExerciseVolume,
  computeWorkoutProgressByDay,
  type WorkoutSetLogRecord,
} from './useSetVolume'

describe('useSetVolume Logic & Telemetry Engine', () => {
  const sampleSetLogs: WorkoutSetLogRecord[] = [
    {
      id: 'set-1',
      session_date: '2026-09-10',
      exercise_name: 'Barbell Bench Press',
      set_number: 1,
      reps: 10,
      weight_kg: 80,
      rpe: 8,
      notes: '[workout-day:1] Working set 1',
    },
    {
      id: 'set-2',
      session_date: '2026-09-10',
      exercise_name: 'Barbell Bench Press',
      set_number: 2,
      reps: 8,
      weight_kg: 85,
      rpe: 9,
      notes: '[workout-day:1] Working set 2',
    },
    {
      id: 'set-3',
      session_date: '2026-09-11',
      exercise_name: 'Barbell Back Squat',
      set_number: 1,
      reps: 5,
      weight_kg: 100,
      rpe: 8.5,
      notes: '[workout-day:2] Working set 1',
    },
    {
      id: 'set-4',
      session_date: '2026-09-11',
      exercise_name: 'Barbell Back Squat',
      set_number: 0,
      reps: 10,
      weight_kg: 40,
      is_warmup: true,
      notes: '[workout-day:2] Warm-up ramp',
    },
  ]

  it('normalizes exercise names and parses set targets correctly', () => {
    expect(normalizeExerciseName('  Barbell Bench Press  ')).toBe('barbell bench press')
    expect(normalizeExerciseName('Dumbbell  Incline   Curl')).toBe('dumbbell incline curl')

    expect(parseSetTarget('3')).toBe(3)
    expect(parseSetTarget('3-4')).toBe(4)
    expect(parseSetTarget('3 to 5')).toBe(5)
    expect(parseSetTarget('')).toBe(0)
    expect(parseSetTarget(null)).toBe(0)
  })

  it('formats volume display strings for imperial and metric units', () => {
    // 100 kg is ~220 lbs
    expect(formatVolumeDisplay(100, 'imperial')).toBe('220 lbs')
    expect(formatVolumeDisplay(100, 'metric')).toBe('100 kg')
  })

  it('computes progression timeline, total volume, and average RPE', () => {
    const progression = computeExerciseProgression(sampleSetLogs)
    expect(progression.totalSets).toBe(4)
    expect(progression.totalReps).toBe(33)
    // 800 + 680 + 500 + 400 = 2380 kg
    expect(progression.totalVolumeKg).toBe(2380)
    expect(progression.points.length).toBe(2)
    expect(progression.points[0].date).toBe('2026-09-10')
    expect(progression.points[0].volume).toBe(1480)
    expect(progression.points[1].date).toBe('2026-09-11')
    expect(progression.points[1].volume).toBe(900)
    expect(progression.avgRpe).toBe(8.5)
  })

  it('calculates exercise-specific volume drill-down distinguishing working sets from warm-ups', () => {
    const benchVolume = computeExerciseVolume(sampleSetLogs, 'Barbell Bench Press', 1)
    expect(benchVolume.workingSetsCount).toBe(2)
    expect(benchVolume.allSetsCount).toBe(2)
    expect(benchVolume.totalVolumeKg).toBe(1480)
    expect(benchVolume.totalVolumeLbs).toBe(Math.round(1480 * 2.20462))

    const squatVolume = computeExerciseVolume(sampleSetLogs, 'Barbell Back Squat', 2)
    expect(squatVolume.workingSetsCount).toBe(1)
    expect(squatVolume.allSetsCount).toBe(2)
    expect(squatVolume.totalVolumeKg).toBe(900)
  })

  it('computes workout progress by day matching target sets and volume', () => {
    const mapLogs = new Map<string, WorkoutSetLogRecord[]>()
    mapLogs.set('barbell bench press', sampleSetLogs.slice(0, 2))
    mapLogs.set('barbell back squat', sampleSetLogs.slice(2))

    const planWorkouts = [
      {
        day: 1,
        focus: 'Chest & Triceps',
        exercises: [{ name: 'Barbell Bench Press', sets: '3', reps: '8-10' }],
      },
      {
        day: 2,
        focus: 'Legs & Core',
        exercises: [{ name: 'Barbell Back Squat', sets: '4', reps: '5' }],
      },
    ]

    const progressMap = computeWorkoutProgressByDay(planWorkouts, mapLogs)
    const day1Progress = progressMap.get(1)
    expect(day1Progress?.targetSets).toBe(3)
    expect(day1Progress?.loggedSets).toBe(2)
    expect(day1Progress?.totalVolumeKg).toBe(1480)

    const day2Progress = progressMap.get(2)
    expect(day2Progress?.targetSets).toBe(4)
    expect(day2Progress?.loggedSets).toBe(2)
    expect(day2Progress?.totalVolumeKg).toBe(900)
  })

  it('isolates workout progress by day across microcycle weeks', async () => {
    const { filterSetLogsForMicrocycleWeek } = await import('@/lib/fitness')

    const week1Logs = [
      { id: 'l1', session_date: '2026-09-01', created_at: '2026-09-01T15:00:00Z', completed: true, notes: '[workout-day:1]' },
      { id: 'l2', session_date: '2026-09-02', created_at: '2026-09-02T15:00:00Z', completed: true, notes: '[workout-day:2]' },
      { id: 'l3', session_date: '2026-09-04', created_at: '2026-09-04T15:00:00Z', completed: true, notes: '[workout-day:3]' },
      { id: 'l4', session_date: '2026-09-05', created_at: '2026-09-05T15:00:00Z', completed: true, notes: '[workout-day:4]' },
    ]

    const allHistoricalSets: WorkoutSetLogRecord[] = [
      // Week 1 Day 1 (3 sets completed)
      { id: 's1', session_date: '2026-09-01', created_at: '2026-09-01T14:10:00Z', exercise_name: 'Bench Press', reps: 10, weight_kg: 80, notes: '[workout-day:1]' },
      { id: 's2', session_date: '2026-09-01', created_at: '2026-09-01T14:20:00Z', exercise_name: 'Bench Press', reps: 10, weight_kg: 80, notes: '[workout-day:1]' },
      { id: 's3', session_date: '2026-09-01', created_at: '2026-09-01T14:30:00Z', exercise_name: 'Bench Press', reps: 10, weight_kg: 80, notes: '[workout-day:1]' },
      // Week 1 Day 2 (skipped set 3: only 2 sets)
      { id: 's4', session_date: '2026-09-02', created_at: '2026-09-02T14:10:00Z', exercise_name: 'Back Squat', reps: 5, weight_kg: 100, notes: '[workout-day:2]' },
      { id: 's5', session_date: '2026-09-02', created_at: '2026-09-02T14:20:00Z', exercise_name: 'Back Squat', reps: 5, weight_kg: 100, notes: '[workout-day:2]' },
    ]

    const planWorkouts = [
      { day: 1, focus: 'Upper', exercises: [{ name: 'Bench Press', sets: '3', reps: '10' }] },
      { day: 2, focus: 'Lower', exercises: [{ name: 'Back Squat', sets: '3', reps: '5' }] },
      { day: 3, focus: 'Push', exercises: [{ name: 'Overhead Press', sets: '3', reps: '8' }] },
      { day: 4, focus: 'Pull', exercises: [{ name: 'Deadlift', sets: '3', reps: '5' }] },
    ]

    // In Week 2 (before any sets logged in Week 2):
    const week2ActiveSets = filterSetLogsForMicrocycleWeek({
      setLogs: allHistoricalSets,
      workoutLogs: week1Logs,
      currentWeek: 2,
      sessionsPerWeek: 4,
    })
    expect(week2ActiveSets).toEqual([])

    // Active progress by day for Week 2 must be 0 sets logged across all days
    const week2Map = new Map<string, WorkoutSetLogRecord[]>()
    for (const row of week2ActiveSets) {
      const key = normalizeExerciseName(row.exercise_name)
      const current = week2Map.get(key) ?? []
      current.push(row)
      week2Map.set(key, current)
    }

    const week2Progress = computeWorkoutProgressByDay(planWorkouts, week2Map)
    expect(week2Progress.get(1)?.loggedSets).toBe(0)
    expect(week2Progress.get(2)?.loggedSets).toBe(0)
    expect(week2Progress.get(3)?.loggedSets).toBe(0)
    expect(week2Progress.get(4)?.loggedSets).toBe(0)

    // Now log Set 1 in Week 2 Day 1:
    const week2Day1Set1: WorkoutSetLogRecord = {
      id: 's-w2-1',
      session_date: '2026-09-08',
      created_at: '2026-09-08T14:10:00Z',
      exercise_name: 'Bench Press',
      reps: 10,
      weight_kg: 85,
      notes: '[workout-day:1] [workout-week:2] Set 1',
    }

    const updatedSets = [week2Day1Set1, ...allHistoricalSets]
    const updatedActiveSets = filterSetLogsForMicrocycleWeek({
      setLogs: updatedSets,
      workoutLogs: week1Logs,
      currentWeek: 2,
      sessionsPerWeek: 4,
    })
    expect(updatedActiveSets.length).toBe(1)
    expect(updatedActiveSets[0].id).toBe('s-w2-1')

    const updatedMap = new Map<string, WorkoutSetLogRecord[]>()
    for (const row of updatedActiveSets) {
      const key = normalizeExerciseName(row.exercise_name)
      const current = updatedMap.get(key) ?? []
      current.push(row)
      updatedMap.set(key, current)
    }

    const updatedProgress = computeWorkoutProgressByDay(planWorkouts, updatedMap)
    expect(updatedProgress.get(1)?.loggedSets).toBe(1)
    expect(updatedProgress.get(1)?.targetSets).toBe(3)
    expect(updatedProgress.get(2)?.loggedSets).toBe(0)
  })
})
