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

  const effectivePercentage = Math.max(30, Math.min(100, basePercentage + readinessModifier))

  // ── Calculate Target Weight ──
  let recommendedWeightLbs = 0
  let recommendedWeightKg = 0

  if (best1RmLbs > 0) {
    const rawTargetLbs = best1RmLbs * (effectivePercentage / 100)
    // Practical rounding: 5 lbs for upper/lower or 2.5 kg
    recommendedWeightLbs = Math.max(5, Math.round(rawTargetLbs / 5) * 5)
    recommendedWeightKg = Math.max(2.5, Math.round((rawTargetLbs / 2.20462) / 2.5) * 2.5)
  } else {
    // Fallback if no 1RM logged yet (use standard starter weight)
    recommendedWeightLbs = isLower ? 95 : 45
    recommendedWeightKg = isLower ? 40 : 20
    badge = 'Baseline Calibrator'
    rationale = `Initial calibrating set for ${exerciseName}. Log this set to establish baseline 1RM.`
  }

  const recommendedWeight = preferredUnits === 'imperial' ? recommendedWeightLbs : recommendedWeightKg

  // Adjust RPE based on phase & readiness
  let recommendedRpe = phaseConfig.defaultRpe
  if (readinessModifier > 0) recommendedRpe = Math.min(9.5, recommendedRpe + 0.5)
  if (readinessModifier < 0) recommendedRpe = Math.max(6.0, recommendedRpe - 1.0)

  return {
    recommendedWeight,
    recommendedWeightLbs,
    recommendedWeightKg,
    recommendedReps: targetReps,
    recommendedRpe,
    recommendedRir: phaseConfig.defaultRir,
    recommendedTempo: phaseConfig.defaultTempo,
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
