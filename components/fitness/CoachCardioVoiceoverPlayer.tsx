'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  CARDIO_PATTERNS,
  buildCardioSession,
  getBreathingProfileForRpe,
  getLocomotorCadenceGuidance,
  evaluateAdaptiveHeartRateFeedback,
  getEquipmentBiomechanicalFormTips,
  parseCardioVoiceCommand,
  calculateExecutiveCardioDebrief,
  resolveSegmentFromTotalElapsed,
  type CardioPatternId,
  type CardioIntervalSegment,
  type ExecutiveCardioDebrief,
  type LocomotorCadenceGuidance,
} from '@/lib/coach-cardio-engine'
import {
  playCardioVoiceCue,
  stopCardioVoiceCue,
  playSpontaneousSwiftKick,
  prefetchCardioSessionCues,
  updateCardioMediaSession,
  clearCardioMediaSession,
  configureCardioAudioSession,
  playIntervalTransitionPip,
  playIntervalBell,
} from '@/lib/coach-cardio-voiceover'
import { getSharedAudioContext } from '@/lib/web-audio-cadence-engine'
import { requestScreenWakeLock, releaseScreenWakeLock } from '@/lib/screen-wake-lock'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { calculateLiveCaloricBurn } from '@/lib/live-cardio-telemetry'
import { launchSpotifyNative } from '@/components/fitness/GymMusicAudioStudio'
import { syncActivityToAppleHealth, getNativeCurrentHeartRate, isNativeMobile } from '@/lib/native-healthkit-bridge'
import {
  haversineDistance,
  isNonStationaryModality,
  calculatePace,
  shouldAcceptGpsReading,
  estimateStepsFromDistance,
  checkMilestoneCrossed,
  PhysicalPedometerProcessor,
  type GpsPoint,
  type CardioDistanceSplit,
  METERS_PER_MILE,
} from '@/lib/cardio-distance-tracker'

export interface CoachCardioVoiceoverPlayerProps {
  initialPatternId?: CardioPatternId
  initialDurationMinutes?: number
  athleteName?: string
  athleteAge?: number
  athleteWeightKg?: number
  athleteGender?: 'male' | 'female'
  initialModality?: string
  externalHeartRateBpm?: number | null
  clientNotes?: string
  voiceIdOverride?: string
  onClose?: () => void
  onFlowToCoolDown?: () => void
  onFlowToMindfulness?: () => void
  onSessionLogged?: (log: {
    duration_mins: number
    activity_type: string
    perceived_effort: number
    calories: number
  }) => void
}

const MODALITY_OPTIONS = [
  { id: 'Treadmill Incline Walk', label: 'Treadmill Incline' },
  { id: 'Stationary Bike', label: 'Stationary Bike' },
  { id: 'Rowing Machine', label: 'Rowing Machine' },
  { id: 'Stairmaster', label: 'Stairmaster' },
  { id: 'Assault / Air Bike', label: 'Assault Bike' },
  { id: 'Elliptical', label: 'Elliptical' },
  { id: 'Outdoor Run / Walk', label: 'Outdoor Run / Walk' },
  { id: 'Outdoor Cycling', label: 'Outdoor Cycling' },
  { id: 'Ski Erg', label: 'Ski Erg' },
  { id: 'Jump Rope', label: 'Jump Rope' },
  { id: 'General Modality', label: 'General / Other' },
]

export default function CoachCardioVoiceoverPlayer({
  initialPatternId = 'zone2_aerobic_engine',
  initialDurationMinutes,
  athleteName = 'Athlete',
  athleteAge = 35,
  athleteWeightKg = 75,
  athleteGender = 'male',
  initialModality = 'Treadmill Incline Walk',
  externalHeartRateBpm,
  clientNotes,
  voiceIdOverride,
  onClose,
  onFlowToCoolDown,
  onFlowToMindfulness,
  onSessionLogged,
}: CoachCardioVoiceoverPlayerProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Session Configuration
  const [selectedPatternId, setSelectedPatternId] = useState<CardioPatternId>(initialPatternId)
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialDurationMinutes || CARDIO_PATTERNS[initialPatternId]?.defaultDurationMins || 20
  )
  const [selectedModality, setSelectedModality] = useState<string>(initialModality)
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false)

  // Outdoor Distance, Live Pace & Step Telemetry
  const [isDistanceTrackingEnabled, setIsDistanceTrackingEnabled] = useState<boolean>(() =>
    isNonStationaryModality(initialModality)
  )
  const [distanceUnit, setDistanceUnit] = useState<'mi' | 'km'>('mi')
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'acquiring' | 'locked' | 'paused' | 'error'>('idle')
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number>(0)
  const [currentPaceFormatted, setCurrentPaceFormatted] = useState<string>('— /mi')
  const [averagePaceFormatted, setAveragePaceFormatted] = useState<string>('— /mi')
  const [stepCount, setStepCount] = useState<number>(0)
  const [stepCadenceSpm, setStepCadenceSpm] = useState<number>(0)
  const [stepSource, setStepSource] = useState<'sensor' | 'gps_estimated' | 'idle'>('idle')
  const [splits, setSplits] = useState<CardioDistanceSplit[]>([])
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null)

  // Distance & Step Tracking Synchronization Refs
  const watchIdRef = useRef<number | null>(null)
  const lastGpsPointRef = useRef<GpsPoint | null>(null)
  const recentPacePointsRef = useRef<Array<{ distanceMeters: number; timestamp: number }>>([])
  const pedometerRef = useRef<PhysicalPedometerProcessor>(new PhysicalPedometerProcessor())
  const distanceMetersRef = useRef<number>(0)
  const stepCountRef = useRef<number>(0)
  const stepCadenceRef = useRef<number>(0)
  const lastMilestoneAnnouncedRef = useRef<number>(0)
  const isDistanceTrackingActiveRef = useRef<boolean>(false)
  const distanceUnitRef = useRef<'mi' | 'km'>('mi')

  // Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [hasStarted, setHasStarted] = useState<boolean>(false)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0)
  const [segmentElapsedSeconds, setSegmentElapsedSeconds] = useState<number>(0)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0)
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('')
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isSwiftKickActive, setIsSwiftKickActive] = useState<boolean>(false)
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false)
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false)
  const [logSavedSuccess, setLogSavedSuccess] = useState<boolean>(false)
  const [appleHealthSyncMessage, setAppleHealthSyncMessage] = useState<string | null>(null)

  // In-Pocket Touch Shield Mode (keeps screen awake on black OLED background, blocking accidental touches)
  const [isPocketLockActive, setIsPocketLockActive] = useState<boolean>(false)
  const [unlockHoldProgress, setUnlockHoldProgress] = useState<number>(0)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastShieldTapRef = useRef<number>(0)

  // Wall-Clock Timestamp Synchronization Refs (Prevents mobile background sleep/throttle drift)
  const sessionStartTimestampRef = useRef<number | null>(null)
  const pausedAccumulatedMsRef = useRef<number>(0)
  const pauseStartTimestampRef = useRef<number | null>(null)
  const currentSegmentIndexRef = useRef<number>(0)
  const isCompletedRef = useRef<boolean>(false)
  const liveBpmRef = useRef<number | null>(null)
  const bpmSamplesRef = useRef<number[]>([])
  const lastAdaptiveAlertTimeRef = useRef<number>(0)
  const isMusicDuckingActiveRef = useRef<boolean>(true)

  // Music Ducking Mode (ducks background audio like Spotify / Apple Music without halting playback)
  const [isMusicDuckingActive, setIsMusicDuckingActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gaa_cardio_music_ducking_v1')
        return saved !== null ? JSON.parse(saved) : true
      } catch {
        return true
      }
    }
    return true
  })
  const [musicDuckingToast, setMusicDuckingToast] = useState<string | null>(null)

  const toggleMusicDucking = () => {
    setIsMusicDuckingActive(prev => {
      const next = !prev
      try {
        localStorage.setItem('gaa_cardio_music_ducking_v1', JSON.stringify(next))
      } catch {}
      if (next) {
        configureCardioAudioSession('transient')
        clearCardioMediaSession()
        setMusicDuckingToast('Music Ducking ON: Spotify & background audio will duck smoothly during cues.')
      } else {
        configureCardioAudioSession('playback')
        setMusicDuckingToast('Lock Screen Mode: MediaSession controls enabled on lock screen.')
      }
      setTimeout(() => setMusicDuckingToast(null), 3800)
      return next
    })
  }

  const handleLaunchCadenceSpotify = () => {
    // Ensure transient audioSession is active so Coach Gordon will duck over Spotify
    configureCardioAudioSession('transient')
    clearCardioMediaSession()
    if (!isMusicDuckingActive) {
      setIsMusicDuckingActive(true)
      try {
        localStorage.setItem('gaa_cardio_music_ducking_v1', 'true')
      } catch {}
    }
    launchSpotifyNative('https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM')
    setMusicDuckingToast('Spotify launched! Music ducking engaged — Coach Gordon will speak over your rhythm.')
    setTimeout(() => setMusicDuckingToast(null), 4500)
  }

  // High-End Biometric & Wearable State (Bluetooth Heart Rate)
  const [isBtConnecting, setIsBtConnecting] = useState<boolean>(false)
  const [isBtConnected, setIsBtConnected] = useState<boolean>(false)
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null)
  const [liveBpm, setLiveBpm] = useState<number | null>(null)
  const [nativeBpm, setNativeBpm] = useState<number | null>(null)
  const [bpmSamples, setBpmSamples] = useState<number[]>([])
  const [lastAdaptiveAlertTime, setLastAdaptiveAlertTime] = useState<number>(0)

  // Two-Way Hands-Free Voice Copilot
  const [isVoiceCopilotEnabled, setIsVoiceCopilotEnabled] = useState<boolean>(false)
  const [isListeningForVoice, setIsListeningForVoice] = useState<boolean>(false)
  const [lastVoiceFeedback, setLastVoiceFeedback] = useState<string | null>(null)

  // Equipment Form Guidance Drawer
  const [showFormGuide, setShowFormGuide] = useState<boolean>(false)

  // Executive Post-Session Report Data
  const [executiveReport, setExecutiveReport] = useState<ExecutiveCardioDebrief | null>(null)

  // Breath Animation State (Phase: 'inhale' | 'exhale')
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale')

  // Build the session from the engine
  const session = useMemo(() => {
    return buildCardioSession({
      patternId: selectedPatternId,
      durationMinutes,
      athleteName,
      clientNotes,
    })
  }, [selectedPatternId, durationMinutes, athleteName, clientNotes])

  // Sync refs for uninterrupted wall-clock timer reconciler
  const sessionRef = useRef(session)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    currentSegmentIndexRef.current = currentSegmentIndex
  }, [currentSegmentIndex])

  useEffect(() => {
    isCompletedRef.current = sessionCompleted
  }, [sessionCompleted])

  useEffect(() => {
    liveBpmRef.current = liveBpm
  }, [liveBpm])

  useEffect(() => {
    bpmSamplesRef.current = bpmSamples
  }, [bpmSamples])

  useEffect(() => {
    lastAdaptiveAlertTimeRef.current = lastAdaptiveAlertTime
  }, [lastAdaptiveAlertTime])

  useEffect(() => {
    isMusicDuckingActiveRef.current = isMusicDuckingActive
  }, [isMusicDuckingActive])

  useEffect(() => {
    isDistanceTrackingActiveRef.current = isDistanceTrackingEnabled
  }, [isDistanceTrackingEnabled])

  useEffect(() => {
    distanceUnitRef.current = distanceUnit
  }, [distanceUnit])

  const totalElapsedSecondsRef = useRef<number>(totalElapsedSeconds)
  useEffect(() => {
    totalElapsedSecondsRef.current = totalElapsedSeconds
  }, [totalElapsedSeconds])

  const averagePaceFormattedRef = useRef(averagePaceFormatted)
  useEffect(() => {
    averagePaceFormattedRef.current = averagePaceFormatted
  }, [averagePaceFormatted])

  // Automatically enable distance & step tracking when a non-stationary outdoor modality is selected
  useEffect(() => {
    if (isNonStationaryModality(selectedModality)) {
      setIsDistanceTrackingEnabled(true)
    } else {
      setIsDistanceTrackingEnabled(false)
    }
  }, [selectedModality])

  // Suppress mobile bottom navigation dock and preserve safe-area clearance when studio is active
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('coach-cardio-modal-open')
      return () => {
        document.body.classList.remove('coach-cardio-modal-open')
      }
    }
  }, [])

  // In-Pocket Touch Shield press-and-hold unlock handlers
  const startHoldUnlock = useCallback(() => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current)
    const startTime = Date.now()
    const holdDurationMs = 1200 // 1.2s tactile hold

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, Math.round((elapsed / holdDurationMs) * 100))
      setUnlockHoldProgress(progress)

      if (progress >= 100) {
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current)
          holdIntervalRef.current = null
        }
        setUnlockHoldProgress(0)
        setIsPocketLockActive(false)
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([40, 30, 80])
          } catch {}
        }
      }
    }, 50)
  }, [])

  const cancelHoldUnlock = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    setUnlockHoldProgress(0)
  }, [])

  const handleDoubleTapUnlock = useCallback(() => {
    const now = Date.now()
    if (now - lastShieldTapRef.current < 450) {
      setIsPocketLockActive(false)
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(60)
        } catch {}
      }
    }
    lastShieldTapRef.current = now
  }, [])

  const currentSegment: CardioIntervalSegment = session.intervals[currentSegmentIndex] || session.intervals[0]
  const currentSegmentRef = useRef(currentSegment)
  useEffect(() => {
    currentSegmentRef.current = currentSegment
  }, [currentSegment])
  const currentBreathing = currentSegment?.breathingProfile || getBreathingProfileForRpe(4)
  const formTips = useMemo(() => getEquipmentBiomechanicalFormTips(selectedModality), [selectedModality])
  const cadenceGuidance: LocomotorCadenceGuidance = useMemo(() => {
    return getLocomotorCadenceGuidance(currentSegment?.targetRpe || 4, selectedModality)
  }, [currentSegment?.targetRpe, selectedModality])

  const segmentRemainingSeconds = Math.max(0, currentSegment.durationSeconds - segmentElapsedSeconds)
  const totalRemainingSeconds = Math.max(0, session.totalSeconds - totalElapsedSeconds)

  // Periodic native HealthKit heart rate polling while playing if Bluetooth is not connected
  useEffect(() => {
    if (!isPlaying || sessionCompleted || !isNativeMobile()) return
    if (isBtConnected && liveBpm) return

    let isMounted = true
    const pollNativeHr = async () => {
      try {
        const res = await getNativeCurrentHeartRate()
        if (isMounted && typeof res.heartRate === 'number' && res.heartRate > 30) {
          setNativeBpm(res.heartRate)
        }
      } catch {}
    }

    void pollNativeHr()
    const interval = setInterval(pollNativeHr, 5000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isPlaying, sessionCompleted, isBtConnected, liveBpm])

  // Tanaka HRmax calculation
  const safeAge = Math.max(18, Math.min(85, athleteAge))
  const tanakaHrMax = Math.round(208 - 0.7 * safeAge)
  const activeSensorBpm = liveBpm || nativeBpm || externalHeartRateBpm || null
  const hasMeasuredHr = typeof activeSensorBpm === 'number' && activeSensorBpm > 0
  const estimatedRpeBpm = Math.round(90 + (currentSegment?.targetRpe || 4) * 9.5)
  const effectiveBpm = hasMeasuredHr ? activeSensorBpm : estimatedRpeBpm
  const currentHrPct = Math.round((effectiveBpm / tanakaHrMax) * 100)

  // Real-time calories
  const liveCal = useMemo(() => {
    return calculateLiveCaloricBurn({
      bpm: effectiveBpm,
      durationSeconds: totalElapsedSeconds,
      weightKg: athleteWeightKg,
      age: athleteAge,
      gender: athleteGender,
    })
  }, [effectiveBpm, totalElapsedSeconds, athleteWeightKg, athleteAge, athleteGender])

  // Track cues that have fired to avoid duplicate speech within a segment
  const firedCuesRef = useRef<Set<string>>(new Set())

  // Prefetch first few cues when session configuration changes
  useEffect(() => {
    const cuesToPrefetch = session.intervals.slice(0, 4).map(i => i.voiceCues.startCue)
    prefetchCardioSessionCues(cuesToPrefetch, voiceIdOverride)
  }, [session, voiceIdOverride])

  // Breathing pacer loop
  useEffect(() => {
    if (!isPlaying || sessionCompleted) return

    const inTimeMs = (currentBreathing.inBreathSeconds || 2) * 1000
    const outTimeMs = (currentBreathing.outBreathSeconds || 2) * 1000
    const totalCycleMs = inTimeMs + outTimeMs

    const cycleInterval = setInterval(() => {
      setBreathPhase('inhale')
      setTimeout(() => {
        setBreathPhase('exhale')
      }, inTimeMs)
    }, totalCycleMs)

    // Initial trigger
    setBreathPhase('inhale')
    const initialExhaleTimeout = setTimeout(() => {
      setBreathPhase('exhale')
    }, inTimeMs)

    return () => {
      clearInterval(cycleInterval)
      clearTimeout(initialExhaleTimeout)
    }
  }, [isPlaying, currentBreathing, sessionCompleted])

  // Helper to safely speak a voice cue
  const speakCue = useCallback(
    async (cueText: string) => {
      if (isVoiceMuted || !cueText) return
      setCurrentSubtitle(cueText)
      setIsSpeaking(true)

      await playCardioVoiceCue(cueText, {
        voiceId: voiceIdOverride,
        onStart: () => setIsSpeaking(true),
        onEnded: () => setIsSpeaking(false),
      })
    },
    [isVoiceMuted, voiceIdOverride]
  )

  const speakCueRef = useRef(speakCue)
  useEffect(() => {
    speakCueRef.current = speakCue
  }, [speakCue])

  // Pause Session helper
  const pauseSession = useCallback(() => {
    setIsPlaying(false)
    pauseStartTimestampRef.current = Date.now()
    void releaseScreenWakeLock()
    stopCardioVoiceCue()
    setIsSpeaking(false)
    clearCardioMediaSession()
  }, [])

  // Resume Session helper
  const resumeSession = useCallback(() => {
    if (pauseStartTimestampRef.current) {
      pausedAccumulatedMsRef.current += Date.now() - pauseStartTimestampRef.current
      pauseStartTimestampRef.current = null
    }
    if (isMusicDuckingActiveRef.current) {
      configureCardioAudioSession('transient')
      clearCardioMediaSession()
    }
    const ctx = getSharedAudioContext()
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume()
    }
    setIsPlaying(true)
    void requestScreenWakeLock()
  }, [])

  // Skip Segment Handler
  const handleSkipSegment = useCallback(() => {
    const currentSession = sessionRef.current
    const currentIndex = currentSegmentIndexRef.current

    if (currentIndex < currentSession.intervals.length - 1) {
      stopCardioVoiceCue()
      const nextIndex = currentIndex + 1
      currentSegmentIndexRef.current = nextIndex
      setCurrentSegmentIndex(nextIndex)
      setSegmentElapsedSeconds(0)
      firedCuesRef.current.clear()

      // Deterministically calculate total seconds up to nextIndex
      let targetTotalElapsed = 0
      for (let i = 0; i < nextIndex; i++) {
        targetTotalElapsed += currentSession.intervals[i].durationSeconds
      }
      setTotalElapsedSeconds(targetTotalElapsed)

      // Realign wall-clock sessionStartTimestampRef
      const now = Date.now()
      const effectivePaused = pauseStartTimestampRef.current ? (now - pauseStartTimestampRef.current) : 0
      sessionStartTimestampRef.current = now - (targetTotalElapsed * 1000) - pausedAccumulatedMsRef.current - effectivePaused

      const nextSegment = currentSession.intervals[nextIndex]
      playIntervalBell(nextSegment.segmentType === 'work')
      if (nextSegment?.voiceCues.startCue) {
        speakCue(nextSegment.voiceCues.startCue)
      }
    } else {
      isCompletedRef.current = true
      setSessionCompleted(true)
      setIsPlaying(false)
      void releaseScreenWakeLock()
      clearCardioMediaSession()

      const debrief = calculateExecutiveCardioDebrief({
        durationSeconds: Math.max(1, totalElapsedSeconds),
        averageRpe: currentSession.avgRpe,
        peakRpe: currentSession.maxRpe,
        samplesBpm: bpmSamplesRef.current,
        patternId: selectedPatternId,
        athleteName,
        athleteWeightKg,
        athleteAge,
        athleteGender,
        distanceMeters: isDistanceTrackingActiveRef.current ? distanceMetersRef.current : undefined,
        distanceUnit: distanceUnitRef.current,
        totalSteps: isDistanceTrackingActiveRef.current ? stepCountRef.current : undefined,
        avgCadenceSpm: isDistanceTrackingActiveRef.current && stepCadenceRef.current > 0 ? stepCadenceRef.current : undefined,
      })
      setExecutiveReport(debrief)
      speakCue(debrief.postSessionCoachDebriefVoiceScript)
    }
  }, [speakCue, totalElapsedSeconds, selectedPatternId, athleteName, athleteWeightKg, athleteAge, athleteGender])

  // Main Wall-Clock Reconciler (Ensures zero timer drift when screen turns off or locks)
  const reconcileTimer = useCallback(() => {
    if (!sessionStartTimestampRef.current || isCompletedRef.current) return

    const now = Date.now()
    const effectivePaused = pauseStartTimestampRef.current ? (now - pauseStartTimestampRef.current) : 0
    const elapsedMs = Math.max(0, now - sessionStartTimestampRef.current - pausedAccumulatedMsRef.current - effectivePaused)
    const exactTotalSec = Math.floor(elapsedMs / 1000)

    const currentSession = sessionRef.current
    const resolved = resolveSegmentFromTotalElapsed(currentSession.intervals, exactTotalSec)
    const activeSegment = currentSession.intervals[resolved.segmentIndex] || currentSession.intervals[0]
    const activeSegmentRemaining = Math.max(0, activeSegment.durationSeconds - resolved.segmentElapsedSeconds)

    setTotalElapsedSeconds(exactTotalSec)
    setSegmentElapsedSeconds(resolved.segmentElapsedSeconds)

    const prevSegmentIndex = currentSegmentIndexRef.current

    // 1. Workout completed
    if (resolved.isCompleted) {
      if (!isCompletedRef.current) {
        isCompletedRef.current = true
        setSessionCompleted(true)
        setIsPlaying(false)
        void releaseScreenWakeLock()
        clearCardioMediaSession()

        // Build executive debrief
        const debrief = calculateExecutiveCardioDebrief({
          durationSeconds: exactTotalSec,
          averageRpe: currentSession.avgRpe,
          peakRpe: currentSession.maxRpe,
          samplesBpm: bpmSamplesRef.current,
          patternId: selectedPatternId,
          athleteName,
          athleteWeightKg,
          athleteAge,
          athleteGender,
          distanceMeters: isDistanceTrackingActiveRef.current ? distanceMetersRef.current : undefined,
          distanceUnit: distanceUnitRef.current,
          totalSteps: isDistanceTrackingActiveRef.current ? stepCountRef.current : undefined,
          avgCadenceSpm: isDistanceTrackingActiveRef.current && stepCadenceRef.current > 0 ? stepCadenceRef.current : undefined,
        })
        setExecutiveReport(debrief)
        speakCue(debrief.postSessionCoachDebriefVoiceScript)
      }
      return
    }

    // 2. Interval segment changed (either naturally or after waking from background sleep)
    if (resolved.segmentIndex !== prevSegmentIndex) {
      currentSegmentIndexRef.current = resolved.segmentIndex
      setCurrentSegmentIndex(resolved.segmentIndex)
      firedCuesRef.current.clear()

      playIntervalBell(activeSegment.segmentType === 'work')
      if (activeSegment.voiceCues.startCue) {
        speakCue(activeSegment.voiceCues.startCue)
      }
    }

    // 3. Audio Cues & Countdown Pips (only when active and not paused)
    if (!pauseStartTimestampRef.current) {
      // 3-2-1 countdown pips
      if (activeSegmentRemaining <= 3 && activeSegmentRemaining >= 1) {
        playIntervalTransitionPip(activeSegmentRemaining)
      }

      // Mid-interval breathing & check-in cue
      const halfTime = Math.floor(activeSegment.durationSeconds / 2)
      if (resolved.segmentElapsedSeconds >= halfTime && activeSegment.voiceCues.midIntervalCue) {
        const cueKey = `mid_${activeSegment.id}`
        if (!firedCuesRef.current.has(cueKey)) {
          firedCuesRef.current.add(cueKey)
          speakCue(activeSegment.voiceCues.midIntervalCue)
        }
      }

      // 10-second warning countdown cue
      if (
        activeSegmentRemaining <= 10 &&
        activeSegmentRemaining > 3 &&
        activeSegment.voiceCues.countdown10sCue
      ) {
        const cueKey = `countdown_${activeSegment.id}`
        if (!firedCuesRef.current.has(cueKey)) {
          firedCuesRef.current.add(cueKey)
          speakCue(activeSegment.voiceCues.countdown10sCue)
        }
      }

      // Adaptive Heart Rate Coaching Trigger
      const bpm = liveBpmRef.current
      if (bpm && bpm > 40 && Date.now() - lastAdaptiveAlertTimeRef.current > 45000) {
        const feedback = evaluateAdaptiveHeartRateFeedback(bpm, activeSegment.targetRpe, athleteAge)
        if (feedback.alertType !== 'none' && feedback.voiceCue) {
          lastAdaptiveAlertTimeRef.current = Date.now()
          setLastAdaptiveAlertTime(Date.now())
          speakCue(feedback.voiceCue)
        }
      }
    }

    // 4. Update lock screen media session
    updateCardioMediaSession({
      patternName: currentSession.pattern.name,
      segmentTitle: activeSegment.title,
      targetRpe: activeSegment.targetRpe,
      elapsedSeconds: exactTotalSec,
      totalSeconds: currentSession.totalSeconds,
      allowLockScreenControl: !isMusicDuckingActiveRef.current,
      onPause: pauseSession,
      onResume: resumeSession,
      onNextInterval: handleSkipSegment,
    })
  }, [
    selectedPatternId,
    athleteName,
    athleteWeightKg,
    athleteAge,
    athleteGender,
    speakCue,
    pauseSession,
    resumeSession,
    handleSkipSegment,
  ])

  // Main Session Progression Timer Loop (Driven by deterministic wall-clock reconciliation)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isPlaying && !sessionCompleted) {
      reconcileTimer()
      interval = setInterval(() => {
        reconcileTimer()
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, sessionCompleted, reconcileTimer])

  // Mobile Visibility & Screen Wakeup Reconciler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (isPlaying && !sessionCompleted) {
          void requestScreenWakeLock()
          reconcileTimer()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPlaying, sessionCompleted, reconcileTimer])

  // ── Outdoor Geolocation & Accelerometer Pedometer Telemetry ──────
  useEffect(() => {
    if (!hasStarted || sessionCompleted || !isDistanceTrackingEnabled) {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      setGpsStatus('idle')
      return
    }

    if (!isPlaying) {
      setGpsStatus('paused')
      lastGpsPointRef.current = null
      return
    }

    setGpsStatus('requesting')

    const handleMotion = (e: DeviceMotionEvent) => {
      if (!isPlaying || isCompletedRef.current) return
      const acc = e.accelerationIncludingGravity || e.acceleration
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return

      const res = pedometerRef.current.processMotionEvent(acc.x, acc.y, acc.z, Date.now())
      if (res.stepDetected) {
        stepCountRef.current = res.totalSteps
        stepCadenceRef.current = res.cadenceSpm
        setStepCount(res.totalSteps)
        setStepCadenceSpm(res.cadenceSpm)
        setStepSource('sensor')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion)
    }

    const handleGpsSuccess = (pos: GeolocationPosition) => {
      if (!isPlaying || isCompletedRef.current) return

      const newPoint: GpsPoint = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        timestamp: pos.timestamp || Date.now(),
      }

      setGpsAccuracy(Math.round(pos.coords.accuracy))
      setGpsStatus('locked')

      const filter = shouldAcceptGpsReading(newPoint, lastGpsPointRef.current)
      if (!filter.accept) {
        return
      }

      if (lastGpsPointRef.current) {
        const delta = haversineDistance(
          lastGpsPointRef.current.latitude,
          lastGpsPointRef.current.longitude,
          newPoint.latitude,
          newPoint.longitude
        )

        const prevDist = distanceMetersRef.current
        const newDist = prevDist + delta
        distanceMetersRef.current = newDist
        setDistanceMeters(newDist)

        // Rolling pace (last 25 seconds)
        const now = Date.now()
        recentPacePointsRef.current.push({ distanceMeters: newDist, timestamp: now })
        recentPacePointsRef.current = recentPacePointsRef.current.filter(p => now - p.timestamp <= 25000)

        if (recentPacePointsRef.current.length >= 2) {
          const firstP = recentPacePointsRef.current[0]
          const deltaMeters = newDist - firstP.distanceMeters
          const deltaSecs = (now - firstP.timestamp) / 1000
          if (deltaMeters > 5 && deltaSecs > 3) {
            const pace = calculatePace(deltaMeters, deltaSecs, distanceUnitRef.current)
            setCurrentPaceFormatted(pace.formattedPace)
          }
        }

        // Average pace
        const elapsedSecs = totalElapsedSecondsRef.current
        if (sessionStartTimestampRef.current !== null && elapsedSecs > 5) {
          const avgPace = calculatePace(newDist, elapsedSecs, distanceUnitRef.current)
          setAveragePaceFormatted(avgPace.formattedPace)
        }

        // Step estimation fallback if no accelerometer events received
        if (pedometerRef.current.getSteps() === 0) {
          const targetRpe = currentSegmentRef.current?.targetRpe || 4
          const estSteps = estimateStepsFromDistance(
            newDist,
            targetRpe >= 6,
            athleteGender === 'female' ? 165 : 178
          )
          stepCountRef.current = estSteps
          setStepCount(estSteps)
          setStepSource('gps_estimated')
        }

        // Milestone audio check (1.0 mile / 1.0 km)
        const milestone = checkMilestoneCrossed(prevDist, newDist, distanceUnitRef.current)
        if (milestone !== null && milestone > lastMilestoneAnnouncedRef.current) {
          lastMilestoneAnnouncedRef.current = milestone
          const milestoneUnit = distanceUnitRef.current === 'mi' ? 'Mile' : 'Kilometer'
          const milestonePace = averagePaceFormattedRef.current || '8:00 /mi'
          const stepNarrative = stepCountRef.current > 0 ? ` Total steps: ${stepCountRef.current.toLocaleString()}.` : ''
          const milestoneCue = `${milestoneUnit} ${milestone} completed at ${milestonePace} pace.${stepNarrative} Outstanding discipline, ${athleteName}. Settle your shoulders, check your breathing, and hold Zone 2.`
          speakCueRef.current(milestoneCue)

          // Record split
          const splitDistMeters = distanceUnitRef.current === 'mi' ? METERS_PER_MILE : 1000
          const splitPace = calculatePace(splitDistMeters, elapsedSecs, distanceUnitRef.current)
          setSplits(prev => [
            ...prev,
            {
              splitNumber: milestone,
              splitType: distanceUnitRef.current === 'mi' ? 'mile' : 'km',
              splitDistanceMeters: splitDistMeters,
              splitTimeSeconds: elapsedSecs,
              splitPaceSeconds: splitPace.paceSeconds,
              formattedPace: splitPace.formattedPace,
              accumulatedTimeSeconds: elapsedSecs,
            },
          ])
        }
      }

      lastGpsPointRef.current = newPoint
    }

    const handleGpsError = (err: GeolocationPositionError) => {
      setGpsStatus('error')
      setGpsErrorMessage(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Please enable location permissions in your browser or device settings.'
          : 'Acquiring GPS satellite signal...'
      )
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleGpsSuccess,
        handleGpsError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1500,
        }
      )
    } else {
      setGpsStatus('error')
      setGpsErrorMessage('Geolocation is not supported on this device/browser.')
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion)
      }
    }
  }, [
    hasStarted,
    isPlaying,
    sessionCompleted,
    isDistanceTrackingEnabled,
    athleteGender,
    athleteName,
  ])

  // ── Web Bluetooth Heart Rate Connection ──────────────────────────
  const connectBluetoothHeartRate = async () => {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert('Web Bluetooth is supported on Google Chrome, Microsoft Edge, and Chrome for Android. Connect on a supported browser.')
      return
    }

    setIsBtConnecting(true)
    try {
      const navBt = (navigator as unknown as {
        bluetooth: {
          requestDevice: (opts: unknown) => Promise<{
            gatt: {
              connect: () => Promise<{
                getPrimaryService: (s: string) => Promise<{
                  getCharacteristic: (c: string) => Promise<{
                    startNotifications: () => Promise<void>
                    addEventListener: (e: string, h: (ev: Event) => void) => void
                  }>
                }>
              }>
            }
            name?: string
          }>
        }
      }).bluetooth

      const device = await navBt.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      })

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')

      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', (ev: Event) => {
        const target = ev.target as unknown as { value: DataView }
        if (!target?.value) return

        const val = target.value
        const flags = val.getUint8(0)
        const is16Bit = flags & 0x1
        const bpm = is16Bit ? val.getUint16(1, true) : val.getUint8(1)

        if (bpm >= 35 && bpm <= 235) {
          setLiveBpm(bpm)
          setBpmSamples(prev => [...prev.slice(-300), bpm])
        }
      })

      setIsBtConnected(true)
      setBtDeviceName(device.name || 'Bluetooth Heart Rate Monitor')
      speakCue('Heart rate monitor connected. Real-time biometric feedback engaged.')
    } catch {
      // User cancelled or Bluetooth unavailable
    } finally {
      setIsBtConnecting(false)
    }
  }

  // ── Two-Way Hands-Free Voice Copilot (Web Speech Recognition) ──
  useEffect(() => {
    if (!isVoiceCopilotEnabled || typeof window === 'undefined') return

    const windowAny = window as unknown as {
      SpeechRecognition?: new () => any
      webkitSpeechRecognition?: new () => any
    }
    const SpeechClass = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition
    if (!SpeechClass) return

    let recognition: any = null
    try {
      recognition = new SpeechClass()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => setIsListeningForVoice(true)
      recognition.onend = () => {
        if (isVoiceCopilotEnabled && isPlaying) {
          try {
            recognition.start()
          } catch {}
        } else {
          setIsListeningForVoice(false)
        }
      }

      recognition.onresult = (event: any) => {
        const results = event.results
        if (!results || results.length === 0) return
        const last = results[results.length - 1]
        const transcript = last[0]?.transcript || ''

        if (transcript) {
          const distFormatted = distanceMetersRef.current > 5
            ? `${(distanceMetersRef.current * (distanceUnit === 'mi' ? 0.000621371 : 0.001)).toFixed(2)} ${distanceUnit === 'mi' ? 'miles' : 'kilometers'}`
            : undefined

          const parsed = parseCardioVoiceCommand(transcript, {
            segmentRemainingSecs: segmentRemainingSeconds,
            totalRemainingSecs: totalRemainingSeconds,
            targetRpe: currentSegment?.targetRpe || 4,
            modality: selectedModality,
            distanceMeters: distanceMetersRef.current,
            distanceUnit,
            formattedDistance: distFormatted,
            formattedPace: currentPaceFormatted,
            stepCount: stepCountRef.current,
            stepCadenceSpm: stepCadenceRef.current,
            isDistanceTrackingActive: isDistanceTrackingEnabled,
          })

          if (parsed.type !== 'UNKNOWN') {
            setLastVoiceFeedback(`Voice: "${transcript}"`)
            setTimeout(() => setLastVoiceFeedback(null), 4000)

            if (parsed.type === 'PAUSE') {
              pauseSession()
              speakCue(parsed.spokenFeedback)
            } else if (parsed.type === 'RESUME') {
              resumeSession()
              speakCue(parsed.spokenFeedback)
            } else if (parsed.type === 'NEXT_INTERVAL') {
              handleSkipSegment()
            } else if (parsed.type === 'CADENCE_CHECK') {
              speakCue(parsed.spokenFeedback)
            } else if (parsed.spokenFeedback) {
              speakCue(parsed.spokenFeedback)
            }
          }
        }
      }

      recognition.start()
    } catch {}

    return () => {
      if (recognition) {
        try {
          recognition.stop()
        } catch {}
      }
      setIsListeningForVoice(false)
    }
  }, [
    isVoiceCopilotEnabled,
    isPlaying,
    segmentRemainingSeconds,
    totalRemainingSeconds,
    currentSegment?.targetRpe,
    selectedModality,
    speakCue,
    pauseSession,
    resumeSession,
    handleSkipSegment,
  ])

  // Start Session
  const handleStartSession = () => {
    const now = Date.now()
    sessionStartTimestampRef.current = now
    pausedAccumulatedMsRef.current = 0
    pauseStartTimestampRef.current = null
    isCompletedRef.current = false
    currentSegmentIndexRef.current = 0

    setIsPlaying(true)
    setHasStarted(true)
    setSessionCompleted(false)
    setCurrentSegmentIndex(0)
    setSegmentElapsedSeconds(0)
    setTotalElapsedSeconds(0)
    firedCuesRef.current.clear()

    // Reset distance, pace & step metrics
    distanceMetersRef.current = 0
    stepCountRef.current = 0
    stepCadenceRef.current = 0
    lastMilestoneAnnouncedRef.current = 0
    lastGpsPointRef.current = null
    recentPacePointsRef.current = []
    pedometerRef.current.reset()
    setDistanceMeters(0)
    setStepCount(0)
    setStepCadenceSpm(0)
    setCurrentPaceFormatted(`— /${distanceUnit}`)
    setAveragePaceFormatted(`— /${distanceUnit}`)
    setSplits([])
    setGpsErrorMessage(null)

    void requestScreenWakeLock()

    // Request iOS motion sensor permission on direct user gesture tap
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        void (DeviceMotionEvent as any).requestPermission().catch(() => {})
      } catch {}
    }

    // Unlock AudioContext and configure transient AudioSession for smooth ducking
    if (isMusicDuckingActive) {
      configureCardioAudioSession('transient')
      clearCardioMediaSession()
    }
    const ctx = getSharedAudioContext()
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume()
    }

    playIntervalBell(currentSegment.segmentType === 'work')
    // Speak initial intro + first segment cue
    const firstCue = currentSegment.voiceCues.startCue || session.personalizedIntro
    speakCue(firstCue)
  }

  // Pause / Resume
  const handleTogglePlayPause = () => {
    if (!hasStarted) {
      handleStartSession()
      return
    }
    if (isPlaying) {
      pauseSession()
    } else {
      resumeSession()
    }
  }

  // Rewind current interval by 15 seconds
  const handleRewind15 = () => {
    if (sessionStartTimestampRef.current !== null) {
      const now = Date.now()
      const effectivePaused = pauseStartTimestampRef.current ? (now - pauseStartTimestampRef.current) : 0
      const currentElapsed = Math.max(0, Math.floor((now - sessionStartTimestampRef.current - pausedAccumulatedMsRef.current - effectivePaused) / 1000))
      const newElapsed = Math.max(0, currentElapsed - 15)
      sessionStartTimestampRef.current = now - (newElapsed * 1000) - pausedAccumulatedMsRef.current - effectivePaused
      reconcileTimer()
    } else {
      setSegmentElapsedSeconds(prev => Math.max(0, prev - 15))
      setTotalElapsedSeconds(prev => Math.max(0, prev - 15))
    }
  }

  // Trigger Spontaneous "Swift Kick in the Butt"
  const handleSwiftKick = async () => {
    setIsSwiftKickActive(true)
    const kickText = await playSpontaneousSwiftKick({
      voiceId: voiceIdOverride,
      onStart: () => setIsSpeaking(true),
      onEnded: () => {
        setIsSpeaking(false)
        setIsSwiftKickActive(false)
      },
    })
    setCurrentSubtitle(kickText)
  }

  // Auto-log to cardio_logs database table & sync to Apple Health
  const handleLogCardioSession = async () => {
    setIsSavingLog(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const durationMinsToLog = Math.max(1, Math.round(totalElapsedSeconds / 60))
      const totalCalories = (liveCal.caloriesBurned || 0) + (executiveReport?.epocAfterburnCalories || 0)

      const distKmToLog = isDistanceTrackingEnabled && distanceMetersRef.current > 10
        ? Number((distanceMetersRef.current / 1000).toFixed(2))
        : null
      const distMilesToLog = isDistanceTrackingEnabled && distanceMetersRef.current > 10
        ? Number((distanceMetersRef.current * 0.000621371).toFixed(2))
        : undefined

      const distanceTelemetryNote = distKmToLog
        ? ` Distance: ${distKmToLog} km (${distMilesToLog} mi). Steps: ${stepCountRef.current.toLocaleString()}.${averagePaceFormatted !== '— /mi' && averagePaceFormatted !== '— /km' ? ` Avg Pace: ${averagePaceFormatted}.` : ''}`
        : ''

      const res = await fetch('/api/fitness/cardio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_date: today,
          activity_type: selectedModality,
          duration_mins: durationMinsToLog,
          distance_km: distKmToLog,
          avg_heart_rate: hasMeasuredHr ? effectiveBpm : null,
          calories: totalCalories,
          perceived_effort: Math.round(session.avgRpe),
          notes: `AI Coach Gordon Voiceover: ${session.pattern.name} (${durationMinsToLog}m). Modality: ${selectedModality}.${distanceTelemetryNote} Avg RPE: ${session.avgRpe}. Peak RPE: ${session.maxRpe}. EPOC Afterburn: +${executiveReport?.epocAfterburnCalories || 0} kcal.`,
        }),
      })

      if (res.ok) {
        setLogSavedSuccess(true)
        onSessionLogged?.({
          duration_mins: durationMinsToLog,
          activity_type: selectedModality,
          perceived_effort: Math.round(session.avgRpe),
          calories: totalCalories,
        })
      }

      // Sync to Apple Health via unified native bridge
      try {
        const syncResult = await syncActivityToAppleHealth({
          type: 'cardio',
          modality: selectedModality,
          durationMinutes: durationMinsToLog,
          calories: totalCalories,
          distanceMiles: distMilesToLog,
          avgHeartRate: hasMeasuredHr ? effectiveBpm : undefined,
        })
        if (syncResult.synced) {
          setAppleHealthSyncMessage(
            syncResult.source === 'native-healthkit'
              ? '✓ Synced to Apple Health'
              : '✓ Synced to Wearables'
          )
        }
      } catch (healthErr) {
        console.warn('[CoachCardioVoiceoverPlayer] Apple Health sync non-fatal error:', healthErr)
      }
    } catch {
      // Fallback
    } finally {
      setIsSavingLog(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void releaseScreenWakeLock()
      stopCardioVoiceCue()
      clearCardioMediaSession()
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current)
      }
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Color according to RPE zone
  const getRpeColor = (rpe: number) => {
    if (rpe <= 3) return '#10B981' // Green (Recovery)
    if (rpe <= 5) return '#06B6D4' // Cyan (Zone 2 Base)
    if (rpe <= 7) return '#F59E0B' // Amber (Tempo / Threshold)
    if (rpe <= 8) return '#F97316' // Orange (Lactate)
    return '#EF4444' // Crimson (VO2 / Sprint)
  }

  // Safe close handler that warns athlete if a workout is actively running
  const handleSafeClose = () => {
    if (hasStarted && isPlaying && !sessionCompleted) {
      pauseSession()
      const confirmExit =
        typeof window !== 'undefined'
          ? window.confirm('Your cardio session is currently in progress. Do you want to pause and exit?')
          : true
      if (!confirmExit) {
        resumeSession()
        return
      }
    }
    void releaseScreenWakeLock()
    stopCardioVoiceCue()
    clearCardioMediaSession()
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Coach Gordon Cardio Studio"
      data-hydrated={isHydrated ? "true" : "false"}
      className="coach-cardio-modal-shell"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #0A0F1D 0%, #060913 100%)',
        border: '1px solid rgba(212,160,23,0.35)',
        borderRadius: 'clamp(12px, 3vw, 18px)',
        color: '#FFFFFF',
        boxShadow: '0 16px 40px rgba(0,0,0,0.85), 0 0 30px rgba(212,160,23,0.15)',
        maxWidth: 780,
        width: '100%',
        maxHeight: 'min(94dvh, 880px)',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .coach-cardio-scroll-body {
          flex: 1 1 auto;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding: clamp(12px, 2.5vw, 20px);
        }
        .coach-cardio-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 20px);
          background: rgba(10,15,29,0.98);
          flex-shrink: 0;
        }
        .coach-cardio-footer-bar {
          flex-shrink: 0;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 20px) calc(clamp(12px, 2.5vw, 18px) + env(safe-area-inset-bottom, 16px));
          background: rgba(6,9,19,0.98);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .coach-cardio-hud-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          align-items: stretch;
          margin-bottom: 16px;
        }
        .coach-cardio-presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
          gap: 8px;
          margin-top: 6px;
        }
        @media (max-width: 768px) {
          .coach-cardio-modal-shell {
            max-height: calc(100dvh - env(safe-area-inset-top, 8px) - 20px) !important;
            margin-bottom: max(6px, env(safe-area-inset-bottom, 12px)) !important;
          }
          .coach-cardio-footer-bar {
            padding-bottom: calc(18px + env(safe-area-inset-bottom, 20px)) !important;
          }
        }
        @media (max-width: 640px) {
          .coach-cardio-hud-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .coach-cardio-header-bar {
            gap: 8px !important;
          }
          .coach-cardio-header-actions {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .coach-cardio-breath-outer {
            width: 105px !important;
            height: 105px !important;
          }
          .coach-cardio-breath-inner {
            width: 72px !important;
            height: 72px !important;
          }
          .coach-cardio-hud-left {
            min-height: auto !important;
          }
          .coach-cardio-hud-right {
            min-height: auto !important;
          }
        }
      `}</style>

      {/* ── Studio Header Bar ────────────────────────────────────────── */}
      <div className="coach-cardio-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4AF37 0%, #856404 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(212,160,23,0.5)',
              flexShrink: 0,
            }}
          >
            <GaaIcon name="headphones" size={20} tone="dark" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#D4AF37',
                  whiteSpace: 'nowrap',
                }}
              >
                {hasStarted ? 'LIVE WORKOUT' : 'AI Coach Gordon'}
              </span>
              <span
                style={{
                  fontSize: 9,
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.4)',
                  color: '#34D399',
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                Neural Audio
              </span>

              {isBtConnected && (
                <span
                  style={{
                    fontSize: 9,
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#F87171',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ animation: 'pulse 1s infinite' }}>●</span> HR Sync
                </span>
              )}
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 'clamp(16px, 3.5vw, 20px)',
                margin: '1px 0 0',
                color: '#FFFFFF',
                letterSpacing: '0.03em',
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.pattern.name}
            </h3>
          </div>
        </div>

        {/* Quick Controls: Bluetooth HR, Hands-Free Voice, Music, Mute, Close */}
        <div className="coach-cardio-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Bluetooth HR Connect */}
          <button
            type="button"
            onClick={connectBluetoothHeartRate}
            disabled={isBtConnected || isBtConnecting}
            style={{
              background: isBtConnected ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              border: isBtConnected ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.15)',
              color: isBtConnected ? '#F87171' : 'var(--gray-lt)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: isBtConnected ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Connect Bluetooth Heart Rate Monitor (Polar, Garmin, Wahoo, Apple Watch)"
          >
            <GaaIcon name="heart-rate" size={12} tone={isBtConnected ? 'ruby' : 'inherit'} />
            <span>{isBtConnecting ? 'Pairing...' : isBtConnected ? `${liveBpm || '--'} BPM` : 'Pair HR'}</span>
          </button>

          {/* Hands-Free Voice Copilot Toggle */}
          <button
            type="button"
            onClick={() => setIsVoiceCopilotEnabled(prev => !prev)}
            style={{
              background: isVoiceCopilotEnabled ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
              border: isVoiceCopilotEnabled ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.15)',
              color: isVoiceCopilotEnabled ? '#38BDF8' : 'var(--gray-lt)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Hands-Free Two-Way Voice: Speak to Coach Gordon while running or rowing"
          >
            <GaaIcon name={isVoiceCopilotEnabled ? 'mic' : 'mic-off'} size={12} tone={isVoiceCopilotEnabled ? 'cyan' : 'inherit'} />
            <span>{isVoiceCopilotEnabled ? 'Mic On' : 'Mic'}</span>
          </button>

          {/* Curated Spotify Cadence Launcher */}
          <button
            type="button"
            onClick={handleLaunchCadenceSpotify}
            style={{
              background: 'rgba(29,185,84,0.12)',
              border: '1px solid rgba(29,185,84,0.3)',
              color: '#1DB954',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Launch GAA Curated 124–128 BPM Zone 2 Cadence Music (With Auto-Ducking)"
          >
            <GaaIcon name="music" size={12} tone="emerald" />
            <span>126 BPM</span>
          </button>

          {/* Music Ducking Mode Toggle */}
          <button
            type="button"
            onClick={toggleMusicDucking}
            style={{
              background: isMusicDuckingActive ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.06)',
              border: isMusicDuckingActive ? '1px solid rgba(56,189,248,0.45)' : '1px solid rgba(255,255,255,0.15)',
              color: isMusicDuckingActive ? '#38BDF8' : 'var(--gray)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            title={
              isMusicDuckingActive
                ? 'Music Ducking ON: Coach Gordon ducks your background music (Spotify/Apple Music) during speech without stopping it (Recommended)'
                : 'Lock Screen Session ON: Lock-screen MediaSession timer enabled (may pause external music apps)'
            }
          >
            <span style={{ fontSize: 11 }}>🦆</span>
            <span>{isMusicDuckingActive ? 'Ducking On' : 'Lock Screen'}</span>
          </button>

          {/* In-Pocket Touch Shield Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsPocketLockActive(true)
              void requestScreenWakeLock()
            }}
            style={{
              background: isPocketLockActive ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.06)',
              border: isPocketLockActive ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.15)',
              color: isPocketLockActive ? '#D4AF37' : 'var(--gray)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            title="In-Pocket Touch Shield: Keeps screen awake on pure black OLED display to prevent accidental pocket taps while walking or running"
          >
            <GaaIcon name="lock" size={12} tone={isPocketLockActive ? 'gold' : 'inherit'} />
            <span>{isPocketLockActive ? 'Shielded' : 'Pocket Lock'}</span>
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            onClick={() => setIsVoiceMuted(prev => !prev)}
            title={isVoiceMuted ? 'Unmute Coach Voice' : 'Mute Coach Voice'}
            style={{
              background: isVoiceMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
              border: isVoiceMuted ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.15)',
              color: isVoiceMuted ? '#EF4444' : 'var(--gold-lt)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GaaIcon name={isVoiceMuted ? 'volume-x' : 'volume-2'} size={12} tone="inherit" />
            <span>{isVoiceMuted ? 'Muted' : 'Sound'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={handleSafeClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--gray)',
                borderRadius: 8,
                padding: '5px 9px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              aria-label="Close Studio"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Body Area ─────────────────────────────────────── */}
      <div className="coach-cardio-scroll-body">
        {/* ── Music Ducking Status Toast ──────────────────────────────── */}
        {musicDuckingToast && (
          <div
            style={{
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid #38BDF8',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(56,189,248,0.25)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: 13 }}>🦆</span>
            <span>{musicDuckingToast}</span>
          </div>
        )}

        {/* ── Hands-Free Voice Response Toast ──────────────────────────── */}
        {lastVoiceFeedback && (
          <div
            style={{
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid #38BDF8',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 14,
              fontSize: 11.5,
              color: '#38BDF8',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <GaaIcon name="mic" size={13} tone="cyan" />
            <span>{lastVoiceFeedback} &mdash; Coach Gordon responding in your ear...</span>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            STATE 1: WORKOUT SUMMARY
            ═════════════════════════════════════════════════════════════════ */}
        {sessionCompleted && executiveReport ? (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14,23,38,0.98) 0%, rgba(8,14,24,0.98) 100%)',
              border: '1px solid #10B981',
              borderRadius: 14,
              padding: 'clamp(14px, 3vw, 20px)',
              animation: 'fadeIn 0.4s ease',
              boxShadow: '0 0 40px rgba(16,185,129,0.25)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GaaIcon name="trophy" size={22} tone="gold" />
                <div>
                  <span style={{ fontSize: 10, color: '#34D399', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Forge Athletic &middot; Workout summary
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.03em', margin: '2px 0 0', color: '#FFFFFF' }}>
                    SESSION ACCOMPLISHED: {session.pattern.name}
                  </h3>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10.5, color: 'var(--gold-lt)', fontWeight: 800 }}>
                  Breathing consistency: {executiveReport.respiratoryComplianceScore}%
                </span>
              </div>
            </div>

            {/* Metric Cards (Duration, Distance, Steps, Burn, RPE) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: 8, margin: '14px 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Workout time</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginTop: 2 }}>
                  {executiveReport.totalDurationMins} <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>MINS</span>
                </div>
              </div>

              {executiveReport.formattedDistance && (
                <div style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--gold-lt)', textTransform: 'uppercase' }}>Distance Traveled</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#D4AF37', lineHeight: 1.1, marginTop: 2 }}>
                    {executiveReport.formattedDistance}
                  </div>
                  {executiveReport.formattedAveragePace && (
                    <div style={{ fontSize: 9.5, color: '#38BDF8', marginTop: 2, fontFamily: 'var(--font-telemetry, monospace)' }}>
                      Avg: {executiveReport.formattedAveragePace}
                    </div>
                  )}
                </div>
              )}

              {executiveReport.totalSteps !== undefined && executiveReport.totalSteps > 0 && (
                <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, color: '#34D399', textTransform: 'uppercase' }}>Tracked Steps</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#34D399', lineHeight: 1.1, marginTop: 2 }}>
                    {executiveReport.totalSteps.toLocaleString()}
                  </div>
                  {executiveReport.avgCadenceSpm !== undefined && executiveReport.avgCadenceSpm > 0 && (
                    <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>
                      {executiveReport.avgCadenceSpm} SPM Avg
                    </div>
                  )}
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Calories burned</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#34D399', lineHeight: 1.1, marginTop: 2 }}>
                  {executiveReport.totalCaloriesBurned} <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>KCAL</span>
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--gold-lt)', marginTop: 2 }}>
                  +{executiveReport.epocAfterburnCalories} kcal estimated after exercise
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Effort &amp; Peak RPE</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: '#F59E0B', lineHeight: 1.1, marginTop: 2 }}>
                  {executiveReport.averageRpe} <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>AVG</span> / {executiveReport.peakRpe} <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>PEAK</span>
                </div>
              </div>
            </div>

            {/* Split Mile / Km Milestones if any */}
            {splits.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 800 }}>
                  Completed {distanceUnit === 'mi' ? 'Mile' : 'Kilometer'} Splits:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {splits.map(sp => (
                    <div
                      key={sp.splitNumber}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(212,160,23,0.3)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: '#D4AF37', fontWeight: 800 }}>
                        {sp.splitType === 'mile' ? `Mile ${sp.splitNumber}` : `Km ${sp.splitNumber}`}
                      </span>
                      <span style={{ color: '#FFFFFF', fontFamily: 'var(--font-telemetry, monospace)' }}>
                        {sp.formattedPace}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time-in-Zone Bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 5 }}>
                <span style={{ color: 'var(--gray)' }}>Time-In-Zone Distribution:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                  Z1: {executiveReport.zone1Percent}% &middot; Z2: {executiveReport.zone2Percent}% &middot; Z3: {executiveReport.zone3Percent}%
                </span>
              </div>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                <div style={{ flex: executiveReport.zone1Percent || 1, background: '#10B981' }} title="Zone 1 Recovery" />
                <div style={{ flex: executiveReport.zone2Percent || 1, background: '#06B6D4' }} title="Zone 2 Base" />
                <div style={{ flex: executiveReport.zone3Percent || 1, background: '#EF4444' }} title="Zone 3 Anaerobic" />
              </div>
            </div>

            {/* Coach Gordon Audio Debrief Transcript Box */}
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Coach Gordon In-Ear Debrief &amp; Recovery Window:
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#E2E8F0', lineHeight: 1.4, fontStyle: 'italic' }}>
                &ldquo;{executiveReport.postSessionCoachDebriefVoiceScript}&rdquo;
              </p>
            </div>
          </div>
        ) : !hasStarted ? (
          /* ═════════════════════════════════════════════════════════════════
             STATE 2: PRE-SESSION SETUP & LAUNCH SCREEN
             ═════════════════════════════════════════════════════════════════ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Pattern Selector */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 'clamp(12px, 2.5vw, 16px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Select Cardio Prescription Protocol:
                </label>
                <span style={{ fontSize: 10, color: 'var(--gray)' }}>6 Prescriptions</span>
              </div>
              <div className="coach-cardio-presets-grid">
                {Object.values(CARDIO_PATTERNS).map(pat => {
                  const isSelected = selectedPatternId === pat.id
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatternId(pat.id)
                        setDurationMinutes(pat.defaultDurationMins)
                      }}
                      className="tactile-btn"
                      style={{
                        background: isSelected ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        textAlign: 'left',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 0 12px rgba(212,160,23,0.25)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: isSelected ? '#D4AF37' : '#FFFFFF' }}>
                        {pat.name}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>
                        RPE {pat.targetRpeRange[0]}–{pat.targetRpeRange[1]} &middot; {pat.defaultDurationMins}m
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Duration & Equipment Modality Row */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 'clamp(12px, 2.5vw, 16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {/* Duration Pills */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Session Duration:
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(session.pattern.allowedDurations || [10, 15, 20, 30, 45]).map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className="tactile-btn"
                      style={{
                        background: durationMinutes === mins ? 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)' : 'rgba(255,255,255,0.05)',
                        color: durationMinutes === mins ? '#0A0E18' : '#FFFFFF',
                        border: durationMinutes === mins ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        minWidth: 44,
                      }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment Modality Selector */}
              <div style={{ minWidth: 200, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Equipment &amp; Modality:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFormGuide(prev => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38BDF8',
                      fontSize: 10.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {showFormGuide ? 'Hide Form Directives' : 'View Form Directives'}
                  </button>
                </div>

                <select
                  value={selectedModality}
                  onChange={e => setSelectedModality(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: '1px solid rgba(212,160,23,0.4)',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: 12,
                  }}
                >
                  {MODALITY_OPTIONS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>

                {/* Distance & Step Tracking Toggle */}
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isDistanceTrackingEnabled ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
                    border: isDistanceTrackingEnabled ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 160 }}>
                    <span style={{ fontSize: 13 }}>{isDistanceTrackingEnabled ? '🛰️' : '⚙️'}</span>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: isDistanceTrackingEnabled ? '#38BDF8' : 'var(--gray-lt)' }}>
                        {isDistanceTrackingEnabled ? 'Track Distance & Steps (GPS)' : 'Stationary Mode (GPS Off)'}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--gray)' }}>
                        {isDistanceTrackingEnabled
                          ? 'Tracks live distance, pace, footsteps & cadence'
                          : 'Stationary piece of cardio equipment'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isDistanceTrackingEnabled && (
                      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 5, padding: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                          type="button"
                          onClick={() => setDistanceUnit('mi')}
                          style={{
                            background: distanceUnit === 'mi' ? '#D4AF37' : 'transparent',
                            color: distanceUnit === 'mi' ? '#0A0E18' : 'var(--gray)',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          MI
                        </button>
                        <button
                          type="button"
                          onClick={() => setDistanceUnit('km')}
                          style={{
                            background: distanceUnit === 'km' ? '#D4AF37' : 'transparent',
                            color: distanceUnit === 'km' ? '#0A0E18' : 'var(--gray)',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          KM
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsDistanceTrackingEnabled(prev => !prev)}
                      style={{
                        background: isDistanceTrackingEnabled ? '#0284C7' : 'rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 9px',
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {isDistanceTrackingEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Biomechanical Form Guide Drawer */}
            {showFormGuide && (
              <div
                style={{
                  background: 'rgba(56,189,248,0.06)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 11.5,
                  color: 'var(--gray-lt)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ fontWeight: 800, color: '#38BDF8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <GaaIcon name="sparkles" size={13} tone="gold" />
                  <span>Coach Gordon Form Focus: {formTips.equipmentName}</span>
                </div>
                <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: 6 }}>
                  &ldquo;{formTips.primaryFormTip}&rdquo;
                </div>
                <ul style={{ margin: '0 0 6px', paddingLeft: 18, lineHeight: 1.4 }}>
                  {formTips.formDirectives.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
                <div style={{ fontSize: 10.5, color: '#F87171' }}>
                  <strong>Common Flaw to Avoid:</strong> {formTips.commonMistake}
                </div>
              </div>
            )}

            {/* Session Strategy & Cadence Flow Preview */}
            <div
              style={{
                background: 'rgba(212,160,23,0.05)',
                border: '1px solid rgba(212,160,23,0.22)',
                borderRadius: 12,
                padding: 'clamp(12px, 2.5vw, 16px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#D4AF37' }}>
                  Prescribed Session Blueprint
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                  {session.intervals.length} Segments &middot; {durationMinutes} Minutes
                </span>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                {session.pattern.name} &mdash; {session.pattern.subtitle}
              </div>

              {/* Mini interval blocks preview */}
              <div style={{ display: 'flex', gap: 3, height: 8, margin: '10px 0 6px', borderRadius: 4, overflow: 'hidden' }}>
                {session.intervals.map(seg => (
                  <div
                    key={seg.id}
                    style={{
                      flex: seg.durationSeconds,
                      background: getRpeColor(seg.targetRpe),
                      borderRadius: 2,
                    }}
                    title={`${seg.title} (${Math.round(seg.durationSeconds / 60)}m, RPE ${seg.targetRpe})`}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--gray)', marginBottom: 8 }}>
                <span>Start: Warmup (RPE {session.intervals[0]?.targetRpe || 3})</span>
                <span>Peak Target: RPE {session.maxRpe}</span>
                <span>Finish: Flush</span>
              </div>

              {/* Cadence Anchor Preview */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>
                    {cadenceGuidance.modalityCategory === 'rowing'
                      ? '🚣'
                      : cadenceGuidance.modalityCategory === 'cycling'
                      ? '🚴'
                      : cadenceGuidance.modalityCategory === 'stairmaster'
                      ? '🪜'
                      : '🏃'}
                  </span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase' }}>
                      Rhythm Pacing: {cadenceGuidance.ratioLabel}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--gray)' }}>
                      {cadenceGuidance.rhythmicCadencePattern}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 9.5, color: 'var(--gray-lt)', fontStyle: 'italic', maxWidth: 280 }}>
                  &ldquo;{cadenceGuidance.inPocketDirective}&rdquo;
                </div>
              </div>

              {/* Coach Gordon In-Ear Opening Script Preview */}
              <div style={{ marginTop: 8, fontSize: 10.5, color: '#E2E8F0', fontStyle: 'italic', lineHeight: 1.3 }}>
                Coach Gordon Opening Cue: &ldquo;{session.personalizedIntro}&rdquo;
              </div>
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════
             STATE 3: ACTIVE WORKOUT HUD (MOBILE-FIRST RESPONSIVE)
             ═════════════════════════════════════════════════════════════════ */
          <div>
            {/* Top Glanceable Status Strip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '8px 12px',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 900,
                    background: 'rgba(212,160,23,0.15)',
                    color: '#D4AF37',
                    padding: '2px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  Segment {currentSegmentIndex + 1} of {session.intervals.length}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontSize: 15,
                    color: '#FFFFFF',
                    letterSpacing: '0.02em',
                  }}
                >
                  {currentSegment.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10.5, color: getRpeColor(currentSegment.targetRpe), fontWeight: 800 }}>
                  {currentBreathing.intensityLabel}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                  Total: {formatTime(totalRemainingSeconds)} left
                </span>
              </div>
            </div>

            {/* ── Main Active Workout HUD Grid ─────────────────────────────── */}
            <div className="coach-cardio-hud-grid">
              {/* Card 1: Interval Countdown Hero & Live Biometrics */}
              <div
                className="coach-cardio-hud-right"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: 'clamp(12px, 2.5vw, 16px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  minHeight: 230,
                }}
              >
                {/* Large Monospace Countdown */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${getRpeColor(currentSegment.targetRpe)}40`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Interval Remaining
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontSize: 'clamp(32px, 6vw, 42px)',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                      marginTop: 2,
                    }}
                  >
                    {formatTime(segmentRemainingSeconds)}
                  </div>
                </div>

                {/* GPS Status & Unit Strip (when distance tracking is active) */}
                {isDistanceTrackingEnabled && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '5px 10px',
                      fontSize: 10.5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background:
                            gpsStatus === 'locked'
                              ? '#34D399'
                              : gpsStatus === 'paused'
                              ? '#F59E0B'
                              : gpsStatus === 'error'
                              ? '#EF4444'
                              : '#38BDF8',
                          boxShadow:
                            gpsStatus === 'locked'
                              ? '0 0 8px #34D399'
                              : gpsStatus === 'error'
                              ? '0 0 8px #EF4444'
                              : '0 0 8px #38BDF8',
                          animation: gpsStatus === 'requesting' || gpsStatus === 'acquiring' ? 'pulse 1.2s infinite' : 'none',
                        }}
                      />
                      <span style={{ fontWeight: 700, color: gpsStatus === 'locked' ? '#34D399' : '#FFFFFF' }}>
                        {gpsStatus === 'locked'
                          ? `GPS Locked (${gpsAccuracy !== null ? `±${gpsAccuracy}m` : 'High Acc.'})`
                          : gpsStatus === 'paused'
                          ? 'GPS Paused'
                          : gpsStatus === 'error'
                          ? 'GPS Offline'
                          : 'Acquiring GPS Signal...'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setDistanceUnit(u => (u === 'mi' ? 'km' : 'mi'))}
                        style={{
                          background: 'rgba(212,160,23,0.15)',
                          border: '1px solid #D4AF37',
                          color: '#D4AF37',
                          borderRadius: 4,
                          padding: '2px 7px',
                          fontSize: 9.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Unit: {distanceUnit.toUpperCase()}
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Biometrics & Locomotion Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isDistanceTrackingEnabled ? 'repeat(2, 1fr)' : '1fr 1fr',
                    gap: 8,
                  }}
                >
                  {/* Heart Rate */}
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: hasMeasuredHr ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <span style={{ animation: hasMeasuredHr ? 'pulse 1s infinite' : 'none' }}>
                          <GaaIcon name="heart-rate" size={11} tone={hasMeasuredHr ? 'ruby' : 'inherit'} />
                        </span>
                        <span>{hasMeasuredHr ? 'Live HR' : 'Est. HR'}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: hasMeasuredHr ? '#F87171' : 'var(--gold)', lineHeight: 1.1, marginTop: 2 }}>
                        {hasMeasuredHr ? effectiveBpm : `~${effectiveBpm}`} <span style={{ fontSize: 10, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>BPM</span>{' '}
                        <span style={{ fontSize: 10, color: '#38BDF8', fontFamily: 'var(--font-telemetry, monospace)' }}>({currentHrPct}%)</span>
                      </div>
                    </div>

                  {/* Calories */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase' }}>Burned</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: '#34D399', lineHeight: 1.1, marginTop: 2 }}>
                      {liveCal.caloriesBurned} <span style={{ fontSize: 10, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>KCAL</span>
                    </div>
                  </div>

                  {/* Distance & Pace Tiles (Outdoor Mode) */}
                  {isDistanceTrackingEnabled && (
                    <>
                      {/* Distance */}
                      <div
                        style={{
                          background: 'rgba(212,160,23,0.05)',
                          border: '1px solid rgba(212,160,23,0.25)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 9, color: 'var(--gold-lt)', textTransform: 'uppercase' }}>Distance</div>
                        <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: '#D4AF37', lineHeight: 1.1, marginTop: 2 }}>
                          {(distanceMeters * (distanceUnit === 'mi' ? 0.000621371 : 0.001)).toFixed(2)}{' '}
                          <span style={{ fontSize: 10, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>
                            {distanceUnit.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Pace & Steps */}
                      <div
                        style={{
                          background: 'rgba(56,189,248,0.05)',
                          border: '1px solid rgba(56,189,248,0.25)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 9, color: '#38BDF8', textTransform: 'uppercase' }}>
                          {stepCount > 0 ? `${stepCount.toLocaleString()} Steps` : 'Pace'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 17, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginTop: 2 }}>
                          {currentPaceFormatted}
                        </div>
                        {stepCadenceSpm > 0 && (
                          <div style={{ fontSize: 9, color: 'var(--gray)', marginTop: 1 }}>
                            {stepCadenceSpm} SPM Cadence
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* RPE Exertion Visual Meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--gray)', fontWeight: 700 }}>
                      RATE OF PERCEIVED EXERTION
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-telemetry, monospace)',
                        fontSize: 18,
                        fontWeight: 700,
                        color: getRpeColor(currentSegment.targetRpe),
                        lineHeight: 1,
                      }}
                    >
                      RPE {currentSegment.targetRpe} <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>/ 10</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 3, height: 10 }}>
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const barRpe = idx + 1
                      const isActive = barRpe <= currentSegment.targetRpe
                      return (
                        <div
                          key={barRpe}
                          style={{
                            flex: 1,
                            borderRadius: 2,
                            background: isActive ? getRpeColor(barRpe) : 'rgba(255,255,255,0.08)',
                            transition: 'background 0.3s ease',
                            boxShadow: isActive && barRpe === currentSegment.targetRpe ? `0 0 8px ${getRpeColor(barRpe)}` : 'none',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Card 2: Live Breathing Pacer & Biological Cue */}
              <div
                className="coach-cardio-hud-left"
                style={{
                  background: 'rgba(0,0,0,0.45)',
                  border: `1px solid ${getRpeColor(currentSegment.targetRpe)}50`,
                  borderRadius: 14,
                  padding: 'clamp(12px, 2.5vw, 16px)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 230,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 900,
                    color: getRpeColor(currentSegment.targetRpe),
                  }}
                >
                  Target Respiratory Cadence
                </div>

                {/* Animated Breath Ring */}
                <div
                  className="coach-cardio-breath-outer"
                  style={{
                    width: 125,
                    height: 125,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    margin: '6px 0',
                  }}
                >
                  {/* Outer expanding ring */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: `2px solid ${getRpeColor(currentSegment.targetRpe)}`,
                      transform: breathPhase === 'inhale' ? 'scale(1.22)' : 'scale(0.88)',
                      opacity: breathPhase === 'inhale' ? 0.9 : 0.4,
                      transition: `all ${
                        breathPhase === 'inhale'
                          ? currentBreathing.inBreathSeconds || 2
                          : currentBreathing.outBreathSeconds || 2
                      }s cubic-bezier(0.4, 0, 0.2, 1)`,
                      boxShadow: `0 0 20px ${getRpeColor(currentSegment.targetRpe)}40`,
                    }}
                  />

                  {/* Inner Core */}
                  <div
                    className="coach-cardio-breath-inner"
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${getRpeColor(currentSegment.targetRpe)}35 0%, rgba(0,0,0,0.8) 100%)`,
                      border: `1px solid ${getRpeColor(currentSegment.targetRpe)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: breathPhase === 'inhale' ? 'scale(1.08)' : 'scale(0.96)',
                      transition: `all ${
                        breathPhase === 'inhale'
                          ? currentBreathing.inBreathSeconds || 2
                          : currentBreathing.outBreathSeconds || 2
                      }s ease-in-out`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans, Raleway), sans-serif',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {breathPhase === 'inhale' ? 'BREATHE IN' : 'EXHALE'}
                    </span>
                    <span style={{ fontSize: 8.5, color: 'var(--gold-lt)', fontWeight: 700 }}>
                      {breathPhase === 'inhale' ? 'Inhale Nose' : 'Exhale Mouth'}
                    </span>
                  </div>
                </div>

                {/* Respiratory Sensation Guidance */}
                <div style={{ maxWidth: 300 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.25 }}>
                    &ldquo;{currentBreathing.primaryRespiratoryCue}&rdquo;
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>
                    <strong>Talk Test:</strong> {currentBreathing.talkTest}
                  </div>
                </div>

                {/* In-Pocket Locomotor Cadence Anchor */}
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(212,160,23,0.06)',
                    border: '1px solid rgba(212,160,23,0.22)',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12 }}>
                        {cadenceGuidance.modalityCategory === 'rowing'
                          ? '🚣'
                          : cadenceGuidance.modalityCategory === 'cycling'
                          ? '🚴'
                          : cadenceGuidance.modalityCategory === 'stairmaster'
                          ? '🪜'
                          : '🏃'}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 900,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#D4AF37',
                        }}
                      >
                        In-Pocket Cadence
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakCue(cadenceGuidance.inEarSpokenGuidance)}
                      disabled={isVoiceMuted}
                      title="Play Coach Gordon cadence pacing cue into earbuds"
                      style={{
                        background: 'linear-gradient(135deg, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.1) 100%)',
                        border: '1px solid rgba(212,160,23,0.4)',
                        color: '#FFFFFF',
                        borderRadius: 6,
                        padding: '2px 7px',
                        fontSize: 9.5,
                        fontWeight: 800,
                        cursor: isVoiceMuted ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        opacity: isVoiceMuted ? 0.4 : 1,
                      }}
                    >
                      <span>🔊</span> Cue Rhythm
                    </button>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontSize: 14,
                      letterSpacing: '0.03em',
                      color: '#FFFFFF',
                      lineHeight: 1.15,
                      marginTop: 2,
                    }}
                  >
                    {cadenceGuidance.ratioLabel} &middot; <span style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 600, fontFamily: 'var(--font-sans, Raleway), sans-serif' }}>{cadenceGuidance.rhythmicCadencePattern}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Coach Subtitle Banner & Speech Waves ──────────────────────── */}
            <div
              style={{
                background: 'rgba(10,16,28,0.85)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 10,
                padding: '8px 12px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isSpeaking ? '#34D399' : isPlaying ? '#D4AF37' : '#94A3B8',
                    boxShadow: isSpeaking ? '0 0 10px #34D399' : 'none',
                  }}
                />
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  {isSpeaking ? 'Coach Gordon' : 'Coach Audio'}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11.5,
                    color: '#FFFFFF',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentSubtitle ? `"${currentSubtitle}"` : session.personalizedIntro}
                </p>
              </div>

              {/* Swift Kick "Need A Push" Button */}
              <button
                type="button"
                onClick={handleSwiftKick}
                disabled={!hasStarted || isSwiftKickActive}
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: hasStarted ? 'pointer' : 'not-allowed',
                  opacity: hasStarted ? 1 : 0.5,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                  flexShrink: 0,
                }}
              >
                <GaaIcon name="flame" size={12} tone="white" />
                <span>Need a Push</span>
              </button>
            </div>

            {/* ── Segmented Timeline Progress Bar ──────────────────────────── */}
            <div>
              <div style={{ display: 'flex', gap: 3, height: 6, marginBottom: 5 }}>
                {session.intervals.map((seg, idx) => {
                  const isCompleted = idx < currentSegmentIndex
                  const isCurrent = idx === currentSegmentIndex
                  return (
                    <div
                      key={seg.id}
                      style={{
                        flex: seg.durationSeconds,
                        background: isCompleted
                          ? '#10B981'
                          : isCurrent
                          ? getRpeColor(seg.targetRpe)
                          : 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        boxShadow: isCurrent ? `0 0 6px ${getRpeColor(seg.targetRpe)}` : 'none',
                      }}
                    />
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--gray)' }}>
                <span>Start ({session.intervals[0]?.title})</span>
                <span>
                  Upcoming: {session.intervals[currentSegmentIndex + 1]?.title || 'Finish'} (RPE{' '}
                  {session.intervals[currentSegmentIndex + 1]?.targetRpe || 2})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Pinned Bottom Action / Transport Bar ─────────────────────── */}
      <div className="coach-cardio-footer-bar">
        {sessionCompleted && executiveReport ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => speakCue(executiveReport.postSessionCoachDebriefVoiceScript)}
              style={{
                background: 'rgba(212,160,23,0.15)',
                border: '1px solid #D4AF37',
                color: '#D4AF37',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name="volume-2" size={13} tone="gold" />
              <span>Replay Debrief</span>
            </button>

            <button
              type="button"
              onClick={handleLogCardioSession}
              disabled={isSavingLog || logSavedSuccess}
              className="tactile-btn"
              style={{
                background: logSavedSuccess ? '#10B981' : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#0A0E18',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 900,
                cursor: logSavedSuccess ? 'default' : 'pointer',
                boxShadow: '0 4px 14px rgba(212,160,23,0.35)',
              }}
            >
              {isSavingLog ? 'Saving...' : logSavedSuccess ? '✓ Saved to Training Log' : 'Save to Cardio Log'}
            </button>

            {appleHealthSyncMessage && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  color: '#34D399',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                <span>🍎</span> {appleHealthSyncMessage}
              </span>
            )}

            {(onFlowToCoolDown || onFlowToMindfulness) && (
              <button
                type="button"
                onClick={async () => {
                  if (!logSavedSuccess && !isSavingLog) {
                    void handleLogCardioSession()
                  }
                  if (onFlowToCoolDown) {
                    onFlowToCoolDown()
                  } else if (onFlowToMindfulness) {
                    onFlowToMindfulness()
                  }
                }}
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(52,211,153,0.4)',
                  borderRadius: 6,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                }}
              >
                <span>❄️ Flow to Cool-Down</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            )}
          </div>
        ) : !hasStarted ? (
          /* Pre-Session Launch Action */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={handleStartSession}
              className="tactile-btn"
              style={{
                width: '100%',
                padding: '14px 20px',
                minHeight: 52,
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                border: '1px solid #F59E0B',
                color: '#0A0E18',
                borderRadius: 10,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 'clamp(13px, 3.5vw, 15px)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 4px 18px rgba(212,160,23,0.45)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <GaaIcon name="play" size={18} tone="dark" />
              <span>START COACH GORDON CARDIO ({durationMinutes} MIN)</span>
            </button>
            <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--gray)' }}>
              Calibrated with Live Biometric HR &amp; Neural Audio Copilot
            </div>
          </div>
        ) : (
          /* Active Workout Transport Controls */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              {/* Rewind 15s */}
              <button
                type="button"
                onClick={handleRewind15}
                disabled={!hasStarted}
                className="tactile-btn"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Rewind 15 Seconds"
              >
                <span style={{ fontSize: 11, fontWeight: 800 }}>-15s</span>
              </button>

              {/* Large Play / Pause Button */}
              <button
                type="button"
                onClick={handleTogglePlayPause}
                className="tactile-btn"
                style={{
                  background: isPlaying
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  color: '#0A0E18',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isPlaying ? '0 0 20px rgba(245,158,11,0.5)' : '0 0 20px rgba(16,185,129,0.5)',
                }}
                aria-label={isPlaying ? 'Pause Workout' : 'Resume Workout'}
              >
                <GaaIcon name={isPlaying ? 'status-paused' : 'play'} size={24} tone="dark" />
              </button>

              {/* Skip to Next Interval / Conclude */}
              <button
                type="button"
                onClick={handleSkipSegment}
                disabled={!hasStarted}
                className="tactile-btn"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: !hasStarted ? 'not-allowed' : 'pointer',
                  opacity: !hasStarted ? 0.4 : 1,
                }}
                title={currentSegmentIndex >= session.intervals.length - 1 ? 'Finish Workout & View Debrief' : 'Skip to Next Interval'}
              >
                <GaaIcon name="arrow-right" size={16} tone="inherit" />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 9.5, color: 'var(--gray)', textAlign: 'center' }}>
                {isPlaying ? 'TAP TO PAUSE SESSION' : 'TAP TO RESUME SESSION'} &middot; COACH GORDON IN YOUR EAR
              </div>
              {hasStarted && isPlaying && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPocketLockActive(true)
                    void requestScreenWakeLock()
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#D4AF37',
                    fontSize: 9.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  🔒 Lock Screen for Pocket
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── In-Pocket Touch Shield Overlay (OLED True Black) ──────── */}
      {isPocketLockActive && (
        <div
          role="region"
          aria-label="In-Pocket Touch Shield Active"
          onClick={handleDoubleTapUnlock}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: '#000000',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'max(24px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom)) 24px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            boxSizing: 'border-box',
          }}
        >
          {/* Header info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#D4AF37', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              <GaaIcon name="shield-check" size={14} tone="gold" />
              <span>In-Pocket Touch Shield</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
              {selectedModality} &middot; {session.pattern.name}
            </div>
          </div>

          {/* Central Giant OLED Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: 'auto' }}>
            <div
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 'clamp(64px, 16vw, 88px)',
                fontWeight: 700,
                lineHeight: 0.95,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                textShadow: '0 0 30px rgba(212,160,23,0.3)',
              }}
            >
              {formatTime(totalRemainingSeconds)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              Total Workout Remaining
            </div>

            <div style={{ marginTop: 28, maxWidth: 360 }}>
              <div style={{ fontSize: 'clamp(17px, 3.5vw, 21px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                {currentSegment.title}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: `${getRpeColor(currentSegment.targetRpe)}22`,
                    border: `1px solid ${getRpeColor(currentSegment.targetRpe)}66`,
                    color: getRpeColor(currentSegment.targetRpe),
                  }}
                >
                  RPE {currentSegment.targetRpe} / 10
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {formatTime(segmentRemainingSeconds)} left in interval
                </span>
              </div>
            </div>

            {/* Live Telemetry Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {hasMeasuredHr ? (
                <span style={{ fontSize: 12, color: '#F87171', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GaaIcon name="heart-rate" size={13} tone="ruby" /> {activeSensorBpm} BPM
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  EST ~{effectiveBpm} BPM
                </span>
              )}
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>
                {isMusicDuckingActive ? '🦆 Music Ducking ON' : 'Lock Screen Active'}
              </span>
            </div>

            {/* Live Distance & Steps Telemetry for Pocket Glance */}
            {isDistanceTrackingEnabled && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  marginTop: 14,
                  padding: '8px 16px',
                  borderRadius: 12,
                  background: 'rgba(212,160,23,0.08)',
                  border: '1px solid rgba(212,160,23,0.25)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Distance
                  </div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#D4AF37', lineHeight: 1.1, marginTop: 1 }}>
                    {(distanceMeters * (distanceUnit === 'mi' ? 0.000621371 : 0.001)).toFixed(2)}{' '}
                    <span style={{ fontSize: 10, color: 'var(--gray)' }}>{distanceUnit.toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Pace
                  </div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#38BDF8', lineHeight: 1.1, marginTop: 1 }}>
                    {currentPaceFormatted}
                  </div>
                </div>

                {stepCount > 0 && (
                  <>
                    <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Steps
                      </div>
                      <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#34D399', lineHeight: 1.1, marginTop: 1 }}>
                        {stepCount.toLocaleString()}{' '}
                        {stepCadenceSpm > 0 && <span style={{ fontSize: 9, color: 'var(--gray)' }}>({stepCadenceSpm} SPM)</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom Controls: Hold to Unlock Button + Hint */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 320 }}>
            <div
              onPointerDown={startHoldUnlock}
              onPointerUp={cancelHoldUnlock}
              onPointerLeave={cancelHoldUnlock}
              onPointerCancel={cancelHoldUnlock}
              onTouchStart={startHoldUnlock}
              onTouchEnd={cancelHoldUnlock}
              onTouchCancel={cancelHoldUnlock}
              style={{
                position: 'relative',
                width: '100%',
                height: 56,
                borderRadius: 28,
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(212,160,23,0.6)',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(212,160,23,0.15)',
                touchAction: 'none',
              }}
            >
              {/* Animated Progress Fill */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${unlockHoldProgress}%`,
                  background: 'linear-gradient(90deg, #B8860B 0%, #D4AF37 100%)',
                  transition: unlockHoldProgress === 0 ? 'width 0.15s ease-out' : 'none',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                }}
              >
                <GaaIcon name="unlock" size={16} tone="gold" />
                <span>{unlockHoldProgress > 0 ? `Unlocking... ${unlockHoldProgress}%` : 'Hold to Unlock'}</span>
              </div>
            </div>

            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              Hold button for 1.2s or double-tap screen to unlock
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
