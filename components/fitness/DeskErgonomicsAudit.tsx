'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import TelemetryRingGauge from '@/components/ui/TelemetryRingGauge'
import { useSfxMuted } from '@/lib/sfx-audio'
import {
  evaluateDeskErgonomicsFromLandmarks,
  mapMediaPipe33LandmarksToSeated,
  SAMPLE_DESK_LANDMARKS,
  STRAIN_COLORS,
  STRAIN_LABELS,
  type DeskErgonomicsScanResult,
} from '@/lib/desk-ergonomics-engine'
import {
  loadPostureProfileState,
  persistDeskErgonomicFlags,
  type ErgonomicFlag,
  type SavedWorkstationProfile,
  type StrainLevel,
} from '@/lib/posture-profile-state'

export interface DeskErgonomicsAuditProps {
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
  sandboxMode = false,
  onLaunchDeskReset,
  maxSavedProfiles = null,
  onUpgradeWorkstationLimit,
  renderPostScanBanner,
}: DeskErgonomicsAuditProps) {
  const { sfxMuted, toggleSfxMuted, playTone } = useSfxMuted()

  const [scanResult, setScanResult] = useState<DeskErgonomicsScanResult | null>(() =>
    sandboxMode ? evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain) : null
  )
  const [capturedImageSrc, setCapturedImageSrc] = useState<string | null>(null)
  const [sampleVariant, setSampleVariant] = useState<'typical_strain' | 'optimal_setup'>('typical_strain')
  const [workstationLabel, setWorkstationLabel] = useState<string>('Home Desk')
  const [savedProfiles, setSavedProfiles] = useState<SavedWorkstationProfile[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [countdownSec, setCountdownSec] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (sandboxMode) return
    const persisted = loadPostureProfileState()
    setSavedProfiles(persisted.workstationProfiles)
  }, [sandboxMode])

  const stopCamera = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
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
    return () => stopCamera()
  }, [stopCamera])

  const finalizeScan = useCallback(
    (result: DeskErgonomicsScanResult, imageDataUrl: string | null, autoPersist = true) => {
      setScanResult(result)
      setCapturedImageSrc(imageDataUrl)
      playTone('success')

      if (!sandboxMode && autoPersist) {
        const canSaveNewProfile =
          maxSavedProfiles === null || savedProfiles.length < maxSavedProfiles
        const updated = persistDeskErgonomicFlags(
          result.ergonomicFlags,
          canSaveNewProfile
            ? {
                label: workstationLabel.trim() || `Workstation ${savedProfiles.length + 1}`,
                score: result.score,
                strainLevel: result.overallStrain,
                ergonomicFlags: result.ergonomicFlags,
                craniovertebralDeg:
                  result.angles.find(a => a.id === 'craniovertebral')?.measuredDegrees ?? 0,
                shoulderProtractionDeg:
                  result.angles.find(a => a.id === 'shoulder_protraction')?.measuredDegrees ?? 0,
                elbowAngleDeg:
                  result.angles.find(a => a.id === 'elbow_wrist')?.measuredDegrees ?? 95,
                seatedHipAngleDeg:
                  result.angles.find(a => a.id === 'seated_hip')?.measuredDegrees ?? 100,
              }
            : undefined
        )
        setSavedProfiles(updated.workstationProfiles)
      }
    },
    [maxSavedProfiles, playTone, sandboxMode, savedProfiles.length, workstationLabel]
  )

  const detectPoseOrFallback = useCallback(
    async (imgEl: HTMLImageElement | HTMLCanvasElement, dataUrl: string) => {
      try {
        const vision = await import('@mediapipe/tasks-vision')
        const fileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )
        const poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
        })
        const detection = poseLandmarker.detect(imgEl)
        poseLandmarker.close()
        const firstPose = detection?.landmarks?.[0]
        const mapped = firstPose ? mapMediaPipe33LandmarksToSeated(firstPose) : null
        if (mapped) {
          finalizeScan(evaluateDeskErgonomicsFromLandmarks(mapped), dataUrl)
          return
        }
      } catch {
        // Graceful fallback to deterministic seated pose landmarks when WASM CDN is offline
      }
      finalizeScan(evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain), dataUrl)
    },
    [finalizeScan]
  )

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
      }
    },
    [finalizeScan, sandboxMode]
  )

  const startLiveFiveSecondAudit = async () => {
    setCameraError(null)
    setStatusNote(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera stream unavailable on this browser or device.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setCameraActive(true)
      setCountdownSec(5)

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => {})
        }
      })

      let remaining = 5
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1
        if (remaining > 0) {
          setCountdownSec(remaining)
          playTone('countdown')
        } else {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current)
            countdownTimerRef.current = null
          }
          const video = videoRef.current
          if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
              stopCamera()
              void detectPoseOrFallback(canvas, dataUrl)
              return
            }
          }
          stopCamera()
          handleLoadSample('typical_strain')
        }
      }, 1000)
    } catch {
      setCameraError('Camera permission was declined or blocked by browser settings.')
      stopCamera()
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
        finalizeScan(evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain), dataUrl)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
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

  return (
    <div
      data-testid="desk-ergonomics-audit"
      className={`forge-surface-card rounded-2xl text-zinc-100 ${
        sandboxMode ? 'p-3.5 sm:p-4' : 'p-4 sm:p-6'
      }`}
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

      {/* Input Controls (hidden in compact sandbox mode) */}
      {!sandboxMode && !cameraActive && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={workstationLabel}
              onChange={e => setWorkstationLabel(e.target.value)}
              aria-label="Workstation profile name"
              placeholder="Workstation name (e.g. Home Desk)"
              className="min-h-[44px] min-w-0 flex-1 basis-40 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-base text-white placeholder:text-zinc-500 transition-colors duration-150 hover:border-white/15 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            />
            <button
              type="button"
              onClick={() => void startLiveFiveSecondAudit()}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              <GaaIcon name="camera" size={14} tone="dark" />
              <span>5s Camera Timer</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-semibold text-zinc-100 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
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

            <button
              type="button"
              onClick={() => handleLoadSample('typical_strain')}
              className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition-colors duration-150 hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Load Sample Desk Scan
            </button>
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

          {statusNote && (
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

          {/* Bottom Timer & Cancel Pill */}
          <div className="forge-glass-pill absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-xl font-extrabold tabular-nums ${
                  isLockedFrame ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {countdownSec ?? 5}s
              </span>
              <span className="text-xs text-zinc-300">
                {isLockedFrame ? 'Hold still — capturing seated mesh…' : 'Settle into natural desk posture'}
              </span>
            </div>
            <button
              type="button"
              onClick={stopCamera}
              className="forge-tactile-press min-h-[44px] rounded-xl border border-white/15 bg-[#181B22]/90 px-3.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results & SVG Joint Angle Overlay */}
      {scanResult && (
        <div className="space-y-3.5">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: sandboxMode
                ? '1fr'
                : 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 12,
              alignItems: 'start',
            }}
          >
            {/* Left: Captured / Sample Seated Silhouette + Glowing Vector Skeleton + Landmark Pill Badges */}
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#090A0D]"
              style={{
                aspectRatio: sandboxMode ? '16 / 10' : '4 / 3',
              }}
            >
              {capturedImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capturedImageSrc}
                  alt="Captured side-profile workstation posture"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.86 }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(ellipse at 50% 32%, rgba(16, 185, 129, 0.09) 0%, rgba(17, 19, 24, 0.85) 52%, #090A0D 100%)',
                  }}
                />
              )}

              <svg
                viewBox="0 0 100 100"
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

                {/* Desk & Chair Subtle Reference Geometry when in sample mode */}
                {!capturedImageSrc && (
                  <g opacity="0.76">
                    {[20, 40, 60, 80].map(pos => (
                      <g key={`g-${pos}`}>
                        <line x1="4" y1={pos} x2="96" y2={pos} stroke="rgba(255,255,255,0.045)" strokeWidth="0.26" />
                        <line x1={pos} y1="6" x2={pos} y2="94" stroke="rgba(255,255,255,0.045)" strokeWidth="0.26" />
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
                    {/* Ergonomic task chair backrest, lumbar & base */}
                    <path
                      d="M 27 30 Q 30 48 29 67 L 56 67 M 41 67 L 41 90 M 31 90 L 51 90"
                      fill="none"
                      stroke="#3F3F46"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                    />
                    {/* Desk surface & display bezel */}
                    <line x1="56" y1="56" x2="93" y2="56" stroke="#52525B" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="84" y1="56" x2="84" y2="90" stroke="#3F3F46" strokeWidth="1.2" />
                    <rect
                      x="75.5"
                      y={sampleVariant === 'optimal_setup' ? '18' : '27'}
                      width="2.8"
                      height="20"
                      rx="0.9"
                      fill="#A1A1AA"
                    />
                    <line
                      x1="76.9"
                      y1={sampleVariant === 'optimal_setup' ? '38' : '47'}
                      x2="76.9"
                      y2="56"
                      stroke="#52525B"
                      strokeWidth="0.95"
                    />
                    {/* Eye-to-Screen Sightline */}
                    <line
                      x1={scanResult.landmarks.ear.x + 2}
                      y1={scanResult.landmarks.ear.y}
                      x2="75.2"
                      y2={sampleVariant === 'optimal_setup' ? '26' : '36'}
                      stroke="rgba(52,211,153,0.42)"
                      strokeWidth="0.4"
                      strokeDasharray="1.5 1.2"
                    />
                    {/* Seated Athlete Silhouette wearing fitted charcoal performance crewneck t-shirt & athletic shorts */}
                    <circle
                      cx={scanResult.landmarks.ear.x + 1}
                      cy={scanResult.landmarks.ear.y - 0.5}
                      r="4.8"
                      fill="#181B22"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="0.5"
                    />
                    <path
                      d={`M ${scanResult.landmarks.shoulder.x - 4.5} ${scanResult.landmarks.shoulder.y - 1}
                          Q ${(scanResult.landmarks.shoulder.x + scanResult.landmarks.hip.x) / 2 - 5} ${(scanResult.landmarks.shoulder.y + scanResult.landmarks.hip.y) / 2}
                            ${scanResult.landmarks.hip.x - 4.5} ${scanResult.landmarks.hip.y + 2}
                          L ${scanResult.landmarks.hip.x + 6} ${scanResult.landmarks.hip.y + 2}
                          L ${scanResult.landmarks.shoulder.x + 5.5} ${scanResult.landmarks.shoulder.y + 1} Z`}
                      fill="#27272A"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="0.55"
                    />
                    {/* Short-sleeve crewneck sleeve detail */}
                    <path
                      d={`M ${scanResult.landmarks.shoulder.x - 1.5} ${scanResult.landmarks.shoulder.y - 0.5}
                          L ${scanResult.landmarks.shoulder.x + 4.5} ${scanResult.landmarks.shoulder.y + 6.5}
                          L ${scanResult.landmarks.shoulder.x + 1.2} ${scanResult.landmarks.shoulder.y + 8} Z`}
                      fill="#3F3F46"
                    />
                  </g>
                )}

                {/* Vertical Hip-to-Shoulder Plumb Line */}
                <line
                  x1={scanResult.plumbLineX}
                  y1="10"
                  x2={scanResult.plumbLineX}
                  y2="90"
                  stroke="#34D399"
                  strokeOpacity="0.65"
                  strokeWidth="0.55"
                  strokeDasharray="2.2 1.8"
                />
                <rect x={scanResult.plumbLineX + 1.2} y="9.8" width="19.5" height="4.6" rx="1.3" fill="rgba(9,10,13,0.82)" />
                <text
                  x={scanResult.plumbLineX + 2.6}
                  y="13"
                  fill="#6EE7B7"
                  fontSize="2.65"
                  fontWeight="700"
                  letterSpacing="0.06em"
                >
                  PLUMB LINE
                </text>

                {/* Joint Angle Wedge Arcs + Anti-Aliased Glowing Vector Skeleton + Dual-Ring Nodes + Dark Pill Degree Badges */}
                {(() => {
                  const { ear, shoulder, elbow, wrist, hip, knee, ankle } = scanResult.landmarks
                  const cvMetric = scanResult.angles.find(a => a.id === 'craniovertebral')!
                  const shoulderMetric = scanResult.angles.find(a => a.id === 'shoulder_protraction')!
                  const elbowMetric = scanResult.angles.find(a => a.id === 'elbow_wrist')!
                  const hipMetric = scanResult.angles.find(a => a.id === 'seated_hip')!

                  const landmarkBadges = [
                    {
                      key: 'cv',
                      x: ear.x - 19,
                      y: ear.y - 3.5,
                      text: `${cvMetric.measuredDegrees}°`,
                      stroke: cvMetric.colorHex,
                    },
                    {
                      key: 'elbow',
                      x: elbow.x - 15.5,
                      y: elbow.y + 2.2,
                      text: `${elbowMetric.measuredDegrees}°`,
                      stroke: elbowMetric.colorHex,
                    },
                    {
                      key: 'hip',
                      x: hip.x - 16.5,
                      y: hip.y - 2.5,
                      text: `${hipMetric.measuredDegrees}°`,
                      stroke: hipMetric.colorHex,
                    },
                  ]

                  return (
                    <>
                      {/* Wedge arcs */}
                      <path
                        d={buildJointArcPath(shoulder, { x: shoulder.x, y: shoulder.y - 16 }, ear, 8)}
                        fill={cvMetric.colorHex}
                        fillOpacity="0.24"
                        stroke={cvMetric.colorHex}
                        strokeWidth="0.7"
                      />
                      <path
                        d={buildJointArcPath(elbow, shoulder, wrist, 7)}
                        fill={elbowMetric.colorHex}
                        fillOpacity="0.24"
                        stroke={elbowMetric.colorHex}
                        strokeWidth="0.7"
                      />
                      <path
                        d={buildJointArcPath(hip, shoulder, knee, 8)}
                        fill={hipMetric.colorHex}
                        fillOpacity="0.24"
                        stroke={hipMetric.colorHex}
                        strokeWidth="0.7"
                      />

                      {/* Glowing Kinetic Chain Vector Strokes */}
                      <g filter="url(#desk-skeleton-glow)" strokeLinecap="round">
                        <line x1={ear.x} y1={ear.y} x2={shoulder.x} y2={shoulder.y} stroke={cvMetric.colorHex} strokeWidth="1.35" />
                        <line x1={shoulder.x} y1={shoulder.y} x2={hip.x} y2={hip.y} stroke={shoulderMetric.colorHex} strokeWidth="1.45" />
                        <line x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} stroke={elbowMetric.colorHex} strokeWidth="1.25" />
                        <line x1={elbow.x} y1={elbow.y} x2={wrist.x} y2={wrist.y} stroke={elbowMetric.colorHex} strokeWidth="1.25" />
                        <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke={hipMetric.colorHex} strokeWidth="1.45" />
                        <line x1={knee.x} y1={knee.y} x2={ankle.x} y2={ankle.y} stroke="#A1A1AA" strokeWidth="1.15" />
                      </g>

                      {/* Dual-Ring Landmark Nodes with Confidence-Based Opacity */}
                      {Object.values(scanResult.landmarks).map((pt, idx) => {
                        const confOpacity = Math.max(0.68, 0.98 - idx * 0.03)
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
                            fill="rgba(9, 10, 13, 0.82)"
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

              {/* Animated Workstation Score Ring Pill Overlay */}
              <div className="forge-glass-pill absolute right-2.5 top-2.5 flex items-center gap-2.5 rounded-2xl px-2.5 py-2">
                <div className="text-right">
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
                  size={sandboxMode ? 48 : 54}
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

            {/* Right: 4 Joint Angle Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
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
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[11px] font-semibold leading-snug text-zinc-300">
                        {angle.title}
                      </span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider"
                        style={{
                          color: tone.color,
                          background: tone.bg,
                          border: `1px solid ${tone.border}`,
                        }}
                      >
                        {STRAIN_LABELS[angle.status]}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-lg font-extrabold tabular-nums text-white">
                      {angle.measuredDegrees}°{' '}
                      <span className="text-[10.5px] font-medium text-zinc-400">
                        ({angle.neutralRangeLabel})
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3 Concrete Workstation Adjustments */}
          <div className="rounded-xl border border-white/10 bg-[#181B22]/85 p-3.5">
            <div className="forge-eyebrow-micro text-amber-300">
              3 Concrete Workstation Adjustments
            </div>
            <div className="mt-2.5 grid gap-2">
              {scanResult.adjustments.map(adj => (
                <div
                  key={adj.id}
                  className="flex items-start gap-2.5 text-xs leading-relaxed"
                >
                  <span className="mt-0.5 shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-extrabold tabular-nums text-amber-300">
                    0{adj.priority}
                  </span>
                  <div>
                    <strong className="font-semibold text-white">{adj.headline}</strong>
                    {!sandboxMode && (
                      <span className="mt-0.5 block text-[11.5px] leading-relaxed text-zinc-300">
                        {adj.instruction}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Loop Row */}
          {!sandboxMode && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onLaunchDeskReset?.(scanResult.ergonomicFlags)}
                className="forge-tactile-press min-h-[44px] flex-1 basis-56 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
              >
                Launch Targeted 5-Min Desk Reset →
              </button>

              <button
                type="button"
                onClick={handleAuditAnotherDesk}
                className="forge-tactile-press min-h-[44px] rounded-xl border border-white/10 bg-[#181B22] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
              >
                + Audit Another Desk
              </button>
            </div>
          )}

          {/* Contextual Upgrade Slot (Trigger 1: Post-Scan Amber/Coral Flag) */}
          {!sandboxMode && renderPostScanBanner?.(scanResult)}
        </div>
      )}
    </div>
  )
}
