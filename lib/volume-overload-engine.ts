/**
 * Gordon Athletic Advisory — Volume & Progressive Overload Science Engine
 * 
 * Computes live session mechanical volume (tonnage), historical overload deltas,
 * set-by-set fatigue degradation curves, and evaluates official NASM 2-for-2 progression criteria.
 */

import { calculate1Rm, evaluate2For2Progression, OverloadEvaluation } from './progressive-overload-engine'

export interface HistoricalSetLogInput {
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
  is_warmup?: boolean
  isWarmup?: boolean
}

export interface SetTelemetry {
  setNumber: number
  weight: number
  reps: number
  weightLbs: number
  volume: number
  estimated1RmLbs: number
  estimated1RmKg: number
  fatigueDropoffPct: number
  isWarmup: boolean
}

export type FatigueStatus = 'pristine' | 'optimal' | 'elevated'

export interface VolumeOverloadSummary {
  currentSessionVolume: number
  currentSessionSetsCount: number
  currentSessionRepsCount: number
  currentSessionWorkingVolume: number
  previousSessionVolume: number | null
  previousSessionDate: string | null
  volumeDelta: number | null
  volumeDeltaPct: number | null
  peakEstimated1RmLbs: number
  currentFatiguePct: number
  fatigueStatus: FatigueStatus
  fatigueGuidance: string
  nasm2For2: OverloadEvaluation
  setsTrajectory: SetTelemetry[]
}

/**
 * Normalizes an exercise name key for matching across historical logs
 */
export function normalizeExerciseKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Extracts weight in lbs from a set record
 */
function extractWeightLbs(item: HistoricalSetLogInput): number {
  if (item.weightLbs && item.weightLbs > 0) return item.weightLbs
  const kg = item.weight_kg ?? item.weightKg ?? 0
  if (kg > 0) return Math.round(kg * 2.20462 * 10) / 10
  return 0
}

/**
 * Computes complete live volume, tonnage, overload comparison, and fatigue curve
 */
export function computeVolumeOverloadTelemetry(params: {
  exerciseName: string
  targetRepsText?: string | null
  currentSessionDate: string
  allExerciseLogs: HistoricalSetLogInput[]
  preferredUnits?: 'imperial' | 'metric'
}): VolumeOverloadSummary {
  const {
    exerciseName,
    targetRepsText,
    currentSessionDate,
    allExerciseLogs,
    preferredUnits = 'imperial',
  } = params

  const normKey = normalizeExerciseKey(exerciseName)
  const relevantLogs = allExerciseLogs.filter(log => {
    const name = log.exercise_name || log.exerciseName || ''
    return normalizeExerciseKey(name) === normKey
  })

  // Group by session date
  const logsByDate = new Map<string, HistoricalSetLogInput[]>()
  for (const log of relevantLogs) {
    const date = log.session_date || log.sessionDate || currentSessionDate
    const list = logsByDate.get(date) ?? []
    list.push(log)
    logsByDate.set(date, list)
  }

  // Current session logs
  const currentLogs = logsByDate.get(currentSessionDate) ?? []

  // Prior dates sorted descending (most recent first)
  const priorDates = [...logsByDate.keys()]
    .filter(d => d !== currentSessionDate)
    .sort((a, b) => b.localeCompare(a))

  const prevDate = priorDates[0] ?? null
  const prevLogs = prevDate ? (logsByDate.get(prevDate) ?? []) : []

  // Compute set-by-set telemetry for current session
  let peak1RmLbs = 0
  const workingSets: SetTelemetry[] = []
  const allSetTelemetries: SetTelemetry[] = []

  let totalVolume = 0
  let workingVolume = 0
  let totalReps = 0

  currentLogs.forEach((log, idx) => {
    const isWarm = Boolean(log.is_warmup || log.isWarmup)
    const weightLbs = extractWeightLbs(log)
    const reps = Number(log.reps) || 0
    const displayWeight = preferredUnits === 'imperial'
      ? weightLbs
      : (log.weight_kg ?? log.weightKg ?? Math.round((weightLbs / 2.20462) * 10) / 10)

    const setVol = displayWeight * reps
    totalVolume += setVol
    totalReps += reps

    const oneRm = calculate1Rm(weightLbs, reps)
    const est1RmLbs = isWarm ? 0 : oneRm.average1RmLbs

    if (!isWarm && est1RmLbs > peak1RmLbs) {
      peak1RmLbs = est1RmLbs
    }

    const telemetry: SetTelemetry = {
      setNumber: idx + 1,
      weight: displayWeight,
      reps,
      weightLbs,
      volume: Math.round(setVol * 10) / 10,
      estimated1RmLbs: est1RmLbs,
      estimated1RmKg: Math.round((est1RmLbs / 2.20462) * 10) / 10,
      fatigueDropoffPct: 0,
      isWarmup: isWarm,
    }

    allSetTelemetries.push(telemetry)
    if (!isWarm) {
      workingVolume += setVol
      workingSets.push(telemetry)
    }
  })

  // Calculate fatigue dropoff relative to peak working set
  let currentFatiguePct = 0
  if (peak1RmLbs > 0 && workingSets.length > 0) {
    allSetTelemetries.forEach(set => {
      if (!set.isWarmup && set.estimated1RmLbs > 0) {
        const drop = Math.round(((peak1RmLbs - set.estimated1RmLbs) / peak1RmLbs) * 1000) / 10
        set.fatigueDropoffPct = Math.max(0, drop)
      }
    })

    const latestWorkingSet = workingSets[workingSets.length - 1]
    currentFatiguePct = latestWorkingSet.fatigueDropoffPct
  }

  // Determine fatigue status
  let fatigueStatus: FatigueStatus = 'pristine'
  let fatigueGuidance = 'Pristine velocity & recruitment. Full neurological readiness.'

  if (currentFatiguePct >= 10.0) {
    fatigueStatus = 'elevated'
    fatigueGuidance = 'Elevated neuromuscular fatigue (>10% drop-off). Conclude working sets to avoid compensatory pattern distortion.'
  } else if (currentFatiguePct >= 5.0) {
    fatigueStatus = 'optimal'
    fatigueGuidance = 'Optimal hypertrophic stimulus (5–10% drop-off). High motor unit recruitment with safe velocity retention.'
  }

  // Compute previous session volume
  let previousSessionVolume: number | null = null
  let volumeDelta: number | null = null
  let volumeDeltaPct: number | null = null

  if (prevLogs.length > 0) {
    const prevVol = prevLogs.reduce((sum, log) => {
      const wLbs = extractWeightLbs(log)
      const r = Number(log.reps) || 0
      const dW = preferredUnits === 'imperial'
        ? wLbs
        : (log.weight_kg ?? log.weightKg ?? Math.round((wLbs / 2.20462) * 10) / 10)
      return sum + (dW * r)
    }, 0)

    previousSessionVolume = Math.round(prevVol * 10) / 10
    volumeDelta = Math.round((totalVolume - prevVol) * 10) / 10
    if (prevVol > 0) {
      volumeDeltaPct = Math.round(((totalVolume - prevVol) / prevVol) * 1000) / 10
    }
  }

  // Evaluate NASM 2-for-2 Progression
  const targetReps = parseInt(String(targetRepsText || '10').replace(/[^0-9]/g, ''), 10) || 10

  // Format prior sessions for 2-for-2 evaluation
  const chronologicalDates = [...logsByDate.keys()].sort((a, b) => a.localeCompare(b))
  const lastTwoSessionsData: Array<{ date: string; finalSetWeightLbs: number; finalSetReps: number }> = []

  for (const d of chronologicalDates.slice(-2)) {
    const sets = (logsByDate.get(d) ?? []).filter(s => !s.is_warmup && !s.isWarmup)
    if (sets.length > 0) {
      const finalSet = sets[sets.length - 1]
      lastTwoSessionsData.push({
        date: d,
        finalSetWeightLbs: extractWeightLbs(finalSet),
        finalSetReps: Number(finalSet.reps) || 0,
      })
    }
  }

  const nasm2For2 = evaluate2For2Progression(exerciseName, targetReps, lastTwoSessionsData)

  return {
    currentSessionVolume: Math.round(totalVolume * 10) / 10,
    currentSessionSetsCount: currentLogs.length,
    currentSessionRepsCount: totalReps,
    currentSessionWorkingVolume: Math.round(workingVolume * 10) / 10,
    previousSessionVolume,
    previousSessionDate: prevDate,
    volumeDelta,
    volumeDeltaPct,
    peakEstimated1RmLbs: Math.round(peak1RmLbs),
    currentFatiguePct,
    fatigueStatus,
    fatigueGuidance,
    nasm2For2,
    setsTrajectory: allSetTelemetries,
  }
}
