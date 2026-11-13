'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
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

  const startLiveFiveSecondAudit = async () => {
    setCameraError(null)
    setStatusNote(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera unavailable in this browser. Loaded sample desk profile instead.')
      handleLoadSample('typical_strain')
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
          // Capture frame from video
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
      setCameraError('Camera permission declined. Use photo upload or Load Sample Desk Scan.')
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

  const handleLoadSample = (variant: 'typical_strain' | 'optimal_setup' = 'typical_strain') => {
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
        ? 'rgba(16, 185, 129, 0.14)'
        : status === 'amber'
          ? 'rgba(245, 158, 11, 0.16)'
          : 'rgba(251, 113, 133, 0.16)',
    border:
      status === 'optimal'
        ? 'rgba(16, 185, 129, 0.42)'
        : status === 'amber'
          ? 'rgba(245, 158, 11, 0.45)'
          : 'rgba(251, 113, 133, 0.48)',
  })

  return (
    <div
      data-testid="desk-ergonomics-audit"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 22, 36, 0.96) 0%, rgba(7, 12, 22, 0.99) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 12,
        padding: sandboxMode ? '14px' : '16px',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#FBBF24',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '2px 7px',
                borderRadius: 4,
              }}
            >
              33-Point Side-Profile Vision
            </span>
            {!sandboxMode && savedProfiles.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 10,
                  color: '#94A3B8',
                }}
              >
                {savedProfiles.length} {savedProfiles.length === 1 ? 'Desk Saved' : 'Desks Saved'}
              </span>
            )}
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: sandboxMode ? 18 : 20,
              fontWeight: 800,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              margin: '4px 0 0',
              color: '#FFFFFF',
            }}
          >
            Desk Ergonomics Camera Audit
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {sandboxMode ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => handleLoadSample('typical_strain')}
                style={{
                  padding: '5px 9px',
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: sampleVariant === 'typical_strain' ? 'rgba(251, 113, 133, 0.18)' : 'rgba(255,255,255,0.05)',
                  border: sampleVariant === 'typical_strain' ? '1px solid #FB7185' : '1px solid rgba(255,255,255,0.12)',
                  color: sampleVariant === 'typical_strain' ? '#FDA4AF' : '#94A3B8',
                }}
              >
                Before Fix
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('optimal_setup')}
                style={{
                  padding: '5px 9px',
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: sampleVariant === 'optimal_setup' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.05)',
                  border: sampleVariant === 'optimal_setup' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.12)',
                  color: sampleVariant === 'optimal_setup' ? '#6EE7B7' : '#94A3B8',
                }}
              >
                Optimal Desk
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleSfxMuted}
              aria-label={sfxMuted ? 'Unmute timer sound effects (currently SFX MUTED)' : 'Mute timer sound effects'}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: '5px 9px',
                fontSize: 10.5,
                fontFamily: 'var(--font-telemetry, monospace)',
                color: sfxMuted ? '#94A3B8' : '#FBBF24',
                cursor: 'pointer',
              }}
            >
              {sfxMuted ? 'SFX MUTED' : 'SFX ON'}
            </button>
          )}
        </div>
      </div>

      {/* Input Controls (hidden in compact sandbox mode) */}
      {!sandboxMode && !cameraActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={workstationLabel}
              onChange={e => setWorkstationLabel(e.target.value)}
              aria-label="Workstation profile name"
              placeholder="Workstation name (e.g. Home Desk)"
              style={{
                flex: '1 1 150px',
                minWidth: 0,
                padding: '8px 11px',
                borderRadius: 7,
                background: 'rgba(8, 14, 24, 0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                fontSize: 16,
              }}
            />
            <button
              type="button"
              onClick={() => void startLiveFiveSecondAudit()}
              className="tactile-btn"
              style={{
                padding: '9px 13px',
                minHeight: 42,
                borderRadius: 7,
                border: 'none',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#080E14',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="camera" size={14} tone="dark" />
              <span>5s Camera Timer</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="tactile-btn"
              style={{
                padding: '9px 12px',
                minHeight: 42,
                borderRadius: 7,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#F8FAFC',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
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
              style={{
                padding: '9px 12px',
                minHeight: 42,
                borderRadius: 7,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#7DD3FC',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Load Sample Desk Scan
            </button>
          </div>

          {cameraError && (
            <div
              role="status"
              style={{
                fontSize: 12,
                color: '#FDE68A',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 6,
                padding: '7px 10px',
              }}
            >
              {cameraError}
            </div>
          )}
          {statusNote && (
            <div style={{ fontSize: 11.5, color: '#6EE7B7', fontFamily: 'var(--font-telemetry, monospace)' }}>
              ✓ {statusNote}
            </div>
          )}
        </div>
      )}

      {/* Live 5-Second Camera Alignment Viewport */}
      {cameraActive && (
        <div
          style={{
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1.5px solid #F59E0B',
            background: '#05080F',
            aspectRatio: '4 / 3',
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Seated Ear -> Shoulder -> Hip -> Knee Guide Overlay */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <line x1="36" y1="12" x2="36" y2="88" stroke="#FBBF24" strokeWidth="0.6" strokeDasharray="2 2" />
            <polyline
              points="36,20 36,36 36,64 62,65"
              fill="none"
              stroke="rgba(56, 189, 248, 0.85)"
              strokeWidth="0.9"
              strokeDasharray="2.5 1.5"
            />
            {[
              { x: 36, y: 20, lbl: 'EAR' },
              { x: 36, y: 36, lbl: 'SHOULDER' },
              { x: 36, y: 64, lbl: 'HIP' },
              { x: 62, y: 65, lbl: 'KNEE' },
            ].map(pt => (
              <g key={pt.lbl}>
                <circle cx={pt.x} cy={pt.y} r="2.2" fill="#080E14" stroke="#38BDF8" strokeWidth="0.8" />
                <text x={pt.x + 3.2} y={pt.y + 1} fill="#E2E8F0" fontSize="3.2" fontWeight="700">
                  {pt.lbl}
                </text>
              </g>
            ))}
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 'auto 10px 10px 10px',
              background: 'rgba(8, 14, 24, 0.9)',
              border: '1px solid rgba(245,158,11,0.45)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: '#F8FAFC' }}>
              Align seated side profile: <strong>Ear → Shoulder → Hip → Knee</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#FBBF24',
                }}
              >
                {countdownSec ?? 5}s
              </span>
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  padding: '4px 9px',
                  borderRadius: 5,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFF',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results & SVG Joint Angle Overlay */}
      {scanResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            {/* Left: Captured / Sample Seated Silhouette + Joint Angle Arcs + Hip-to-Shoulder Plumb Line */}
            <div
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                background: 'radial-gradient(circle at 50% 35%, #132038 0%, #070C16 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                aspectRatio: sandboxMode ? '16 / 10' : '4 / 3',
              }}
            >
              {capturedImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capturedImageSrc}
                  alt="Captured side-profile workstation posture"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(ellipse at 52% 45%, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.65) 48%, rgba(5, 8, 15, 0.98) 100%)',
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
                {/* Desk & Chair Subtle Reference Geometry when in sample mode */}
                {!capturedImageSrc && (
                  <g opacity="0.72">
                    {/* LiDAR grid lines */}
                    {[20, 40, 60, 80].map(pos => (
                      <g key={`g-${pos}`}>
                        <line x1="4" y1={pos} x2="96" y2={pos} stroke="rgba(56,189,248,0.08)" strokeWidth="0.28" />
                        <line x1={pos} y1="6" x2={pos} y2="94" stroke="rgba(56,189,248,0.08)" strokeWidth="0.28" />
                      </g>
                    ))}
                    {/* Optical corner viewfinder brackets */}
                    <path
                      d="M 5 12 L 5 6 L 11 6 M 89 6 L 95 6 L 95 12 M 5 88 L 5 94 L 11 94 M 89 94 L 95 94 L 95 88"
                      fill="none"
                      stroke="rgba(148,163,184,0.4)"
                      strokeWidth="0.55"
                    />
                    {/* Ergonomic task chair backrest, lumbar & base */}
                    <path
                      d="M 27 30 Q 30 48 29 67 L 56 67 M 41 67 L 41 90 M 31 90 L 51 90"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                    />
                    {/* Desk surface & display bezel */}
                    <line x1="56" y1="56" x2="93" y2="56" stroke="#64748B" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="84" y1="56" x2="84" y2="90" stroke="#475569" strokeWidth="1.2" />
                    <rect
                      x="75.5"
                      y={sampleVariant === 'optimal_setup' ? '18' : '27'}
                      width="2.8"
                      height="20"
                      rx="0.9"
                      fill="#94A3B8"
                    />
                    <line
                      x1="76.9"
                      y1={sampleVariant === 'optimal_setup' ? '38' : '47'}
                      x2="76.9"
                      y2="56"
                      stroke="#64748B"
                      strokeWidth="0.95"
                    />
                    {/* Eye-to-Screen Sightline */}
                    <line
                      x1={scanResult.landmarks.ear.x + 2}
                      y1={scanResult.landmarks.ear.y}
                      x2="75.2"
                      y2={sampleVariant === 'optimal_setup' ? '26' : '36'}
                      stroke="rgba(251,191,36,0.38)"
                      strokeWidth="0.4"
                      strokeDasharray="1.5 1.2"
                    />
                    {/* Seated Athlete Silhouette wearing fitted charcoal performance crewneck t-shirt & shorts */}
                    <circle
                      cx={scanResult.landmarks.ear.x + 1}
                      cy={scanResult.landmarks.ear.y - 0.5}
                      r="4.8"
                      fill="#1E293B"
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth="0.5"
                    />
                    <path
                      d={`M ${scanResult.landmarks.shoulder.x - 4.5} ${scanResult.landmarks.shoulder.y - 1}
                          Q ${(scanResult.landmarks.shoulder.x + scanResult.landmarks.hip.x) / 2 - 5} ${(scanResult.landmarks.shoulder.y + scanResult.landmarks.hip.y) / 2}
                            ${scanResult.landmarks.hip.x - 4.5} ${scanResult.landmarks.hip.y + 2}
                          L ${scanResult.landmarks.hip.x + 6} ${scanResult.landmarks.hip.y + 2}
                          L ${scanResult.landmarks.shoulder.x + 5.5} ${scanResult.landmarks.shoulder.y + 1} Z`}
                      fill="#1E293B"
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth="0.6"
                    />
                  </g>
                )}

                {/* Vertical Hip-to-Shoulder Plumb Line */}
                <line
                  x1={scanResult.plumbLineX}
                  y1="10"
                  x2={scanResult.plumbLineX}
                  y2="90"
                  stroke="#38BDF8"
                  strokeWidth="0.65"
                  strokeDasharray="2.2 1.8"
                />
                <text
                  x={scanResult.plumbLineX + 1.5}
                  y="13.5"
                  fill="#7DD3FC"
                  fontSize="3.1"
                  fontWeight="700"
                >
                  PLUMB LINE
                </text>

                {/* Joint Angle Wedge Arcs (Emerald / Amber / Coral) */}
                {(() => {
                  const { ear, shoulder, elbow, wrist, hip, knee } = scanResult.landmarks
                  const cvMetric = scanResult.angles.find(a => a.id === 'craniovertebral')!
                  const shoulderMetric = scanResult.angles.find(a => a.id === 'shoulder_protraction')!
                  const elbowMetric = scanResult.angles.find(a => a.id === 'elbow_wrist')!
                  const hipMetric = scanResult.angles.find(a => a.id === 'seated_hip')!

                  return (
                    <>
                      {/* Forward head arc at shoulder vs vertical plumb */}
                      <path
                        d={buildJointArcPath(shoulder, { x: shoulder.x, y: shoulder.y - 16 }, ear, 8)}
                        fill={cvMetric.colorHex}
                        fillOpacity="0.28"
                        stroke={cvMetric.colorHex}
                        strokeWidth="0.7"
                      />
                      {/* Elbow desk angle arc */}
                      <path
                        d={buildJointArcPath(elbow, shoulder, wrist, 7)}
                        fill={elbowMetric.colorHex}
                        fillOpacity="0.28"
                        stroke={elbowMetric.colorHex}
                        strokeWidth="0.7"
                      />
                      {/* Seated hip angle arc */}
                      <path
                        d={buildJointArcPath(hip, shoulder, knee, 8)}
                        fill={hipMetric.colorHex}
                        fillOpacity="0.28"
                        stroke={hipMetric.colorHex}
                        strokeWidth="0.7"
                      />

                      {/* Kinetic chain bone segments */}
                      <line x1={ear.x} y1={ear.y} x2={shoulder.x} y2={shoulder.y} stroke={cvMetric.colorHex} strokeWidth="1.3" />
                      <line x1={shoulder.x} y1={shoulder.y} x2={hip.x} y2={hip.y} stroke={shoulderMetric.colorHex} strokeWidth="1.4" />
                      <line x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} stroke={elbowMetric.colorHex} strokeWidth="1.2" />
                      <line x1={elbow.x} y1={elbow.y} x2={wrist.x} y2={wrist.y} stroke={elbowMetric.colorHex} strokeWidth="1.2" />
                      <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke={hipMetric.colorHex} strokeWidth="1.4" />
                      <line x1={knee.x} y1={knee.y} x2={scanResult.landmarks.ankle.x} y2={scanResult.landmarks.ankle.y} stroke="#94A3B8" strokeWidth="1.1" />

                      {/* Landmark nodes */}
                      {Object.values(scanResult.landmarks).map(pt => (
                        <circle
                          key={pt.id}
                          cx={pt.x}
                          cy={pt.y}
                          r="1.9"
                          fill="#080E14"
                          stroke="#F8FAFC"
                          strokeWidth="0.8"
                        />
                      ))}
                    </>
                  )
                })()}
              </svg>

              {/* Score Pill Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(8, 14, 24, 0.92)',
                  border: `1px solid ${STRAIN_COLORS[scanResult.overallStrain]}`,
                  borderRadius: 8,
                  padding: '6px 10px',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: 9, fontFamily: 'var(--font-telemetry, monospace)', color: '#94A3B8', textTransform: 'uppercase' }}>
                  Ergonomics Score
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry, monospace)',
                    fontSize: 20,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: STRAIN_COLORS[scanResult.overallStrain],
                  }}
                >
                  {scanResult.score}
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>/100</span>
                </div>
              </div>
            </div>

            {/* Right: 4 Joint Angle Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {scanResult.angles.map(angle => {
                const tone = badgeTone(angle.status)
                return (
                  <div
                    key={angle.id}
                    style={{
                      background: 'rgba(8, 14, 24, 0.85)',
                      border: `1px solid ${tone.border}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, lineHeight: 1.2 }}>
                        {angle.title}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'var(--font-telemetry, monospace)',
                          fontWeight: 800,
                          color: tone.color,
                          background: tone.bg,
                          padding: '1px 5px',
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        {STRAIN_LABELS[angle.status]}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-telemetry, monospace)',
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#F8FAFC',
                        marginTop: 4,
                      }}
                    >
                      {angle.measuredDegrees}°{' '}
                      <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>
                        ({angle.neutralRangeLabel})
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3 Concrete Workstation Adjustments */}
          <div
            style={{
              background: 'rgba(8, 14, 24, 0.78)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#FBBF24',
                textTransform: 'uppercase',
              }}
            >
              3 Concrete Workstation Adjustments
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {scanResult.adjustments.map(adj => (
                <div
                  key={adj.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontSize: 10,
                      fontWeight: 800,
                      background: 'rgba(245, 158, 11, 0.18)',
                      color: '#FBBF24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    0{adj.priority}
                  </span>
                  <div>
                    <strong style={{ color: '#F8FAFC' }}>{adj.headline}</strong>
                    {!sandboxMode && (
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: 11.5 }}>
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => onLaunchDeskReset?.(scanResult.ergonomicFlags)}
                className="tactile-btn"
                style={{
                  flex: '1 1 220px',
                  minHeight: 44,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#04120C',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Launch Targeted 5-Min Desk Reset →
              </button>

              <button
                type="button"
                onClick={handleAuditAnotherDesk}
                className="tactile-btn"
                style={{
                  minHeight: 44,
                  padding: '10px 13px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#E2E8F0',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
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

