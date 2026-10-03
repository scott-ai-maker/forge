'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  useLiveWorkoutSessionTimer,
  type WorkoutDaySummary,
} from './useLiveWorkoutSessionTimer'
import {
  useExerciseRestTimer,
  type ActiveRestState,
} from './useExerciseRestTimer'
import {
  useStaticStretchHoldTimer,
  type ActiveHoldTimerState,
} from './useStaticStretchHoldTimer'
import {
  requestScreenWakeLock,
  releaseScreenWakeLock,
} from '@/lib/screen-wake-lock'
import type { RestAudioMetronomeMode } from '@/lib/rest-timer-audio-hr-engine'

export type WorkoutStage = 'strength' | 'cardio' | 'cooldown' | 'idle'

export interface UseTrackerTimerOptions {
  planWorkouts?: WorkoutDaySummary[]
  isGymSession?: boolean
  onStatusChange?: (msg: string | null) => void
  onCompleteHold?: (exerciseKey: string, targetSeconds: number) => void
}

export interface UseTrackerTimerReturn {
  // Live Session Timer
  elapsedWorkoutSeconds: number
  isWorkoutTimerActive: boolean
  activeWorkoutSessionDay: number | null
  activeWorkoutStage: WorkoutStage
  handleStartWorkoutSession: (day: number) => void
  handleStartStrengthSession: (day: number, launchShortcut?: boolean) => void
  handleStartCardioSession: (day: number, modality?: string, launchShortcut?: boolean) => void
  handlePauseResumeWorkoutSession: () => void
  handleStopWorkoutSession: () => void
  setElapsedWorkoutSeconds: React.Dispatch<React.SetStateAction<number>>
  setActiveWorkoutStage: React.Dispatch<React.SetStateAction<WorkoutStage>>
  setIsWorkoutTimerActive: React.Dispatch<React.SetStateAction<boolean>>
  setActiveWorkoutSessionDay: React.Dispatch<React.SetStateAction<number | null>>

  // Rest Timer
  activeRestState: ActiveRestState | null
  setActiveRestState: React.Dispatch<React.SetStateAction<ActiveRestState | null>>
  isRestRunning: boolean
  startRestTimer: (exerciseName: string, key: string, seconds: number) => void
  cancelRestTimer: () => void
  adjustRestTimer: (deltaSeconds: number) => void
  startRestWithKey: (exerciseName: string, key: string, seconds: number) => void
  soundMetronomeEnabled: boolean
  setSoundMetronomeEnabled: React.Dispatch<React.SetStateAction<boolean>>
  soundMetronomeMode: RestAudioMetronomeMode
  setSoundMetronomeMode: React.Dispatch<React.SetStateAction<RestAudioMetronomeMode>>

  // Hold Timer
  activeHoldTimer: ActiveHoldTimerState | null
  setActiveHoldTimer: React.Dispatch<React.SetStateAction<ActiveHoldTimerState | null>>
  startHoldTimer: (
    exerciseKey: string,
    exerciseName: string,
    targetSeconds: number,
    type?: 'stretch' | 'foam'
  ) => void
  cancelHoldTimer: () => void

  // Dock & In-Card helpers
  activeRestTimerKey: string | null
  setActiveRestTimerKey: React.Dispatch<React.SetStateAction<string | null>>
  handleTimerDone: () => void
  handleAddRestSeconds: (seconds: number) => void
  handleTogglePauseRest: () => void
  handleCompleteRest: () => void
  handleToggleSoundMetronome: () => void

  // Screen Wake Lock
  isWakeLockActive: boolean
  setIsWakeLockActive: React.Dispatch<React.SetStateAction<boolean>>
}

export function shouldActivateScreenWakeLock(
  isGymSession: boolean,
  isWorkoutTimerActive: boolean,
  hasActiveDay: boolean
): boolean {
  return isGymSession || isWorkoutTimerActive || hasActiveDay
}

export function formatTrackerElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const mm = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')
  const ss = (safe % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export function adjustRestStateTime(
  current: ActiveRestState | null,
  deltaSeconds: number
): ActiveRestState | null {
  if (!current) return null
  const nextRemaining = Math.max(0, current.remainingSeconds + deltaSeconds)
  return {
    ...current,
    remainingSeconds: nextRemaining,
    restSeconds: Math.max(current.restSeconds, nextRemaining),
  }
}

/**
 * useTrackerTimer
 * Coordinates workout elapsed session timer, bio-adaptive rest interval countdowns,
 * static stretch & foam roll hold timers, audio cadence metronomes, and gym floor wake-lock.
 */
export function useTrackerTimer({
  planWorkouts = [],
  isGymSession = false,
  onStatusChange,
  onCompleteHold,
}: UseTrackerTimerOptions = {}): UseTrackerTimerReturn {
  // 1. Live Session Timer
  const sessionTimer = useLiveWorkoutSessionTimer({
    planWorkouts,
    onStatusChange,
  })

  // 2. Rest Timer & Audio Metronome
  const restTimer = useExerciseRestTimer()

  // 3. Static Stretch & Foam Rolling Cadence Hold Timer
  const holdTimer = useStaticStretchHoldTimer({
    onCompleteHold,
  })

  // 4. Screen Wake Lock State
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false)

  // 5. Active Rest Timer Key (for inline exercise card highlighting)
  const [activeRestTimerKey, setActiveRestTimerKey] = useState<string | null>(null)

  const handleTimerDone = useCallback(() => {
    setActiveRestTimerKey(null)
  }, [])

  // 6. Automatic Screen Wake Lock Management
  useEffect(() => {
    const shouldWake = shouldActivateScreenWakeLock(
      isGymSession,
      sessionTimer.isWorkoutTimerActive,
      sessionTimer.activeWorkoutSessionDay !== null
    )

    if (shouldWake) {
      void requestScreenWakeLock().then(acquired => {
        setIsWakeLockActive(acquired)
      })
    } else {
      void releaseScreenWakeLock()
      setIsWakeLockActive(false)
    }

    return () => {
      void releaseScreenWakeLock()
    }
  }, [
    isGymSession,
    sessionTimer.isWorkoutTimerActive,
    sessionTimer.activeWorkoutSessionDay,
  ])

  // 7. Ergonomic Dock Helpers
  const handleAddRestSeconds = useCallback(
    (seconds: number) => {
      restTimer.setActiveRestState(prev => adjustRestStateTime(prev, seconds))
    },
    [restTimer]
  )

  const handleTogglePauseRest = useCallback(() => {
    restTimer.setActiveRestState(prev =>
      prev ? { ...prev, isRunning: !prev.isRunning } : null
    )
  }, [restTimer])

  const handleCompleteRest = useCallback(() => {
    restTimer.cancelRestTimer()
    setActiveRestTimerKey(null)
  }, [restTimer])

  const handleToggleSoundMetronome = useCallback(() => {
    restTimer.setSoundMetronomeEnabled(prev => !prev)
  }, [restTimer])

  const startRestWithKey = useCallback(
    (exerciseName: string, key: string, seconds: number) => {
      setActiveRestTimerKey(key)
      restTimer.startRestTimer(exerciseName, key, seconds)
    },
    [restTimer]
  )

  return {
    // Session Timer
    elapsedWorkoutSeconds: sessionTimer.elapsedWorkoutSeconds,
    isWorkoutTimerActive: sessionTimer.isWorkoutTimerActive,
    activeWorkoutSessionDay: sessionTimer.activeWorkoutSessionDay,
    activeWorkoutStage: sessionTimer.activeWorkoutStage,
    handleStartWorkoutSession: sessionTimer.handleStartWorkoutSession,
    handleStartStrengthSession: sessionTimer.handleStartStrengthSession,
    handleStartCardioSession: sessionTimer.handleStartCardioSession,
    handlePauseResumeWorkoutSession: sessionTimer.handlePauseResumeWorkoutSession,
    handleStopWorkoutSession: sessionTimer.handleStopWorkoutSession,
    setElapsedWorkoutSeconds: sessionTimer.setElapsedWorkoutSeconds,
    setActiveWorkoutStage: sessionTimer.setActiveWorkoutStage,
    setIsWorkoutTimerActive: sessionTimer.setIsWorkoutTimerActive,
    setActiveWorkoutSessionDay: sessionTimer.setActiveWorkoutSessionDay,

    // Rest Timer
    activeRestState: restTimer.activeRestState,
    setActiveRestState: restTimer.setActiveRestState,
    isRestRunning: restTimer.isRestRunning,
    startRestTimer: restTimer.startRestTimer,
    cancelRestTimer: restTimer.cancelRestTimer,
    adjustRestTimer: restTimer.adjustRestTimer,
    startRestWithKey,
    soundMetronomeEnabled: restTimer.soundMetronomeEnabled,
    setSoundMetronomeEnabled: restTimer.setSoundMetronomeEnabled,
    soundMetronomeMode: restTimer.soundMetronomeMode,
    setSoundMetronomeMode: restTimer.setSoundMetronomeMode,

    // Hold Timer
    activeHoldTimer: holdTimer.activeHoldTimer,
    setActiveHoldTimer: holdTimer.setActiveHoldTimer,
    startHoldTimer: holdTimer.startHoldTimer,
    cancelHoldTimer: holdTimer.cancelHoldTimer,

    // Dock & In-Card helpers
    activeRestTimerKey,
    setActiveRestTimerKey,
    handleTimerDone,
    handleAddRestSeconds,
    handleTogglePauseRest,
    handleCompleteRest,
    handleToggleSoundMetronome,

    // Screen Wake Lock
    isWakeLockActive,
    setIsWakeLockActive,
  }
}
