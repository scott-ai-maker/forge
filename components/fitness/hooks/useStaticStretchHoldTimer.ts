'use client'

import { useState, useEffect, useCallback } from 'react'
import { playCountdownPip } from '@/lib/web-audio-cadence-engine'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { speakCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import { isUnilateralMovement } from '@/lib/exercise-logging-helpers'

export interface ActiveHoldTimerState {
  exerciseKey: string
  exerciseName: string
  targetSeconds: number
  remainingSeconds: number
  isRunning: boolean
  type: 'stretch' | 'foam'
  sidesCount?: 1 | 2
  currentSide?: 1 | 2
}

export interface UseStaticStretchHoldTimerOptions {
  onCompleteHold?: (exerciseKey: string, targetSeconds: number) => void
}

export interface UseStaticStretchHoldTimerResult {
  activeHoldTimer: ActiveHoldTimerState | null
  isHoldRunning: boolean
  startHoldTimer: (
    exerciseKey: string,
    exerciseName: string,
    targetSeconds: number,
    type?: 'stretch' | 'foam',
    sides?: 1 | 2
  ) => void
  cancelHoldTimer: () => void
  pauseResumeHoldTimer: () => void
  switchSide?: () => void
  setActiveHoldTimer: React.Dispatch<React.SetStateAction<ActiveHoldTimerState | null>>
}

/**
 * Manages timed static stretch holds and SMR foam rolling cadence countdowns,
 * delivering audio pips, voice cues, and haptic feedback with unilateral side switching.
 */
export function useStaticStretchHoldTimer(
  options: UseStaticStretchHoldTimerOptions = {}
): UseStaticStretchHoldTimerResult {
  const { onCompleteHold } = options
  const [activeHoldTimer, setActiveHoldTimer] = useState<ActiveHoldTimerState | null>(null)

  const isHoldRunning = Boolean(activeHoldTimer && activeHoldTimer.isRunning && activeHoldTimer.remainingSeconds > 0)

  useEffect(() => {
    if (!isHoldRunning) return

    const interval = setInterval(() => {
      setActiveHoldTimer(prev => {
        if (!prev || !prev.isRunning) return prev
        if (prev.remainingSeconds <= 1) {
          playCountdownPip(0)
          triggerHaptic('heavy')

          // If unilateral and side 1, switch to side 2!
          if (prev.sidesCount === 2 && prev.currentSide === 1) {
            speakCoachVoiceCue('Switch sides! Now opposite side.')
            return {
              ...prev,
              currentSide: 2,
              remainingSeconds: prev.targetSeconds,
              isRunning: true,
            }
          }

          speakCoachVoiceCue(
            prev.sidesCount === 2
              ? 'Both sides complete!'
              : prev.type === 'stretch'
                ? 'Stretch hold complete!'
                : 'SMR rolling complete!'
          )
          onCompleteHold?.(prev.exerciseKey, prev.targetSeconds)
          return { ...prev, remainingSeconds: 0, isRunning: false }
        }
        if (prev.remainingSeconds <= 4 && prev.remainingSeconds >= 2) {
          playCountdownPip(prev.remainingSeconds - 1)
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isHoldRunning, onCompleteHold])

  const startHoldTimer = useCallback(
    (
      exerciseKey: string,
      exerciseName: string,
      targetSeconds: number,
      type: 'stretch' | 'foam' = 'stretch',
      sides?: 1 | 2
    ) => {
      const validSeconds = Math.max(1, targetSeconds || 30)
      const sidesCount = sides ?? (isUnilateralMovement({ name: exerciseName }) ? 2 : 1)
      setActiveHoldTimer({
        exerciseKey,
        exerciseName,
        targetSeconds: validSeconds,
        remainingSeconds: validSeconds,
        isRunning: true,
        type,
        sidesCount,
        currentSide: 1,
      })
      triggerHaptic('tap')
      if (sidesCount === 2) {
        speakCoachVoiceCue(`Starting Side 1: ${validSeconds} seconds`)
      } else {
        speakCoachVoiceCue(`Starting ${validSeconds} second ${type === 'stretch' ? 'stretch hold' : 'foam roll'}`)
      }
    },
    []
  )

  const cancelHoldTimer = useCallback(() => {
    setActiveHoldTimer(null)
  }, [])

  const pauseResumeHoldTimer = useCallback(() => {
    setActiveHoldTimer(prev => {
      if (!prev) return null
      const next = !prev.isRunning
      triggerHaptic('tap')
      return { ...prev, isRunning: next }
    })
  }, [])

  const switchSide = useCallback(() => {
    setActiveHoldTimer(prev => {
      if (!prev || prev.sidesCount !== 2) return prev
      triggerHaptic('tap')
      playCountdownPip(0)
      if (prev.currentSide === 1) {
        speakCoachVoiceCue('Switching to Side 2')
        return { ...prev, currentSide: 2, remainingSeconds: prev.targetSeconds, isRunning: true }
      }
      return prev
    })
  }, [])

  return {
    activeHoldTimer,
    isHoldRunning,
    startHoldTimer,
    cancelHoldTimer,
    pauseResumeHoldTimer,
    switchSide,
    setActiveHoldTimer,
  }
}

