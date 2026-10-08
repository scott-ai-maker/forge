/**
 * @file workout-duration-engine.ts
 * @description Biomechanically and physiologically accurate workout duration estimation
 * for Forge Athletic & NASM OPT™ periodization models.
 *
 * Properly accounts for:
 * 1. Time under tension (work duration per set based on reps, hold times, and tempo).
 * 2. Prescribed rest intervals (intra-set recovery based on OPT phase and exercise tags).
 * 3. Gym floor transitions between exercises (moving, racking weights, pin adjustments).
 * 4. Progressive warm-up / acclimation ramp sets for heavy multi-joint compound movements.
 * 5. Structured 3-part NASM OPT warm-up (SMR foam rolling, static/active stretching, dynamic prep).
 * 6. Prescribed cardiorespiratory conditioning blocks (Zone 2, tempo, HIIT).
 * 7. Post-session cool-down (static stretching and parasympathetic down-regulation).
 */

import { isCompoundLift } from './bio-adaptive-rest-pacer'
import { isTimedStaticStretch, isFoamRollerExercise, parseHoldDurationSeconds } from './exercise-logging-helpers'

export interface WorkoutDurationExerciseInput {
  name: string
  sets: string | number
  reps: string | number
  tempo?: string | null
  rest?: string | null
  block?: string | null
  primaryEquipment?: string[] | null
}

export interface WorkoutDurationCardioInput {
  durationMins?: number | string | null
  stage?: number | string | null
  modality?: string | null
  targetZone?: string | null
}

export interface WorkoutDurationOptions {
  optPhase?: number
  defaultWarmupMins?: number
  defaultCooldownMins?: number
  interExerciseTransitionSeconds?: number
  compoundRampSetSeconds?: number
}

export interface WorkoutDurationBreakdown {
  warmupMins: number
  resistanceMins: number
  cardioMins: number
  cooldownMins: number
  totalDurationMins: number
  totalWorkingSets: number
  totalExercises: number
  totalRestSeconds: number
  totalWorkSeconds: number
  totalTransitionSeconds: number
  summaryLabel: string
}

/**
 * Returns baseline NASM OPT rest seconds by training phase and section.
 * - Phase 1 (Stabilization Endurance): 60–90 s (default 60s)
 * - Phase 2 (Strength Endurance): 45–60 s (default 45s for superset pairs, 60s otherwise)
 * - Phase 3 (Muscular Development / Hypertrophy): 60–90 s (default 75s)
 * - Phase 4 (Maximal Strength): 180–300 s (default 240s / 4 min)
 * - Phase 5 (Power): 120–240 s (default 180s / 3 min)
 */
export function defaultRestSeconds(phase = 1, section?: string | null): number {
  const s = section ?? ''
  if (s === 'warm-up' || s === 'cool-down') return 0
  if (s === 'activation') return 45
  if (s === 'skill-development') return phase >= 4 ? 60 : 45
  if (s === 'resistance') {
    if (phase === 1) return 60
    if (phase === 2) return 45
    if (phase === 3) return 75
    if (phase === 4) return 240
    if (phase === 5) return 180
  }
  if (s === 'clients-choice') {
    if (phase <= 2) return 45
    if (phase === 3) return 60
    return 240
  }
  if (phase <= 2) return 60
  if (phase === 3) return 75
  return 240
}

/**
 * Parses prescribed rest interval strings (e.g. '60s', '90s', '60-90s', '2-3m', '3-5m', '2m')
 * into exact integer seconds.
 */
export function parseRestSecondsFromExercise(
  restStr?: string | null,
  phase = 1,
  section?: string | null
): number {
  if (!restStr) return defaultRestSeconds(phase, section)
  const clean = String(restStr).trim().toLowerCase()

  // 1. Minute formats like "2-3m", "3-5 min", "2m"
  if (clean.includes('m')) {
    const rangeMatch = clean.match(/(\d+)\s*[-\u2013to]+\s*(\d+)\s*m/i)
    if (rangeMatch) {
      return parseInt(rangeMatch[2], 10) * 60
    }
    const minMatch = clean.match(/(\d+)\s*m/i)
    if (minMatch) {
      return parseInt(minMatch[1], 10) * 60
    }
  }

  // 2. Second ranges like "60-90s", "30-60s", "0-90s"
  const rangeSecMatch = clean.match(/(\d+)\s*[-\u2013to]+\s*(\d+)\s*s?/i)
  if (rangeSecMatch) {
    return parseInt(rangeSecMatch[2], 10)
  }

  // 3. Simple integer digits like "60s" or "90"
  const digitsMatch = clean.match(/\d+/)
  if (digitsMatch) {
    return parseInt(digitsMatch[0], 10)
  }

  return defaultRestSeconds(phase, section)
}

/**
 * Parses numerical sets count from strings like "3", "3-4", "4-5", "1-2".
 * Uses the upper bound of a range so duration estimates never surprise the user.
 */
export function parseSetsCount(sets: string | number | undefined | null): number {
  if (typeof sets === 'number' && Number.isFinite(sets) && sets > 0) return Math.round(sets)
  const str = String(sets ?? '').trim()
  if (!str) return 3

  const rangeMatch = str.match(/(\d+)\s*[-\u2013to/]+\s*(\d+)/)
  if (rangeMatch) {
    const maxVal = parseInt(rangeMatch[2], 10)
    return !isNaN(maxVal) && maxVal > 0 ? maxVal : 3
  }

  const singleMatch = str.match(/\d+/)
  if (singleMatch) {
    const val = parseInt(singleMatch[0], 10)
    return !isNaN(val) && val > 0 ? val : 3
  }

  return 3
}

/**
 * Parses numerical reps count from strings like "10", "8-12", "12-15", "1-5", "15 reps".
 */
export function parseRepsCount(reps: string | number | undefined | null): number {
  if (typeof reps === 'number' && Number.isFinite(reps) && reps > 0) return Math.round(reps)
  const str = String(reps ?? '').trim()
  if (!str) return 10

  const rangeMatch = str.match(/(\d+)\s*[-\u2013to/]+\s*(\d+)/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10)
    const max = parseInt(rangeMatch[2], 10)
    if (!isNaN(min) && !isNaN(max)) {
      return Math.round((min + max) / 2)
    }
  }

  const singleMatch = str.match(/\d+/)
  if (singleMatch) {
    const val = parseInt(singleMatch[0], 10)
    return !isNaN(val) && val > 0 ? val : 10
  }

  return 10
}

/**
 * Resolves rep duration in seconds based on exercise tempo string or NASM OPT phase.
 */
export function resolveRepDurationSeconds(tempo?: string | null, phase = 1): number {
  if (tempo) {
    const clean = tempo.trim().toLowerCase()
    // e.g. "4/2/1" -> 4 + 2 + 1 = 7s
    const parts = clean.split('/')
    if (parts.length === 3) {
      const ecc = parseInt(parts[0], 10)
      const iso = parseInt(parts[1], 10)
      const con = parseInt(parts[2], 10)
      if (!isNaN(ecc) && !isNaN(iso) && !isNaN(con)) {
        return Math.max(2, ecc + iso + con)
      }
    }
    if (clean.includes('slow')) return 5
    if (clean.includes('mod') || clean.includes('medium')) return 4
    if (clean.includes('fast') || clean.includes('explosive') || clean.includes('x')) return 2.5
  }

  // Phase-specific tempo defaults
  switch (phase) {
    case 1:
      return 7 // 4/2/1 Stabilization Endurance
    case 2:
      return 4 // 2/0/2 Strength Endurance
    case 3:
      return 4 // 2/0/2 Muscular Development
    case 4:
      return 3 // Maximal Strength
    case 5:
      return 2.5 // Explosive Power
    default:
      return 4
  }
}

/**
 * Calculates work time in seconds for a single set of an exercise.
 */
export function calculateSingleSetWorkSeconds(
  exercise: WorkoutDurationExerciseInput,
  phase = 1
): number {
  // If timed static hold or foam roll
  if (isTimedStaticStretch(exercise.name, exercise.block, exercise.reps) || isFoamRollerExercise(exercise.name)) {
    return parseHoldDurationSeconds(exercise.reps, 30)
  }

  const reps = parseRepsCount(exercise.reps)
  const repSeconds = resolveRepDurationSeconds(exercise.tempo, phase)
  return Math.max(15, Math.min(100, Math.round(reps * repSeconds)))
}

/**
 * Formats duration in minutes to user-friendly format (e.g. "1h 25m" or "~85 mins").
 */
export function formatDurationDisplay(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes)
  if (rounded < 60) return `${rounded} mins`
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Calculates a comprehensive and realistic workout duration breakdown.
 */
export function calculateEstimatedWorkoutDuration({
  workout,
  cardio,
  optPhase = 1,
  options = {},
}: {
  workout?: {
    exercises?: WorkoutDurationExerciseInput[]
    notes?: string | null
    focus?: string | null
  } | null
  cardio?: WorkoutDurationCardioInput | null
  optPhase?: number
  options?: WorkoutDurationOptions
}): WorkoutDurationBreakdown {
  const allExercises = workout?.exercises || []

  // Classify exercises into blocks
  const warmupExercises = allExercises.filter(ex => ex.block === 'warm-up')
  const cooldownExercises = allExercises.filter(ex => ex.block === 'cool-down')
  const workingExercises = allExercises.filter(ex => ex.block !== 'warm-up' && ex.block !== 'cool-down')

  const phase = options.optPhase ?? optPhase ?? 1
  const transitionSec = options.interExerciseTransitionSeconds ?? 120 // 2.0 mins between distinct exercises
  const compoundRampSec = options.compoundRampSetSeconds ?? 90 // 90s ramp set for primary compound movements

  // 1. Warm-Up duration
  let warmupSeconds = 0
  if (warmupExercises.length > 0) {
    for (const ex of warmupExercises) {
      const sets = parseSetsCount(ex.sets)
      const work = calculateSingleSetWorkSeconds(ex, phase)
      warmupSeconds += sets * work + (sets > 1 ? (sets - 1) * 30 : 0)
    }
    // Add movement prep transition time
    warmupSeconds += Math.max(0, warmupExercises.length - 1) * 45
    // Ensure realistic floor (at least 8 minutes for NASM OPT warm-up)
    warmupSeconds = Math.max(options.defaultWarmupMins ? options.defaultWarmupMins * 60 : 480, warmupSeconds)
  } else {
    // Default 3-part NASM OPT warm-up: SMR (3m) + dynamic stretching (3m) + activation prep (4m) = 10 mins
    warmupSeconds = (options.defaultWarmupMins ?? 10) * 60
  }

  // 2. Resistance / Working Sets duration
  let totalWorkSeconds = 0
  let totalRestSeconds = 0
  let totalWorkingSets = 0
  let totalTransitionSeconds = 0
  let compoundRampsAdded = 0

  for (let i = 0; i < workingExercises.length; i++) {
    const ex = workingExercises[i]
    const sets = parseSetsCount(ex.sets)
    totalWorkingSets += sets

    const singleWorkSec = calculateSingleSetWorkSeconds(ex, phase)
    totalWorkSeconds += sets * singleWorkSec

    // Intra-set rest: for S sets, there are (S - 1) rests between sets of this exercise
    const parsedRest = parseRestSecondsFromExercise(ex.rest, phase, ex.block)
    const isCompound = isCompoundLift(ex.name)

    // Compound movements need at least 75-90s rest in hypertrophy and 180s+ in max strength
    let effectiveRest = parsedRest
    if (isCompound && !ex.rest) {
      if (phase === 3) effectiveRest = Math.max(effectiveRest, 90)
      if (phase === 4) effectiveRest = Math.max(effectiveRest, 240)
      if (phase === 5) effectiveRest = Math.max(effectiveRest, 180)
    }

    if (sets > 1) {
      totalRestSeconds += (sets - 1) * effectiveRest
    }

    // Compound acclimation / ramp-up set on first 2 major compound lifts
    if (isCompound && compoundRampsAdded < 2) {
      totalWorkSeconds += 30
      totalRestSeconds += compoundRampSec
      compoundRampsAdded++
    }

    // Exercise transition: after completing all sets of an exercise, moving to the next
    if (i < workingExercises.length - 1) {
      totalTransitionSeconds += transitionSec
    }
  }

  const resistanceTotalSeconds = totalWorkSeconds + totalRestSeconds + totalTransitionSeconds
  const resistanceMins = Math.round(resistanceTotalSeconds / 60)

  // 3. Cardio duration
  let cardioMins = 0
  if (cardio && cardio.durationMins != null) {
    const parsedCardio = parseInt(String(cardio.durationMins), 10)
    if (!isNaN(parsedCardio) && parsedCardio > 0) {
      cardioMins = parsedCardio
    }
  }

  // 4. Cool-Down duration
  let cooldownSeconds = 0
  if (cooldownExercises.length > 0) {
    for (const ex of cooldownExercises) {
      const sets = parseSetsCount(ex.sets)
      const work = calculateSingleSetWorkSeconds(ex, phase)
      cooldownSeconds += sets * work
    }
    cooldownSeconds = Math.max(options.defaultCooldownMins ? options.defaultCooldownMins * 60 : 300, cooldownSeconds)
  } else {
    // Default static stretching + parasympathetic down-regulation = 6 mins
    cooldownSeconds = (options.defaultCooldownMins ?? 6) * 60
  }

  const warmupMins = Math.round(warmupSeconds / 60)
  const cooldownMins = Math.round(cooldownSeconds / 60)

  // Extra 1.5 min transition between weights and cardio if both are present
  const cardioTransitionSec = workingExercises.length > 0 && cardioMins > 0 ? 90 : 0

  const totalSessionSeconds =
    warmupSeconds +
    resistanceTotalSeconds +
    (cardioMins * 60 + cardioTransitionSec) +
    cooldownSeconds

  const totalDurationMins = Math.round(totalSessionSeconds / 60)

  return {
    warmupMins,
    resistanceMins,
    cardioMins,
    cooldownMins,
    totalDurationMins,
    totalWorkingSets,
    totalExercises: workingExercises.length,
    totalRestSeconds,
    totalWorkSeconds,
    totalTransitionSeconds,
    summaryLabel: formatDurationDisplay(totalDurationMins),
  }
}

