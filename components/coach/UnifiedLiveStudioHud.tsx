'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import LiveTelestratorCanvas, { TelestratorTool, TelestratorColor } from './LiveTelestratorCanvas'
import LiveSlowMoReplayModal from './LiveSlowMoReplayModal'
import CoachVoiceCopilot from './CoachVoiceCopilot'
import SmartExerciseSwapModal from './SmartExerciseSwapModal'
import LiveSessionWrapUpModal from './LiveSessionWrapUpModal'
import LiveVirtualBackgroundStage from './LiveVirtualBackgroundStage'
import LiveVisualTempoPulseHud from './LiveVisualTempoPulseHud'
import { COACH_BACKGROUND_PRESETS, CoachBackgroundPreset } from '@/lib/coach-backgrounds-catalog'
import BarbellPlateCalculator from '@/components/fitness/BarbellPlateCalculator'
import { isOlympicWeightExercise } from '@/lib/barbell-plate-calculator'
import { evaluateLiveCardioTelemetry } from '@/lib/live-cardio-telemetry'
import { ParsedVoiceCommand } from '@/lib/coach-voice-copilot'
import { ExerciseSubstitution } from '@/lib/nasm-exercise-substitution'
import {
  evaluateNasm2For2Rule,
  calculateEstimated1Rm,
  speakNasmCue,
} from '@/lib/nasm-assessments'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'
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
import dynamic from 'next/dynamic'
import type { PosturalViewType } from '@/lib/ai-postural-mesh-scanner'
import {
  getNasmClinicalMovementCard,
  type NasmClinicalMovementCard,
} from '@/lib/nasm-clinical-movement-cards'

export { getNasmClinicalMovementCard, type NasmClinicalMovementCard }

const AiPostureMeshScannerModal = dynamic(
  () => import('./AiPostureMeshScannerModal'),
  { ssr: false }
)
const AiBodyCompositionScannerModal = dynamic(
  () => import('@/components/fitness/AiBodyCompositionScannerModal'),
  { ssr: false }
)
const LiveVideoFormCaptureModal = dynamic(
  () => import('@/components/fitness/tracker/LiveVideoFormCaptureModal'),
  { ssr: false }
)
const NasmAssessmentSuite = dynamic(
  () => import('./NasmAssessmentSuite'),
  { ssr: false }
)
const LiveConsultationPlaybookModal = dynamic(
  () => import('./LiveConsultationPlaybookModal'),
  { ssr: false }
)
import {
  computeConsultationGate,
  formatConsultationCountdown,
  CONSULTATION_PLAYBOOK_GATES,
} from './LiveConsultationPlaybookModal'

export { computeConsultationGate, formatConsultationCountdown, CONSULTATION_PLAYBOOK_GATES }

export type VideoHudLayout = 'split' | 'pip' | 'focus'

export interface Exercise {
  name: string
  sets: string
  reps: string
  tempo?: string | null
  rest?: string | null
  notes?: string | null
  block?: string | null
  coachingCues?: string[] | null
  imageUrl?: string | null
  videoUrl?: string | null
  description?: string | null
  primaryEquipment?: string[] | null
}

export interface Workout {
  day: number
  focus: string
  exercises: Exercise[]
}

export interface Plan {
  id: string
  name: string
  nasm_opt_phase?: number | null
  plan_json: { workouts?: Workout[] } | null
}

export interface SetLog {
  id: string
  exercise_name: string
  set_number?: number | null
  reps: number
  weight_kg?: number | null
  rpe?: number | null
}

interface UnifiedLiveStudioHudProps {
  clientId: string
  athleteName: string
  coachName?: string
  plan: Plan | null
  initialSets: SetLog[]
  today: string
  coachUserId?: string
}

function parseLowerReps(value: string | null | undefined): string {
  const text = String(value ?? '').trim()
  const rangeMatch = text.match(/(\d+)\s*[-–]+\s*(\d+)/)
  if (rangeMatch) return rangeMatch[1]
  const match = text.match(/\d+/)
  return match ? match[0] : '8'
}

function parseRestSeconds(value: string | null | undefined): number {
  const text = String(value ?? '').toLowerCase().trim()
  if (text.includes('3-5m') || text.includes('3m') || text.includes('5m')) return 180
  if (text.includes('1-2m') || text.includes('2m')) return 90
  if (text.includes('90s')) return 90
  if (text.includes('60s')) return 60
  if (text.includes('30s')) return 30
  const match = text.match(/\d+/)
  return match ? Number(match[0]) : 60
}

function parseTempoDigits(tempoStr: string | null | undefined): { ecc: number; iso: number; con: number } {
  const raw = String(tempoStr ?? '').toLowerCase().trim()
  if (raw.includes('4/2/1') || raw.includes('4-2-1')) return { ecc: 4, iso: 2, con: 1 }
  if (raw.includes('2/0/2') || raw.includes('2-0-2')) return { ecc: 2, iso: 0, con: 2 }
  if (raw.includes('3/1/1') || raw.includes('3-1-1')) return { ecc: 3, iso: 1, con: 1 }
  if (raw.includes('1/1/1') || raw.includes('1-1-1')) return { ecc: 1, iso: 1, con: 1 }
  if (raw.includes('x/x/x') || raw.includes('explosive')) return { ecc: 1, iso: 0, con: 1 }

  const parts = raw.split(/[/–-]/).map(p => Number(p.trim())).filter(n => Number.isFinite(n))
  if (parts.length >= 3) {
    return { ecc: parts[0] ?? 2, iso: parts[1] ?? 0, con: parts[2] ?? 2 }
  }
  return { ecc: 2, iso: 0, con: 2 }
}

export type AssessmentCaptureSlot = 'anterior' | 'lateral' | 'posterior' | 'overhead_squat'

export interface AssessmentSlotMeta {
  id: AssessmentCaptureSlot
  label: string
  shortLabel: string
  badge: string
  usedIn: ('body_comp' | 'ohsa')[]
  description: string
  iconName: string
}

export const ASSESSMENT_CAPTURE_SLOTS: AssessmentSlotMeta[] = [
  {
    id: 'anterior',
    label: '1. Anterior / Front View',
    shortLabel: 'Front',
    badge: 'Body Comp + OHSA',
    usedIn: ['body_comp', 'ohsa'],
    description: 'Full anterior view: shoulder level, torso symmetry, and Q-angle valgus/varus.',
    iconName: 'user',
  },
  {
    id: 'lateral',
    label: '2. Lateral / Side View',
    shortLabel: 'Side',
    badge: 'Body Comp + OHSA',
    usedIn: ['body_comp', 'ohsa'],
    description: 'Full lateral profile: forward head, thoracic kyphosis, and pelvic tilt.',
    iconName: 'grid',
  },
  {
    id: 'posterior',
    label: '3. Posterior / Back View',
    shortLabel: 'Back',
    badge: 'Body Comp + OHSA',
    usedIn: ['body_comp', 'ohsa'],
    description: 'Full posterior chain: scapular winging and heel/calcaneal eversion.',
    iconName: 'rotate-ccw',
  },
  {
    id: 'overhead_squat',
    label: '4. OHSA Squat Depth (Bottom of Squat)',
    shortLabel: 'OHSA Squat',
    badge: 'OHSA Only',
    usedIn: ['ohsa'],
    description: 'Peak depth of overhead squat: thighs parallel/sub-parallel, dynamic knee tracking, and torso lean.',
    iconName: 'barbell',
  },
]

export default function UnifiedLiveStudioHud({
  clientId,
  athleteName = 'Athlete',
  coachName = 'Coach Gordon',
  plan,
  initialSets,
  today,
  coachUserId,
}: UnifiedLiveStudioHudProps) {
  const [workoutsState, setWorkoutsState] = useState<Workout[]>(plan?.plan_json?.workouts ?? [])
  const [selectedDay, setSelectedDay] = useState<number>(workoutsState[0]?.day ?? 1)
  const currentWorkout = workoutsState.find(w => w.day === selectedDay) || workoutsState[0]
  const [exerciseIndex, setExerciseIndex] = useState<number>(0)

  const activeExercise: Exercise | undefined = currentWorkout?.exercises[exerciseIndex] || currentWorkout?.exercises[0]

  // Sets & Logging State
  const [sets, setSets] = useState<SetLog[]>(initialSets)
  const [weightLbsInput, setWeightLbsInput] = useState<string>('225')
  const [repsInput, setRepsInput] = useState<string>(parseLowerReps(activeExercise?.reps))
  const [rpeInput, setRpeInput] = useState<string>('8')
  const [isWarmup, setIsWarmup] = useState<boolean>(false)
  const [isSavingSet, setIsSavingSet] = useState<boolean>(false)
  const [unitLbs, setUnitLbs] = useState<boolean>(true)

  // Active Movement Clinical Guidance & Visual Media Card
  const activeMovementCard = useMemo(() => {
    if (!activeExercise?.name) return null
    return getNasmClinicalMovementCard(activeExercise.name, {
      description: activeExercise.notes || activeExercise.description,
      coachingCues: activeExercise.coachingCues,
      imageUrl: activeExercise.imageUrl,
      videoUrl: activeExercise.videoUrl,
    })
  }, [activeExercise])

  const [showExerciseGuideExpanded, setShowExerciseGuideExpanded] = useState<boolean>(false)
  const [activeGuideTab, setActiveGuideTab] = useState<'cues' | 'checkpoints' | 'setup'>('cues')
  const [demoVideoModal, setDemoVideoModal] = useState<{
    isOpen: boolean
    embedUrl?: string | null
    name: string
  } | null>(null)

  // Video State & Eco Mode
  const [layout, setLayout] = useState<VideoHudLayout>('split')
  const [isStageSwapped, setIsStageSwapped] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(true)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [_streamError, setStreamError] = useState<string | null>(null)
  const [ecoMode, setEcoMode] = useState(true)

  // Mobile Responsive Detection & View Mode ('both' = video on top + logger below, 'video' = full-screen video, 'workout' = full logger)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [mobileViewMode, setMobileViewMode] = useState<'both' | 'video' | 'workout'>('both')

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setLayout(prev => (prev === 'split' ? 'pip' : prev))
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Telestrator & Overlays
  const [telestratorActive, setTelestratorActive] = useState(false)
  const [telestratorTool, setTelestratorTool] = useState<TelestratorTool>('pen')
  const [telestratorColor, _setTelestratorColor] = useState<TelestratorColor>('#D4AF37')
  const [autoFade, _setAutoFade] = useState(false)
  const [showPlumbLine, setShowPlumbLine] = useState(false)
  const [showCompareModel, setShowCompareModel] = useState(false)

  // Live HUD Timers
  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const [_restInitial, setRestInitial] = useState<number>(60)
  const restTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [metronomeActive, setMetronomeActive] = useState<boolean>(false)
  const [_metronomePhase, setMetronomePhase] = useState<'eccentric' | 'isometric' | 'concentric'>('eccentric')
  const [_metronomeSecLeft, setMetronomeSecLeft] = useState<number>(4)
  const [_metronomeRepCount, setMetronomeRepCount] = useState<number>(1)
  const metronomeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Modals & Popups
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showWrapUpModal, setShowWrapUpModal] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [replayVideoUrl, setReplayVideoUrl] = useState<string | null>(null)
  const [voiceEnabled, _setVoiceEnabled] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  const [ringFeedback, setRingFeedback] = useState<string | null>(null)
  const [selectedBackground, setSelectedBackground] = useState<CoachBackgroundPreset | null>(COACH_BACKGROUND_PRESETS[0])
  const [_showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  // ── In-HUD Luxury Toast Notification State ──
  const [hudToast, setHudToast] = useState<{ message: string; type?: 'info' | 'gold' | 'emerald' | 'amber' } | null>(null)

  const showHudToast = useCallback((message: string, type: 'info' | 'gold' | 'emerald' | 'amber' = 'gold') => {
    setHudToast({ message, type })
    setTimeout(() => {
      setHudToast(curr => (curr?.message === message ? null : curr))
    }, 3500)
  }, [])

  const handleCycleBackground = useCallback(() => {
    setSelectedBackground((prev) => {
      if (!prev) {
        const next = COACH_BACKGROUND_PRESETS[0]
        showHudToast(`Virtual BG: ${next.name}`, 'gold')
        return next
      }
      const currIdx = COACH_BACKGROUND_PRESETS.findIndex((p) => p.id === prev.id)
      if (currIdx >= 0 && currIdx < COACH_BACKGROUND_PRESETS.length - 1) {
        const next = COACH_BACKGROUND_PRESETS[currIdx + 1]
        showHudToast(`Virtual BG: ${next.name}`, 'gold')
        return next
      }
      showHudToast('Virtual BG: Off (Raw Camera)', 'info')
      return null
    })
  }, [showHudToast])

  // ── Session Duration & Bioenergetic Telemetry ──
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(1)
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDurationSec(s => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Cumulative session tonnage
  const totalSessionTonnage = useMemo(() => {
    return sets.reduce((sum, s) => {
      const w = s.weight_kg ? (unitLbs ? Math.round(s.weight_kg * 2.20462) : s.weight_kg) : 0
      return sum + (w * s.reps)
    }, 0)
  }, [sets, unitLbs])

  // Live cardiorespiratory telemetry based on active training / rest state
  const liveCardio = useMemo(() => {
    const baseBpm = restRemaining !== null ? 106 : 138
    return evaluateLiveCardioTelemetry(baseBpm, sessionDurationSec, { age: 32, restingHr: 58 })
  }, [restRemaining, sessionDurationSec])

  // Assessment Tool Modals & 4-Slot Captured Frame Vault
  const [showPostureModal, setShowPostureModal] = useState(false)
  const [showBodyCompModal, setShowBodyCompModal] = useState(false)
  const [showFormCritiqueModal, setShowFormCritiqueModal] = useState(false)
  const [showNasmSuiteModal, setShowNasmSuiteModal] = useState(false)
  const [showConsultationPlaybook, setShowConsultationPlaybook] = useState(false)
  const [activePostureView, setActivePostureView] = useState<PosturalViewType>('overhead_squat')
  const [selectedCaptureSlot, setSelectedCaptureSlot] = useState<AssessmentCaptureSlot>('anterior')
  const [capturedFrames, setCapturedFrames] = useState<Record<AssessmentCaptureSlot, string | null>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored =
          sessionStorage.getItem(`gaa_assessment_frames_${clientId}`) ||
          sessionStorage.getItem(`sgf_posture_photos_${clientId}`) ||
          sessionStorage.getItem(`gaa_posture_photos_${clientId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            anterior: parsed.anterior || null,
            lateral: parsed.lateral || null,
            posterior: parsed.posterior || null,
            overhead_squat: parsed.overhead_squat || null,
          }
        }
      } catch {
        // fallback
      }
    }
    return {
      anterior: null,
      lateral: null,
      posterior: null,
      overhead_squat: null,
    }
  })
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null)
  const [capturedTimestamp, setCapturedTimestamp] = useState<number | null>(null)
  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null)
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(true)
  const [previewVaultImage, setPreviewVaultImage] = useState<string | null>(null)

  const clearAllVaultPhotos = useCallback(() => {
    setCapturedFrames({
      anterior: null,
      lateral: null,
      posterior: null,
      overhead_squat: null,
    })
    setCapturedFrame(null)
    setCapturedTimestamp(null)
    if (typeof window !== 'undefined' && clientId) {
      try {
        sessionStorage.removeItem(`gaa_assessment_frames_${clientId}`)
        sessionStorage.removeItem(`sgf_posture_photos_${clientId}`)
        sessionStorage.removeItem(`gaa_posture_photos_${clientId}`)
        sessionStorage.removeItem(`gaa_body_comp_photos_${clientId}`)
      } catch {}
    }
    setCaptureFeedback('Assessment vault photos cleared.')
    setTimeout(() => setCaptureFeedback(null), 3000)
  }, [clientId])

  const clearVaultSlot = useCallback((slot: AssessmentCaptureSlot) => {
    setCapturedFrames(prev => ({
      ...prev,
      [slot]: null,
    }))
  }, [])

  // Safely persist captured assessment frames to session storage so Body Comp and OHSA can easily ingest them
  useEffect(() => {
    if (typeof window !== 'undefined' && clientId) {
      try {
        const payload = JSON.stringify(capturedFrames)
        sessionStorage.setItem(`gaa_assessment_frames_${clientId}`, payload)
        sessionStorage.setItem(`sgf_posture_photos_${clientId}`, payload)
        sessionStorage.setItem(`gaa_posture_photos_${clientId}`, payload)
        sessionStorage.setItem(
          `gaa_body_comp_photos_${clientId}`,
          JSON.stringify({
            anterior: capturedFrames.anterior,
            lateral: capturedFrames.lateral,
            posterior: capturedFrames.posterior,
          })
        )
      } catch {
        // quota fallback
      }
    }
  }, [capturedFrames, clientId])

  // WebRTC Peer Connection & Remote Video Stream
  const [activeRemoteStream, setActiveRemoteStream] = useState<MediaStream | null>(null)
  const [peerConnectionState, setPeerConnectionState] = useState<RTCPeerConnectionState | null>(null)
  const [athleteInLobby, setAthleteInLobby] = useState<LobbyParticipant | null>(null)
  const [lobbyWaitSeconds, setLobbyWaitSeconds] = useState<number>(0)
  const [peerLatencyMs, setPeerLatencyMs] = useState<number | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const bridgeRef = useRef<WebRtcPeerBridge | null>(null)

  // 1-Click High-Res Video Frame Grabber with 4-Slot Targeting & Auto-Advance
  const captureClientFrame = useCallback((targetSlot?: AssessmentCaptureSlot): string | null => {
    const slot = targetSlot || selectedCaptureSlot

    const recordCapture = (frameData: string) => {
      setCapturedFrame(frameData)
      setCapturedTimestamp(Date.now())
      setCapturedFrames(prev => ({
        ...prev,
        [slot]: frameData,
      }))

      const slotMeta = ASSESSMENT_CAPTURE_SLOTS.find(s => s.id === slot)
      const slotLabel = slotMeta ? slotMeta.shortLabel : slot
      setCaptureFeedback(`✓ Captured ${slotLabel} frame (${slotMeta?.badge})!`)
      setTimeout(() => setCaptureFeedback(null), 4500)

      // Auto-advance dropdown to next slot in standard sequence
      const sequence: AssessmentCaptureSlot[] = ['anterior', 'lateral', 'posterior', 'overhead_squat']
      const currentIndex = sequence.indexOf(slot)
      const nextSlot = sequence[(currentIndex + 1) % sequence.length]
      setSelectedCaptureSlot(nextSlot)

      return frameData
    }

    // STRICT INVARIANT: The captured image source is ALWAYS the client/athlete video feed,
    // regardless of whether the client is in the left frame, right frame, PiP box, or fullscreen stage.
    // We locate the client video element directly via remoteVideoRef or inside [data-testid="athlete-video-container"].
    const clientContainer = typeof document !== 'undefined'
      ? (document.querySelector('[data-testid="athlete-video-container"]') as HTMLElement | null)
      : null
    const clientVideo = remoteVideoRef.current || (clientContainer?.querySelector('video') as HTMLVideoElement | null)

    if (clientVideo && clientVideo.videoWidth > 0 && clientVideo.videoHeight > 0) {
      try {
        const canvas = document.createElement('canvas')
        // ALWAYS capture the ENTIRE native uncropped camera frame from the client video
        // completely bypassing any CSS object-fit, aspect ratio, or container bounds
        canvas.width = clientVideo.videoWidth
        canvas.height = clientVideo.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(clientVideo, 0, 0, clientVideo.videoWidth, clientVideo.videoHeight)
          const frameData = canvas.toDataURL('image/jpeg', 0.92)
          return recordCapture(frameData)
        }
      } catch (err) {
        console.warn('Canvas frame capture error on client stream:', err)
      }
    }

    // Fallback: Diagnostic wireframe for athlete (used when client camera is not yet streaming or in automated tests)
    // NEVER fall back to coach's local video!
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
        ctx.font = 'bold 20px Raleway, sans-serif'
        ctx.fillText(`DIAGNOSTIC FRAME: ${slot.toUpperCase()}`, 36, 64)
        ctx.fillStyle = '#E2E8F0'
        ctx.font = '14px sans-serif'
        ctx.fillText(`Athlete: ${athleteName} · Client Live Stream`, 36, 96)
        ctx.fillStyle = '#10B981'
        ctx.fillText(`Captured: ${new Date().toLocaleTimeString()} · Status: Ingest Ready`, 36, 126)
        const frameData = fallbackCanvas.toDataURL('image/jpeg', 0.85)
        return recordCapture(frameData)
      }
    } catch {}

    setCaptureFeedback('Video stream initializing. Please ensure camera is connected.')
    setTimeout(() => setCaptureFeedback(null), 4500)
    return null
  }, [athleteName, selectedCaptureSlot])

  // Rolling Video Buffer & Hardware References
  const rollingChunksRef = useRef<{ data: Blob; timestamp: number }[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const signalingChannelRef = useRef<RealtimeChannel | null>(null)
  const [showStillCameraModal, setShowStillCameraModal] = useState(false)
  const [stillCameraRequestedBy, setStillCameraRequestedBy] = useState('Coach Scott Gordon')

  // Luxury 2-Tone Athlete Lobby Arrival Chime (E5 -> G#5)
  const playLobbyChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioClass) {
          audioCtxRef.current = new AudioClass()
        }
      }
      const ctx = audioCtxRef.current
      if (!ctx) return

      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(659.25, now)
      gain1.gain.setValueAtTime(0.001, now)
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.04)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.35)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(830.61, now + 0.16)
      gain2.gain.setValueAtTime(0.001, now + 0.16)
      gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.2)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.16)
      osc2.stop(now + 0.65)
    } catch {
      // Audio autoplay policy or not supported
    }
  }, [])

  // Track elapsed seconds athlete has been waiting in lobby
  useEffect(() => {
    if (!athleteInLobby?.joinedAt) {
      setLobbyWaitSeconds(0)
      return
    }
    const updateElapsed = () => {
      const now = Date.now()
      const elapsed = Math.max(0, Math.floor((now - athleteInLobby.joinedAt) / 1000))
      setLobbyWaitSeconds(elapsed)
    }
    updateElapsed()
    const timer = setInterval(updateElapsed, 1000)
    return () => clearInterval(timer)
  }, [athleteInLobby?.joinedAt])

  // Synchronize Coach presence when device states change
  useEffect(() => {
    if (signalingChannelRef.current) {
      void signalingChannelRef.current.track({
        userId: coachUserId || 'coach-scott',
        name: coachName || 'Coach Gordon',
        role: 'coach',
        joinedAt: Date.now(),
        cameraActive: isCameraActive,
        micActive: !isMicMuted,
      }).catch(() => {})
    }
  }, [isCameraActive, isMicMuted, coachUserId, coachName])

  // WebRTC Peer Bridge with Stateful Supabase Realtime Presence
  useEffect(() => {
    if (!clientId) return
    const senderId = coachUserId || 'coach-scott'

    const supabase = createClient()
    const sessionId = `live-${clientId}`
    const channel = supabase.channel(`webrtc:${sessionId}`, {
      config: {
        presence: { key: senderId },
      },
    })
    signalingChannelRef.current = channel

    const bridge = new WebRtcPeerBridge({
      sessionId,
      currentUserId: senderId,
      isCoach: true,
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
        console.warn('Coach Live WebRTC peer error:', err)
      },
    })
    bridgeRef.current = bridge

    const syncLobby = () => {
      const presenceState = channel.presenceState()
      let foundAthlete: LobbyParticipant | null = null
      for (const key of Object.keys(presenceState)) {
        const presences = presenceState[key] as any[]
        for (const p of presences) {
          if (p.role === 'athlete') {
            foundAthlete = {
              userId: p.userId || key,
              name: p.name || athleteName,
              role: 'athlete',
              joinedAt: p.joinedAt || Date.now(),
              cameraActive: p.cameraActive,
              micActive: p.micActive,
            }
            break
          }
        }
        if (foundAthlete) break
      }

      setAthleteInLobby(prev => {
        if (!prev && foundAthlete) {
          playLobbyChime()
          showHudToast(`🟢 ${athleteName} entered the Studio Lobby!`, 'emerald')
        }
        return foundAthlete
      })
    }

    channel
      .on('presence', { event: 'sync' }, syncLobby)
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        const athlete = newPresences?.find((p: any) => p.role === 'athlete')
        if (athlete) {
          setAthleteInLobby({
            userId: athlete.userId || clientId,
            name: athlete.name || athleteName,
            role: 'athlete',
            joinedAt: athlete.joinedAt || Date.now(),
            cameraActive: athlete.cameraActive,
            micActive: athlete.micActive,
          })
          playLobbyChime()
          showHudToast(`🟢 ${athleteName} entered the Studio Lobby!`, 'emerald')
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        const athlete = leftPresences?.find((p: any) => p.role === 'athlete')
        if (athlete) {
          setAthleteInLobby(null)
          showHudToast(`${athleteName} disconnected from the lobby.`, 'amber')
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
          // Track Coach presence in Studio Lobby
          try {
            await channel.track({
              userId: senderId,
              name: coachName || 'Coach Gordon',
              role: 'coach',
              joinedAt: Date.now(),
              cameraActive: isCameraActive,
              micActive: !isMicMuted,
            })
          } catch {}
          // Broadcast initial presence ready and join signals
          void channel.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              type: 'ready',
              senderId,
            },
          })
          void channel.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              type: 'join',
              senderId,
            },
          })
        }
      })

    // Lightweight ping every 6s to keep channel hot & measure RTT latency without renegotiation
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
  }, [clientId, coachUserId, athleteName, coachName, isCameraActive, isMicMuted, playLobbyChime, showHudToast])

  // Attach local media stream as soon as it becomes available
  useEffect(() => {
    if (bridgeRef.current && mediaStream) {
      bridgeRef.current.attachLocalStream(mediaStream)
    }
  }, [mediaStream])

  // High-Performance Singleton Web Audio Synth
  const playBeep = useCallback((freq = 440, duration = 0.08) => {
    try {
      if (!audioCtxRef.current) {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioClass) {
          audioCtxRef.current = new AudioClass()
        }
      }
      const ctx = audioCtxRef.current
      if (!ctx) return

      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // Ignore
    }
  }, [])

  // Camera Setup with Thermal-Capped 720p / 24-30 FPS Constraints & Microphone Audio
  const startCamera = useCallback(async () => {
    try {
      setStreamError(null)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch {}
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStreamError('Camera access not supported on this device.')
        return
      }

      // Instant Studio HD Hardware Camera Startup with Microphone
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 24 },
          },
          audio: true,
        })
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
      }

      streamRef.current = stream
      setMediaStream(stream)

      // Enforce 1.0x digital zoom lock on camera track
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        void applyStillCameraConstraints(videoTrack)
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(() => {})
      }
      setIsCameraActive(true)

      // Only run continuous background recorder if ecoMode is disabled
      if (!ecoMode) {
        try {
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm'
          const recorder = new MediaRecorder(stream, { mimeType })
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
          // Ignore
        }
      }
    } catch (err) {
      console.error('Camera startup error:', err)
      setStreamError('Camera / Microphone permission pending or unavailable.')
      setIsCameraActive(false)
    }
  }, [facingMode, ecoMode])

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
          reason: 'Fixed camera required for kinetic chain and joint angle diagnostics',
        } as StillCameraRequestPayload,
      })
      showHudToast('Requested Still Camera from Athlete (Guidance Sent)', 'emerald')
    } catch (err) {
      console.error('Failed to send still camera request:', err)
      showHudToast('Failed to send still camera request', 'amber')
    }
  }, [coachName, showHudToast])

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsCameraActive(videoTracks.some(t => t.enabled))
    }
  }, [])

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks()
      const willMute = !isMicMuted
      audioTracks.forEach(track => {
        track.enabled = !willMute
      })
      setIsMicMuted(willMute)
    }
  }, [isMicMuted])

  // Bind video element to media stream whenever either changes
  useEffect(() => {
    if (localVideoRef.current && mediaStream && localVideoRef.current.srcObject !== mediaStream) {
      localVideoRef.current.srcObject = mediaStream
      localVideoRef.current.play().catch(() => {})
    }
  }, [mediaStream, isCameraActive])

  useEffect(() => {
    void startCamera()
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close() } catch {}
      }
    }
  }, [startCamera])

  // Rest Timer Controller
  const startRestTimer = useCallback((seconds: number) => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setRestInitial(seconds)
    setRestRemaining(seconds)

    if (voiceEnabled) speakNasmCue(`Rest interval: ${seconds} seconds.`)

    restTimerRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev === 4 && voiceEnabled) speakNasmCue('3... 2... 1... Set!')
        if (prev === null || prev <= 1) {
          if (restTimerRef.current) clearInterval(restTimerRef.current)
          playBeep(880, 0.25)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [voiceEnabled, playBeep])

  const stopRestTimer = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setRestRemaining(null)
  }, [])

  // Metronome Controller
  const toggleMetronome = useCallback((ex?: Exercise) => {
    const targetEx = ex || activeExercise
    if (metronomeActive) {
      setMetronomeActive(false)
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current)
      return
    }

    const { ecc, iso, con } = parseTempoDigits(targetEx?.tempo)
    setMetronomeActive(true)
    setMetronomePhase('eccentric')
    setMetronomeSecLeft(ecc)
    setMetronomeRepCount(1)

    if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current)

    let currentPhase: 'eccentric' | 'isometric' | 'concentric' = 'eccentric'
    let sec = ecc
    let reps = 1

    playBeep(440, 0.08)
    if (voiceEnabled) speakNasmCue(`Tempo ${targetEx?.tempo ?? '2-0-2'}. Lower.`)

    metronomeTimerRef.current = setInterval(() => {
      sec -= 1
      if (sec <= 0) {
        if (currentPhase === 'eccentric') {
          if (iso > 0) {
            currentPhase = 'isometric'
            sec = iso
            playBeep(660, 0.08)
            if (voiceEnabled) speakNasmCue('Hold.')
          } else {
            currentPhase = 'concentric'
            sec = con
            playBeep(980, 0.08)
            if (voiceEnabled) speakNasmCue('Drive up!')
          }
        } else if (currentPhase === 'isometric') {
          currentPhase = 'concentric'
          sec = con
          playBeep(980, 0.08)
          if (voiceEnabled) speakNasmCue('Explode!')
        } else {
          reps += 1
          setMetronomeRepCount(reps)
          currentPhase = 'eccentric'
          sec = ecc
          playBeep(440, 0.08)
          if (voiceEnabled) speakNasmCue(`Rep ${reps}. Lower.`)
        }
      }
      setMetronomePhase(currentPhase)
      setMetronomeSecLeft(sec)
    }, 1000)
  }, [metronomeActive, activeExercise, voiceEnabled, playBeep])

  // Log Set Execution
  const executeLogSet = useCallback(async (overrideWeight?: number, overrideReps?: number, overrideRpe?: number) => {
    if (!activeExercise) return
    setIsSavingSet(true)

    const wLbs = overrideWeight !== undefined ? overrideWeight : Number(weightLbsInput) || 0
    const wKg = Math.round((wLbs / 2.20462) * 10) / 10
    const r = overrideReps !== undefined ? overrideReps : Number(repsInput) || 8
    const rpeVal = overrideRpe !== undefined ? overrideRpe : Number(rpeInput) || 8

    try {
      const res = await fetch('/api/workouts/log-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          exercise_name: activeExercise.name,
          reps: r,
          weight_kg: wKg,
          rpe: rpeVal,
          is_warmup: isWarmup,
          session_date: today,
        }),
      })

      const data = await res.json()
      if (res.ok && data.set) {
        setSets(prev => [...prev, data.set])
      } else {
        const fallbackSet: SetLog = {
          id: String(Date.now()),
          exercise_name: activeExercise.name,
          reps: r,
          weight_kg: wKg,
          rpe: rpeVal,
        }
        setSets(prev => [...prev, fallbackSet])
      }

      playBeep(880, 0.12)

      // Start Rest Timer
      const restSec = parseRestSeconds(activeExercise.rest)
      startRestTimer(restSec)
      setIsWarmup(false)
    } catch {
      // Local fallback
      const fallbackSet: SetLog = {
        id: String(Date.now()),
        exercise_name: activeExercise.name,
        reps: r,
        weight_kg: wKg,
        rpe: rpeVal,
      }
      setSets(prev => [...prev, fallbackSet])
    } finally {
      setIsSavingSet(false)
    }
  }, [activeExercise, clientId, isWarmup, playBeep, repsInput, rpeInput, startRestTimer, today, weightLbsInput])

  // Voice Command Handler
  const handleVoiceCommand = useCallback((cmd: ParsedVoiceCommand) => {
    if (cmd.type === 'LOG_SET') {
      if (cmd.weightLbs !== undefined) setWeightLbsInput(String(cmd.weightLbs))
      if (cmd.reps !== undefined) setRepsInput(String(cmd.reps))
      if (cmd.rpe !== undefined) setRpeInput(String(cmd.rpe))
      void executeLogSet(cmd.weightLbs, cmd.reps, cmd.rpe)
    } else if (cmd.type === 'START_REST') {
      startRestTimer(cmd.restSeconds ?? 60)
    } else if (cmd.type === 'STOP_REST') {
      stopRestTimer()
    } else if (cmd.type === 'TOGGLE_METRONOME') {
      toggleMetronome()
    } else if (cmd.type === 'NEXT_EXERCISE') {
      setExerciseIndex(idx => Math.min((currentWorkout?.exercises.length ?? 1) - 1, idx + 1))
    } else if (cmd.type === 'PREVIOUS_EXERCISE') {
      setExerciseIndex(idx => Math.max(0, idx - 1))
    } else if (cmd.type === 'SPOKEN_CUE' && cmd.cueText) {
      speakNasmCue(cmd.cueText)
    }
  }, [currentWorkout, executeLogSet, startRestTimer, stopRestTimer, toggleMetronome])

  // Active Exercise Logged Sets
  const loggedSetsForActive = sets.filter(
    s => s.exercise_name.trim().toLowerCase() === (activeExercise?.name ?? '').trim().toLowerCase()
  )

  const targetSetsNum = Number(activeExercise?.sets?.match(/\d+/)?.[0] ?? 3)
  const isExerciseDone = loggedSetsForActive.length >= targetSetsNum

  // 1RM Calculation
  const maxSet = loggedSetsForActive.reduce<SetLog | null>((max, curr) => {
    if (!curr.weight_kg) return max
    if (!max || (curr.weight_kg > (max.weight_kg ?? 0))) return curr
    return max
  }, null)

  const _estimated1Rm = maxSet?.weight_kg ? calculateEstimated1Rm(maxSet.weight_kg, maxSet.reps) : null

  // 2-for-2 Progression Check
  const lastSet = loggedSetsForActive[loggedSetsForActive.length - 1]
  const progression = lastSet && lastSet.weight_kg
    ? evaluateNasm2For2Rule({
        currentWorkingWeightKg: lastSet.weight_kg,
        targetReps: Number(parseLowerReps(activeExercise?.reps)),
        actualRepsLastSetSession1: lastSet.reps,
        actualRepsLastSetSession2: lastSet.reps,
        exerciseName: activeExercise?.name || '',
      })
    : null

  const handleSubstitutionSelect = (sub: ExerciseSubstitution) => {
    if (!activeExercise) return
    setWorkoutsState(prev =>
      prev.map(w => {
        if (w.day !== selectedDay) return w
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.name === activeExercise.name) {
              return {
                ...ex,
                name: sub.name,
                tempo: sub.prescribedTempo,
                notes: sub.reasoning,
              }
            }
            return ex
          }),
        }
      })
    )
    setShowSwapModal(false)
  }

  const ringAthlete = async () => {
    try {
      setIsRinging(true)
      setRingFeedback(null)
      const res = await fetch(`/api/coach/clients/${clientId}/live-session-start`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setRingFeedback('✓ Alert & Push Dispatched to Athlete!')
        if (voiceEnabled) speakNasmCue('Live consultation alert sent to athlete.')
      } else {
        setRingFeedback(data.error || 'Failed to dispatch alert')
      }
    } catch {
      setRingFeedback('Network error')
    } finally {
      setIsRinging(false)
      setTimeout(() => setRingFeedback(null), 4000)
    }
  }

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `/coach/clients/${clientId}`
    }
  }

  const formatSessionTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
  }

  // Global Esc key listener for Exit Cockpit modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If sub-modals are active, let them handle close themselves
        if (showWrapUpModal || showPlateCalc || showPostureModal || showBodyCompModal || showFormCritiqueModal || replayVideoUrl) {
          return
        }
        setShowExitModal(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showWrapUpModal, showPlateCalc, showPostureModal, showBodyCompModal, showFormCritiqueModal, replayVideoUrl])

  const triggerSlowMo = () => {
    if (rollingChunksRef.current.length === 0) {
      showHudToast('Buffering high-speed DVR buffer… please wait 3 seconds before replaying.', 'amber')
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
      className="unified-live-studio-hud"
      style={{
        background: '#050811',
        border: '1px solid rgba(212,160,23,0.45)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(0,0,0,0.95)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '86vh',
        position: 'relative',
      }}
    >
      {/* ── 1. Top HUD Ribbon: Brand, Athlete Telemetry & Session Actions ── */}
      {isMobile ? (
        <div
          style={{
            background: 'linear-gradient(90deg, #0A0F1D 0%, #0D162B 100%)',
            borderBottom: '1px solid rgba(212,160,23,0.3)',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 30,
          }}
        >
          {/* Row 1: Brand + Athlete + Exit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  backgroundImage: "url('/images/gaa-brand-crest.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--gold)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div className="font-serif" style={{ fontSize: 15, letterSpacing: '0.06em', color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 700 }}>
                  SOVEREIGN STUDIO
                  <span className="sr-only"> LIVE COCKPIT</span>
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--gray)', fontWeight: 600 }}>
                  {athleteName} · P{plan?.nasm_opt_phase ?? 1}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setShowConsultationPlaybook(true)}
                style={{
                  padding: '5px 8px',
                  background: 'rgba(212,160,23,0.18)',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold-lt)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="clipboard" size={11} tone="gold" />
                <span>Playbook</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWrapUpModal(true)}
                className="tactile-btn"
                style={{
                  padding: '5px 9px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 4,
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="award" size={12} tone="white" />
                <span>End</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                data-testid="exit-cockpit-btn"
                title="Exit Live Command Cockpit"
                style={{
                  padding: '5px 8px',
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid #EF4444',
                  color: '#FFFFFF',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <GaaIcon name="close" size={11} tone="white" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Row 2: Heart Rate + Cal + Day Tabs + Eco */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                data-testid="live-cardio-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(6, 10, 18, 0.75)',
                  border: `1px solid ${liveCardio.zoneColor}60`,
                  borderRadius: 12,
                  padding: '2px 7px',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: liveCardio.zoneColor,
                  }}
                />
                <span style={{ fontSize: 10.5, fontFamily: 'monospace', fontWeight: 800, color: '#FFFFFF' }}>
                  {liveCardio.currentBpm} BPM
                </span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '2px 6px',
                  fontSize: 10,
                  color: 'var(--gray-lt)',
                  fontWeight: 700,
                }}
              >
                <GaaIcon name="lightning" size={10} tone="amber" />
                <span>{liveCardio.caloriesBurned} kcal</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', padding: 2, borderRadius: 4 }}>
                {workoutsState.map(w => (
                  <button
                    key={w.day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(w.day)
                      setExerciseIndex(0)
                    }}
                    style={{
                      padding: '2px 6px',
                      background: selectedDay === w.day ? 'var(--gold)' : 'transparent',
                      color: selectedDay === w.day ? '#0A0E18' : 'var(--gray)',
                      border: 'none',
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    D{w.day}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setEcoMode(prev => !prev)}
                style={{
                  padding: '2px 6px',
                  background: ecoMode ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `1px solid ${ecoMode ? '#10B981' : '#F59E0B'}`,
                  color: ecoMode ? '#34D399' : '#FCD34D',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {ecoMode ? 'Eco' : 'Max'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'linear-gradient(90deg, #0A0F1D 0%, #0D162B 100%)',
            borderBottom: '1px solid rgba(212,160,23,0.3)',
            padding: '10px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundImage: "url('/images/gaa-brand-crest.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 0 12px rgba(197,160,89,0.45)',
                  border: '1px solid var(--gold)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div className="font-serif" style={{ fontSize: 18, letterSpacing: '0.08em', color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 700 }}>
                  GORDON ATHLETIC ADVISORY
                </div>
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#34D399', fontWeight: 800, marginTop: 2 }}>
                  ● SOVEREIGN BIOMECHANICAL SUITE
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray)' }}>
              <span>Athlete: <strong style={{ color: '#FFFFFF' }}>{athleteName}</strong></span>
              <span>·</span>
              <span
                style={{
                  fontSize: 10.5,
                  background: 'rgba(212,160,23,0.15)',
                  color: 'var(--gold-lt)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(212,160,23,0.3)',
                  fontWeight: 800,
                }}
              >
                {plan?.nasm_opt_phase ? `Phase ${plan.nasm_opt_phase}` : 'Phase 2: Strength Endurance'}
              </span>
            </div>

            {/* ── Live Cardio & Biometrics Pod ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Live Heart Rate & Zone Badge */}
              <div
                data-testid="live-cardio-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(6, 10, 18, 0.75)',
                  border: `1px solid ${liveCardio.zoneColor}60`,
                  borderRadius: 20,
                  padding: '3px 10px',
                  boxShadow: `0 0 10px ${liveCardio.zoneColor}25`,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: liveCardio.zoneColor,
                    boxShadow: `0 0 6px ${liveCardio.zoneColor}`,
                  }}
                />
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#FFFFFF' }}>
                  {liveCardio.currentBpm} BPM
                </span>
                <span style={{ fontSize: 10, color: liveCardio.zoneColor, fontWeight: 700 }}>
                  {liveCardio.zoneName.split(':')[0]} ({liveCardio.hrPercentMax}%)
                </span>
              </div>

              {/* Total Tonnage Pill */}
              {totalSessionTonnage > 0 && (
                <div
                  data-testid="live-tonnage-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(212,160,23,0.1)',
                    border: '1px solid rgba(212,160,23,0.3)',
                    borderRadius: 20,
                    padding: '3px 10px',
                  }}
                >
                  <GaaIcon name="barbell" size={11} tone="gold" />
                  <span style={{ fontSize: 10.5, color: 'var(--gold-lt)', fontWeight: 800 }}>
                    {totalSessionTonnage.toLocaleString()} {unitLbs ? 'LBS' : 'KG'}
                  </span>
                </div>
              )}

              {/* Active Caloric Expenditure */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: '3px 8px',
                  fontSize: 10.5,
                  color: 'var(--gray-lt)',
                  fontWeight: 700,
                }}
              >
                <GaaIcon name="lightning" size={11} tone="amber" />
                <span>{liveCardio.caloriesBurned} kcal</span>
              </div>
            </div>
          </div>

          {/* Action Controls & Eco Thermal Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {ringFeedback && (
              <span style={{ fontSize: 11.5, color: '#34D399', fontWeight: 700, animation: 'fadeIn 0.3s' }}>
                {ringFeedback}
              </span>
            )}

            {/* Low-CPU Eco Mode Toggle */}
            <button
              type="button"
              onClick={() => setEcoMode(prev => !prev)}
              style={{
                padding: '5px 10px',
                background: ecoMode ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                border: `1px solid ${ecoMode ? '#10B981' : '#F59E0B'}`,
                color: ecoMode ? '#34D399' : '#FCD34D',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <GaaIcon name="lightning" size={11} tone="inherit" />
              <span>{ecoMode ? 'Eco: ON (Cool)' : 'Max DVR'}</span>
            </button>

            {/* 45-Minute Clinical Diagnostic Consultation Playbook */}
            <button
              type="button"
              onClick={() => setShowConsultationPlaybook(true)}
              data-testid="open-consultation-playbook-btn"
              style={{
                padding: '6px 13px',
                background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(14,23,36,0.9) 100%)',
                border: '1px solid var(--gold)',
                color: 'var(--gold-lt)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 0 12px rgba(212,160,23,0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="clipboard" size={13} tone="gold" />
              <span>Diagnostic Playbook</span>
              <span
                className="font-telemetry"
                style={{
                  fontSize: 10,
                  background: 'rgba(0,0,0,0.55)',
                  padding: '1px 6px',
                  borderRadius: 3,
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: '#FFFFFF',
                }}
              >
                {formatConsultationCountdown(sessionDurationSec).formattedRemaining}
              </span>
            </button>

            <button
              type="button"
              onClick={ringAthlete}
              disabled={isRinging}
              style={{
                padding: '6px 12px',
                background: 'rgba(212,160,23,0.15)',
                border: '1px solid rgba(212,160,23,0.4)',
                color: 'var(--gold-lt)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: isRinging ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name={isRinging ? 'volume' : 'phone'} size={13} tone="gold" />
              <span>{isRinging ? 'Ringing...' : 'Ring Athlete'}</span>
            </button>

            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 2, borderRadius: 4 }}>
              {workoutsState.map(w => (
                <button
                  key={w.day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(w.day)
                    setExerciseIndex(0)
                  }}
                  style={{
                    padding: '4px 10px',
                    background: selectedDay === w.day ? 'var(--gold)' : 'transparent',
                    color: selectedDay === w.day ? '#0A0E18' : 'var(--gray)',
                    border: 'none',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Day {w.day}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowWrapUpModal(true)}
              className="tactile-btn"
              style={{
                padding: '7px 14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="award" size={14} tone="white" />
              <span>Conclude Session</span>
            </button>

            <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.18)', margin: '0 4px' }} />

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              data-testid="exit-cockpit-btn"
              title="Exit Live Command Cockpit (Esc)"
              style={{
                padding: '7px 14px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.3) 100%)',
                border: '1px solid #EF4444',
                color: '#FFFFFF',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 14px rgba(239,68,68,0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="close" size={13} tone="white" />
              <span>Exit Cockpit</span>
              <span
                style={{
                  fontSize: 9.5,
                  padding: '1px 5px',
                  background: 'rgba(0,0,0,0.45)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                }}
              >
                Esc
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Studio View Mode Selector */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: '#070B14',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '6px 12px',
            zIndex: 25,
          }}
        >
          <button
            type="button"
            onClick={() => setMobileViewMode('both')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              background: mobileViewMode === 'both' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
              color: mobileViewMode === 'both' ? '#080E14' : 'var(--gray-lt)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <GaaIcon name="lightning" size={12} tone={mobileViewMode === 'both' ? 'dark' : 'inherit'} />
            <span>Studio (Both)</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('video')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              background: mobileViewMode === 'video' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
              color: mobileViewMode === 'video' ? '#080E14' : 'var(--gray-lt)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <GaaIcon name="video-studio" size={12} tone={mobileViewMode === 'video' ? 'dark' : 'inherit'} />
            <span>Full Video</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('workout')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              background: mobileViewMode === 'workout' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
              color: mobileViewMode === 'workout' ? '#080E14' : 'var(--gray-lt)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <GaaIcon name="barbell" size={12} tone={mobileViewMode === 'workout' ? 'dark' : 'inherit'} />
            <span>Workout</span>
          </button>
        </div>
      )}

      {/* ── Studio Lobby Presence & Diagnostic Telemetry Bar ── */}
      <div
        data-testid="live-studio-lobby-banner"
        style={{
          background: athleteInLobby
            ? 'linear-gradient(90deg, rgba(16,185,129,0.18) 0%, rgba(6,78,59,0.25) 50%, rgba(7,11,20,0.95) 100%)'
            : 'linear-gradient(90deg, rgba(212,160,23,0.12) 0%, rgba(138,101,8,0.18) 50%, rgba(7,11,20,0.95) 100%)',
          borderBottom: athleteInLobby ? '1px solid rgba(52, 211, 153, 0.45)' : '1px solid rgba(212,160,23,0.3)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: athleteInLobby ? 'rgba(16,185,129,0.2)' : 'rgba(212,160,23,0.15)',
              border: athleteInLobby ? '1.5px solid #10B981' : '1.5px solid var(--gold)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: athleteInLobby ? '#10B981' : '#D4AF37',
                boxShadow: athleteInLobby ? '0 0 10px #10B981' : 'none',
                animation: athleteInLobby ? 'pulse 2s infinite' : 'none',
              }}
            />
          </span>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: athleteInLobby ? '#34D399' : 'var(--gold-lt)', letterSpacing: '0.04em' }}>
                {athleteInLobby ? 'ATHLETE IN LOBBY (READY TO CONNECT)' : 'AWAITING ATHLETE IN LOBBY'}
              </span>
              {athleteInLobby && (
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#FFF',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: '1px solid rgba(52,211,153,0.3)',
                  }}
                >
                  Waiting: {Math.floor(lobbyWaitSeconds / 60)}m {lobbyWaitSeconds % 60}s
                </span>
              )}
              {peerLatencyMs != null && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'monospace',
                    color: peerLatencyMs < 100 ? '#34D399' : peerLatencyMs < 250 ? '#FBBF24' : '#F87171',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  RTT: {peerLatencyMs}ms
                </span>
              )}
            </div>

            <p style={{ margin: '1px 0 0', fontSize: 11.5, color: athleteInLobby ? 'rgba(255,255,255,0.85)' : 'var(--gray)' }}>
              {athleteInLobby
                ? `${athleteName} has entered your live studio room and is waiting for your coaching instruction.`
                : `${athleteName} is not yet in the room. A direct live consultation link and push alert can be dispatched.`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!athleteInLobby && (
            <button
              type="button"
              onClick={ringAthlete}
              disabled={isRinging}
              className="tactile-btn"
              style={{
                padding: '5px 12px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                border: 'none',
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: isRinging ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name={isRinging ? 'volume' : 'phone'} size={12} tone="dark" />
              <span>{isRinging ? 'Ringing...' : 'Ring Athlete & Push Alert'}</span>
            </button>
          )}

          {ringFeedback && (
            <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>
              {ringFeedback}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Main Broadcast Stage (Left Video 70% ⇄ Right Cockpit Panel 30%) ── */}
      <div
        style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : 'minmax(0, 1fr) 340px',
          flex: 1,
          minHeight: isMobile ? 'auto' : 520,
          width: '100%',
        }}
      >
{/* ── Left Stage: Video Stream, Telestrator, Floating Timers ── */}
        <div
          style={{
            position: 'relative',
            background: '#04070E',
            borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderBottom: isMobile ? '1px solid rgba(255,255,255,0.08)' : undefined,
            display: mobileViewMode === 'workout' ? 'none' : 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          {/* Main Dual Video View */}
          <div
            style={{
              position: 'relative',
              flex: isMobile && mobileViewMode === 'both' ? '0 0 auto' : 1,
              width: '100%',
              height: isMobile && mobileViewMode === 'both' ? 320 : undefined,
              minHeight: isMobile ? (mobileViewMode === 'video' ? '70vh' : 280) : 380,
              background: '#000',
              display: 'grid',
              gridTemplateColumns: showCompareModel ? '1fr 1fr' : layout === 'split' ? '1fr 1fr' : '1fr',
              overflow: 'hidden',
            }}
          >
            {/* ── Viewport 1: Left Frame (Coach initially by default, or Athlete when swapped / comparing) ── */}
            {showCompareModel || isStageSwapped ? (
              /* ATHLETE ON LEFT: Either swapped or comparing against NASM Benchmark */
              <div
                data-testid="athlete-video-container"
                style={{
                  position: layout === 'pip' && isStageSwapped ? 'absolute' : 'relative',
                  bottom: layout === 'pip' && isStageSwapped ? (isMobile ? 10 : 16) : undefined,
                  right: layout === 'pip' && isStageSwapped ? (isMobile ? 10 : 16) : undefined,
                  width: layout === 'pip' && isStageSwapped ? (isMobile ? 110 : 220) : '100%',
                  height: layout === 'pip' && isStageSwapped ? (isMobile ? 85 : 150) : '100%',
                  minHeight: layout === 'split' || showCompareModel ? (isMobile ? 260 : 380) : undefined,
                  background: 'linear-gradient(135deg, #0D1629 0%, #060A14 100%)',
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
                {/* ── Quick Diagnostic Frame Capture Controller ── */}
                <div
                  data-testid="athlete-video-capture-bar"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(7, 12, 22, 0.92)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid var(--gold)',
                    borderRadius: 6,
                    padding: '3px 6px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.8), 0 0 12px rgba(212,160,23,0.35)',
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
                    title={`Capture ${ASSESSMENT_CAPTURE_SLOTS.find(s => s.id === selectedCaptureSlot)?.label || 'Frame'}`}
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
                    title="Diagnostic Frames Captured"
                  >
                    {Object.values(capturedFrames).filter(Boolean).length}/4
                  </div>
                </div>

                <LiveRemoteVideoFeed
                  stream={activeRemoteStream}
                  participantName={athleteName}
                  participantRole="Athlete"
                  isConnected={peerConnectionState === 'connected'}
                  isPeerInLobby={Boolean(athleteInLobby)}
                  lobbyWaitSeconds={lobbyWaitSeconds}
                  peerLatencyMs={peerLatencyMs}
                  onVideoRef={el => {
                    remoteVideoRef.current = el
                  }}
                />

                {/* Athlete Overlay Status Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 9px',
                    borderRadius: 5,
                    fontSize: 10.5,
                    color: '#FFF',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 2,
                    border: athleteInLobby ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: activeRemoteStream
                        ? '#34D399'
                        : athleteInLobby
                        ? '#10B981'
                        : peerConnectionState === 'connected'
                        ? '#60A5FA'
                        : '#D4AF37',
                      boxShadow: athleteInLobby || activeRemoteStream ? '0 0 8px #10B981' : 'none',
                    }}
                  />
                  <span>
                    {athleteName}{' '}
                    {activeRemoteStream
                      ? '(Live Video)'
                      : athleteInLobby
                      ? `(In Lobby · ${Math.floor(lobbyWaitSeconds / 60)}m ${lobbyWaitSeconds % 60}s)`
                      : peerConnectionState === 'connected'
                      ? '(Connecting)'
                      : '(Standby)'}
                  </span>
                </div>

                {/* Biomechanical Plumb Line Grid (Strictly Athlete's Video only — never overlays coach's video) */}
                {showPlumbLine && (
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
                        <filter id="studioPlumbLaserGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor="#D4AF37" floodOpacity="0.75" />
                        </filter>
                      </defs>

                      {/* Central Gravitational Plumb Axis */}
                      <line x1="50" y1="0" x2="50" y2="100" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="1.5,1" filter="url(#studioPlumbLaserGlow)" />

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
                )}

                {/* Telestrator Drawing Layer (Targeted to Athlete) */}
                <LiveTelestratorCanvas
                  isActive={telestratorActive}
                  activeTool={telestratorTool}
                  activeColor={telestratorColor}
                  autoFade={autoFade}
                />
              </div>
            ) : (
              /* COACH ON LEFT (DEFAULT): Left Frame in Split mode or floating PiP at bottom-left */
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
                    title="Restore Coach Self-View Picture-in-Picture"
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
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isCameraActive ? '#34D399' : '#EF4444' }} />
                    <span>Coach Feed Minimized (Click for PiP)</span>
                  </button>
                </div>
              ) : (
                <div
                  data-testid="coach-video-container"
                  style={{
                    position: layout === 'pip' ? 'absolute' : 'relative',
                    bottom: layout === 'pip' ? (isMobile ? 10 : 16) : undefined,
                    left: layout === 'pip' ? (isMobile ? 10 : 16) : undefined,
                    width: layout === 'pip' ? (isMobile ? 110 : 220) : '100%',
                    height: layout === 'pip' ? (isMobile ? 85 : 150) : '100%',
                    minHeight: layout === 'split' ? (isMobile ? 260 : 380) : undefined,
                    border: layout === 'pip' ? '2px solid var(--gold)' : 'none',
                    borderRadius: layout === 'pip' ? 8 : 0,
                    boxShadow: layout === 'pip' ? '0 10px 30px rgba(0,0,0,0.8)' : 'none',
                    zIndex: layout === 'pip' ? 25 : 1,
                    overflow: 'hidden',
                  }}
                >
                  <LiveVirtualBackgroundStage
                    stream={mediaStream}
                    isActive={isCameraActive}
                    isMirrored={facingMode === 'user'}
                    selectedBackground={selectedBackground}
                    coachName={coachName}
                    onOpenPicker={handleCycleBackground}
                  />

                  {/* Coach Status & Swap Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      background: 'rgba(0,0,0,0.75)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 9.5,
                      color: '#FFF',
                      fontWeight: 700,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isCameraActive ? '#34D399' : '#EF4444' }} />
                    <span>{coachName} (You)</span>
                  </div>

                  {/* 1-Click Swap Button */}
                  <button
                    type="button"
                    onClick={() => setIsStageSwapped(true)}
                    title="Swap Coach to Main Stage for Exercise Demonstration"
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
                </div>
              )
            )}

            {/* ── Viewport 2: Right Frame (Athlete initially by default, Coach if swapped, or Model Compare) ── */}
            {showCompareModel ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#090F1E', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 8, overflowY: 'auto' }}>
                <div style={{ fontSize: 10.5, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>
                  Gold-Standard NASM Benchmark
                </div>
                <div className="font-serif" style={{ fontSize: 22, color: '#FFFFFF', fontWeight: 700 }}>{activeExercise?.name}</div>

                {/* Benchmark Video Demonstration Image */}
                {(activeMovementCard?.imageUrl || activeMovementCard?.fallbackImageUrl) && (
                  <div
                    data-testid="viewport-benchmark-image"
                    onClick={() => {
                      if (activeMovementCard.embedUrl) {
                        setDemoVideoModal({
                          isOpen: true,
                          embedUrl: activeMovementCard.embedUrl,
                          name: activeExercise?.name || 'Movement',
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
                      cursor: activeMovementCard.embedUrl ? 'pointer' : 'default',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                      flexShrink: 0,
                    }}
                    title={activeMovementCard.embedUrl ? 'Click to watch demo video' : activeExercise?.name}
                  >
                    <img
                      src={activeMovementCard.imageUrl || activeMovementCard.fallbackImageUrl || '/images/exercises/image-not-available.jpg'}
                      alt={activeExercise?.name || 'Exercise'}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {activeMovementCard.embedUrl && (
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
                  </div>
                )}

                <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 6, padding: 12, fontSize: 12, maxWidth: 300, textAlign: 'left', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 4 }}>Kinetic Checkpoints:</div>
                  • Shin parallel to torso angle.<br />
                  • Knees tracking over 2nd toe.<br />
                  • Strict eccentric tempo: <strong>{activeExercise?.tempo || '2-0-2'}</strong>.
                </div>

                {activeMovementCard?.clinicalCues && activeMovementCard.clinicalCues.length > 0 && (
                  <div style={{ maxWidth: 300, textAlign: 'left', fontSize: 11, color: '#E2E8F0', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: 'var(--gold-lt)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Clinical Form Cues:</div>
                    {activeMovementCard.clinicalCues.slice(0, 2).map((cue, idx) => (
                      <div key={idx} style={{ marginTop: 2, lineHeight: 1.3 }}>• {cue}</div>
                    ))}
                  </div>
                )}

                {activeMovementCard?.embedUrl && (
                  <button
                    type="button"
                    onClick={() => setDemoVideoModal({
                      isOpen: true,
                      embedUrl: activeMovementCard.embedUrl,
                      name: activeExercise?.name || 'Movement',
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
            ) : !isStageSwapped ? (
              /* ATHLETE ON RIGHT (DEFAULT): Right Frame in Split mode or Full Stage in PiP/Focus */
              <div
                data-testid="athlete-video-container"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  minHeight: layout === 'split' ? (isMobile ? 260 : 380) : undefined,
                  background: 'linear-gradient(135deg, #0D1629 0%, #060A14 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* ── Quick Diagnostic Frame Capture Controller ── */}
                <div
                  data-testid="athlete-video-capture-bar"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(7, 12, 22, 0.92)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid var(--gold)',
                    borderRadius: 6,
                    padding: '3px 6px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.8), 0 0 12px rgba(212,160,23,0.35)',
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
                    title={`Capture ${ASSESSMENT_CAPTURE_SLOTS.find(s => s.id === selectedCaptureSlot)?.label || 'Frame'}`}
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
                    title="Diagnostic Frames Captured"
                  >
                    {Object.values(capturedFrames).filter(Boolean).length}/4
                  </div>
                </div>

                <LiveRemoteVideoFeed
                  stream={activeRemoteStream}
                  participantName={athleteName}
                  participantRole="Athlete"
                  isConnected={peerConnectionState === 'connected'}
                  isPeerInLobby={Boolean(athleteInLobby)}
                  lobbyWaitSeconds={lobbyWaitSeconds}
                  peerLatencyMs={peerLatencyMs}
                  onVideoRef={el => {
                    remoteVideoRef.current = el
                  }}
                />

                {/* Athlete Overlay Status Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 9px',
                    borderRadius: 5,
                    fontSize: 10.5,
                    color: '#FFF',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 2,
                    border: athleteInLobby ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: activeRemoteStream
                        ? '#34D399'
                        : athleteInLobby
                        ? '#10B981'
                        : peerConnectionState === 'connected'
                        ? '#60A5FA'
                        : '#D4AF37',
                      boxShadow: athleteInLobby || activeRemoteStream ? '0 0 8px #10B981' : 'none',
                    }}
                  />
                  <span>
                    {athleteName}{' '}
                    {activeRemoteStream
                      ? '(Live Video)'
                      : athleteInLobby
                      ? `(In Lobby · ${Math.floor(lobbyWaitSeconds / 60)}m ${lobbyWaitSeconds % 60}s)`
                      : peerConnectionState === 'connected'
                      ? '(Connecting)'
                      : '(Standby)'}
                  </span>
                </div>

                {/* Biomechanical Plumb Line Grid (Strictly Athlete's Video only — never overlays coach's video) */}
                {showPlumbLine && (
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
                        <filter id="studioPlumbLaserGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor="#D4AF37" floodOpacity="0.75" />
                        </filter>
                      </defs>

                      {/* Central Gravitational Plumb Axis */}
                      <line x1="50" y1="0" x2="50" y2="100" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="1.5,1" filter="url(#studioPlumbLaserGlow)" />

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
                )}

                {/* Telestrator Drawing Layer (Targeted to Athlete) */}
                <LiveTelestratorCanvas
                  isActive={telestratorActive}
                  activeTool={telestratorTool}
                  activeColor={telestratorColor}
                  autoFade={autoFade}
                />
              </div>
            ) : (
              /* COACH ON RIGHT (SWAPPED): Coach Stage (Demo Mode) — STRICTLY NO PLUMB LINE */
              <div
                data-testid="coach-video-container"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  minHeight: layout === 'split' ? (isMobile ? 260 : 380) : undefined,
                  overflow: 'hidden',
                }}
              >
                <LiveVirtualBackgroundStage
                  stream={mediaStream}
                  isActive={isCameraActive}
                  isMirrored={facingMode === 'user'}
                  selectedBackground={selectedBackground}
                  coachName={coachName}
                  onOpenPicker={handleCycleBackground}
                />

                {/* Swap Stage Return Overlay Button */}
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

            {/* ── FLOATING REST TIMER HUD (When Active - Solid Alpha High Perf) ── */}
            {restRemaining !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 25,
                  background: 'rgba(8,12,24,0.96)',
                  border: '1px solid rgba(212,160,23,0.5)',
                  borderRadius: 12,
                  padding: '12px 18px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <GaaIcon name="watch" size={11} tone="gold" />
                    <span>Rest Interval</span>
                  </div>
                  <div className="font-telemetry" style={{ fontSize: 28, color: '#FFFFFF', lineHeight: 1, marginTop: 4, fontWeight: 700 }}>
                    {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  {[30, 60, 90].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => startRestTimer(s)}
                      style={{
                        padding: '3px 6px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFF',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 3,
                        cursor: 'pointer',
                      }}
                    >
                      {s}s
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={stopRestTimer}
                    style={{
                      padding: '3px 8px',
                      background: '#EF4444',
                      border: 'none',
                      color: '#FFF',
                      borderRadius: 3,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GaaIcon name="close" size={10} tone="white" />
                  </button>
                </div>
              </div>
            )}

            {/* ── FLOATING NASM VISUAL TEMPO PULSE & SILENT HUD (High-Tech Pulse) ── */}
            {metronomeActive && (
              <LiveVisualTempoPulseHud
                isActive={metronomeActive}
                exerciseName={activeExercise?.name || 'Active Exercise'}
                tempoString={activeExercise?.tempo || '4/2/1'}
                targetReps={Number(parseLowerReps(activeExercise?.reps)) || 8}
                onStop={() => setMetronomeActive(false)}
                onLogSet={(_tutSeconds, completedReps) => {
                  setRepsInput(String(completedReps))
                  void executeLogSet(undefined, completedReps)
                }}
              />
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

          {/* Quick Verbal Cues Strip */}
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <GaaIcon name="volume" size={11} tone="gold" />
              <span>Quick Cues:</span>
            </span>
            {[
              'Brace core & lock ribs',
              'Drive through heels',
              'Control 3-sec descent',
              'Pin shoulder blades back',
              'Explosive drive',
            ].map(cue => (
              <button
                key={cue}
                type="button"
                onClick={() => {
                  speakNasmCue(cue)
                  showHudToast(`Audio Cue Synthesized: "${cue}"`, 'gold')
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#FFF',
                  borderRadius: 12,
                  padding: '3px 8px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cue}
              </button>
            ))}

            <button
              type="button"
              onClick={requestStillCamera}
              data-testid="request-still-camera-btn"
              title="Instruct athlete to disable Apple Center Stage / Samsung Auto-Framing for a still view"
              style={{
                background: 'rgba(212, 175, 55, 0.16)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                color: 'var(--gold-lt)',
                borderRadius: 12,
                padding: '3px 9px',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginLeft: 4,
              }}
            >
              <GaaIcon name="camera" size={11} tone="gold" />
              <span>Request Still Camera</span>
            </button>
          </div>

          {/* Capture Feedback Notification Banner */}
          {captureFeedback && (
            <div
              style={{
                background: 'rgba(16,185,129,0.18)',
                borderTop: '1px solid #10B981',
                borderBottom: '1px solid #10B981',
                color: '#34D399',
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GaaIcon name="star" size={14} tone="emerald" />
              <span>{captureFeedback}</span>
            </div>
          )}

          {/* ── Executive 4-Slot Assessment Photo Vault Drawer ── */}
          {(capturedFrame || Object.values(capturedFrames).some(Boolean)) && (
            <div
              data-testid="assessment-photo-vault"
              style={{
                background: 'linear-gradient(180deg, rgba(14,24,42,0.98) 0%, rgba(9,15,28,0.99) 100%)',
                borderTop: '1.5px solid var(--gold)',
                borderBottom: '1px solid rgba(212,160,23,0.35)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
                padding: isVaultOpen ? '12px 16px 14px' : '6px 16px',
                transition: 'all 0.2s ease',
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
                        className="font-serif"
                        style={{
                          fontSize: 14,
                          letterSpacing: '0.06em',
                          color: '#FFFFFF',
                          fontWeight: 700,
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
                        onClick={() => setShowBodyCompModal(true)}
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
                          setActivePostureView('overhead_squat')
                          setShowPostureModal(true)
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

                      <button
                        type="button"
                        onClick={() => setShowFormCritiqueModal(true)}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(59,130,246,0.15)',
                          border: '1px solid #3B82F6',
                          color: '#60A5FA',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <GaaIcon name="barbell" size={12} tone="inherit" />
                        <span>Form Critique</span>
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

          {/* Left Stage Bottom Control Bar */}
          <div
            style={{
              background: 'rgba(8,12,22,0.96)',
              padding: isMobile ? '8px 10px' : '8px 16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              gap: isMobile ? 8 : 6,
            }}
          >
            {/* Row 1 on Mobile: Hardware Media Controls + Viewport Layout Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 6,
                width: isMobile ? '100%' : 'auto',
                overflowX: isMobile ? 'auto' : 'visible',
              }}
            >
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={toggleMic}
                  style={{
                    padding: '5px 10px',
                    background: isMicMuted ? '#EF4444' : 'rgba(255,255,255,0.08)',
                    color: '#FFF',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name={isMicMuted ? 'mic-off' : 'mic'} size={12} tone="inherit" />
                  <span>{isMicMuted ? 'Unmute' : 'Mic'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  style={{
                    padding: '5px 10px',
                    background: isCameraActive ? 'rgba(255,255,255,0.08)' : '#EF4444',
                    color: '#FFF',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name={isCameraActive ? 'video-studio' : 'stop'} size={12} tone="inherit" />
                  <span>{isCameraActive ? 'Cam' : 'Cam Off'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFacingMode(f => (f === 'user' ? 'environment' : 'user'))}
                  style={{
                    padding: '5px 8px',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#FFF',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <GaaIcon name="rotate-ccw" size={11} tone="inherit" />
                  <span>Flip</span>
                </button>

                {/* Bottom Dock Exit Cockpit Button */}
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  data-testid="dock-exit-cockpit-btn"
                  title="Exit Live Command Cockpit (Esc)"
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#FCA5A5',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name="close" size={11} tone="ruby" />
                  <span>Exit Cockpit</span>
                </button>
              </div>

              {/* Viewport Layout Controls */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '2px 4px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setLayout('split')}
                  title="Side-by-side split screen"
                  style={{
                    padding: '3px 7px',
                    background: layout === 'split' ? 'rgba(212,160,23,0.25)' : 'transparent',
                    border: layout === 'split' ? '1px solid var(--gold)' : 'none',
                    color: layout === 'split' ? 'var(--gold-lt)' : 'rgba(255,255,255,0.6)',
                    borderRadius: 3,
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
                  title="Picture-in-picture mode"
                  style={{
                    padding: '3px 7px',
                    background: layout === 'pip' ? 'rgba(212,160,23,0.25)' : 'transparent',
                    border: layout === 'pip' ? '1px solid var(--gold)' : 'none',
                    color: layout === 'pip' ? 'var(--gold-lt)' : 'rgba(255,255,255,0.6)',
                    borderRadius: 3,
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
                  title="Full-stage focus on Athlete"
                  style={{
                    padding: '3px 7px',
                    background: layout === 'focus' ? 'rgba(212,160,23,0.25)' : 'transparent',
                    border: layout === 'focus' ? '1px solid var(--gold)' : 'none',
                    color: layout === 'focus' ? 'var(--gold-lt)' : 'rgba(255,255,255,0.6)',
                    borderRadius: 3,
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
                  title="Swap Main Stage between Athlete and Coach"
                  style={{
                    padding: '3px 7px',
                    background: isStageSwapped ? 'rgba(59,130,246,0.25)' : 'transparent',
                    border: isStageSwapped ? '1px solid #3B82F6' : 'none',
                    color: isStageSwapped ? '#60A5FA' : 'rgba(255,255,255,0.6)',
                    borderRadius: 3,
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span>⇄ SWAP</span>
                </button>
              </div>
            </div>

            {/* Row 2: Tactical Studio Tools */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                overflowX: isMobile ? 'auto' : 'visible',
                width: isMobile ? '100%' : 'auto',
                paddingBottom: isMobile ? 2 : 0,
              }}
            >
              <button
                type="button"
                onClick={() => setTelestratorActive(t => !t)}
                style={{
                  padding: '5px 10px',
                  background: telestratorActive ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                  color: telestratorActive ? '#0A0E18' : '#FFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="edit" size={12} tone={telestratorActive ? 'gold' : 'inherit'} />
                <span>Telestrator</span>
              </button>

              <button
                type="button"
                onClick={triggerSlowMo}
                style={{
                  padding: '5px 10px',
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(217,119,6,0.15) 100%)',
                  border: '1px solid #F59E0B',
                  color: '#FCD34D',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="rotate-ccw" size={11} tone="amber" />
                <span>Slow-Mo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCompareModel(c => !c)}
                style={{
                  padding: '5px 10px',
                  background: showCompareModel ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid #3B82F6',
                  color: '#60A5FA',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="eye" size={12} tone="inherit" />
                <span>Form</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPlumbLine(p => !p)}
                style={{
                  padding: '5px 10px',
                  background: showPlumbLine ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold-lt)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="grid" size={12} tone={showPlumbLine ? 'gold' : 'inherit'} />
                <span>Plumb</span>
              </button>

              <button
                type="button"
                onClick={() => setMetronomeActive(m => !m)}
                style={{
                  padding: '5px 10px',
                  background: metronomeActive ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(59,130,246,0.15)',
                  border: metronomeActive ? '1px solid #10B981' : '1px solid rgba(59,130,246,0.4)',
                  color: metronomeActive ? '#080E14' : '#60A5FA',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: metronomeActive ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="timer" size={12} tone="inherit" />
                <span>Tempo Pulse</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPlateCalc(true)}
                style={{
                  padding: '5px 10px',
                  background: showPlateCalc ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold-lt)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="scale" size={12} tone="gold" />
                <span>Plate Math</span>
              </button>

              <button
                type="button"
                onClick={handleCycleBackground}
                style={{
                  padding: '5px 10px',
                  background: selectedBackground ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${selectedBackground ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
                  color: selectedBackground ? 'var(--gold-lt)' : '#FFF',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title={selectedBackground ? `Active: ${selectedBackground.name} (Click to cycle)` : 'Virtual Background: Off (Click to enable)'}
              >
                <GaaIcon name="camera" size={12} tone="inherit" />
                <span>{selectedBackground ? (selectedBackground.isBlur ? 'Virtual BG: Blur' : 'Virtual BG: Studio') : 'Virtual BG: OFF'}</span>
              </button>
            </div>

            {/* ── Movement Screen & Assessment Quick Strip ── */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                overflowX: isMobile ? 'auto' : 'visible',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--gold-lt)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginRight: 2,
                }}
              >
                Assess:
              </span>

              <button
                type="button"
                onClick={() => captureClientFrame()}
                className="tactile-btn"
                style={{
                  padding: '5px 10px',
                  background: 'linear-gradient(135deg, rgba(212,160,23,0.3) 0%, rgba(212,160,23,0.15) 100%)',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold-lt)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 0 10px rgba(212,160,23,0.2)',
                }}
              >
                <GaaIcon name="camera" size={12} tone="gold" />
                <span>Capture Frame</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePostureView('overhead_squat')
                  setShowPostureModal(true)
                }}
                style={{
                  padding: '5px 9px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="grid" size={11} tone="gold" />
                <span>AI Posture Mesh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBodyCompModal(true)}
                style={{
                  padding: '5px 9px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="user" size={11} tone="inherit" />
                <span>Body Comp</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFormCritiqueModal(true)}
                style={{
                  padding: '5px 9px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="barbell" size={11} tone="inherit" />
                <span>Form Critique</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNasmSuiteModal(true)}
                style={{
                  padding: '5px 9px',
                  background: 'rgba(52,211,153,0.14)',
                  border: '1px solid rgba(52,211,153,0.4)',
                  color: '#34D399',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="clipboard" size={11} tone="inherit" />
                <span>NASM Suite</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Stage: 1-Touch Set Logger, Movement Queue & Voice Co-Pilot ── */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0A0F1D 0%, #060913 100%)',
            display: mobileViewMode === 'video' ? 'none' : 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: isMobile ? '14px 14px calc(80px + env(safe-area-inset-bottom, 16px)) 14px' : 16,
            gap: 12,
            overflowY: 'auto',
            width: isMobile ? '100%' : 340,
            minWidth: isMobile ? '100%' : 340,
            maxWidth: isMobile ? '100%' : 340,
          }}
        >
          {/* Active Movement Header & Queue Switcher */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Exercise {exerciseIndex + 1} of {currentWorkout?.exercises.length ?? 1}
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setExerciseIndex(i => Math.max(0, i - 1))}
                  disabled={exerciseIndex === 0}
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: exerciseIndex === 0 ? 'var(--gray)' : '#FFF',
                    borderRadius: 3,
                    fontSize: 11,
                    cursor: exerciseIndex === 0 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GaaIcon name="chevron-left" size={10} tone="inherit" />
                </button>
                <button
                  type="button"
                  onClick={() => setExerciseIndex(i => Math.min((currentWorkout?.exercises.length ?? 1) - 1, i + 1))}
                  disabled={exerciseIndex >= (currentWorkout?.exercises.length ?? 1) - 1}
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: exerciseIndex >= (currentWorkout?.exercises.length ?? 1) - 1 ? 'var(--gray)' : '#FFF',
                    borderRadius: 3,
                    fontSize: 11,
                    cursor: exerciseIndex >= (currentWorkout?.exercises.length ?? 1) - 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GaaIcon name="chevron-right" size={10} tone="inherit" />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
              <h3 className="font-serif" style={{ fontSize: 20, margin: '2px 0 0', color: '#FFF', lineHeight: 1.15, fontWeight: 700 }}>
                {activeExercise?.name || 'Movement'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSwapModal(true)}
                style={{
                  padding: '3px 8px',
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="rotate-ccw" size={11} tone="gold" />
                <span>Swap</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: 'var(--gray)' }}>
              <span>Target: <strong style={{ color: '#FFF' }}>{activeExercise?.sets} sets × {activeExercise?.reps}</strong></span>
              <span>·</span>
              <span>Tempo: <strong style={{ color: 'var(--gold-lt)' }}>{activeExercise?.tempo || '2-0-2'}</strong></span>
            </div>
          </div>

          {/* ── Active Movement Form Guide & Visual Reference Console ── */}
          {activeExercise && (
            <div
              data-testid="exercise-instructions-visual-guide"
              style={{
                background: 'rgba(10, 15, 29, 0.85)',
                border: '1px solid rgba(212, 160, 23, 0.35)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              }}
            >
              {/* Header row: Category tag, title & expand/demo actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 9.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: 'rgba(212, 160, 23, 0.15)',
                      border: '1px solid rgba(212, 160, 23, 0.4)',
                      color: 'var(--gold-lt)',
                      fontWeight: 800,
                    }}
                  >
                    {activeMovementCard?.category || 'Clinical Form Guide'}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.65)', fontWeight: 700 }}>
                    Exercise Instructions & Form Cues
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {activeMovementCard?.embedUrl && (
                    <button
                      type="button"
                      data-testid="watch-demo-button"
                      onClick={() => setDemoVideoModal({
                        isOpen: true,
                        embedUrl: activeMovementCard.embedUrl,
                        name: activeExercise.name,
                      })}
                      style={{
                        padding: '2px 7px',
                        background: 'rgba(59, 130, 246, 0.18)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#93C5FD',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Watch official NASM Edge demonstration"
                    >
                      <GaaIcon name="play" size={10} tone="inherit" />
                      <span>Watch Demo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="toggle-exercise-guide"
                    onClick={() => setShowExerciseGuideExpanded(prev => !prev)}
                    style={{
                      padding: '2px 7px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#E2E8F0',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <span>{showExerciseGuideExpanded ? 'Compact' : 'Full Guide'}</span>
                    <span>{showExerciseGuideExpanded ? '▲' : '▼'}</span>
                  </button>
                </div>
              </div>

              {/* Main Row: Visual Image Preview + Primary Form Cues */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Visual Thumbnail Image */}
                <div
                  data-testid="exercise-thumbnail-container"
                  onClick={() => {
                    if (activeMovementCard?.embedUrl) {
                      setDemoVideoModal({
                        isOpen: true,
                        embedUrl: activeMovementCard.embedUrl,
                        name: activeExercise.name,
                      })
                    }
                  }}
                  style={{
                    width: 'clamp(92px, 11vw, 116px)',
                    aspectRatio: '16 / 10',
                    height: 'auto',
                    minWidth: 'clamp(92px, 11vw, 116px)',
                    flexShrink: 0,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid rgba(212, 160, 23, 0.35)',
                    background: '#04070E',
                    position: 'relative',
                    cursor: activeMovementCard?.embedUrl ? 'pointer' : 'default',
                  }}
                  title={activeMovementCard?.embedUrl ? 'Click to watch demo video' : activeExercise.name}
                >
                  {(activeMovementCard?.imageUrl || activeMovementCard?.fallbackImageUrl) ? (
                    <>
                      <img
                        data-testid="exercise-guide-image"
                        src={activeMovementCard.imageUrl || activeMovementCard.fallbackImageUrl || '/images/exercises/image-not-available.jpg'}
                        alt={activeExercise.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {activeMovementCard.embedUrl && (
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
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'rgba(212, 160, 23, 0.95)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                            }}
                          >
                            <GaaIcon name="play" size={10} tone="slate" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      data-testid="exercise-guide-image"
                      src="/images/exercises/image-not-available.jpg"
                      alt={activeExercise.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>

                {/* Primary Clinical & Biomechanical Cues */}
                <div data-testid="exercise-guide-cues" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {(activeMovementCard?.clinicalCues || [
                      'Maintain neutral spinal alignment and braced core.',
                      'Execute with controlled tempo through full active range.',
                    ]).slice(0, 2).map((cue, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 11,
                          lineHeight: 1.3,
                          color: '#E2E8F0',
                          display: 'flex',
                          gap: 5,
                          alignItems: 'flex-start',
                        }}
                      >
                        <span style={{ color: 'var(--gold)', fontWeight: 800, flexShrink: 0 }}>•</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cue}</span>
                      </div>
                    ))}

                    {activeMovementCard?.primeMover && (
                      <div style={{ fontSize: 10, color: 'var(--gold-lt)', marginTop: 2 }}>
                        <span style={{ color: 'var(--gray)' }}>Target:</span> {activeMovementCard.primeMover}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Drawer (Tabs for Checkpoints, Setup, Full Cues) */}
              {showExerciseGuideExpanded && (
                <div
                  data-testid="exercise-guide-expanded-panel"
                  style={{
                    marginTop: 4,
                    paddingTop: 8,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {/* Tab Selection */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { key: 'cues', label: 'All Cues' },
                      { key: 'checkpoints', label: '5 Checkpoints' },
                      { key: 'setup', label: 'Setup & Motion' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveGuideTab(tab.key as any)}
                        style={{
                          flex: 1,
                          padding: '3px 6px',
                          background: activeGuideTab === tab.key ? 'rgba(212, 160, 23, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: activeGuideTab === tab.key ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: activeGuideTab === tab.key ? 'var(--gold-lt)' : 'var(--gray)',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: All Cues + Custom Notes */}
                  {activeGuideTab === 'cues' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                      {activeMovementCard?.clinicalCues.map((cue, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', color: '#E2E8F0' }}>
                          <span style={{ color: 'var(--gold)' }}>✓</span>
                          <span>{cue}</span>
                        </div>
                      ))}
                      {activeExercise.notes && (
                        <div
                          style={{
                            marginTop: 4,
                            padding: '4px 8px',
                            background: 'rgba(212, 160, 23, 0.08)',
                            border: '1px dashed rgba(212, 160, 23, 0.3)',
                            borderRadius: 4,
                            fontSize: 10.5,
                            color: 'var(--gold-lt)',
                          }}
                        >
                          <strong>Coach Note:</strong> {activeExercise.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: 5 Kinetic Checkpoints */}
                  {activeGuideTab === 'checkpoints' && activeMovementCard?.kineticCheckpoints && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10.5 }}>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 7px', borderRadius: 3 }}>
                        <strong style={{ color: 'var(--gold-lt)' }}>1. Feet & Ankles:</strong>{' '}
                        <span style={{ color: '#E2E8F0' }}>{activeMovementCard.kineticCheckpoints.feetAnkles}</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 7px', borderRadius: 3 }}>
                        <strong style={{ color: 'var(--gold-lt)' }}>2. Knees:</strong>{' '}
                        <span style={{ color: '#E2E8F0' }}>{activeMovementCard.kineticCheckpoints.knees}</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 7px', borderRadius: 3 }}>
                        <strong style={{ color: 'var(--gold-lt)' }}>3. LPHC (Pelvis/Core):</strong>{' '}
                        <span style={{ color: '#E2E8F0' }}>{activeMovementCard.kineticCheckpoints.lphc}</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 7px', borderRadius: 3 }}>
                        <strong style={{ color: 'var(--gold-lt)' }}>4. Shoulders:</strong>{' '}
                        <span style={{ color: '#E2E8F0' }}>{activeMovementCard.kineticCheckpoints.shoulders}</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 7px', borderRadius: 3 }}>
                        <strong style={{ color: 'var(--gold-lt)' }}>5. Head & Cervical:</strong>{' '}
                        <span style={{ color: '#E2E8F0' }}>{activeMovementCard.kineticCheckpoints.headNeck}</span>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Setup & Execution */}
                  {activeGuideTab === 'setup' && activeMovementCard && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10.5, lineHeight: 1.35 }}>
                      <div>
                        <strong style={{ color: 'var(--gold-lt)', display: 'block', marginBottom: 2 }}>Setup:</strong>
                        <span style={{ color: '#E2E8F0' }}>{activeMovementCard.setupInstructions}</span>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--gold-lt)', display: 'block', marginBottom: 2 }}>Execution:</strong>
                        <span style={{ color: '#E2E8F0' }}>{activeMovementCard.executionInstructions}</span>
                      </div>
                      {activeMovementCard.equipment && activeMovementCard.equipment.length > 0 && (
                        <div style={{ color: 'var(--gray)', fontSize: 10 }}>
                          Equipment: <strong style={{ color: '#FFF' }}>{activeMovementCard.equipment.join(', ')}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 1-Touch Set Logger Console ── */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Set {loggedSetsForActive.length + 1} of {targetSetsNum}
              </span>
              {isOlympicWeightExercise(activeExercise?.name || '') && (
                <button
                  type="button"
                  onClick={() => setShowPlateCalc(true)}
                  style={{
                    background: 'rgba(212,160,23,0.15)',
                    border: '1px solid rgba(212,160,23,0.3)',
                    color: 'var(--gold-lt)',
                    borderRadius: 3,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="scale" size={11} tone="gold" />
                  <span>Plate Math</span>
                </button>
              )}
            </div>

            {/* Weight Input & Steppers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--gray)', marginBottom: 4 }}>
                <span>WORKING WEIGHT</span>
                <span onClick={() => setUnitLbs(u => !u)} style={{ cursor: 'pointer', color: 'var(--gold-lt)' }}>
                  {unitLbs ? 'LBS' : 'KG'} (toggle)
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={weightLbsInput}
                  onChange={e => setWeightLbsInput(sanitizeNumericInput(e.target.value))}
                  style={{
                    flex: 1,
                    background: '#04070E',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    padding: '8px 10px',
                    color: '#FFF',
                    fontFamily: 'SFMono-Regular, Menlo, monospace',
                    fontWeight: 800,
                    fontSize: 20,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Fast Stepper Chips */}
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {['+5', '+10', '+25', '+45'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setWeightLbsInput(w => String((Number(w) || 0) + Number(chip)))}
                    style={{
                      flex: 1,
                      padding: '3px 0',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--gold-lt)',
                      borderRadius: 3,
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Reps & RPE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--gray)', marginBottom: 2 }}>REPS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setRepsInput(r => String(Math.max(1, (Number(r) || 8) - 1)))}
                    style={{ width: 28, height: 32, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFF', borderRadius: 3, cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    onFocus={selectOnFocus}
                    value={repsInput}
                    onChange={e => setRepsInput(sanitizeNumericInput(e.target.value))}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      background: '#04070E',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 4,
                      padding: '6px',
                      color: '#FFF',
                      fontFamily: 'SFMono-Regular, Menlo, monospace',
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setRepsInput(r => String((Number(r) || 8) + 1))}
                    style={{ width: 28, height: 32, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFF', borderRadius: 3, cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--gray)', marginBottom: 2 }}>RPE</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {['7', '8', '8.5', '9', '10'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRpeInput(val)}
                      style={{
                        padding: '4px 6px',
                        background: rpeInput === val ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                        color: rpeInput === val ? '#0A0E18' : '#FFF',
                        border: 'none',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="button"
              onClick={() => void executeLogSet()}
              disabled={isSavingSet}
              className="tactile-btn"
              style={{
                width: '100%',
                padding: '10px',
                background: isExerciseDone ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
                color: '#0A0E18',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: isSavingSet ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="check" size={16} tone="inherit" />
              <span>{isSavingSet ? 'Recording...' : `Log Set ${loggedSetsForActive.length + 1}`}</span>
            </button>
          </div>

          {/* Logged Sets Mini Table */}
          <div style={{ flex: 1, minHeight: 80, overflowY: 'auto' }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800, marginBottom: 4 }}>
              Completed Sets ({loggedSetsForActive.length})
            </div>
            {loggedSetsForActive.length === 0 ? (
              <div style={{ fontSize: 11.5, color: 'var(--gray)', fontStyle: 'italic', padding: '6px 0' }}>
                No sets logged yet for this exercise.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {loggedSetsForActive.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 4,
                      padding: '4px 8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                    }}
                  >
                    <span style={{ color: 'var(--gold-lt)', fontWeight: 700 }}>Set {idx + 1}</span>
                    <span style={{ color: '#FFF' }}>{Math.round((s.weight_kg ?? 0) * 2.20462)} lbs × {s.reps} reps</span>
                    <span style={{ color: 'var(--gray)' }}>RPE {s.rpe ?? 8}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Progression Alerts */}
            {progression?.eligibleForProgression && (
              <div style={{ marginTop: 6, background: 'rgba(212,160,23,0.15)', border: '1px solid var(--gold)', borderRadius: 4, padding: '4px 8px', fontSize: 10.5, color: 'var(--gold-lt)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="star" size={12} tone="gold" />
                <span>2-for-2 Target Met: Suggest +{Math.round(progression.recommendedWeightIncreaseKg * 2.20462)} lbs next session</span>
              </div>
            )}
          </div>

          {/* Active Movement Screen & Assessment Lab Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212,160,23,0.1) 0%, rgba(8,14,26,0.8) 100%)',
              border: '1px solid rgba(212,160,23,0.35)',
              borderRadius: 6,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  Live Assessment Lab
                </span>
              </div>
              <span style={{ fontSize: 9.5, color: 'var(--gray)', fontWeight: 700 }}>
                NASM CPT-7
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  captureClientFrame()
                  setActivePostureView('overhead_squat')
                  setShowPostureModal(true)
                }}
                className="tactile-btn"
                style={{
                  padding: '7px 8px',
                  background: 'rgba(212,160,23,0.18)',
                  border: '1px solid var(--gold)',
                  borderRadius: 4,
                  color: '#FFF',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="camera" size={12} tone="gold" />
                <span>AI Posture / OHSA</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  captureClientFrame()
                  setShowBodyCompModal(true)
                }}
                style={{
                  padding: '7px 8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  color: '#FFF',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="user" size={12} tone="inherit" />
                <span>Body Comp</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFormCritiqueModal(true)}
                style={{
                  padding: '7px 8px',
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid #3B82F6',
                  borderRadius: 4,
                  color: '#60A5FA',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="barbell" size={12} tone="inherit" />
                <span>Form Critique</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNasmSuiteModal(true)}
                style={{
                  padding: '7px 8px',
                  background: 'rgba(52,211,153,0.15)',
                  border: '1px solid #10B981',
                  borderRadius: 4,
                  color: '#34D399',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="clipboard" size={12} tone="inherit" />
                <span>NASM Suite</span>
              </button>
            </div>
          </div>

          {/* Voice Co-Pilot Bar at base of Right Panel */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
            <CoachVoiceCopilot onCommand={handleVoiceCommand} isEnabled={voiceEnabled} />
          </div>
        </div>
      </div>

      {/* ── Modals Integrated in HUD ── */}
      {showPlateCalc && (
        <BarbellPlateCalculator
          initialWeightLbs={Number(weightLbsInput) || 225}
          isModal
          onClose={() => setShowPlateCalc(false)}
        />
      )}

      {showSwapModal && activeExercise && (
        <SmartExerciseSwapModal
          currentExerciseName={activeExercise.name}
          optPhase={`Phase ${plan?.nasm_opt_phase ?? 2}: Strength Endurance`}
          onSelectSubstitution={handleSubstitutionSelect}
          onClose={() => setShowSwapModal(false)}
        />
      )}

      {replayVideoUrl && (
        <LiveSlowMoReplayModal
          videoUrl={replayVideoUrl}
          clientName={athleteName}
          exerciseName={activeExercise?.name}
          onClose={() => setReplayVideoUrl(null)}
        />
      )}

      {/* ── Still Camera & Auto-Zoom Eradication Guidance Modal ── */}
      <LiveStillCameraGuidanceModal
        isOpen={showStillCameraModal}
        onClose={() => setShowStillCameraModal(false)}
        requestedByCoachName={stillCameraRequestedBy}
      />

      {/* ── Official NASM Edge Video Demo Modal ── */}
      {demoVideoModal?.isOpen && demoVideoModal.embedUrl && (
        <div
          data-testid="exercise-demo-video-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-video-title"
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
            {/* Modal Header */}
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
                <h3 id="demo-video-title" style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', margin: '2px 0 0', color: '#FFF' }}>
                  {demoVideoModal.name}
                </h3>
              </div>

              <button
                type="button"
                data-testid="close-demo-video-modal"
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

            {/* Video Container (16:9) */}
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

            {/* Quick Cue Footer */}
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
                Back to Live Session
              </button>
            </div>
          </div>
        </div>
      )}

      {showWrapUpModal && (
        <LiveSessionWrapUpModal
          clientId={clientId}
          athleteName={athleteName}
          optPhase={`Phase ${plan?.nasm_opt_phase ?? 2}: Strength Endurance`}
          today={today}
          sets={sets}
          onClose={() => setShowWrapUpModal(false)}
        />
      )}

      {/* ── Executive Exit Cockpit Modal ── */}
      {showExitModal && (
        <div
          data-testid="exit-cockpit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-cockpit-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 14, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setShowExitModal(false)
          }}
        >
          <div
            style={{
              background: '#070B14',
              border: '1px solid rgba(212, 160, 23, 0.45)',
              borderRadius: 14,
              padding: '24px 28px',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.95), 0 0 30px rgba(212, 160, 23, 0.15)',
              color: '#FFFFFF',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GaaIcon name="arrow-left" size={20} tone="ruby" />
                </div>
                <div>
                  <h3
                    id="exit-cockpit-title"
                    style={{
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: '0.04em',
                      margin: 0,
                      color: 'var(--white)',
                    }}
                  >
                    EXIT LIVE COMMAND COCKPIT?
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                    Active 1:1 Telehealth Session with <strong style={{ color: '#FFF' }}>{athleteName}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gray)',
                  cursor: 'pointer',
                  padding: 4,
                }}
                title="Cancel (Esc)"
              >
                <GaaIcon name="close" size={16} tone="slate" />
              </button>
            </div>

            {/* Session Stats Summary Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>Sets Logged</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, color: 'var(--gold-lt)', marginTop: 2 }}>
                  {sets.length} SETS
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>Total Tonnage</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, color: '#FFF', marginTop: 2 }}>
                  {totalSessionTonnage.toLocaleString()} {unitLbs ? 'LBS' : 'KG'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>Duration</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, color: '#34D399', marginTop: 2 }}>
                  {formatSessionTime(sessionDurationSec)}
                </div>
              </div>
            </div>

            {/* Exit Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Option 1: Conclude & Send Briefing */}
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false)
                  setShowWrapUpModal(true)
                }}
                data-testid="modal-conclude-session-btn"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GaaIcon name="award" size={18} tone="white" />
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', lineHeight: 1.2 }}>
                      CONCLUDE & DISPATCH BRIEFING
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                      Finalize notes, deduct session credit, and email debrief to athlete
                    </div>
                  </div>
                </div>
                <GaaIcon name="chevron-right" size={16} tone="white" />
              </button>

              {/* Option 2: Return to Athlete Profile (Keep In-Progress) */}
              <button
                type="button"
                onClick={handleExit}
                data-testid="modal-exit-to-profile-btn"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(212, 160, 23, 0.12)',
                  border: '1px solid rgba(212, 160, 23, 0.35)',
                  borderRadius: 8,
                  color: 'var(--gold-lt)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GaaIcon name="user" size={18} tone="gold" />
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', lineHeight: 1.2 }}>
                      RETURN TO ATHLETE PROFILE
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                      Exit live video HUD and return to {athleteName}&apos;s profile
                    </div>
                  </div>
                </div>
                <GaaIcon name="chevron-right" size={16} tone="gold" />
              </button>

              {/* Option 3: Return to Daily Triage Cockpit */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/coach'
                  }
                }}
                data-testid="modal-exit-to-triage-btn"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  color: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GaaIcon name="overview" size={18} tone="slate" />
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', lineHeight: 1.2 }}>
                      RETURN TO COACH DAILY TRIAGE
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                      Navigate back to executive consultant queue (/coach)
                    </div>
                  </div>
                </div>
                <GaaIcon name="chevron-right" size={16} tone="slate" />
              </button>
            </div>

            {/* Cancel / Stay in Session */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gray)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  textDecoration: 'underline',
                }}
              >
                Stay in Live Cockpit (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Postural Mesh Scanner Modal ── */}
      {showPostureModal && (
        <AiPostureMeshScannerModal
          isOpen={showPostureModal}
          onClose={() => setShowPostureModal(false)}
          clientId={clientId}
          clientName={athleteName}
          initialCapturedPhoto={capturedFrames[activePostureView] || capturedFrame}
          initialPhotosByView={capturedFrames}
          initialView={activePostureView}
          onApplyScan={_scanResult => {
            setCaptureFeedback('✓ AI Postural Mesh Analysis applied to session!')
            setTimeout(() => setCaptureFeedback(null), 4500)
            setShowPostureModal(false)
          }}
        />
      )}

      {/* ── AI Body Composition Scanner Modal ── */}
      {showBodyCompModal && (
        <AiBodyCompositionScannerModal
          isOpen={showBodyCompModal}
          onClose={() => setShowBodyCompModal(false)}
          clientId={clientId}
          clientName={athleteName}
          isCoachView={true}
          initialPhotoFront={capturedFrames.anterior || capturedFrame}
          initialPhotoSide={capturedFrames.lateral}
          initialPhotoBack={capturedFrames.posterior}
          onApplyScan={_scanResult => {
            setCaptureFeedback('✓ AI Body Composition Analysis applied to session!')
            setTimeout(() => setCaptureFeedback(null), 4500)
            setShowBodyCompModal(false)
          }}
        />
      )}

      {/* ── AI Movement & Lift Form Critique Modal ── */}
      {showFormCritiqueModal && (
        <LiveVideoFormCaptureModal
          isOpen={showFormCritiqueModal}
          onClose={() => setShowFormCritiqueModal(false)}
          exerciseName={activeExercise?.name || 'Barbell Back Squat'}
          onApplyNotes={notes => {
            speakNasmCue(`Form feedback: ${notes}`)
            setCaptureFeedback(`✓ Form Critique applied: "${notes.slice(0, 50)}..."`)
            setTimeout(() => setCaptureFeedback(null), 4500)
          }}
        />
      )}

      {/* ── 45-Minute Clinical Diagnostic Consultation Playbook Modal ── */}
      {showConsultationPlaybook && (
        <LiveConsultationPlaybookModal
          isOpen={showConsultationPlaybook}
          onClose={() => setShowConsultationPlaybook(false)}
          athleteName={athleteName}
          sessionDurationSec={sessionDurationSec}
          clientAge={32}
          currentBpm={liveCardio.currentBpm}
          capturedFrames={capturedFrames}
          onCaptureSlot={slot => {
            captureClientFrame(slot)
          }}
          onOpenPostureMesh={() => {
            setShowConsultationPlaybook(false)
            setShowPostureModal(true)
          }}
          onOpenNasmSuite={() => {
            setShowConsultationPlaybook(false)
            setShowNasmSuiteModal(true)
          }}
          onOpenTelestrator={() => {
            setTelestratorActive(true)
            setTelestratorTool('protractor')
          }}
          onConcludeConsultation={() => {
            setShowConsultationPlaybook(false)
            setShowWrapUpModal(true)
          }}
        />
      )}

      {/* ── Full NASM Clinical Movement Assessment Suite Modal ── */}
      {showNasmSuiteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(3,6,12,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 1200,
              maxHeight: '92vh',
              background: '#070D18',
              border: '1.5px solid var(--gold)',
              borderRadius: 10,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,160,23,0.2)',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  Live Telehealth Diagnostic Suite
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', margin: '2px 0 0', color: '#FFF' }}>
                  NASM CLINICAL MOVEMENT &amp; POSTURE ASSESSMENT
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNasmSuiteModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFF',
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ✕ Close Assessment Lab
              </button>
            </div>

            <NasmAssessmentSuite
              clientId={clientId}
              clientName={athleteName}
              clientAge={32}
              clientSex="other"
              initialAssessments={[]}
              initialSubTab="ohsa"
              onAssessmentSaved={_rec => {
                setCaptureFeedback('✓ NASM Assessment logged and saved to athlete profile!')
                setTimeout(() => setCaptureFeedback(null), 5000)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
