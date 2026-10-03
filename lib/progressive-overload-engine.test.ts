import { describe, it, expect } from 'vitest'
import {
  calculate1Rm,
  evaluate2For2Progression,
  isLowerBodyExercise,
  getOneRepMaxPercentageTiers,
} from './progressive-overload-engine'

describe('NASM Progressive Overload & 1RM Engine', () => {
  it('correctly calculates 1RM using dual Brzycki & Epley formulas', () => {
    const result = calculate1Rm(225, 5)
    expect(result.average1RmLbs).toBeGreaterThan(250)
    expect(result.average1RmLbs).toBeLessThan(265)
    expect(result.workingPercentages.pct100).toBe(result.average1RmLbs)
    expect(result.workingPercentages.pct80).toBe(Math.round((result.average1RmLbs * 0.8) / 5) * 5)
    expect(result.workingPercentages.pct60).toBe(Math.round((result.average1RmLbs * 0.6) / 5) * 5)
  })

  it('correctly returns exact load for 1RM single rep', () => {
    const result = calculate1Rm(315, 1)
    expect(result.average1RmLbs).toBe(315)
    expect(result.workingPercentages.pct100).toBe(315)
  })

  it('evaluates NASM 2-for-2 rule for Upper Body lifts (Bench Press)', () => {
    const benchSessions = [
      { date: '2026-08-22', finalSetWeightLbs: 225, finalSetReps: 10 }, // latest session (target: 8 -> +2)
      { date: '2026-08-18', finalSetWeightLbs: 225, finalSetReps: 10 }, // previous session (target: 8 -> +2)
    ]

    const evalResult = evaluate2For2Progression('Barbell Bench Press', 8, benchSessions)
    expect(evalResult.eligibleForProgression).toBe(true)
    expect(evalResult.bodyPartCategory).toBe('upper_body')
    expect(evalResult.recommendedWeightIncreaseLbs).toBeGreaterThanOrEqual(5)
    expect(evalResult.nextTargetWeightLbs).toBe(235)
    expect(evalResult.reasoning).toContain('NASM 2-for-2 Criteria Achieved')
  })

  it('evaluates NASM 2-for-2 rule for Lower Body lifts (Barbell Back Squat)', () => {
    const squatSessions = [
      { date: '2026-08-22', finalSetWeightLbs: 315, finalSetReps: 12 }, // target: 10 -> +2
      { date: '2026-08-18', finalSetWeightLbs: 315, finalSetReps: 12 }, // target: 10 -> +2
    ]

    const evalResult = evaluate2For2Progression('Barbell Back Squat', 10, squatSessions)
    expect(evalResult.eligibleForProgression).toBe(true)
    expect(evalResult.bodyPartCategory).toBe('lower_body')
    expect(evalResult.recommendedWeightIncreaseLbs).toBeGreaterThanOrEqual(10)
    expect(evalResult.nextTargetWeightLbs).toBeGreaterThanOrEqual(325)
  })

  it('rejects progression when only 1 session qualifies', () => {
    const sessions = [
      { date: '2026-08-22', finalSetWeightLbs: 225, finalSetReps: 10 }, // target: 8 -> +2
      { date: '2026-08-18', finalSetWeightLbs: 225, finalSetReps: 8 },  // target: 8 -> exactly 8 (not +2)
    ]

    const evalResult = evaluate2For2Progression('Barbell Incline Press', 8, sessions)
    expect(evalResult.eligibleForProgression).toBe(false)
    expect(evalResult.consecutiveSessionsOverTarget).toBe(1)
  })

  it('identifies lower body vs upper body lifts accurately', () => {
    expect(isLowerBodyExercise('Barbell Back Squat')).toBe(true)
    expect(isLowerBodyExercise('Romanian Deadlift (RDL)')).toBe(true)
    expect(isLowerBodyExercise('Walking Dumbbell Lunges')).toBe(true)
    expect(isLowerBodyExercise('Barbell Bench Press')).toBe(false)
    expect(isLowerBodyExercise('Seated Cable Row')).toBe(false)
    expect(isLowerBodyExercise('Standing Overhead Press')).toBe(false)
  })

  it('generates full NASM OPT working load percentage tiers for 1RM', () => {
    const tiersImperial = getOneRepMaxPercentageTiers(300, 'imperial')
    expect(tiersImperial).toHaveLength(9)

    // 95% of 300 = 285 lbs
    const tier95 = tiersImperial.find(t => t.percentage === 95)!
    expect(tier95.weightLbs).toBe(285)
    expect(tier95.optPhase).toBe(4)
    expect(tier95.suggestedReps).toBe(2)

    // 80% of 300 = 240 lbs (Phase 3 Hypertrophy)
    const tier80 = tiersImperial.find(t => t.percentage === 80)!
    expect(tier80.weightLbs).toBe(240)
    expect(tier80.optPhase).toBe(3)
    expect(tier80.suggestedReps).toBe(8)
    expect(tier80.phaseTitle).toContain('Muscular Development')

    // 50% dynamic warmup = 150 lbs
    const tier50 = tiersImperial.find(t => t.percentage === 50)!
    expect(tier50.weightLbs).toBe(150)
    expect(tier50.optPhase).toBe(0)

    // Metric testing (rounds to 2.5kg increments)
    const tiersMetric = getOneRepMaxPercentageTiers(300, 'metric')
    const metric80 = tiersMetric.find(t => t.percentage === 80)!
    expect(metric80.weightKg % 2.5).toBe(0)

    // Edge case: zero or negative 1RM
    expect(getOneRepMaxPercentageTiers(0)).toEqual([])
    expect(getOneRepMaxPercentageTiers(-10)).toEqual([])
  })
})
