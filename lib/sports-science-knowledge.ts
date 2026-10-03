/**
 * Gordon Athletic Advisory — Sports Science Clinical Knowledge & Calculation Engine
 * Ingested from official NASM 7th Edition sports science reference matrices:
 * 1. One Repetition Maximum (1RM) Conversion Table (2-10 reps, 5-1,000 lbs)
 * 2. Body Composition Assessment Protocols (Circumference, Waist-to-Hip, Skinfolds)
 * 3. Cardiorespiratory Assessment Suite (YMCA 3-Min Step Test, Rockport VO2max, 1.5-Mile Run, VT1/VT2)
 */

// ── 1. ONE REPETITION MAXIMUM (1RM) CONVERSION MATRIX ─────────────────────────

export const NASM_REP_MAX_PERCENTAGES: Record<number, number> = {
  1: 1.0,
  2: 0.95,
  3: 0.93,
  4: 0.9,
  5: 0.87,
  6: 0.85,
  7: 0.83,
  8: 0.8,
  9: 0.77,
  10: 0.75,
  11: 0.73,
  12: 0.7,
  15: 0.65,
  20: 0.6,
}

/**
 * Calculates estimated 1RM from submaximal weight and reps using NASM conversion standards.
 * @param weightLiftedLbs - Weight lifted in pounds (or kg)
 * @param repsCompleted - Repetitions performed (1 - 20)
 * @returns Estimated 1-Repetition Maximum (1RM)
 */
export function calculateOneRepMax(weightLiftedLbs: number, repsCompleted: number): number {
  if (repsCompleted <= 1) return Math.round(weightLiftedLbs)
  
  // Use exact NASM percentage if in table, or standard Brzycki interpolation for edge reps
  const percentage =
    NASM_REP_MAX_PERCENTAGES[repsCompleted] ??
    Math.max(0.5, 1.0 - (repsCompleted - 1) * 0.025)

  return Math.round(weightLiftedLbs / percentage)
}

/**
 * Computes target training load for a prescribed OPT™ phase based on client's known 1RM.
 * @param oneRepMaxLbs - 1RM in lbs
 * @param targetPercentage - Desired intensity (e.g. 0.75 for 75% 1RM)
 * @returns Prescribed working weight in lbs
 */
export function calculateTargetTrainingLoad(oneRepMaxLbs: number, targetPercentage: number): number {
  return Math.round((oneRepMaxLbs * targetPercentage) / 5) * 5 // Rounded to nearest 5 lbs plate increment
}

// ── 2. BODY COMPOSITION ASSESSMENT PROTOCOLS ─────────────────────────────────

export interface CircumferenceMeasurements {
  waistInches: number
  hipsInches: number
  neckInches?: number
  chestInches?: number
  thighsInches?: number
  calvesInches?: number
  bicepsInches?: number
}

export interface WaistToHipEvaluation {
  ratio: number
  riskCategory: 'Low Risk' | 'Moderate Risk' | 'High Risk'
  clinicalStandard: string
}

/**
 * Computes Waist-to-Hip Ratio (WHR) and assesses clinical cardiometabolic risk.
 * NASM Standard: Men > 0.95 and Women > 0.80 indicate elevated cardiovascular / metabolic disease risk.
 */
export function evaluateWaistToHipRatio(
  waistInches: number,
  hipsInches: number,
  sex: 'male' | 'female'
): WaistToHipEvaluation {
  const ratio = Number((waistInches / hipsInches).toFixed(2))

  if (sex === 'male') {
    if (ratio <= 0.9) {
      return { ratio, riskCategory: 'Low Risk', clinicalStandard: 'Optimal visceral fat distribution (≤0.90)' }
    } else if (ratio <= 0.95) {
      return { ratio, riskCategory: 'Moderate Risk', clinicalStandard: 'Moderate abdominal adiposity (0.91 - 0.95)' }
    } else {
      return { ratio, riskCategory: 'High Risk', clinicalStandard: 'Excessive android / visceral fat (>0.95)' }
    }
  } else {
    if (ratio <= 0.75) {
      return { ratio, riskCategory: 'Low Risk', clinicalStandard: 'Optimal gynoid fat distribution (≤0.75)' }
    } else if (ratio <= 0.8) {
      return { ratio, riskCategory: 'Moderate Risk', clinicalStandard: 'Moderate abdominal adiposity (0.76 - 0.80)' }
    } else {
      return { ratio, riskCategory: 'High Risk', clinicalStandard: 'Excessive android / visceral fat (>0.80)' }
    }
  }
}

export interface SkinfoldMeasurementsJacksonPollock3 {
  age: number
  sex: 'male' | 'female'
  // Men: Chest, Abdomen, Thigh (mm)
  // Women: Triceps, Suprailiac, Thigh (mm)
  site1Mm: number // Chest (M) / Triceps (F)
  site2Mm: number // Abdomen (M) / Suprailiac (F)
  site3Mm: number // Thigh (M) / Thigh (F)
}

/**
 * Jackson & Pollock 3-Site Skinfold Body Density & Siri Body Fat Percentage Calculator.
 */
export function calculateJacksonPollock3BodyFat(input: SkinfoldMeasurementsJacksonPollock3): {
  bodyFatPercent: number
  sumOfSkinfoldsMm: number
  bodyDensity: number
  classification: 'Athletic / Lean' | 'Fitness' | 'Average' | 'Elevated Body Fat'
} {
  const { age, sex, site1Mm, site2Mm, site3Mm } = input
  const sum = site1Mm + site2Mm + site3Mm
  let bodyDensity = 0

  if (sex === 'male') {
    // Jackson-Pollock Men: BD = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum^2) - (0.0002574 * age)
    bodyDensity =
      1.10938 - 0.0008267 * sum + 0.0000016 * Math.pow(sum, 2) - 0.0002574 * age
  } else {
    // Jackson-Pollock Women: BD = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum^2) - (0.0001392 * age)
    bodyDensity =
      1.0994921 - 0.0009929 * sum + 0.0000023 * Math.pow(sum, 2) - 0.0001392 * age
  }

  // Siri Formula: % Body Fat = ((4.95 / Body Density) - 4.50) * 100
  const rawBodyFat = (4.95 / bodyDensity - 4.5) * 100
  const bodyFatPercent = Number(Math.max(4, Math.min(50, rawBodyFat)).toFixed(1))

  let classification: 'Athletic / Lean' | 'Fitness' | 'Average' | 'Elevated Body Fat' = 'Fitness'
  if (sex === 'male') {
    if (bodyFatPercent < 12) classification = 'Athletic / Lean'
    else if (bodyFatPercent <= 17) classification = 'Fitness'
    else if (bodyFatPercent <= 24) classification = 'Average'
    else classification = 'Elevated Body Fat'
  } else {
    if (bodyFatPercent < 20) classification = 'Athletic / Lean'
    else if (bodyFatPercent <= 24) classification = 'Fitness'
    else if (bodyFatPercent <= 31) classification = 'Average'
    else classification = 'Elevated Body Fat'
  }

  return { bodyFatPercent, sumOfSkinfoldsMm: sum, bodyDensity, classification }
}

// ── 3. CARDIORESPIRATORY ASSESSMENT SUITE (NASM 7th Edition) ──────────────────

export interface RockportWalkTestInput {
  weightLbs: number
  age: number
  sex: 'male' | 'female'
  timeInMinutes: number // e.g. 14.5 for 14 min 30 sec
  postWalkHeartRateBpm: number
}

/**
 * Rockport 1-Mile Walk Test VO2max Calculator.
 * Equation: VO2max = 132.853 - (0.0769 * weightLbs) - (0.3877 * age) + (6.315 * gender [1=M, 0=F]) - (3.2649 * timeMins) - (0.1565 * hrBpm)
 */
export function calculateRockportVO2Max(input: RockportWalkTestInput): {
  vo2MaxMlKgMin: number
  cardioRating: 'Very Poor' | 'Poor' | 'Below Average' | 'Average' | 'Above Average' | 'Good' | 'Excellent' | 'Superior'
} {
  const { weightLbs, age, sex, timeInMinutes, postWalkHeartRateBpm } = input
  const genderFactor = sex === 'male' ? 6.315 : 0

  const vo2Max =
    132.853 -
    0.0769 * weightLbs -
    0.3877 * age +
    genderFactor -
    3.2649 * timeInMinutes -
    0.1565 * postWalkHeartRateBpm

  const vo2MaxMlKgMin = Number(Math.max(15, Math.min(85, vo2Max)).toFixed(1))

  let cardioRating: 'Very Poor' | 'Poor' | 'Below Average' | 'Average' | 'Above Average' | 'Good' | 'Excellent' | 'Superior' =
    'Average'

  if (sex === 'male') {
    if (vo2MaxMlKgMin >= 55) cardioRating = 'Superior'
    else if (vo2MaxMlKgMin >= 48) cardioRating = 'Excellent'
    else if (vo2MaxMlKgMin >= 42) cardioRating = 'Good'
    else if (vo2MaxMlKgMin >= 37) cardioRating = 'Above Average'
    else if (vo2MaxMlKgMin >= 32) cardioRating = 'Average'
    else if (vo2MaxMlKgMin >= 26) cardioRating = 'Below Average'
    else cardioRating = 'Poor'
  } else {
    if (vo2MaxMlKgMin >= 48) cardioRating = 'Superior'
    else if (vo2MaxMlKgMin >= 42) cardioRating = 'Excellent'
    else if (vo2MaxMlKgMin >= 36) cardioRating = 'Good'
    else if (vo2MaxMlKgMin >= 31) cardioRating = 'Above Average'
    else if (vo2MaxMlKgMin >= 26) cardioRating = 'Average'
    else if (vo2MaxMlKgMin >= 22) cardioRating = 'Below Average'
    else cardioRating = 'Poor'
  }

  return { vo2MaxMlKgMin, cardioRating }
}

export interface YmcaStepTestInput {
  age: number
  sex: 'male' | 'female'
  recoveryHeartRateBpm: number // 60-second recovery HR immediately following 3 minutes at 96 bpm
}

/**
 * YMCA 3-Minute Step Test Recovery Assessment (NASM Table 11.11).
 */
export function evaluateYmcaStepTest(input: YmcaStepTestInput): {
  rating: 'Excellent' | 'Good' | 'Above Average' | 'Average' | 'Below Average' | 'Poor' | 'Very Poor'
  targetHeartRateZone1: string
  targetHeartRateZone2: string
  targetHeartRateZone3: string
} {
  const { age, sex, recoveryHeartRateBpm: hr } = input
  const maxHr = Math.round(208 - 0.7 * age) // Tanaka formula

  let rating: 'Excellent' | 'Good' | 'Above Average' | 'Average' | 'Below Average' | 'Poor' | 'Very Poor' = 'Average'

  if (sex === 'male') {
    if (hr < 85) rating = 'Excellent'
    else if (hr <= 95) rating = 'Good'
    else if (hr <= 102) rating = 'Above Average'
    else if (hr <= 111) rating = 'Average'
    else if (hr <= 119) rating = 'Below Average'
    else if (hr <= 128) rating = 'Poor'
    else rating = 'Very Poor'
  } else {
    if (hr < 93) rating = 'Excellent'
    else if (hr <= 104) rating = 'Good'
    else if (hr <= 111) rating = 'Above Average'
    else if (hr <= 120) rating = 'Average'
    else if (hr <= 128) rating = 'Below Average'
    else if (hr <= 135) rating = 'Poor'
    else rating = 'Very Poor'
  }

  // Calculate NASM 3-Zone Cardiorespiratory Training Ranges
  const z1Min = Math.round(maxHr * 0.65)
  const z1Max = Math.round(maxHr * 0.75)
  const z2Min = Math.round(maxHr * 0.76)
  const z2Max = Math.round(maxHr * 0.85)
  const z3Min = Math.round(maxHr * 0.86)
  const z3Max = Math.round(maxHr * 0.95)

  return {
    rating,
    targetHeartRateZone1: `${z1Min} – ${z1Max} bpm (Aerobic Base / Recovery)`,
    targetHeartRateZone2: `${z2Min} – ${z2Max} bpm (Lactate Threshold / Interval)`,
    targetHeartRateZone3: `${z3Min} – ${z3Max} bpm (Peak Anaerobic / Power)`,
  }
}

/**
 * 1.5-Mile Run VO2max Test (NASM Table 11.13).
 * Formula: VO2max = 3.5 + 483 / Time in minutes
 */
export function calculate1Point5MileRunVO2Max(timeInMinutes: number): number {
  return Number((3.5 + 483 / Math.max(7, timeInMinutes)).toFixed(1))
}
