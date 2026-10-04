import { describe, it, expect } from 'vitest'
import {
  buildNutritionTargetsSnapshot,
  buildWeightLossGenerationRequest,
  calculateWeightLossTargets,
  parseNutritionTargets,
} from './weight-loss-program'

describe('weight loss program', () => {
  it('returns null targets without weight', () => {
    expect(calculateWeightLossTargets({})).toBeNull()
  })

  it('computes a capped, sustainable weekly loss and timeline', () => {
    const t = calculateWeightLossTargets({ weightKg: 100, targetWeightKg: 85, heightCm: 180, age: 40, sex: 'male' })!
    expect(t.weeklyLossLbs).toBe(2)
    expect(t.lbsToLose).toBeGreaterThan(30)
    expect(t.estimatedWeeks).toBe(Math.ceil(t.lbsToLose / 2))
    expect(t.macros.targetCalories).toBeLessThan(t.energy.tdeeCalories)
  })

  it('builds a fat loss request starting in the right phase', () => {
    const stats = { weightKg: 80, experienceLevel: 'beginner', trainingDaysPerWeek: 9 }
    const req = buildWeightLossGenerationRequest(stats, calculateWeightLossTargets(stats))
    expect(req.goal).toBe('fat_loss')
    expect(req.targetNasmPhase).toBe(1)
    expect(req.trainingDaysPerWeek).toBe(6)
    expect(req.coachGuidanceNotes).toContain('Weight Loss Specialization')
  })
})

describe('nutrition targets snapshot', () => {
  const targets = calculateWeightLossTargets({ weightKg: 113.4, targetWeightKg: 90, heightCm: 170, age: 55, sex: 'female' })!

  it('round-trips through the validator', () => {
    const snapshot = buildNutritionTargetsSnapshot(targets)
    expect(parseNutritionTargets(snapshot)).toMatchObject({ targetCalories: targets.macros.targetCalories })
  })

  it('rejects missing or out-of-range values', () => {
    expect(parseNutritionTargets(null)).toBeNull()
    expect(parseNutritionTargets({ ...buildNutritionTargetsSnapshot(targets), targetCalories: 99999 })).toBeNull()
    expect(parseNutritionTargets({ targetCalories: 2000 })).toBeNull()
  })
})
