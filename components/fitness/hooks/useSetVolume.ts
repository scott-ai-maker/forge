'use client'

import { useMemo, useCallback } from 'react'
import { calculateAcwrFromWorkoutLogs } from '@/lib/coach-triage'
import { extractWorkoutDayTag, filterSetLogsForMicrocycleWeek } from '@/lib/fitness'
import { isCardioPseudoExercise } from '@/lib/workout-duration-engine'

export interface WorkoutSetLogRecord {
  id: string
  session_date: string
  exercise_name: string
  set_number?: number
  reps: number
  weight_kg?: number
  rest_seconds?: number
  rpe?: number
  rir?: number
  is_warmup?: boolean
  notes?: string | null
  created_at?: string
  workout_log_id?: string | null
}

export interface WorkoutLogRecord {
  id: string
  session_title: string
  session_date: string
  exertion_rpe?: number
  completed?: boolean
  notes?: string | null
  workout_plan_id?: string | null
}

export interface WorkoutExerciseInfo {
  name: string
  sets: string
  reps: string
  tempo?: string | null
  rest?: string | null
  notes?: string | null
}

export interface WorkoutDayPlanInfo {
  day: number
  focus: string
  exercises: WorkoutExerciseInfo[]
}

export interface ProgressionPoint {
  date: string
  volume: number
  sets: number
  avgRpe: number
}

export interface ProgressionSummary {
  points: ProgressionPoint[]
  totalSets: number
  totalReps: number
  totalVolumeKg: number
  avgRpe: number
}

export interface WorkoutDayProgress {
  targetSets: number
  loggedSets: number
  totalReps: number
  totalVolumeKg: number
}

export interface ExerciseVolumeSummary {
  exerciseName: string
  totalVolumeKg: number
  totalVolumeLbs: number
  totalReps: number
  workingSetsCount: number
  allSetsCount: number
}

export interface DayVolumeSummary {
  workoutDay: number
  totalVolumeKg: number
  totalVolumeLbs: number
  loggedSets: number
  totalReps: number
}

export interface UseSetVolumeOptions {
  localSetLogs: WorkoutSetLogRecord[]
  localWorkoutLogs: WorkoutLogRecord[]
  planWorkouts?: WorkoutDayPlanInfo[]
  units?: 'metric' | 'imperial'
  currentWeek?: number
  sessionsPerWeek?: number
}

export function normalizeExerciseName(name: string): string {
  return String(name ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function parseSetTarget(value: string | null | undefined): number {
  const text = String(value ?? '').trim()
  if (!text) return 0

  const rangeMatch = text.match(/(\d+)\s*[-to]{1,3}\s*(\d+)/i)
  if (rangeMatch) {
    return Number(rangeMatch[2])
  }

  const firstNumberMatch = text.match(/\d+/)
  if (!firstNumberMatch) return 0

  return Number(firstNumberMatch[0])
}

export function formatVolumeDisplay(volumeKg: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    const lbs = Math.round(volumeKg * 2.20462)
    return `${lbs.toLocaleString()} lbs`
  }
  const kg = Math.round(volumeKg)
  return `${kg.toLocaleString()} kg`
}

export function resolveEffectiveSetRpe(row: { rpe?: number | null; rir?: number | null }): number {
  const rpe = Number(row.rpe)
  if (Number.isFinite(rpe) && rpe > 0) return rpe
  if (row.rir !== undefined && row.rir !== null && String(row.rir).trim() !== '') {
    const rir = Number(row.rir)
    if (Number.isFinite(rir) && rir >= 0 && rir <= 10) {
      return Math.max(1, Math.min(10, Math.round((10 - rir) * 10) / 10))
    }
  }
  return 0
}

export function resolveEffectiveSetWeightKg(row: { weight_kg?: number | null; weight_lbs?: number | null }): number {
  const kg = Number(row.weight_kg)
  if (Number.isFinite(kg) && kg > 0) return kg
  const lbs = Number(row.weight_lbs)
  if (Number.isFinite(lbs) && lbs > 0) return lbs * 0.45359237
  return 0
}

export function computeExerciseProgression(
  setLogs: WorkoutSetLogRecord[],
  workoutLogs: WorkoutLogRecord[] = []
): ProgressionSummary {
  const byDate = new Map<
    string,
    { volume: number; sets: number; avgRpe: number; rpeCount: number }
  >()

  let totalSets = 0
  let totalReps = 0
  let totalVolumeKg = 0
  let totalRpeSum = 0
  let totalRpeCount = 0

  for (const row of setLogs) {
    const key = String(row.session_date || row.created_at || '').slice(0, 10)
    if (!key) continue
    const current = byDate.get(key) ?? {
      volume: 0,
      sets: 0,
      avgRpe: 0,
      rpeCount: 0,
    }
    const reps = Number(row.reps ?? 0)
    const weightKg = resolveEffectiveSetWeightKg(row as { weight_kg?: number | null; weight_lbs?: number | null })
    const volume = reps * weightKg
    current.volume += Number.isFinite(volume) ? volume : 0
    current.sets += 1

    totalSets += 1
    if (Number.isFinite(reps) && reps > 0) {
      totalReps += reps
    }
    if (Number.isFinite(volume) && volume > 0) {
      totalVolumeKg += volume
    }

    const rpe = resolveEffectiveSetRpe(row)
    if (rpe > 0) {
      current.avgRpe += rpe
      current.rpeCount += 1
      totalRpeSum += rpe
      totalRpeCount += 1
    }

    byDate.set(key, current)
  }

  // Incorporate session-level workout_logs RPE and dates when set-level RPE or date is absent
  for (const log of workoutLogs) {
    if (log.completed === false) continue
    const key = String(log.session_date || '').slice(0, 10)
    if (!key) continue
    const current = byDate.get(key) ?? {
      volume: 0,
      sets: 0,
      avgRpe: 0,
      rpeCount: 0,
    }
    const sessionRpe = Number(log.exertion_rpe)
    if (Number.isFinite(sessionRpe) && sessionRpe > 0 && current.rpeCount === 0) {
      current.avgRpe += sessionRpe
      current.rpeCount += 1
      totalRpeSum += sessionRpe
      totalRpeCount += 1
    }
    byDate.set(key, current)
  }

  const points: ProgressionPoint[] = [...byDate.entries()]
    .map(([date, value]) => ({
      date,
      volume: Math.round(value.volume * 100) / 100,
      sets: value.sets,
      avgRpe:
        value.rpeCount > 0
          ? Math.round((value.avgRpe / value.rpeCount) * 10) / 10
          : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const avgRpe =
    totalRpeCount > 0
      ? totalRpeSum / totalRpeCount
      : 0

  return {
    points,
    totalSets,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg),
    avgRpe: Number.isFinite(avgRpe) ? Math.round(avgRpe * 10) / 10 : 0,
  }
}

export function computeWorkoutProgressByDay(
  planWorkouts: WorkoutDayPlanInfo[],
  setLogsByExercise: Map<string, WorkoutSetLogRecord[]>
): Map<number, WorkoutDayProgress> {
  const map = new Map<number, WorkoutDayProgress>()

  for (const workout of planWorkouts) {
    const metric: WorkoutDayProgress = {
      targetSets: 0,
      loggedSets: 0,
      totalReps: 0,
      totalVolumeKg: 0,
    }

    for (const exercise of workout.exercises) {
      if (isCardioPseudoExercise(exercise.name)) continue
      metric.targetSets += parseSetTarget(exercise.sets)

      const logsForExercise = (
        setLogsByExercise.get(normalizeExerciseName(exercise.name)) ?? []
      ).filter(row => extractWorkoutDayTag(row.notes) === workout.day)

      metric.loggedSets += logsForExercise.length
      metric.totalReps += logsForExercise.reduce(
        (sum, row) => sum + Number(row.reps ?? 0),
        0
      )
      metric.totalVolumeKg += logsForExercise.reduce(
        (sum, row) =>
          sum + Number(row.reps ?? 0) * Number(row.weight_kg ?? 0),
        0
      )
    }

    map.set(workout.day, metric)
  }

  return map
}

export function computeExerciseVolume(
  setLogs: WorkoutSetLogRecord[],
  exerciseName: string,
  workoutDay?: number
): ExerciseVolumeSummary {
  const normalizedTarget = normalizeExerciseName(exerciseName)
  const logs = setLogs.filter(
    row =>
      normalizeExerciseName(row.exercise_name) === normalizedTarget &&
      (typeof workoutDay === 'number' ? extractWorkoutDayTag(row.notes) === workoutDay : true)
  )

  const totalReps = logs.reduce((sum, s) => sum + Number(s.reps || 0), 0)
  const totalVolumeKg = logs.reduce(
    (sum, s) => sum + Number(s.reps || 0) * Number(s.weight_kg || 0),
    0
  )
  const workingSetsCount = logs.filter(s => !s.is_warmup).length

  return {
    exerciseName,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalVolumeLbs: Math.round(totalVolumeKg * 2.20462),
    totalReps,
    workingSetsCount,
    allSetsCount: logs.length,
  }
}

/**
 * useSetVolume
 * Centralizes volume aggregation, progression telemetry, set progress by day,
 * and acute-to-chronic workload (ACWR) calculations.
 */
export function useSetVolume({
  localSetLogs,
  localWorkoutLogs,
  planWorkouts = [],
  units = 'imperial',
  currentWeek = 1,
  sessionsPerWeek = 4,
}: UseSetVolumeOptions) {
  // 1. Filter set logs strictly for the active microcycle week
  const activeSetLogs = useMemo(() => {
    return filterSetLogsForMicrocycleWeek({
      setLogs: localSetLogs,
      workoutLogs: localWorkoutLogs,
      currentWeek,
      sessionsPerWeek,
    })
  }, [localSetLogs, localWorkoutLogs, currentWeek, sessionsPerWeek])

  // 2. Group active microcycle set logs by normalized exercise name (for active workout card progress & SetProgressionMatrix)
  const setLogsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSetLogRecord[]>()

    for (const row of activeSetLogs) {
      const key = normalizeExerciseName(row.exercise_name)
      const current = map.get(key) ?? []
      current.push(row)
      map.set(key, current)
    }

    return map
  }, [activeSetLogs])

  // 3. Group ALL historical set logs by normalized exercise name (for PR vault & 1-tap prefill history)
  const allSetLogsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSetLogRecord[]>()

    for (const row of localSetLogs) {
      const key = normalizeExerciseName(row.exercise_name)
      const current = map.get(key) ?? []
      current.push(row)
      map.set(key, current)
    }

    return map
  }, [localSetLogs])

  // 4. Track target sets vs logged sets and volume per planned workout day in the active microcycle week
  const workoutProgressByDay = useMemo(() => {
    return computeWorkoutProgressByDay(planWorkouts, setLogsByExercise)
  }, [planWorkouts, setLogsByExercise])

  // 3. Historical volume and RPE progression by session date
  const progression: ProgressionSummary = useMemo(() => {
    return computeExerciseProgression(localSetLogs, localWorkoutLogs)
  }, [localSetLogs, localWorkoutLogs])

  // 4. Acute-to-Chronic Workload Ratio (ACWR) Telemetry
  const acwrTelemetry = useMemo(() => {
    return calculateAcwrFromWorkoutLogs(localWorkoutLogs, localSetLogs)
  }, [localWorkoutLogs, localSetLogs])

  // 5. Volume formatting and specific drill-down helpers
  const formatVolume = useCallback(
    (volumeKg: number): string => {
      return formatVolumeDisplay(volumeKg, units)
    },
    [units]
  )

  const getExerciseVolume = useCallback(
    (exerciseName: string, workoutDay?: number): ExerciseVolumeSummary => {
      return computeExerciseVolume(localSetLogs, exerciseName, workoutDay)
    },
    [localSetLogs]
  )

  const getDayVolume = useCallback(
    (workoutDay: number): DayVolumeSummary => {
      const progress = workoutProgressByDay.get(workoutDay)
      if (progress) {
        return {
          workoutDay,
          totalVolumeKg: Math.round(progress.totalVolumeKg),
          totalVolumeLbs: Math.round(progress.totalVolumeKg * 2.20462),
          loggedSets: progress.loggedSets,
          totalReps: progress.totalReps,
        }
      }

      const dayLogs = activeSetLogs.filter(
        set => extractWorkoutDayTag(set.notes) === workoutDay
      )
      const totalVolumeKg = dayLogs.reduce(
        (sum, s) => sum + Number(s.weight_kg || 0) * Number(s.reps || 0),
        0
      )
      const totalReps = dayLogs.reduce((sum, s) => sum + Number(s.reps || 0), 0)

      return {
        workoutDay,
        totalVolumeKg: Math.round(totalVolumeKg),
        totalVolumeLbs: Math.round(totalVolumeKg * 2.20462),
        loggedSets: dayLogs.length,
        totalReps,
      }
    },
    [workoutProgressByDay, activeSetLogs]
  )

  const getRecentExerciseLogs = useCallback(
    (exerciseName: string, workoutDay?: number, limit = 3): WorkoutSetLogRecord[] => {
      const logs = (setLogsByExercise.get(normalizeExerciseName(exerciseName)) ?? []).filter(
        row => (typeof workoutDay === 'number' ? extractWorkoutDayTag(row.notes) === workoutDay : true)
      )
      return logs.slice(0, limit)
    },
    [setLogsByExercise]
  )

  return {
    activeSetLogs,
    allSetLogsByExercise,
    setLogsByExercise,
    workoutProgressByDay,
    progression,
    acwrTelemetry,
    formatVolume,
    getExerciseVolume,
    getDayVolume,
    getRecentExerciseLogs,
    normalizeExerciseName,
    parseSetTarget,
  }
}
