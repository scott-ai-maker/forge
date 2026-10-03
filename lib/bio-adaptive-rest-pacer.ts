/**
 * Gordon Athletic Advisory — Bio-Adaptive Rest Timer Pacer Engine
 * 
 * Dynamically scales upcoming rest intervals based on real-time set RPE / RIR exertion,
 * NASM OPT phase metabolic targets, and compound vs isolation movement kinematics:
 * 
 * Physiological Rest Pacing Models:
 * - RIR 0.0 (RPE 10.0 / Involuntary Failure): +30s to +45s extension for ATP-CP resynthesis
 * - RIR 0.5 - 1.0 (RPE 9.0 - 9.5 / High Strain): +15s to +30s extension
 * - RIR 2.0 - 2.5 (RPE 7.5 - 8.0 / Optimal Target): Preserves scheduled baseline
 * - RIR 3.0 - 3.5 (RPE 6.5 - 7.0 / Moderate): 0s to -10s pacing
 * - RIR >= 4.0 (RPE <= 6.0 / High Reserve / Speed): -15s density acceleration
 */

import { normalizeRpeValue, normalizeRirValue, mapRpeToRir } from './rpe-exertion-scale'
import { isOlympicWeightExercise } from './barbell-plate-calculator'

export interface BioAdaptiveRestInput {
  exerciseName: string
  baseRestSeconds: number
  rpe?: number | string | null
  rir?: number | string | null
  isWarmup?: boolean
  optPhase?: number
  isCompound?: boolean
  autoAdaptiveEnabled?: boolean
  hasAcuteFatigueDrop?: boolean
  acuteFatigueDropPercent?: number
  velocityLossPercent?: number
}

export interface BioAdaptiveRestResult {
  baseRestSeconds: number
  finalRestSeconds: number
  deltaSeconds: number
  isBioPaced: boolean
  pacingAction: 'extended_failure' | 'extended_strain' | 'extended_acute_fatigue' | 'preserved_optimal' | 'accelerated_density' | 'warmup_speed'
  badgeText: string
  adaptationReason: string
  coachVoiceCue: string
  isHammerCurl: boolean
}

const COMPOUND_KEYWORDS = [
  'squat', 'deadlift', 'bench', 'press', 'row', 'clean', 'snatch',
  'pull-up', 'chin-up', 'dip', 'lunge', 'hip thrust', 'leg press'
]

/**
 * Checks if an exercise is a heavy multi-joint compound movement requiring higher rest floors.
 */
export function isCompoundLift(exerciseName: string): boolean {
  if (isOlympicWeightExercise(exerciseName)) return true
  const lower = exerciseName.toLowerCase()
  return COMPOUND_KEYWORDS.some(kw => lower.includes(kw))
}

/**
 * Checks if an exercise is a hammer curl variant subject to strict neutral grip guardrail.
 */
export function isHammerCurlMovement(exerciseName: string): boolean {
  return exerciseName.toLowerCase().includes('hammer curl')
}

/**
 * Calculates bio-adaptive rest interval based on athlete set performance.
 */
export function calculateBioAdaptiveRestInterval(input: BioAdaptiveRestInput): BioAdaptiveRestResult {
  const {
    exerciseName,
    baseRestSeconds,
    rpe,
    rir,
    isWarmup = false,
    optPhase = 3,
    isCompound = isCompoundLift(exerciseName),
    autoAdaptiveEnabled = true,
    hasAcuteFatigueDrop = false,
    acuteFatigueDropPercent = 0,
    velocityLossPercent = 0,
  } = input

  const base = Math.max(10, baseRestSeconds || 60)
  const isHammer = isHammerCurlMovement(exerciseName)

  // If warm-up, disabled, or rapid transition (< 30s), preserve base rest
  if (isWarmup || !autoAdaptiveEnabled || base < 30) {
    return {
      baseRestSeconds: base,
      finalRestSeconds: base,
      deltaSeconds: 0,
      isBioPaced: false,
      pacingAction: 'preserved_optimal',
      badgeText: base < 30 ? 'Transition Rest' : 'Standard Rest',
      adaptationReason: base < 30
        ? 'Rapid superset transition interval preserved.'
        : 'Preserving scheduled baseline rest interval.',
      coachVoiceCue: base < 30
        ? `Starting ${base} second transition.`
        : `Starting ${base} second rest interval.`,
      isHammerCurl: isHammer,
    }
  }

  // Resolve normalized RPE and RIR
  const effectiveRpe = normalizeRpeValue(rpe ?? (rir !== undefined && rir !== null ? 10 - Number(rir) : 7.5))
  const effectiveRir = rir !== undefined && rir !== null
    ? normalizeRirValue(rir)
    : mapRpeToRir(effectiveRpe)

  let delta = 0
  let action: BioAdaptiveRestResult['pacingAction'] = 'preserved_optimal'
  let badgeText = 'Optimal Cadence'
  let reason = 'Set performed in ideal target RIR window; preserving baseline rest.'
  let voiceNotice = ''

  // Priority 1: Acute Intra-Set Fatigue Drop (>15% rep degradation or >20% velocity loss)
  const hasAcuteDrop = hasAcuteFatigueDrop || acuteFatigueDropPercent >= 15 || velocityLossPercent >= 20
  if (hasAcuteDrop) {
    delta = isCompound ? 40 : 25
    action = 'extended_acute_fatigue'
    const pctTag = acuteFatigueDropPercent > 0 ? `${acuteFatigueDropPercent}% drop` : `${velocityLossPercent}% velocity loss`
    badgeText = `+${delta}s (Acute Fatigue)`
    reason = `Acute fatigue detected (${pctTag}). Extended rest by +${delta}s for phosphagen (ATP-CP) resynthesis.`
    voiceNotice = `Acute fatigue detected. Bio-Pacer added ${delta} seconds to restore muscular phosphagens.`
  } else if (effectiveRir === 0 || effectiveRpe >= 9.8) {
    // Involuntary Failure (RIR 0) -> +30s to +45s
    delta = isCompound ? 45 : 30
    action = 'extended_failure'
    badgeText = `+${delta}s (RIR 0 Failure)`
    reason = `Involuntary failure reached (RIR 0). Extended rest by +${delta}s for complete phosphagen (ATP-CP) resynthesis.`
    voiceNotice = `Involuntary failure detected. Bio-Pacer added ${delta} seconds for central nervous system recovery.`
  } else if (effectiveRir <= 1.0 || effectiveRpe >= 9.0) {
    // High Neuromuscular Strain (RIR 0.5 - 1.0) -> +20s to +30s
    delta = isCompound ? 30 : 20
    action = 'extended_strain'
    badgeText = `+${delta}s (High Strain)`
    reason = `High mechanical strain (RIR ${effectiveRir}). Extended rest by +${delta}s to safeguard subsequent set velocity.`
    voiceNotice = `High strain detected. Rest extended by ${delta} seconds to preserve bar velocity.`
  } else if (effectiveRir >= 4.0 || effectiveRpe <= 6.0) {
    // High Reserve / Easy Set -> -15s density acceleration (if base > 45s)
    if (base >= 60) {
      delta = -15
      action = 'accelerated_density'
      badgeText = `−15s (Density Acceleration)`
      reason = `High reps in reserve (RIR ${effectiveRir}). Accelerated rest by 15s to enhance metabolic work capacity.`
      voiceNotice = `High reserve noted. Accelerating rest interval by 15 seconds.`
    }
  } else if (effectiveRir >= 3.0 && base >= 90 && optPhase <= 2) {
    // Phase 1/2 Endurance Pacing
    delta = -10
    action = 'accelerated_density'
    badgeText = `−10s (Endurance Pacing)`
    reason = `Moderate exertion in Phase ${optPhase}. Trimmed 10s to challenge aerobic/local muscular density.`
    voiceNotice = `Trimmed 10 seconds to challenge muscular density.`
  }

  // Calculate final clamped rest interval
  const minFloor = isCompound ? 45 : 30
  const maxCeiling = isCompound ? 300 : 180
  const finalRestSeconds = Math.max(minFloor, Math.min(maxCeiling, base + delta))
  const actualDelta = finalRestSeconds - base

  const cue = voiceNotice
    ? `${voiceNotice} Starting ${finalRestSeconds} second rest.`
    : `Starting ${finalRestSeconds} second rest interval.`

  return {
    baseRestSeconds: base,
    finalRestSeconds,
    deltaSeconds: actualDelta,
    isBioPaced: actualDelta !== 0,
    pacingAction: action,
    badgeText,
    adaptationReason: reason,
    coachVoiceCue: cue,
    isHammerCurl: isHammer,
  }
}
