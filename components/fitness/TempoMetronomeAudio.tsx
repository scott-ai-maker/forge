import { useState, useEffect, useRef, useCallback } from 'react'
import { playPrecisionTone } from '@/lib/web-audio-cadence-engine'
import { speakCoachVoiceCue, speakTempoCoachCue } from '@/lib/coach-voice-synthesizer'
import { triggerHaptic as triggerSharedHaptic } from '@/lib/offline-sync-queue'
import { GaaIcon } from '@/components/ui/GaaIcon'

export interface TempoPreset {
  id: string
  name: string
  nasmPhase: string
  eccentricSec: number
  isometricSec: number
  concentricSec: number
  description: string
}

export const NASM_TEMPO_PRESETS: TempoPreset[] = [
  {
    id: '4-2-1',
    name: '4-2-1 Stabilization Tempo',
    nasmPhase: 'Phase 1: Stabilization Endurance',
    eccentricSec: 4,
    isometricSec: 2,
    concentricSec: 1,
    description: '4s slow eccentric descent, 2s isometric hold at bottom, 1s concentric drive.',
  },
  {
    id: '2-0-2',
    name: '2-0-2 Strength & Hypertrophy',
    nasmPhase: 'Phase 2 & 3: Strength & Hypertrophy',
    eccentricSec: 2,
    isometricSec: 0,
    concentricSec: 2,
    description: '2s lowering, 0s pause, 2s controlled ascent for maximum mechanical tension.',
  },
  {
    id: '3-1-1',
    name: '3-1-1 Eccentric Overload',
    nasmPhase: 'Phase 3: Hypertrophy & Motor Control',
    eccentricSec: 3,
    isometricSec: 1,
    concentricSec: 1,
    description: '3s slow lowering, 1s bottom stretch pause, 1s powerful drive.',
  },
  {
    id: '1-1-1',
    name: '1-1-1 Maximal Strength',
    nasmPhase: 'Phase 4: Maximal Strength',
    eccentricSec: 1,
    isometricSec: 1,
    concentricSec: 1,
    description: '1s explosive lift, 1s lockout, 1s controlled descent.',
  },
  {
    id: 'explosive',
    name: 'X-0-X Power & Explosive',
    nasmPhase: 'Phase 5: Power Complex',
    eccentricSec: 1,
    isometricSec: 0,
    concentricSec: 1,
    description: 'Maximal rate of force development (RFD) and explosive acceleration.',
  },
]

export function normalizeTempoId(tempoStr?: string | null): string {
  if (!tempoStr) return '4-2-1'
  const clean = tempoStr.trim().toLowerCase().replace(/\//g, '-').replace(/\s+/g, '')
  if (clean.includes('4-2-1') || clean === '421') return '4-2-1'
  if (clean.includes('2-0-2') || clean === '202') return '2-0-2'
  if (clean.includes('3-1-1') || clean === '311') return '3-1-1'
  if (clean.includes('1-1-1') || clean === '111') return '1-1-1'
  if (clean.includes('x') || clean.includes('power') || clean.includes('exp')) return 'explosive'
  return '2-0-2'
}

type MovementPhase = 'idle' | 'pre_exercise_countdown' | 'eccentric' | 'isometric' | 'concentric'

interface TempoMetronomeAudioProps {
  initialTempoId?: string
  targetReps?: number
  exerciseName?: string
  initialPreCountSec?: number
  onClose?: () => void
  isModal?: boolean
}

export default function TempoMetronomeAudio({
  initialTempoId = '4-2-1',
  targetReps = 10,
  exerciseName,
  initialPreCountSec = 5,
  onClose,
  isModal = false,
}: TempoMetronomeAudioProps) {
  const normalizedId = normalizeTempoId(initialTempoId)
  const [selectedTempoId, setSelectedTempoId] = useState<string>(normalizedId)
  const [repsGoal, setRepsGoal] = useState<number>(targetReps)
  const [preCountSec, setPreCountSec] = useState<number>(initialPreCountSec)
  const [currentRep, setCurrentRep] = useState<number>(0)
  const [currentPhase, setCurrentPhase] = useState<MovementPhase>('idle')
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  const activePreset = NASM_TEMPO_PRESETS.find(p => p.id === selectedTempoId) || NASM_TEMPO_PRESETS[0]

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Web Audio synth tone
  const playTone = useCallback((freq: number, duration = 0.12, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return
    playPrecisionTone({ freq, duration, type })
  }, [soundEnabled])

  // Speech synthesis voice announcement
  const speakCue = useCallback((text: string, options?: { pitch?: number; rate?: number }) => {
    if (!voiceEnabled) return
    speakCoachVoiceCue(text, { rate: options?.rate ?? 1.10, pitch: options?.pitch ?? 0.92 })
  }, [voiceEnabled])

  // Haptic feedback (native Taptic Engine on iOS/Android, Web Vibration on browser)
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (Array.isArray(pattern) && pattern.length > 2) {
      triggerSharedHaptic('timer')
    } else if (Array.isArray(pattern) || (typeof pattern === 'number' && pattern > 50)) {
      triggerSharedHaptic('heavy')
    } else {
      triggerSharedHaptic('tap')
    }
  }, [])

  const stopCadence = useCallback(() => {
    setIsRunning(false)
    setCurrentPhase('idle')
    setCurrentRep(0)
    setPhaseSecondsRemaining(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const startCadence = useCallback(() => {
    setIsRunning(true)

    if (preCountSec > 0) {
      // Begin 5-Second (or configured) Pre-Exercise Count
      setCurrentPhase('pre_exercise_countdown')
      setCurrentRep(0)
      setPhaseSecondsRemaining(preCountSec)

      playTone(523.25, 0.16, 'triangle') // C5
      triggerHaptic(50)
      speakTempoCoachCue({
        phase: 'pre_exercise_countdown',
        secondsRemaining: preCountSec,
        exerciseName,
      })
    } else {
      // Immediate start
      setCurrentRep(1)
      setCurrentPhase('eccentric')
      setPhaseSecondsRemaining(activePreset.eccentricSec)

      playTone(440, 0.15)
      triggerHaptic(40)
      speakCue(`Rep 1. Control down...`, { rate: 1.12 })
    }
  }, [activePreset, preCountSec, exerciseName, playTone, speakCue, triggerHaptic])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setPhaseSecondsRemaining(prev => {
        // ── 1. PRE-EXERCISE COUNTDOWN PHASE (5, 4, 3, 2, 1, GO!) ──
        if (currentPhase === 'pre_exercise_countdown') {
          if (prev > 1) {
            const nextSec = prev - 1
            if (nextSec === 4) {
              playTone(523.25, 0.12, 'triangle')
              triggerHaptic(40)
            } else if (nextSec === 3) {
              playTone(587.33, 0.12, 'triangle')
              speakTempoCoachCue({ phase: 'pre_exercise_countdown', secondsRemaining: 3 })
              triggerHaptic(40)
            } else if (nextSec === 2) {
              playTone(659.25, 0.12, 'triangle')
              speakTempoCoachCue({ phase: 'pre_exercise_countdown', secondsRemaining: 2 })
              triggerHaptic(40)
            } else if (nextSec === 1) {
              playTone(783.99, 0.18, 'triangle')
              speakTempoCoachCue({ phase: 'pre_exercise_countdown', secondsRemaining: 1 })
              triggerHaptic(60)
            }
            return nextSec
          }

          // Countdown reached 0 -> Launch Rep 1 Eccentric
          setCurrentPhase('eccentric')
          setCurrentRep(1)
          playTone(880, 0.28, 'sine') // High A5
          triggerHaptic([80, 40, 80])
          speakCue('Go! Rep 1. Control down...', { rate: 1.12 })
          return activePreset.eccentricSec
        }

        // ── 2. ACTIVE REPETITION MOVEMENT CADENCE ──
        if (prev > 1) {
          playTone(480, 0.08)
          if (activePreset.eccentricSec >= 3 && currentPhase === 'eccentric') {
            speakTempoCoachCue({ phase: 'eccentric', secondsRemaining: prev - 1 })
          }
          return prev - 1
        }

        // Transition phases
        if (currentPhase === 'eccentric') {
          if (activePreset.isometricSec > 0) {
            setCurrentPhase('isometric')
            playTone(660, 0.15)
            triggerHaptic(60)
            speakTempoCoachCue({ phase: 'isometric' })
            return activePreset.isometricSec
          } else {
            setCurrentPhase('concentric')
            playTone(980, 0.2, 'triangle')
            triggerHaptic([80, 30, 80])
            speakTempoCoachCue({ phase: 'concentric' })
            return activePreset.concentricSec
          }
        } else if (currentPhase === 'isometric') {
          setCurrentPhase('concentric')
          playTone(980, 0.2, 'triangle')
          triggerHaptic([80, 30, 80])
          speakTempoCoachCue({ phase: 'concentric' })
          return activePreset.concentricSec
        } else if (currentPhase === 'concentric') {
          if (currentRep >= repsGoal) {
            stopCadence()
            playTone(1046, 0.4, 'sine')
            speakTempoCoachCue({ phase: 'complete', repNumber: currentRep, totalReps: repsGoal })
            triggerHaptic([100, 50, 100, 50, 150])
            return 0
          } else {
            const nextRep = currentRep + 1
            setCurrentRep(nextRep)
            setCurrentPhase('eccentric')
            playTone(440, 0.15)
            triggerHaptic(40)
            speakCue(`Rep ${nextRep}. Lower.`, { rate: 1.12 })
            return activePreset.eccentricSec
          }
        }
        return 0
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, currentPhase, currentRep, repsGoal, activePreset, playTone, speakCue, triggerHaptic, stopCadence])

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'pre_exercise_countdown':
        return '#F59E0B' // Amber / Gold (Get Ready Setup)
      case 'eccentric':
        return '#3B82F6' // Blue (Lowering)
      case 'isometric':
        return '#EAB308' // Yellow (Holding)
      case 'concentric':
        return '#10B981' // Green (Exploding)
      default:
        return 'var(--gold)'
    }
  }

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'pre_exercise_countdown':
        return 'GET READY — PRE-EXERCISE SETUP'
      case 'eccentric':
        return 'ECCENTRIC (LOWERING)'
      case 'isometric':
        return 'ISOMETRIC (HOLDING)'
      case 'concentric':
        return 'CONCENTRIC (DRIVING)'
      default:
        return 'READY TO START'
    }
  }

  const content = (
    <div
      style={{
        background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
        border: '1px solid rgba(212,160,23,0.35)',
        borderRadius: 12,
        padding: 'clamp(16px, 3.5vw, 24px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        boxShadow: isModal ? '0 25px 60px rgba(0,0,0,0.85)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              NASM OPT™ Audio Coach
            </span>
            {exerciseName && (
              <span style={{ fontSize: 11, background: 'rgba(212,160,23,0.18)', border: '1px solid rgba(212,160,23,0.4)', color: 'var(--gold-lt)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="dumbbell" size={11} tone="gold" /> {exerciseName}
              </span>
            )}
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, margin: '4px 0 0', color: '#FFFFFF', letterSpacing: '0.04em', fontWeight: 700 }}>
            TEMPO CADENCE &amp; METRONOME
          </h3>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Preset Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        {NASM_TEMPO_PRESETS.map(preset => {
          const isSelected = selectedTempoId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              disabled={isRunning}
              onClick={() => setSelectedTempoId(preset.id)}
              style={{
                background: isSelected ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 10px',
                textAlign: 'left',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                opacity: isRunning && !isSelected ? 0.4 : 1,
              }}
            >
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 16, fontWeight: 700, color: isSelected ? 'var(--gold-lt)' : '#FFF' }}>
                {preset.id}
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {preset.name}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Main Pulsing Tempo HUD Display ── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: `1.5px solid ${getPhaseColor()}`,
          borderRadius: 12,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          boxShadow: isRunning ? `0 0 32px ${getPhaseColor()}30` : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: getPhaseColor(),
            textAlign: 'center',
          }}
        >
          {getPhaseLabel()}
        </span>

        {/* Big Counter */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 62,
              fontWeight: 700,
              color: currentPhase === 'pre_exercise_countdown' ? 'var(--gold-lt)' : '#FFFFFF',
              lineHeight: 1,
              textShadow: currentPhase === 'pre_exercise_countdown' ? '0 0 20px rgba(212,160,23,0.6)' : 'none',
            }}
          >
            {isRunning
              ? phaseSecondsRemaining
              : `${activePreset.eccentricSec}-${activePreset.isometricSec}-${activePreset.concentricSec}`}
          </div>
          {isRunning && (
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14, color: 'var(--gray)', fontWeight: 700 }}>
              SEC
            </span>
          )}
        </div>

        {/* Status Cue & Rep Counter */}
        {currentPhase === 'pre_exercise_countdown' ? (
          <div
            style={{
              background: 'rgba(212,160,23,0.18)',
              border: '1px solid rgba(212,160,23,0.45)',
              borderRadius: 20,
              padding: '5px 18px',
              fontSize: 12,
              color: 'var(--gold-lt)',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Position Setup & Core Brace · {phaseSecondsRemaining}s to Rep 1
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '4px 16px',
              fontSize: 13,
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            {isRunning ? `Rep ${currentRep} of ${repsGoal}` : `${repsGoal} Target Reps · ${activePreset.description}`}
          </div>
        )}
      </div>

      {/* Pre-Exercise Count & Target Reps Config */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Pre-Exercise Count Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <GaaIcon name="watch" size={12} tone="gold" /> Pre-Count:
          </span>
          {[5, 3, 0].map(sec => (
            <button
              key={sec}
              type="button"
              disabled={isRunning}
              onClick={() => setPreCountSec(sec)}
              style={{
                background: preCountSec === sec ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: preCountSec === sec ? '#0A0E18' : '#FFF',
                borderRadius: 4,
                padding: '4px 8px',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 11,
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              {sec === 0 ? 'Instant' : `${sec}s Prep`}
            </button>
          ))}
        </div>

        {/* Target Reps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>
            Reps:
          </span>
          {[6, 8, 10, 12, 15].map(r => (
            <button
              key={r}
              type="button"
              disabled={isRunning}
              onClick={() => setRepsGoal(r)}
              style={{
                background: repsGoal === r ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: repsGoal === r ? '#0A0E18' : '#FFF',
                borderRadius: 4,
                padding: '4px 8px',
                fontFamily: 'var(--font-telemetry, monospace)',
                fontWeight: 700,
                fontSize: 13,
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Voice & Beep Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setVoiceEnabled(v => !v)}
            style={{
              background: voiceEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              border: voiceEnabled ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              color: voiceEnabled ? '#34D399' : 'var(--gray)',
              borderRadius: 4,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="speech" size={12} tone={voiceEnabled ? 'emerald' : 'slate'} />
            Voice {voiceEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(s => !s)}
            style={{
              background: soundEnabled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              border: soundEnabled ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
              color: soundEnabled ? '#60A5FA' : 'var(--gray)',
              borderRadius: 4,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="bell" size={12} tone={soundEnabled ? 'cyan' : 'slate'} />
            Beeps {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <span style={{ fontSize: 10.5, color: 'var(--gray)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <GaaIcon name="lightning" size={11} tone="slate" />
          {preCountSec > 0 ? `${preCountSec}s countdown allows stable setup & brace` : 'Starts cadence immediately'}
        </span>
      </div>

      {/* Start / Stop Trigger CTA */}
      <div>
        {isRunning ? (
          <button
            type="button"
            onClick={stopCadence}
            style={{
              width: '100%',
              padding: '14px',
              background: '#DC2626',
              border: 'none',
              borderRadius: 6,
              color: '#FFFFFF',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              textTransform: 'uppercase',
              fontSize: 14,
              letterSpacing: '0.08em',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(220,38,38,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <GaaIcon name="stop" size={16} tone="white" />
            STOP TEMPO CADENCE
          </button>
        ) : (
          <button
            type="button"
            onClick={startCadence}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
              border: 'none',
              borderRadius: 6,
              color: '#0A0E18',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              textTransform: 'uppercase',
              fontSize: 14,
              letterSpacing: '0.08em',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(212,160,23,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <GaaIcon name="play" size={16} tone="dark" />
            START {activePreset.id} CADENCE ({preCountSec > 0 ? `${preCountSec}s PREP COUNT` : 'INSTANT'})
          </button>
        )}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, width: '100%' }}>
          {content}
        </div>
      </div>
    )
  }

  return content
}
