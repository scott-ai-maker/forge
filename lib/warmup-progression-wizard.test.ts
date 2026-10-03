import { describe, it, expect } from 'vitest'
import {
  generateWarmUpProgressionStages,
  formatWarmUpStageNote,
  parseWarmUpStageNote,
  isDumbbellMovement,
  isHammerCurlMovement,
} from './warmup-progression-wizard'

describe('Warm-Up Ramp-Up Progression Wizard Engine', () => {
  it('generates standard 4-stage warm-up progression for Barbell Bench Press (225 lbs)', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Bench Press',
      targetWorkingWeightLbs: 225,
      protocolType: 'standard_4',
      units: 'imperial',
      barbellType: 'olympic_45',
    })

    expect(stages.length).toBe(4)

    // Stage 1: Empty bar min (45 lbs)
    expect(stages[0].stageNumber).toBe(1)
    expect(stages[0].weightLbs).toBe(45)
    expect(stages[0].reps).toBe(8)
    expect(stages[0].platesSummary).toBe('Empty Bar (No plates required)')

    // Stage 2: 60% of 225 = 135 lbs (45 lb plate per side)
    expect(stages[1].stageNumber).toBe(2)
    expect(stages[1].percentage).toBe(60)
    expect(stages[1].weightLbs).toBe(135)
    expect(stages[1].reps).toBe(5)
    expect(stages[1].platesSummary).toContain('45lb')

    // Stage 3: 75% of 225 = 170 lbs
    expect(stages[2].stageNumber).toBe(3)
    expect(stages[2].percentage).toBe(75)
    expect(stages[2].weightLbs).toBe(170)
    expect(stages[2].reps).toBe(3)

    // Stage 4: 85% of 225 = 190 lbs
    expect(stages[3].stageNumber).toBe(4)
    expect(stages[3].percentage).toBe(85)
    expect(stages[3].weightLbs).toBe(190)
    expect(stages[3].reps).toBe(1)
    expect(stages[3].stageTitle).toContain('Post-Activation Potentiation')
  })

  it('generates express 3-stage ramp for quick workouts', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Back Squat',
      targetWorkingWeightLbs: 315,
      protocolType: 'express_3',
      units: 'imperial',
    })

    expect(stages.length).toBe(3)
    expect(stages[0].percentage).toBe(50)
    expect(stages[1].percentage).toBe(70)
    expect(stages[2].percentage).toBe(85)
    expect(stages[2].weightLbs).toBe(270) // 85% of 315 = 267.75 -> 270 lbs
  })

  it('generates heavy compound 5-stage ramp for high-load movements (405 lbs)', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Deadlift',
      targetWorkingWeightLbs: 405,
      protocolType: 'heavy_compound_5',
      units: 'imperial',
    })

    expect(stages.length).toBe(5)
    expect(stages[0].reps).toBe(10)
    expect(stages[4].reps).toBe(1)
    expect(stages[4].percentage).toBe(90)
    expect(stages[4].weightLbs).toBe(365)
  })

  it('generates 1RM percentage mode warm-up stages based on athlete 1RM', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Overhead Press',
      targetWorkingWeightLbs: 135,
      oneRmLbs: 165,
      baselineMode: 'one_rep_max',
      units: 'imperial',
    })

    expect(stages.length).toBe(4)
    expect(stages[0].stageTitle).toContain('40% 1RM')
    expect(stages[3].stageTitle).toContain('80% 1RM')
    expect(stages[3].weightLbs).toBe(130) // 80% of 165 = 132 -> 130 lbs
  })

  it('handles dumbbell movements with dumbbell pair recommendations', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Dumbbell Incline Press',
      targetWorkingWeightLbs: 80,
      protocolType: 'standard_4',
      units: 'imperial',
    })

    expect(stages.length).toBe(4)
    expect(stages[0].platesSummary).toBe('Pair of 30 lb Dumbbells')
    expect(stages[1].platesSummary).toBe('Pair of 50 lb Dumbbells')
    expect(stages[2].platesSummary).toBe('Pair of 60 lb Dumbbells')
    expect(stages[3].platesSummary).toBe('Pair of 70 lb Dumbbells')
  })

  it('correctly rounds metric equipment weights to 2.5 kg increments', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Bench Press',
      targetWorkingWeightLbs: 220.462, // 100 kg
      protocolType: 'standard_4',
      units: 'metric',
    })

    expect(stages.length).toBe(4)
    stages.forEach(stage => {
      expect(stage.weightKg % 2.5).toBe(0)
    })
  })

  it('formats and parses structured warm-up notes for session history', () => {
    const stage = {
      stageNumber: 2,
      totalStages: 4,
      percentage: 60,
      weightLbs: 135,
      weightKg: 60,
      reps: 5,
      restSeconds: 60,
      stageTitle: 'Kinetic Velocity',
      physiologicalObjective: 'Motor unit recruitment',
      platesSummary: '1 plate per side',
      platesPerSide: [],
    }

    const note = formatWarmUpStageNote(stage, 'imperial')
    expect(note).toBe('[WarmUp 2/4: 60% @ 135lb × 5 | Kinetic Velocity]')

    const parsed = parseWarmUpStageNote(`${note} Clean bar speed`)
    expect(parsed.isWarmUpStage).toBe(true)
    expect(parsed.stageNumber).toBe(2)
    expect(parsed.totalStages).toBe(4)
    expect(parsed.percentage).toBe(60)
  })

  it('detects dumbbell and hammer curl exercises for guardrail compliance', () => {
    expect(isDumbbellMovement('Dumbbell Bench Press')).toBe(true)
    expect(isDumbbellMovement('Standing DB Lateral Raise')).toBe(true)
    expect(isDumbbellMovement('Barbell Squat')).toBe(false)

    expect(isHammerCurlMovement('Dumbbell Hammer Curl')).toBe(true)
    expect(isHammerCurlMovement('Single Leg Hammer Curl')).toBe(true)
    expect(isHammerCurlMovement('Barbell Bicep Curl')).toBe(false)
  })

  it('gracefully handles edge cases where weight is at or below threshold', () => {
    // Barbell weight at or below empty bar
    const stagesBarbell = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Bench Press',
      targetWorkingWeightLbs: 45,
    })
    expect(stagesBarbell).toEqual([])

    // Zero weight
    const stagesZero = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Bench Press',
      targetWorkingWeightLbs: 0,
    })
    expect(stagesZero).toEqual([])
  })
})
