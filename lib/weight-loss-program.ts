import type { GeminiCoachGenerationRequest } from './gemini-nasm-master-coach'
import {
  calculateEnergyExpenditure,
  calculatePrecisionMacros,
  type ActivityLevel,
  type MetabolicEnergyAnalysis,
  type PrecisionMacroPrescription,
} from './metabolic-nutrition'

const KG_TO_LBS = 2.20462
const CM_TO_IN = 0.393701
// NASM CPT-7: sustainable loss is ~1-2 lb/week, capped at ~1% of bodyweight
const MAX_WEEKLY_LOSS_LBS = 2
const MAX_WEEKLY_LOSS_PCT = 0.01
const MIN_WEEKLY_LOSS_LBS = 0.5

export interface WeightLossClientStats {
  clientName?: string | null
  age?: number | null
  sex?: 'male' | 'female' | 'other' | null
  heightCm?: number | null
  weightKg?: number | null
  targetWeightKg?: number | null
  bodyFatPercent?: number | null
  targetBodyFatPercent?: number | null
  activityLevel?: string | null
  trainingDaysPerWeek?: number | null
  experienceLevel?: string | null
  equipmentAccess?: string[] | null
  injuriesLimitations?: string | null
  contraindicationTags?: string[]
}

export interface WeightLossTargets {
  currentWeightLbs: number
  targetWeightLbs: number
  lbsToLose: number
  weeklyLossLbs: number
  estimatedWeeks: number
  dailyDeficitCalories: number
  energy: MetabolicEnergyAnalysis
  macros: PrecisionMacroPrescription
}

const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']

export function normalizeActivity(value?: string | null): ActivityLevel {
  const key = (value ?? '').toLowerCase().replace(/[\s-]+/g, '_')
  return (ACTIVITY_LEVELS as string[]).includes(key) ? (key as ActivityLevel) : 'lightly_active'
}

export function calculateWeightLossTargets(stats: WeightLossClientStats): WeightLossTargets | null {
  if (!stats.weightKg || stats.weightKg <= 0) return null

  const currentWeightLbs = Math.round(stats.weightKg * KG_TO_LBS * 10) / 10
  const requestedTarget = stats.targetWeightKg && stats.targetWeightKg > 0 ? stats.targetWeightKg * KG_TO_LBS : null
  // Without a stated goal weight, default to a 10% reduction
  const targetWeightLbs = Math.round((requestedTarget && requestedTarget < currentWeightLbs ? requestedTarget : currentWeightLbs * 0.9) * 10) / 10
  const lbsToLose = Math.round((currentWeightLbs - targetWeightLbs) * 10) / 10

  const weeklyLossLbs = Math.max(
    MIN_WEEKLY_LOSS_LBS,
    Math.min(MAX_WEEKLY_LOSS_LBS, currentWeightLbs * MAX_WEEKLY_LOSS_PCT)
  )

  const profile = {
    weightLbs: currentWeightLbs,
    heightInches: stats.heightCm ? stats.heightCm * CM_TO_IN : undefined,
    age: stats.age ?? undefined,
    sex: stats.sex ?? undefined,
    bodyFatPercent: stats.bodyFatPercent ?? undefined,
    activityLevel: normalizeActivity(stats.activityLevel),
    goal: 'fat_loss' as const,
    phase: 'phase1_stabilization' as const,
  }

  return {
    currentWeightLbs,
    targetWeightLbs,
    lbsToLose,
    weeklyLossLbs: Math.round(weeklyLossLbs * 10) / 10,
    estimatedWeeks: Math.max(1, Math.ceil(lbsToLose / weeklyLossLbs)),
    dailyDeficitCalories: Math.round((weeklyLossLbs * 3500) / 7),
    energy: calculateEnergyExpenditure(profile),
    macros: calculatePrecisionMacros(profile),
  }
}

export function buildWeightLossGenerationRequest(
  stats: WeightLossClientStats,
  targets: WeightLossTargets | null,
  coachGuidanceNotes?: string
): GeminiCoachGenerationRequest {
  const experience = ['beginner', 'intermediate', 'advanced', 'elite'].includes(stats.experienceLevel ?? '')
    ? (stats.experienceLevel as GeminiCoachGenerationRequest['experienceLevel'])
    : 'beginner'

  const targetLine = targets
    ? `Weight-loss goal: ${targets.currentWeightLbs} lbs -> ${targets.targetWeightLbs} lbs (${targets.lbsToLose} lbs, ~${targets.weeklyLossLbs} lb/week, ~${targets.estimatedWeeks} weeks). ` +
      `Nutrition: ${targets.macros.targetCalories} kcal/day, ${targets.macros.proteinGrams}g protein. `
    : ''
  const bfLine = stats.bodyFatPercent ? `Current body fat ${stats.bodyFatPercent}%` +
    (stats.targetBodyFatPercent ? `, target ${stats.targetBodyFatPercent}%. ` : '. ') : ''

  return {
    clientName: stats.clientName ?? undefined,
    clientAge: stats.age ?? undefined,
    clientSex: stats.sex === 'female' ? 'female' : stats.sex === 'male' ? 'male' : undefined,
    goal: 'fat_loss',
    // Weight loss specialization starts in Phase 1 Stabilization Endurance for beginners, Phase 2 otherwise
    targetNasmPhase: experience === 'beginner' ? 1 : 2,
    trainingDaysPerWeek: Math.min(6, Math.max(2, stats.trainingDaysPerWeek ?? 4)),
    experienceLevel: experience,
    equipmentAccess: stats.equipmentAccess?.length ? stats.equipmentAccess : undefined,
    cardioBlendStyle: 'integrated_finishers',
    coachGuidanceNotes: `NASM Weight Loss Specialization program. ${targetLine}${bfLine}${coachGuidanceNotes ?? ''}`.trim(),
    contraindicationTags: stats.contraindicationTags,
    injuriesLimitations: stats.injuriesLimitations ?? undefined,
  }
}

export interface NutritionTargetsSnapshot {
  currentWeightLbs: number
  targetWeightLbs: number
  weeklyLossLbs: number
  estimatedWeeks: number
  targetCalories: number
  proteinGrams: number
  carbGrams: number
  fatGrams: number
}

export function buildNutritionTargetsSnapshot(targets: WeightLossTargets): NutritionTargetsSnapshot {
  return {
    currentWeightLbs: targets.currentWeightLbs,
    targetWeightLbs: targets.targetWeightLbs,
    weeklyLossLbs: targets.weeklyLossLbs,
    estimatedWeeks: targets.estimatedWeeks,
    targetCalories: targets.macros.targetCalories,
    proteinGrams: targets.macros.proteinGrams,
    carbGrams: targets.macros.carbGrams,
    fatGrams: targets.macros.fatGrams,
  }
}

const NUTRITION_TARGET_LIMITS: Record<keyof NutritionTargetsSnapshot, [number, number]> = {
  currentWeightLbs: [50, 1000],
  targetWeightLbs: [50, 1000],
  weeklyLossLbs: [0, 5],
  estimatedWeeks: [1, 520],
  targetCalories: [800, 6000],
  proteinGrams: [0, 600],
  carbGrams: [0, 1000],
  fatGrams: [0, 400],
}

// Validates untrusted input before it is persisted with a plan; returns null unless every field is a sane number.
export function parseNutritionTargets(value: unknown): NutritionTargetsSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const result = {} as Record<string, number>
  for (const [key, [min, max]] of Object.entries(NUTRITION_TARGET_LIMITS)) {
    const n = Number(source[key])
    if (!Number.isFinite(n) || n < min || n > max) return null
    result[key] = Math.round(n * 10) / 10
  }
  return result as unknown as NutritionTargetsSnapshot
}
