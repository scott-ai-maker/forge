'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { playPrecisionTone } from '@/lib/web-audio-cadence-engine'
import { speakCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import {
  updateLockScreenSessionTelemetry,
  clearLockScreenSessionTelemetry,
} from '@/lib/media-session-telemetry'

export interface WorkoutDaySummary {
  day: number
  focus: string
}

export interface UseLiveWorkoutSessionTimerOptions {
  planWorkouts?: WorkoutDaySummary[]
  onStatusChange?: (msg: string | null) => void
}

export interface UseLiveWorkoutSessionTimerResult {
  elapsedWorkoutSeconds: number
  isWorkoutTimerActive: boolean
  activeWorkoutSessionDay: number | null
  activeWorkoutStage: 'strength' | 'cardio' | 'cooldown' | 'idle'
  handleStartWorkoutSession: (dayNumber: number) => void
  handleStartStrengthSession: (dayNumber: number, launchShortcut?: boolean) => void
  handleStartCardioSession: (dayNumber: number, modality?: string, launchShortcut?: boolean) => void
  handlePauseResumeWorkoutSession: () => void
  handleStopWorkoutSession: () => void
  handleQuitWorkoutSession: () => void
  setElapsedWorkoutSeconds: React.Dispatch<React.SetStateAction<number>>
  setActiveWorkoutStage: React.Dispatch<React.SetStateAction<'strength' | 'cardio' | 'cooldown' | 'idle'>>
  setIsWorkoutTimerActive: React.Dispatch<React.SetStateAction<boolean>>
  setActiveWorkoutSessionDay: React.Dispatch<React.SetStateAction<number | null>>
}

function playCoachChimeTone(freq = 660, duration = 0.22, type: OscillatorType = 'triangle') {
  playPrecisionTone({ freq, duration, type, gainPeak: 0.22 })
}

export interface ActiveSessionStorageData {
  day: number
  elapsedSeconds: number
  isPaused: boolean
  stage: 'strength' | 'cardio' | 'cooldown' | 'idle'
  lastActiveTimestamp?: number
  startedAt?: number
  updatedAt: number
}

export interface RestoredSessionState {
  day: number | null
  elapsedSeconds: number
  isWorkoutTimerActive: boolean
  stage: 'strength' | 'cardio' | 'cooldown' | 'idle'
  shouldClearStorage: boolean
}

/**
 * Parses and restores live workout session state from localStorage.
 * Guarantee: If the session was paused, it restores the exact frozen elapsed seconds
 * and keeps isWorkoutTimerActive = false, never adding elapsed time while paused.
 */
export function restoreSessionFromStorage(
  storedJson: string | null,
  now = Date.now()
): RestoredSessionState {
  if (!storedJson) {
    return {
      day: null,
      elapsedSeconds: 0,
      isWorkoutTimerActive: false,
      stage: 'idle',
      shouldClearStorage: false,
    }
  }

  try {
    const parsed = JSON.parse(storedJson)
    if (!parsed || typeof parsed.day === 'undefined' || parsed.day === null) {
      return {
        day: null,
        elapsedSeconds: 0,
        isWorkoutTimerActive: false,
        stage: 'idle',
        shouldClearStorage: true,
      }
    }

    const dayNumber = Number(parsed.day)
    const baseElapsed = Math.max(0, Number(parsed.elapsedSeconds) || 0)

    if (parsed.isPaused) {
      // Session was explicitly paused before reload/remount:
      // Restore exact elapsed seconds, but STAY PAUSED. Do NOT add any elapsed time!
      return {
        day: dayNumber,
        elapsedSeconds: baseElapsed,
        isWorkoutTimerActive: false,
        stage: (parsed.stage as any) || 'strength',
        shouldClearStorage: false,
      }
    }

    // Session was actively running before reload/remount:
    let additionalSec = 0
    if (parsed.lastActiveTimestamp) {
      additionalSec = Math.floor((now - Number(parsed.lastActiveTimestamp)) / 1000)
    } else if (parsed.startedAt) {
      // Backward compatibility with legacy schema
      additionalSec = Math.floor((now - Number(parsed.startedAt)) / 1000) - baseElapsed
    }

    const totalSec = baseElapsed + Math.max(0, additionalSec)

    // If session is within reasonable 4-hour window, restore running
    if (totalSec >= 0 && totalSec < 4 * 3600) {
      return {
        day: dayNumber,
        elapsedSeconds: totalSec,
        isWorkoutTimerActive: true,
        stage: (parsed.stage as any) || 'strength',
        shouldClearStorage: false,
      }
    }

    return {
      day: null,
      elapsedSeconds: 0,
      isWorkoutTimerActive: false,
      stage: 'idle',
      shouldClearStorage: true,
    }
  } catch {
    return {
      day: null,
      elapsedSeconds: 0,
      isWorkoutTimerActive: false,
      stage: 'idle',
      shouldClearStorage: true,
    }
  }
}

/**
 * Calculates final elapsed seconds when pausing, flushing any pending fraction of a second.
 */
export function calculatePauseElapsed(
  currentElapsed: number,
  lastTickTimestamp: number | null,
  now = Date.now()
): number {
  if (lastTickTimestamp !== null) {
    const delta = Math.floor((now - lastTickTimestamp) / 1000)
    if (delta > 0) {
      return currentElapsed + delta
    }
  }
  return currentElapsed
}

/**
 * Calculates sync delta when the tab or app becomes visible again.
 * Guarantee: If timer is paused or inactive, delta is strictly 0 and elapsed does not change.
 */
export function calculateSyncOnVisible(
  isTimerActive: boolean,
  lastTickTimestamp: number | null,
  currentElapsed: number,
  now = Date.now()
): {
  newElapsed: number
  newLastTickTimestamp: number | null
  delta: number
} {
  // CRITICAL: If timer is paused or inactive, NEVER add any time when returning to the app!
  if (!isTimerActive) {
    return {
      newElapsed: currentElapsed,
      newLastTickTimestamp: null,
      delta: 0,
    }
  }

  if (lastTickTimestamp !== null) {
    const delta = Math.floor((now - lastTickTimestamp) / 1000)
    if (delta > 0) {
      return {
        newElapsed: currentElapsed + delta,
        newLastTickTimestamp: lastTickTimestamp + delta * 1000,
        delta,
      }
    }
    return {
      newElapsed: currentElapsed,
      newLastTickTimestamp: lastTickTimestamp,
      delta: 0,
    }
  }

  return {
    newElapsed: currentElapsed,
    newLastTickTimestamp: now,
    delta: 0,
  }
}

/**
 * Manages live workout elapsed session timing, stage tracking (strength, cardio, cooldown),
 * lock-screen media session telemetry, and voice/audio prompts.
 *
 * Implements precise accumulator-based timing with pause/resume isolation so paused time
 * is NEVER added to the elapsed duration, even across backgrounding, tab sleep, or app reloads.
 */
export function useLiveWorkoutSessionTimer(
  options: UseLiveWorkoutSessionTimerOptions = {}
): UseLiveWorkoutSessionTimerResult {
  const { planWorkouts = [], onStatusChange } = options

  const [elapsedWorkoutSeconds, setElapsedWorkoutSeconds] = useState<number>(0)
  const [isWorkoutTimerActive, setIsWorkoutTimerActive] = useState<boolean>(false)
  const [activeWorkoutSessionDay, setActiveWorkoutSessionDay] = useState<number | null>(null)
  const [activeWorkoutStage, setActiveWorkoutStage] = useState<'strength' | 'cardio' | 'cooldown' | 'idle'>('idle')

  // Timestamp of the last tick while actively running
  const lastTickTimestampRef = useRef<number | null>(null)
  // Ref keeping track of current values for stable callbacks
  const elapsedSecondsRef = useRef<number>(0)
  elapsedSecondsRef.current = elapsedWorkoutSeconds

  const activeDayRef = useRef<number | null>(null)
  activeDayRef.current = activeWorkoutSessionDay

  const activeStageRef = useRef<'strength' | 'cardio' | 'cooldown' | 'idle'>('idle')
  activeStageRef.current = activeWorkoutStage

  const isTimerActiveRef = useRef<boolean>(false)
  isTimerActiveRef.current = isWorkoutTimerActive

  // Restore persisted active workout session from localStorage on mount (e.g. page refresh / app resume)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const stored = localStorage.getItem('gaa_active_session')
      const restored = restoreSessionFromStorage(stored)
      if (restored.shouldClearStorage) {
        localStorage.removeItem('gaa_active_session')
      } else if (restored.day !== null) {
        setActiveWorkoutSessionDay(restored.day)
        setElapsedWorkoutSeconds(restored.elapsedSeconds)
        setIsWorkoutTimerActive(restored.isWorkoutTimerActive)
        setActiveWorkoutStage(restored.stage)
        lastTickTimestampRef.current = restored.isWorkoutTimerActive ? Date.now() : null
      }
    } catch {}
  }, [])

  // Listen to visibilitychange, pageshow, and focus to catch up ONLY when actively running
  useEffect(() => {
    const handleSyncOnVisible = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState === 'visible') {
        const sync = calculateSyncOnVisible(
          isTimerActiveRef.current,
          lastTickTimestampRef.current,
          elapsedSecondsRef.current
        )
        if (sync.delta > 0 && isTimerActiveRef.current) {
          lastTickTimestampRef.current = sync.newLastTickTimestamp
          setElapsedWorkoutSeconds(sync.newElapsed)
          try {
            if (typeof window !== 'undefined' && activeDayRef.current !== null) {
              const now = Date.now()
              localStorage.setItem(
                'gaa_active_session',
                JSON.stringify({
                  day: activeDayRef.current,
                  elapsedSeconds: sync.newElapsed,
                  isPaused: false,
                  stage: activeStageRef.current,
                  lastActiveTimestamp: now,
                  updatedAt: now,
                })
              )
            }
          } catch {}
        }
      }
    }

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleSyncOnVisible)
      window.addEventListener('focus', handleSyncOnVisible)
      window.addEventListener('pageshow', handleSyncOnVisible)
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleSyncOnVisible)
        window.removeEventListener('focus', handleSyncOnVisible)
        window.removeEventListener('pageshow', handleSyncOnVisible)
      }
    }
  }, [])

  const handleStartWorkoutSession = useCallback((dayNumber: number) => {
    const now = Date.now()
    lastTickTimestampRef.current = now
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'gaa_active_session',
          JSON.stringify({
            day: dayNumber,
            elapsedSeconds: 0,
            isPaused: false,
            stage: 'strength',
            lastActiveTimestamp: now,
            updatedAt: now,
          })
        )
      }
    } catch {}
    setElapsedWorkoutSeconds(0)
    setActiveWorkoutSessionDay(dayNumber)
    setIsWorkoutTimerActive(true)
    setActiveWorkoutStage('strength')
    triggerHaptic('heavy')
    playCoachChimeTone(880, 0.25, 'sine')
    speakCoachVoiceCue(`Workout session started for Day ${dayNumber}. Stage 1: Warmup.`)
    onStatusChange?.(`Day ${dayNumber} Live Workout Started! Timer active & tracking for Apple Health.`)
  }, [onStatusChange])

  const handleStartStrengthSession = useCallback((dayNumber: number, _launchShortcut?: boolean) => {
    const now = Date.now()
    lastTickTimestampRef.current = now
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'gaa_active_session',
          JSON.stringify({
            day: dayNumber,
            elapsedSeconds: 0,
            isPaused: false,
            stage: 'strength',
            lastActiveTimestamp: now,
            updatedAt: now,
          })
        )
      }
    } catch {}
    setElapsedWorkoutSeconds(0)
    setActiveWorkoutSessionDay(dayNumber)
    setIsWorkoutTimerActive(true)
    setActiveWorkoutStage('strength')
    triggerHaptic('heavy')
    playCoachChimeTone(880, 0.25, 'sine')
    speakCoachVoiceCue(`Strength workout started for Day ${dayNumber}. Let's get to work.`)
    onStatusChange?.(`Day ${dayNumber} Strength Workout Started! Timer active & tracking for Apple Health.`)
  }, [onStatusChange])

  const handleStartCardioSession = useCallback((dayNumber: number, modality?: string, _launchShortcut?: boolean) => {
    const now = Date.now()
    lastTickTimestampRef.current = now
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'gaa_active_session',
          JSON.stringify({
            day: dayNumber,
            elapsedSeconds: 0,
            isPaused: false,
            stage: 'cardio',
            lastActiveTimestamp: now,
            updatedAt: now,
          })
        )
      }
    } catch {}
    setActiveWorkoutSessionDay(dayNumber)
    setIsWorkoutTimerActive(true)
    setActiveWorkoutStage('cardio')
    triggerHaptic('heavy')
    playCoachChimeTone(660, 0.25, 'sine')
    speakCoachVoiceCue(`Cardio workout started. Target modality: ${modality || 'Incline Walking'}.`)
    onStatusChange?.(`Cardio Session Started (${modality || 'Incline Walking'})! Timer active.`)
  }, [onStatusChange])

  const handlePauseResumeWorkoutSession = useCallback(() => {
    const willBeActive = !isTimerActiveRef.current
    const now = Date.now()

    if (willBeActive) {
      // RESUMING
      lastTickTimestampRef.current = now
      setIsWorkoutTimerActive(true)
      try {
        if (typeof window !== 'undefined' && activeDayRef.current !== null) {
          localStorage.setItem(
            'gaa_active_session',
            JSON.stringify({
              day: activeDayRef.current,
              elapsedSeconds: elapsedSecondsRef.current,
              isPaused: false,
              stage: activeStageRef.current,
              lastActiveTimestamp: now,
              updatedAt: now,
            })
          )
        }
      } catch {}
    } else {
      // PAUSING
      const finalElapsed = calculatePauseElapsed(
        elapsedSecondsRef.current,
        lastTickTimestampRef.current,
        now
      )
      if (finalElapsed !== elapsedSecondsRef.current) {
        setElapsedWorkoutSeconds(finalElapsed)
      }
      lastTickTimestampRef.current = null
      setIsWorkoutTimerActive(false)
      try {
        if (typeof window !== 'undefined' && activeDayRef.current !== null) {
          localStorage.setItem(
            'gaa_active_session',
            JSON.stringify({
              day: activeDayRef.current,
              elapsedSeconds: finalElapsed,
              isPaused: true,
              stage: activeStageRef.current,
              updatedAt: now,
            })
          )
        }
      } catch {}
    }

    triggerHaptic('tap')
    onStatusChange?.(willBeActive ? 'Live workout timer resumed' : 'Live workout timer paused')
  }, [onStatusChange])

  const handleStopWorkoutSession = useCallback(() => {
    lastTickTimestampRef.current = null
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gaa_active_session')
      }
    } catch {}
    setIsWorkoutTimerActive(false)
    setActiveWorkoutSessionDay(null)
    setActiveWorkoutStage('idle')
    setElapsedWorkoutSeconds(0)
    triggerHaptic('tap')
    clearLockScreenSessionTelemetry()
    onStatusChange?.('Workout session ended.')
  }, [onStatusChange])

  const handleQuitWorkoutSession = useCallback(() => {
    lastTickTimestampRef.current = null
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gaa_active_session')
      }
    } catch {}
    setIsWorkoutTimerActive(false)
    setActiveWorkoutSessionDay(null)
    setActiveWorkoutStage('idle')
    setElapsedWorkoutSeconds(0)
    triggerHaptic('heavy')
    clearLockScreenSessionTelemetry()
    playCoachChimeTone(330, 0.25, 'sine')
    speakCoachVoiceCue('Workout session quit without penalty.')
    onStatusChange?.('Workout session quit without penalty. No workout was recorded.')
  }, [onStatusChange])

  // Interval loop tracking elapsed time and syncing lock-screen media session
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isWorkoutTimerActive) {
      if (lastTickTimestampRef.current === null) {
        lastTickTimestampRef.current = Date.now()
      }

      interval = setInterval(() => {
        const now = Date.now()
        const lastTick = lastTickTimestampRef.current || now
        const delta = Math.floor((now - lastTick) / 1000)

        if (delta > 0) {
          lastTickTimestampRef.current = lastTick + delta * 1000

          setElapsedWorkoutSeconds(prev => {
            const next = prev + delta

            // Persist periodically to localStorage so state is always fresh
            try {
              if (typeof window !== 'undefined' && activeWorkoutSessionDay !== null) {
                localStorage.setItem(
                  'gaa_active_session',
                  JSON.stringify({
                    day: activeWorkoutSessionDay,
                    elapsedSeconds: next,
                    isPaused: false,
                    stage: activeWorkoutStage,
                    lastActiveTimestamp: now,
                    updatedAt: now,
                  })
                )
              }
            } catch {}

            if (activeWorkoutSessionDay !== null) {
              const activeWorkout = planWorkouts.find(w => w.day === activeWorkoutSessionDay)
              updateLockScreenSessionTelemetry({
                dayNumber: activeWorkoutSessionDay,
                workoutFocus: activeWorkout?.focus || 'Training Session',
                elapsedSeconds: next,
                activeStage: activeWorkoutStage === 'idle' ? 'strength' : activeWorkoutStage,
                isPaused: false,
              }, {
                onPause: handlePauseResumeWorkoutSession,
                onResume: handlePauseResumeWorkoutSession,
                onStop: handleStopWorkoutSession,
              })
            }

            return next
          })
        }
      }, 1000)
    } else {
      lastTickTimestampRef.current = null
      if (activeWorkoutSessionDay !== null) {
        const activeWorkout = planWorkouts.find(w => w.day === activeWorkoutSessionDay)
        updateLockScreenSessionTelemetry({
          dayNumber: activeWorkoutSessionDay,
          workoutFocus: activeWorkout?.focus || 'Training Session',
          elapsedSeconds: elapsedWorkoutSeconds,
          activeStage: activeWorkoutStage === 'idle' ? 'strength' : activeWorkoutStage,
          isPaused: true,
        }, {
          onPause: handlePauseResumeWorkoutSession,
          onResume: handlePauseResumeWorkoutSession,
          onStop: handleStopWorkoutSession,
        })
      } else {
        clearLockScreenSessionTelemetry()
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [
    isWorkoutTimerActive,
    activeWorkoutSessionDay,
    activeWorkoutStage,
    elapsedWorkoutSeconds,
    planWorkouts,
    handlePauseResumeWorkoutSession,
    handleStopWorkoutSession,
  ])

  return {
    elapsedWorkoutSeconds,
    isWorkoutTimerActive,
    activeWorkoutSessionDay,
    activeWorkoutStage,
    handleStartWorkoutSession,
    handleStartStrengthSession,
    handleStartCardioSession,
    handlePauseResumeWorkoutSession,
    handleStopWorkoutSession,
    handleQuitWorkoutSession,
    setElapsedWorkoutSeconds,
    setActiveWorkoutStage,
    setIsWorkoutTimerActive,
    setActiveWorkoutSessionDay,
  }
}
