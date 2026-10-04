import { describe, it, expect } from 'vitest'
import { buildWeightLossGenerationRequest, calculateWeightLossTargets } from './weight-loss-program'

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
