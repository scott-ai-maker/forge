'use client'

import { useState, useEffect, useCallback } from 'react'
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
  setElapsedWorkoutSeconds: React.Dispatch<React.SetStateAction<number>>
  setActiveWorkoutStage: React.Dispatch<React.SetStateAction<'strength' | 'cardio' | 'cooldown' | 'idle'>>
  setIsWorkoutTimerActive: React.Dispatch<React.SetStateAction<boolean>>
  setActiveWorkoutSessionDay: React.Dispatch<React.SetStateAction<number | null>>
}

function playCoachChimeTone(freq = 660, duration = 0.22, type: OscillatorType = 'triangle') {
  playPrecisionTone({ freq, duration, type, gainPeak: 0.22 })
}

/**
 * Manages live workout elapsed session timing, stage tracking (strength, cardio, cooldown),
 * lock-screen media session telemetry, and voice/audio prompts.
 */
export function useLiveWorkoutSessionTimer(
  options: UseLiveWorkoutSessionTimerOptions = {}
): UseLiveWorkoutSessionTimerResult {
  const { planWorkouts = [], onStatusChange } = options

  const [elapsedWorkoutSeconds, setElapsedWorkoutSeconds] = useState<number>(0)
  const [isWorkoutTimerActive, setIsWorkoutTimerActive] = useState<boolean>(false)
  const [activeWorkoutSessionDay, setActiveWorkoutSessionDay] = useState<number | null>(null)
  const [activeWorkoutStage, setActiveWorkoutStage] = useState<'strength' | 'cardio' | 'cooldown' | 'idle'>('idle')

  // Restore persisted active workout session from localStorage on mount (e.g. page refresh / app resume)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const stored = localStorage.getItem('gaa_active_session')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.day && parsed?.startedAt) {
          const elapsedSec = Math.floor((Date.now() - Number(parsed.startedAt)) / 1000)
          if (elapsedSec >= 0 && elapsedSec < 4 * 3600) {
            setActiveWorkoutSessionDay(Number(parsed.day))
            setElapsedWorkoutSeconds(elapsedSec)
            setIsWorkoutTimerActive(true)
            setActiveWorkoutStage('strength')
          } else {
            localStorage.removeItem('gaa_active_session')
          }
        }
      }
    } catch {}
  }, [])

  // Interval loop tracking elapsed time and syncing lock-screen media session
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isWorkoutTimerActive) {
      interval = setInterval(() => {
        setElapsedWorkoutSeconds(prev => {
          const next = prev + 1

          if (activeWorkoutSessionDay !== null) {
            const activeWorkout = planWorkouts.find(w => w.day === activeWorkoutSessionDay)
            updateLockScreenSessionTelemetry({
              dayNumber: activeWorkoutSessionDay,
              workoutFocus: activeWorkout?.focus || 'Training Session',
              elapsedSeconds: next,
              activeStage: activeWorkoutStage === 'idle' ? 'strength' : activeWorkoutStage,
            })
          }

          return next
        })
      }, 1000)
    } else {
      clearLockScreenSessionTelemetry()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWorkoutTimerActive, activeWorkoutSessionDay, activeWorkoutStage, planWorkouts])

  const handleStartWorkoutSession = useCallback((dayNumber: number) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'gaa_active_session',
          JSON.stringify({ day: dayNumber, startedAt: Date.now() })
        )
      }
    } catch {}
    setActiveWorkoutSessionDay(dayNumber)
    setIsWorkoutTimerActive(true)
    setActiveWorkoutStage('strength')
    triggerHaptic('heavy')
    playCoachChimeTone(880, 0.25, 'sine')
    speakCoachVoiceCue(`Workout session started for Day ${dayNumber}. Stage 1: Warmup.`)
    onStatusChange?.(`Day ${dayNumber} Live Workout Started! Timer active & tracking for Apple Health.`)
  }, [onStatusChange])

  const handleStartStrengthSession = useCallback((dayNumber: number, _launchShortcut?: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'gaa_active_session',
          JSON.stringify({ day: dayNumber, startedAt: Date.now() })
        )
      }
    } catch {}
    setActiveWorkoutSessionDay(dayNumber)
    setIsWorkoutTimerActive(true)
    setActiveWorkoutStage('strength')
    triggerHaptic('heavy')
    playCoachChimeTone(880, 0.25, 'sine')
    speakCoachVoiceCue(`Strength workout started for Day ${dayNumber}. Let's get to work.`)
    onStatusChange?.(`Day ${dayNumber} Strength Workout Started! Timer active & tracking for Apple Health.`)
  }, [onStatusChange])

  const handleStartCardioSession = useCallback((dayNumber: number, modality?: string, _launchShortcut?: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'gaa_active_session',
          JSON.stringify({ day: dayNumber, startedAt: Date.now() })
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
    setIsWorkoutTimerActive(prev => {
      const next = !prev
      triggerHaptic('tap')
      onStatusChange?.(next ? 'Live workout timer resumed' : 'Live workout timer paused')
      return next
    })
  }, [onStatusChange])

  const handleStopWorkoutSession = useCallback(() => {
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
    setElapsedWorkoutSeconds,
    setActiveWorkoutStage,
    setIsWorkoutTimerActive,
    setActiveWorkoutSessionDay,
  }
}
