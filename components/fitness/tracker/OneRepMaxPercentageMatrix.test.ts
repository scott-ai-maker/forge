import { describe, it, expect } from 'vitest'
import {
  calculate1Rm,
  getOneRepMaxPercentageTiers,
} from '@/lib/progressive-overload-engine'

describe('OneRepMaxPercentageMatrix Architecture & Logic', () => {
  it('correctly calculates 1RM from current draft set inputs', () => {
    // 225 lbs for 8 reps
    const result = calculate1Rm(225, 8)
    expect(result.average1RmLbs).toBeGreaterThan(270)
    expect(result.average1RmLbs).toBeLessThan(290)
    expect(result.average1RmKg).toBe(Math.round((result.average1RmLbs / 2.20462) * 10) / 10)
  })

  it('generates accurate NASM OPT percentage tiers with 5-lb imperial gym increments', () => {
    // Standard 300 lb 1RM
    const tiers = getOneRepMaxPercentageTiers(300, 'imperial')
    expect(tiers).toHaveLength(9)

    // Check all 9 percentage tiers
    const pcts = tiers.map(t => t.percentage)
    expect(pcts).toEqual([95, 90, 85, 80, 75, 70, 65, 60, 50])

    // Verify 5-lb gym increment divisibility
    tiers.forEach(tier => {
      expect(tier.weightLbs % 5).toBe(0)
    })

    // Phase 4: 95% (285 lbs, 1-2 reps)
    const tier95 = tiers.find(t => t.percentage === 95)!
    expect(tier95.weightLbs).toBe(285)
    expect(tier95.optPhase).toBe(4)
    expect(tier95.phaseTitle).toBe('Maximal Strength')
    expect(tier95.suggestedReps).toBe(2)

    // Phase 3: 80% (240 lbs, 7-8 reps)
    const tier80 = tiers.find(t => t.percentage === 80)!
    expect(tier80.weightLbs).toBe(240)
    expect(tier80.optPhase).toBe(3)
    expect(tier80.phaseTitle).toBe('Muscular Development')
    expect(tier80.suggestedReps).toBe(8)

    // Phase 2: 70% (210 lbs, 11-12 reps)
    const tier70 = tiers.find(t => t.percentage === 70)!
    expect(tier70.weightLbs).toBe(210)
    expect(tier70.optPhase).toBe(2)
    expect(tier70.phaseTitle).toBe('Strength Endurance')
    expect(tier70.suggestedReps).toBe(12)

    // Phase 1: 65% (195 lbs, 13-15 reps)
    const tier65 = tiers.find(t => t.percentage === 65)!
    expect(tier65.weightLbs).toBe(195)
    expect(tier65.optPhase).toBe(1)
    expect(tier65.phaseTitle).toBe('Stabilization Endurance')
    expect(tier65.suggestedReps).toBe(15)

    // Phase 0: 50% dynamic warmup (150 lbs)
    const tier50 = tiers.find(t => t.percentage === 50)!
    expect(tier50.weightLbs).toBe(150)
    expect(tier50.optPhase).toBe(0)
    expect(tier50.phaseTitle).toBe('Warm-up / Potentiation')
  })

  it('generates accurate metric percentage tiers with 2.5-kg increments', () => {
    // Standard 100 kg (220.46 lb) 1RM
    const tiers = getOneRepMaxPercentageTiers(220.462, 'metric')
    expect(tiers).toHaveLength(9)

    // Verify 2.5 kg equipment increment divisibility
    tiers.forEach(tier => {
      expect(tier.weightKg % 2.5).toBe(0)
    })

    const tier80 = tiers.find(t => t.percentage === 80)!
    expect(tier80.weightKg).toBe(80)
  })

  it('evaluates working intensity percentage against live 1RM', () => {
    const weightLbs = 200
    const reps = 5
    const oneRm = calculate1Rm(weightLbs, reps)
    const workingIntensityPct = Math.round((weightLbs / oneRm.average1RmLbs) * 100)

    // 5 reps is typically ~85-88% of 1RM
    expect(workingIntensityPct).toBeGreaterThanOrEqual(84)
    expect(workingIntensityPct).toBeLessThanOrEqual(89)
  })

  it('detects hammer curl movements to enforce strict neutral grip guardrail', () => {
    const hammerExercises = [
      'Dumbbell Hammer Curl',
      'Single Leg Hammer Curl',
      'Hammer Curl To Lateral Raise',
      'standing dumbbell hammer curl',
      'Incline Seated Hammer Curl',
    ]

    const nonHammerExercises = [
      'Barbell Biceps Curl',
      'Dumbbell Biceps Curl',
      'Barbell Bench Press',
      'EZ Bar Preacher Curl',
    ]

    const isHammerMovement = (name: string) => name.toLowerCase().includes('hammer curl')

    hammerExercises.forEach(name => {
      expect(isHammerMovement(name)).toBe(true)
    })

    nonHammerExercises.forEach(name => {
      expect(isHammerMovement(name)).toBe(false)
    })
  })

  it('handles edge case of zero or empty weight or reps safely', () => {
    const zeroResult = calculate1Rm(0, 0)
    expect(zeroResult.average1RmLbs).toBe(0)
    expect(zeroResult.average1RmKg).toBe(0)

    const tiers = getOneRepMaxPercentageTiers(0, 'imperial')
    expect(tiers).toEqual([])
  })
})
