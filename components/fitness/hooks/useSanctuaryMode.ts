'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  type SanctuaryBreathingCadence,
  type BreathingPhaseState,
  type SanctuaryInterventionCue,
  getBreathingPhaseAtSeconds,
  calculateSanctuaryFocusScore,
  getDistractionInterceptionCue,
  playSanctuaryBreathTone,
  playSanctuaryInterventionAlert,
} from '@/lib/sanctuary-mode-engine'

export interface UseSanctuaryModeOptions {
  isWorkoutActive: boolean
  isRestActive: boolean
  elapsedRestSeconds?: number
  currentExerciseName?: string
  defaultCadence?: SanctuaryBreathingCadence
  defaultAudioEnabled?: boolean
}

export function shouldTriggerDistractionIntervention(awaySeconds: number, minThresholdSeconds = 4): boolean {
  return awaySeconds >= minThresholdSeconds
}

export function formatBreathingPhaseDisplay(phase: string, remainingSeconds: number): string {
  const capitalized = phase.charAt(0).toUpperCase() + phase.slice(1).replace('_', ' ')
  return `${capitalized} (${remainingSeconds}s)`
}

export interface UseSanctuaryModeReturn {
  isSanctuaryActive: boolean
  setIsSanctuaryActive: React.Dispatch<React.SetStateAction<boolean>>
  cadence: SanctuaryBreathingCadence
  setCadence: React.Dispatch<React.SetStateAction<SanctuaryBreathingCadence>>
  breathingState: BreathingPhaseState
  focusScore: number
  distractionCount: number
  totalDistractionSeconds: number
  downRegBreathsCompleted: number
  activeIntervention: SanctuaryInterventionCue | null
  dismissIntervention: () => void
  audioBreathPacerEnabled: boolean
  setAudioBreathPacerEnabled: React.Dispatch<React.SetStateAction<boolean>>
  toggleAudioBreathPacer: () => void
}

export function useSanctuaryMode({
  isWorkoutActive,
  isRestActive,
  elapsedRestSeconds = 0,
  currentExerciseName = 'Next Set',
  defaultCadence = 'box_4x4',
  defaultAudioEnabled = false,
}: UseSanctuaryModeOptions): UseSanctuaryModeReturn {
  const [isSanctuaryActive, setIsSanctuaryActive] = useState(true)
  const [cadence, setCadence] = useState<SanctuaryBreathingCadence>(defaultCadence)
  const [audioBreathPacerEnabled, setAudioBreathPacerEnabled] = useState(defaultAudioEnabled)
  
  const [distractionCount, setDistractionCount] = useState(0)
  const [totalDistractionSeconds, setTotalDistractionSeconds] = useState(0)
  const [downRegBreathsCompleted, setDownRegBreathsCompleted] = useState(0)
  const [activeIntervention, setActiveIntervention] = useState<SanctuaryInterventionCue | null>(null)

  const backgroundedTimestampRef = useRef<number | null>(null)
  const lastPhaseRef = useRef<string | null>(null)
  const sessionElapsedSecondsRef = useRef(0)

  // Track session duration while workout is active
  useEffect(() => {
    if (!isWorkoutActive) return
    const timer = setInterval(() => {
      sessionElapsedSecondsRef.current += 1
    }, 1000)
    return () => clearInterval(timer)
  }, [isWorkoutActive])

  // Derive active breathing phase
  const breathingState = getBreathingPhaseAtSeconds(elapsedRestSeconds, cadence)

  // Count completed breaths & play subtle audio cadence tones
  useEffect(() => {
    if (!isWorkoutActive || !isRestActive || !isSanctuaryActive) return

    // Detect phase transition
    if (breathingState.phase !== lastPhaseRef.current) {
      if (lastPhaseRef.current !== null && breathingState.phase === 'inhale') {
        // Full breath cycle completed!
        setDownRegBreathsCompleted(prev => prev + 1)
      }

      if (audioBreathPacerEnabled) {
        playSanctuaryBreathTone(breathingState.phase)
      }

      lastPhaseRef.current = breathingState.phase
    }
  }, [isWorkoutActive, isRestActive, isSanctuaryActive, breathingState.phase, audioBreathPacerEnabled])

  // Distraction Interceptor: Monitor visibility & blur events
  useEffect(() => {
    if (!isWorkoutActive || !isSanctuaryActive) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Athlete left the app
        backgroundedTimestampRef.current = Date.now()
      } else if (document.visibilityState === 'visible' && backgroundedTimestampRef.current !== null) {
        // Athlete returned to the app
        const awaySeconds = Math.max(1, Math.round((Date.now() - backgroundedTimestampRef.current) / 1000))
        backgroundedTimestampRef.current = null

        // If away for more than 4 seconds during active rest or workout, flag distraction
        if (awaySeconds >= 4) {
          setDistractionCount(prev => {
            const nextCount = prev + 1
            const cue = getDistractionInterceptionCue(nextCount, currentExerciseName)
            setActiveIntervention(cue)
            return nextCount
          })
          setTotalDistractionSeconds(prev => prev + awaySeconds)

          if (audioBreathPacerEnabled) {
            playSanctuaryInterventionAlert()
          }
        }
      }
    }

    const handleWindowBlur = () => {
      if (backgroundedTimestampRef.current === null) {
        backgroundedTimestampRef.current = Date.now()
      }
    }

    const handleWindowFocus = () => {
      if (backgroundedTimestampRef.current !== null) {
        const awaySeconds = Math.max(1, Math.round((Date.now() - backgroundedTimestampRef.current) / 1000))
        backgroundedTimestampRef.current = null

        if (awaySeconds >= 4) {
          setDistractionCount(prev => {
            const nextCount = prev + 1
            const cue = getDistractionInterceptionCue(nextCount, currentExerciseName)
            setActiveIntervention(cue)
            return nextCount
          })
          setTotalDistractionSeconds(prev => prev + awaySeconds)

          if (audioBreathPacerEnabled) {
            playSanctuaryInterventionAlert()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isWorkoutActive, isSanctuaryActive, currentExerciseName, audioBreathPacerEnabled])

  const dismissIntervention = useCallback(() => {
    setActiveIntervention(null)
  }, [])

  const toggleAudioBreathPacer = useCallback(() => {
    setAudioBreathPacerEnabled(prev => !prev)
  }, [])

  // Calculate live focus score
  const focusScore = calculateSanctuaryFocusScore(
    sessionElapsedSecondsRef.current,
    distractionCount,
    totalDistractionSeconds,
    downRegBreathsCompleted
  )

  return {
    isSanctuaryActive,
    setIsSanctuaryActive,
    cadence,
    setCadence,
    breathingState,
    focusScore,
    distractionCount,
    totalDistractionSeconds,
    downRegBreathsCompleted,
    activeIntervention,
    dismissIntervention,
    audioBreathPacerEnabled,
    setAudioBreathPacerEnabled,
    toggleAudioBreathPacer,
  }
}
