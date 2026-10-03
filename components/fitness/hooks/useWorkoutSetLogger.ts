'use client'

import { useState, useMemo, useCallback } from 'react'
import { calculate1Rm } from '@/lib/progressive-overload-engine'
import { triggerHaptic, enqueueOfflineSet } from '@/lib/offline-sync-queue'
import { playPrecisionTone } from '@/lib/web-audio-cadence-engine'
import { speakCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import { isStrengthExercise } from '@/lib/exercise-logging-helpers'

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
}

export interface InlineSetDraft {
  sessionDate: string
  setNumber: string
  reps: string
  weight: string
  tempo?: string
  restSeconds: string
  rpe: string
  rir: string
  isWarmup: boolean
  notes: string
}

export interface SetCelebrationPr {
  exerciseName: string
  weightLbs: number
  reps: number
  oneRmLbs: number
  diffLbs?: number
}

function normalizeExerciseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function exerciseDraftKey(day: number, exerciseName: string): string {
  return `${day}-${exerciseName}`
}

function workoutDayTag(day: number): string {
  return `[day:${day}]`
}

function extractWorkoutDayTag(notes?: string | null): number | null {
  if (!notes) return null
  const match = notes.match(/\[day:(\d+)\]/)
  return match ? parseInt(match[1], 10) : null
}

function parseSetTarget(sets: string | number | null | undefined): number {
  if (typeof sets === 'number') return sets
  if (!sets) return 3
  const str = String(sets).trim()
  const rangeMatch = str.match(/^(\d+)\s*-\s*(\d+)$/)
  if (rangeMatch) return parseInt(rangeMatch[2], 10)
  const single = parseInt(str, 10)
  return Number.isFinite(single) && single > 0 ? single : 3
}

export function useWorkoutSetLogger(
  initialSetLogs: WorkoutSetLogRecord[] = [],
  units: 'metric' | 'imperial' = 'imperial',
  optPhase = 1,
  onStatusChange?: (msg: string | null) => void,
  onStartRestTimer?: (exerciseName: string, key: string, seconds: number) => void
) {
  const [localSetLogs, setLocalSetLogs] = useState<WorkoutSetLogRecord[]>(initialSetLogs)
  const [inlineSetDrafts, setInlineSetDrafts] = useState<Record<string, InlineSetDraft>>({})
  const [celebrationPr, setCelebrationPr] = useState<SetCelebrationPr | null>(null)
  const [busySetKey, setBusySetKey] = useState<string | null>(null)

  const setLogsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSetLogRecord[]>()
    for (const row of localSetLogs) {
      const key = normalizeExerciseName(row.exercise_name)
      const current = map.get(key) ?? []
      current.push(row)
      map.set(key, current)
    }
    return map
  }, [localSetLogs])

  const progression = useMemo(() => {
    const byDate = new Map<string, { volume: number; sets: number; avgRpe: number; rpeCount: number }>()

    for (const row of localSetLogs) {
      const key = row.session_date
      const current = byDate.get(key) ?? { volume: 0, sets: 0, avgRpe: 0, rpeCount: 0 }
      const volume = Number(row.reps ?? 0) * Number(row.weight_kg ?? 0)
      current.volume += Number.isFinite(volume) ? volume : 0
      current.sets += 1

      const rpe = Number(row.rpe)
      if (Number.isFinite(rpe) && rpe > 0) {
        current.avgRpe += rpe
        current.rpeCount += 1
      }

      byDate.set(key, current)
    }

    const points = [...byDate.entries()]
      .map(([date, value]) => ({
        date,
        volume: Math.round(value.volume * 100) / 100,
        sets: value.sets,
        avgRpe: value.rpeCount > 0 ? Math.round((value.avgRpe / value.rpeCount) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalSets = localSetLogs.length
    const totalReps = localSetLogs.reduce((sum, row) => sum + Number(row.reps ?? 0), 0)
    const totalVolumeKg = localSetLogs.reduce((sum, row) => sum + Number(row.reps ?? 0) * Number(row.weight_kg ?? 0), 0)
    const rpeRows = localSetLogs.filter(row => Number(row.rpe ?? 0) > 0)
    const avgRpe = rpeRows.length > 0
      ? rpeRows.reduce((sum, row) => sum + Number(row.rpe ?? 0), 0) / rpeRows.length
      : 0

    return {
      points,
      totalSets,
      totalReps,
      totalVolumeKg: Math.round(totalVolumeKg),
      avgRpe: Number.isFinite(avgRpe) ? Math.round(avgRpe * 10) / 10 : 0,
    }
  }, [localSetLogs])

  const updateDraft = useCallback((key: string, patch: Partial<InlineSetDraft>) => {
    setInlineSetDrafts(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          sessionDate: new Date().toISOString().split('T')[0],
          setNumber: '1',
          reps: '10',
          weight: '135',
          restSeconds: '60',
          rpe: '',
          rir: '',
          isWarmup: false,
          notes: '',
        }),
        ...patch,
      },
    }))
  }, [])

  const logWorkoutSet = useCallback(
    async (
      workoutDay: number,
      exercise: { name: string; sets?: string; reps?: string; tempo?: string | null; rest?: string | null; block?: string | null },
      customDraft?: Partial<InlineSetDraft>
    ) => {
      const key = exerciseDraftKey(workoutDay, exercise.name)
      const existingDraft = inlineSetDrafts[key] || {}
      const currentDraft: InlineSetDraft = {
        sessionDate: customDraft?.sessionDate || existingDraft.sessionDate || new Date().toISOString().split('T')[0],
        setNumber: customDraft?.setNumber || existingDraft.setNumber || '1',
        reps: customDraft?.reps || existingDraft.reps || exercise.reps || '10',
        weight: customDraft?.weight || existingDraft.weight || '135',
        restSeconds: customDraft?.restSeconds || existingDraft.restSeconds || '60',
        rpe: customDraft?.rpe || existingDraft.rpe || '',
        rir: customDraft?.rir || existingDraft.rir || '',
        isWarmup: customDraft?.isWarmup !== undefined ? customDraft.isWarmup : Boolean(existingDraft.isWarmup),
        notes: customDraft?.notes || existingDraft.notes || '',
      }

      const movementCard = getNasmClinicalMovementCard(exercise.name)
      const isStrength = isStrengthExercise(exercise.name, exercise.block, exercise.reps)
      const effectiveTempo = isStrength ? (exercise.tempo || movementCard.tempo || (optPhase === 1 ? '4/2/1' : '2/0/2')) : ''

      const weightVal = Number(currentDraft.weight)
      const weightKg = Number.isFinite(weightVal) && weightVal > 0
        ? (units === 'imperial' ? weightVal * 0.45359237 : weightVal)
        : undefined

      const parsedRest = Number(currentDraft.restSeconds) || 60
      const restSecsToSave = parsedRest > 0 ? parsedRest : 60

      triggerHaptic('success')
      playPrecisionTone({ freq: 659.25, duration: 0.22, type: 'triangle' })
      speakCoachVoiceCue(`Set ${currentDraft.setNumber} saved. Starting ${restSecsToSave} second rest.`)

      onStartRestTimer?.(exercise.name, key, restSecsToSave)

      // Optimistic append
      const optimisticId = `temp_set_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const optimisticRecord: WorkoutSetLogRecord = {
        id: optimisticId,
        session_date: currentDraft.sessionDate,
        exercise_name: exercise.name,
        set_number: Number(currentDraft.setNumber),
        reps: Number(currentDraft.reps),
        weight_kg: weightKg,
        rest_seconds: restSecsToSave,
        rpe: currentDraft.rpe ? Number(currentDraft.rpe) : undefined,
        rir: currentDraft.rir ? Number(currentDraft.rir) : undefined,
        is_warmup: currentDraft.isWarmup,
        notes: `${workoutDayTag(workoutDay)} ${currentDraft.notes}`.trim() || undefined,
      }

      setLocalSetLogs(prev => [optimisticRecord, ...prev])

      // PR Check
      const loggedReps = Number(currentDraft.reps) || 0
      const loggedWeight = Number(currentDraft.weight) || 0
      const weightLbs = units === 'imperial' ? loggedWeight : loggedWeight * 2.20462

      if (loggedReps > 0 && weightLbs > 0 && !currentDraft.isWarmup) {
        const oneRm = calculate1Rm(weightLbs, loggedReps)
        const prevLogs = setLogsByExercise.get(normalizeExerciseName(exercise.name)) ?? []
        const prevMax1Rm = prevLogs.reduce((max, log) => {
          const w = (log.weight_kg ?? 0) * 2.20462
          const r = log.reps ?? 0
          const calc = calculate1Rm(w, r)
          return Math.max(max, calc.average1RmLbs)
        }, 0)

        const diff = prevMax1Rm > 0 ? Math.round(oneRm.average1RmLbs - prevMax1Rm) : 0

        // Record is silently saved to telemetry and archived in dossier; no pop-ups, fanfare, or confetti
        if (oneRm.average1RmLbs > prevMax1Rm && prevMax1Rm > 0) {
          onStatusChange?.(`NEW 1RM PERSONAL RECORD for ${exercise.name}: ${units === 'imperial' ? `${oneRm.average1RmLbs} lbs` : `${oneRm.average1RmKg} kg`} (+${diff} lbs)!`)
        } else {
          onStatusChange?.(`✓ Logged ${exercise.name} (${loggedReps} reps @ ${loggedWeight} ${units === 'imperial' ? 'lb' : 'kg'}).`)
        }
      }

      // Async persistence
      setBusySetKey(key)
      try {
        const payload = {
          sessionDate: currentDraft.sessionDate,
          exerciseName: exercise.name,
          setNumber: Number(currentDraft.setNumber),
          reps: Number(currentDraft.reps),
          weightKg,
          restSeconds: restSecsToSave,
          rpe: currentDraft.rpe ? Number(currentDraft.rpe) : undefined,
          rir: currentDraft.rir ? Number(currentDraft.rir) : undefined,
          isWarmup: currentDraft.isWarmup,
          tempo: effectiveTempo || undefined,
          notes: `${workoutDayTag(workoutDay)} ${currentDraft.notes}`.trim() || undefined,
        }

        const res = await fetch('/api/workouts/log-set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          enqueueOfflineSet({
            sessionDate: currentDraft.sessionDate,
            exerciseName: exercise.name,
            setNumber: Number(currentDraft.setNumber),
            reps: Number(currentDraft.reps),
            weightKg,
            restSeconds: restSecsToSave,
            rpe: currentDraft.rpe ? Number(currentDraft.rpe) : undefined,
            rir: currentDraft.rir ? Number(currentDraft.rir) : undefined,
            isWarmup: currentDraft.isWarmup,
            tempo: effectiveTempo || undefined,
            notes: `${workoutDayTag(workoutDay)} ${currentDraft.notes}`.trim() || undefined,
          })
        } else {
          const json = await res.json()
          if (json.record?.id) {
            setLocalSetLogs(prev => prev.map(l => l.id === optimisticId ? json.record : l))
          }
        }
      } catch {
        enqueueOfflineSet({
          sessionDate: currentDraft.sessionDate,
          exerciseName: exercise.name,
          setNumber: Number(currentDraft.setNumber),
          reps: Number(currentDraft.reps),
          weightKg,
        })
      } finally {
        setBusySetKey(null)
      }

      // Auto-increment set number
      updateDraft(key, {
        setNumber: String(Number(currentDraft.setNumber) + 1),
      })
    },
    [inlineSetDrafts, optPhase, units, onStartRestTimer, setLogsByExercise, onStatusChange, updateDraft]
  )

  return {
    localSetLogs,
    setLocalSetLogs,
    inlineSetDrafts,
    setInlineSetDrafts,
    updateDraft,
    logWorkoutSet,
    setLogsByExercise,
    progression,
    celebrationPr,
    setCelebrationPr,
    busySetKey,
    extractWorkoutDayTag,
    parseSetTarget,
  }
}
