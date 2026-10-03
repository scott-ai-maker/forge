import { describe, expect, it } from 'vitest'
import {
  calculateBarbellPlates,
  generateWarmUpRampSets,
  isOlympicWeightExercise,
  getWeightPresetsForExercise,
} from './barbell-plate-calculator'

describe('Barbell Plate Calculator Engine', () => {
  it('correctly calculates standard 135 lb Olympic bench / squat (1x45 per side)', () => {
    const res = calculateBarbellPlates(135, 'olympic_45')
    expect(res.isExact).toBe(true)
    expect(res.actualTotalWeightLbs).toBe(135)
    expect(res.weightPerSide).toBe(45)
    expect(res.platesPerSide).toEqual([
      {
        denomination: expect.objectContaining({ weightLbs: 45 }),
        count: 1,
      },
    ])
    expect(res.plateSummaryText).toBe('Per side: 1 × 45lb')
  })

  it('correctly calculates 225 lb (2x45 per side)', () => {
    const res = calculateBarbellPlates(225, 'olympic_45')
    expect(res.isExact).toBe(true)
    expect(res.actualTotalWeightLbs).toBe(225)
    expect(res.weightPerSide).toBe(90)
    expect(res.platesPerSide).toEqual([
      {
        denomination: expect.objectContaining({ weightLbs: 45 }),
        count: 2,
      },
    ])
  })

  it('correctly calculates 185 lb (1x45 + 1x25 per side)', () => {
    const res = calculateBarbellPlates(185, 'olympic_45')
    expect(res.isExact).toBe(true)
    expect(res.weightPerSide).toBe(70)
    expect(res.platesPerSide).toEqual([
      { denomination: expect.objectContaining({ weightLbs: 45 }), count: 1 },
      { denomination: expect.objectContaining({ weightLbs: 25 }), count: 1 },
    ])
  })

  it('correctly calculates complex fractional weight 245 lb (2x45 + 1x10 per side)', () => {
    const res = calculateBarbellPlates(245, 'olympic_45')
    expect(res.isExact).toBe(true)
    expect(res.weightPerSide).toBe(100)
    expect(res.platesPerSide).toEqual([
      { denomination: expect.objectContaining({ weightLbs: 45 }), count: 2 },
      { denomination: expect.objectContaining({ weightLbs: 10 }), count: 1 },
    ])
  })

  it('handles 55 lb Heavy Trap Bar correctly for 315 lb deadlift', () => {
    const res = calculateBarbellPlates(315, 'trap_bar_55')
    expect(res.isExact).toBe(true)
    expect(res.actualTotalWeightLbs).toBe(315)
    expect(res.weightPerSide).toBe(130)
    expect(res.platesPerSide).toEqual([
      { denomination: expect.objectContaining({ weightLbs: 45 }), count: 2 },
      { denomination: expect.objectContaining({ weightLbs: 35 }), count: 1 },
      { denomination: expect.objectContaining({ weightLbs: 5 }), count: 1 },
    ])
  })

  it('handles empty barbell weight when target is less than or equal to bar weight', () => {
    const res = calculateBarbellPlates(45, 'olympic_45')
    expect(res.isExact).toBe(true)
    expect(res.actualTotalWeightLbs).toBe(45)
    expect(res.weightPerSide).toBe(0)
    expect(res.platesPerSide).toHaveLength(0)
    expect(res.plateSummaryText).toContain('Empty Bar')
  })

  it('identifies Olympic weight exercises accurately', () => {
    // True: Olympic / Barbell movements
    expect(isOlympicWeightExercise('Barbell Bench Press')).toBe(true)
    expect(isOlympicWeightExercise('Back Squat')).toBe(true)
    expect(isOlympicWeightExercise('Barbell Deadlift')).toBe(true)
    expect(isOlympicWeightExercise('Trap Bar Deadlift')).toBe(true)
    expect(isOlympicWeightExercise('Overhead Press')).toBe(true)
    expect(isOlympicWeightExercise('Barbell Romanian Deadlift (RDL)')).toBe(true)
    expect(isOlympicWeightExercise('Power Clean')).toBe(true)
    expect(isOlympicWeightExercise('Snatch')).toBe(true)
    expect(isOlympicWeightExercise('Leg Press')).toBe(true)
    expect(isOlympicWeightExercise('Barbell Hip Thrust')).toBe(true)
    expect(isOlympicWeightExercise('Custom Exercise', ['Barbell', 'Adjustable Bench'])).toBe(true)

    // False: Dumbbells, Cables, Bodyweight, Bands, Machines
    expect(isOlympicWeightExercise('Dumbbell Bench Press')).toBe(false)
    expect(isOlympicWeightExercise('DB Incline Press')).toBe(false)
    expect(isOlympicWeightExercise('Goblet Squat (Dumbbell)')).toBe(false)
    expect(isOlympicWeightExercise('Push-Up')).toBe(false)
    expect(isOlympicWeightExercise('Lat Pulldown (Cable)')).toBe(false)
    expect(isOlympicWeightExercise('Cable Crossover')).toBe(false)
    expect(isOlympicWeightExercise('Kettlebell Swing')).toBe(false)
    expect(isOlympicWeightExercise('Resistance Band Pull-Apart')).toBe(false)
    expect(isOlympicWeightExercise('Plank')).toBe(false)
    expect(isOlympicWeightExercise('Dumbbell Bicep Curl')).toBe(false)
  })

  it('generates progressive warm-up ramp sets accurately for heavy 225 lb working load', () => {
    const stages = generateWarmUpRampSets(225, 'olympic_45')
    expect(stages.length).toBeGreaterThanOrEqual(3)

    // Stage 1: Empty bar 45 lbs x 10
    expect(stages[0].weightLbs).toBe(45)
    expect(stages[0].reps).toBe(10)

    // Stage 2: ~50% (115 lbs) x 5
    expect(stages[1].weightLbs).toBe(115)
    expect(stages[1].reps).toBe(5)

    // Stage 3: ~70% (160 lbs) x 3
    expect(stages[2].weightLbs).toBe(160)
    expect(stages[2].reps).toBe(3)

    // Stage 4: PAP Primer ~85% (190 lbs) x 1
    expect(stages[3].weightLbs).toBe(190)
    expect(stages[3].reps).toBe(1)
  })

  it('returns empty array when working weight is less than or equal to bar + 10', () => {
    expect(generateWarmUpRampSets(45, 'olympic_45')).toEqual([])
    expect(generateWarmUpRampSets(50, 'olympic_45')).toEqual([])
  })

  it('provides Olympic barbell milestone presets and micro-loading increments for barbell lifts', () => {
    const barImperial = getWeightPresetsForExercise('Barbell Bench Press', 'imperial', 135)
    expect(barImperial.isBarbell).toBe(true)
    expect(barImperial.presets.some(p => p.weight === 135 && p.isMilestone)).toBe(true)
    expect(barImperial.presets.some(p => p.weight === 225 && p.isMilestone)).toBe(true)
    expect(barImperial.microIncrements).toContain(2.5)
    expect(barImperial.microIncrements).toContain(-2.5)
    expect(barImperial.microIncrements).toContain(5)

    const barMetric = getWeightPresetsForExercise('Barbell Squat', 'metric', 100)
    expect(barMetric.isBarbell).toBe(true)
    expect(barMetric.presets.some(p => p.weight === 60 && p.isMilestone)).toBe(true)
    expect(barMetric.presets.some(p => p.weight === 100 && p.isMilestone)).toBe(true)
    expect(barMetric.microIncrements).toContain(1.25)
    expect(barMetric.microIncrements).toContain(-1.25)
  })

  it('provides dumbbell rack presets for dumbbell movements', () => {
    const dbConfig = getWeightPresetsForExercise('Dumbbell Incline Bench Press', 'imperial', 30)
    expect(dbConfig.isBarbell).toBe(false)
    expect(dbConfig.presets.some(p => p.weight === 25)).toBe(true)
    expect(dbConfig.presets.some(p => p.weight === 50)).toBe(true)
    expect(dbConfig.microIncrements).toContain(2.5)
    expect(dbConfig.microIncrements).toContain(-2.5)
  })
})
