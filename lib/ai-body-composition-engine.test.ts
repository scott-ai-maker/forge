import { describe, it, expect } from 'vitest'
import {
  calculateBaselineLbm,
  calculateFfmi,
  calculateCunninghamBmr,
  estimateSkeletalMuscleMass,
  calculateNavyBodyFat,
  classifyBodyFat,
  generateRecompositionPlan,
  generateSyntheticLandmarks,
  analyzeBodyCompositionFromImages,
  sanitizeBase64Image,
} from './ai-body-composition-engine'

describe('AI Body Composition Engine', () => {
  describe('calculateBaselineLbm', () => {
    it('calculates accurate Boer and Hume Lean Body Mass for male athlete', () => {
      const result = calculateBaselineLbm(80, 180, 'male')
      expect(result.boerLbmKg).toBeGreaterThan(50)
      expect(result.boerLbmKg).toBeLessThan(70)
      expect(result.humeLbmKg).toBeGreaterThan(50)
      expect(result.meanLbmKg).toBeGreaterThan(55)
    })

    it('calculates accurate Boer and Hume Lean Body Mass for female athlete', () => {
      const result = calculateBaselineLbm(60, 165, 'female')
      expect(result.boerLbmKg).toBeGreaterThan(40)
      expect(result.boerLbmKg).toBeLessThan(55)
      expect(result.meanLbmKg).toBeGreaterThan(40)
    })
  })

  describe('calculateFfmi', () => {
    it('computes raw and normalized FFMI with proper categorization', () => {
      // 70kg LBM at 180cm
      const result = calculateFfmi(70, 180)
      expect(result.ffmi).toBe(21.6)
      expect(result.normalizedFfmi).toBe(21.6)
      expect(result.category).toBe('Above Average')
    })

    it('identifies elite athletic natural genetic boundaries', () => {
      // 82kg LBM at 180cm -> FFMI = 25.3
      const result = calculateFfmi(82, 180)
      expect(result.ffmi).toBe(25.3)
      expect(result.category).toBe('Near Natural Genetic Limit')
    })
  })

  describe('calculateCunninghamBmr & estimateSkeletalMuscleMass', () => {
    it('computes accurate Cunningham BMR based on LBM', () => {
      // BMR = 370 + (21.6 * 65kg) = 370 + 1404 = 1774 kcal
      const bmr = calculateCunninghamBmr(65)
      expect(bmr).toBe(1774)
    })

    it('estimates skeletal muscle mass from lean mass', () => {
      const smmMale = estimateSkeletalMuscleMass(70, 'male')
      expect(smmMale).toBe(39.2) // 70 * 0.56

      const smmFemale = estimateSkeletalMuscleMass(50, 'female')
      expect(smmFemale).toBe(26.0) // 50 * 0.52
    })
  })

  describe('calculateNavyBodyFat', () => {
    it('calculates US Navy body fat for male with valid circumferences', () => {
      // Height 180cm, Waist 84cm, Neck 39cm
      const bf = calculateNavyBodyFat('male', 180, 84, 39)
      expect(bf).toBeGreaterThan(12)
      expect(bf).toBeLessThan(18)
    })

    it('calculates US Navy body fat for female with waist, neck, and hips', () => {
      // Height 165cm, Waist 70cm, Neck 33cm, Hips 96cm
      const bf = calculateNavyBodyFat('female', 165, 70, 33, 96)
      expect(bf).toBeGreaterThan(18)
      expect(bf).toBeLessThan(26)
    })
  })

  describe('classifyBodyFat', () => {
    it('accurately categorizes male body fat levels', () => {
      expect(classifyBodyFat(5, 'male')).toBe('Essential Fat')
      expect(classifyBodyFat(11, 'male')).toBe('Athletic / Elite Lean')
      expect(classifyBodyFat(16, 'male')).toBe('Fitness / Defined')
      expect(classifyBodyFat(21, 'male')).toBe('Average / Healthy')
      expect(classifyBodyFat(27, 'male')).toBe('Moderately Elevated')
      expect(classifyBodyFat(33, 'male')).toBe('Elevated Fat Mass')
    })

    it('accurately categorizes female body fat levels', () => {
      expect(classifyBodyFat(12, 'female')).toBe('Essential Fat')
      expect(classifyBodyFat(18, 'female')).toBe('Athletic / Elite Lean')
      expect(classifyBodyFat(23, 'female')).toBe('Fitness / Defined')
      expect(classifyBodyFat(29, 'female')).toBe('Average / Healthy')
      expect(classifyBodyFat(34, 'female')).toBe('Moderately Elevated')
      expect(classifyBodyFat(40, 'female')).toBe('Elevated Fat Mass')
    })
  })

  describe('generateRecompositionPlan', () => {
    it('creates a fat-loss recomposition trajectory with protein and caloric directives', () => {
      // 85kg male at 22% body fat, target 14%
      const plan = generateRecompositionPlan(85, 22, 'male', 14)
      expect(plan.targetBodyFatPercent).toBe(14)
      expect(plan.fatToLoseKg).toBeGreaterThan(5)
      expect(plan.estimatedWeeksToGoal).toBeGreaterThan(8)
      expect(plan.dailyProteinGrams).toBeGreaterThan(130)
      expect(plan.weeklyDeficitOrSurplusCalories).toBe(-3500)
      expect(plan.recommendedNasmPhase).toBe(2)
      expect(plan.coachingDirectives.length).toBeGreaterThan(2)
    })

    it('creates a hypertrophy lean massing plan when current BF is below target', () => {
      // 70kg male at 8% body fat, target 12%
      const plan = generateRecompositionPlan(70, 8, 'male', 12)
      expect(plan.recommendedNasmPhase).toBe(3)
      expect(plan.weeklyDeficitOrSurplusCalories).toBe(1750)
      expect(plan.phaseName).toContain('Hypertrophy')
    })
  })

  describe('generateSyntheticLandmarks', () => {
    it('generates rich landmark meshes for anterior, lateral, and posterior views', () => {
      const anterior = generateSyntheticLandmarks('anterior')
      expect(anterior.some(l => l.id === 'navel_umbilicus')).toBe(true)
      expect(anterior.length).toBeGreaterThanOrEqual(15)

      const lateral = generateSyntheticLandmarks('lateral')
      expect(lateral.some(l => l.id === 'lumbar_lordosis')).toBe(true)

      const posterior = generateSyntheticLandmarks('posterior')
      expect(posterior.some(l => l.id === 'gluteal_fold')).toBe(true)
    })
  })

  describe('analyzeBodyCompositionFromImages', () => {
    it('performs full DEXA ensemble estimation without API keys in test environment', async () => {
      const result = await analyzeBodyCompositionFromImages({
        sex: 'male',
        heightCm: 182,
        weightKg: 82,
        age: 34,
        waistCm: 83,
        neckCm: 39,
        hipCm: 97,
        clientName: 'Alex Mercer',
      })

      expect(result.estimatedBodyFatPercent).toBeGreaterThan(10)
      expect(result.estimatedBodyFatPercent).toBeLessThan(20)
      expect(result.leanBodyMassKg).toBeGreaterThan(60)
      expect(result.fatMassKg).toBeGreaterThan(5)
      expect(result.ffmi).toBeGreaterThan(18)
      expect(result.cunninghamBmr).toBeGreaterThan(1600)
      expect(result.regionalBreakdown.length).toBe(4)
      expect(result.landmarks.length).toBeGreaterThanOrEqual(10)
      expect(result.recompositionProjection).toBeDefined()
      expect(result.confidenceIntervalPercent).toBeLessThanOrEqual(2.5)
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.6)
    })

    it('handles female profile with height, weight, and multi-compartment outputs', async () => {
      const result = await analyzeBodyCompositionFromImages({
        sex: 'female',
        heightCm: 168,
        weightKg: 62,
        age: 29,
        waistCm: 68,
        neckCm: 32,
        hipCm: 94,
        clientName: 'Sarah Jenkins',
      })

      expect(result.classification).toBeDefined()
      expect(result.estimatedBodyFatPercent).toBeGreaterThan(15)
      expect(result.estimatedBodyFatPercent).toBeLessThan(30)
      expect(result.leanBodyMassLbs).toBeGreaterThan(80)
      expect(result.skeletalMuscleMassLbs).toBeGreaterThan(40)
      expect(result.recompositionProjection.dailyProteinGrams).toBeGreaterThan(90)
    })
  })

  describe('sanitizeBase64Image', () => {
    it('strips data URI headers and cleans malformed base64 strings', () => {
      const cleanJpg = 'data:image/jpeg;base64,' + 'A'.repeat(100)
      const resJpg = sanitizeBase64Image(cleanJpg)
      expect(resJpg).not.toBeNull()
      expect(resJpg?.mimeType).toBe('image/jpeg')
      expect(resJpg?.data.startsWith('data:')).toBe(false)

      const cleanPng = 'data:image/png;charset=utf-8;base64,' + 'B'.repeat(100)
      const resPng = sanitizeBase64Image(cleanPng)
      expect(resPng).not.toBeNull()
      expect(resPng?.mimeType).toBe('image/png')

      const withLinebreaks = 'data:image/jpeg;base64,\r\n' + 'C'.repeat(60) + '\n ' + 'D'.repeat(40)
      const resLb = sanitizeBase64Image(withLinebreaks)
      expect(resLb).not.toBeNull()
      expect(resLb?.data).not.toContain('\r')
      expect(resLb?.data).not.toContain('\n')
      expect(resLb?.data).not.toContain(' ')

      expect(sanitizeBase64Image(null)).toBeNull()
      expect(sanitizeBase64Image('')).toBeNull()
      expect(sanitizeBase64Image('short')).toBeNull()
    })
  })
})


