import { describe, it, expect } from 'vitest'
import {
  generateClusterSetPlan,
  generateMyoRepsPlan,
} from './cluster-myoreps-advisor-engine'

describe('Cluster Set & Myo-Reps Intra-Set Protocol Advisor Engine', () => {
  describe('Cluster Sets', () => {
    it('synthesizes a 3x2 cluster plan for heavy strength/power (6 reps)', () => {
      const plan = generateClusterSetPlan({
        exerciseName: 'Barbell Back Squat',
        currentWeightLbs: 225,
        targetReps: 6,
        units: 'imperial',
      })

      expect(plan.clusterCount).toBe(3)
      expect(plan.repsPerCluster).toBe(2)
      expect(plan.totalReps).toBe(6)
      expect(plan.intraRestSeconds).toBe(20) // Compound default
      expect(plan.totalVolumeLbs).toBe(1350)
      expect(plan.notesTag).toContain('[Cluster: 225lb × (2+2+2)')
      expect(plan.coachVoiceCue).toContain('3 clusters of 2 reps')
    })

    it('synthesizes a 3x3 cluster plan for hypertrophy (8-9 reps)', () => {
      const plan = generateClusterSetPlan({
        exerciseName: 'Dumbbell Incline Bench Press',
        currentWeightLbs: 60,
        targetReps: 8,
        units: 'imperial',
      })

      expect(plan.clusterCount).toBe(3)
      expect(plan.repsPerCluster).toBe(3)
      expect(plan.totalReps).toBe(9)
      expect(plan.totalVolumeLbs).toBe(540)
      expect(plan.notesTag).toContain('(3+3+3)')
    })

    it('synthesizes 15s intra-rest for isolation movements', () => {
      const plan = generateClusterSetPlan({
        exerciseName: 'Dumbbell Lateral Raise',
        currentWeightLbs: 25,
        targetReps: 10,
        units: 'imperial',
      })

      expect(plan.intraRestSeconds).toBe(15) // Isolation
      expect(plan.clusterCount).toBe(3)
      expect(plan.repsPerCluster).toBe(4)
      expect(plan.totalReps).toBe(12)
    })

    it('strictly enforces neutral grip guardrails on hammer curls', () => {
      const plan = generateClusterSetPlan({
        exerciseName: 'Dumbbell Hammer Curl',
        currentWeightLbs: 35,
        targetReps: 8,
        units: 'imperial',
      })

      expect(plan.isHammerCurl).toBe(true)
      expect(plan.guardrailMandate).toBeDefined()
      expect(plan.guardrailMandate).toContain('thumbs pointed up toward ceiling')
      expect(plan.guardrailMandate).toContain('zero wrist twisting/supination')
      expect(plan.guardrailMandate).toContain('vertical')
    })
  })

  describe('Myo-Reps', () => {
    it('synthesizes an activation set plus 4 mini-sets of 3 reps', () => {
      const plan = generateMyoRepsPlan({
        exerciseName: 'Seated Cable Row',
        currentWeightLbs: 120,
        targetReps: 12,
        units: 'imperial',
      })

      expect(plan.activationReps).toBe(12)
      expect(plan.miniSets.length).toBe(4)
      expect(plan.miniSets.every(s => s.targetReps === 3)).toBe(true)
      expect(plan.totalReps).toBe(24) // 12 + 12
      expect(plan.totalEffectiveReps).toBe(17) // 5 + 12
      expect(plan.notesTag).toContain('[MyoReps: 120lb × 12 + (3+3+3+3)')
      expect(plan.notesTag).toContain('17 Effective Reps')
      expect(plan.coachVoiceCue).toContain('12 rep activation set')
    })

    it('supports metric units conversion correctly', () => {
      const plan = generateMyoRepsPlan({
        exerciseName: 'Leg Extension',
        currentWeightLbs: 88, // ~40kg
        targetReps: 10,
        units: 'metric',
      })

      expect(plan.activationWeightKg).toBeCloseTo(40, 0)
      expect(plan.notesTag).toContain('kg')
    })

    it('strictly enforces neutral grip guardrails for Myo-Reps on hammer curls', () => {
      const plan = generateMyoRepsPlan({
        exerciseName: 'Single Leg Hammer Curl',
        currentWeightLbs: 30,
        targetReps: 10,
      })

      expect(plan.isHammerCurl).toBe(true)
      expect(plan.guardrailMandate).toBeDefined()
      expect(plan.guardrailMandate).toContain('thumbs pointing up toward ceiling')
      expect(plan.guardrailMandate).toContain('zero wrist supination/twisting')
    })
  })
})
