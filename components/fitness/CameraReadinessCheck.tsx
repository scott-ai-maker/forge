'use client'

import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import TelemetryRingGauge from '@/components/ui/TelemetryRingGauge'
import { useSfxMuted } from '@/lib/sfx-audio'
import {
  applyExpressCapToInjectedDrills,
  createReadinessRepSession,
  evaluateCameraReadiness,
  finalizeReadinessSession,
  getActiveMovementForRep,
  ingestPoseFrameIntoSession,
  READINESS_PRESET_LABELS,
  READINESS_SCREEN_MEDIA,
  recordManualRepInSession,
  type NormalizedPoseLandmark,
  type ReadinessEvaluationResult,
  type ReadinessFrameTelemetry,
  type ReadinessPresetId,
  type ReadinessRepSession,
  type ReadinessScreenMode,
} from '@/lib/camera-readiness-engine'
import {
  BRAND_LOGO_FALLBACK_IMAGE,
  resolveGaaExerciseImage,
} from '@/lib/nasm-generated-images'
import ExerciseVideoModal, { type ExerciseModalData } from '@/components/fitness/ExerciseVideoModal'
import {
  recordDailyReadinessAndComfort,
  type InjectedReadinessDrill,
} from '@/lib/posture-profile-state'
import {
  subscribeToWatchCameraCommand,
  syncCameraRemoteStateToWatch,
} from '@/lib/native-healthkit-bridge'
import { TELEMETRY_CAMERA_RELEASE_EVENT, trackEvent } from '@/src/lib/telemetry/telemetryClient'
import { Camera, CheckCircle2, Mail, RefreshCw, Smartphone, Volume2 } from 'lucide-react'
import { useTierAccess } from '@/lib/tierEntitlements'
import CoachEscalationModal from '@/components/coach-gordon/CoachEscalationModal'
import {
  buildPostScanDiagnosticSummary,
  playCoachStaticCue,
  speakCoachDynamicText,
} from '@/src/lib/audio/coachVoiceEngine'

export interface CameraReadinessCheckProps {
  expressModeActive?: boolean
  allowDualScreen?: boolean
  isOpen?: boolean
  onRequestUpgradeDualScreen?: () => void
  onComplete: (result: {
    readinessScore: number
    injectedDrills: InjectedReadinessDrill[]
    restrictionFlags: string[]
  }) => void
  onSkip: () => void
}

interface PoseLandmarkerLike {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number
  ) => { landmarks?: NormalizedPoseLandmark[][] }
  close?: () => void
}

interface TestPoseStreamHook {
  frames: Array<{ timestampMs?: number; landmarks: NormalizedPoseLandmark[] }>
  intervalMs?: number
  skipCountdown?: boolean
}

declare global {
  interface Window {
    __FORGE_TEST_POSE_STREAM__?: TestPoseStreamHook
  }
}

type ReadinessStage = 'idle' | 'countdown' | 'scanning' | 'complete'

const COUNTDOWN_SECONDS = 5
const SCAN_WINDOW_SECONDS = 25

const REP_CUES: Record<ReadinessScreenMode, [string, string, string]> = {
  overhead_squat: [
    'Rep 1 of 3 · Arms tall overhead, sit hips back smoothly for 2 seconds.',
    'Rep 2 of 3 · Keep heels planted flat and knees tracking over toes.',
    'Rep 3 of 3 · Hold comfortable bottom depth for 1 second, then stand tall.',
  ],
  scapular_wall_slides: [
    'Rep 1 of 3 · Back and wrists near wall, glide forearms smoothly upward.',
    'Rep 2 of 3 · Keep lower ribs down and chin gently tucked.',
    'Rep 3 of 3 · Reach comfortable overhead peak, then draw elbows down.',
  ],
  dual_screen: [
    'Rep 1 of 3 · Overhead Squat: sit smoothly with heels anchored.',
    'Rep 2 of 3 · Overhead Squat + Overhead Reach: steady ribs and knees.',
    'Rep 3 of 3 · Scapular Wall Slide check: glide tall with neutral neck.',
  ],
}

function sanitizeFinite(val: number | null | undefined): number | null {
  if (typeof val !== 'number' || !Number.isFinite(val)) return null
  return Number(val.toFixed(1))
}

export default function CameraReadinessCheck({
  expressModeActive = false,
  allowDualScreen = false,
  isOpen = true,
  onRequestUpgradeDualScreen,
  onComplete,
  onSkip,
}: CameraReadinessCheckProps) {
  const { sfxMuted, toggleSfxMuted, playTone } = useSfxMuted()
  const { tierId } = useTierAccess()
  const isCoachSupport = tierId === 'coach_support'
  const progressId = useId()

  const [escalationOpen, setEscalationOpen] = useState(false)
  const [screenMode, setScreenMode] = useState<ReadinessScreenMode>('overhead_squat')
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user')
  const [stage, setStage] = useState<ReadinessStage>('idle')
  const [countdownSec, setCountdownSec] = useState<number>(COUNTDOWN_SECONDS)
  const [scanElapsedSec, setScanElapsedSec] = useState<number>(0)
  const [completedReps, setCompletedReps] = useState<number>(0)
  const [liveTelemetry, setLiveTelemetry] = useState<ReadinessFrameTelemetry | null>(null)
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true)
  const [cvReady, setCvReady] = useState<boolean>(false)
  const [cameraNotice, setCameraNotice] = useState<string | null>(null)
  const [result, setResult] = useState<ReadinessEvaluationResult | null>(null)
  const [rawResultDrills, setRawResultDrills] = useState<InjectedReadinessDrill[]>([])
  const [activeVideoModal, setActiveVideoModal] = useState<ExerciseModalData | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarkerLike | null>(null)
  const rafRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const testStreamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finalizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionRef = useRef<ReadinessRepSession>(createReadinessRepSession('overhead_squat'))
  const lastVideoTimestampRef = useRef<number>(-1)
  const lastInferenceAtRef = useRef<number>(0)
  const isFinalizingRef = useRef<boolean>(false)
  const isOpenRef = useRef<boolean>(isOpen)
  const scanGenRef = useRef<number>(0)

  isOpenRef.current = isOpen

  const stopTimersAndLoops = useCallback(() => {
    if (rafRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current)
      scanTimerRef.current = null
    }
    if (testStreamTimerRef.current) {
      clearInterval(testStreamTimerRef.current)
      testStreamTimerRef.current = null
    }
    if (finalizeTimeoutRef.current) {
      clearTimeout(finalizeTimeoutRef.current)
      finalizeTimeoutRef.current = null
    }
  }, [])

  const cleanupCamera = useCallback(() => {
    scanGenRef.current += 1
    stopTimersAndLoops()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const attached = videoRef.current.srcObject as MediaStream
      attached.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    if (poseLandmarkerRef.current) {
      try {
        poseLandmarkerRef.current.close?.()
      } catch {
        // Ignore close errors during teardown
      }
      poseLandmarkerRef.current = null
    }
    setCvReady(false)
    isFinalizingRef.current = false
  }, [stopTimersAndLoops])

  // Immediately release hardware camera & timers when parent <dialog> closes (e.g., Esc or backdrop light-dismiss)
  useEffect(() => {
    if (!isOpen) {
      cleanupCamera()
      setStage(prev => (prev === 'countdown' || prev === 'scanning' ? 'idle' : prev))
    }
  }, [cleanupCamera, isOpen])

  useEffect(() => {
    const handleHardwareRelease = () => {
      cleanupCamera()
      setStage(prev => (prev === 'countdown' || prev === 'scanning' ? 'idle' : prev))
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, handleHardwareRelease)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, handleHardwareRelease)
      }
      cleanupCamera()
    }
  }, [cleanupCamera])

  // Keep displayed result drills synchronized if athlete toggles 20m Express Mode after scanning
  useEffect(() => {
    if (!result || rawResultDrills.length === 0) return
    const capped = applyExpressCapToInjectedDrills(rawResultDrills, expressModeActive)
    const totalSec = capped.reduce((sum, d) => sum + d.durationSec, 0)
    setResult(prev =>
      prev
        ? {
            ...prev,
            injectedDrills: capped,
            totalInjectedDurationSec: totalSec,
          }
        : null
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expressModeActive])

  const commitEvaluatedResult = useCallback(
    (evaluated: ReadinessEvaluationResult, unCappedDrills?: InjectedReadinessDrill[]) => {
      cleanupCamera()
      setRawResultDrills(unCappedDrills ?? evaluated.injectedDrills)
      setResult(evaluated)
      setStage('complete')
      playCoachStaticCue('calibration_locked')

      const primaryFlagCheck = evaluated.checks.find(c => c.status !== 'optimal')
      const spokenSummary = buildPostScanDiagnosticSummary({
        scanType: 'camera_readiness_30s',
        score: evaluated.readinessScore,
        primaryFinding: primaryFlagCheck
          ? `${primaryFlagCheck.label.toLowerCase()} at ${primaryFlagCheck.measuredDeg} degrees`
          : 'balanced bilateral joint range',
        actionableFix:
          evaluated.injectedDrills.length > 0
            ? `I queued ${evaluated.injectedDrills[0].name} into your warm-up so Set 1 feels smooth.`
            : 'All joint checkpoints look clean—you are cleared for Set 1.',
      })
      void speakCoachDynamicText(spokenSummary, { moment: 'post_scan_summary' })

      recordDailyReadinessAndComfort({
        readinessScore: evaluated.readinessScore,
        screenType: evaluated.screenMode,
        restrictionFlags: evaluated.restrictionFlags,
        injectedDrills: unCappedDrills ?? evaluated.injectedDrills,
      })

      const peakRomDeltas: Record<
        string,
        {
          measured_deg: number | null
          baseline_deg: number | null
          delta_deg: number | null
          severity: string
        }
      > = {}
      for (const check of evaluated.checks) {
        const m = sanitizeFinite(check.measuredDeg)
        const b = sanitizeFinite(check.baselineDeg)
        peakRomDeltas[check.id] = {
          measured_deg: m,
          baseline_deg: b,
          delta_deg: m !== null && b !== null ? sanitizeFinite(m - b) : null,
          severity: check.status,
        }
      }

      void trackEvent('readiness_check_completed', {
        readiness_index: sanitizeFinite(evaluated.readinessScore) ?? 0,
        movement_type: evaluated.screenMode,
        evaluation_source: evaluated.evaluationSource,
        captured_reps: evaluated.capturedRepsCount,
        peak_rom_deltas: peakRomDeltas,
        restriction_flags: evaluated.restrictionFlags,
        injected_warmup_drills: evaluated.injectedDrills.map(d => ({
          id: d.id,
          title: d.name,
          duration_sec: d.durationSec,
        })),
        express_mode_active: expressModeActive,
      })
    },
    [cleanupCamera, expressModeActive]
  )

  const handleSelfCheckPreset = useCallback(
    (preset: ReadinessPresetId) => {
      const targetMode: ReadinessScreenMode =
        preset === 'stiff_upper_back' && screenMode === 'overhead_squat'
          ? 'scapular_wall_slides'
          : screenMode
      setScreenMode(targetMode)
      const fullEval = evaluateCameraReadiness({
        screenMode: targetMode,
        preset,
        expressModeActive: false,
      })
      const evaluated = evaluateCameraReadiness({
        screenMode: targetMode,
        preset,
        expressModeActive,
      })
      commitEvaluatedResult(evaluated, fullEval.injectedDrills)
    },
    [commitEvaluatedResult, expressModeActive, screenMode]
  )

  const finalizeFromCurrentSession = useCallback(() => {
    if (isFinalizingRef.current) return
    const unCappedEval = finalizeReadinessSession(sessionRef.current, false)
    const evaluated = finalizeReadinessSession(sessionRef.current, expressModeActive)
    if (evaluated) {
      isFinalizingRef.current = true
      commitEvaluatedResult(evaluated, unCappedEval?.injectedDrills ?? evaluated.injectedDrills)
    } else {
      cleanupCamera()
      setStage('idle')
      setCameraNotice(
        'No full body landmarks were locked during the 25s window. Re-center 6–8 ft from the lens or use Quick Mobility Self-Check below.'
      )
    }
  }, [cleanupCamera, commitEvaluatedResult, expressModeActive])

  const processIncomingLandmarks = useCallback(
    (landmarks: ReadonlyArray<NormalizedPoseLandmark>, timestampMs: number) => {
      if (isFinalizingRef.current) return
      const mirrorX = cameraFacing === 'user'
      const { session: nextSession, repJustCompleted } = ingestPoseFrameIntoSession(
        sessionRef.current,
        landmarks,
        timestampMs,
        { mirrorX }
      )
      sessionRef.current = nextSession
      if (nextSession.latestFrame) {
        setLiveTelemetry(nextSession.latestFrame)
      }

      if (repJustCompleted) {
        setCompletedReps(nextSession.completedReps)
        playTone('rep_complete')

        if (nextSession.completedReps >= nextSession.targetReps) {
          isFinalizingRef.current = true
          stopTimersAndLoops()
          finalizeTimeoutRef.current = setTimeout(() => {
            const unCappedEval = finalizeReadinessSession(sessionRef.current, false)
            const evaluated = finalizeReadinessSession(sessionRef.current, expressModeActive)
            if (evaluated) {
              commitEvaluatedResult(
                evaluated,
                unCappedEval?.injectedDrills ?? evaluated.injectedDrills
              )
            }
          }, 380)
        }
      }
    },
    [cameraFacing, commitEvaluatedResult, expressModeActive, playTone, stopTimersAndLoops]
  )

  const beginLiveScanningWindow = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setStage('scanning')
    setScanElapsedSec(0)
    playCoachStaticCue('readiness_rep_1_3')

    const scanStartedAt = Date.now()
    scanTimerRef.current = setInterval(() => {
      const elapsed = Math.min(
        SCAN_WINDOW_SECONDS,
        Math.floor((Date.now() - scanStartedAt) / 1000)
      )
      setScanElapsedSec(elapsed)
      if (elapsed >= SCAN_WINDOW_SECONDS) {
        if (scanTimerRef.current) {
          clearInterval(scanTimerRef.current)
          scanTimerRef.current = null
        }
        finalizeFromCurrentSession()
      }
    }, 250)

    // Deterministic E2E pose stream hook for automated Playwright validation
    const injectedStream =
      typeof window !== 'undefined' ? window.__FORGE_TEST_POSE_STREAM__ : undefined
    if (injectedStream && Array.isArray(injectedStream.frames) && injectedStream.frames.length > 0) {
      setCvReady(true)
      let idx = 0
      let syntheticClockMs = 1000
      const stepMs = injectedStream.intervalMs ?? 55
      testStreamTimerRef.current = setInterval(() => {
        if (idx >= injectedStream.frames.length || isFinalizingRef.current) {
          if (testStreamTimerRef.current) {
            clearInterval(testStreamTimerRef.current)
            testStreamTimerRef.current = null
          }
          return
        }
        const item = injectedStream.frames[idx]
        const frameTs = item.timestampMs ?? syntheticClockMs
        syntheticClockMs += 250
        idx += 1
        processIncomingLandmarks(item.landmarks, frameTs)
      }, stepMs)
      return
    }

    // Real MediaPipe 33-point VIDEO inference loop (client-side only; zero frame uploads)
    const tickPoseFrame = (rafNow: number) => {
      if (isFinalizingRef.current) return
      const videoEl = videoRef.current
      const landmarker = poseLandmarkerRef.current
      if (
        videoEl &&
        landmarker &&
        videoEl.readyState >= 2 &&
        rafNow - lastInferenceAtRef.current >= 65
      ) {
        lastInferenceAtRef.current = rafNow
        const videoTs = Math.max(lastVideoTimestampRef.current + 1, Math.round(rafNow))
        lastVideoTimestampRef.current = videoTs
        try {
          const detection = landmarker.detectForVideo(videoEl, videoTs)
          const firstPose = detection?.landmarks?.[0]
          if (firstPose && firstPose.length >= 29) {
            processIncomingLandmarks(firstPose, videoTs)
          }
        } catch {
          // Transient video frame decode race; continue on next animation frame
        }
      }
      rafRef.current = window.requestAnimationFrame(tickPoseFrame)
    }

    if (typeof window !== 'undefined') {
      rafRef.current = window.requestAnimationFrame(tickPoseFrame)
    }
  }, [finalizeFromCurrentSession, processIncomingLandmarks])

  const initPoseLandmarkerEngine = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (window.__FORGE_TEST_POSE_STREAM__?.frames?.length) {
      setCvReady(true)
      return
    }
    try {
      const vision = await import('@mediapipe/tasks-vision')
      let fileset
      try {
        fileset = await vision.FilesetResolver.forVisionTasks('/wasm')
      } catch {
        fileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )
      }

      const modelAssetPath =
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

      let landmarker: PoseLandmarkerLike
      try {
        landmarker = (await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        })) as unknown as PoseLandmarkerLike
      } catch {
        landmarker = (await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        })) as unknown as PoseLandmarkerLike
      }

      poseLandmarkerRef.current = landmarker
      setCvReady(true)
    } catch {
      setCvReady(false)
      setCameraNotice(
        prev =>
          prev ??
          '33-point pose model offline — tap Log Rep as you finish each rep or select how your joints felt below.'
      )
    }
  }, [])

  const startThirtySecondCheck = useCallback(
    async (overrideFacing?: 'user' | 'environment') => {
      cleanupCamera()
      const currentGen = scanGenRef.current
      const activeFacing = overrideFacing ?? cameraFacing
      sessionRef.current = createReadinessRepSession(screenMode)
      lastVideoTimestampRef.current = -1
      lastInferenceAtRef.current = 0
      isFinalizingRef.current = false

      setResult(null)
      setRawResultDrills([])
      setCameraNotice(null)
      setCompletedReps(0)
      setLiveTelemetry(null)
      setCountdownSec(COUNTDOWN_SECONDS)
      setScanElapsedSec(0)
      setStage('countdown')

      const injectedStream =
        typeof window !== 'undefined' ? window.__FORGE_TEST_POSE_STREAM__ : undefined

      let hasLiveCamera = false
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: activeFacing,
              width: { ideal: 960 },
              height: { ideal: 720 },
            },
            audio: false,
          })
          if (!isOpenRef.current || currentGen !== scanGenRef.current) {
            stream.getTracks().forEach(t => t.stop())
            return
          }
          streamRef.current = stream
          hasLiveCamera = true
          if (
            videoRef.current &&
            typeof MediaStream !== 'undefined' &&
            stream instanceof MediaStream
          ) {
            videoRef.current.srcObject = stream
            void videoRef.current.play().catch(() => {})
          }
        } catch {
          hasLiveCamera = false
          if (!injectedStream) {
            setCameraNotice(
              'Camera permission unavailable — complete 3 paced reps below or pick your Quick Mobility Self-Check.'
            )
          }
          void trackEvent('client_runtime_diagnostic', {
            diagnostic_kind: 'camera_permission',
            camera_permission_state: 'denied',
            component_context: 'CameraReadinessCheck',
          })
        }
      } else if (!injectedStream) {
        setCameraNotice(
          'Live camera stream unavailable in this browser — use Guided 3-Rep Pacing or Quick Mobility Self-Check.'
        )
      }

      setCameraAvailable(hasLiveCamera || Boolean(injectedStream))
      playCoachStaticCue('calibration_framing')

      // Load 33-point MediaPipe PoseLandmarker while the athlete steps 6-8 ft back
      void initPoseLandmarkerEngine()

      if (injectedStream?.skipCountdown) {
        beginLiveScanningWindow()
        return
      }

      // Live framing preview during 5s step-back countdown when PoseLandmarker warms up early
      let remaining = COUNTDOWN_SECONDS
      countdownTimerRef.current = setInterval(() => {
        // Sample framing during countdown if video + landmarker are already live
        const videoEl = videoRef.current
        const landmarker = poseLandmarkerRef.current
        if (videoEl && landmarker && videoEl.readyState >= 2) {
          const nowTs = Math.max(lastVideoTimestampRef.current + 1, Math.round(performance.now()))
          lastVideoTimestampRef.current = nowTs
          try {
            const det = landmarker.detectForVideo(videoEl, nowTs)
            const pose0 = det?.landmarks?.[0]
            if (pose0 && pose0.length >= 29) {
              const previewSession = ingestPoseFrameIntoSession(
                createReadinessRepSession(screenMode),
                pose0,
                nowTs,
                { mirrorX: activeFacing === 'user' }
              ).session
              if (previewSession.latestFrame) {
                setLiveTelemetry(previewSession.latestFrame)
              }
            }
          } catch {
            // Ignore transient warmup frame errors
          }
        }

        remaining -= 1
        if (remaining <= 0) {
          beginLiveScanningWindow()
        } else {
          setCountdownSec(remaining)
        }
      }, 1000)
    },
    [
      beginLiveScanningWindow,
      cameraFacing,
      cleanupCamera,
      initPoseLandmarkerEngine,
      screenMode,
    ]
  )

  // Attach MediaStream if video element mounts right as stage enters 'countdown'
  useEffect(() => {
    if (
      (stage === 'countdown' || stage === 'scanning') &&
      videoRef.current &&
      streamRef.current &&
      typeof MediaStream !== 'undefined' &&
      streamRef.current instanceof MediaStream
    ) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
        void videoRef.current.play().catch(() => {})
      }
    }
  }, [stage])

  const handleManualLogRep = useCallback(() => {
    if (stage !== 'scanning' || isFinalizingRef.current) return
    const nextSession = recordManualRepInSession(sessionRef.current, Date.now())
    sessionRef.current = nextSession
    setCompletedReps(nextSession.completedReps)
    playTone('rep_complete')

    if (nextSession.completedReps >= nextSession.targetReps) {
      isFinalizingRef.current = true
      stopTimersAndLoops()
      const unCappedEval = finalizeReadinessSession(nextSession, false)
      const evaluated = finalizeReadinessSession(nextSession, expressModeActive)
      if (evaluated) {
        commitEvaluatedResult(evaluated, unCappedEval?.injectedDrills ?? evaluated.injectedDrills)
      }
    }
  }, [commitEvaluatedResult, expressModeActive, playTone, stage, stopTimersAndLoops])

  const handleFlipCameraFacing = useCallback(() => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user'
    setCameraFacing(nextFacing)
    if (stage === 'countdown' || stage === 'scanning') {
      void startThirtySecondCheck(nextFacing)
    }
  }, [cameraFacing, stage, startThirtySecondCheck])

  const activeRepIndex = Math.min(3, completedReps + 1) as 1 | 2 | 3
  const isRepLocked = completedReps >= 3
  const activeMovement = getActiveMovementForRep(screenMode, activeRepIndex)

  // Bidirectional Apple Watch Wrist Camera Remote sync (30-Second Camera Readiness Check)
  useEffect(() => {
    if (!isOpen) return
    const isActive = stage !== 'complete'
    void syncCameraRemoteStateToWatch({
      isActive,
      mode: 'readiness_check',
      modeTitle: '30s Readiness Check',
      framingStatus: isRepLocked
        ? 'locked'
        : stage === 'scanning'
          ? 'recording'
          : 'framing',
      isRecording: stage === 'scanning',
      countdownSeconds: stage === 'countdown' ? countdownSec : 0,
      repCount: stage === 'scanning' ? completedReps : 0,
      targetReps: 3,
      statusHint: isRepLocked
        ? 'Locked · Emerald — 33-point ROM captured'
        : stage === 'countdown'
          ? `Step 6–8 ft back · Starting in ${countdownSec}s`
          : stage === 'scanning'
            ? `Rep ${activeRepIndex} of 3 · ${SCAN_WINDOW_SECONDS - scanElapsedSec}s left`
            : 'Step 6–8 ft back · Tap Start 5s Timer on Watch',
    })
  }, [
    activeRepIndex,
    completedReps,
    countdownSec,
    isOpen,
    isRepLocked,
    scanElapsedSec,
    stage,
  ])

  useEffect(() => {
    let cleanupWatchSub: (() => void) | null = null
    void subscribeToWatchCameraCommand(cmd => {
      if (cmd.command === 'startTimer5s') {
        if (stage === 'idle') {
          void startThirtySecondCheck()
        }
      } else if (cmd.command === 'recordRep') {
        if (stage === 'idle') {
          void startThirtySecondCheck()
        } else if (stage === 'countdown') {
          beginLiveScanningWindow()
        } else if (stage === 'scanning') {
          handleManualLogRep()
        }
      } else if (cmd.command === 'stopAndReview') {
        if (stage === 'scanning') {
          finalizeFromCurrentSession()
        } else {
          cleanupCamera()
          setStage('idle')
        }
      } else if (cmd.command === 'dismissRemote') {
        cleanupCamera()
        setStage('idle')
      }
    }).then(unsub => {
      cleanupWatchSub = unsub
    })

    return () => {
      cleanupWatchSub?.()
      void syncCameraRemoteStateToWatch({
        isActive: false,
        mode: 'readiness_check',
        modeTitle: '30s Readiness Check',
        framingStatus: 'framing',
      })
    }
  }, [
    beginLiveScanningWindow,
    cleanupCamera,
    finalizeFromCurrentSession,
    handleManualLogRep,
    stage,
    startThirtySecondCheck,
  ])

  return (
    <div
      data-testid="camera-readiness-check"
      className="forge-surface-card mb-3 space-y-3.5 rounded-2xl p-4 text-zinc-100 sm:p-5"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
              33-Point Readiness · 30s Check
            </span>
            {expressModeActive && (
              <span
                data-testid="readiness-express-cap-badge"
                className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums text-amber-300"
              >
                20m Express Cap: Max 90s Warm-Up
              </span>
            )}
          </div>
          <h3
            className="mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl"
            style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}
          >
            30-Second Camera Readiness Check
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSfxMuted}
            aria-label="Readiness audio cues"
            aria-pressed={!sfxMuted}
            className={`forge-tactile-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
              sfxMuted
                ? 'border-white/10 bg-[#181B22] text-zinc-400 hover:border-white/15 hover:bg-[#1D212A] hover:text-zinc-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
            }`}
          >
            {sfxMuted ? 'SFX MUTED' : 'SFX ON'}
          </button>
          <button
            type="button"
            onClick={() => {
              cleanupCamera()
              onSkip()
            }}
            className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-[#181B22] px-3.5 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            Skip to Workout →
          </button>
        </div>
      </div>

      {/* Stage 1: Idle Setup & Screen Selector */}
      {stage === 'idle' && (
        <>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              data-testid="readiness-mode-overhead-squat"
              onClick={() => setScreenMode('overhead_squat')}
              aria-pressed={screenMode === 'overhead_squat'}
              className={`forge-tactile-press min-h-[44px] overflow-hidden rounded-xl border p-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                screenMode === 'overhead_squat'
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-white'
                  : 'border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-[#090A0D]">
                <img
                  src={READINESS_SCREEN_MEDIA.overhead_squat.imageUrl}
                  alt="3 Bodyweight Overhead Squats Forge Studio demonstration"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src = BRAND_LOGO_FALLBACK_IMAGE
                  }}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
                  3 Reps · 30s
                </span>
              </div>
              <div className="text-xs font-bold tabular-nums text-white">
                3 Bodyweight Overhead Squats
              </div>
              <div className="mt-1 text-[11px] leading-snug text-zinc-400">
                Ankle dorsiflexion · Hip depth · Knee valgus · Torso lean
              </div>
            </button>

            <button
              type="button"
              data-testid="readiness-mode-wall-slides"
              onClick={() => setScreenMode('scapular_wall_slides')}
              aria-pressed={screenMode === 'scapular_wall_slides'}
              className={`forge-tactile-press min-h-[44px] overflow-hidden rounded-xl border p-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                screenMode === 'scapular_wall_slides'
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-white'
                  : 'border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-[#090A0D]">
                <img
                  src={READINESS_SCREEN_MEDIA.scapular_wall_slides.imageUrl}
                  alt="3 Scapular Wall Slides Forge Studio demonstration"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src = BRAND_LOGO_FALLBACK_IMAGE
                  }}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
                  3 Reps · 30s
                </span>
              </div>
              <div className="text-xs font-bold tabular-nums text-white">
                3 Scapular Wall Slides
              </div>
              <div className="mt-1 text-[11px] leading-snug text-zinc-400">
                Thoracic extension · Shoulder flexion · Cervical drift
              </div>
            </button>

            <button
              type="button"
              data-testid="readiness-mode-dual-screen"
              onClick={() => {
                if (!allowDualScreen) {
                  onRequestUpgradeDualScreen?.()
                  return
                }
                setScreenMode('dual_screen')
              }}
              aria-pressed={screenMode === 'dual_screen'}
              className={`forge-tactile-press min-h-[44px] overflow-hidden rounded-xl border p-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                screenMode === 'dual_screen'
                  ? 'border-amber-500/35 bg-amber-500/10 text-white'
                  : 'border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-[#090A0D]">
                <img
                  src={READINESS_SCREEN_MEDIA.dual_screen.imageUrl}
                  alt="Dual-Screen Full Check Forge Studio demonstration"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src = BRAND_LOGO_FALLBACK_IMAGE
                  }}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-amber-300">
                  Full Chain
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">Dual-Screen Full Check</span>
                {!allowDualScreen && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-amber-300">
                    PLUS
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-zinc-400">
                2 Squats + 1 Wall Slide · Lower + Upper chain
              </div>
            </button>
          </div>

          {/* Selected Screen Mode Studio Demonstration Loop + Minimal Legal Note */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#14171E] p-3">
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[200px_1fr]">
              <button
                type="button"
                onClick={() =>
                  setActiveVideoModal({
                    name: READINESS_SCREEN_MEDIA[screenMode].title,
                    imageUrl: READINESS_SCREEN_MEDIA[screenMode].imageUrl,
                    coachingCues: REP_CUES[screenMode],
                    protocol: '3 controlled reps (5s step-back + 25s capture)',
                  })
                }
                className="group relative aspect-video w-full overflow-hidden rounded-lg border border-white/15 bg-[#090A0D] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                aria-label={`Watch ${READINESS_SCREEN_MEDIA[screenMode].title} demonstration`}
              >
                <video
                  key={READINESS_SCREEN_MEDIA[screenMode].videoUrl}
                  src={READINESS_SCREEN_MEDIA[screenMode].videoUrl}
                  poster={READINESS_SCREEN_MEDIA[screenMode].imageUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/80 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
                  Studio Demo Loop · Tap to Expand
                </span>
              </button>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">
                    {READINESS_SCREEN_MEDIA[screenMode].title} — 30s Protocol
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveVideoModal({
                        name: READINESS_SCREEN_MEDIA[screenMode].title,
                        imageUrl: READINESS_SCREEN_MEDIA[screenMode].imageUrl,
                        coachingCues: REP_CUES[screenMode],
                        protocol: '3 controlled reps (5s step-back + 25s capture)',
                      })
                    }
                    className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-emerald-300 underline decoration-emerald-400/50 underline-offset-2 hover:text-emerald-200"
                  >
                    Watch Full Demo &amp; NASM Form →
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-300">
                  Prop phone at waist height, step 6–8 ft back during the 5s framing countdown, then
                  complete 3 smooth reps. All 33-point landmark math stays locally in device memory.
                </p>
                <p
                  data-testid="readiness-loop-disclaimer"
                  className="text-[10px] leading-snug text-zinc-500"
                >
                  Illustrative AI preview — follow written cues &amp; official demo for form.
                </p>
              </div>
            </div>
          </div>

          {cameraNotice && (
            <div
              role="status"
              data-testid="readiness-idle-notice"
              className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200"
            >
              {cameraNotice}
            </div>
          )}

          {/* Primary Camera Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="readiness-start-camera-btn"
                onClick={() => void startThirtySecondCheck()}
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
              >
                <GaaIcon name="camera" size={14} tone="dark" />
                <span>Start 30s Camera Check</span>
              </button>

              <button
                type="button"
                data-testid="readiness-camera-facing-btn"
                onClick={() =>
                  setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'))
                }
                aria-label="Switch camera lens"
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                <RefreshCw size={13} aria-hidden="true" className="text-emerald-300" />
                <span>{cameraFacing === 'user' ? 'Front Lens' : 'Rear Lens'}</span>
              </button>
            </div>

            <span className="font-mono text-[11px] tabular-nums text-zinc-400">
              5s step-back · 25s 3-rep CV scan
            </span>
          </div>

          {/* Crowded-Gym / No-Camera Quick Mobility Self-Check Disclosure */}
          <details
            data-testid="readiness-self-check-disclosure"
            className="group rounded-xl border border-white/10 bg-[#14171E]/85 px-3.5 py-2.5"
          >
            <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-zinc-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
              <span>No camera space or crowded gym? Quick Mobility Self-Check</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>
            <div className="mt-2.5 space-y-2 border-t border-white/10 pt-2.5">
              <p className="text-[11px] text-zinc-400">
                Perform 3 unhurried bodyweight reps and tap how your joints felt today to adapt Set 1
                warm-up drills immediately:
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(Object.keys(READINESS_PRESET_LABELS) as ReadinessPresetId[]).map(presetId => (
                  <button
                    key={presetId}
                    type="button"
                    data-testid={`readiness-self-check-${presetId}`}
                    onClick={() => handleSelfCheckPreset(presetId)}
                    className="forge-tactile-press min-h-[44px] rounded-xl border border-white/10 bg-[#181B22] px-3 py-2 text-left text-xs font-semibold text-zinc-100 transition-colors hover:border-emerald-400/40 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                  >
                    {READINESS_PRESET_LABELS[presetId]}
                  </button>
                ))}
              </div>
            </div>
          </details>
        </>
      )}

      {/* Stage 2 & 3: Unified 5s Framing Countdown + 25s Live 33-Point CV HUD */}
      {(stage === 'countdown' || stage === 'scanning') && (
        <div
          data-testid="readiness-active-hud"
          className={`relative overflow-hidden rounded-2xl border bg-[#090A0D] p-3.5 transition-colors duration-300 ${
            isRepLocked
              ? 'border-emerald-400/75'
              : liveTelemetry?.framingReady
                ? 'border-emerald-500/45'
                : 'border-amber-400/70'
          }`}
        >
          <div className="relative overflow-hidden rounded-xl bg-[#090A0D]">
            <video
              ref={videoRef}
              data-testid="readiness-camera-video"
              poster={READINESS_SCREEN_MEDIA[screenMode].imageUrl}
              muted
              playsInline
              className={cameraFacing === 'user' ? 'scale-x-[-1]' : ''}
              style={{
                width: '100%',
                height: 240,
                objectFit: 'cover',
                display: 'block',
                background: '#090A0D',
              }}
            />

            {/* Frosted-Glass Top Status Pill */}
            <div className="forge-glass-pill absolute inset-x-2.5 top-2.5 z-10 flex items-center justify-between gap-2 rounded-full px-3 py-1.5 text-[11.5px] text-zinc-100">
              <span className="truncate font-medium" data-testid="readiness-framing-status">
                {stage === 'countdown' ? (
                  <>
                    Step 6–8 ft back into brackets ·{' '}
                    <strong className="font-mono tabular-nums text-amber-300">
                      {countdownSec}s
                    </strong>
                  </>
                ) : liveTelemetry ? (
                  <>
                    {liveTelemetry.framingHint} ·{' '}
                    <strong className="tabular-nums text-white">
                      Rep {activeRepIndex} of 3
                    </strong>
                  </>
                ) : cameraAvailable ? (
                  <>
                    Align full body in lens ·{' '}
                    <strong className="tabular-nums text-white">
                      Rep {activeRepIndex} of 3
                    </strong>
                  </>
                ) : (
                  <>
                    Hands-Free Pacing ·{' '}
                    <strong className="tabular-nums text-white">
                      Rep {activeRepIndex} of 3
                    </strong>
                  </>
                )}
              </span>
              <span
                data-testid="readiness-tracking-badge"
                className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                  isRepLocked
                    ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                    : stage === 'countdown'
                      ? 'border-amber-500/35 bg-amber-500/15 text-amber-300'
                      : liveTelemetry
                        ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                        : 'border-zinc-500/35 bg-zinc-500/15 text-zinc-300'
                }`}
              >
                {isRepLocked
                  ? 'LOCKED'
                  : stage === 'countdown'
                    ? 'FRAMING'
                    : liveTelemetry
                      ? '33-PT LIVE'
                      : cvReady
                        ? 'AWAITING POSE'
                        : 'GUIDED'}
              </span>
            </div>

            {/* 5-Second Step-Back Countdown Center Overlay */}
            {stage === 'countdown' && (
              <div
                data-testid="readiness-countdown-overlay"
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/45 px-4 text-center backdrop-blur-[2px]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/80 bg-[#090A0D]/85 font-mono text-3xl font-extrabold tabular-nums text-amber-300 shadow-lg">
                  {countdownSec}
                </div>
                <p className="mt-2 max-w-xs text-xs font-semibold text-white">
                  {liveTelemetry?.framingReady
                    ? 'Framing verified — hold steady for Rep 1'
                    : 'Set device down & step 6–8 ft back so head-to-ankles fit inside brackets'}
                </p>
              </div>
            )}

            {/* Optical Framing Brackets + Live 33-Point Skeleton Overlay (ONLY rendered from real pose frames) */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              data-testid="readiness-hud-svg"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <defs>
                <filter id="readiness-hud-glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="0.7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Framing Corner Brackets */}
              <path
                d="M 5 22 L 5 12 L 13 12 M 87 12 L 95 12 L 95 22 M 5 80 L 5 90 L 13 90 M 87 90 L 95 90 L 95 80"
                fill="none"
                stroke={
                  isRepLocked || liveTelemetry?.framingReady ? '#34D399' : '#FBBF24'
                }
                strokeWidth="0.9"
                strokeLinecap="round"
                style={{ transition: 'stroke 220ms ease' }}
              />

              {liveTelemetry && (
                <>
                  <g
                    data-testid="readiness-live-skeleton-segments"
                    filter="url(#readiness-hud-glow)"
                    opacity="0.9"
                  >
                    {liveTelemetry.overlaySegments.map(seg => (
                      <line
                        key={`${seg.from}-${seg.to}`}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke={
                          isRepLocked || liveTelemetry.framingReady ? '#34D399' : '#FBBF24'
                        }
                        strokeWidth="0.85"
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                  <g data-testid="readiness-live-skeleton-nodes">
                    {liveTelemetry.overlayNodes.map(pt => (
                      <g key={pt.id} opacity={Math.max(0.55, pt.confidence)}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="2.0"
                          fill={
                            isRepLocked || liveTelemetry.framingReady
                              ? 'rgba(52,211,153,0.22)'
                              : 'rgba(251,191,36,0.22)'
                          }
                          stroke={
                            isRepLocked || liveTelemetry.framingReady
                              ? 'rgba(52,211,153,0.55)'
                              : 'rgba(251,191,36,0.55)'
                          }
                          strokeWidth="0.35"
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="0.95"
                          fill="#090A0D"
                          stroke="#FFFFFF"
                          strokeWidth="0.5"
                        />
                      </g>
                    ))}
                  </g>
                </>
              )}
            </svg>

            {/* Live Angle Telemetry Strip at Bottom of Viewport when Pose Landmarks are Active */}
            {stage === 'scanning' && liveTelemetry && (
              <div
                data-testid="readiness-live-angles"
                className="pointer-events-none absolute inset-x-2.5 bottom-2 z-10 flex flex-wrap items-center gap-1.5"
              >
                {activeMovement === 'overhead_squat' ? (
                  <>
                    <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-emerald-300">
                      Ankle DF {liveTelemetry.angles.ankleDorsiflexionDeg}°
                    </span>
                    <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-zinc-100">
                      Hip Depth {liveTelemetry.angles.hipCreaseDepthDeg}°
                    </span>
                    <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-zinc-200">
                      Valgus {liveTelemetry.angles.kneeValgusDeg}°
                    </span>
                  </>
                ) : (
                  <>
                    <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-emerald-300">
                      Shoulder Flex {liveTelemetry.angles.shoulderFlexionDeg}°
                    </span>
                    <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-zinc-100">
                      T-Spine {liveTelemetry.angles.thoracicExtensionDeg}°
                    </span>
                    <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-zinc-200">
                      Neck Drift {liveTelemetry.angles.cervicalDriftDeg}°
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Progress + Rep Counter Row */}
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                data-testid="readiness-rep-counter"
                className={`font-mono text-xs font-extrabold uppercase tracking-wider tabular-nums ${
                  isRepLocked ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {stage === 'countdown'
                  ? `Framing Countdown · ${countdownSec}s`
                  : `Completed ${completedReps} of 3 Reps · ${Math.max(0, SCAN_WINDOW_SECONDS - scanElapsedSec)}s Left`}
              </span>
              <div className="flex gap-1.5" aria-hidden="true">
                {[1, 2, 3].map(r => (
                  <span
                    key={r}
                    className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                      r <= completedReps
                        ? 'bg-emerald-400'
                        : stage === 'scanning' && r === activeRepIndex
                          ? 'bg-amber-400'
                          : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {stage === 'scanning' && (
              <div className="flex items-center gap-2">
                <label htmlFor={progressId} className="sr-only">
                  25-second readiness scan window progress
                </label>
                <progress
                  id={progressId}
                  max={SCAN_WINDOW_SECONDS}
                  value={scanElapsedSec}
                  className="h-1.5 w-full overflow-hidden rounded-full accent-emerald-400 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-emerald-400"
                />
              </div>
            )}
          </div>

          <div className="mt-2 text-xs font-medium leading-relaxed text-zinc-100 sm:text-sm">
            {REP_CUES[screenMode][activeRepIndex - 1]}
          </div>

          {/* Active Scan Controls */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {stage === 'countdown' ? (
                <button
                  type="button"
                  data-testid="readiness-skip-countdown-btn"
                  onClick={beginLiveScanningWindow}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                >
                  <Camera size={14} aria-hidden="true" />
                  <span>Start Now (Skip 5s)</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="readiness-log-rep-btn"
                  onClick={handleManualLogRep}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>Log Rep ({completedReps}/3)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleFlipCameraFacing}
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                <RefreshCw size={13} aria-hidden="true" />
                <span>{cameraFacing === 'user' ? 'Rear Lens' : 'Front Lens'}</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="readiness-cancel-scan-btn"
              onClick={() => {
                cleanupCamera()
                setStage('idle')
              }}
              className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              Cancel
            </button>
          </div>

          {/* Honest Fallback Bar When Camera Permission Denied or CV Model Offline */}
          {cameraNotice && (
            <div
              data-testid="readiness-camera-fallback-bar"
              className="mt-3 space-y-2 rounded-xl border border-white/10 bg-[#181B22] p-3 text-xs text-zinc-300"
            >
              <div>{cameraNotice}</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(READINESS_PRESET_LABELS) as ReadinessPresetId[]).map(presetId => (
                  <button
                    key={presetId}
                    type="button"
                    data-testid={`readiness-fallback-${presetId}`}
                    onClick={() => handleSelfCheckPreset(presetId)}
                    className="forge-tactile-press min-h-[44px] rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-200 transition-colors hover:bg-emerald-500/20"
                  >
                    {READINESS_PRESET_LABELS[presetId]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage 4: Evaluated Readiness Score & Warm-Up Preview */}
      {stage === 'complete' && result && (
        <div
          data-testid="readiness-result-card"
          className="space-y-3 rounded-2xl border border-white/10 bg-[#181B22]/90 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TelemetryRingGauge
                score={result.readinessScore}
                max={100}
                size={60}
                strokeWidth={4.5}
                showMax
                tone={result.readinessScore >= 85 ? 'emerald' : 'amber'}
                label={`Forge Readiness Score ${result.readinessScore} out of 100`}
              />
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="forge-eyebrow-micro">Forge Readiness Score</span>
                  <span
                    data-testid="readiness-source-badge"
                    className="rounded-full border border-white/10 bg-[#090A0D] px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-zinc-300"
                  >
                    {result.evaluationSource === 'live_pose_cv'
                      ? `Live 33-Pt CV · ${result.capturedRepsCount}/3 Reps`
                      : 'Mobility Self-Check'}
                  </span>
                </div>
                <div
                  data-testid="readiness-score-value"
                  className={`mt-0.5 font-mono text-2xl font-extrabold tabular-nums ${
                    result.readinessScore >= 85 ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {result.readinessScore}
                  <span className="text-xs font-medium text-zinc-400">/100</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {result.checks.map(chk => (
                <span
                  key={chk.id}
                  data-testid={`readiness-check-pill-${chk.id}`}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold tabular-nums ${
                    chk.status === 'optimal'
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  {chk.label}: {chk.measuredDeg}°
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
            {result.coachSummary}
          </p>

          {result.injectedDrills.length > 0 && (
            <div
              data-testid="readiness-injected-drills-preview"
              className="space-y-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-200"
            >
              <div>
                <strong className="tabular-nums text-amber-100">
                  Auto-Injecting {result.injectedDrills.length} Corrective{' '}
                  {result.injectedDrills.length === 1 ? 'Drill' : 'Drills'} (
                  {result.totalInjectedDurationSec}s
                  {expressModeActive ? ' · 20m Express Capped' : ''}):
                </strong>{' '}
                {result.injectedDrills.map(d => d.name).join(' · ')}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {result.injectedDrills.map(drill => {
                  const thumb =
                    drill.imageUrl ||
                    resolveGaaExerciseImage(drill.name, false) ||
                    BRAND_LOGO_FALLBACK_IMAGE
                  return (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() =>
                        setActiveVideoModal({
                          name: drill.name,
                          imageUrl: thumb,
                          coachingCues: [drill.cue],
                          target: drill.targetArea,
                          protocol: `${drill.durationSec}s (${drill.targetArea})`,
                        })
                      }
                      className="flex min-h-[44px] items-center gap-2.5 rounded-lg border border-white/10 bg-[#090A0D]/90 p-2 text-left transition-colors hover:border-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                    >
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[#14171E]">
                        <img
                          src={thumb}
                          alt={drill.name}
                          loading="lazy"
                          onError={e => {
                            e.currentTarget.src = BRAND_LOGO_FALLBACK_IMAGE
                          }}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 font-mono text-[8.5px] font-bold uppercase text-emerald-300">
                          Demo
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11.5px] font-bold text-white">
                          {drill.name}
                        </div>
                        <div className="truncate text-[10.5px] text-zinc-400">
                          {drill.targetArea} · {drill.durationSec}s
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              data-testid="readiness-apply-begin-btn"
              onClick={() =>
                onComplete({
                  readinessScore: result.readinessScore,
                  injectedDrills: result.injectedDrills,
                  restrictionFlags: result.restrictionFlags,
                })
              }
              className="forge-tactile-press min-h-[44px] flex-1 basis-52 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              {result.injectedDrills.length > 0
                ? 'Apply Warm-Up & Begin Set 1 →'
                : 'Begin Today’s Workout →'}
            </button>
            <button
              type="button"
              data-testid="readiness-rescan-btn"
              onClick={() => {
                setResult(null)
                setRawResultDrills([])
                setStage('idle')
              }}
              className="forge-tactile-press min-h-[44px] rounded-xl border border-white/10 bg-[#090A0D] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors duration-150 hover:border-white/15 hover:bg-[#111318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Re-Scan
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-2.5">
            <button
              type="button"
              onClick={() => {
                const primaryFlagCheck = result.checks.find(c => c.status !== 'optimal')
                const spokenSummary = buildPostScanDiagnosticSummary({
                  scanType: 'camera_readiness_30s',
                  score: result.readinessScore,
                  primaryFinding: primaryFlagCheck
                    ? `${primaryFlagCheck.label.toLowerCase()} at ${primaryFlagCheck.measuredDeg} degrees`
                    : 'balanced bilateral joint range',
                  actionableFix: result.coachSummary,
                })
                void speakCoachDynamicText(spokenSummary, {
                  moment: 'post_scan_summary',
                  forceUnlockVoiceOnTap: true,
                })
              }}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3 py-2 text-xs font-bold text-zinc-100 hover:bg-[#1D212A]"
            >
              <Volume2 size={14} className="text-emerald-300" aria-hidden="true" />
              <span>Listen to Coach Gordon</span>
            </button>

            <button
              type="button"
              onClick={() => setEscalationOpen(true)}
              data-testid="readiness-message-real-coach-btn"
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
            >
              {isCoachSupport ? (
                <Smartphone size={14} aria-hidden="true" />
              ) : (
                <Mail size={14} aria-hidden="true" />
              )}
              <span>
                {isCoachSupport
                  ? 'Text Real Coach Gordon (24h SLA)'
                  : 'Message Real Coach Gordon'}
              </span>
            </button>
          </div>

          <CoachEscalationModal
            open={escalationOpen}
            onClose={() => setEscalationOpen(false)}
            sourceContext="post_scan_results"
            initialQuestion={`Hi Coach Gordon — my 30s Camera Readiness Check came in at ${result.readinessScore}/100 (${result.restrictionFlags.join(', ') || 'clean checkpoints'}). Any form cue to prioritize today?`}
            telemetryOverride={{
              readinessIndex: result.readinessScore,
              postureFlags: result.restrictionFlags,
              expressModeActive,
            }}
          />
        </div>
      )}

      {activeVideoModal && (
        <ExerciseVideoModal
          exercise={activeVideoModal}
          onClose={() => setActiveVideoModal(null)}
        />
      )}
    </div>
  )
}
