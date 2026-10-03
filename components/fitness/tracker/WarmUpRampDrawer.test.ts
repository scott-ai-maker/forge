import { describe, it, expect } from 'vitest'
import {
  generateWarmUpProgressionStages,
  formatWarmUpStageNote,
  parseWarmUpStageNote,
  isHammerCurlMovement,
} from '@/lib/warmup-progression-wizard'
import { calculateWorkingSetPrePopulateLoad } from '@/lib/warmup-auto-populator'

describe('WarmUpRampDrawer / Progression Wizard Integration', () => {
  it('generates accurate 4-stage warm-up progression for Barbell Squat (315 lbs)', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Back Squat',
      targetWorkingWeightLbs: 315,
      protocolType: 'standard_4',
      units: 'imperial',
      barbellType: 'olympic_45',
    })

    expect(stages).toHaveLength(4)

    // Stage 1: Empty bar 45 lbs
    expect(stages[0].weightLbs).toBe(45)
    expect(stages[0].reps).toBe(8)
    expect(stages[0].restSeconds).toBe(45)

    // Stage 2: 60% = 190 lbs
    expect(stages[1].weightLbs).toBe(190)
    expect(stages[1].reps).toBe(5)
    expect(stages[1].restSeconds).toBe(60)

    // Stage 3: 75% = 235 lbs
    expect(stages[2].weightLbs).toBe(235)
    expect(stages[2].reps).toBe(3)
    expect(stages[2].restSeconds).toBe(75)

    // Stage 4: 85% = 270 lbs (PAP Primer)
    expect(stages[3].weightLbs).toBe(270)
    expect(stages[3].reps).toBe(1)
    expect(stages[3].restSeconds).toBe(90)
    expect(stages[3].stageTitle).toContain('Post-Activation Potentiation')
  })

  it('provides visual plate counts per side for barbell exercises', () => {
    const stages = generateWarmUpProgressionStages({
      exerciseName: 'Barbell Bench Press',
      targetWorkingWeightLbs: 225,
      protocolType: 'standard_4',
      units: 'imperial',
    })

    // Stage 2 is 135 lbs -> 45 lb bar + 1x45 lb plate per side
    const stage2 = stages[1]
    expect(stage2.weightLbs).toBe(135)
    expect(stage2.platesPerSide.length).toBeGreaterThanOrEqual(1)
    expect(stage2.platesPerSide[0].denomination.weightLbs).toBe(45)
    expect(stage2.platesPerSide[0].count).toBe(1)
  })

  it('formats and parses warm-up log notes accurately', () => {
    const stage = {
      stageNumber: 3,
      totalStages: 4,
      percentage: 75,
      weightLbs: 185,
      weightKg: 85,
      reps: 3,
      restSeconds: 75,
      stageTitle: 'Neural Tension',
      physiologicalObjective: 'Nervous system calibration',
      platesSummary: '185 lbs',
      platesPerSide: [],
    }

    const note = formatWarmUpStageNote(stage, 'imperial')
    expect(note).toBe('[WarmUp 3/4: 75% @ 185lb × 3 | Neural Tension]')

    const parsed = parseWarmUpStageNote(note)
    expect(parsed.isWarmUpStage).toBe(true)
    expect(parsed.stageNumber).toBe(3)
    expect(parsed.totalStages).toBe(4)
    expect(parsed.percentage).toBe(75)
  })

  it('enforces hammer curl biomechanical guardrail for all variants', () => {
    expect(isHammerCurlMovement('Dumbbell Hammer Curl')).toBe(true)
    expect(isHammerCurlMovement('Single Leg Dumbbell Hammer Curl')).toBe(true)
    expect(isHammerCurlMovement('Hammer Curl To Lateral Raise')).toBe(true)
    expect(isHammerCurlMovement('Standing EZ-Bar Curl')).toBe(false)
  })

  it('calculates auto-population payload for working set 1 upon completing top warm-up stage', () => {
    const popResult = calculateWorkingSetPrePopulateLoad({
      exerciseName: 'Barbell Bench Press',
      targetWorkingWeightLbs: 225,
      units: 'imperial',
      completedStageNumber: 4,
      totalStages: 4,
      prescribedReps: '8-12',
    })

    expect(popResult.shouldAutoPopulate).toBe(true)
    expect(popResult.workingWeight).toBe('225')
    expect(popResult.workingReps).toBe('8')
    expect(popResult.workingSetNumber).toBe('1')
    expect(popResult.bannerNotice).toContain('225 lb')
  })
})
