import { describe, it, expect } from 'vitest'
import {
  getWeightPresetsForExercise,
  calculateBarbellPlates,
  isOlympicWeightExercise,
} from '@/lib/barbell-plate-calculator'

describe('PlateAdjustmentPresets Component Logic', () => {
  it('correctly detects barbell exercises and provides standard Olympic milestones', () => {
    const config = getWeightPresetsForExercise('Barbell Bench Press', 'imperial', 135)
    expect(config.isBarbell).toBe(true)
    expect(config.presets.map(p => p.weight)).toContain(135)
    expect(config.presets.map(p => p.weight)).toContain(225)
    expect(config.presets.map(p => p.weight)).toContain(315)
    expect(config.microIncrements).toContain(2.5)
    expect(config.microIncrements).toContain(-2.5)
  })

  it('correctly calculates plate breakdown and per-side additions', () => {
    const calc = calculateBarbellPlates(225, 'olympic_45')
    expect(calc.isExact).toBe(true)
    expect(calc.weightPerSide).toBe(90)
    expect(calc.platesPerSide[0].count).toBe(2)
    expect(calc.platesPerSide[0].denomination.weightLbs).toBe(45)

    // Adding 25 lbs to both sides should result in 275 lbs
    const nextWeight = calc.actualTotalWeightLbs + 25 * 2
    expect(nextWeight).toBe(275)
    const nextCalc = calculateBarbellPlates(nextWeight, 'olympic_45')
    expect(nextCalc.weightPerSide).toBe(115)
  })

  it('correctly configures dumbbell exercises without barbell sleeve', () => {
    const config = getWeightPresetsForExercise('Dumbbell Lateral Raise', 'imperial', 20)
    expect(config.isBarbell).toBe(false)
    expect(config.presets.some(p => p.weight === 20)).toBe(true)
    expect(isOlympicWeightExercise('Dumbbell Lateral Raise')).toBe(false)
  })
})
