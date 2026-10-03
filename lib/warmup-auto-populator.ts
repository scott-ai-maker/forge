/**
 * Gordon Athletic Advisory — Warm-Up to Working Set Weight Auto-Populator Engine
 * 
 * Automatically transitions the athlete from kinetic warm-up ramp-up sets to their
 * primary working sets. Upon logging the final warm-up ramp stage (or via 1-tap manual trigger),
 * this engine pre-populates:
 * 1. Target working weight (rounded to gym equipment standards)
 * 2. Prescribed working reps (parsed from exercise prescriptions like "8-12" or "3-5")
 * 3. Working Set 1 configuration (clearing warm-up flags and resetting notes)
 * 4. Audio coach voice announcement cues
 * 5. Strict neutral hammer curl biomechanical guardrails
 */

import { isHammerCurlMovement } from './bio-adaptive-rest-pacer'

export interface WarmUpAutoPopulateInput {
  exerciseName: string
  targetWorkingWeightLbs: number
  units: 'imperial' | 'metric'
  completedStageNumber: number
  totalStages: number
  prescribedReps?: string | number | null
  currentWorkingSetNumber?: number
}

export interface WarmUpAutoPopulateResult {
  shouldAutoPopulate: boolean
  workingWeight: string
  workingWeightNumber: number
  workingReps: string
  workingSetNumber: string
  bannerNotice: string
  coachVoiceCue: string
  isHammerCurl: boolean
  guardrailNote?: string
}

/**
 * Parses prescribed reps string (e.g. "8-12", "3-5", "10", "12-15") into an optimal working rep target.
 */
export function parsePrescribedWorkingReps(repsPrescription?: string | number | null): string {
  if (!repsPrescription) return '8'

  const str = String(repsPrescription).trim()
  if (/^\d+$/.test(str)) return str

  // Range match (e.g. "8-12" or "8 - 12" or "3 to 5")
  const rangeMatch = str.match(/(\d+)\s*(?:[-–—]|to)\s*(\d+)/i)
  if (rangeMatch) {
    const lower = parseInt(rangeMatch[1], 10)
    const upper = parseInt(rangeMatch[2], 10)
    // For heavy/strength ranges (<= 6 reps), prefer lower-mid target
    if (upper <= 6) return String(lower)
    // For hypertrophy/endurance ranges, target the reliable lower boundary to safeguard bar velocity
    return String(lower)
  }

  const numMatch = str.match(/\d+/)
  return numMatch ? numMatch[0] : '8'
}

/**
 * Formats working weight for display and drafting based on units.
 */
export function formatWorkingWeight(weightLbs: number, units: 'imperial' | 'metric'): string {
  const safeLbs = Math.max(0, weightLbs)
  if (units === 'imperial') {
    return String(Math.round(safeLbs * 10) / 10)
  }
  const kg = safeLbs / 2.20462
  // Round to nearest 0.5 kg for metric gym plates
  const roundedKg = Math.round(kg * 2) / 2
  return String(roundedKg)
}

/**
 * Calculates auto-population payload when a warm-up stage is logged or manually triggered.
 */
export function calculateWorkingSetPrePopulateLoad(input: WarmUpAutoPopulateInput): WarmUpAutoPopulateResult {
  const {
    exerciseName,
    targetWorkingWeightLbs,
    units,
    completedStageNumber,
    totalStages,
    prescribedReps,
    currentWorkingSetNumber = 1,
  } = input

  const isFinalStage = totalStages > 0 && completedStageNumber >= totalStages
  const weightStr = formatWorkingWeight(targetWorkingWeightLbs, units)
  const weightNum = Number(weightStr) || 0
  const repsStr = parsePrescribedWorkingReps(prescribedReps)
  const isHammer = isHammerCurlMovement(exerciseName)

  const unitLabel = units === 'imperial' ? 'lb' : 'kg'
  const unitLabelLong = units === 'imperial' ? 'pounds' : 'kilograms'

  let bannerNotice = `Warm-up ramp complete! Set ${currentWorkingSetNumber} armed at ${weightStr} ${unitLabel} for ${repsStr} reps.`
  let coachVoiceCue = `Warm-up complete. Working set loaded at ${weightStr} ${unitLabelLong}.`
  let guardrailNote: string | undefined = undefined

  if (isHammer) {
    guardrailNote = 'STRICT BIOMECHANICAL GUARDRAIL: Dumbbells must remain oriented vertically with thumbs pointed toward the ceiling. Palms strictly facing inward with zero twisting or wrist supination as you load working weight.'
    bannerNotice = `Warm-up complete! Working Set armed at ${weightStr} ${unitLabel}. (Strict Neutral Hammer Grip Mandate Active)`
    coachVoiceCue = `Warm-up complete. Working set loaded at ${weightStr} ${unitLabelLong}. Keep palms strictly facing inward with zero wrist twisting.`
  }

  return {
    shouldAutoPopulate: isFinalStage,
    workingWeight: weightStr,
    workingWeightNumber: weightNum,
    workingReps: repsStr,
    workingSetNumber: String(currentWorkingSetNumber),
    bannerNotice,
    coachVoiceCue,
    isHammerCurl: isHammer,
    guardrailNote,
  }
}
