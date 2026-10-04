import { describe, expect, it } from 'vitest'
import {
  calculateEnergyExpenditure,
  calculatePrecisionMacros,
  calculatePhaseMacros,
  EXECUTIVE_DINING_PLAYBOOK,
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
})
