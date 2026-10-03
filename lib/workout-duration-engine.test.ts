import { describe, it, expect } from 'vitest'
import {
  calculateEstimatedWorkoutDuration,
  parseRestSecondsFromExercise,
  parseSetsCount,
  parseRepsCount,
  resolveRepDurationSeconds,
  formatDurationDisplay,
} from './workout-duration-engine'

describe('workout-duration-engine', () => {
  describe('parseRestSecondsFromExercise', () => {
    it('correctly parses rest intervals from plan strings and converts to exact seconds', () => {
      expect(parseRestSecondsFromExercise('60s', 1)).toBe(60)
      expect(parseRestSecondsFromExercise('90s', 3)).toBe(90)
      expect(parseRestSecondsFromExercise('60-90s', 2)).toBe(90)
      expect(parseRestSecondsFromExercise('2-3m', 4)).toBe(180)
      expect(parseRestSecondsFromExercise('3-5m', 5)).toBe(300)
      expect(parseRestSecondsFromExercise('2m', 3)).toBe(120)
      expect(parseRestSecondsFromExercise('45s', 2)).toBe(45)
    })

    it('falls back to NASM OPT phase defaults when rest is unspecified or null', () => {
      expect(parseRestSecondsFromExercise(null, 1, 'resistance')).toBe(60)
      expect(parseRestSecondsFromExercise(null, 2, 'resistance')).toBe(45)
      expect(parseRestSecondsFromExercise(null, 3, 'resistance')).toBe(75)
      expect(parseRestSecondsFromExercise(null, 4, 'resistance')).toBe(240)
      expect(parseRestSecondsFromExercise(null, 5, 'resistance')).toBe(180)
    })
  })

  describe('parseSetsCount and parseRepsCount', () => {
    it('parses sets correctly, taking the upper bound of a range', () => {
      expect(parseSetsCount('3')).toBe(3)
      expect(parseSetsCount('3-4')).toBe(4)
      expect(parseSetsCount('4-5')).toBe(5)
      expect(parseSetsCount(4)).toBe(4)
      expect(parseSetsCount('')).toBe(3)
    })

    it('parses reps correctly, taking average of a range', () => {
      expect(parseRepsCount('10')).toBe(10)
      expect(parseRepsCount('8-12')).toBe(10)
      expect(parseRepsCount('12-15')).toBe(14)
      expect(parseRepsCount('1-5')).toBe(3)
      expect(parseRepsCount(12)).toBe(12)
    })
  })

  describe('resolveRepDurationSeconds', () => {
    it('parses tempos like 4/2/1 and 2/0/2 accurately', () => {
      expect(resolveRepDurationSeconds('4/2/1')).toBe(7)
      expect(resolveRepDurationSeconds('2/0/2')).toBe(4)
      expect(resolveRepDurationSeconds('3/1/2')).toBe(6)
      expect(resolveRepDurationSeconds('slow')).toBe(5)
      expect(resolveRepDurationSeconds('explosive')).toBe(2.5)
    })

    it('uses phase defaults when tempo is unspecified', () => {
      expect(resolveRepDurationSeconds(null, 1)).toBe(7) // Phase 1: 4/2/1
      expect(resolveRepDurationSeconds(null, 3)).toBe(4) // Phase 3: 2/0/2
      expect(resolveRepDurationSeconds(null, 4)).toBe(3) // Phase 4
    })
  })

  describe('formatDurationDisplay', () => {
    it('formats minutes into human readable hours and minutes', () => {
      expect(formatDurationDisplay(45)).toBe('45 mins')
      expect(formatDurationDisplay(60)).toBe('1h')
      expect(formatDurationDisplay(75)).toBe('1h 15m')
      expect(formatDurationDisplay(90)).toBe('1h 30m')
      expect(formatDurationDisplay(95)).toBe('1h 35m')
    })
  })

  describe('calculateEstimatedWorkoutDuration', () => {
    it('accurately estimates a 6-exercise, 24-set Hypertrophy (Phase 3) workout with 90s rest and 20m cardio to ~1.5 hours', () => {
      const workout = {
        focus: 'Upper Body Push Hypertrophy',
        exercises: [
          { name: 'Barbell Bench Press', sets: '4', reps: '8-12', tempo: '2/0/2', rest: '90s', block: 'resistance' },
          { name: 'Incline Dumbbell Press', sets: '4', reps: '10-12', tempo: '2/0/2', rest: '90s', block: 'resistance' },
          { name: 'Standing Overhead Barbell Press', sets: '4', reps: '8-10', tempo: '2/0/2', rest: '90s', block: 'resistance' },
          { name: 'Dumbbell Lateral Raise', sets: '4', reps: '12-15', tempo: '2/0/2', rest: '60s', block: 'resistance' },
          { name: 'Dumbbell Hammer Curl', sets: '4', reps: '10-12', tempo: '2/0/2', rest: '60s', block: 'resistance' },
          { name: 'Triceps Rope Pushdown', sets: '4', reps: '12-15', tempo: '2/0/2', rest: '60s', block: 'resistance' },
        ],
      }

      const cardio = {
        durationMins: 20,
        modality: 'Treadmill Incline Walk',
        targetZone: 'Zone 2',
      }

      const result = calculateEstimatedWorkoutDuration({
        workout,
        cardio,
        optPhase: 3,
      })

      // Breakdown checks
      expect(result.warmupMins).toBeGreaterThanOrEqual(8)
      expect(result.cooldownMins).toBeGreaterThanOrEqual(5)
      expect(result.cardioMins).toBe(20)
      expect(result.totalWorkingSets).toBe(24)
      expect(result.totalExercises).toBe(6)

      // Total rest alone should be substantial (18 intra-set rests + compound ramps)
      expect(result.totalRestSeconds).toBeGreaterThan(1200) // >20 mins of rest alone!

      // Total duration should be between 85 and 100 minutes (1h 25m to 1h 40m, ~1.5 hours)
      expect(result.totalDurationMins).toBeGreaterThanOrEqual(85)
      expect(result.totalDurationMins).toBeLessThanOrEqual(105)
      expect(result.summaryLabel).toMatch(/^1h \d+m$/)
    })

    it('estimates a 5-exercise resistance-only workout with 75s rest to ~50–60 mins (not 30 mins)', () => {
      const workout = {
        focus: 'Lower Body Strength Endurance',
        exercises: [
          { name: 'Barbell Back Squat', sets: '3', reps: '10-12', tempo: '2/0/2', rest: '75s', block: 'resistance' },
          { name: 'Romanian Deadlift', sets: '3', reps: '10-12', tempo: '2/0/2', rest: '75s', block: 'resistance' },
          { name: 'Walking Lunge', sets: '3', reps: '12 reps', tempo: '2/0/2', rest: '60s', block: 'resistance' },
          { name: 'Standing Calf Raise', sets: '3', reps: '15 reps', tempo: '2/0/2', rest: '60s', block: 'resistance' },
          { name: 'Plank', sets: '3', reps: '45s hold', rest: '45s', block: 'activation' },
        ],
      }

      const result = calculateEstimatedWorkoutDuration({
        workout,
        cardio: null,
        optPhase: 2,
      })

      expect(result.totalWorkingSets).toBe(15)
      // 10m warmup + ~30m resistance + 6m cooldown = ~45-55 mins
      expect(result.totalDurationMins).toBeGreaterThanOrEqual(45)
      expect(result.totalDurationMins).toBeLessThanOrEqual(60)
    })

    it('accounts for long rest periods (3–5 min) in NASM OPT Phase 4 (Maximal Strength)', () => {
      const workout = {
        focus: 'Maximal Strength Deadlift & Squat',
        exercises: [
          { name: 'Barbell Back Squat', sets: '5', reps: '3-5', rest: '3-5m', block: 'resistance' },
          { name: 'Barbell Deadlift', sets: '5', reps: '3-5', rest: '3-5m', block: 'resistance' },
          { name: 'Barbell Bench Press', sets: '4', reps: '3-5', rest: '3-5m', block: 'resistance' },
        ],
      }

      const result = calculateEstimatedWorkoutDuration({
        workout,
        cardio: null,
        optPhase: 4,
      })

      // 14 sets with ~4-5m rest = ~45-60 mins of rest alone!
      expect(result.totalRestSeconds).toBeGreaterThan(2400)
      expect(result.totalDurationMins).toBeGreaterThanOrEqual(70)
    })
  })
})

