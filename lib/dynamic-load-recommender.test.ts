import { describe, it, expect } from 'vitest'
import {
  recommendWorkingLoad,
  calculateBestHistorical1Rm,
  parseTargetRepValue,
} from './dynamic-load-recommender'

describe('dynamic-load-recommender', () => {
  describe('parseTargetRepValue', () => {
    it('correctly parses rep ranges and single values', () => {
      expect(parseTargetRepValue('8-12')).toBe(10)
      expect(parseTargetRepValue('12-20')).toBe(16)
      expect(parseTargetRepValue('4-6')).toBe(5)
      expect(parseTargetRepValue('15')).toBe(15)
      expect(parseTargetRepValue(null, 12)).toBe(12)
    })
  })

  describe('calculateBestHistorical1Rm', () => {
    it('accurately derives highest 1RM across previous set logs', () => {
      const sets = [
        { weightLbs: 185, reps: 8 }, // 1RM ~ 234 lbs
        { weightLbs: 205, reps: 5 }, // 1RM ~ 239 lbs
        { weightLbs: 135, reps: 15, isWarmup: true }, // ignored warmup
      ]
      const { best1RmLbs, best1RmKg } = calculateBestHistorical1Rm(sets)
      expect(best1RmLbs).toBeGreaterThan(230)
      expect(best1RmKg).toBeGreaterThan(100)
    })

    it('handles metric kg inputs accurately', () => {
      const sets = [{ weightKg: 100, reps: 5 }] // 220.46 lbs * 5 reps -> ~257 lbs 1RM (~116 kg)
      const { best1RmLbs, best1RmKg } = calculateBestHistorical1Rm(sets)
      expect(best1RmLbs).toBeGreaterThan(250)
      expect(best1RmKg).toBeGreaterThan(114)
    })
  })

  describe('recommendWorkingLoad', () => {
    const squatHistory = [
      { weightLbs: 225, reps: 5, sessionDate: '2026-08-20' }, // 1RM ~ 262 lbs
    ]

    it('prescribes Phase 1 (Stabilization) load with 4/2/1 tempo and ~60% 1RM', () => {
      const result = recommendWorkingLoad({
        exerciseName: 'Barbell Back Squat',
        nasmOptPhase: 1,
        targetRepsText: '12-20',
        historicalSets: squatHistory,
        dailyReadinessScore: 85,
        preferredUnits: 'imperial',
      })

      expect(result.recommendedTempo).toBe('4/2/1')
      expect(result.recommendedReps).toBe(16)
      expect(result.targetIntensityPercentage).toBeLessThanOrEqual(70)
      expect(result.recommendedWeightLbs).toBe(150) // ~58% of 262 = 152 -> 150 lbs rounded
    })

    it('prescribes Phase 4 (Max Strength) load with ~90% 1RM and high RPE', () => {
      const result = recommendWorkingLoad({
        exerciseName: 'Barbell Back Squat',
        nasmOptPhase: 4,
        targetRepsText: '1-5',
        historicalSets: squatHistory,
        dailyReadinessScore: 85,
        preferredUnits: 'imperial',
      })

      expect(result.targetIntensityPercentage).toBeGreaterThanOrEqual(85)
      expect(result.recommendedRpe).toBe(9.0)
      expect(result.recommendedWeightLbs).toBeGreaterThan(220)
    })

    it('boosts load for CNS Primed athlete (Readiness >= 90%)', () => {
      const result = recommendWorkingLoad({
        exerciseName: 'Barbell Back Squat',
        nasmOptPhase: 3,
        targetRepsText: '8-12',
        historicalSets: squatHistory,
        dailyReadinessScore: 94,
        preferredUnits: 'imperial',
      })

      expect(result.badge).toContain('PR Opportunity')
      expect(result.appliedReadinessModifier).toBe(2.5)
      expect(result.isAutoregulated).toBe(true)
    })

    it('auto-regulates load down when ACWR is in Danger Zone (>= 1.5)', () => {
      const result = recommendWorkingLoad({
        exerciseName: 'Barbell Back Squat',
        nasmOptPhase: 3,
        targetRepsText: '8-12',
        historicalSets: squatHistory,
        dailyReadinessScore: 80,
        acwrRatio: 1.62,
        preferredUnits: 'imperial',
      })

      expect(result.badge).toContain('Fatigue Shield')
      expect(result.appliedReadinessModifier).toBe(-10)
      expect(result.isAutoregulated).toBe(true)
    })

    it('formats metric outputs with 2.5 kg rounding', () => {
      const result = recommendWorkingLoad({
        exerciseName: 'Barbell Bench Press',
        nasmOptPhase: 3,
        targetRepsText: '10',
        historicalSets: [{ weightKg: 80, reps: 8 }], // 1RM ~ 101 kg
        dailyReadinessScore: 85,
        preferredUnits: 'metric',
      })

      expect(result.recommendedWeightKg % 2.5).toBe(0)
    })

    it('assigns conservative safe starter loads for unlogged exercises instead of arbitrary 45/95 lbs', () => {
      // Bodyweight pushup
      const pushup = recommendWorkingLoad({
        exerciseName: 'Push-Up',
        nasmOptPhase: 1,
        historicalSets: [],
      })
      expect(pushup.recommendedWeightLbs).toBe(0)

      // Single-joint DB lateral raise
      const lateralRaise = recommendWorkingLoad({
        exerciseName: 'Dumbbell Lateral Raise',
        nasmOptPhase: 1,
        historicalSets: [],
      })
      expect(lateralRaise.recommendedWeightLbs).toBe(10)

      // Dumbbell Goblet Squat
      const gobletSquat = recommendWorkingLoad({
        exerciseName: 'Goblet Squat',
        nasmOptPhase: 1,
        historicalSets: [],
      })
      expect(gobletSquat.recommendedWeightLbs).toBe(25)

      // Bodyweight Floor Bridge
      const floorBridge = recommendWorkingLoad({
        exerciseName: 'Single Leg Floor Bridge',
        nasmOptPhase: 1,
        historicalSets: [],
      })
      expect(floorBridge.recommendedWeightLbs).toBe(0)

      // Standing Scaption
      const scaption = recommendWorkingLoad({
        exerciseName: 'Standing Scaption',
        nasmOptPhase: 1,
        historicalSets: [],
      })
      expect(scaption.recommendedWeightLbs).toBe(10)
    })

    it('resolves physiologically compatible tempos for static holds and plyometrics in load recommendations', () => {
      const plank = recommendWorkingLoad({
        exerciseName: 'Front Plank',
        nasmOptPhase: 1,
        historicalSets: [],
      })
      expect(plank.recommendedTempo).toBe('Hold 30-60s')

      const squatJump = recommendWorkingLoad({
        exerciseName: 'Squat Jump',
        nasmOptPhase: 1,
        historicalSets: [],
      })
      expect(squatJump.recommendedTempo).toBe('Explosive -> 3-5s landing freeze')
    })

    it('clamps load to 75% 1RM and RPE to 7.5 max for hypertension / cardiac medications', () => {
      // In Phase 4 Maximal Strength (normally 90% 1RM, RPE 9.0)
      const cardiacResult = recommendWorkingLoad({
        exerciseName: 'Barbell Bench Press',
        nasmOptPhase: 4,
        targetRepsText: '3-5',
        historicalSets: [{ weightLbs: 200, reps: 5 }], // 1RM ~ 230 lbs
        hasHeartMedications: true,
      })

      expect(cardiacResult.targetIntensityPercentage).toBeLessThanOrEqual(75)
      expect(cardiacResult.recommendedRpe).toBeLessThanOrEqual(7.5)
      expect(cardiacResult.badge).toContain('Cardiac Guard')
      expect(cardiacResult.rationale).toContain('Valsalva maneuver')
    })

    it('clamps load to 75% 1RM for osteoporosis / osteopenia clients', () => {
      const osteoResult = recommendWorkingLoad({
        exerciseName: 'Goblet Squat',
        nasmOptPhase: 4,
        targetRepsText: '4',
        historicalSets: [{ weightLbs: 60, reps: 5 }],
        specialPopulation: 'osteoporosis_osteopenia',
      })

      expect(osteoResult.targetIntensityPercentage).toBeLessThanOrEqual(75)
      expect(osteoResult.badge).toContain('Bone Density Protocol')
      expect(osteoResult.rationale).toContain('fracture risk')
    })
  })
})

