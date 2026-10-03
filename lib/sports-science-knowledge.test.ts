import { describe, expect, it } from 'vitest'
import {
  calculateOneRepMax,
  calculateTargetTrainingLoad,
  evaluateWaistToHipRatio,
  calculateJacksonPollock3BodyFat,
  calculateRockportVO2Max,
  evaluateYmcaStepTest,
  calculate1Point5MileRunVO2Max,
} from './sports-science-knowledge'

describe('sports-science-knowledge', () => {
  describe('One Repetition Maximum (1RM) Conversions', () => {
    it('accurately calculates 1RM from submaximal weight and reps matching NASM table', () => {
      // From NASM 1RM table: 100 lbs for 10 reps (75%) = 133 lbs 1RM
      expect(calculateOneRepMax(100, 10)).toBe(133)

      // 200 lbs for 5 reps (87%) = 230 lbs 1RM
      expect(calculateOneRepMax(200, 5)).toBe(230)

      // 300 lbs for 3 reps (93%) = 323 lbs 1RM
      expect(calculateOneRepMax(300, 3)).toBe(323)

      // 400 lbs for 1 rep (100%) = 400 lbs 1RM
      expect(calculateOneRepMax(400, 1)).toBe(400)
    })

    it('calculates target training load rounded to standard 5 lb increments', () => {
      const oneRepMax = 300
      // 75% for Phase 3 Hypertrophy: 300 * 0.75 = 225 lbs
      expect(calculateTargetTrainingLoad(oneRepMax, 0.75)).toBe(225)
      // 85% for Phase 4 Max Strength: 300 * 0.85 = 255 lbs
      expect(calculateTargetTrainingLoad(oneRepMax, 0.85)).toBe(255)
    })
  })

  describe('Body Composition Protocols', () => {
    it('evaluates Waist-to-Hip Ratio cardiometabolic risk categories', () => {
      // Male with waist 34, hips 38 -> ratio 0.89 (Low Risk)
      const maleLow = evaluateWaistToHipRatio(34, 38, 'male')
      expect(maleLow.riskCategory).toBe('Low Risk')

      // Male with waist 40, hips 38 -> ratio 1.05 (High Risk)
      const maleHigh = evaluateWaistToHipRatio(40, 38, 'male')
      expect(maleHigh.riskCategory).toBe('High Risk')

      // Female with waist 28, hips 38 -> ratio 0.74 (Low Risk)
      const femaleLow = evaluateWaistToHipRatio(28, 38, 'female')
      expect(femaleLow.riskCategory).toBe('Low Risk')

      // Female with waist 34, hips 38 -> ratio 0.89 (High Risk)
      const femaleHigh = evaluateWaistToHipRatio(34, 38, 'female')
      expect(femaleHigh.riskCategory).toBe('High Risk')
    })

    it('calculates Jackson-Pollock 3-Site body fat percentage & classifications', () => {
      const maleResult = calculateJacksonPollock3BodyFat({
        age: 32,
        sex: 'male',
        site1Mm: 12, // Chest
        site2Mm: 18, // Abdomen
        site3Mm: 14, // Thigh
      })

      expect(maleResult.bodyFatPercent).toBeGreaterThan(10)
      expect(maleResult.bodyFatPercent).toBeLessThan(18)
      expect(maleResult.sumOfSkinfoldsMm).toBe(44)
    })
  })

  describe('Cardiorespiratory Assessments', () => {
    it('calculates Rockport 1-Mile Walk Test VO2max and ratings', () => {
      const result = calculateRockportVO2Max({
        weightLbs: 180,
        age: 35,
        sex: 'male',
        timeInMinutes: 13.5,
        postWalkHeartRateBpm: 125,
      })

      expect(result.vo2MaxMlKgMin).toBeGreaterThan(35)
      expect(result.cardioRating).toBeDefined()
    })

    it('evaluates YMCA 3-Minute Step Test recovery HR and generates 3-zone target heart rate ranges', () => {
      const stepTest = evaluateYmcaStepTest({
        age: 35,
        sex: 'male',
        recoveryHeartRateBpm: 88,
      })

      expect(stepTest.rating).toBe('Good')
      expect(stepTest.targetHeartRateZone1).toContain('Aerobic Base')
      expect(stepTest.targetHeartRateZone2).toContain('Lactate Threshold')
      expect(stepTest.targetHeartRateZone3).toContain('Peak Anaerobic')
    })

    it('calculates 1.5-Mile Run VO2max test formula', () => {
      // 12.0 minutes for 1.5 miles -> VO2max = 3.5 + 483 / 12 = 43.75 -> 43.8
      expect(calculate1Point5MileRunVO2Max(12.0)).toBe(43.8)
    })
  })
})
