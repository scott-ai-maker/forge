/**
 * Personal Record (PR) & 1RM Telemetry Engine
 * 
 * Accurately tracks all-time estimated 1-Rep Max (1RM) records,
 * detects real-time PR breakthroughs during live workout logging,
 * and generates progressive overload trajectory history.
 */

import { calculate1Rm } from './progressive-overload-engine'

export interface HistoricalSetEntry {
  id?: string
  exercise_name?: string
  exerciseName?: string
  weight_kg?: number | null
  weightKg?: number | null
  weightLbs?: number | null
  reps?: string | number | null
  rpe?: string | number | null
  session_date?: string
  sessionDate?: string
  created_at?: string
  is_warmup?: boolean
  isWarmup?: boolean
}

export interface PersonalRecord {
  exerciseNormalizedName: string
  exerciseDisplayName: string
  allTimeBest1RmLbs: number
  allTimeBest1RmKg: number
  bestSetWeightLbs: number
  bestSetWeightKg: number
  bestSetReps: number
  achievedDate: string
  totalSetsLogged: number
  progressionCurve: Array<{
    date: string
    estimated1RmLbs: number
    estimated1RmKg: number
    weightLbs: number
    reps: number
  }>
}

export interface PrDetectionResult {
  isNewPr: boolean
  isFirstRecord: boolean
  exerciseName: string
  previousBest1RmLbs: number
  previousBest1RmKg: number
  new1RmLbs: number
  new1RmKg: number
  deltaLbs: number
  percentageIncrease: number
  loggedWeightLbs: number
  loggedReps: number
}

export function normalizeExerciseNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Extracts weight in lbs from a set log
 */
export function extractWeightLbs(item: HistoricalSetEntry): number {
  if (item.weightLbs && item.weightLbs > 0) {
    return item.weightLbs
  }
  const kg = item.weight_kg ?? item.weightKg ?? 0
  if (kg > 0) {
    return Math.round(kg * 2.20462 * 10) / 10
  }
  return 0
}

/**
 * Evaluates whether a freshly logged set achieves a new all-time 1RM Personal Record.
 */
export function detectPersonalRecord(
  currentSet: {
    exerciseName: string
    weightLbs: number
    reps: number
    isWarmup?: boolean
  },
  priorHistory: HistoricalSetEntry[]
): PrDetectionResult {
  const normTarget = normalizeExerciseNameKey(currentSet.exerciseName)

  // Filter history for this exercise and exclude warmup sets
  const relevantSets = priorHistory.filter(s => {
    const sName = s.exercise_name || s.exerciseName || ''
    const isWarmup = Boolean(s.is_warmup || s.isWarmup)
    return normalizeExerciseNameKey(sName) === normTarget && !isWarmup
  })

  // Sanitize weight to prevent floating-point artifacts from unit conversions
  const cleanWeightLbs = Math.round(currentSet.weightLbs * 100) / 100

  // Compute current set's estimated 1RM
  const current1Rm = calculate1Rm(cleanWeightLbs, currentSet.reps)
  const current1RmLbs = current1Rm.average1RmLbs
  const current1RmKg = current1Rm.average1RmKg

  // If warm-up or invalid weight/reps, no PR
  if (currentSet.isWarmup || cleanWeightLbs <= 0 || currentSet.reps <= 0) {
    return {
      isNewPr: false,
      isFirstRecord: false,
      exerciseName: currentSet.exerciseName,
      previousBest1RmLbs: 0,
      previousBest1RmKg: 0,
      new1RmLbs: 0,
      new1RmKg: 0,
      deltaLbs: 0,
      percentageIncrease: 0,
      loggedWeightLbs: cleanWeightLbs,
      loggedReps: currentSet.reps,
    }
  }

  // Find all-time previous best 1RM
  let previousBest1RmLbs = 0
  for (const s of relevantSets) {
    const wLbs = extractWeightLbs(s)
    const reps = Number(s.reps) || 0
    if (wLbs > 0 && reps > 0) {
      const res = calculate1Rm(wLbs, reps)
      if (res.average1RmLbs > previousBest1RmLbs) {
        previousBest1RmLbs = res.average1RmLbs
      }
    }
  }

  const previousBest1RmKg = Math.round((previousBest1RmLbs / 2.20462) * 10) / 10

  // First time logging this movement
  if (previousBest1RmLbs === 0 && relevantSets.length === 0) {
    return {
      isNewPr: true,
      isFirstRecord: true,
      exerciseName: currentSet.exerciseName,
      previousBest1RmLbs: 0,
      previousBest1RmKg: 0,
      new1RmLbs: current1RmLbs,
      new1RmKg: current1RmKg,
      deltaLbs: current1RmLbs,
      percentageIncrease: 100,
      loggedWeightLbs: cleanWeightLbs,
      loggedReps: currentSet.reps,
    }
  }

  // Check if exceeds previous best
  const isNewPr = current1RmLbs > previousBest1RmLbs
  const deltaLbs = isNewPr ? Math.round(current1RmLbs - previousBest1RmLbs) : 0
  const percentageIncrease = previousBest1RmLbs > 0 && isNewPr
    ? Math.round(((current1RmLbs - previousBest1RmLbs) / previousBest1RmLbs) * 1000) / 10
    : 0

  return {
    isNewPr,
    isFirstRecord: false,
    exerciseName: currentSet.exerciseName,
    previousBest1RmLbs,
    previousBest1RmKg,
    new1RmLbs: current1RmLbs,
    new1RmKg: current1RmKg,
    deltaLbs,
    percentageIncrease,
    loggedWeightLbs: cleanWeightLbs,
    loggedReps: currentSet.reps,
  }
}

/**
 * Builds an all-time Personal Record Vault mapped by normalized exercise name.
 */
export function computeExercisePrVault(
  allLogs: HistoricalSetEntry[]
): Map<string, PersonalRecord> {
  const vault = new Map<string, PersonalRecord>()

  // Sort logs chronologically if date available
  const sortedLogs = [...allLogs].sort((a, b) => {
    const dateA = a.session_date || a.sessionDate || a.created_at || ''
    const dateB = b.session_date || b.sessionDate || b.created_at || ''
    return dateA.localeCompare(dateB)
  })

  for (const log of sortedLogs) {
    const isWarmup = Boolean(log.is_warmup || log.isWarmup)
    if (isWarmup) continue

    const name = log.exercise_name || log.exerciseName || ''
    if (!name) continue

    const normKey = normalizeExerciseNameKey(name)
    const weightLbs = extractWeightLbs(log)
    const reps = Number(log.reps) || 0
    const date = log.session_date || log.sessionDate || log.created_at?.slice(0, 10) || 'Session'

    if (weightLbs <= 0 || reps <= 0) continue

    const calc = calculate1Rm(weightLbs, reps)
    const est1RmLbs = calc.average1RmLbs
    const est1RmKg = calc.average1RmKg

    let existing = vault.get(normKey)

    if (!existing) {
      existing = {
        exerciseNormalizedName: normKey,
        exerciseDisplayName: name,
        allTimeBest1RmLbs: est1RmLbs,
        allTimeBest1RmKg: est1RmKg,
        bestSetWeightLbs: weightLbs,
        bestSetWeightKg: Math.round((weightLbs / 2.20462) * 10) / 10,
        bestSetReps: reps,
        achievedDate: date,
        totalSetsLogged: 1,
        progressionCurve: [{
          date,
          estimated1RmLbs: est1RmLbs,
          estimated1RmKg: est1RmKg,
          weightLbs,
          reps,
        }],
      }
      vault.set(normKey, existing)
    } else {
      existing.totalSetsLogged += 1
      existing.progressionCurve.push({
        date,
        estimated1RmLbs: est1RmLbs,
        estimated1RmKg: est1RmKg,
        weightLbs,
        reps,
      })

      if (est1RmLbs > existing.allTimeBest1RmLbs) {
        existing.allTimeBest1RmLbs = est1RmLbs
        existing.allTimeBest1RmKg = est1RmKg
        existing.bestSetWeightLbs = weightLbs
        existing.bestSetWeightKg = Math.round((weightLbs / 2.20462) * 10) / 10
        existing.bestSetReps = reps
        existing.achievedDate = date
      }
    }
  }

  return vault
}
