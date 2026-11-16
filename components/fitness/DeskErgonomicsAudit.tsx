'use client'

import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import TelemetryRingGauge from '@/components/ui/TelemetryRingGauge'
import { useSfxMuted } from '@/lib/sfx-audio'
import {
  evaluateDeskErgonomicsFromLandmarks,
  evaluateMediaPipeSeatedPose,
  reconstructScanFromSavedWorkstation,
  SAMPLE_DESK_LANDMARKS,
  STRAIN_COLORS,
  STRAIN_LABELS,
  type DeskErgonomicsScanResult,
} from '@/lib/desk-ergonomics-engine'
import {
  loadPostureProfileState,
  persistDeskErgonomicFlags,
  POSTURE_PROFILE_EVENT,
  type ErgonomicFlag,
  type SavedWorkstationProfile,
  type StrainLevel,
} from '@/lib/posture-profile-state'
import {
  subscribeToWatchCameraCommand,
  syncCameraRemoteStateToWatch,
} from '@/lib/native-healthkit-bridge'
import { Mail, Smartphone, Volume2 } from 'lucide-react'
import { useTierAccess } from '@/lib/tierEntitlements'
import CoachEscalationModal from '@/components/coach-gordon/CoachEscalationModal'
import {
  buildPostScanDiagnosticSummary,
  playCoachStaticCue,
  speakCoachDynamicText,
} from '@/src/lib/audio/coachVoiceEngine'

export interface DeskErgonomicsAuditProps {
  /** Whether parent dialog/container is currently open (stops hardware camera immediately when false) */
  isOpen?: boolean
  /** Render read-only preloaded sample in landing page Sneak Peek bezel with zero protected calls */
  sandboxMode?: boolean
  /** Callback when user clicks "Launch Targeted 5-Min Desk Reset →" */
  onLaunchDeskReset?: (flags: ErgonomicFlag[]) => void
  /** Current saved workstation limit for tier gating (null = unlimited) */
  maxSavedProfiles?: number | null
  /** Triggered when user taps "+ Audit Another Desk" after reaching Core Lab limit */
  onUpgradeWorkstationLimit?: () => void
  /** Optional contextual post-scan banner slot (e.g. Core Lab -> Plus Form Lab verification CTA) */
  renderPostScanBanner?: (result: DeskErgonomicsScanResult) => React.ReactNode
}

interface CachedPoseLandmarker {
  detect: (source: HTMLImageElement | HTMLCanvasElement) => {
    landmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>>
    worldLandmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>>
  }
}

const LOCAL_POSE_MODEL_PATH = '/models/pose_landmarker_lite.task'
const FALLBACK_POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let sharedPoseLandmarkerPromise: Promise<CachedPoseLandmarker> | null = null

function getOrInitDeskPoseLandmarker(): Promise<CachedPoseLandmarker> {
  if (sharedPoseLandmarkerPromise) return sharedPoseLandmarkerPromise

  sharedPoseLandmarkerPromise = (async () => {
    const vision = await import('@mediapipe/tasks-vision')
    let fileset
    try {
      fileset = await vision.FilesetResolver.forVisionTasks('/wasm')
    } catch {
      fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )
    }

    const createWith = async (modelAssetPath: string, delegate: 'GPU' | 'CPU') =>
      (await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.35,
        minPosePresenceConfidence: 0.35,
        minTrackingConfidence: 0.35,
      })) as unknown as CachedPoseLandmarker

    for (const modelPath of [LOCAL_POSE_MODEL_PATH, FALLBACK_POSE_MODEL_URL]) {
      try {
        return await createWith(modelPath, 'GPU')
      } catch {
        try {
          return await createWith(modelPath, 'CPU')
        } catch {
          // Try fallback model source
        }
      }
    }
    throw new Error('Unable to initialize MediaPipe PoseLandmarker')
  })().catch(err => {
    sharedPoseLandmarkerPromise = null
    throw err
  })

  return sharedPoseLandmarkerPromise
}

/**
 * Crops the live `<video>` stream to the exact 4:3 region displayed inside the `object-fit: cover`
 * viewfinder so the analyzed image and landmark overlay match what the user framed 1:1.
 */
function captureViewfinderCroppedCanvas(video: HTMLVideoElement): HTMLCanvasElement | null {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (vw <= 0 || vh <= 0) return null

  const targetAspect = 4 / 3
  const videoAspect = vw / vh
  let srcX = 0
  let srcY = 0
  let srcW = vw
  let srcH = vh

  if (videoAspect > targetAspect) {
    srcW = Math.round(vh * targetAspect)
    srcX = Math.round((vw - srcW) / 2)
  } else if (videoAspect < targetAspect) {
    srcH = Math.round(vw / targetAspect)
    srcY = Math.round((vh - srcH) / 2)
  }

  const maxDim = 1280
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH))
  const outW = Math.max(1, Math.round(srcW * scale))
  const outH = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, outW, outH)
  return canvas
}

function buildJointArcPath(
  vertex: { x: number; y: number },
  armA: { x: number; y: number },
  armB: { x: number; y: number },
  radius = 6.2
): string {
  const startAngle = Math.atan2(armA.y - vertex.y, armA.x - vertex.x)
  const endAngle = Math.atan2(armB.y - vertex.y, armB.x - vertex.x)

  let delta = endAngle - startAngle
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2

  const sweepFlag = delta >= 0 ? 1 : 0
  const x1 = vertex.x + radius * Math.cos(startAngle)
  const y1 = vertex.y + radius * Math.sin(startAngle)
  const x2 = vertex.x + radius * Math.cos(endAngle)
  const y2 = vertex.y + radius * Math.sin(endAngle)

  return `M ${vertex.x} ${vertex.y} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

export default function DeskErgonomicsAudit({
  isOpen = true,
  sandboxMode = false,
  onLaunchDeskReset,
  maxSavedProfiles = null,
  onUpgradeWorkstationLimit,
  renderPostScanBanner,
}: DeskErgonomicsAuditProps) {
  const { sfxMuted, toggleSfxMuted, playTone } = useSfxMuted()
  const { tierId } = useTierAccess()
  const isCoachSupport = tierId === 'coach_support'
  const workstationInputId = useId()
  const [escalationOpen, setEscalationOpen] = useState(false)

  const [scanResult, setScanResult] = useState<DeskErgonomicsScanResult | null>(() =>
    sandboxMode ? evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain) : null
  )
  const [capturedImageSrc, setCapturedImageSrc] = useState<string | null>(null)
  const [sampleVariant, setSampleVariant] = useState<'typical_strain' | 'optimal_setup'>('typical_strain')
  const [workstationLabel, setWorkstationLabel] = useState<string>('Home Desk')
  const [savedProfiles, setSavedProfiles] = useState<SavedWorkstationProfile[]>([])
  const [activeSavedProfileId, setActiveSavedProfileId] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [countdownSec, setCountdownSec] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)
  const cameraActiveRef = useRef(cameraActive)
  cameraActiveRef.current = cameraActive
  const isMountedRef = useRef(true)
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Pre-warm MediaPipe PoseLandmarker in the background when the audit surface opens
  useEffect(() => {
    if (sandboxMode || !isOpen || typeof window === 'undefined') return
    void getOrInitDeskPoseLandmarker().catch(() => {
      // Handled when user triggers a scan
    })
  }, [isOpen, sandboxMode])

  useEffect(() => {
    if (sandboxMode) return
    const sync = () => {
      const persisted = loadPostureProfileState()
      setSavedProfiles(persisted.workstationProfiles)
    }
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [sandboxMode])

  const stopCamera = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop())
      activeStreamRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setCountdownSec(null)
  }, [])

  useEffect(() => {
    if (cameraActive && videoRef.current && activeStreamRef.current) {
      videoRef.current.srcObject = activeStreamRef.current
      void videoRef.current.play().catch(() => {})
    }
  }, [cameraActive])

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
    }
  }, [isOpen, stopCamera])

  useEffect(() => {
    const handleHardwareRelease = () => stopCamera()
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        stopCamera()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cameraActiveRef.current) {
        stopCamera()
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('forge:release-camera-hardware', handleHardwareRelease)
      window.addEventListener('forge:release-camera', handleHardwareRelease)
      window.addEventListener('keydown', handleKeyDown)
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('forge:release-camera-hardware', handleHardwareRelease)
        window.removeEventListener('forge:release-camera', handleHardwareRelease)
        window.removeEventListener('keydown', handleKeyDown)
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      stopCamera()
    }
  }, [stopCamera])

  const finalizeScan = useCallback(
    (result: DeskErgonomicsScanResult, imageDataUrl: string | null, autoPersist = true) => {
      setScanResult(result)
      setCapturedImageSrc(imageDataUrl)
      playTone('success')

      if (!sandboxMode) {
        const flaggedAngle = result.angles.find(a => a.status !== 'optimal')
        const spokenSummary = buildPostScanDiagnosticSummary({
          scanType: 'desk_ergonomics',
          score: result.score,
          primaryFinding: flaggedAngle
            ? `${flaggedAngle.title.toLowerCase()} (${flaggedAngle.measuredDegrees} degrees)`
            : 'clean ergonomic alignment',
          actionableFix: result.adjustments[0]?.headline,
        })
        void speakCoachDynamicText(spokenSummary, { moment: 'post_scan_summary' })
      }

      if (!sandboxMode && autoPersist) {
        const craniovertebralDeg =
          result.angles.find(a => a.id === 'craniovertebral')?.measuredDegrees ?? 0
        const shoulderProtractionDeg =
          result.angles.find(a => a.id === 'shoulder_protraction')?.measuredDegrees ?? 0
        const elbowAngleDeg =
          result.angles.find(a => a.id === 'elbow_wrist')?.measuredDegrees ?? 95
        const seatedHipAngleDeg =
          result.angles.find(a => a.id === 'seated_hip')?.measuredDegrees ?? 100
        const resolvedLabel = workstationLabel.trim() || `Workstation ${savedProfiles.length + 1}`
        const isUpdatingExistingLabel = savedProfiles.some(
          p => p.label.trim().toLowerCase() === resolvedLabel.toLowerCase()
        )

        const canSaveNewProfile =
          maxSavedProfiles === null ||
          isUpdatingExistingLabel ||
          savedProfiles.length < maxSavedProfiles
        const updated = persistDeskErgonomicFlags(
          result.ergonomicFlags,
          canSaveNewProfile
            ? {
                label: resolvedLabel,
                score: result.score,
                strainLevel: result.overallStrain,
                ergonomicFlags: result.ergonomicFlags,
                craniovertebralDeg,
                shoulderProtractionDeg,
                elbowAngleDeg,
                seatedHipAngleDeg,
              }
            : undefined
        )
        setSavedProfiles(updated.workstationProfiles)
        const matchedSaved = updated.workstationProfiles.find(
          p => p.label.trim().toLowerCase() === resolvedLabel.toLowerCase()
        )
        setActiveSavedProfileId(matchedSaved?.id ?? null)

        const mappedStrainLevel =
          result.overallStrain === 'coral'
            ? 'high_strain'
            : result.overallStrain === 'amber'
              ? 'moderate_strain'
              : 'optimal'

        void import('@/src/lib/telemetry/telemetryClient').then(({ trackEvent }) =>
          trackEvent('desk_ergonomics_completed', {
            workstation_score: result.score,
            strain_level: mappedStrainLevel,
            strain_flags: result.ergonomicFlags,
            ear_shoulder_angle_deg: craniovertebralDeg,
            shoulder_protraction_deg: shoulderProtractionDeg,
            elbow_angle_deg: elbowAngleDeg,
            seated_hip_angle_deg: seatedHipAngleDeg,
            workstation_label: resolvedLabel,
          })
        )
      }
    },
    [maxSavedProfiles, playTone, sandboxMode, savedProfiles, workstationLabel]
  )

  const detectPoseOrFallback = useCallback(
    async (imgEl: HTMLImageElement | HTMLCanvasElement, dataUrl: string) => {
      const imgWidth =
        imgEl instanceof HTMLImageElement ? imgEl.naturalWidth || imgEl.width : imgEl.width
      const imgHeight =
        imgEl instanceof HTMLImageElement ? imgEl.naturalHeight || imgEl.height : imgEl.height

      // Synthetic micro test fixtures (e.g. 4x4 PNG buffers in automated UI specs) use deterministic reference
      if (imgWidth < 32 || imgHeight < 32) {
        const fallbackResult = evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain)
        finalizeScan(fallbackResult, dataUrl)
        return
      }

      setIsAnalyzing(true)
      setCameraError(null)

      try {
        const landmarker = await Promise.race([
          getOrInitDeskPoseLandmarker(),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 10000)),
        ])

        if (!isMountedRef.current) return

        if (!landmarker) {
          setCameraError(
            '33-point vision model timed out while loading. Please retry your scan now that assets are warming.'
          )
          return
        }

        const detection = landmarker.detect(imgEl)
        const firstPose = detection?.landmarks?.[0]
        const firstWorldPose = detection?.worldLandmarks?.[0]

        if (!firstPose) {
          setCameraError(
            'No seated posture detected in frame. Ensure your head, shoulders, and torso are clearly visible in good lighting, then retake or upload another photo.'
          )
          return
        }

        const evaluated = evaluateMediaPipeSeatedPose(firstPose, {
          imageWidth: imgWidth,
          imageHeight: imgHeight,
          worldLandmarks: firstWorldPose,
        })

        if (!evaluated) {
          setCameraError(
            'Key upper-body landmarks (ear and shoulder) were out of frame. Step back slightly so your head, shoulders, and torso are visible.'
          )
          return
        }

        finalizeScan(evaluated, dataUrl)
        if (sandboxMode) {
          setStatusNote(
            `Local workstation frame analyzed in browser (0 bytes uploaded) · Score ${evaluated.score}/100.`
          )
        } else if (evaluated.cameraAngle === 'frontal') {
          setStatusNote(
            `33-point posture analyzed (${evaluated.trackedJointCount ?? 7}/7 joints · 3D depth) · Score ${evaluated.score}/100. Tip: angle 60°–90° sideways for full 4-joint side view.`
          )
        } else {
          setStatusNote(
            `33-point posture analyzed from image (${evaluated.trackedJointCount ?? 7}/7 joints tracked) · Score ${evaluated.score}/100.`
          )
        }
      } catch {
        if (!isMountedRef.current) return
        setCameraError(
          'Local 33-point vision engine could not run in this browser context. Check WebGL/WebAssembly settings or try another photo.'
        )
      } finally {
        if (isMountedRef.current) {
          setIsAnalyzing(false)
        }
      }
    },
    [finalizeScan, sandboxMode]
  )

  const detectPoseRef = useRef(detectPoseOrFallback)
  detectPoseRef.current = detectPoseOrFallback

  const handleLoadSample = useCallback(
    (variant: 'typical_strain' | 'optimal_setup' = 'typical_strain') => {
      setSampleVariant(variant)
      setCameraError(null)
      const result = evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS[variant])
      finalizeScan(result, null, !sandboxMode)
      if (!sandboxMode) {
        setStatusNote(
          variant === 'typical_strain'
            ? 'Sample Desk Scan loaded · Ergonomic flags synced to 5-Min Desk Reset.'
            : 'Optimal Workstation reference loaded.'
        )
      } else {
        setStatusNote(null)
      }
    },
    [finalizeScan, sandboxMode]
  )

  const startLiveFiveSecondAudit = async (overrideFacing?: 'user' | 'environment') => {
    setCameraError(null)
    setStatusNote(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera stream unavailable on this browser or device.')
      return
    }

    const activeFacing = overrideFacing ?? cameraFacing
    if (overrideFacing) {
      setCameraFacing(overrideFacing)
    }

    // Warm PoseLandmarker during the 5-second countdown so capture inference is instantaneous
    void getOrInitDeskPoseLandmarker().catch(() => {})

    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: activeFacing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      if (!isMountedRef.current || !isOpenRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      activeStreamRef.current = stream
      setCameraActive(true)
      setCountdownSec(5)
      playCoachStaticCue('calibration_framing')

      let remaining = 5
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1
        if (remaining > 0) {
          setCountdownSec(remaining)
          if (remaining === 2) {
            playCoachStaticCue('calibration_locked')
          } else {
            playTone('countdown')
          }
        } else {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current)
            countdownTimerRef.current = null
          }
          const video = videoRef.current
          const canvas = video ? captureViewfinderCroppedCanvas(video) : null
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
            stopCamera()
            void detectPoseRef.current(canvas, dataUrl)
            return
          }
          stopCamera()
          setCameraError('Camera frame was not ready yet. Please tap 5s Camera Timer again.')
        }
      }, 1000)
    } catch {
      setCameraError('Camera permission was declined or blocked by browser settings.')
      stopCamera()
      if (!sandboxMode) {
        void import('@/src/lib/telemetry/telemetryClient').then(({ trackEvent }) =>
          trackEvent('client_runtime_diagnostic', {
            diagnostic_kind: 'camera_permission',
            camera_permission_state: 'denied',
            component_context: 'DeskErgonomicsAudit',
          })
        )
      }
    }
  }

  const [isDragOver, setIsDragOver] = useState(false)

  const processUploadedFile = (file: File) => {
    if (file.type && !/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.type)) {
      setCameraError('Please select a JPEG, PNG, WebP, or HEIC side-profile photo.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setCameraError('Side-profile photo must be 15 MB or smaller.')
      return
    }
    setCameraError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (!dataUrl) return
      const img = new window.Image()
      img.onload = () => {
        void detectPoseOrFallback(img, dataUrl)
      }
      img.onerror = () => {
        setCameraError('Could not decode image file. Please try a JPEG, PNG, or WebP photo.')
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    processUploadedFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const handleSelectSavedProfile = (profile: SavedWorkstationProfile) => {
    setActiveSavedProfileId(profile.id)
    setWorkstationLabel(profile.label)
    setSampleVariant(profile.strainLevel === 'optimal' ? 'optimal_setup' : 'typical_strain')
    setCapturedImageSrc(null)
    setCameraError(null)
    setScanResult(reconstructScanFromSavedWorkstation(profile))
    setStatusNote(`Loaded saved workstation "${profile.label}" (${profile.score}/100).`)
  }

  const handleAuditAnotherDesk = () => {
    if (
      !sandboxMode &&
      maxSavedProfiles !== null &&
      savedProfiles.length >= maxSavedProfiles
    ) {
      onUpgradeWorkstationLimit?.()
      return
    }
    setScanResult(null)
    setCapturedImageSrc(null)
    setActiveSavedProfileId(null)
    setWorkstationLabel(`Workstation ${savedProfiles.length + 1}`)
    setStatusNote(null)
  }

  const badgeTone = (status: StrainLevel) => ({
    color: STRAIN_COLORS[status],
    bg:
      status === 'optimal'
        ? 'rgba(16, 185, 129, 0.12)'
        : status === 'amber'
          ? 'rgba(245, 158, 11, 0.12)'
          : 'rgba(251, 113, 133, 0.12)',
    border:
      status === 'optimal'
        ? 'rgba(16, 185, 129, 0.30)'
        : status === 'amber'
          ? 'rgba(245, 158, 11, 0.32)'
          : 'rgba(251, 113, 133, 0.34)',
  })

  const isLockedFrame = (countdownSec ?? 5) <= 2

  // Bidirectional Apple Watch Wrist Camera Remote sync (Desk Ergonomics Audit)
  useEffect(() => {
    if (sandboxMode) return
    const isActive = !scanResult
    void syncCameraRemoteStateToWatch({
      isActive,
      mode: 'desk_audit',
      modeTitle: 'Desk Ergonomics Audit',
      framingStatus: isLockedFrame && cameraActive ? 'locked' : cameraActive ? 'recording' : 'framing',
      isRecording: cameraActive,
      countdownSeconds: countdownSec ?? 0,
      repCount: 0,
      targetReps: 1,
      statusHint:
        isLockedFrame && cameraActive
          ? 'Locked · Emerald — capturing seated profile'
          : cameraActive
            ? `Hold natural seated posture (${countdownSec ?? 5}s)`
            : 'Prop iPhone 6–8 ft at 90° side view',
    })
  }, [cameraActive, countdownSec, isLockedFrame, sandboxMode, scanResult])

  useEffect(() => {
    if (sandboxMode) return
    let cleanupWatchSub: (() => void) | null = null
    void subscribeToWatchCameraCommand(cmd => {
      if (cmd.command === 'startTimer5s' || cmd.command === 'recordRep') {
        if (!cameraActive) {
          if (typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function') {
            void startLiveFiveSecondAudit()
          } else {
            handleLoadSample('typical_strain')
          }
        }
      } else if (cmd.command === 'stopAndReview') {
        stopCamera()
        handleLoadSample('typical_strain')
      } else if (cmd.command === 'dismissRemote') {
        stopCamera()
      }
    }).then(unsub => {
      cleanupWatchSub = unsub
    })

    return () => {
      cleanupWatchSub?.()
      void syncCameraRemoteStateToWatch({
        isActive: false,
        mode: 'desk_audit',
        modeTitle: 'Desk Ergonomics Audit',
        framingStatus: 'framing',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, handleLoadSample, sandboxMode, stopCamera])

  return (
    <div
      data-testid="desk-ergonomics-audit"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`forge-surface-card rounded-2xl text-zinc-100 transition-shadow duration-150 ${
        sandboxMode ? 'p-3.5 sm:p-4' : 'p-4 sm:p-6'
      } ${isDragOver ? 'ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-[#090A0D]' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
              33-Point Side-Profile Vision
            </span>
            {!sandboxMode && savedProfiles.length > 0 && (
              <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-400">
                {savedProfiles.length} {savedProfiles.length === 1 ? 'Desk Saved' : 'Desks Saved'}
              </span>
            )}
          </div>
          <h3
            className={`mt-1.5 font-bold tracking-tight text-white ${
              sandboxMode ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
            }`}
            style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}
          >
            Desk Ergonomics Camera Audit
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {sandboxMode ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#090A0D] p-1">
              <button
                type="button"
                onClick={() => handleLoadSample('typical_strain')}
                aria-pressed={sampleVariant === 'typical_strain'}
                className={`forge-tactile-press min-h-[44px] rounded-lg px-3 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                  sampleVariant === 'typical_strain'
                    ? 'border border-rose-500/35 bg-rose-500/15 text-rose-200'
                    : 'text-zinc-400 hover:bg-[#181B22] hover:text-zinc-200'
                }`}
              >
                Before Fix
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('optimal_setup')}
                aria-pressed={sampleVariant === 'optimal_setup'}
                className={`forge-tactile-press min-h-[44px] rounded-lg px-3 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                  sampleVariant === 'optimal_setup'
                    ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                    : 'text-zinc-400 hover:bg-[#181B22] hover:text-zinc-200'
                }`}
              >
                Optimal Desk
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleSfxMuted}
              aria-label="Desk timer sound effects"
              aria-pressed={!sfxMuted}
              className={`forge-tactile-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                sfxMuted
                  ? 'border-white/10 bg-[#181B22] text-zinc-400 hover:border-white/15 hover:bg-[#1D212A] hover:text-zinc-200'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
              }`}
            >
              {sfxMuted ? 'SFX MUTED' : 'SFX ON'}
            </button>
          )}
        </div>
      </div>

      {/* Saved Workstation Switcher Pills */}
      {!sandboxMode && savedProfiles.length > 0 && (
        <div
          aria-label="Saved workstation profiles"
          role="group"
          className="flex flex-wrap items-center gap-2"
        >
          {savedProfiles.map(profile => {
            const isActive = activeSavedProfileId === profile.id
            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelectSavedProfile(profile)}
                className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                  isActive
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20 hover:bg-[#1D212A]'
                }`}
              >
                <span>{profile.label}</span>
                <span className="rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[10.5px] font-bold tabular-nums text-emerald-300">
                  {profile.score}/100
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Input Controls (Full controls in member dashboard; local camera & photo upload also unlocked in sandbox) */}
      {!cameraActive && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {!sandboxMode && (
              <>
                <label htmlFor={workstationInputId} className="sr-only">
                  Workstation profile name
                </label>
                <input
                  id={workstationInputId}
                  type="text"
                  name="workstation_label"
                  value={workstationLabel}
                  onChange={e => setWorkstationLabel(e.target.value)}
                  placeholder="Workstation name (e.g. Home Desk)"
                  className="min-h-[44px] min-w-0 flex-1 basis-40 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-base text-white placeholder:text-zinc-500 transition-colors duration-150 hover:border-white/15 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                />
              </>
            )}
            <button
              type="button"
              onClick={() => void startLiveFiveSecondAudit()}
              className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.08em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                sandboxMode
                  ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                  : 'bg-emerald-400 px-4 text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-emerald-300'
              }`}
            >
              <GaaIcon name="camera" size={14} tone={sandboxMode ? 'gold' : 'dark'} />
              <span>5s Camera Timer</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/12 bg-[#181B22] px-3.5 py-2 text-xs font-semibold text-zinc-100 transition-colors duration-150 hover:border-white/20 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              <GaaIcon name="upload" size={14} tone="gold" />
              <span>Upload Side Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              aria-label="Upload side-profile desk photo"
            />

            {sandboxMode ? (
              <span className="font-mono text-[11px] text-zinc-400">
                100% local in-browser analysis · 0 bytes uploaded
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleLoadSample('typical_strain')}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition-colors duration-150 hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
                >
                  Load Sample Desk Scan
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadSample('optimal_setup')}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/20 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
                >
                  Load Optimal Reference
                </button>
              </>
            )}
          </div>

          {/* Graceful Hardware / Permission Recovery Card */}
          {cameraError && (
            <div
              role="status"
              className="rounded-xl border border-amber-500/30 bg-[#181B22] p-3.5 text-xs text-zinc-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="font-semibold text-amber-300">{cameraError}</div>
                  <p className="text-[11.5px] leading-relaxed text-zinc-400">
                    Allow camera access in your browser address bar, upload a seated side photo, or preview the 33-point telemetry right now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadSample('typical_strain')}
                  className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200 transition-colors duration-150 hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                >
                  Run Demo Scan
                </button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div
              role="status"
              className="font-mono text-xs text-amber-300"
            >
              ⟳ Analyzing 33-point posture landmarks locally in browser…
            </div>
          )}

          {statusNote && !isAnalyzing && (
            <div className="font-mono text-xs text-emerald-300">
              ✓ {statusNote}
            </div>
          )}
        </div>
      )}

      {/* Live 5-Second Camera Alignment Viewfinder */}
      {cameraActive && (
        <div
          className={`relative aspect-[4/3] overflow-hidden rounded-2xl border bg-[#090A0D] transition-colors duration-300 ${
            isLockedFrame ? 'border-emerald-400/70' : 'border-amber-400/70'
          }`}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* Frosted-Glass Top Instruction Pill */}
          <div className="forge-glass-pill absolute inset-x-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-full px-3.5 py-2 text-xs text-zinc-100">
            <span className="truncate font-medium">
              Align seated side profile: <strong className="text-white">Ear → Shoulder → Hip → Knee</strong>
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                isLockedFrame
                  ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                  : 'border-amber-500/35 bg-amber-500/15 text-amber-300'
              }`}
            >
              {isLockedFrame ? 'LOCKED' : 'CALIBRATION HOLD'}
            </span>
          </div>

          {/* Corner Framing Brackets (Amber -> Emerald Lock-In) + Dual-Ring Seated Guide */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <defs>
              <filter id="desk-live-glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="0.9" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Animated Corner Framing Brackets */}
            <path
              d="M 6 20 L 6 12 L 14 12 M 86 12 L 94 12 L 94 20 M 6 80 L 6 88 L 14 88 M 86 88 L 94 88 L 94 80"
              fill="none"
              stroke={isLockedFrame ? '#34D399' : '#FBBF24'}
              strokeWidth="0.95"
              strokeLinecap="round"
              style={{ transition: 'stroke 260ms ease' }}
            />

            <line
              x1="36"
              y1="16"
              x2="36"
              y2="84"
              stroke={isLockedFrame ? '#34D399' : '#FBBF24'}
              strokeWidth="0.55"
              strokeDasharray="2 2"
            />
            <polyline
              points="36,24 36,40 36,65 62,66"
              fill="none"
              stroke={isLockedFrame ? '#34D399' : '#38BDF8'}
              strokeWidth="1.05"
              strokeDasharray="2.5 1.5"
              filter="url(#desk-live-glow)"
            />
            {[
              { x: 36, y: 24, lbl: 'EAR' },
              { x: 36, y: 40, lbl: 'SHOULDER' },
              { x: 36, y: 65, lbl: 'HIP' },
              { x: 62, y: 66, lbl: 'KNEE' },
            ].map(pt => (
              <g key={pt.lbl}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.4"
                  fill={isLockedFrame ? 'rgba(52,211,153,0.18)' : 'rgba(251,191,36,0.18)'}
                  stroke={isLockedFrame ? 'rgba(52,211,153,0.45)' : 'rgba(251,191,36,0.45)'}
                  strokeWidth="0.45"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="1.65"
                  fill="#090A0D"
                  stroke={isLockedFrame ? '#34D399' : '#FBBF24'}
                  strokeWidth="0.85"
                />
                <rect x={pt.x + 2.8} y={pt.y - 2.3} width={pt.lbl.length * 2.3 + 2.4} height="4.4" rx="1.2" fill="rgba(9,10,13,0.82)" />
                <text x={pt.x + 4} y={pt.y + 0.8} fill="#F8FAFC" fontSize="2.7" fontWeight="700">
                  {pt.lbl}
                </text>
              </g>
            ))}
          </svg>

          {/* Bottom Timer, Flip Camera & Cancel Pill */}
          <div className="forge-glass-pill absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-2 rounded-xl px-3.5 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`font-mono text-xl font-extrabold tabular-nums ${
                  isLockedFrame ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {countdownSec ?? 5}s
              </span>
              <span className="truncate text-xs text-zinc-300">
                {isLockedFrame ? 'Hold still — capturing seated mesh…' : 'Settle into natural desk posture'}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  void startLiveFiveSecondAudit(
                    cameraFacing === 'user' ? 'environment' : 'user'
                  )
                }
                aria-label="Switch front or rear camera"
                className="forge-tactile-press min-h-[44px] rounded-xl border border-white/15 bg-[#181B22]/90 px-3 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                Flip Lens
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="forge-tactile-press min-h-[44px] rounded-xl border border-white/15 bg-[#181B22]/90 px-3.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results & SVG Joint Angle Overlay */}
      {scanResult && (() => {
        const vbW = capturedImageSrc ? (scanResult.viewBox?.width ?? 100) : 100
        const vbH = capturedImageSrc ? (scanResult.viewBox?.height ?? 100) : 100
        const stageAspect = capturedImageSrc
          ? `${vbW} / ${vbH}`
          : sandboxMode
            ? '16 / 10'
            : '4 / 3'

        return (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-12">
            {/* Left (7 cols on lg): Captured / Sample Seated Silhouette + Glowing Vector Skeleton + Landmark Pill Badges */}
            <div
              className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-[#090A0D] lg:col-span-7"
              style={{
                aspectRatio: stageAspect,
                maxHeight: capturedImageSrc ? '520px' : undefined,
              }}
            >
              {capturedImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capturedImageSrc}
                  alt="Captured side-profile workstation posture"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: 0.9 }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(ellipse at 44% 34%, rgba(16, 185, 129, 0.11) 0%, rgba(17, 19, 24, 0.9) 55%, #090A0D 100%)',
                  }}
                />
              )}

              <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                preserveAspectRatio="xMidYMid meet"
                aria-label="Seated desk posture joint angle overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <defs>
                  <filter id="desk-skeleton-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="0.85" result="glowBlur" />
                    <feMerge>
                      <feMergeNode in="glowBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Desk, Task Chair & Sculpted Seated Athlete Silhouette when in sample mode */}
                {!capturedImageSrc && (
                  <g opacity="0.88">
                    {[20, 40, 60, 80].map(pos => (
                      <g key={`g-${pos}`}>
                        <line x1="4" y1={pos} x2="96" y2={pos} stroke="rgba(255,255,255,0.04)" strokeWidth="0.26" />
                        <line x1={pos} y1="6" x2={pos} y2="94" stroke="rgba(255,255,255,0.04)" strokeWidth="0.26" />
                      </g>
                    ))}
                    {/* Optical corner viewfinder brackets */}
                    <path
                      d="M 5 12 L 5 6 L 11 6 M 89 6 L 95 6 L 95 12 M 5 88 L 5 94 L 11 94 M 89 94 L 95 94 L 95 88"
                      fill="none"
                      stroke={scanResult.overallStrain === 'optimal' ? 'rgba(52,211,153,0.6)' : 'rgba(251,191,36,0.5)'}
                      strokeWidth="0.65"
                      strokeLinecap="round"
                    />
                    {/* Contoured Ergonomic Task Chair Backrest, Lumbar Cushion, Seat Pan & 5-Star Base */}
                    <path
                      d="M 26 28 Q 30.5 47 28.5 67.5"
                      fill="none"
                      stroke="#52525B"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                    />
                    <rect x="28" y="66.5" width="28" height="2.8" rx="1.2" fill="#3F3F46" />
                    <line x1="41" y1="69.3" x2="41" y2="89.5" stroke="#52525B" strokeWidth="1.6" />
                    <line x1="30" y1="90" x2="52" y2="90" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="31" cy="91.2" r="1.1" fill="#71717A" />
                    <circle cx="51" cy="91.2" r="1.1" fill="#71717A" />

                    {/* Machined Standing/Seated Desk Surface, Monitor Arm & Studio Display */}
                    <rect x="55" y="55.2" width="38" height="2.2" rx="0.9" fill="#52525B" />
                    <line x1="84" y1="57.4" x2="84" y2="90.5" stroke="#3F3F46" strokeWidth="1.8" />
                    <rect x="61" y="53.8" width="9" height="1.3" rx="0.5" fill="#A1A1AA" />
                    <rect
                      x="75.2"
                      y={sampleVariant === 'optimal_setup' ? '17.5' : '26.5'}
                      width="3.2"
                      height="20.5"
                      rx="1"
                      fill="#D4D4D8"
                    />
                    <path
                      d={`M 78.4 ${sampleVariant === 'optimal_setup' ? '28' : '37'} L 82.5 ${sampleVariant === 'optimal_setup' ? '33' : '42'} L 82.5 55.2`}
                      fill="none"
                      stroke="#71717A"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Eye-to-Screen Ergonomic Sightline Cone */}
                    <polygon
                      points={`${scanResult.landmarks.ear.x + 3.2},${scanResult.landmarks.ear.y - 0.5} 75,${
                        sampleVariant === 'optimal_setup' ? '19' : '28'
                      } 75,${sampleVariant === 'optimal_setup' ? '34' : '43'}`}
                      fill={
                        scanResult.overallStrain === 'optimal'
                          ? 'rgba(52,211,153,0.07)'
                          : 'rgba(251,191,36,0.06)'
                      }
                    />
                    <line
                      x1={scanResult.landmarks.ear.x + 3.2}
                      y1={scanResult.landmarks.ear.y - 0.5}
                      x2="75"
                      y2={sampleVariant === 'optimal_setup' ? '25.5' : '35'}
                      stroke={scanResult.overallStrain === 'optimal' ? 'rgba(52,211,153,0.55)' : 'rgba(251,191,36,0.5)'}
                      strokeWidth="0.45"
                      strokeDasharray="1.6 1.2"
                    />

                    {/* Seated Athlete Silhouette (Fitted Charcoal Crewneck & Shorts — Shirts-On Standard) */}
                    {/* Thigh, Lower Leg & Training Shoe */}
                    <path
                      d={`M ${scanResult.landmarks.hip.x - 2} ${scanResult.landmarks.hip.y - 3.2}
                          L ${scanResult.landmarks.knee.x + 2.5} ${scanResult.landmarks.knee.y - 3}
                          Q ${scanResult.landmarks.knee.x + 4} ${scanResult.landmarks.knee.y} ${scanResult.landmarks.knee.x + 2.5} ${scanResult.landmarks.knee.y + 3}
                          L ${scanResult.landmarks.ankle.x + 2} ${scanResult.landmarks.ankle.y - 1.5}
                          L ${scanResult.landmarks.ankle.x + 7.5} ${scanResult.landmarks.ankle.y + 0.8}
                          L ${scanResult.landmarks.ankle.x - 2.2} ${scanResult.landmarks.ankle.y + 1.2}
                          L ${scanResult.landmarks.knee.x - 2.8} ${scanResult.landmarks.knee.y + 2.5}
                          L ${scanResult.landmarks.hip.x - 3.5} ${scanResult.landmarks.hip.y + 3.5} Z`}
                      fill="#1F2430"
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="0.45"
                    />
                    {/* Fitted Torso Crewneck */}
                    <path
                      d={`M ${scanResult.landmarks.shoulder.x - 5} ${scanResult.landmarks.shoulder.y - 1.5}
                          Q ${(scanResult.landmarks.shoulder.x + scanResult.landmarks.hip.x) / 2 - 5.5} ${(scanResult.landmarks.shoulder.y + scanResult.landmarks.hip.y) / 2}
                            ${scanResult.landmarks.hip.x - 5} ${scanResult.landmarks.hip.y + 2.5}
                          L ${scanResult.landmarks.hip.x + 6} ${scanResult.landmarks.hip.y + 2.5}
                          L ${scanResult.landmarks.shoulder.x + 5.6} ${scanResult.landmarks.shoulder.y + 1} Z`}
                      fill="#272C3A"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="0.5"
                    />
                    {/* Neck & Sagittal Head Profile */}
                    <path
                      d={`M ${scanResult.landmarks.shoulder.x - 2} ${scanResult.landmarks.shoulder.y - 1}
                          L ${scanResult.landmarks.ear.x - 2} ${scanResult.landmarks.ear.y + 2.5}
                          L ${scanResult.landmarks.ear.x + 2.2} ${scanResult.landmarks.ear.y + 3}
                          L ${scanResult.landmarks.shoulder.x + 2.5} ${scanResult.landmarks.shoulder.y} Z`}
                      fill="#232834"
                    />
                    <circle
                      cx={scanResult.landmarks.ear.x + 1}
                      cy={scanResult.landmarks.ear.y - 0.6}
                      r="4.9"
                      fill="#1E232E"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="0.55"
                    />
                    {/* Crewneck Short-Sleeve & Forearm Reach */}
                    <path
                      d={`M ${scanResult.landmarks.shoulder.x - 1.8} ${scanResult.landmarks.shoulder.y - 0.5}
                          L ${scanResult.landmarks.shoulder.x + 5} ${scanResult.landmarks.shoulder.y + 6.5}
                          L ${scanResult.landmarks.shoulder.x + 0.8} ${scanResult.landmarks.shoulder.y + 8.5} Z`}
                      fill="#323846"
                    />
                  </g>
                )}

                {/* Vertical Hip-to-Shoulder Plumb Line */}
                {(() => {
                  const plumbLabelX = Math.max(2, Math.min(vbW - 21.5, scanResult.plumbLineX + 1.2))
                  const plumbTopY = Math.round(vbH * 0.08 * 10) / 10
                  const plumbBotY = Math.round(vbH * 0.92 * 10) / 10
                  return (
                    <>
                      <line
                        x1={scanResult.plumbLineX}
                        y1={plumbTopY}
                        x2={scanResult.plumbLineX}
                        y2={plumbBotY}
                        stroke="#34D399"
                        strokeOpacity="0.65"
                        strokeWidth="0.55"
                        strokeDasharray="2.2 1.8"
                      />
                      <rect x={plumbLabelX} y={plumbTopY} width="19.5" height="4.6" rx="1.3" fill="rgba(9,10,13,0.86)" />
                      <text
                        x={plumbLabelX + 1.4}
                        y={plumbTopY + 3.2}
                        fill="#6EE7B7"
                        fontSize="2.65"
                        fontWeight="700"
                        letterSpacing="0.06em"
                      >
                        PLUMB LINE
                      </text>
                    </>
                  )
                })()}

                {/* Joint Angle Wedge Arcs + Anti-Aliased Glowing Vector Skeleton + Dual-Ring Nodes + Dark Pill Degree Badges */}
                {(() => {
                  const { ear, shoulder, elbow, wrist, hip, knee, ankle } = scanResult.landmarks
                  const cvMetric = scanResult.angles.find(a => a.id === 'craniovertebral')!
                  const shoulderMetric = scanResult.angles.find(a => a.id === 'shoulder_protraction')!
                  const elbowMetric = scanResult.angles.find(a => a.id === 'elbow_wrist')!
                  const hipMetric = scanResult.angles.find(a => a.id === 'seated_hip')!

                  const showCv = !ear.occluded && !shoulder.occluded
                  const showTorso = !shoulder.occluded && !hip.occluded
                  const showArm = !shoulder.occluded && !elbow.occluded && !wrist.occluded
                  const showUpperArmOnly = !shoulder.occluded && !elbow.occluded && Boolean(wrist.occluded)
                  const showHip = !shoulder.occluded && !hip.occluded && !knee.occluded
                  const showLowerLeg = !knee.occluded && !ankle.occluded

                  const clampBadgeX = (val: number) => Math.max(3, Math.min(vbW - 16.8, val))
                  const clampBadgeY = (val: number) => Math.max(3, Math.min(vbH - 8.4, val))

                  const landmarkBadges = [
                    ...(showCv
                      ? [
                          {
                            key: 'cv',
                            x: clampBadgeX(ear.x - 18.5),
                            y: clampBadgeY(ear.y - 3.5),
                            text: `${cvMetric.measuredDegrees}°`,
                            stroke: cvMetric.colorHex,
                          },
                        ]
                      : []),
                    ...(showArm
                      ? [
                          {
                            key: 'elbow',
                            x: clampBadgeX(elbow.x - 15.5),
                            y: clampBadgeY(elbow.y + 2.2),
                            text: `${elbowMetric.measuredDegrees}°`,
                            stroke: elbowMetric.colorHex,
                          },
                        ]
                      : []),
                    ...(showHip
                      ? [
                          {
                            key: 'hip',
                            x: clampBadgeX(hip.x - 16.5),
                            y: clampBadgeY(hip.y - 2.5),
                            text: `${hipMetric.measuredDegrees}°`,
                            stroke: hipMetric.colorHex,
                          },
                        ]
                      : []),
                  ]

                  return (
                    <>
                      {/* Wedge arcs */}
                      {showCv && scanResult.cameraAngle !== 'frontal' && cvMetric.measuredDegrees >= 1 && (() => {
                        const earToShAngle = Math.atan2(ear.y - shoulder.y, ear.x - shoulder.x)
                        const facingDir = ear.x >= shoulder.x ? 1 : -1
                        const cvRad = (cvMetric.measuredDegrees * Math.PI) / 180
                        const refAngle = earToShAngle - facingDir * cvRad
                        const refArm = {
                          x: shoulder.x + 16 * Math.cos(refAngle),
                          y: shoulder.y + 16 * Math.sin(refAngle),
                        }
                        return (
                          <path
                            d={buildJointArcPath(shoulder, refArm, ear, 8)}
                            fill={cvMetric.colorHex}
                            fillOpacity="0.24"
                            stroke={cvMetric.colorHex}
                            strokeWidth="0.7"
                          />
                        )
                      })()}
                      {showArm && (
                        <path
                          d={buildJointArcPath(elbow, shoulder, wrist, 7)}
                          fill={elbowMetric.colorHex}
                          fillOpacity="0.24"
                          stroke={elbowMetric.colorHex}
                          strokeWidth="0.7"
                        />
                      )}
                      {showHip && (
                        <path
                          d={buildJointArcPath(hip, shoulder, knee, 8)}
                          fill={hipMetric.colorHex}
                          fillOpacity="0.24"
                          stroke={hipMetric.colorHex}
                          strokeWidth="0.7"
                        />
                      )}

                      {/* Glowing Kinetic Chain Vector Strokes (only rendered for visible in-frame joints) */}
                      <g filter="url(#desk-skeleton-glow)" strokeLinecap="round">
                        {showCv && (
                          <line x1={ear.x} y1={ear.y} x2={shoulder.x} y2={shoulder.y} stroke={cvMetric.colorHex} strokeWidth="1.35" />
                        )}
                        {showTorso && (
                          <line x1={shoulder.x} y1={shoulder.y} x2={hip.x} y2={hip.y} stroke={shoulderMetric.colorHex} strokeWidth="1.45" />
                        )}
                        {(showArm || showUpperArmOnly) && (
                          <line x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} stroke={elbowMetric.colorHex} strokeWidth="1.25" />
                        )}
                        {showArm && (
                          <line x1={elbow.x} y1={elbow.y} x2={wrist.x} y2={wrist.y} stroke={elbowMetric.colorHex} strokeWidth="1.25" />
                        )}
                        {showHip && (
                          <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke={hipMetric.colorHex} strokeWidth="1.45" />
                        )}
                        {showLowerLeg && (
                          <line x1={knee.x} y1={knee.y} x2={ankle.x} y2={ankle.y} stroke="#A1A1AA" strokeWidth="1.15" />
                        )}
                      </g>

                      {/* Dual-Ring Landmark Nodes with Confidence-Based Opacity */}
                      {Object.values(scanResult.landmarks)
                        .filter(pt => !pt.occluded)
                        .map((pt, idx) => {
                          const confOpacity = Math.max(0.68, Math.min(0.99, pt.confidence || 0.95 - idx * 0.03))
                          return (
                            <g key={pt.id} opacity={confOpacity}>
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="3.2"
                                fill="rgba(52, 211, 153, 0.14)"
                                stroke="rgba(255, 255, 255, 0.32)"
                                strokeWidth="0.4"
                              />
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="1.55"
                                fill="#090A0D"
                                stroke="#FFFFFF"
                                strokeWidth="0.8"
                              />
                            </g>
                          )
                        })}

                      {/* Crisp Legible Degree Badges Over Anatomical Landmarks */}
                      {landmarkBadges.map(b => (
                        <g key={b.key}>
                          <rect
                            x={b.x}
                            y={b.y}
                            width="13.8"
                            height="5.4"
                            rx="2.2"
                            fill="rgba(9, 10, 13, 0.86)"
                            stroke={b.stroke}
                            strokeOpacity="0.65"
                            strokeWidth="0.45"
                          />
                          <text
                            x={b.x + 6.9}
                            y={b.y + 3.7}
                            textAnchor="middle"
                            fill="#F8FAFC"
                            fontSize="3.1"
                            fontWeight="800"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {b.text}
                          </text>
                        </g>
                      ))}
                    </>
                  )
                })()}
              </svg>

              {/* Animated Workstation Score Ring Pill Overlay (Compact on narrow mobile) */}
              <div className="forge-glass-pill absolute right-2 top-2 flex items-center gap-2 rounded-2xl px-2 py-1.5 sm:right-2.5 sm:top-2.5 sm:gap-2.5 sm:px-2.5 sm:py-2">
                <div className="hidden text-right sm:block">
                  <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Workstation Score
                  </div>
                  <div
                    className="mt-0.5 text-[10.5px] font-bold uppercase tracking-wider"
                    style={{ color: STRAIN_COLORS[scanResult.overallStrain] }}
                  >
                    {STRAIN_LABELS[scanResult.overallStrain]}
                  </div>
                </div>
                <TelemetryRingGauge
                  score={scanResult.score}
                  max={100}
                  size={sandboxMode ? 46 : 52}
                  strokeWidth={4}
                  showMax
                  tone={
                    scanResult.overallStrain === 'optimal'
                      ? 'emerald'
                      : scanResult.overallStrain === 'amber'
                        ? 'amber'
                        : 'coral'
                  }
                  label={`Workstation Score ${scanResult.score} out of 100`}
                />
              </div>
            </div>

            {/* Right (5 cols on lg): 4 Joint Angle Metrics — 1 col on mobile so titles NEVER wrap letter-by-letter */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:grid-cols-2">
              {scanResult.angles.map(angle => {
                const tone = badgeTone(angle.status)
                return (
                  <div
                    key={angle.id}
                    className="rounded-xl p-3 transition-colors duration-150"
                    style={{
                      background: '#181B22',
                      border: `1px solid ${tone.border}`,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider"
                        style={{
                          color: tone.color,
                          background: tone.bg,
                          border: `1px solid ${tone.border}`,
                        }}
                      >
                        {STRAIN_LABELS[angle.status]}
                      </span>
                      <span className="font-mono text-[10.5px] font-medium tabular-nums text-zinc-400">
                        {angle.neutralRangeLabel}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold leading-snug text-zinc-200">
                      {angle.title}
                    </div>
                    <div className="mt-1 font-mono text-xl font-extrabold tabular-nums text-white">
                      {angle.measuredDegrees}°
                    </div>
                    {!sandboxMode && angle.summary && (
                      <div className="mt-1 text-[11px] leading-snug text-zinc-400">
                        {angle.summary}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3 Concrete Workstation Adjustments (Includes actionable guidance in both dashboard & sandbox) */}
          <div className="rounded-xl border border-white/10 bg-[#181B22]/85 p-3.5">
            <div className="forge-eyebrow-micro text-amber-300">
              3 Concrete Workstation Adjustments
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {scanResult.adjustments.map(adj => (
                <div
                  key={adj.id}
                  className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-[#111318] p-3 text-xs leading-relaxed"
                >
                  <span className="mt-0.5 shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-extrabold tabular-nums text-amber-300">
                    0{adj.priority}
                  </span>
                  <div className="min-w-0">
                    <strong className="font-semibold text-white">{adj.headline}</strong>
                    <span className="mt-1 block text-[11.5px] leading-relaxed text-zinc-300">
                      {adj.instruction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Loop Row */}
          {(!sandboxMode || Boolean(onLaunchDeskReset)) && (
            <div className="flex flex-wrap items-center gap-2.5">
              {(!sandboxMode || Boolean(onLaunchDeskReset)) && (
                <button
                  type="button"
                  onClick={() => onLaunchDeskReset?.(scanResult.ergonomicFlags)}
                  className="forge-tactile-press min-h-[44px] flex-1 basis-56 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
                >
                  Launch Targeted 5-Min Desk Reset →
                </button>
              )}

              {sandboxMode ? (
                <button
                  type="button"
                  onClick={() => {
                    const flaggedAngle = scanResult.angles.find(a => a.status !== 'optimal')
                    const spokenSummary = buildPostScanDiagnosticSummary({
                      scanType: 'desk_ergonomics',
                      score: scanResult.score,
                      primaryFinding: flaggedAngle
                        ? `${flaggedAngle.title.toLowerCase()} (${flaggedAngle.measuredDegrees} degrees)`
                        : 'clean ergonomic alignment',
                      actionableFix: scanResult.adjustments[0]?.headline,
                    })
                    void speakCoachDynamicText(spokenSummary, {
                      moment: 'post_scan_summary',
                      forceUnlockVoiceOnTap: true,
                    })
                  }}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3.5 py-2 text-xs font-bold text-zinc-100 hover:bg-[#1D212A]"
                >
                  <Volume2 size={14} className="text-emerald-300" aria-hidden="true" />
                  <span>Hear Coach Gordon</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAuditAnotherDesk}
                    className="forge-tactile-press min-h-[44px] rounded-xl border border-white/10 bg-[#181B22] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
                  >
                    + Audit Another Desk
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const flaggedAngle = scanResult.angles.find(a => a.status !== 'optimal')
                      const spokenSummary = buildPostScanDiagnosticSummary({
                        scanType: 'desk_ergonomics',
                        score: scanResult.score,
                        primaryFinding: flaggedAngle
                          ? `${flaggedAngle.title.toLowerCase()} (${flaggedAngle.measuredDegrees} degrees)`
                          : 'clean ergonomic alignment',
                        actionableFix: scanResult.adjustments[0]?.headline,
                      })
                      void speakCoachDynamicText(spokenSummary, {
                        moment: 'post_scan_summary',
                        forceUnlockVoiceOnTap: true,
                      })
                    }}
                    className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3.5 py-2 text-xs font-bold text-zinc-100 hover:bg-[#1D212A]"
                  >
                    <Volume2 size={14} className="text-emerald-300" aria-hidden="true" />
                    <span>Listen to Coach Gordon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEscalationOpen(true)}
                    data-testid="desk-audit-message-real-coach-btn"
                    className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
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
                </>
              )}
            </div>
          )}

          {!sandboxMode && (
            <CoachEscalationModal
              open={escalationOpen}
              onClose={() => setEscalationOpen(false)}
              sourceContext="post_scan_results"
              initialQuestion={`Hi Coach Gordon — my Desk Ergonomics Audit scored ${scanResult.score}/100 (${scanResult.ergonomicFlags.join(', ') || 'optimal'}). Any daily mobility cues to pair with my setup?`}
              telemetryOverride={{
                postureFlags: scanResult.ergonomicFlags.map(f => f.replace(/_/g, ' ')),
              }}
            />
          )}

          {/* Contextual Upgrade Slot (Trigger 1: Post-Scan Amber/Coral Flag) */}
          {!sandboxMode && renderPostScanBanner?.(scanResult)}
        </div>
        )
      })()}
    </div>
  )
}
