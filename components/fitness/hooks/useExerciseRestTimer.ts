'use client'

import { useState, useEffect, useCallback } from 'react'
import { playCountdownPip, playPrFanfare } from '@/lib/web-audio-cadence-engine'
import { speakCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { updateLockScreenSessionTelemetry, clearLockScreenSessionTelemetry } from '@/lib/media-session-telemetry'
import {
  playRestAudioMetronomeTick,
  type RestAudioMetronomeMode,
} from '@/lib/rest-timer-audio-hr-engine'

export interface ActiveRestState {
  exerciseName: string
  key: string
  restSeconds: number
  remainingSeconds: number
  isRunning: boolean
  isBioPaced?: boolean
  bioPacedDelta?: number
  bioPacedReason?: string
  badgeText?: string
  hasAcuteFatigueDrop?: boolean
  acuteFatigueDropPercent?: number
  velocityLossPercent?: number
  currentHeartRateBpm?: number
  heartRateZone?: number
}

export function useExerciseRestTimer() {
  const [activeRestState, setActiveRestState] = useState<ActiveRestState | null>(null)
  const [soundMetronomeEnabled, setSoundMetronomeEnabled] = useState(false)
  const [soundMetronomeMode, setSoundMetronomeMode] = useState<RestAudioMetronomeMode>('cardiac_pulse')

  const isRestRunning = Boolean(activeRestState && activeRestState.isRunning && activeRestState.remainingSeconds > 0)

  // 1-second interval cadence countdown loop
  useEffect(() => {
    if (!isRestRunning) return

    const interval = setInterval(() => {
      setActiveRestState(prev => {
        if (!prev || !prev.isRunning) return prev

        const elapsed = Math.max(0, prev.restSeconds - prev.remainingSeconds)

        // Trigger Audio Metronome if sound is enabled
        if (soundMetronomeEnabled && prev.remainingSeconds > 1) {
          playRestAudioMetronomeTick(
            soundMetronomeMode,
            elapsed,
            prev.remainingSeconds,
            prev.currentHeartRateBpm
          )
        }

        if (prev.remainingSeconds <= 1) {
          playCountdownPip(0)
          playPrFanfare()
          speakCoachVoiceCue("Rest complete! Let's get this set.")
          triggerHaptic('timer')
          return { ...prev, remainingSeconds: 0, isRunning: false }
        }

        if (prev.remainingSeconds <= 4 && prev.remainingSeconds >= 2) {
          playCountdownPip(prev.remainingSeconds - 1)
          triggerHaptic('tap')
        }

        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRestRunning, soundMetronomeEnabled, soundMetronomeMode])

  // Lock Screen Media Session API sync
  useEffect(() => {
    if (activeRestState && activeRestState.isRunning && activeRestState.remainingSeconds > 0) {
      updateLockScreenSessionTelemetry({
        dayNumber: 1,
        workoutFocus: `Rest Interval (${activeRestState.remainingSeconds}s)`,
        elapsedSeconds: activeRestState.remainingSeconds,
        activeStage: 'strength',
        currentExerciseName: activeRestState.exerciseName,
      })
    } else {
      clearLockScreenSessionTelemetry()
    }
  }, [activeRestState])

  const startRestTimer = useCallback((exerciseName: string, key: string, seconds: number) => {
    if (seconds <= 0) return
    setActiveRestState({
      exerciseName,
      key,
      restSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: true,
    })
  }, [])

  const cancelRestTimer = useCallback(() => {
    setActiveRestState(null)
    clearLockScreenSessionTelemetry()
  }, [])

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    setActiveRestState(prev => {
      if (!prev) return null
      const nextRemaining = Math.max(0, prev.remainingSeconds + deltaSeconds)
      return {
        ...prev,
        remainingSeconds: nextRemaining,
        restSeconds: Math.max(prev.restSeconds, nextRemaining),
        isRunning: nextRemaining > 0,
      }
    })
  }, [])

  return {
    activeRestState,
    isRestRunning,
    startRestTimer,
    cancelRestTimer,
    adjustRestTimer,
    setActiveRestState,
    soundMetronomeEnabled,
    setSoundMetronomeEnabled,
    soundMetronomeMode,
    setSoundMetronomeMode,
  }
}
