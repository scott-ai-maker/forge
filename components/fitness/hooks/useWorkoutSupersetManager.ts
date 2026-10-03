'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  detectAndGroupSupersets,
  type GroupedExerciseEntry,
  type SupersetPair,
  type ExerciseItemInfo,
} from '@/lib/superset-pairing-engine'

export function useWorkoutSupersetManager(
  exercises: ExerciseItemInfo[] = [],
  optPhase = 2
) {
  const [activeSubExercises, setActiveSubExercises] = useState<Record<string, 'A' | 'B'>>({})
  const [openRamps, setOpenRamps] = useState<Record<string, boolean>>({})

  // Automatically compute superset structure for the current workout
  const groupedEntries: GroupedExerciseEntry[] = useMemo(() => {
    return detectAndGroupSupersets(exercises, optPhase)
  }, [exercises, optPhase])

  const supersetPairs = useMemo(() => {
    return groupedEntries
      .filter((entry): entry is { isSuperset: true; pair: SupersetPair } => entry.isSuperset)
      .map(entry => entry.pair)
  }, [groupedEntries])

  const totalSupersetsFound = supersetPairs.length

  const getActiveSub = useCallback((pairId: string): 'A' | 'B' => {
    return activeSubExercises[pairId] || 'A'
  }, [activeSubExercises])

  const toggleSub = useCallback((pairId: string) => {
    setActiveSubExercises(prev => ({
      ...prev,
      [pairId]: prev[pairId] === 'B' ? 'A' : 'B',
    }))
  }, [])

  const setSub = useCallback((pairId: string, sub: 'A' | 'B') => {
    setActiveSubExercises(prev => ({
      ...prev,
      [pairId]: sub,
    }))
  }, [])

  const toggleRamp = useCallback((rampKey: string) => {
    setOpenRamps(prev => ({
      ...prev,
      [rampKey]: !prev[rampKey],
    }))
  }, [])

  return {
    groupedEntries,
    supersetPairs,
    totalSupersetsFound,
    getActiveSub,
    toggleSub,
    setSub,
    openRamps,
    toggleRamp,
  }
}

