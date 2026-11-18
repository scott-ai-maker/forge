import { describe, expect, it } from 'vitest'
import {
  calculateEnergyExpenditure,
  calculatePrecisionMacros,
  calculatePhaseMacros,
  calculateHandPortions,
  optPhaseNumberToKey,
  EXECUTIVE_DINING_PLAYBOOK,
  type ActivityLevel,
  type NutritionGoal,
  type NasmOptPhase,
} from './metabolic-nutrition'

describe('Precision Metabolic Nutrition & Energy Balance Engine', () => {
  it('calculates Mifflin-St Jeor BMR, TDEE, and TEF for a male athlete', () => {
    const energy = calculateEnergyExpenditure({
      weightLbs: 200,
      heightInches: 72,
      age: 35,
      sex: 'male',
      activityLevel: 'moderately_active',
      goal: 'fat_loss',
    })

    expect(energy.bmrMethod).toBe('Mifflin-St Jeor')
    expect(energy.bmrCalories).toBeGreaterThan(1800)
    expect(energy.bmrCalories).toBeLessThan(2050)
    expect(energy.tdeeCalories).toBe(Math.round(energy.bmrCalories * 1.55))
    expect(energy.targetCalories).toBe(energy.tdeeCalories - 500) // 500 kcal deficit
    expect(energy.tefCalories).toBe(Math.round(energy.targetCalories * 0.1))
  })

  it('calculates Katch-McArdle BMR when body fat percentage is provided', () => {
    const energy = calculateEnergyExpenditure({
      weightLbs: 200,
      bodyFatPercent: 15,
      goal: 'hypertrophy',
    })

    expect(energy.bmrMethod).toBe('Katch-McArdle')
    expect(energy.bmrCalories).toBeGreaterThan(1900)
    expect(energy.targetCalories).toBe(energy.tdeeCalories + 350) // hypertrophy surplus
  })

  it('uses a caller-provided calorie deficit when a program sets a weekly pace', () => {
    const energy = calculateEnergyExpenditure({
      weightLbs: 160,
      heightInches: 65,
      age: 35,
      sex: 'female',
      activityLevel: 'lightly_active',
      goal: 'fat_loss',
      calorieDeficitCalories: 750,
    })
    expect(energy.targetCalories).toBe(Math.max(1200, energy.tdeeCalories - 750))
  })

  it('enforces a 1,500 kcal floor for males and prevents caloric deficits when BMI < 18.5 (#24)', () => {
    const maleFloor = calculateEnergyExpenditure({
      weightLbs: 130,
      heightInches: 68,
      age: 75,
      sex: 'male',
      activityLevel: 'sedentary',
      goal: 'fat_loss',
      calorieDeficitCalories: 900,
    })
    expect(maleFloor.targetCalories).toBeGreaterThanOrEqual(1500)

    const underweight = calculateEnergyExpenditure({
      weightLbs: 105,
      heightInches: 70, // BMI ~15.1 (< 18.5)
      age: 28,
      sex: 'female',
      activityLevel: 'lightly_active',
      goal: 'fat_loss',
    })
    expect(underweight.calorieDelta).toBe(0)
    expect(underweight.targetCalories).toBeGreaterThanOrEqual(underweight.tdeeCalories)
  })

  it('computes exact protein, carbohydrate, fat grams, and hydration prescriptions', () => {
    const macros = calculatePrecisionMacros({
      weightLbs: 185,
      heightInches: 70,
      age: 32,
      sex: 'male',
      activityLevel: 'very_active',
      goal: 'fat_loss',
      phase: 'phase1_stabilization',
    })

    // 185 lbs in fat loss: 0.85 g/lb = ~157g protein
    expect(macros.proteinGrams).toBe(157)
    expect(macros.fatGrams).toBeGreaterThan(45)
    expect(macros.carbGrams).toBeGreaterThan(120)
    expect(macros.hydrationTargetOz).toBe(Math.round(185 * 0.65))
    expect(macros.periWorkoutTiming.preWorkout).toContain('complex carbohydrates')
    expect(macros.periWorkoutTiming.postWorkout).toContain('protein')
  })

  it('anchors protein precisely to Lean Body Mass when body fat % is known', () => {
    const macros = calculatePrecisionMacros({
      weightLbs: 200,
      bodyFatPercent: 20, // LBM = 160 lbs
      goal: 'fat_loss',
    })

    // 1.0g per lb of LBM = 160g protein (instead of 200g+)
    expect(macros.proteinGrams).toBe(160)
  })

  it('supports legacy calculatePhaseMacros adapter', () => {
    const macros = calculatePhaseMacros(200, 'fat_loss', 'phase1_stabilization')
    expect(macros.proteinGrams).toBe(170) // 200 * 0.85
    expect(macros.phaseTitle).toContain('Phase 1')
    expect(macros.keySupplements).toContain('Omega-3 Fish Oil (2,000mg EPA/DHA)')
  })

  it('includes executive dining playbooks for steakhouses, travel, and business dinners', () => {
    expect(EXECUTIVE_DINING_PLAYBOOK.length).toBe(3)
    const steakhouse = EXECUTIVE_DINING_PLAYBOOK.find(d => d.venueType === 'steakhouse')
    expect(steakhouse?.recommendedOrders.length).toBeGreaterThan(0)
    expect(steakhouse?.executiveRule).toBeDefined()
  })

  it('calculates Precision Nutrition (PN1) hand portions for fat loss and hypertrophy goals', () => {
    const maleFatLoss = calculateHandPortions({
      sex: 'male',
      goal: 'fat_loss',
      weightLbs: 190,
    })

    expect(maleFatLoss.mealsPerDay).toBe(4)
    expect(maleFatLoss.perMeal.proteinPalms).toBe(2)
    expect(maleFatLoss.perMeal.veggieFists).toBe(2)
    expect(maleFatLoss.perMeal.carbCuppedHands).toBe(1)
    expect(maleFatLoss.perMeal.fatThumbs).toBe(1)
    expect(maleFatLoss.totalDaily.proteinPalms).toBe(8)
    expect(maleFatLoss.totalDaily.veggieFists).toBe(8)
    expect(maleFatLoss.guide.fullnessCue).toContain('Hara Hachi Bu')
    expect(maleFatLoss.guide.chewingRule).toContain('Slow Cadence')

    const femaleHypertrophy = calculateHandPortions({
      sex: 'female',
      goal: 'hypertrophy',
      weightLbs: 135,
    })

    expect(femaleHypertrophy.perMeal.proteinPalms).toBe(1.5)
    expect(femaleHypertrophy.perMeal.veggieFists).toBe(1.5)
    expect(femaleHypertrophy.perMeal.carbCuppedHands).toBe(1.5)
    expect(femaleHypertrophy.perMeal.fatThumbs).toBe(1)
    expect(femaleHypertrophy.totalDaily.carbCuppedHands).toBe(6)
  })

  it('maps NASM OPT phase numbers 1-5 to typed phase keys with safe fallback', () => {
    expect(optPhaseNumberToKey(1)).toBe('phase1_stabilization')
    expect(optPhaseNumberToKey(2)).toBe('phase2_strength_endurance')
    expect(optPhaseNumberToKey(3)).toBe('phase3_hypertrophy')
    expect(optPhaseNumberToKey(4)).toBe('phase4_maximal_strength')
    expect(optPhaseNumberToKey(5)).toBe('phase5_power')
    expect(optPhaseNumberToKey(null)).toBe('phase1_stabilization')
    expect(optPhaseNumberToKey(undefined)).toBe('phase1_stabilization')
    expect(optPhaseNumberToKey(NaN)).toBe('phase1_stabilization')
    expect(optPhaseNumberToKey(99)).toBe('phase1_stabilization')
  })

  it('sanitizes NaN, Infinity, negative, and unrecognized enum inputs without producing NaN', () => {
    const energy = calculateEnergyExpenditure({
      weightLbs: Number.NaN,
      heightInches: Number.POSITIVE_INFINITY,
      age: -12,
      bodyFatPercent: Number.NaN,
      calorieDeficitCalories: Number.NaN,
      activityLevel: 'unknown_activity' as ActivityLevel,
      goal: 'unknown_goal' as NutritionGoal,
    })
    const macros = calculatePrecisionMacros({
      weightLbs: Number.NaN,
      heightInches: Number.POSITIVE_INFINITY,
      age: -12,
      bodyFatPercent: Number.NaN,
      calorieDeficitCalories: Number.NaN,
      activityLevel: 'unknown_activity' as ActivityLevel,
      goal: 'unknown_goal' as NutritionGoal,
      phase: 'unknown_phase' as NasmOptPhase,
    })

    expect(Number.isFinite(energy.bmrCalories)).toBe(true)
    expect(Number.isFinite(energy.tdeeCalories)).toBe(true)
    expect(Number.isFinite(macros.targetCalories)).toBe(true)
    expect(Number.isFinite(macros.proteinGrams)).toBe(true)
    expect(Number.isFinite(macros.carbGrams)).toBe(true)
    expect(Number.isFinite(macros.fatGrams)).toBe(true)
    expect(macros.proteinPct + macros.carbPct + macros.fatPct).toBeGreaterThanOrEqual(99)
    expect(macros.proteinPct + macros.carbPct + macros.fatPct).toBeLessThanOrEqual(101)
  })

  it('prevents protein + fat calories from exceeding the 1500 kcal male safety floor under extreme bodyweight and deficit', () => {
    const macros = calculatePrecisionMacros({
      weightLbs: 380,
      heightInches: 74,
      age: 42,
      sex: 'male',
      activityLevel: 'sedentary',
      goal: 'fat_loss',
      calorieDeficitCalories: 2800, // forces 1500 kcal male safety floor
      phase: 'phase1_stabilization',
    })

    expect(macros.targetCalories).toBe(1500)
    const macroCalories = macros.proteinGrams * 4 + macros.fatGrams * 9 + macros.carbGrams * 4
    expect(macroCalories).toBeLessThanOrEqual(1520)
    expect(macros.carbGrams).toBeGreaterThanOrEqual(0)
    expect(macros.proteinGrams).toBeGreaterThan(0)
    expect(macros.fatGrams).toBeGreaterThanOrEqual(35)
  })

  it('shifts carbohydrate and dietary fat partitioning across NASM OPT Phases 1 through 5', () => {
    const p1 = calculatePrecisionMacros({
      weightLbs: 190,
      goal: 'athletic_power',
      phase: 'phase1_stabilization',
    })
    const p3 = calculatePrecisionMacros({
      weightLbs: 190,
      goal: 'athletic_power',
      phase: 'phase3_hypertrophy',
    })
    const p5 = calculatePrecisionMacros({
      weightLbs: 190,
      goal: 'athletic_power',
      phase: 'phase5_power',
    })

    expect(p3.carbGrams).toBeGreaterThan(p1.carbGrams)
    expect(p5.carbGrams).toBeGreaterThan(p1.carbGrams)
    expect(p1.fatGrams).toBeGreaterThan(p5.fatGrams)
  })
})
