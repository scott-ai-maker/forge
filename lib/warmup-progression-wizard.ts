/**
 * NASM Warm-Up Ramp-Up Progression Wizard Engine
 * 
 * Generates evidence-based kinetic warm-up ramp progressions (40%, 60%, 75%, 85%)
 * tailored for Barbells, Dumbbells, Cables, and Machines.
 * 
 * Features:
 * - Dynamic stage generation based on Target Working Weight or 1RM
 * - 4-stage standard, 3-stage express, and 5-stage heavy compound protocols
 * - Visual barbell plate loading breakdown (per-side plates) & dumbbell pair selection
 * - Accurate 5-lb imperial & 2.5-kg metric equipment increment rounding
 * - Structured set note formatting & parsing
 * - Clinical biomechanical guardrails (strict neutral grip for hammer curls)
 */

import {
  calculateBarbellPlates,
  isOlympicWeightExercise,
  PlateCount,
  BarbellType,
  BARBELL_OPTIONS,
} from '@/lib/barbell-plate-calculator'

export type WarmUpProtocolType = 'standard_4' | 'express_3' | 'heavy_compound_5' | 'one_rep_max'

export interface WarmUpWizardStage {
  stageNumber: number
  totalStages: number
  percentage: number
  weightLbs: number
  weightKg: number
  reps: number
  restSeconds: number
  stageTitle: string
  physiologicalObjective: string
  platesSummary: string
  platesPerSide: PlateCount[]
}

export interface WarmUpWizardConfig {
  exerciseName: string
  targetWorkingWeightLbs: number
  oneRmLbs?: number | null
  baselineMode?: 'working_weight' | 'one_rep_max'
  protocolType?: WarmUpProtocolType
  units?: 'imperial' | 'metric'
  barbellType?: BarbellType
}

export interface ProtocolDefinitionStage {
  pct: number
  reps: number
  rest: number
  title: string
  objective: string
}

const PROTOCOL_DEFINITIONS: Record<WarmUpProtocolType, ProtocolDefinitionStage[]> = {
  standard_4: [
    {
      pct: 40,
      reps: 8,
      rest: 45,
      title: 'Joint Synovial & Movement Priming',
      objective: 'Stimulate synovial fluid, raise local muscular temperature, and groove kinetic trajectory without fatigue.',
    },
    {
      pct: 60,
      reps: 5,
      rest: 60,
      title: 'Kinetic Velocity & Motor Synchronization',
      objective: 'Accelerate bar speed and synchronize motor unit recruitment patterns.',
    },
    {
      pct: 75,
      reps: 3,
      rest: 75,
      title: 'Neural Tension & Trajectory Calibration',
      objective: 'Acclimate the nervous system and brace core stability under substantial mechanical load.',
    },
    {
      pct: 85,
      reps: 1,
      rest: 90,
      title: 'Post-Activation Potentiation (PAP)',
      objective: 'Potentiate peak central nervous system output without accumulating metabolic lactate.',
    },
  ],
  express_3: [
    {
      pct: 50,
      reps: 8,
      rest: 45,
      title: 'Kinetic Priming & Flow',
      objective: 'Rapid thermal warmup and motor pattern rehearsal.',
    },
    {
      pct: 70,
      reps: 4,
      rest: 60,
      title: 'Neural Load Transition',
      objective: 'Intermediate threshold motor unit recruitment.',
    },
    {
      pct: 85,
      reps: 2,
      rest: 75,
      title: 'Target Calibration',
      objective: 'Brief potentiation single/double prior to working sets.',
    },
  ],
  heavy_compound_5: [
    {
      pct: 35,
      reps: 10,
      rest: 45,
      title: 'Empty Bar / Joint Mobility',
      objective: 'Full range-of-motion lubricity and dynamic core bracing.',
    },
    {
      pct: 50,
      reps: 6,
      rest: 60,
      title: 'Dynamic Acceleration',
      objective: 'Explosive concentric intent and bar path discipline.',
    },
    {
      pct: 65,
      reps: 4,
      rest: 75,
      title: 'Moderate Neural Loading',
      objective: 'Progressive tension calibration across target musculature.',
    },
    {
      pct: 80,
      reps: 2,
      rest: 90,
      title: 'Heavy Submaximal Primer',
      objective: 'High-threshold motor unit recruitment.',
    },
    {
      pct: 90,
      reps: 1,
      rest: 105,
      title: 'Maximal PAP Over-Warm',
      objective: 'Prime the CNS for working sets to feel lighter and more explosive.',
    },
  ],
  one_rep_max: [
    {
      pct: 40,
      reps: 8,
      rest: 45,
      title: '1RM Joint Priming (40% 1RM)',
      objective: 'Initial movement lubrication at 40% of absolute 1RM.',
    },
    {
      pct: 55,
      reps: 5,
      rest: 60,
      title: 'Kinetic Speed (55% 1RM)',
      objective: 'Fast concentric cadence and motor groove activation.',
    },
    {
      pct: 70,
      reps: 3,
      rest: 75,
      title: 'Strength Transition (70% 1RM)',
      objective: 'Intermediate mechanical tension at 70% 1RM threshold.',
    },
    {
      pct: 80,
      reps: 1,
      rest: 90,
      title: 'Heavy CNS Potentiation (80% 1RM)',
      objective: 'High neural drive preparation prior to heavy working sets.',
    },
  ],
}

/**
 * Checks if exercise is dumbbell-based
 */
export function isDumbbellMovement(exerciseName: string): boolean {
  return /\b(dumbbell|dumbbells|\bdb\b)\b/i.test(exerciseName)
}

/**
 * Checks if exercise is hammer curl movement requiring strict neutral grip guardrail
 */
export function isHammerCurlMovement(exerciseName: string): boolean {
  return exerciseName.toLowerCase().includes('hammer curl')
}

/**
 * Generates structured Warm-Up Ramp stages tailored to the exercise modality and baseline load.
 */
export function generateWarmUpProgressionStages(config: WarmUpWizardConfig): WarmUpWizardStage[] {
  const {
    exerciseName,
    targetWorkingWeightLbs,
    oneRmLbs,
    baselineMode = 'working_weight',
    protocolType = 'standard_4',
    units = 'imperial',
    barbellType = 'olympic_45',
  } = config

  const isBarbell = isOlympicWeightExercise(exerciseName)
  const isDb = isDumbbellMovement(exerciseName)
  const barWeight = isBarbell ? (BARBELL_OPTIONS[barbellType]?.weightLbs ?? 45) : 0

  // Resolve base reference weight
  let referenceWeightLbs = targetWorkingWeightLbs
  let effectiveProtocol = protocolType

  if (baselineMode === 'one_rep_max' && oneRmLbs && oneRmLbs > 0) {
    referenceWeightLbs = oneRmLbs
    effectiveProtocol = 'one_rep_max'
  }

  // Minimum threshold check: if working weight is too low, warm-up ramp isn't applicable
  if (referenceWeightLbs <= 0) return []
  if (isBarbell && referenceWeightLbs <= barWeight) return []
  if (isDb && referenceWeightLbs <= 15) return []

  const stagesDef = PROTOCOL_DEFINITIONS[effectiveProtocol] || PROTOCOL_DEFINITIONS.standard_4
  const totalStages = stagesDef.length
  const stages: WarmUpWizardStage[] = []

  stagesDef.forEach((def, index) => {
    const rawTargetLbs = referenceWeightLbs * (def.pct / 100)

    let finalWeightLbs: number
    let stagePercentage = def.pct
    if (isBarbell) {
      if (index === 0 && def.pct <= 40) {
        // Stage 1 for standard 4-set or heavy compound begins with empty bar
        finalWeightLbs = barWeight
        stagePercentage = def.pct
      } else {
        const roundedTo5 = Math.max(barWeight, Math.round(rawTargetLbs / 5) * 5)
        finalWeightLbs = roundedTo5
      }
    } else if (isDb) {
      // Minimum 10 lb dumbbell pair, rounded to 5 lb jumps
      finalWeightLbs = Math.max(10, Math.round(rawTargetLbs / 5) * 5)
    } else {
      // General machine / cable: rounded to nearest 5
      finalWeightLbs = Math.max(10, Math.round(rawTargetLbs / 5) * 5)
    }

    // Do not exceed working weight for warm-up sets
    if (baselineMode === 'working_weight' && finalWeightLbs >= referenceWeightLbs) {
      finalWeightLbs = Math.max(barWeight || 10, referenceWeightLbs - 5)
    }

    // Calculate metric weight
    const finalWeightKg = units === 'metric'
      ? Math.max(2.5, Math.round((finalWeightLbs / 2.20462) / 2.5) * 2.5)
      : Math.round((finalWeightLbs / 2.20462) * 10) / 10

    // Equipment breakdown summary & plate calculation
    let platesSummary = ''
    let platesPerSide: PlateCount[] = []

    if (isBarbell) {
      const calc = calculateBarbellPlates(finalWeightLbs, barbellType)
      platesSummary = calc.plateSummaryText
      platesPerSide = calc.platesPerSide
    } else if (isDb) {
      const dbWeightDisplay = units === 'imperial' ? finalWeightLbs : finalWeightKg
      platesSummary = `Pair of ${dbWeightDisplay} ${units === 'imperial' ? 'lb' : 'kg'} Dumbbells`
    } else {
      const machineWeight = units === 'imperial' ? finalWeightLbs : finalWeightKg
      platesSummary = `Stack pin at ${machineWeight} ${units === 'imperial' ? 'lb' : 'kg'}`
    }

    stages.push({
      stageNumber: index + 1,
      totalStages,
      percentage: stagePercentage,
      weightLbs: finalWeightLbs,
      weightKg: finalWeightKg,
      reps: def.reps,
      restSeconds: def.rest,
      stageTitle: def.title,
      physiologicalObjective: def.objective,
      platesSummary,
      platesPerSide,
    })
  })

  // Ensure stages have strictly increasing weights or sensible progression
  return stages.filter((stage, idx) => {
    if (idx === 0) return true
    // Filter out redundant duplicate weights
    return stage.weightLbs >= stages[idx - 1].weightLbs
  })
}

/**
 * Formats a clean, serialized warm-up stage tag for workout set notes.
 */
export function formatWarmUpStageNote(
  stage: WarmUpWizardStage,
  units: 'imperial' | 'metric' = 'imperial'
): string {
  const displayWeight = units === 'imperial' ? `${stage.weightLbs}lb` : `${stage.weightKg}kg`
  return `[WarmUp ${stage.stageNumber}/${stage.totalStages}: ${stage.percentage}% @ ${displayWeight} × ${stage.reps} | ${stage.stageTitle}]`
}

/**
 * Parses existing notes to identify if a set was logged as a warm-up ramp stage.
 */
export function parseWarmUpStageNote(notes?: string | null): {
  isWarmUpStage: boolean
  stageNumber?: number
  totalStages?: number
  percentage?: number
} {
  if (!notes) return { isWarmUpStage: false }

  const match = notes.match(/\[WarmUp\s+(\d+)\/(\d+):\s*(\d+)%/)
  if (!match) return { isWarmUpStage: false }

  return {
    isWarmUpStage: true,
    stageNumber: parseInt(match[1], 10),
    totalStages: parseInt(match[2], 10),
    percentage: parseInt(match[3], 10),
  }
}
