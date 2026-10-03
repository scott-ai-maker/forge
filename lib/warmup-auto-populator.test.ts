import { describe, it, expect } from 'vitest'
import {
  parsePrescribedWorkingReps,
  formatWorkingWeight,
  calculateWorkingSetPrePopulateLoad,
} from './warmup-auto-populator'

describe('Warm-Up to Working Set Weight Auto-Populator Engine', () => {
  describe('parsePrescribedWorkingReps', () => {
    it('parses range strings into the reliable working rep target', () => {
      expect(parsePrescribedWorkingReps('8-12')).toBe('8')
      expect(parsePrescribedWorkingReps('3-5')).toBe('3')
      expect(parsePrescribedWorkingReps('12-15')).toBe('12')
      expect(parsePrescribedWorkingReps('10 to 12')).toBe('10')
    })

    it('handles single numbers and clean strings', () => {
      expect(parsePrescribedWorkingReps('5')).toBe('5')
      expect(parsePrescribedWorkingReps(10)).toBe('10')
      expect(parsePrescribedWorkingReps(null)).toBe('8')
      expect(parsePrescribedWorkingReps('')).toBe('8')
    })
  })

  describe('formatWorkingWeight', () => {
    it('formats imperial weights to whole or tenth pounds', () => {
      expect(formatWorkingWeight(225, 'imperial')).toBe('225')
      expect(formatWorkingWeight(185.5, 'imperial')).toBe('185.5')
    })

    it('formats metric weights rounded to nearest 0.5 kg plate increment', () => {
      // 225 lbs / 2.20462 = 102.058 kg -> 102 kg
      expect(formatWorkingWeight(225, 'metric')).toBe('102')
      // 135 lbs / 2.20462 = 61.235 kg -> 61 kg
      expect(formatWorkingWeight(135, 'metric')).toBe('61')
    })
  })

  describe('calculateWorkingSetPrePopulateLoad', () => {
    it('triggers auto-population on completing final warm-up ramp stage', () => {
      const result = calculateWorkingSetPrePopulateLoad({
        exerciseName: 'Barbell Back Squat',
        targetWorkingWeightLbs: 225,
        units: 'imperial',
        completedStageNumber: 4,
        totalStages: 4,
        prescribedReps: '8-12',
      })

      expect(result.shouldAutoPopulate).toBe(true)
      expect(result.workingWeight).toBe('225')
      expect(result.workingReps).toBe('8')
      expect(result.workingSetNumber).toBe('1')
      expect(result.bannerNotice).toContain('Set 1 armed at 225 lb')
      expect(result.coachVoiceCue).toContain('Working set loaded at 225 pounds')
      expect(result.isHammerCurl).toBe(false)
    })

    it('does not trigger auto-population on intermediate warm-up ramp stages', () => {
      const result = calculateWorkingSetPrePopulateLoad({
        exerciseName: 'Barbell Bench Press',
        targetWorkingWeightLbs: 185,
        units: 'imperial',
        completedStageNumber: 2,
        totalStages: 4,
      })

      expect(result.shouldAutoPopulate).toBe(false)
      expect(result.workingWeight).toBe('185')
    })

    it('enforces strict neutral grip guardrails for Dumbbell Hammer Curl', () => {
      const result = calculateWorkingSetPrePopulateLoad({
        exerciseName: 'Dumbbell Hammer Curl',
        targetWorkingWeightLbs: 45,
        units: 'imperial',
        completedStageNumber: 3,
        totalStages: 3,
        prescribedReps: '10-12',
      })

      expect(result.shouldAutoPopulate).toBe(true)
      expect(result.isHammerCurl).toBe(true)
      expect(result.guardrailNote).toBeDefined()
      expect(result.guardrailNote).toContain('STRICT BIOMECHANICAL GUARDRAIL')
      expect(result.guardrailNote).toContain('thumbs pointed toward the ceiling')
      expect(result.guardrailNote).toContain('zero twisting or wrist supination')
      expect(result.coachVoiceCue).toContain('Keep palms strictly facing inward')
    })
  })
})
