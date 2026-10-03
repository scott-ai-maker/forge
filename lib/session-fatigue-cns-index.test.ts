import { describe, it, expect } from 'vitest'
import {
  resolvePrimaryMuscleGroup,
  isAxialLoadingExercise,
  calculateSessionFatigueCnsIndex,
} from './session-fatigue-cns-index'

describe('Session Fatigue & CNS Readiness Index Engine', () => {
  describe('resolvePrimaryMuscleGroup', () => {
    it('accurately resolves anatomical muscle groups with special hammer curl neutral label', () => {
      expect(resolvePrimaryMuscleGroup('Barbell Bench Press').id).toBe('chest')
      expect(resolvePrimaryMuscleGroup('Barbell Back Squat').id).toBe('quads_glutes')
      expect(resolvePrimaryMuscleGroup('Barbell Deadlift').id).toBe('posterior_chain')
      expect(resolvePrimaryMuscleGroup('Overhead Press').id).toBe('shoulders')
      expect(resolvePrimaryMuscleGroup('Barbell Bent-Over Row').id).toBe('back_lats')
      expect(resolvePrimaryMuscleGroup('Tricep Rope Pushdown').id).toBe('arms_triceps')

      const hammer = resolvePrimaryMuscleGroup('Dumbbell Hammer Curl')
      expect(hammer.id).toBe('arms_biceps_forearms')
      expect(hammer.label).toContain('Neutral Hammer')
    })
  })

  describe('isAxialLoadingExercise', () => {
    it('detects heavy spinal compression exercises', () => {
      expect(isAxialLoadingExercise('Barbell Back Squat')).toBe(true)
      expect(isAxialLoadingExercise('Barbell Deadlift')).toBe(true)
      expect(isAxialLoadingExercise('Standing Overhead Press')).toBe(true)
      expect(isAxialLoadingExercise('Dumbbell Lateral Raise')).toBe(false)
      expect(isAxialLoadingExercise('Dumbbell Hammer Curl')).toBe(false)
    })
  })

  describe('calculateSessionFatigueCnsIndex', () => {
    it('evaluates moderate session fatigue and produces accurate muscle distribution', () => {
      const report = calculateSessionFatigueCnsIndex({
        sessionDurationMinutes: 60,
        sessionRpe: 8,
        setLogs: [
          { exercise_name: 'Barbell Back Squat', weight_kg: 100, reps: 8, rpe: 8, rir: 2 },
          { exercise_name: 'Barbell Back Squat', weight_kg: 100, reps: 8, rpe: 8.5, rir: 1.5 },
          { exercise_name: 'Barbell Back Squat', weight_kg: 100, reps: 8, rpe: 9, rir: 1 },
          { exercise_name: 'Barbell Bench Press', weight_kg: 80, reps: 8, rpe: 8, rir: 2 },
          { exercise_name: 'Barbell Bench Press', weight_kg: 80, reps: 8, rpe: 8.5, rir: 1.5 },
        ],
      })

      expect(report.sessionRpe).toBe(8)
      expect(report.fosterTrainingLoadAu).toBe(480) // 8 * 60
      expect(report.loadZoneLabel).toContain('Optimal')
      expect(report.totalWorkingSets).toBe(5)
      expect(report.axialLoadingSetsCount).toBe(3)
      expect(report.cnsScore).toBeGreaterThan(60)
      expect(report.cnsScore).toBeLessThanOrEqual(100)
      expect(report.muscleDistribution.length).toBe(2)

      // Quads & Chest breakdown
      const quads = report.muscleDistribution.find(m => m.muscleGroup === 'quads_glutes')
      expect(quads).toBeDefined()
      expect(quads?.totalSets).toBe(3)
      expect(quads?.highTensionSets).toBe(3)

      const chest = report.muscleDistribution.find(m => m.muscleGroup === 'chest')
      expect(chest).toBeDefined()
      expect(chest?.totalSets).toBe(2)
    })

    it('detects deep CNS drain and long recovery horizon for high-failure sessions', () => {
      const report = calculateSessionFatigueCnsIndex({
        sessionDurationMinutes: 90,
        sessionRpe: 9.5,
        setLogs: [
          { exercise_name: 'Barbell Deadlift', weight_kg: 180, reps: 5, rpe: 10, rir: 0 },
          { exercise_name: 'Barbell Deadlift', weight_kg: 180, reps: 5, rpe: 10, rir: 0 },
          { exercise_name: 'Barbell Back Squat', weight_kg: 140, reps: 6, rpe: 10, rir: 0 },
          { exercise_name: 'Barbell Back Squat', weight_kg: 140, reps: 6, rpe: 9.5, rir: 0.5 },
          { exercise_name: 'Overhead Press', weight_kg: 70, reps: 5, rpe: 10, rir: 0 },
        ],
      })

      expect(report.failureSetsCount).toBe(4)
      expect(report.axialLoadingSetsCount).toBe(5)
      expect(report.cnsScore).toBeLessThan(65)
      expect(report.recoveryHoursNeeded).toBeGreaterThanOrEqual(48)
      expect(report.tier).toMatch(/significant_drain|deep_exhaustion/)
    })

    it('verifies strict neutral grip biomechanical guardrails for hammer curl sets', () => {
      const report = calculateSessionFatigueCnsIndex({
        sessionDurationMinutes: 45,
        sessionRpe: 7.5,
        setLogs: [
          { exercise_name: 'Dumbbell Hammer Curl', weight_kg: 20, reps: 10, rpe: 8, rir: 2 },
          { exercise_name: 'Dumbbell Hammer Curl', weight_kg: 20, reps: 10, rpe: 8, rir: 2 },
        ],
      })

      expect(report.hammerCurlGuardrailVerified).toBe(true)
      expect(report.guardrailMessage).toBeDefined()
      expect(report.guardrailMessage).toContain('Strict neutral hammer grip protocol verified')
      expect(report.guardrailMessage).toContain('thumbs pointing up')
      expect(report.guardrailMessage).toContain('zero wrist twisting')
    })
  })
})
