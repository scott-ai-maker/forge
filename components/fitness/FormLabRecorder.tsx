'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Film,
  Lock,
  Sparkles,
  Square,
  Timer,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'
import { playForgeTactileTone } from '@/lib/sfx-audio'
import {
  subscribeToWatchCameraCommand,
  syncCameraRemoteStateToWatch,
} from '@/lib/native-healthkit-bridge'
import { resolveSupportedVideoMimeType } from '@/lib/video-form-analysis'
import {
  TELEMETRY_CAMERA_RELEASE_EVENT,
  trackEvent,
} from '@/src/lib/telemetry/telemetryClient'

const MAX_VIDEO_FILE_BYTES = 100 * 1024 * 1024 // 100 MB

export interface FormLabRecorderProps {
  selectedLiftLabel?: string
  attachedVideoLabel?: string | null
  onVideoCaptured?: (file: File) => void
  onSubmitted?: () => void
}

export default function FormLabRecorder({
  selectedLiftLabel = 'Primary Compound Lift',
  attachedVideoLabel = null,
  onVideoCaptured,
  onSubmitted,
}: FormLabRecorderProps) {
  const { tierId, entitlements, remainingFormLabCredits, spendFormLabCredit } = useTierAccess()
  const noteInputId = useId()
  const headingId = useId()

  const [clipNotes, setClipNotes] = useState('')
  const [submittedClips, setSubmittedClips] = useState<
    Array<{ id: string; lift: string; note: string; clipLabel: string | null; status: string }>
  >([])
  const [submittedConfirmation, setSubmittedConfirmation] = useState<string | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // Local / Live 45° Camera Capture State
  const [cameraDrawerOpen, setCameraDrawerOpen] = useState(false)
  const [streamReady, setStreamReady] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordElapsedSeconds, setRecordElapsedSeconds] = useState(0)
  const [localClipFile, setLocalClipFile] = useState<File | null>(null)
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null)

  // Apple Watch Camera Remote State
  const [watchRecordingActive, setWatchRecordingActive] = useState(false)
  const [watchFramingLocked, setWatchFramingLocked] = useState(false)
  const [watchRepCount, setWatchRepCount] = useState(0)
  const watchRemoteActiveRef = useRef(false)

  const liveVideoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const outOfCredits = remainingFormLabCredits <= 0
  const nextTierName = tierId === 'core_lab' ? 'Plus ($99/mo)' : 'Coach Support ($299/mo)'
  const effectiveClipLabel = localClipFile?.name ?? attachedVideoLabel ?? null

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setRecordedPreviewUrl(null)
  }, [])

  const releaseCameraHardware = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // Ignore already-stopped recorder
      }
    }
    mediaRecorderRef.current = null
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop())
      activeStreamRef.current = null
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null
    }
    setCountdownSeconds(0)
    setIsRecording(false)
    setStreamReady(false)
  }, [])

  const openCameraDrawer = useCallback(async () => {
    setCaptureError(null)
    revokePreviewUrl()
    setCameraDrawerOpen(true)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCaptureError('Live camera API unavailable in this browser. Attach a saved MP4/MOV/WebM clip instead.')
      return
    }

    try {
      releaseCameraHardware()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      activeStreamRef.current = stream
      setStreamReady(true)
      setWatchFramingLocked(true)
      if (liveVideoRef.current) {
        if (typeof MediaStream === 'undefined' || stream instanceof MediaStream) {
          liveVideoRef.current.srcObject = stream
        }
        liveVideoRef.current.play().catch(() => {})
      }
    } catch {
      setCaptureError('Camera permission denied or device busy. Attach a saved video file below instead.')
    }
  }, [releaseCameraHardware, revokePreviewUrl])

  useEffect(() => {
    if (cameraDrawerOpen && streamReady && liveVideoRef.current && activeStreamRef.current) {
      try {
        if (
          typeof MediaStream === 'undefined' ||
          activeStreamRef.current instanceof MediaStream
        ) {
          liveVideoRef.current.srcObject = activeStreamRef.current
        }
        liveVideoRef.current.play().catch(() => {})
      } catch {
        // Ignore non-native stream attachment in synthetic environments
      }
    }
  }, [cameraDrawerOpen, streamReady])

  const stopLiveRecording = useCallback(() => {
    playForgeTactileTone('tick')
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    setIsRecording(false)
    setWatchRecordingActive(false)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        releaseCameraHardware()
      }
    } else {
      releaseCameraHardware()
    }
  }, [releaseCameraHardware])

  const beginMediaRecording = useCallback(() => {
    const stream = activeStreamRef.current
    if (!stream) {
      setCaptureError('Open the live camera preview before starting your working-set recording.')
      return
    }
    setCaptureError(null)
    recordedChunksRef.current = []
    setRecordElapsedSeconds(0)

    const negotiatedMime = resolveSupportedVideoMimeType()
    try {
      const recorder =
        typeof MediaRecorder !== 'undefined'
          ? negotiatedMime
            ? new MediaRecorder(stream, { mimeType: negotiatedMime })
            : new MediaRecorder(stream)
          : null

      if (recorder) {
        const outputMime = recorder.mimeType || negotiatedMime || 'video/mp4'
        const ext = outputMime.includes('mp4') ? 'mp4' : 'webm'
        recorder.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data)
          }
        }
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: outputMime })
          const safeLiftSlug = selectedLiftLabel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '') || 'working_set'
          const capturedFile = new File([blob], `form_lab_${safeLiftSlug}_45deg.${ext}`, {
            type: outputMime,
          })
          revokePreviewUrl()
          const nextUrl = URL.createObjectURL(blob)
          previewUrlRef.current = nextUrl
          setRecordedPreviewUrl(nextUrl)
          setLocalClipFile(capturedFile)
          onVideoCaptured?.(capturedFile)
          // Immediately release physical camera hardware once clip is captured
          if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(track => track.stop())
            activeStreamRef.current = null
          }
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null
          }
          setStreamReady(false)
        }
        recorder.start(200)
        mediaRecorderRef.current = recorder
      }
    } catch {
      setCaptureError('Could not initialize video encoder on this device. Try attaching a recorded video file.')
      releaseCameraHardware()
      return
    }

    playForgeTactileTone('countdown')
    setIsRecording(true)
    setWatchRecordingActive(true)
    recordTimerRef.current = setInterval(() => {
      setRecordElapsedSeconds(prev => {
        if (prev >= 29) {
          stopLiveRecording()
          return 30
        }
        return prev + 1
      })
    }, 1000)
  }, [onVideoCaptured, releaseCameraHardware, revokePreviewUrl, selectedLiftLabel, stopLiveRecording])

  const startStepBackCountdown = useCallback(() => {
    if (!activeStreamRef.current) {
      setCaptureError('Camera stream is not active yet.')
      return
    }
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    setCountdownSeconds(5)
    playForgeTactileTone('countdown')
    countdownTimerRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current)
            countdownTimerRef.current = null
          }
          beginMediaRecording()
          return 0
        }
        playForgeTactileTone('countdown')
        return prev - 1
      })
    }, 1000)
  }, [beginMediaRecording])

  const handleCloseCameraDrawer = useCallback(() => {
    releaseCameraHardware()
    setCameraDrawerOpen(false)
    setWatchFramingLocked(false)
    setWatchRecordingActive(false)
  }, [releaseCameraHardware])

  const handleAttachFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const isVideoType =
      file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name)
    if (!isVideoType) {
      setCaptureError('Unsupported file format. Please select an MP4, MOV, WebM, or M4V video clip.')
      return
    }
    if (file.size > MAX_VIDEO_FILE_BYTES) {
      setCaptureError('Video exceeds the 100 MB limit. Trim your clip to 3–5 working reps and try again.')
      return
    }

    setCaptureError(null)
    revokePreviewUrl()
    setLocalClipFile(file)
    onVideoCaptured?.(file)
  }

  const handleClearLocalClip = () => {
    revokePreviewUrl()
    setLocalClipFile(null)
    setCaptureError(null)
  }

  const commitClipSubmission = useCallback(
    (overrideNote?: string) => {
      if (outOfCredits) {
        setUpgradeModalOpen(true)
        return
      }
      const result = spendFormLabCredit()
      if (!result.allowed) {
        setUpgradeModalOpen(true)
        return
      }
      playForgeTactileTone('success')
      const statusLabel = entitlements.priority24hSla ? '24h Priority Queue' : 'Telestrator Queue'
      const trimmedNote = (overrideNote ?? clipNotes).trim().slice(0, 500)
      void trackEvent(
        'form_lab_uploaded',
        {
          lift_name: selectedLiftLabel,
          camera_angle: 'front_45',
          priority_sla: Boolean(entitlements.priority24hSla),
          has_notes: trimmedNote.length > 0,
        },
        { immediate: true }
      )
      setSubmittedClips(prev => [
        {
          id: `${Date.now()}`,
          lift: selectedLiftLabel,
          note: trimmedNote || '45° front-diagonal working set (3–5 reps)',
          clipLabel: effectiveClipLabel,
          status: statusLabel,
        },
        ...prev,
      ])
      setSubmittedConfirmation(
        entitlements.priority24hSla
          ? `Priority 24h Form Lab review queued for Coach Gordon (${result.remaining} monthly credits left).`
          : `Form Lab clip queued for Coach Gordon telestrator review (${result.remaining} credits left).`
      )
      setClipNotes('')
      setCaptureError(null)
      setWatchRecordingActive(false)
      setWatchRepCount(0)
      handleCloseCameraDrawer()
      onSubmitted?.()
    },
    [
      clipNotes,
      effectiveClipLabel,
      entitlements.priority24hSla,
      handleCloseCameraDrawer,
      onSubmitted,
      outOfCredits,
      selectedLiftLabel,
      spendFormLabCredit,
    ]
  )

  // Sync Apple Watch Camera Remote ONLY while live camera / Watch session is actively engaged
  useEffect(() => {
    const shouldBeActive = cameraDrawerOpen || watchRecordingActive
    if (shouldBeActive) {
      watchRemoteActiveRef.current = true
      void syncCameraRemoteStateToWatch({
        isActive: true,
        mode: 'form_lab',
        modeTitle: 'Form Lab Recorder',
        framingStatus: isRecording || watchRecordingActive
          ? 'recording'
          : watchFramingLocked
            ? 'locked'
            : 'framing',
        isRecording: isRecording || watchRecordingActive,
        countdownSeconds,
        repCount: watchRepCount,
        targetReps: 5,
        statusHint: watchFramingLocked
          ? 'Locked · Emerald — 45° working set ready'
          : 'Prop iPhone 6–8 ft at 45° · Tap Record Rep on Watch',
      })
    } else if (watchRemoteActiveRef.current) {
      watchRemoteActiveRef.current = false
      void syncCameraRemoteStateToWatch({
        isActive: false,
        mode: 'form_lab',
        modeTitle: 'Form Lab Recorder',
        framingStatus: 'framing',
      })
    }
  }, [
    cameraDrawerOpen,
    countdownSeconds,
    isRecording,
    watchFramingLocked,
    watchRecordingActive,
    watchRepCount,
  ])

  useEffect(() => {
    let cleanupWatchSub: (() => void) | null = null
    void subscribeToWatchCameraCommand(cmd => {
      if (cmd.command === 'startTimer5s') {
        setWatchFramingLocked(true)
        setWatchRecordingActive(true)
        playForgeTactileTone('countdown')
      } else if (cmd.command === 'recordRep') {
        setWatchFramingLocked(true)
        setWatchRecordingActive(true)
        setWatchRepCount(prev => prev + 1)
        playForgeTactileTone('rep_complete')
      } else if (cmd.command === 'stopAndReview') {
        setWatchRecordingActive(false)
        commitClipSubmission(
          clipNotes.trim() ||
            `45° ${selectedLiftLabel} (${Math.max(3, watchRepCount)} reps captured via Watch Remote)`
        )
      } else if (cmd.command === 'dismissRemote') {
        setWatchRecordingActive(false)
        handleCloseCameraDrawer()
      }
    }).then(unsub => {
      cleanupWatchSub = unsub
    })

    return () => {
      cleanupWatchSub?.()
    }
  }, [clipNotes, commitClipSubmission, handleCloseCameraDrawer, selectedLiftLabel, watchRepCount])

  // Emergency camera hardware release on tab hide, telemetry release event, or unmount
  useEffect(() => {
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        releaseCameraHardware()
      }
    }
    const onTelemetryCameraRelease = () => {
      releaseCameraHardware()
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, onTelemetryCameraRelease)
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, onTelemetryCameraRelease)
      }
      releaseCameraHardware()
      revokePreviewUrl()
      if (watchRemoteActiveRef.current) {
        watchRemoteActiveRef.current = false
        void syncCameraRemoteStateToWatch({
          isActive: false,
          mode: 'form_lab',
          modeTitle: 'Form Lab Recorder',
          framingStatus: 'framing',
        })
      }
    }
  }, [releaseCameraHardware, revokePreviewUrl])

  const handleSubmitForCoachReview = (e: React.FormEvent) => {
    e.preventDefault()
    commitClipSubmission()
  }

  return (
    <section
      aria-labelledby={headingId}
      className="forge-surface-card rounded-2xl p-4 text-zinc-100 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <Video size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div>
            <div className="forge-eyebrow-micro text-emerald-300">
              Async Biomechanics · Form Lab
            </div>
            <h3
              id={headingId}
              className="mt-0.5 text-sm font-bold tracking-tight text-white sm:text-base"
            >
              Coach Gordon Form Lab Review Queue
            </h3>
            <div className="text-xs text-zinc-400">{entitlements.formLabCreditLabel}</div>
          </div>
        </div>

        <span
          data-testid="form-lab-credits-badge"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold tabular-nums ${
            outOfCredits
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {remainingFormLabCredits} of {entitlements.monthlyFormLabCredits} Credits Remaining
        </span>
      </div>

      {/* Motivating Empty Form Lab Queue State: 45°-Angle Camera Setup Illustration + Coach Gordon's Tip */}
      {submittedClips.length === 0 ? (
        <div className="mt-4 grid grid-cols-1 items-center gap-4 rounded-2xl border border-white/10 bg-[#181B22]/85 p-3.5 sm:grid-cols-[188px_1fr] sm:p-4">
          {/* 45°-Angle Camera Setup Illustration (Athlete in fitted charcoal crewneck t-shirt, shorts & black shoes) */}
          <div className="relative mx-auto w-full max-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#090A0D] p-2">
            <svg
              role="img"
              viewBox="0 0 180 116"
              aria-label="45-degree front-diagonal camera setup illustration"
              className="h-auto w-full"
            >
              {/* Subtle studio floor perspective grid */}
              <line x1="12" y1="98" x2="168" y2="98" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <line x1="36" y1="74" x2="156" y2="98" stroke="rgba(52,211,153,0.22)" strokeWidth="0.9" strokeDasharray="3 2" />
              <line x1="36" y1="74" x2="128" y2="28" stroke="rgba(52,211,153,0.38)" strokeWidth="0.9" strokeDasharray="3 2" />
              {/* Shaded 45° optical cone */}
              <polygon
                points="36,74 128,28 156,98"
                fill="rgba(16,185,129,0.08)"
              />

              {/* 45° Angle Arc Badge */}
              <path
                d="M 56 78 A 22 22 0 0 0 53 65"
                fill="none"
                stroke="#34D399"
                strokeWidth="1.2"
              />
              <rect x="57" y="62" width="24" height="12" rx="4" fill="rgba(9,10,13,0.9)" stroke="rgba(52,211,153,0.5)" strokeWidth="0.7" />
              <text x="69" y="70.5" textAnchor="middle" fill="#6EE7B7" fontSize="7.2" fontWeight="800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                45°
              </text>

              {/* Hip-Height Phone Tripod (Left Foreground) */}
              <line x1="28" y1="76" x2="20" y2="98" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="28" y1="76" x2="28" y2="98" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="28" y1="76" x2="36" y2="98" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
              <rect x="23" y="62" width="10" height="15" rx="2.2" fill="#181B22" stroke="#34D399" strokeWidth="1.2" />
              <circle cx="33" cy="69" r="2" fill="#34D399" />

              {/* Athlete Performing Squat in Fitted Charcoal Performance Crewneck T-Shirt + Dark Shorts + Black Shoes */}
              <g>
                {/* Barbell across upper back */}
                <line x1="98" y1="44" x2="158" y2="44" stroke="#A1A1AA" strokeWidth="2.1" strokeLinecap="round" />
                <rect x="102" y="37" width="4.5" height="14" rx="1.2" fill="#3F3F46" stroke="#71717A" strokeWidth="0.7" />
                <rect x="149.5" y="37" width="4.5" height="14" rx="1.2" fill="#3F3F46" stroke="#71717A" strokeWidth="0.7" />

                {/* Head */}
                <circle cx="128" cy="33" r="6" fill="#52525B" stroke="#E4E4E7" strokeWidth="0.8" />

                {/* Fitted Charcoal Crewneck Performance T-Shirt Torso & Short Sleeves */}
                <path
                  d="M 118 42 Q 128 40 138 42 L 143 51 L 138 53 L 136 48 L 135 64 L 120 64 L 120 48 L 117 53 L 112 51 Z"
                  fill="#27272A"
                  stroke="#A1A1AA"
                  strokeWidth="0.85"
                  strokeLinejoin="round"
                />
                {/* Crewneck collar */}
                <path d="M 124 41.5 Q 128 44 132 41.5" fill="none" stroke="#E4E4E7" strokeWidth="0.9" />

                {/* Forearms gripping barbell */}
                <line x1="114" y1="51" x2="110" y2="44" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />
                <line x1="141" y1="51" x2="146" y2="44" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />

                {/* Athletic Training Shorts */}
                <path
                  d="M 120 64 L 135 64 L 139 76 L 130 76 L 127.5 70 L 125 76 L 116 76 Z"
                  fill="#181B22"
                  stroke="#71717A"
                  strokeWidth="0.85"
                />

                {/* Lower legs + Clean Black Training Shoes */}
                <line x1="120" y1="76" x2="119" y2="93" stroke="#A1A1AA" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="135" y1="76" x2="137" y2="93" stroke="#A1A1AA" strokeWidth="2.4" strokeLinecap="round" />
                <rect x="113" y="93" width="10" height="4.2" rx="1.8" fill="#090A0D" stroke="#71717A" strokeWidth="0.8" />
                <rect x="133" y="93" width="10" height="4.2" rx="1.8" fill="#090A0D" stroke="#71717A" strokeWidth="0.8" />

                {/* Dual-ring CV joint nodes */}
                {[
                  { x: 128, y: 44 },
                  { x: 127, y: 65 },
                  { x: 120, y: 76 },
                  { x: 119, y: 93 },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="3" fill="rgba(52,211,153,0.22)" />
                    <circle cx={pt.x} cy={pt.y} r="1.4" fill="#090A0D" stroke="#34D399" strokeWidth="0.8" />
                  </g>
                ))}
              </g>

              <text x="14" y="14" fill="#A1A1AA" fontSize="6.5" fontWeight="700" letterSpacing="0.08em">
                HIP-HEIGHT · 6–8 FT AWAY
              </text>
            </svg>
          </div>

          {/* Coach Gordon's Tip on What Lift to Film First */}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                <Sparkles size={11} strokeWidth={1.75} aria-hidden="true" /> Queue Empty · Ready for Your First Clip
              </span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-400">
                45° Front-Diagonal Setup
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-200 sm:text-[13px]">
              <strong className="font-semibold text-white">Coach Gordon&apos;s Tip — What to Film First:</strong>{' '}
              Prop your phone at hip height 6–8 ft away at a <span className="font-mono text-emerald-300">45°</span> front-diagonal angle and film 3–5 working reps of your primary{' '}
              <strong className="text-white">Squat, Trap-Bar/Conventional Deadlift, or Overhead Press</strong> so ankles, knees, lumbar spine, and bar path stay fully visible.
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {[
                '45° Squat Working Set (5 reps)',
                'Deadlift Hinge & Lockout Check',
                'Overhead Press Rib-Stack Check',
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setClipNotes(preset)}
                  className="forge-tactile-press inline-flex min-h-[44px] max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-[#090A0D] px-3 py-2 text-left text-xs font-medium text-zinc-300 transition-colors duration-150 hover:border-emerald-400/35 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                >
                  <Camera size={12} strokeWidth={1.75} className="shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ul role="list" className="mt-3.5 space-y-1.5">
          {submittedClips.map(clip => (
            <li
              key={clip.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-[#181B22] px-3.5 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <span className="font-semibold text-white">{clip.lift}</span>
                {clip.clipLabel ? (
                  <span className="ml-2 font-mono text-[11px] text-emerald-300">[{clip.clipLabel}]</span>
                ) : null}
                <span className="ml-2 text-zinc-400">· {clip.note}</span>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-300">
                {clip.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 45° Camera Capture & Local Video Clip Attachment Bar */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          onChange={handleAttachFileChange}
          hidden
        />
        <button
          type="button"
          onClick={() => (cameraDrawerOpen ? handleCloseCameraDrawer() : void openCameraDrawer())}
          aria-expanded={cameraDrawerOpen}
          className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors duration-150 hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        >
          <Camera size={14} strokeWidth={1.75} aria-hidden="true" />
          {cameraDrawerOpen ? 'Close 45° Camera' : 'Record 45° Set'}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-bold text-zinc-200 transition-colors duration-150 hover:border-white/20 hover:bg-[#1E222B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        >
          <Upload size={14} strokeWidth={1.75} aria-hidden="true" />
          Attach Video Clip
        </button>

        {effectiveClipLabel ? (
          <div
            data-testid="form-lab-attached-clip"
            className="inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-xl border border-emerald-500/25 bg-[#090A0D] px-3 py-1.5 text-xs text-emerald-200"
          >
            <Film size={13} strokeWidth={1.75} className="shrink-0 text-emerald-400" aria-hidden="true" />
            <span className="truncate font-mono text-[11px]">{effectiveClipLabel}</span>
            {localClipFile ? (
              <button
                type="button"
                onClick={handleClearLocalClip}
                aria-label="Remove captured Form Lab video clip"
                className="ml-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                <X size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Live 45° Camera Capture Drawer */}
      {cameraDrawerOpen ? (
        <div
          data-testid="form-lab-camera-drawer"
          className="mt-3 rounded-2xl border border-emerald-500/30 bg-[#090A0D] p-3.5"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
            {recordedPreviewUrl ? (
              <video
                src={recordedPreviewUrl}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <video
                ref={liveVideoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            )}

            {countdownSeconds > 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center">
                <span className="font-mono text-4xl font-black tabular-nums text-emerald-300">
                  {countdownSeconds}s
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-200">
                  Step Back 6–8 ft · 45° Framing
                </span>
              </div>
            ) : null}

            {isRecording ? (
              <div className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1 font-mono text-[11px] font-extrabold tabular-nums text-white">
                <span aria-hidden="true">●</span>
                <span>REC 0:{String(recordElapsedSeconds).padStart(2, '0')} / 0:30</span>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isRecording ? (
              <>
                <button
                  type="button"
                  onClick={beginMediaRecording}
                  disabled={!streamReady && !recordedPreviewUrl}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-rose-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
                >
                  <Video size={14} strokeWidth={1.75} aria-hidden="true" />
                  {recordedPreviewUrl ? 'Record New Clip' : 'Start Recording'}
                </button>

                {streamReady ? (
                  <button
                    type="button"
                    onClick={startStepBackCountdown}
                    className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                  >
                    <Timer size={14} strokeWidth={1.75} aria-hidden="true" />
                    5s Step-Back Timer
                  </button>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={stopLiveRecording}
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                <Square size={13} strokeWidth={2} aria-hidden="true" />
                Stop &amp; Save Clip
              </button>
            )}
          </div>
        </div>
      ) : null}

      {captureError ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
        >
          {captureError}
        </div>
      ) : null}

      <form onSubmit={handleSubmitForCoachReview} className="mt-3.5 space-y-1.5">
        <label
          htmlFor={noteInputId}
          className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400"
        >
          Form Lab Coaching Note (Optional)
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            id={noteInputId}
            name="clipNotes"
            type="text"
            maxLength={500}
            value={clipNotes}
            onChange={e => setClipNotes(e.target.value)}
            placeholder={`Optional note for Coach Gordon on ${selectedLiftLabel} (e.g., bottom hip shift)…`}
            className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-base text-white placeholder:text-zinc-500 transition-colors duration-150 hover:border-white/15 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          />

          {outOfCredits && tierId !== 'coach_support' ? (
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(true)}
              className="forge-tactile-press inline-flex min-h-[44px] max-w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-center text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 transition-colors duration-150 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              <Lock size={13} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
              <span>Unlock More Reviews in {nextTierName}</span>
              <ArrowUpRight size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={outOfCredits}
              className="forge-tactile-press inline-flex min-h-[44px] max-w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2.5 text-center text-xs font-extrabold uppercase tracking-[0.08em] tabular-nums text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Submit Clip to Form Lab ({remainingFormLabCredits} Left)
            </button>
          )}
        </div>
      </form>

      {submittedConfirmation ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200"
        >
          <CheckCircle2 size={15} strokeWidth={1.75} className="shrink-0 text-emerald-300" aria-hidden="true" />
          <span className="tabular-nums">{submittedConfirmation}</span>
        </div>
      ) : null}

      <TierUpgradeModal
        open={upgradeModalOpen}
        triggerContext="form_lab_credit_depletion"
        currentTier={tierId}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </section>
  )
}
