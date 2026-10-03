'use client'

import { useState, useCallback, useMemo } from 'react'
import type { ExerciseLibraryRecord } from '@/lib/coach-programs'

export interface BuilderExercise {
  id: string
  libraryExerciseId: string
  name: string
  block: string
  sets: string
  reps: string
  tempo: string
  rest: string
  notes: string
  description: string
  primaryEquipment: string[]
  imageUrl: string
  videoUrl: string
}

export interface BuilderWorkoutDay {
  id: string
  day: number
  focus: string
  scheduledDate: string
  notes: string
  exercises: BuilderExercise[]
}

export interface PlanDiffSummary {
  changedDays: number
  changedFocuses: number
  changedDayNotes: number
  addedExercises: number
  removedExercises: number
  changedExerciseDetails: number
  totalChanges: number
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function toBuilderExercise(exercise?: Partial<BuilderExercise>): BuilderExercise {
  return {
    id: exercise?.id || uid(),
    libraryExerciseId: String(exercise?.libraryExerciseId ?? '').trim(),
    name: String(exercise?.name ?? '').trim(),
    block: String(exercise?.block ?? '').trim(),
    sets: String(exercise?.sets ?? '3').trim(),
    reps: String(exercise?.reps ?? '10').trim(),
    tempo: String(exercise?.tempo ?? '').trim(),
    rest: String(exercise?.rest ?? '').trim(),
    notes: String(exercise?.notes ?? '').trim(),
    description: String(exercise?.description ?? '').trim(),
    primaryEquipment: Array.isArray(exercise?.primaryEquipment) ? exercise.primaryEquipment.filter(Boolean) : [],
    imageUrl: String(exercise?.imageUrl ?? '').trim(),
    videoUrl: String(exercise?.videoUrl ?? '').trim(),
  }
}

export function createBlankExercise(): BuilderExercise {
  return toBuilderExercise()
}

export function toBuilderDay(day?: Partial<BuilderWorkoutDay>, fallbackDay = 1): BuilderWorkoutDay {
  return {
    id: day?.id || uid(),
    day: Number(day?.day) || fallbackDay,
    focus: String(day?.focus ?? '').trim(),
    scheduledDate: String(day?.scheduledDate ?? '').trim(),
    notes: String(day?.notes ?? '').trim(),
    exercises: Array.isArray(day?.exercises) && day.exercises.length > 0
      ? day.exercises.map(exercise => toBuilderExercise(exercise))
      : [createBlankExercise()],
  }
}

export function summarizePlanDiff(baselineDays: BuilderWorkoutDay[], currentDays: BuilderWorkoutDay[]): PlanDiffSummary {
  let changedDays = Math.max(currentDays.length - baselineDays.length, 0)
  let changedFocuses = 0
  let changedDayNotes = 0
  let addedExercises = 0
  let removedExercises = 0
  let changedExerciseDetails = 0

  const comparableDayCount = Math.min(baselineDays.length, currentDays.length)

  for (let dayIndex = 0; dayIndex < comparableDayCount; dayIndex += 1) {
    const baseDay = baselineDays[dayIndex]
    const currentDay = currentDays[dayIndex]

    const baseFocus = String(baseDay.focus ?? '').trim()
    const currentFocus = String(currentDay.focus ?? '').trim()
    if (baseFocus !== currentFocus) changedFocuses += 1

    const baseNotes = String(baseDay.notes ?? '').trim()
    const currentNotes = String(currentDay.notes ?? '').trim()
    if (baseNotes !== currentNotes) changedDayNotes += 1

    const baseExercises = baseDay.exercises
    const currentExercises = currentDay.exercises

    if (currentExercises.length > baseExercises.length) {
      addedExercises += currentExercises.length - baseExercises.length
    } else if (baseExercises.length > currentExercises.length) {
      removedExercises += baseExercises.length - currentExercises.length
    }

    const comparableExerciseCount = Math.min(baseExercises.length, currentExercises.length)
    for (let exerciseIndex = 0; exerciseIndex < comparableExerciseCount; exerciseIndex += 1) {
      const baseEx = baseExercises[exerciseIndex]
      const currentEx = currentExercises[exerciseIndex]

      const isSame =
        baseEx.name === currentEx.name &&
        baseEx.sets === currentEx.sets &&
        baseEx.reps === currentEx.reps &&
        baseEx.tempo === currentEx.tempo &&
        baseEx.rest === currentEx.rest &&
        baseEx.notes === currentEx.notes

      if (!isSame) changedExerciseDetails += 1
    }
  }

  if (baselineDays.length > currentDays.length) {
    changedDays += baselineDays.length - currentDays.length
  }

  const totalChanges = changedDays + changedFocuses + changedDayNotes + addedExercises + removedExercises + changedExerciseDetails

  return {
    changedDays,
    changedFocuses,
    changedDayNotes,
    addedExercises,
    removedExercises,
    changedExerciseDetails,
    totalChanges,
  }
}

export function useCoachProgramEditor(initialDays: BuilderWorkoutDay[] = []) {
  const [days, setDays] = useState<BuilderWorkoutDay[]>(initialDays)
  const [baselineDays, setBaselineDays] = useState<BuilderWorkoutDay[]>(initialDays)

  const diffSummary = useMemo(() => {
    return summarizePlanDiff(baselineDays, days)
  }, [baselineDays, days])

  const setInitialState = useCallback((newDays: BuilderWorkoutDay[]) => {
    setDays(newDays)
    setBaselineDays(newDays)
  }, [])

  const addDay = useCallback(() => {
    setDays(prev => [
      ...prev,
      toBuilderDay({ day: prev.length + 1, focus: `Day ${prev.length + 1}` }, prev.length + 1),
    ])
  }, [])

  const removeDay = useCallback((dayId: string) => {
    setDays(prev => {
      const filtered = prev.filter(d => d.id !== dayId)
      return filtered.map((d, idx) => ({ ...d, day: idx + 1 }))
    })
  }, [])

  const updateDayFocus = useCallback((dayId: string, focus: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, focus } : d))
  }, [])

  const updateDayNotes = useCallback((dayId: string, notes: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, notes } : d))
  }, [])

  const updateDayScheduledDate = useCallback((dayId: string, scheduledDate: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, scheduledDate } : d))
  }, [])

  const addExercise = useCallback((dayId: string) => {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      return {
        ...d,
        exercises: [...d.exercises, createBlankExercise()],
      }
    }))
  }, [])

  const removeExercise = useCallback((dayId: string, exerciseId: string) => {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      const filtered = d.exercises.filter(e => e.id !== exerciseId)
      return {
        ...d,
        exercises: filtered.length > 0 ? filtered : [createBlankExercise()],
      }
    }))
  }, [])

  const updateExercise = useCallback((dayId: string, exerciseId: string, patch: Partial<BuilderExercise>) => {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      return {
        ...d,
        exercises: d.exercises.map(e => e.id === exerciseId ? { ...e, ...patch } : e),
      }
    }))
  }, [])

  const applyExerciseFromLibrary = useCallback((dayId: string, exerciseId: string, record: ExerciseLibraryRecord) => {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      return {
        ...d,
        exercises: d.exercises.map(e => {
          if (e.id !== exerciseId) return e
          return {
            ...e,
            libraryExerciseId: record.id,
            name: record.name,
            block: e.block || 'Resistance',
            description: record.description || e.description || '',
            primaryEquipment: (record.primary_equipment?.filter(Boolean) as string[]) || e.primaryEquipment || [],
            imageUrl: record.media_image_url || e.imageUrl || '',
            videoUrl: record.media_video_url || e.videoUrl || '',
          }
        }),
      }
    }))
  }, [])

  return {
    days,
    setDays,
    baselineDays,
    setBaselineDays,
    setInitialState,
    diffSummary,
    addDay,
    removeDay,
    updateDayFocus,
    updateDayNotes,
    updateDayScheduledDate,
    addExercise,
    removeExercise,
    updateExercise,
    applyExerciseFromLibrary,
  }
}
