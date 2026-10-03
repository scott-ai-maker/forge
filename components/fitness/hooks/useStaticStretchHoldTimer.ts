'use client'

import { useState, useEffect, useCallback } from 'react'
import { playCountdownPip } from '@/lib/web-audio-cadence-engine'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { speakCoachVoiceCue } from '@/lib/coach-voice-synthesizer'

export interface ActiveHoldTimerState {
  exerciseKey: string
  exerciseName: string
  targetSeconds: number
  remainingSeconds: number
  isRunning: boolean
  type: 'stretch' | 'foam'
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
    type?: 'stretch' | 'foam'
  ) => void
  cancelHoldTimer: () => void
  pauseResumeHoldTimer: () => void
  setActiveHoldTimer: React.Dispatch<React.SetStateAction<ActiveHoldTimerState | null>>
}

/**
 * Manages timed static stretch holds and SMR foam rolling cadence countdowns,
 * delivering audio pips, voice cues, and haptic feedback.
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
          speakCoachVoiceCue(prev.type === 'stretch' ? 'Stretch hold complete!' : 'SMR rolling complete!')
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
      type: 'stretch' | 'foam' = 'stretch'
    ) => {
      const validSeconds = Math.max(1, targetSeconds || 30)
      setActiveHoldTimer({
        exerciseKey,
        exerciseName,
        targetSeconds: validSeconds,
        remainingSeconds: validSeconds,
        isRunning: true,
        type,
      })
      triggerHaptic('tap')
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

  return {
    activeHoldTimer,
    isHoldRunning,
    startHoldTimer,
    cancelHoldTimer,
    pauseResumeHoldTimer,
    setActiveHoldTimer,
  }
}

