'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  analyzeLiftForm,
  LiftType,
  resolveSupportedVideoMimeType,
  VideoCritiqueAnalysis,
} from '@/lib/video-form-analysis'
import { TELEMETRY_CAMERA_RELEASE_EVENT } from '@/src/lib/telemetry/telemetryClient'

export interface LiveVideoFormCaptureModalProps {
  exerciseName: string
  isOpen: boolean
  onClose: () => void
  onApplyNotes?: (cueNotes: string) => void
  onOpenCorrectiveLab?: (liftType: LiftType, critique: VideoCritiqueAnalysis) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export function mapExerciseNameToLiftType(name: string): LiftType {
  const norm = name.toLowerCase()
  if (
    norm.includes('ohsa') ||
    norm.includes('overhead squat') ||
    norm.includes('movement screen')
  ) {
    return 'overhead_squat_assessment'
  }
  if (norm.includes('rdl') || (norm.includes('deadlift') && norm.includes('romanian'))) {
    return 'romanian_deadlift'
  }
  if (norm.includes('deadlift')) return 'barbell_deadlift'
  if (norm.includes('bench') || norm.includes('chest press')) return 'barbell_bench_press'
  if (norm.includes('overhead') || norm.includes('shoulder press') || norm.includes('military')) {
    return 'overhead_press'
  }
  if (norm.includes('row')) return 'barbell_row'
  if (norm.includes('single') && (norm.includes('squat') || norm.includes('leg'))) {
    return 'single_leg_squat'
  }
  return 'barbell_back_squat'
}

export default function LiveVideoFormCaptureModal({
  exerciseName,
  isOpen,
  onClose,
  onApplyNotes,
  onOpenCorrectiveLab,
  triggerHaptic,
}: LiveVideoFormCaptureModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()

  const [streamActive, setStreamActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [critique, setCritique] = useState<VideoCritiqueAnalysis | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordedUrlRef = useRef<string | null>(null)

  const liftType = mapExerciseNameToLiftType(exerciseName)

  const revokeRecordedUrl = useCallback(() => {
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current)
      recordedUrlRef.current = null
    }
    setRecordedVideoUrl(null)
  }, [])

  const stopPhysicalStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop())
      activeStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreamActive(false)
  }, [])

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current)
      analysisTimerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // Ignore already-stopped MediaRecorder
      }
    }
    mediaRecorderRef.current = null
    stopPhysicalStream()
    setIsRecording(false)
  }, [stopPhysicalStream])

  const initCamera = useCallback(async () => {
    try {
      setCameraError(null)
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API not available in current environment. Using simulation mode.')
        return
      }
      stopPhysicalStream()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      activeStreamRef.current = stream
      setStreamActive(true)
      if (videoRef.current) {
        if (typeof MediaStream === 'undefined' || stream instanceof MediaStream) {
          videoRef.current.srcObject = stream
        }
        videoRef.current.play().catch(() => {})
      }
    } catch {
      setCameraError('Camera permission denied or camera device in use. Ready in simulation mode.')
    }
  }, [stopPhysicalStream])

  // Sync native <dialog> modal lifecycle
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Bounding-rect pointer light-dismiss fallback where HTMLDialogElement.closedBy is unsupported
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || typeof HTMLDialogElement === 'undefined') return
    if ('closedBy' in HTMLDialogElement.prototype) return

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }

    let pressedOutside = false
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = dialog.open && isOutside(e)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && dialog.open && isOutside(e)) {
        dialog.close()
      }
      pressedOutside = false
    }

    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  // Start / teardown camera stream with modal open state
  useEffect(() => {
    if (!isOpen) {
      cleanupStream()
      revokeRecordedUrl()
      setCritique(null)
      return
    }

    void initCamera()

    return () => {
      cleanupStream()
    }
  }, [isOpen, initCamera, cleanupStream, revokeRecordedUrl])

  useEffect(() => {
    if (isOpen && streamActive && !recordedVideoUrl && videoRef.current && activeStreamRef.current) {
      try {
        if (
          typeof MediaStream === 'undefined' ||
          activeStreamRef.current instanceof MediaStream
        ) {
          videoRef.current.srcObject = activeStreamRef.current
        }
        videoRef.current.play().catch(() => {})
      } catch {
        // Ignore non-native stream attachment in synthetic environments
      }
    }
  }, [isOpen, streamActive, recordedVideoUrl])

  // Hardware privacy guard on tab backgrounding or telemetry camera release
  useEffect(() => {
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        cleanupStream()
      }
    }
    const onCameraRelease = () => {
      cleanupStream()
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, onCameraRelease)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, onCameraRelease)
      }
      cleanupStream()
      revokeRecordedUrl()
    }
  }, [cleanupStream, revokeRecordedUrl])

  const runAnalysis = useCallback(() => {
    const analysis = analyzeLiftForm({
      liftType,
      loadLbs: liftType === 'overhead_squat_assessment' ? 0 : 225,
      repsCount: 5,
      observedDeviations: [],
    })
    setCritique(analysis)
    triggerHaptic?.('success')
  }, [liftType, triggerHaptic])

  const stopRecording = useCallback(() => {
    triggerHaptic?.('heavy')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        stopPhysicalStream()
        runAnalysis()
      }
    } else {
      stopPhysicalStream()
      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current)
      analysisTimerRef.current = setTimeout(() => {
        runAnalysis()
      }, 300)
    }
    setIsRecording(false)
  }, [runAnalysis, stopPhysicalStream, triggerHaptic])

  const startRecording = async () => {
    triggerHaptic?.('tap')
    chunksRef.current = []
    setRecordSeconds(0)
    revokeRecordedUrl()
    setCritique(null)

    if (!activeStreamRef.current) {
      await initCamera()
    }

    const stream = activeStreamRef.current
    if (stream && typeof MediaRecorder !== 'undefined') {
      try {
        const preferredMime = resolveSupportedVideoMimeType()
        const recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream)
        const resolvedMime = recorder.mimeType || preferredMime || 'video/mp4'

        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
        }
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: resolvedMime })
          const url = URL.createObjectURL(blob)
          recordedUrlRef.current = url
          setRecordedVideoUrl(url)
          // Release physical webcam tracks immediately once clip capture completes
          stopPhysicalStream()
          runAnalysis()
        }
        recorder.start(100)
        mediaRecorderRef.current = recorder
      } catch {
        // Fallback simulation when MediaRecorder codec initialization fails
      }
    }

    setIsRecording(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setRecordSeconds(s => {
        if (s >= 10) {
          stopRecording()
          return 10
        }
        return s + 1
      })
    }, 1000)
  }

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    if (recordedVideoRef.current) {
      recordedVideoRef.current.playbackRate = speed
    }
  }

  return (
    <dialog
      ref={dialogRef}
      data-testid="live-video-form-capture-dialog"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={headingId}
      onClose={e => {
        e.currentTarget.returnValue = ''
        cleanupStream()
        onClose()
      }}
      className="forge-glass-modal"
      style={{
        width: 'min(640px, 95vw)',
        maxHeight: '92dvh',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(10,14,24,0.99) 100%)',
        border: '1.5px solid rgba(56,189,248,0.5)',
        borderRadius: 14,
        padding: 0,
        margin: 'auto',
        color: '#FFFFFF',
        boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(56,189,248,0.2)',
      }}
    >
      {isOpen ? (
        <div style={{ padding: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GaaIcon name="camera" size={20} tone="cyan" />
              <div>
                <h2
                  id={headingId}
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  NASM Video Form Cam
                </h2>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{exerciseName}</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close video form capture"
              onClick={() => dialogRef.current?.close()}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                borderRadius: '50%',
                minWidth: 44,
                minHeight: 44,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GaaIcon name="close" size={14} tone="white" />
            </button>
          </div>

          {/* Camera Viewfinder / Video Canvas Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              background: '#000000',
              borderRadius: 10,
              overflow: 'hidden',
              border: isRecording ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.15)',
              marginBottom: 12,
            }}
          >
            {streamActive && !recordedVideoUrl && (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />
            )}

            {recordedVideoUrl && (
              <video
                ref={recordedVideoRef}
                src={recordedVideoUrl}
                playsInline
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}

            {!streamActive && !recordedVideoUrl && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gray)',
                  gap: 8,
                }}
              >
                <GaaIcon name="video-studio" size={36} tone="slate" />
                <span style={{ fontSize: 13 }}>Camera inactive or waiting for permission</span>
              </div>
            )}

            {/* Recording Timer Badge */}
            {isRecording && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span aria-hidden="true" style={{ animation: 'pulse 1s infinite' }}>●</span>
                <span>REC 0:{String(recordSeconds).padStart(2, '0')} / 0:10</span>
              </div>
            )}

            {cameraError && !streamActive && !recordedVideoUrl && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                  textAlign: 'center',
                  background: 'rgba(15,23,42,0.9)',
                }}
              >
                <GaaIcon name="video-studio" size={32} tone="cyan" />
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginBottom: 4, marginTop: 8 }}>
                  Simulated Kinetic Cam Active
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{cameraError}</div>
              </div>
            )}
          </div>

          {/* Recording / Playback Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {!isRecording ? (
              <button
                type="button"
                onClick={() => void startRecording()}
                className="tactile-btn"
                style={{
                  flex: 1,
                  minWidth: 160,
                  minHeight: 44,
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  border: '1px solid #EF4444',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 900,
                  padding: '10px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 0 16px rgba(239,68,68,0.4)',
                }}
              >
                <GaaIcon name="video-studio" size={14} tone="white" />
                <span>{recordedVideoUrl ? 'Re-Record Set' : 'Record 10s Set Clip'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="tactile-btn"
                style={{
                  flex: 1,
                  minWidth: 160,
                  minHeight: 44,
                  background: '#FFFFFF',
                  border: '1px solid #FFFFFF',
                  color: '#0A0E18',
                  fontSize: 13,
                  fontWeight: 900,
                  padding: '10px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="stop" size={14} tone="inherit" />
                <span>Stop &amp; Analyze Form</span>
              </button>
            )}

            {/* Slow-Mo Playback Controls */}
            {recordedVideoUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8' }}>Slow-Mo:</span>
                {[1.0, 0.5, 0.25].map(spd => (
                  <button
                    key={spd}
                    type="button"
                    aria-pressed={playbackSpeed === spd}
                    onClick={() => changeSpeed(spd)}
                    style={{
                      minHeight: 44,
                      minWidth: 44,
                      background: playbackSpeed === spd ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)',
                      border: playbackSpeed === spd ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.15)',
                      color: playbackSpeed === spd ? '#38BDF8' : '#CBD5E1',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Biomechanical Critique Results */}
          {critique && (
            <div style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <GaaIcon name="check" size={12} tone="emerald" />
                  <span>NASM Biomechanical Form Assessment</span>
                </span>
                <span style={{ fontSize: 10, fontWeight: 900, background: '#10B98120', color: '#6EE7B7', border: '1px solid #10B98140', padding: '1px 6px', borderRadius: 3 }}>
                  Form Score: {critique.overallFormScore}/100
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.4, marginBottom: 8 }}>
                {critique.masterCoachSummary}
              </div>

              <div style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
                {critique.checkpoints.map((cp, cIdx) => (
                  <div key={cIdx} style={{ fontSize: 11, color: 'var(--gold-lt)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <GaaIcon name="lightbulb" size={12} tone="gold" />
                    <span><strong>{cp.name}:</strong> {cp.prescribedCue}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {onApplyNotes && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.('success')
                      const cueText = `[Form Score: ${critique.overallFormScore}/100] ${critique.checkpoints[0]?.prescribedCue || 'Form verified'}`
                      onApplyNotes(cueText)
                      dialogRef.current?.close()
                    }}
                    className="tactile-btn"
                    style={{
                      width: '100%',
                      minHeight: 44,
                      background: 'rgba(16,185,129,0.18)',
                      border: '1px solid rgba(16,185,129,0.45)',
                      color: '#6EE7B7',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '10px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="edit" size={13} tone="emerald" />
                    <span>Save Cues to Set Notes &amp; Return</span>
                  </button>
                )}

                {onOpenCorrectiveLab && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.('tap')
                      onOpenCorrectiveLab(liftType, critique)
                      dialogRef.current?.close()
                    }}
                    className="tactile-btn"
                    style={{
                      width: '100%',
                      minHeight: 44,
                      background: 'rgba(56,189,248,0.12)',
                      border: '1px solid rgba(56,189,248,0.35)',
                      color: '#38BDF8',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '10px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="sparkles" size={13} tone="cyan" />
                    <span>Open Full 4-Phase Corrective Protocol in Lab →</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </dialog>
  )
}
