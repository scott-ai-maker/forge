/**
 * Smart Workout Auto-Progression & 1RM Overload AI Engine
 * 
 * Implements NASM CPT-7 & OPT™ Resistance Training Guidelines:
 * - Computes dynamic working weight, reps, RPE, and tempo based on:
 *   1. Historical 1RM estimation from logged sets (Epley + Brzycki formula)
 *   2. NASM OPT™ Phase intensity percentage matrix
 *   3. Daily autonomic readiness & ACWR autoregulation modifier
 *   4. NASM 2-for-2 Progressive Overload Rule
 * - Practical load increments (5 lb / 2.5 kg rounding for barbells/dumbbells)
 */

import { calculate1Rm, isLowerBodyExercise } from './progressive-overload-engine'
import { resolveAppropriateTempoAndVolume } from './nasm-tempo-compatibility'

export interface HistoricalSetRecord {
  weightKg?: number | null
  weightLbs?: number | null
  reps: number
  rpe?: number | null
  sessionDate?: string
  isWarmup?: boolean
}

export interface DynamicLoadRecommendationParams {
  exerciseName: string
  nasmOptPhase?: number | null
  targetRepsText?: string | null
  historicalSets: HistoricalSetRecord[]
  dailyReadinessScore?: number | null // 0 - 100
  acwrRatio?: number | null // e.g. 1.15
  preferredUnits?: 'imperial' | 'metric'
  specialPopulation?: 'osteoporosis_osteopenia' | 'cardiovascular_hypertension' | 'pregnancy_prenatal' | 'asthma_respiratory' | null
  hasHeartMedications?: boolean
}

export interface DynamicLoadRecommendation {
  recommendedWeight: number // in preferred units
  recommendedWeightLbs: number
  recommendedWeightKg: number
  recommendedReps: number
  recommendedRpe: number
  recommendedRir: number
  recommendedTempo: string
  estimated1RmLbs: number
  estimated1RmKg: number
  targetIntensityPercentage: number // e.g. 75 (%)
  appliedReadinessModifier: number // e.g. +2.5 (%) or -5 (%)
  badge: string
  badgeColor: 'gold' | 'green' | 'amber' | 'blue'
  rationale: string
  isAutoregulated: boolean
}

// ── NASM OPT™ Phase Defaults ──
interface PhaseIntensityConfig {
  defaultPercentage: number
  minPercentage: number
  maxPercentage: number
  defaultReps: number
  defaultRpe: number
  defaultRir: number
  defaultTempo: string
  phaseName: string
}

const NASM_PHASE_CONFIGS: Record<number, PhaseIntensityConfig> = {
  1: {
    defaultPercentage: 60,
    minPercentage: 50,
    maxPercentage: 70,
    defaultReps: 15,
    defaultRpe: 6.5,
    defaultRir: 3,
    defaultTempo: '4/2/1',
    phaseName: 'Phase 1: Stabilization Endurance',
  },
  2: {
    defaultPercentage: 72.5,
    minPercentage: 70,
    maxPercentage: 80,
    defaultReps: 10,
    defaultRpe: 7.5,
    defaultRir: 2,
    defaultTempo: '2/0/2',
    phaseName: 'Phase 2: Strength Endurance',
  },
  3: {
    defaultPercentage: 80,
    minPercentage: 75,
    maxPercentage: 85,
    defaultReps: 8,
    defaultRpe: 8.0,
    defaultRir: 2,
    defaultTempo: '2/0/2',
    phaseName: 'Phase 3: Muscular Development / Hypertrophy',
  },
  4: {
    defaultPercentage: 90,
    minPercentage: 85,
    maxPercentage: 100,
    defaultReps: 4,
    defaultRpe: 9.0,
    defaultRir: 1,
    defaultTempo: 'Explosive / 2/0/1',
    phaseName: 'Phase 4: Maximal Strength',
  },
  5: {
    defaultPercentage: 40, // for explosive component or 85%+ for strength
    minPercentage: 30,
    maxPercentage: 45,
    defaultReps: 5,
    defaultRpe: 8.5,
    defaultRir: 1,
    defaultTempo: 'Explosive',
    phaseName: 'Phase 5: Power',
  },
}

/**
 * Extracts numeric target reps from a string like "8-12", "10-12", "15", "4-6"
 */
export function parseTargetRepValue(repsText?: string | null, defaultVal = 10): number {
  if (!repsText) return defaultVal
  const str = String(repsText).trim()
  const matchRange = str.match(/(\d+)\s*[-–—]\s*(\d+)/)
  if (matchRange) {
    const min = parseInt(matchRange[1], 10)
    const max = parseInt(matchRange[2], 10)
    return Math.round((min + max) / 2)
  }
  const matchSingle = str.match(/(\d+)/)
  if (matchSingle) {
    return parseInt(matchSingle[1], 10)
  }
  return defaultVal
}

/**
 * Computes estimated 1RM across all historical set logs for an exercise
 */
export function calculateBestHistorical1Rm(historicalSets: HistoricalSetRecord[]): {
  best1RmLbs: number
  best1RmKg: number
} {
  let best1RmLbs = 0

  for (const set of historicalSets) {
    if (set.isWarmup) continue
    const reps = Number(set.reps) || 0
    if (reps <= 0) continue

    let weightLbs = 0
    if (typeof set.weightLbs === 'number' && set.weightLbs > 0) {
      weightLbs = set.weightLbs
    } else if (typeof set.weightKg === 'number' && set.weightKg > 0) {
      weightLbs = set.weightKg * 2.20462
    }

    if (weightLbs > 0) {
      const calc = calculate1Rm(weightLbs, reps)
      if (calc.average1RmLbs > best1RmLbs) {
        best1RmLbs = calc.average1RmLbs
      }
    }
  }

  const best1RmKg = Math.round((best1RmLbs / 2.20462) * 10) / 10
  return { best1RmLbs: Math.round(best1RmLbs), best1RmKg }
}

/**
 * Computes a conservative, biomechanically safe starter weight for an exercise
 * when an athlete has zero prior historical logs.
 * Prevents dangerous 45 lb / 95 lb defaults on single-joint dumbbell or bodyweight movements.
 */
export function calculateBaselineStarterLoad(exerciseName: string, isLower: boolean): {
  lbs: number
  kg: number
  rationaleSnippet: string
} {
  const norm = exerciseName.toLowerCase().trim()

  // 1. Bodyweight exercises -> 0 lbs
  if (
    norm.includes('push up') ||
    norm.includes('push-up') ||
    norm.includes('pull up') ||
    norm.includes('pull-up') ||
    norm.includes('chin up') ||
    norm.includes('chin-up') ||
    norm.includes('dip') ||
    norm.includes('plank') ||
    norm.includes('crunch') ||
    norm.includes('dead bug') ||
    norm.includes('bird dog') ||
    norm.includes('bodyweight') ||
    norm.includes('air squat') ||
    norm.includes('prisoner squat') ||
    norm.includes('burpee') ||
    norm.includes('jump') ||
    norm.includes('floor bridge') ||
    norm.includes('glute bridge') ||
    norm.includes('prone cobra') ||
    norm.includes('superman') ||
    norm.includes('superperson') ||
    norm.includes('wall sit') ||
    norm.includes('inverted row') ||
    norm.includes('hanging leg') ||
    norm.includes('knee raise') ||
    norm.includes('bear crawl')
  ) {
    return { lbs: 0, kg: 0, rationaleSnippet: 'Bodyweight calibration baseline (0 external load).' }
  }

  // 2. Small stabilizers & single-joint isolation (Dumbbell lateral raise, curls, kickbacks, flyes, rear delt, scaption)
  if (
    norm.includes('lateral raise') ||
    norm.includes('front raise') ||
    norm.includes('rear delt') ||
    norm.includes('scaption') ||
    norm.includes('bicep curl') ||
    norm.includes('curl') ||
    norm.includes('tricep kickback') ||
    norm.includes('triceps kickback') ||
    norm.includes('tricep extension') ||
    norm.includes('triceps extension') ||
    norm.includes('wrist curl') ||
    norm.includes('external rotation') ||
    norm.includes('internal rotation') ||
    norm.includes('fly') ||
    norm.includes('flye')
  ) {
    return { lbs: 10, kg: 5, rationaleSnippet: 'Conservative single-joint starter load (10 lbs / 5 kg).' }
  }

  // 3. Dumbbell / Kettlebell compound movements (including goblet squats, lunges, split squats, step-ups)
  if (
    norm.includes('dumbbell') ||
    norm.includes('db ') ||
    norm.includes('kettlebell') ||
    norm.includes('kb ') ||
    norm.includes('goblet') ||
    norm.includes('lunge') ||
    norm.includes('split squat') ||
    norm.includes('step-up') ||
    norm.includes('step up') ||
    norm.includes('single-leg squat') ||
    norm.includes('single leg squat')
  ) {
    if (isLower) {
      // Goblet squat, DB lunge, DB RDL, DB step-up
      return { lbs: 25, kg: 12.5, rationaleSnippet: 'Conservative dumbbell compound lower starter load (25 lbs).' }
    }
    return { lbs: 20, kg: 10, rationaleSnippet: 'Conservative dumbbell compound upper starter load (20 lbs).' }
  }

  // 4. Barbell / Machine Compound Lower Body (Squat, Deadlift, Leg Press)
  if (isLower) {
    return { lbs: 65, kg: 30, rationaleSnippet: 'Conservative barbell lower starter load (65 lbs).' }
  }

  // 5. Barbell / Machine Compound Upper Body (Bench Press, Overhead Press, Barbell Row)
  return { lbs: 45, kg: 20, rationaleSnippet: 'Standard Olympic barbell baseline (45 lbs).' }
}

/**
 * Core Algorithm: Computes Dynamic Load Recommendation
 */
export function recommendWorkingLoad({
  exerciseName,
  nasmOptPhase = 1,
  targetRepsText,
  historicalSets = [],
  dailyReadinessScore = null,
  acwrRatio = null,
  preferredUnits = 'imperial',
  specialPopulation = null,
  hasHeartMedications = false,
}: DynamicLoadRecommendationParams): DynamicLoadRecommendation {
  const phaseNumber = Math.min(5, Math.max(1, nasmOptPhase || 1))
  const phaseConfig = NASM_PHASE_CONFIGS[phaseNumber] || NASM_PHASE_CONFIGS[1]

  const { best1RmLbs, best1RmKg } = calculateBestHistorical1Rm(historicalSets)
  const isLower = isLowerBodyExercise(exerciseName)
  const targetReps = parseTargetRepValue(targetRepsText, phaseConfig.defaultReps)

  // ── Baseline Percentage from Rep Target or Phase Config ──
  // Brzycki inverse percentage: % = 1.0278 - (0.0278 * targetReps)
  let basePercentage = phaseConfig.defaultPercentage
  if (targetReps > 0 && targetReps <= 20) {
    const theoreticalIntensity = (1.0278 - 0.0278 * Math.min(targetReps, 20)) * 100
    // Clamp within phase min/max
    basePercentage = Math.round(Math.min(phaseConfig.maxPercentage, Math.max(phaseConfig.minPercentage, theoreticalIntensity)))
  }

  // ── Readiness & ACWR Autoregulation Modifier ──
  let readinessModifier = 0
  let badge = 'Progressive Target'
  let badgeColor: 'gold' | 'green' | 'amber' | 'blue' = 'gold'
  let rationale = `Calibrated to ${phaseConfig.phaseName} (${basePercentage}% 1RM).`
  let isAutoregulated = false

  const hasReadiness = typeof dailyReadinessScore === 'number' && Number.isFinite(dailyReadinessScore)
  const hasAcwr = typeof acwrRatio === 'number' && Number.isFinite(acwrRatio)

  if (hasReadiness && dailyReadinessScore! >= 90 && (!hasAcwr || acwrRatio! <= 1.3)) {
    // CNS Primed: Overload boost
    readinessModifier = +2.5
    badge = 'PR Opportunity · CNS Primed'
    badgeColor = 'green'
    rationale = `Daily Readiness is exceptional (${dailyReadinessScore}%). CNS is primed for progressive overload (+2.5% load).`
    isAutoregulated = true
  } else if ((hasReadiness && dailyReadinessScore! < 50) || (hasAcwr && acwrRatio! >= 1.5)) {
    // High Fatigue / Injury Danger Zone: Protective deload
    readinessModifier = -10
    badge = 'Fatigue Shield · Deload'
    badgeColor = 'amber'
    rationale = hasAcwr && acwrRatio! >= 1.5
      ? `ACWR workload ratio is in Danger Zone (${acwrRatio!.toFixed(2)}). Load auto-regulated -10% for soft-tissue preservation.`
      : `Daily Readiness is low (${dailyReadinessScore}%). Load auto-regulated -10% to prevent overreaching.`
    isAutoregulated = true
  } else if (hasReadiness && dailyReadinessScore! < 70) {
    // Moderate Fatigue
    readinessModifier = -2.5
    badge = 'Autoregulated Maintenance'
    badgeColor = 'blue'
    rationale = `Daily Readiness is moderate (${dailyReadinessScore}%). Load held at stable recovery threshold.`
    isAutoregulated = true
  } else if (hasReadiness) {
    badge = 'Progressive Overload'
    badgeColor = 'gold'
    rationale = `Readiness is optimal (${dailyReadinessScore}%). Standard progressive resistance prescribed.`
  } else {
    badge = 'Progressive Overload'
    badgeColor = 'gold'
    rationale = `Calibrated to ${phaseConfig.phaseName} (${basePercentage}% 1RM). Standard progressive resistance prescribed.`
  }

  let effectivePercentage = Math.max(30, Math.min(100, basePercentage + readinessModifier))

  // ── Special Populations & Clinical Safety Capping ──
  const isHypertensiveOrCardiac = hasHeartMedications || specialPopulation === 'cardiovascular_hypertension'
  const isOsteoporosis = specialPopulation === 'osteoporosis_osteopenia'

  if (isHypertensiveOrCardiac && effectivePercentage > 75) {
    effectivePercentage = 75
    badge = 'Cardiac Guard · BP Shield'
    badgeColor = 'amber'
    rationale = `Hypertension / Cardiac protocol: Intensity capped at 75% 1RM to prevent dangerous Valsalva maneuver blood pressure spikes. Maintain continuous rhythmic diaphragmatic breathing.`
    isAutoregulated = true
  } else if (isOsteoporosis && effectivePercentage > 75) {
    effectivePercentage = 75
    badge = 'Bone Density Protocol'
    badgeColor = 'blue'
    rationale = `Bone density protocol: Intensity capped at 75% 1RM for osteogenic remodeling without compressive vertebral or articular fracture risk.`
    isAutoregulated = true
  }

  // ── Calculate Target Weight ──
  let recommendedWeightLbs = 0
  let recommendedWeightKg = 0

  if (best1RmLbs > 0) {
    const rawTargetLbs = best1RmLbs * (effectivePercentage / 100)
    // Practical rounding: 5 lbs for upper/lower or 2.5 kg
    recommendedWeightLbs = Math.max(5, Math.round(rawTargetLbs / 5) * 5)
    recommendedWeightKg = Math.max(2.5, Math.round((rawTargetLbs / 2.20462) / 2.5) * 2.5)
  } else {
    // Intelligent fallback if no 1RM logged yet
    const starter = calculateBaselineStarterLoad(exerciseName, isLower)
    recommendedWeightLbs = starter.lbs
    recommendedWeightKg = starter.kg
    badge = 'Baseline Calibrator'
    rationale = `Initial calibrating set for ${exerciseName} (${starter.rationaleSnippet}). Log this set to establish baseline 1RM.`
  }

  const recommendedWeight = preferredUnits === 'imperial' ? recommendedWeightLbs : recommendedWeightKg

  // Adjust RPE based on phase & readiness
  let recommendedRpe = phaseConfig.defaultRpe
  if (readinessModifier > 0) recommendedRpe = Math.min(9.5, recommendedRpe + 0.5)
  if (readinessModifier < 0) recommendedRpe = Math.max(6.0, recommendedRpe - 1.0)
  if (isHypertensiveOrCardiac && recommendedRpe > 7.5) {
    recommendedRpe = 7.5
  }

  // Resolve physiologically compatible tempo for this exercise
  const recommendedTempo = resolveAppropriateTempoAndVolume(
    { name: exerciseName, tempo: phaseConfig.defaultTempo },
    phaseNumber
  ).tempo

  return {
    recommendedWeight,
    recommendedWeightLbs,
    recommendedWeightKg,
    recommendedReps: targetReps,
    recommendedRpe,
    recommendedRir: phaseConfig.defaultRir,
    recommendedTempo,
    estimated1RmLbs: best1RmLbs,
    estimated1RmKg: best1RmKg,
    targetIntensityPercentage: effectivePercentage,
    appliedReadinessModifier: readinessModifier,
    badge,
    badgeColor,
    rationale,
    isAutoregulated,
  }
}
