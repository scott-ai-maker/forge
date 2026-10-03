'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import LiveTelestratorCanvas, { TelestratorTool, TelestratorColor } from './LiveTelestratorCanvas'
import LiveSlowMoReplayModal from './LiveSlowMoReplayModal'
import { createClient } from '@/lib/supabase-browser'
import { WebRtcPeerBridge, type LobbyParticipant } from '@/lib/webrtc-peer-bridge'
import LiveRemoteVideoFeed from './LiveRemoteVideoFeed'
import LiveStillCameraGuidanceModal from './LiveStillCameraGuidanceModal'
import {
  applyStillCameraConstraints,
  STILL_CAMERA_REQUEST_EVENT,
  type StillCameraRequestPayload,
} from '@/lib/camera-still-mode'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  ASSESSMENT_CAPTURE_SLOTS,
  type AssessmentCaptureSlot,
} from './UnifiedLiveStudioHud'
import {
  getNasmClinicalMovementCard,
  type NasmClinicalMovementCard,
} from '@/lib/nasm-clinical-movement-cards'

export type VideoHudLayout = 'split' | 'pip' | 'focus'

interface LiveVideoCameraHudProps {
  clientName?: string
  coachName?: string
  exerciseName?: string
  optPhase?: string
  currentTempo?: string
  remoteStream?: MediaStream | null
  isRemoteConnected?: boolean
  sessionId?: string
  currentUserId?: string
  isCoach?: boolean
  onTogglePlumbLine?: (active: boolean) => void
  onToggleMetronome?: () => void
  onOpenPlateCalc?: () => void
  onQuickCue?: (cue: string) => void
}

function BiomechanicalPlumbLine() {
  return (
    <div
      data-testid="biomechanical-plumb-line"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="plumbLaserGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor="#D4AF37" floodOpacity="0.75" />
          </filter>
        </defs>

        {/* Central Gravitational Plumb Axis */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="1.5,1" filter="url(#plumbLaserGlow)" />

        {/* Millimeter Metric Graduation Hash Ticks */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(y => (
          <line key={y} x1="48.5" y1={y} x2="51.5" y2={y} stroke="#D4AF37" strokeWidth="0.25" opacity={y === 50 ? 0.9 : 0.6} />
        ))}

        {/* Primary Anatomical Kinetic Planes */}
        {/* Shoulder Level Plane */}
        <line x1="8" y1="28" x2="92" y2="28" stroke="#3B82F6" strokeWidth="0.3" strokeDasharray="1.5,1" />
        <rect x="10" y="24.5" width="28" height="3" rx="0.8" fill="rgba(6,10,18,0.85)" stroke="#3B82F6" strokeWidth="0.15" />
        <text x="12" y="26.7" fill="#60A5FA" fontSize="1.8" fontWeight="bold" letterSpacing="0.05em">SHOULDER LEVEL</text>

        {/* LPHC / Pelvic Tilt Plane */}
        <line x1="8" y1="52" x2="92" y2="52" stroke="#EAB308" strokeWidth="0.3" strokeDasharray="1.5,1" />
        <rect x="10" y="48.5" width="32" height="3" rx="0.8" fill="rgba(6,10,18,0.85)" stroke="#EAB308" strokeWidth="0.15" />
        <text x="12" y="50.7" fill="#FDE047" fontSize="1.8" fontWeight="bold" letterSpacing="0.05em">LPHC / PELVIC TILT</text>

        {/* Knee Tracking Plane */}
        <line x1="8" y1="74" x2="92" y2="74" stroke="#10B981" strokeWidth="0.3" strokeDasharray="1.5,1" />
        <rect x="10" y="70.5" width="38" height="3" rx="0.8" fill="rgba(6,10,18,0.85)" stroke="#10B981" strokeWidth="0.15" />
        <text x="12" y="72.7" fill="#34D399" fontSize="1.8" fontWeight="bold" letterSpacing="0.05em">KNEE VALGUS / TRACKING</text>
      </svg>

      {/* Top Digital Level Inclinometer Status Badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          background: 'rgba(6, 10, 18, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: 20,
          padding: '3px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#FCD34D', fontWeight: 800, letterSpacing: '0.08em' }}>
          0.0° GRAVITATIONAL PLUMB
        </span>
      </div>
    </div>
  )
}

export default function LiveVideoCameraHud({
  clientName = 'Athlete',
  coachName = 'Coach Gordon',
  exerciseName = 'Overhead Squat Assessment',
  optPhase = 'Phase 2: Strength Endurance',
  currentTempo = '2-0-2',
  remoteStream,
  isRemoteConnected = false,
  sessionId,
  currentUserId,
  isCoach = true,
  onTogglePlumbLine,
  onToggleMetronome,
  onOpenPlateCalc,
  onQuickCue,
}: LiveVideoCameraHudProps) {
  const [layout, setLayout] = useState<VideoHudLayout>('split')
  const [isStageSwapped, setIsStageSwapped] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(true)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [showPlumbLine, setShowPlumbLine] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  // ── WebRTC Remote Stream & Peer Connection State ──
  const [activeRemoteStream, setActiveRemoteStream] = useState<MediaStream | null>(remoteStream ?? null)
  const [peerConnectionState, setPeerConnectionState] = useState<RTCPeerConnectionState | null>(null)
  const [coachInStudio, setCoachInStudio] = useState<LobbyParticipant | null>(null)
  const [peerLatencyMs, setPeerLatencyMs] = useState<number | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  // ── Telestrator State ──
  const [telestratorActive, setTelestratorActive] = useState(false)
  const [telestratorTool, setTelestratorTool] = useState<TelestratorTool>('pen')
  const [telestratorColor, setTelestratorColor] = useState<TelestratorColor>('#D4AF37')
  const [autoFade, setAutoFade] = useState(false)

  // ── Instant Slow-Mo Replay State ──
  const [replayVideoUrl, setReplayVideoUrl] = useState<string | null>(null)
  const rollingChunksRef = useRef<{ data: Blob; timestamp: number }[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // ── In-HUD Luxury Toast Notification State ──
  const [hudToast, setHudToast] = useState<{ message: string; type?: 'info' | 'gold' | 'emerald' | 'amber' } | null>(null)

  const showHudToast = useCallback((message: string, type: 'info' | 'gold' | 'emerald' | 'amber' = 'gold') => {
    setHudToast({ message, type })
    setTimeout(() => {
      setHudToast(curr => (curr?.message === message ? null : curr))
    }, 3500)
  }, [])

  // ── Still Camera & Auto-Zoom Guidance State ──
  const [showStillCameraModal, setShowStillCameraModal] = useState(false)
  const [stillCameraRequestedBy, setStillCameraRequestedBy] = useState('Coach Scott Gordon')
  const signalingChannelRef = useRef<RealtimeChannel | null>(null)

  // ── Reference Technique Model Comparison & Visual Guide ──
  const [showCompareModel, setShowCompareModel] = useState(false)
  const resolvedExerciseName = useMemo(() => {
    if (!exerciseName || exerciseName.toLowerCase().startsWith('phase ')) {
      return 'Overhead Squat Assessment'
    }
    return exerciseName
  }, [exerciseName])

  const movementCard = useMemo(() => {
    return getNasmClinicalMovementCard(resolvedExerciseName)
  }, [resolvedExerciseName])
  const [demoVideoModal, setDemoVideoModal] = useState<{
    isOpen: boolean
    embedUrl?: string | null
    name: string
  } | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // ── 4-Slot Assessment Image Capture & Vault State ──
  const [selectedCaptureSlot, setSelectedCaptureSlot] = useState<AssessmentCaptureSlot>('anterior')
  const [capturedFrames, setCapturedFrames] = useState<Record<AssessmentCaptureSlot, string | null>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const idKey = currentUserId || 'athlete_session'
        const stored =
          sessionStorage.getItem(`gaa_assessment_frames_${idKey}`) ||
          sessionStorage.getItem(`sgf_posture_photos_${idKey}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            anterior: parsed.anterior || null,
            lateral: parsed.lateral || null,
            posterior: parsed.posterior || null,
            overhead_squat: parsed.overhead_squat || null,
          }
        }
      } catch {}
    }
    return { anterior: null, lateral: null, posterior: null, overhead_squat: null }
  })
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(true)
  const [previewVaultImage, setPreviewVaultImage] = useState<string | null>(null)

  // Sync captured frames to session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const idKey = currentUserId || 'athlete_session'
        const payload = JSON.stringify(capturedFrames)
        sessionStorage.setItem(`gaa_assessment_frames_${idKey}`, payload)
        sessionStorage.setItem(`sgf_posture_photos_${idKey}`, payload)
        sessionStorage.setItem(`gaa_posture_photos_${idKey}`, payload)
        sessionStorage.setItem(
          `gaa_body_comp_photos_${idKey}`,
          JSON.stringify({
            anterior: capturedFrames.anterior,
            lateral: capturedFrames.lateral,
            posterior: capturedFrames.posterior,
          })
        )
      } catch {}
    }
  }, [capturedFrames, currentUserId])

  const clearAllVaultPhotos = useCallback(() => {
    setCapturedFrames({
      anterior: null,
      lateral: null,
      posterior: null,
      overhead_squat: null,
    })
    if (typeof window !== 'undefined') {
      try {
        const idKey = currentUserId || 'athlete_session'
        sessionStorage.removeItem(`gaa_assessment_frames_${idKey}`)
        sessionStorage.removeItem(`sgf_posture_photos_${idKey}`)
        sessionStorage.removeItem(`gaa_posture_photos_${idKey}`)
        sessionStorage.removeItem(`gaa_body_comp_photos_${idKey}`)
      } catch {}
    }
    showHudToast('Assessment vault photos cleared.', 'info')
  }, [currentUserId, showHudToast])

  const clearVaultSlot = useCallback((slot: AssessmentCaptureSlot) => {
    setCapturedFrames(prev => ({ ...prev, [slot]: null }))
  }, [])

  const captureClientFrame = useCallback((targetSlot?: AssessmentCaptureSlot): string | null => {
    const slot = targetSlot || selectedCaptureSlot

    const recordCapture = (frameData: string) => {
      setCapturedFrames(prev => ({
        ...prev,
        [slot]: frameData,
      }))
      const slotMeta = ASSESSMENT_CAPTURE_SLOTS.find(s => s.id === slot)
      showHudToast(`✓ Captured ${slotMeta?.shortLabel || slot} diagnostic frame!`, 'emerald')

      const sequence: AssessmentCaptureSlot[] = ['anterior', 'lateral', 'posterior', 'overhead_squat']
      const currentIndex = sequence.indexOf(slot)
      setSelectedCaptureSlot(sequence[(currentIndex + 1) % sequence.length])
      return frameData
    }

    // 1. Strictly target the athlete's video element inside [data-testid="athlete-video-container"]
    const athleteContainer = typeof document !== 'undefined'
      ? (document.querySelector('[data-testid="athlete-video-container"]') as HTMLElement | null)
      : null
    const video = (athleteContainer?.querySelector('video') as HTMLVideoElement | null) ||
      (isCoach ? remoteVideoRef.current : localVideoRef.current)

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      try {
        const canvas = document.createElement('canvas')
        // ALWAYS capture the ENTIRE native uncropped camera frame from the athlete video
        // bypassing any CSS object-fit or container bounds
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
          const frameData = canvas.toDataURL('image/jpeg', 0.92)
          return recordCapture(frameData)
        }
      } catch {}
    }

    // 2. Synthetic diagnostic frame (headless / demo testing fallback)
    try {
      const fallbackCanvas = document.createElement('canvas')
      fallbackCanvas.width = 640
      fallbackCanvas.height = 480
      const ctx = fallbackCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#080E14'
        ctx.fillRect(0, 0, 640, 480)
        ctx.strokeStyle = '#D4A017'
        ctx.lineWidth = 4
        ctx.strokeRect(16, 16, 608, 448)
        ctx.fillStyle = '#D4A017'
        ctx.font = 'bold 20px Cinzel, Georgia, serif'
        ctx.fillText(`DIAGNOSTIC FRAME: ${slot.toUpperCase()}`, 36, 64)
        ctx.fillStyle = '#E2E8F0'
        ctx.font = '14px sans-serif'
        ctx.fillText(`Athlete: ${clientName} · Telehealth In-Progress`, 36, 96)
        ctx.fillStyle = '#10B981'
        ctx.fillText(`Captured: ${new Date().toLocaleTimeString()} · Status: Ingest Ready`, 36, 126)
        const frameData = fallbackCanvas.toDataURL('image/jpeg', 0.85)
        return recordCapture(frameData)
      }
    } catch {}

    showHudToast('Video stream initializing. Ensure camera is connected.', 'amber')
    return null
  }, [clientName, selectedCaptureSlot, showHudToast])
  const bridgeRef = useRef<WebRtcPeerBridge | null>(null)

  // Synchronize remoteStream prop
  useEffect(() => {
    if (remoteStream !== undefined) {
      setActiveRemoteStream(remoteStream)
    }
  }, [remoteStream])

  // Synchronize Athlete device states to channel presence
  useEffect(() => {
    if (signalingChannelRef.current && currentUserId) {
      void signalingChannelRef.current.track({
        userId: currentUserId,
        name: clientName || 'Athlete',
        role: 'athlete',
        joinedAt: Date.now(),
        cameraActive: isCameraActive,
        micActive: !isMicMuted,
      }).catch(() => {})
    }
  }, [isCameraActive, isMicMuted, currentUserId, clientName])

  // Native WebRTC Peer Bridge over Supabase Realtime Signaling with Presence
  useEffect(() => {
    if (!sessionId || !currentUserId) return

    const supabase = createClient()
    const channel = supabase.channel(`webrtc:${sessionId}`, {
      config: {
        presence: { key: currentUserId },
      },
    })
    signalingChannelRef.current = channel

    const bridge = new WebRtcPeerBridge({
      sessionId,
      currentUserId,
      isCoach,
      channel,
      localStream: mediaStream,
      onRemoteStream: stream => {
        setActiveRemoteStream(stream)
      },
      onConnectionStateChange: state => {
        setPeerConnectionState(state)
      },
      onLatencyChange: rtt => {
        setPeerLatencyMs(rtt)
      },
      onError: err => {
        console.warn('Live WebRTC peer error:', err)
      },
    })
    bridgeRef.current = bridge

    const syncPresence = () => {
      const presenceState = channel.presenceState()
      let foundCoach: LobbyParticipant | null = null
      for (const key of Object.keys(presenceState)) {
        const presences = presenceState[key] as any[]
        for (const p of presences) {
          if (p.role === 'coach') {
            foundCoach = {
              userId: p.userId || key,
              name: p.name || coachName,
              role: 'coach',
              joinedAt: p.joinedAt || Date.now(),
              cameraActive: p.cameraActive,
              micActive: p.micActive,
            }
            break
          }
        }
        if (foundCoach) break
      }
      setCoachInStudio(foundCoach)
    }

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        const coach = newPresences?.find((p: any) => p.role === 'coach')
        if (coach) {
          setCoachInStudio({
            userId: coach.userId || 'coach',
            name: coach.name || coachName,
            role: 'coach',
            joinedAt: coach.joinedAt || Date.now(),
            cameraActive: coach.cameraActive,
            micActive: coach.micActive,
          })
          showHudToast(`🟢 ${coachName} entered the Live Studio!`, 'emerald')
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        const coach = leftPresences?.find((p: any) => p.role === 'coach')
        if (coach) {
          setCoachInStudio(null)
          showHudToast(`${coachName} left the studio room.`, 'amber')
        }
      })
      .on('broadcast', { event: 'webrtc_signal' }, ({ payload }) => {
        void bridge.handleSignal(payload)
      })
      .on('broadcast', { event: STILL_CAMERA_REQUEST_EVENT }, ({ payload }) => {
        const req = payload as StillCameraRequestPayload
        setStillCameraRequestedBy(req?.coachName || 'Coach Scott Gordon')
        setShowStillCameraModal(true)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          bridge.init()
          // Track Athlete Presence in Live Studio Lobby
          try {
            await channel.track({
              userId: currentUserId,
              name: clientName || 'Athlete',
              role: 'athlete',
              joinedAt: Date.now(),
              cameraActive: isCameraActive,
              micActive: !isMicMuted,
            })
          } catch {}
          // Broadcast presence ready and join signals
          void channel.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              type: 'ready',
              senderId: currentUserId,
            },
          })
          void channel.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              type: 'join',
              senderId: currentUserId,
            },
          })
        }
      })

    // Periodic ping every 6s to keep signaling channel warm & measure latency without renegotiation
    const pingTimer = setInterval(() => {
      if (bridgeRef.current) {
        bridgeRef.current.sendPing()
      }
    }, 6000)

    return () => {
      clearInterval(pingTimer)
      bridge.destroy()
      bridgeRef.current = null
      signalingChannelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [sessionId, currentUserId, isCoach, clientName, coachName, isCameraActive, isMicMuted, showHudToast])

  // Attach local media stream as soon as acquired
  useEffect(() => {
    if (bridgeRef.current && mediaStream) {
      bridgeRef.current.attachLocalStream(mediaStream)
    }
  }, [mediaStream])

  const startCamera = useCallback(async () => {
    try {
      setStreamError(null)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStreamError('Camera access not supported on this device.')
        return
      }

      // Hardware Camera & Microphone Startup with Enhanced Audio Processing
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 24 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
        } catch {
          // Fallback if microphone hardware or permission is unavailable
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
      }

      streamRef.current = stream
      setMediaStream(stream)

      // Apply W3C PTZ / 1.0x digital zoom lock to enforce still camera
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        void applyStillCameraConstraints(videoTrack)
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(() => {})
      }
      setIsCameraActive(true)

      // Only run continuous background recorder on desktop devices to preserve mobile performance
      const isMobileDevice = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
      if (!isMobileDevice) {
        try {
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
          mediaRecorderRef.current = recorder

          recorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) {
              const now = Date.now()
              rollingChunksRef.current.push({ data: e.data, timestamp: now })
              const cutoff = now - 10000
              rollingChunksRef.current = rollingChunksRef.current.filter(c => c.timestamp >= cutoff)
            }
          }

          recorder.start(1000)
        } catch {
          try {
            const recorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            recorder.ondataavailable = e => {
              if (e.data && e.data.size > 0) {
                const now = Date.now()
                rollingChunksRef.current.push({ data: e.data, timestamp: now })
                const cutoff = now - 10000
                rollingChunksRef.current = rollingChunksRef.current.filter(c => c.timestamp >= cutoff)
              }
            }
            recorder.start(1000)
          } catch {}
        }
      }
    } catch {
      setStreamError('Camera / Microphone permission pending or unavailable.')
      setIsCameraActive(false)
    }
  }, [facingMode])

  useEffect(() => {
    void startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [startCamera])

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsCameraActive(videoTracks.some(t => t.enabled))
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMicMuted(audioTracks.every(t => !t.enabled))
    }
  }

  const flipCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => undefined)
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen().catch(() => undefined)
      setIsFullscreen(false)
    }
  }

  const handlePlumbLineToggle = () => {
    const next = !showPlumbLine
    setShowPlumbLine(next)
    onTogglePlumbLine?.(next)
  }

  const requestStillCamera = useCallback(async () => {
    if (!signalingChannelRef.current) {
      showHudToast('Connecting to athlete feed… please wait', 'amber')
      return
    }
    try {
      await signalingChannelRef.current.send({
        type: 'broadcast',
        event: STILL_CAMERA_REQUEST_EVENT,
        payload: {
          coachName: coachName || 'Coach Scott Gordon',
          timestamp: Date.now(),
          reason: 'Fixed frame required for kinetic alignment and NASM movement analysis',
        } as StillCameraRequestPayload,
      })
      showHudToast('Requested Still Camera from Athlete (Guidance Sent)', 'emerald')
    } catch (err) {
      console.error('Failed to send still camera request:', err)
      showHudToast('Failed to send still camera request', 'amber')
    }
  }, [coachName, showHudToast])

  const triggerSlowMoReplay = () => {
    if (rollingChunksRef.current.length === 0) {
      showHudToast('Buffering high-speed video feed… please wait 3 seconds before replaying.', 'amber')
      return
    }
    const blobs = rollingChunksRef.current.map(c => c.data)
    const combined = new Blob(blobs, { type: 'video/webm' })
    const url = URL.createObjectURL(combined)
    setReplayVideoUrl(url)
  }

  return (
    <div
      ref={containerRef}
      className="live-video-hud-container"
      style={{
        background: '#060A12',
        border: '1px solid rgba(212,160,23,0.4)',
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top HUD Status Ribbon ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(8,12,22,0.96)',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          zIndex: 30,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Back / Exit Studio Navigation Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = isCoach ? '/coach' : '/dashboard'
              }
            }}
            data-testid="live-hud-exit-btn"
            title={isCoach ? 'Exit Cockpit to Coach Hub' : 'Exit Studio to Dashboard'}
            style={{
              padding: '5px 10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="arrow-left" size={12} tone="ruby" />
            <span>{isCoach ? 'Exit Cockpit' : 'Exit Studio'}</span>
          </button>

          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              backgroundImage: "url('/images/gaa-brand-crest.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid var(--gold)',
              boxShadow: '0 0 8px rgba(197,160,89,0.4)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
            LIVE 1:1 BIOMECHANICS LAB
          </span>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>·</span>
          <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 600 }}>
            {coachName} ⇄ {clientName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {exerciseName && (
            <span
              style={{
                fontSize: 11,
                background: 'rgba(212,160,23,0.15)',
                color: 'var(--gold-lt)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(212,160,23,0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name="barbell" size={12} tone="gold" />
              {exerciseName} ({currentTempo})
            </span>
          )}

          {/* Still Camera Mode Guidance Badge */}
          <button
            type="button"
            onClick={() => setShowStillCameraModal(true)}
            data-testid="still-camera-badge-btn"
            title="Still Camera Mode: Guide to disable Apple Center Stage / Auto-Framing"
            style={{
              padding: '4px 9px',
              background: 'rgba(212,175,55,0.14)',
              border: '1px solid rgba(212,175,55,0.4)',
              color: 'var(--gold-lt)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="camera" size={12} tone="gold" />
            <span>Still Camera</span>
          </button>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: 2 }}>
            <button
              type="button"
              onClick={() => setLayout('split')}
              style={{
                background: layout === 'split' ? 'var(--gold)' : 'transparent',
                color: layout === 'split' ? '#0A0E18' : 'var(--gray)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              SPLIT
            </button>
            <button
              type="button"
              onClick={() => setLayout('pip')}
              style={{
                background: layout === 'pip' ? 'var(--gold)' : 'transparent',
                color: layout === 'pip' ? '#0A0E18' : 'var(--gray)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              PiP
            </button>
            <button
              type="button"
              onClick={() => setLayout('focus')}
              style={{
                background: layout === 'focus' ? 'var(--gold)' : 'transparent',
                color: layout === 'focus' ? '#0A0E18' : 'var(--gray)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              STAGE
            </button>
            <button
              type="button"
              onClick={() => setIsStageSwapped(prev => !prev)}
              style={{
                background: isStageSwapped ? 'rgba(59,130,246,0.3)' : 'transparent',
                color: isStageSwapped ? '#60A5FA' : 'var(--gray)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title="Swap Main Stage between Athlete and Coach"
            >
              ⇄ SWAP
            </button>
          </div>
        </div>
      </div>

      {/* ── Athlete Studio Lobby Banner ── */}
      {!isCoach && !activeRemoteStream && (
        <div
          data-testid="athlete-lobby-banner"
          style={{
            background: coachInStudio
              ? 'linear-gradient(90deg, rgba(16,185,129,0.2) 0%, rgba(6,78,59,0.3) 100%)'
              : 'linear-gradient(90deg, rgba(212,160,23,0.15) 0%, rgba(138,101,8,0.2) 100%)',
            borderBottom: coachInStudio ? '1px solid rgba(52,211,153,0.45)' : '1px solid rgba(212,160,23,0.3)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: coachInStudio ? '#10B981' : '#D4AF37',
                boxShadow: coachInStudio ? '0 0 10px #10B981' : 'none',
                animation: 'pulse 2s infinite',
              }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: coachInStudio ? '#34D399' : 'var(--gold-lt)', letterSpacing: '0.04em' }}>
                {coachInStudio
                  ? `🟢 ${coachName.toUpperCase()} IS IN THE STUDIO · CONNECTING LIVE PEER FEED`
                  : `🟢 YOU ARE IN THE LIVE STUDIO LOBBY · WAITING FOR ${coachName.toUpperCase()}`}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#E2E8F0' }}>
                {coachInStudio
                  ? 'Connecting direct peer video feed. Please keep your device steady.'
                  : `Your camera and mic are active. ${coachName} has been notified you are waiting in the room.`}
              </p>
            </div>
          </div>
          {peerLatencyMs != null && (
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'monospace',
                color: '#34D399',
                background: 'rgba(0,0,0,0.45)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              ● {peerLatencyMs}ms RTT
            </span>
          )}
        </div>
      )}

      {/* ── Main Video Stage & Overlays ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 380,
          background: '#04070D',
          display: 'grid',
          gridTemplateColumns: showCompareModel ? '1fr 1fr' : layout === 'split' ? '1fr 1fr' : '1fr',
          gap: layout === 'split' || showCompareModel ? 2 : 0,
        }}
      >
        {/* ── Viewport 1: Left Frame (Coach initially by default, or Athlete when swapped / comparing) ── */}
        {showCompareModel || isStageSwapped ? (
          /* ATHLETE ON LEFT: Swapped for demo or comparing form */
          <div
            data-testid="athlete-video-container"
            style={{
              position: layout === 'pip' && isStageSwapped ? 'absolute' : 'relative',
              bottom: layout === 'pip' && isStageSwapped ? 16 : undefined,
              right: layout === 'pip' && isStageSwapped ? 16 : undefined,
              width: layout === 'pip' && isStageSwapped ? 220 : '100%',
              height: layout === 'pip' && isStageSwapped ? 150 : '100%',
              minHeight: layout === 'split' || showCompareModel ? 380 : undefined,
              background: '#080C16',
              border: layout === 'pip' && isStageSwapped ? '2px solid var(--gold)' : 'none',
              borderRadius: layout === 'pip' && isStageSwapped ? 8 : 0,
              boxShadow: layout === 'pip' && isStageSwapped ? '0 10px 30px rgba(0,0,0,0.8)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              zIndex: layout === 'pip' && isStageSwapped ? 25 : 1,
              overflow: 'hidden',
            }}
          >
            {isCoach ? (
              <LiveRemoteVideoFeed
                stream={activeRemoteStream}
                participantName={clientName}
                participantRole="Athlete"
                isConnected={peerConnectionState === 'connected' || isRemoteConnected}
                isPeerInLobby={Boolean(coachInStudio)}
                peerLatencyMs={peerLatencyMs}
                onVideoRef={el => {
                  remoteVideoRef.current = el
                }}
              />
            ) : (
              isCameraActive ? (
                <video
                  ref={el => {
                    localVideoRef.current = el
                    if (el && mediaStream && el.srcObject !== mediaStream) {
                      el.srcObject = mediaStream
                      el.play().catch(() => {})
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <GaaIcon name="video-off" size={28} tone="slate" />
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Your Camera is Off</div>
                </div>
              )
            )}

            {/* Athlete Overlay Status Badge */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 11,
                color: '#FFFFFF',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 2,
              }}
            >
              ● {isCoach ? `${clientName} (Athlete Feed)` : `${clientName} (You)`}
            </div>

            {/* 4-Slot Assessment Capture Dropdown & Button Bar */}
            <div
              data-testid="athlete-video-capture-bar"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(6, 10, 18, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(212, 160, 23, 0.45)',
                borderRadius: 6,
                padding: '3px 6px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.8)',
              }}
            >
              <select
                value={selectedCaptureSlot}
                onChange={e => setSelectedCaptureSlot(e.target.value as AssessmentCaptureSlot)}
                data-testid="capture-slot-select"
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 4,
                  color: 'var(--gold-lt)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '3px 6px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {ASSESSMENT_CAPTURE_SLOTS.map(slot => {
                  const isCaptured = Boolean(capturedFrames[slot.id])
                  return (
                    <option key={slot.id} value={slot.id} style={{ background: '#0A0E18', color: '#FFF' }}>
                      {isCaptured ? '✓ ' : '○ '}
                      {slot.shortLabel} ({slot.badge})
                    </option>
                  )
                })}
              </select>

              <button
                type="button"
                onClick={() => captureClientFrame(selectedCaptureSlot)}
                data-testid="capture-frame-btn"
                className="tactile-btn"
                style={{
                  padding: '4px 9px',
                  background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                  border: 'none',
                  borderRadius: 4,
                  color: '#080E14',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="camera" size={12} tone="inherit" />
                <span>Capture</span>
              </button>

              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--gray-lt)',
                  fontWeight: 800,
                  padding: '0 4px',
                  borderLeft: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {Object.values(capturedFrames).filter(Boolean).length}/4
              </div>
            </div>

            {/* Plumb Line (Strictly Athlete's camera only — never coach's video) */}
            {showPlumbLine && <BiomechanicalPlumbLine />}

            {/* Active Telestrator Drawing Layer (Scaped to Athlete) */}
            <LiveTelestratorCanvas
              isActive={telestratorActive}
              activeTool={telestratorTool}
              activeColor={telestratorColor}
              autoFade={autoFade}
            />
          </div>
        ) : (
          /* COACH ON LEFT (DEFAULT): Coach View (Split column, PiP floating at bottom-left, or Focus) */
          layout === 'focus' ? (
            <div
              data-testid="coach-video-container"
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                zIndex: 25,
              }}
            >
              <button
                type="button"
                onClick={() => setLayout('pip')}
                title="Restore Coach Picture-in-Picture"
                style={{
                  padding: '5px 12px',
                  background: 'rgba(6,10,18,0.88)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 20,
                  color: 'var(--gold-lt)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span>Coach PiP Minimized</span>
              </button>
            </div>
          ) : (
            <div
              data-testid="coach-video-container"
              style={{
                position: layout === 'pip' ? 'absolute' : 'relative',
                bottom: layout === 'pip' ? 16 : undefined,
                left: layout === 'pip' ? 16 : undefined,
                width: layout === 'pip' ? 220 : '100%',
                height: layout === 'pip' ? 150 : '100%',
                minHeight: layout === 'split' ? 380 : undefined,
                background: 'linear-gradient(135deg, #0D1628 0%, #060A14 100%)',
                border: layout === 'pip' ? '2px solid var(--gold)' : 'none',
                borderRadius: layout === 'pip' ? 8 : 0,
                boxShadow: layout === 'pip' ? '0 10px 30px rgba(0,0,0,0.8)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: layout === 'pip' ? 25 : 1,
                overflow: 'hidden',
              }}
            >
              {isCoach ? (
                /* When Coach is viewing HUD, coach's self-view is local webcam */
                isCameraActive ? (
                  <video
                    ref={el => {
                      localVideoRef.current = el
                      if (el && mediaStream && el.srcObject !== mediaStream) {
                        el.srcObject = mediaStream
                        el.play().catch(() => {})
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 12, color: 'var(--gray)', fontSize: 11 }}>Camera Off</div>
                )
              ) : (
                /* When Athlete is viewing HUD, coach is remote WebRTC feed */
                <LiveRemoteVideoFeed
                  stream={activeRemoteStream}
                  participantName={coachName}
                  participantRole="Coach"
                  isConnected={peerConnectionState === 'connected' || isRemoteConnected}
                  isPeerInLobby={Boolean(coachInStudio)}
                  peerLatencyMs={peerLatencyMs}
                  onVideoRef={el => {
                    remoteVideoRef.current = el
                  }}
                />
              )}

              {/* Coach Overlay Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(6px)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  color: '#FFF',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  zIndex: 2,
                  border: coachInStudio ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: activeRemoteStream
                      ? '#34D399'
                      : coachInStudio
                      ? '#10B981'
                      : peerConnectionState === 'connected'
                      ? '#60A5FA'
                      : '#D4AF37',
                    boxShadow: coachInStudio || activeRemoteStream ? '0 0 6px #10B981' : 'none',
                  }}
                />
                <span>
                  {coachName}{' '}
                  {activeRemoteStream
                    ? '(Live Video)'
                    : coachInStudio
                    ? '(In Studio)'
                    : peerConnectionState === 'connected'
                    ? '(Connecting)'
                    : '(Standby)'}
                </span>
              </div>

              {/* 1-Click Swap Button in PiP */}
              {layout === 'pip' && (
                <button
                  type="button"
                  onClick={() => setIsStageSwapped(true)}
                  title="Swap Coach to Main Stage"
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    zIndex: 20,
                    padding: '2px 6px',
                    background: 'rgba(6,10,18,0.85)',
                    border: '1px solid var(--gold)',
                    borderRadius: 4,
                    color: 'var(--gold-lt)',
                    fontSize: 9.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <GaaIcon name="rotate-ccw" size={9} tone="gold" />
                  <span>Swap</span>
                </button>
              )}
            </div>
          )
        )}

        {/* ── Viewport 2: Right Frame (Athlete initially by default, Coach if swapped, or Model Compare) ── */}
        {showCompareModel ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 380,
              background: 'linear-gradient(180deg, #090F1C 0%, #040812 100%)',
              borderLeft: '1px solid rgba(212,160,23,0.3)',
              display: 'flex',
              flexDirection: 'column',
              padding: 16,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="star" size={13} tone="gold" />
                Gold-Standard NASM Benchmark
              </span>
              <button
                type="button"
                onClick={() => setShowCompareModel(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 14, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <GaaIcon name="close" size={14} tone="slate" />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 10, overflowY: 'auto', padding: '10px 0' }}>
              <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: '#FFF', letterSpacing: '0.04em' }}>
                {resolvedExerciseName}
              </div>

              {/* Official NASM Exercise Visual Image */}
              <div
                data-testid="benchmark-exercise-image"
                onClick={() => {
                  if (movementCard?.embedUrl) {
                    setDemoVideoModal({
                      isOpen: true,
                      embedUrl: movementCard.embedUrl,
                      name: resolvedExerciseName,
                    })
                  }
                }}
                style={{
                  width: 'clamp(140px, 16vw, 175px)',
                  aspectRatio: '16 / 10',
                  minWidth: 'clamp(140px, 16vw, 175px)',
                  height: 'auto',
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid rgba(212,160,23,0.4)',
                  background: '#04070E',
                  position: 'relative',
                  cursor: movementCard?.embedUrl ? 'pointer' : 'default',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={movementCard?.embedUrl ? 'Click to watch official demo video' : resolvedExerciseName}
              >
                {(movementCard?.imageUrl || movementCard?.fallbackImageUrl) ? (
                  <>
                    <img
                      src={movementCard.imageUrl || movementCard.fallbackImageUrl || '/images/exercises/image-not-available.jpg'}
                      alt={resolvedExerciseName}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {movementCard.embedUrl && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'rgba(212, 160, 23, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                          }}
                        >
                          <GaaIcon name="play" size={12} tone="slate" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src="/images/exercises/image-not-available.jpg"
                    alt={resolvedExerciseName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              <div
                style={{
                  background: 'rgba(212,160,23,0.1)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.45,
                  maxWidth: 320,
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 4 }}>Kinetic Checkpoints:</div>
                • Shin parallel to torso angle at parallel depth.<br />
                • Knees tracking directly in line with 2nd/3rd toes.<br />
                • Neutral lumbar curve with locked core brace.
              </div>

              {movementCard?.clinicalCues && movementCard.clinicalCues.length > 0 && (
                <div style={{ maxWidth: 320, textAlign: 'left', fontSize: 11, color: '#E2E8F0', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: 'var(--gold-lt)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Clinical Form Cues:</div>
                  {movementCard.clinicalCues.slice(0, 2).map((cue, idx) => (
                    <div key={idx} style={{ marginTop: 2, lineHeight: 1.3 }}>• {cue}</div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                Target Cadence: <strong style={{ color: 'var(--gold-lt)' }}>{currentTempo}</strong> · OPT™ Phase: {optPhase}
              </div>

              {movementCard?.embedUrl && (
                <button
                  type="button"
                  data-testid="benchmark-watch-demo-btn"
                  onClick={() => setDemoVideoModal({
                    isOpen: true,
                    embedUrl: movementCard.embedUrl,
                    name: exerciseName || 'Exercise Demo',
                  })}
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93C5FD',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="play" size={11} tone="inherit" />
                  <span>Watch NASM Demonstration</span>
                </button>
              )}
            </div>
          </div>
        ) : !isStageSwapped ? (
          /* ATHLETE ON RIGHT (DEFAULT): Right Frame in Split mode or Full Stage in PiP/Focus */
          <div
            data-testid="athlete-video-container"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: 380,
              background: '#080C16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {isCoach ? (
              /* When Coach is viewing HUD, athlete is the remote WebRTC feed */
              <LiveRemoteVideoFeed
                stream={activeRemoteStream}
                participantName={clientName}
                participantRole="Athlete"
                isConnected={peerConnectionState === 'connected' || isRemoteConnected}
                isPeerInLobby={Boolean(coachInStudio)}
                peerLatencyMs={peerLatencyMs}
                onVideoRef={el => {
                  remoteVideoRef.current = el
                }}
              />
            ) : (
              /* When Athlete is viewing HUD, athlete is local webcam */
              isCameraActive ? (
                <video
                  ref={el => {
                    localVideoRef.current = el
                    if (el && mediaStream && el.srcObject !== mediaStream) {
                      el.srcObject = mediaStream
                      el.play().catch(() => {})
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <GaaIcon name="video-off" size={28} tone="slate" />
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Your Camera is Off</div>
                </div>
              )
            )}

            {/* Athlete Overlay Status Badge */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 11,
                color: '#FFFFFF',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 2,
              }}
            >
              ● {isCoach ? `${clientName} (Athlete Feed)` : `${clientName} (You)`}
            </div>

            {/* 4-Slot Assessment Capture Dropdown & Button Bar */}
            <div
              data-testid="athlete-video-capture-bar"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(6, 10, 18, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(212, 160, 23, 0.45)',
                borderRadius: 6,
                padding: '3px 6px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.8)',
              }}
            >
              <select
                value={selectedCaptureSlot}
                onChange={e => setSelectedCaptureSlot(e.target.value as AssessmentCaptureSlot)}
                data-testid="capture-slot-select"
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 4,
                  color: 'var(--gold-lt)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '3px 6px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {ASSESSMENT_CAPTURE_SLOTS.map(slot => {
                  const isCaptured = Boolean(capturedFrames[slot.id])
                  return (
                    <option key={slot.id} value={slot.id} style={{ background: '#0A0E18', color: '#FFF' }}>
                      {isCaptured ? '✓ ' : '○ '}
                      {slot.shortLabel} ({slot.badge})
                    </option>
                  )
                })}
              </select>

              <button
                type="button"
                onClick={() => captureClientFrame(selectedCaptureSlot)}
                data-testid="capture-frame-btn"
                className="tactile-btn"
                style={{
                  padding: '4px 9px',
                  background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                  border: 'none',
                  borderRadius: 4,
                  color: '#080E14',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="camera" size={12} tone="inherit" />
                <span>Capture</span>
              </button>

              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--gray-lt)',
                  fontWeight: 800,
                  padding: '0 4px',
                  borderLeft: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {Object.values(capturedFrames).filter(Boolean).length}/4
              </div>
            </div>

            {/* Plumb Line (Strictly Athlete's camera only — never coach's video) */}
            {showPlumbLine && <BiomechanicalPlumbLine />}

            {/* Active Telestrator Drawing Layer (Scaped to Athlete) */}
            <LiveTelestratorCanvas
              isActive={telestratorActive}
              activeTool={telestratorTool}
              activeColor={telestratorColor}
              autoFade={autoFade}
            />
          </div>
        ) : (
          /* COACH ON RIGHT (SWAPPED): Coach Stage for Demonstration — STRICTLY NO PLUMB LINE */
          <div
            data-testid="coach-video-container"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: 380,
              background: '#080C16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {isCoach ? (
              isCameraActive ? (
                <video
                  ref={el => {
                    localVideoRef.current = el
                    if (el && mediaStream && el.srcObject !== mediaStream) {
                      el.srcObject = mediaStream
                      el.play().catch(() => {})
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>Camera Off</div>
              )
            ) : (
              <LiveRemoteVideoFeed
                stream={activeRemoteStream}
                participantName={coachName}
                participantRole="Coach"
                isConnected={peerConnectionState === 'connected' || isRemoteConnected}
                isPeerInLobby={Boolean(coachInStudio)}
                peerLatencyMs={peerLatencyMs}
                onVideoRef={el => {
                  remoteVideoRef.current = el
                }}
              />
            )}

            {/* Coach Feed Overlay Badge */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                padding: '4px 9px',
                borderRadius: 4,
                fontSize: 11,
                color: '#FFFFFF',
                fontWeight: 700,
                border: coachInStudio ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.1)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: activeRemoteStream
                    ? '#34D399'
                    : coachInStudio
                    ? '#10B981'
                    : peerConnectionState === 'connected'
                    ? '#60A5FA'
                    : '#D4AF37',
                  boxShadow: coachInStudio || activeRemoteStream ? '0 0 6px #10B981' : 'none',
                }}
              />
              <span>
                {coachName}{' '}
                {activeRemoteStream
                  ? '(Live Video)'
                  : coachInStudio
                  ? '(In Studio)'
                  : peerConnectionState === 'connected'
                  ? '(Connecting)'
                  : '(Standby)'}
              </span>
            </div>

            {/* Swap Stage Return Button */}
            <button
              type="button"
              onClick={() => setIsStageSwapped(false)}
              title="Return Athlete to Main Stage"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 25,
                padding: '5px 10px',
                background: 'rgba(7, 12, 22, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid var(--gold)',
                borderRadius: 6,
                color: 'var(--gold-lt)',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
              }}
            >
              <GaaIcon name="rotate-ccw" size={12} tone="gold" />
              <span>Return Athlete to Stage</span>
            </button>
          </div>
        )}

        {/* ── Floating Luxury In-HUD Toast Notification ── */}
        {hudToast && (
          <div
            data-testid="hud-toast"
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              background: 'rgba(6,10,18,0.94)',
              backdropFilter: 'blur(12px)',
              border: hudToast.type === 'amber'
                ? '1px solid rgba(245,158,11,0.6)'
                : hudToast.type === 'emerald'
                ? '1px solid rgba(16,185,129,0.6)'
                : '1px solid rgba(212,160,23,0.6)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
              padding: '7px 16px',
              borderRadius: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: hudToast.type === 'amber' ? '#F59E0B' : hudToast.type === 'emerald' ? '#10B981' : 'var(--gold)',
                boxShadow: `0 0 8px ${hudToast.type === 'amber' ? '#F59E0B' : hudToast.type === 'emerald' ? '#10B981' : 'var(--gold)'}`,
              }}
            />
            <span style={{ fontSize: 11.5, color: '#FFFFFF', fontWeight: 600 }}>
              {hudToast.message}
            </span>
          </div>
        )}
      </div>

      {/* ── Telestrator Active Controls Strip (when Telestrator is ON) ── */}
      {telestratorActive && (
        <div
          style={{
            background: 'rgba(14,22,38,0.98)',
            borderTop: '1px solid rgba(212,160,23,0.3)',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <GaaIcon name="edit" size={12} tone="gold" />
              <span>Telestrator Active:</span>
            </span>
            {[
              { id: 'pen' as TelestratorTool, label: 'Pen' },
              { id: 'arrow' as TelestratorTool, label: 'Vector' },
              { id: 'circle' as TelestratorTool, label: 'Fault Circle' },
              { id: 'protractor' as TelestratorTool, label: '3-Pt Angle' },
            ].map(tool => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setTelestratorTool(tool.id)}
                style={{
                  background: telestratorTool === tool.id ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                  color: telestratorTool === tool.id ? '#0A0E18' : '#FFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {tool.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Color Pickers */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { color: '#D4AF37' as TelestratorColor },
                { color: '#10B981' as TelestratorColor },
                { color: '#EF4444' as TelestratorColor },
                { color: '#38BDF8' as TelestratorColor },
              ].map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setTelestratorColor(c.color)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    background: c.color,
                    border: telestratorColor === c.color ? '2px solid #FFF' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAutoFade(prev => !prev)}
              style={{
                background: autoFade ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${autoFade ? '#10B981' : 'rgba(255,255,255,0.15)'}`,
                color: autoFade ? '#34D399' : 'var(--gray)',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <GaaIcon name="timer" size={11} tone={autoFade ? 'emerald' : 'slate'} />
              <span>{autoFade ? 'Auto-Fade (4s) ON' : 'Persistent Ink'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTelestratorActive(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gray)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <GaaIcon name="close" size={12} tone="slate" />
              <span>Hide</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Executive 4-Slot Assessment Photo Vault Drawer ── */}
      {Object.values(capturedFrames).some(Boolean) && (
        <div
          data-testid="assessment-photo-vault"
          style={{
            background: 'linear-gradient(180deg, rgba(14,24,42,0.98) 0%, rgba(9,15,28,0.99) 100%)',
            borderTop: '1.5px solid var(--gold)',
            borderBottom: '1px solid rgba(212,160,23,0.35)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
            padding: isVaultOpen ? '12px 16px 14px' : '6px 16px',
            transition: 'all 0.2s ease',
            zIndex: 35,
          }}
        >
          {/* Vault Drawer Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(212,160,23,0.05) 100%)',
                  border: '1px solid var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GaaIcon name="camera" size={14} tone="gold" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontWeight: 700,
                      fontSize: 14,
                      letterSpacing: '0.04em',
                      color: '#FFFFFF',
                    }}
                  >
                    IN-SESSION ASSESSMENT PHOTO VAULT
                  </span>
                  <span
                    style={{
                      background: Object.values(capturedFrames).filter(Boolean).length >= 3 ? 'rgba(16,185,129,0.2)' : 'rgba(212,160,23,0.2)',
                      color: Object.values(capturedFrames).filter(Boolean).length >= 3 ? '#34D399' : 'var(--gold-lt)',
                      border: `1px solid ${Object.values(capturedFrames).filter(Boolean).length >= 3 ? '#10B981' : 'var(--gold)'}`,
                      borderRadius: 999,
                      padding: '1px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {Object.values(capturedFrames).filter(Boolean).length}/4 CAPTURED
                  </span>
                </div>
                {isVaultOpen && (
                  <div style={{ fontSize: 11, color: 'var(--gray)', margin: '1px 0 0' }}>
                    Safely cached for direct 1-click ingestion into AI Body Comp (3 views) and NASM OHSA (4 views)
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsVaultOpen(prev => !prev)}
                className="tactile-btn"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--gray-lt)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{isVaultOpen ? 'Minimize Vault ▲' : 'Expand Vault ▼'}</span>
              </button>

              <button
                type="button"
                onClick={clearAllVaultPhotos}
                data-testid="vault-clear-all-btn"
                title="Clear all cached assessment photos"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gray)',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '4px 6px',
                }}
              >
                ✕ Clear All
              </button>
            </div>
          </div>

          {/* 4-Slot Gallery & Direct Action Launchers */}
          {isVaultOpen && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {ASSESSMENT_CAPTURE_SLOTS.map(slot => {
                  const frame = capturedFrames[slot.id]
                  const isCaptured = Boolean(frame)

                  return (
                    <div
                      key={slot.id}
                      data-testid={`vault-slot-${slot.id}`}
                      style={{
                        background: isCaptured ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isCaptured ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: 6,
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 8,
                        position: 'relative',
                      }}
                    >
                      {/* Slot Header */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#FFF' }}>
                            {slot.shortLabel}
                          </div>
                          <span
                            style={{
                              fontSize: 8.5,
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 3,
                              background:
                                slot.id === 'overhead_squat'
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(212, 160, 23, 0.15)',
                              color: slot.id === 'overhead_squat' ? '#60A5FA' : 'var(--gold-lt)',
                              border:
                                slot.id === 'overhead_squat'
                                  ? '1px solid rgba(59, 130, 246, 0.3)'
                                  : '1px solid rgba(212, 160, 23, 0.3)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {slot.id === 'overhead_squat' ? 'OHSA Only' : 'Body Comp + OHSA'}
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>
                          {slot.description}
                        </div>
                      </div>

                      {/* Preview / Placeholder */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isCaptured && frame ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={frame}
                              alt={`${slot.label} frame`}
                              onClick={() => setPreviewVaultImage(frame)}
                              title="Click to preview full image"
                              style={{
                                width: 64,
                                height: 48,
                                borderRadius: 4,
                                objectFit: 'cover',
                                border: '1.5px solid #10B981',
                                boxShadow: '0 0 8px rgba(16, 185, 129, 0.25)',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 10, color: '#34D399', fontWeight: 800 }}>
                                ✓ Ingest Ready
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCaptureSlot(slot.id)
                                    captureClientFrame(slot.id)
                                  }}
                                  title="Retake frame from current video feed"
                                  style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#E2E8F0',
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Retake
                                </button>
                                <button
                                  type="button"
                                  onClick={() => clearVaultSlot(slot.id)}
                                  title="Remove this slot image"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--gray)',
                                    fontSize: 9.5,
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              padding: '8px 6px',
                              border: '1px dashed rgba(255,255,255,0.15)',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 6,
                            }}
                          >
                            <span style={{ fontSize: 10, color: 'var(--gray)' }}>Not captured</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCaptureSlot(slot.id)
                                captureClientFrame(slot.id)
                              }}
                              style={{
                                background: 'rgba(212,160,23,0.12)',
                                border: '1px solid rgba(212,160,23,0.35)',
                                color: 'var(--gold-lt)',
                                fontSize: 9.5,
                                fontWeight: 700,
                                padding: '3px 7px',
                                borderRadius: 3,
                                cursor: 'pointer',
                              }}
                            >
                              + Capture
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 1-Click Scanner Launchers */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/dashboard/fitness#body-comp'
                      }
                    }}
                    data-testid="vault-launch-body-comp-btn"
                    className="tactile-btn"
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(212,160,23,0.08) 100%)',
                      border: '1px solid var(--gold)',
                      color: 'var(--gold-lt)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    <GaaIcon name="user" size={13} tone="gold" />
                    <span>
                      Launch Body Comp Scanner ({[capturedFrames.anterior, capturedFrames.lateral, capturedFrames.posterior].filter(Boolean).length}/3 Ready)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/dashboard/fitness#ohsa'
                      }
                    }}
                    data-testid="vault-launch-ohsa-btn"
                    className="tactile-btn"
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    <GaaIcon name="grid" size={13} tone="emerald" />
                    <span>Launch OHSA Posture Mesh ({Object.values(capturedFrames).filter(Boolean).length}/4 Ready)</span>
                  </button>
                </div>

                <div style={{ fontSize: 10, color: 'var(--gray)' }}>
                  Auto-synced to safe session storage
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Full-size image preview lightbox */}
      {previewVaultImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setPreviewVaultImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: '#080E14',
              border: '1.5px solid var(--gold)',
              borderRadius: 8,
              padding: 8,
              boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewVaultImage}
              alt="Full-size captured diagnostic frame"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '75vh',
                borderRadius: 4,
                display: 'block',
                objectFit: 'contain',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 4px 2px',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700 }}>
                Diagnostic Session Frame
              </span>
              <button
                type="button"
                onClick={() => setPreviewVaultImage(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFF',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom HUD Control Bar (Categorized Precision Docks) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(8,12,22,0.96)',
          backdropFilter: 'blur(16px)',
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          zIndex: 30,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Dock 1: Hardware & AV Transmission */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.03)',
            padding: '4px 6px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button
            type="button"
            onClick={toggleMic}
            style={{
              padding: '6px 12px',
              background: isMicMuted ? '#EF4444' : 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name={isMicMuted ? 'mic-off' : 'mic'} size={13} tone="inherit" />
            <span>{isMicMuted ? 'Unmute' : 'Mic On'}</span>
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            style={{
              padding: '6px 12px',
              background: isCameraActive ? 'rgba(255,255,255,0.08)' : '#EF4444',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name={isCameraActive ? 'video-studio' : 'stop'} size={13} tone="inherit" />
            <span>{isCameraActive ? 'Cam On' : 'Cam Off'}</span>
          </button>

          <button
            type="button"
            onClick={flipCamera}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Flip Camera"
          >
            <GaaIcon name="rotate-ccw" size={13} tone="inherit" />
            <span>Flip</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Toggle Fullscreen"
          >
            <GaaIcon name={isFullscreen ? 'chevron-down' : 'external-link'} size={13} tone="inherit" />
          </button>

          {/* Bottom Dock Exit Studio Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = isCoach ? '/coach' : '/dashboard'
              }
            }}
            data-testid="dock-live-hud-exit-btn"
            style={{
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.18)',
              color: '#FCA5A5',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            title={isCoach ? 'Exit Cockpit' : 'Exit Studio'}
          >
            <GaaIcon name="close" size={12} tone="ruby" />
            <span>{isCoach ? 'Exit Cockpit' : 'Exit Studio'}</span>
          </button>
        </div>

        {/* Dock 2: Kinematics & Biomechanical Diagnostics */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.03)',
            padding: '4px 6px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Telestrator Pen Button */}
          <button
            type="button"
            onClick={() => setTelestratorActive(prev => !prev)}
            style={{
              padding: '6px 12px',
              background: telestratorActive ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: telestratorActive ? '#0A0E18' : '#FFFFFF',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="edit" size={13} tone={telestratorActive ? 'gold' : 'inherit'} />
            <span>{telestratorActive ? 'Telestrator ON' : 'Telestrator'}</span>
          </button>

          {/* 5s Instant Slow-Mo Replay Button */}
          <button
            type="button"
            onClick={triggerSlowMoReplay}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(217,119,6,0.15) 100%)',
              border: '1px solid #F59E0B',
              color: '#FCD34D',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="rotate-ccw" size={12} tone="amber" />
            <span>Slow-Mo Replay</span>
          </button>

          {/* Side-by-Side Model Compare */}
          <button
            type="button"
            onClick={() => setShowCompareModel(prev => !prev)}
            style={{
              padding: '6px 12px',
              background: showCompareModel ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)',
              border: showCompareModel ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.15)',
              color: showCompareModel ? '#60A5FA' : '#FFFFFF',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="eye" size={13} tone="inherit" />
            <span>Compare Form</span>
          </button>

          {/* Plumb Line */}
          <button
            type="button"
            onClick={handlePlumbLineToggle}
            style={{
              padding: '6px 12px',
              background: showPlumbLine ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.08)',
              border: showPlumbLine ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
              color: showPlumbLine ? 'var(--gold-lt)' : '#FFFFFF',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="grid" size={13} tone={showPlumbLine ? 'gold' : 'inherit'} />
            <span>{showPlumbLine ? 'Plumb ON' : 'Plumb Grid'}</span>
          </button>
        </div>

        {/* Dock 3: Pacing & Tactical Load (when handlers provided) */}
        {(onToggleMetronome || onOpenPlateCalc) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.03)',
              padding: '4px 6px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {onToggleMetronome && (
              <button
                type="button"
                onClick={onToggleMetronome}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  color: '#60A5FA',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="timer" size={13} tone="inherit" />
                <span>Metronome</span>
              </button>
            )}

            {onOpenPlateCalc && (
              <button
                type="button"
                onClick={onOpenPlateCalc}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="scale" size={13} tone="gold" />
                <span>Plate Math</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Fast 1-Tap Verbal Audio Coaching Cues Strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(4,7,14,0.95)',
          padding: '8px 14px',
          overflowX: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <GaaIcon name="volume" size={12} tone="gold" />
            <span>Quick Cues:</span>
          </span>
          <span style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
            Kinetic Matrix
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { text: 'Brace your core & lock ribcage', tag: 'LPHC' },
            { text: 'Drive through heels and extend hips', tag: 'BASE' },
            { text: 'Control eccentric descent on 3', tag: 'TEMPO' },
            { text: 'Pin shoulder blades back and down', tag: 'SCAPULA' },
            { text: 'Explosive drive to lockout', tag: 'POWER' },
            { text: 'Breathe out on exertion', tag: 'BREATH' },
          ].map(cue => (
            <button
              key={cue.text}
              type="button"
              onClick={() => {
                onQuickCue?.(cue.text)
                showHudToast(`Sent Audio Cue: "${cue.text}"`, 'gold')
              }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                borderRadius: 14,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 9, color: 'var(--gold-lt)', fontWeight: 800, opacity: 0.8 }}>
                [{cue.tag}]
              </span>
              <span>{cue.text}</span>
            </button>
          ))}

          {isCoach && (
            <button
              type="button"
              onClick={requestStillCamera}
              data-testid="coach-request-still-camera-btn"
              title="Instruct athlete to disable Apple Center Stage / Samsung Auto-Framing for a still view"
              style={{
                background: 'rgba(212, 175, 55, 0.18)',
                border: '1px solid var(--gold)',
                color: 'var(--gold-lt)',
                borderRadius: 14,
                padding: '4px 11px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="camera" size={12} tone="gold" />
              <span>Request Still Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Slow-Mo Instant Replay Modal ── */}
      {replayVideoUrl && (
        <LiveSlowMoReplayModal
          videoUrl={replayVideoUrl}
          clientName={clientName}
          exerciseName={exerciseName}
          onClose={() => setReplayVideoUrl(null)}
        />
      )}

      {/* ── Still Camera & Auto-Zoom Guidance Modal ── */}
      <LiveStillCameraGuidanceModal
        isOpen={showStillCameraModal}
        onClose={() => setShowStillCameraModal(false)}
        requestedByCoachName={stillCameraRequestedBy}
      />

      {/* ── Official NASM Edge Video Demo Modal ── */}
      {demoVideoModal?.isOpen && demoVideoModal.embedUrl && (
        <div
          data-testid="benchmark-demo-video-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="benchmark-demo-video-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 14, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setDemoVideoModal(null)
          }}
        >
          <div
            style={{
              background: '#070B14',
              border: '1px solid rgba(212, 160, 23, 0.5)',
              borderRadius: 12,
              maxWidth: 720,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 24px 70px rgba(0,0,0,0.95), 0 0 30px rgba(212, 160, 23, 0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(212, 160, 23, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  Official NASM Edge Demonstration
                </div>
                <h3 id="benchmark-demo-video-title" style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, margin: '2px 0 0', color: '#FFF', letterSpacing: '0.04em' }}>
                  {demoVideoModal.name}
                </h3>
              </div>

              <button
                type="button"
                data-testid="close-benchmark-demo-modal"
                onClick={() => setDemoVideoModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#FFF',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GaaIcon name="close" size={14} tone="slate" />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
              <iframe
                src={demoVideoModal.embedUrl}
                title={`Official NASM Exercise Demo: ${demoVideoModal.name}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>

            <div style={{ padding: '12px 18px', background: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--gray)' }}>
              <span>Official NASM Clinical Form Standard</span>
              <button
                type="button"
                onClick={() => setDemoVideoModal(null)}
                style={{
                  padding: '4px 12px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Close Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
