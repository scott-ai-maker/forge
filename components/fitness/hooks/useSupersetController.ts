'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  isSupersetOfferedForPhase,
  getNasmOptPhaseFeatureRules,
  type NasmPhaseFeatureRules,
} from '@/lib/nasm-opt-feature-matrix'
import {
  detectAndGroupSupersets,
  type GroupedExerciseEntry,
  type SupersetPair,
  type ExerciseItemInfo,
} from '@/lib/superset-pairing-engine'

export interface UseSupersetControllerOptions {
  nasmOptPhase?: number | null
  initialEnabled?: boolean
  onStatusChange?: (msg: string | null) => void
}

export interface UseSupersetControllerReturn {
  // Gating & State
  enableSupersets: boolean
  setEnableSupersets: React.Dispatch<React.SetStateAction<boolean>>
  isSupersetOffered: boolean
  phaseFeatureRules: NasmPhaseFeatureRules
  toggleSupersets: () => void

  // Exercise grouping
  groupWorkoutExercises: (exercises: ExerciseItemInfo[]) => GroupedExerciseEntry[]

  // Active sub-exercise ('A' | 'B') per superset pair
  activeSubExercises: Record<string, 'A' | 'B'>
  getActiveSub: (pairId: string) => 'A' | 'B'
  toggleSub: (pairId: string) => void
  setSub: (pairId: string, sub: 'A' | 'B') => void
}

export function computeSupersetGrouping(
  exercises: ExerciseItemInfo[],
  enableSupersets: boolean,
  nasmOptPhase?: number | null
): GroupedExerciseEntry[] {
  const effectivePhase = typeof nasmOptPhase === 'number' && nasmOptPhase > 0 ? nasmOptPhase : 2
  const isOffered = isSupersetOfferedForPhase(effectivePhase)

  if (enableSupersets && isOffered) {
    return detectAndGroupSupersets(exercises, effectivePhase)
  }

  return exercises.map((exercise, index) => ({
    isSuperset: false as const,
    exercise,
    originalIndex: index,
  }))
}

export function validateSupersetToggle(
  currentEnabled: boolean,
  nasmOptPhase?: number | null
): { allowed: boolean; nextState: boolean; message: string } {
  const effectivePhase = typeof nasmOptPhase === 'number' && nasmOptPhase > 0 ? nasmOptPhase : 2
  const isOffered = isSupersetOfferedForPhase(effectivePhase)
  const rules = getNasmOptPhaseFeatureRules(effectivePhase)

  if (!isOffered) {
    return {
      allowed: false,
      nextState: false,
      message: `Supersets are not prescribed in Phase ${effectivePhase} (${rules.phaseName}).`,
    }
  }

  const nextState = !currentEnabled
  return {
    allowed: true,
    nextState,
    message: nextState
      ? `Supersets enabled for Phase ${effectivePhase} (${rules.phaseName}).`
      : 'Supersets disabled. Showing sequential single exercise progression.',
  }
}

/**
 * useSupersetController
 * Governs superset availability, automatic NASM OPT Phase pairing,
 * manual toggle overrides with sports science guardrails, and sub-exercise toggles.
 */
export function useSupersetController({
  nasmOptPhase,
  initialEnabled = false,
  onStatusChange,
}: UseSupersetControllerOptions = {}): UseSupersetControllerReturn {
  const effectivePhase = typeof nasmOptPhase === 'number' && nasmOptPhase > 0 ? nasmOptPhase : 2
  const isSupersetOffered = useMemo(() => isSupersetOfferedForPhase(effectivePhase), [effectivePhase])
  const phaseFeatureRules = useMemo(() => getNasmOptPhaseFeatureRules(effectivePhase), [effectivePhase])

  // Strictly default to false unless explicitly offered and configured
  const [enableSupersets, setEnableSupersets] = useState<boolean>(
    Boolean(initialEnabled && isSupersetOffered)
  )

  const [activeSubExercises, setActiveSubExercises] = useState<Record<string, 'A' | 'B'>>({})

  // Toggle supersets with phase guardrails
  const toggleSupersets = useCallback(() => {
    const check = validateSupersetToggle(enableSupersets, effectivePhase)
    if (!check.allowed) {
      onStatusChange?.(check.message)
      setEnableSupersets(false)
      return
    }

    setEnableSupersets(check.nextState)
    onStatusChange?.(check.message)
  }, [enableSupersets, effectivePhase, onStatusChange])

  // Group workout exercises based on superset activation
  const groupWorkoutExercises = useCallback(
    (exercises: ExerciseItemInfo[]): GroupedExerciseEntry[] => {
      return computeSupersetGrouping(exercises, enableSupersets, effectivePhase)
    },
    [enableSupersets, effectivePhase]
  )

  const getActiveSub = useCallback(
    (pairId: string): 'A' | 'B' => {
      return activeSubExercises[pairId] || 'A'
    },
    [activeSubExercises]
  )

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

  return {
    enableSupersets,
    setEnableSupersets,
    isSupersetOffered,
    phaseFeatureRules,
    toggleSupersets,
    groupWorkoutExercises,
    activeSubExercises,
    getActiveSub,
    toggleSub,
    setSub,
  }
}
