'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { syncActivityToAppleHealth } from '@/lib/native-healthkit-bridge'
import { playPrecisionTone } from '@/lib/web-audio-cadence-engine'

export type MindfulProtocolId = '4-7-8' | 'box' | '5-5' | 'stillness'

export interface MindfulProtocolConfig {
  id: MindfulProtocolId
  name: string
  subtitle: string
  description: string
  benefits: string
  phases: Array<{
    type: 'inhale' | 'hold-in' | 'exhale' | 'hold-out'
    duration: number
    label: string
    cue: string
    color: string
  }>
  defaultDurationMinutes: number
}

export const MINDFUL_PROTOCOLS: Record<MindfulProtocolId, MindfulProtocolConfig> = {
  '4-7-8': {
    id: '4-7-8',
    name: '4-7-8 Parasympathetic Reset',
    subtitle: 'Vagal Nerve Activation & Cortisol Suppression',
    description: 'Inhale 4s through nose, hold 7s, exhale 8s with gentle whoosh sound.',
    benefits: 'Rapidly lowers heart rate, down-regulates sympathetic tone, restores blood pressure post-workout.',
    phases: [
      { type: 'inhale', duration: 4, label: 'INHALE', cue: 'Inhale deeply through nose, expand belly', color: '#60A5FA' },
      { type: 'hold-in', duration: 7, label: 'HOLD', cue: 'Gently hold breath, relax shoulders and jaw', color: '#A78BFA' },
      { type: 'exhale', duration: 8, label: 'EXHALE', cue: 'Release slowly through mouth with soft whoosh', color: '#34D399' },
    ],
    defaultDurationMinutes: 3,
  },
  box: {
    id: 'box',
    name: '4-4-4-4 Box Breathing',
    subtitle: 'Navy SEAL Autonomic Equilibrium & Focus',
    description: 'Equal 4s inhale, 4s hold, 4s exhale, 4s pause.',
    benefits: 'Balances sympathetic and parasympathetic branches, sharpens cognitive composure, stabilizes heart rate.',
    phases: [
      { type: 'inhale', duration: 4, label: 'INHALE', cue: 'Inhale smoothly through nose for 4 seconds', color: '#60A5FA' },
      { type: 'hold-in', duration: 4, label: 'HOLD', cue: 'Hold lungs comfortably full with calm posture', color: '#A78BFA' },
      { type: 'exhale', duration: 4, label: 'EXHALE', cue: 'Exhale steadily through mouth for 4 seconds', color: '#34D399' },
      { type: 'hold-out', duration: 4, label: 'PAUSE', cue: 'Pause lungs empty, feeling stillness', color: '#F59E0B' },
    ],
    defaultDurationMinutes: 3,
  },
  '5-5': {
    id: '5-5',
    name: '5-5 Coherent Breathing',
    subtitle: 'Optimal Heart Rate Variability (HRV) Resonance',
    description: 'Equal 5s inhale and 5s exhale (6 breaths per minute).',
    benefits: 'Maximizes cardiovascular resonance, synchronizes baroreflex with respiration, peak recovery state.',
    phases: [
      { type: 'inhale', duration: 5, label: 'INHALE', cue: 'Inhale smoothly and rhythmically for 5s', color: '#60A5FA' },
      { type: 'exhale', duration: 5, label: 'EXHALE', cue: 'Exhale softly and steadily for 5s', color: '#34D399' },
    ],
    defaultDurationMinutes: 5,
  },
  stillness: {
    id: 'stillness',
    name: 'Mindful Stillness & Body Scan',
    subtitle: 'Quiet Somatic Grounding & Meditation',
    description: 'Silent meditation and conscious breath observation.',
    benefits: 'Promotes neuroplastic down-regulation, mental decompression, and full-body systemic restoration.',
    phases: [
      { type: 'inhale', duration: 10, label: 'BREATHE', cue: 'Breathe naturally. Scan body from head to toe, releasing residual tension.', color: '#38BDF8' },
    ],
    defaultDurationMinutes: 5,
  },
}

export interface MindfulMomentModalProps {
  isOpen: boolean
  onClose: () => void
  initialProtocol?: MindfulProtocolId
  initialDurationMinutes?: number
  athleteName?: string
  sourceContext?: 'cooldown-flow' | 'strength-flow' | 'cardio-flow' | 'standalone'
  onCompleted?: (result: { protocol: MindfulProtocolId; minutes: number }) => void
  onFlowToCardio?: () => void
}

export default function MindfulMomentModal({
  isOpen,
  onClose,
  initialProtocol = '4-7-8',
  initialDurationMinutes,
  athleteName = 'Athlete',
  sourceContext = 'standalone',
  onCompleted,
  onFlowToCardio,
}: MindfulMomentModalProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<MindfulProtocolId>(initialProtocol)
  const protocolConfig = MINDFUL_PROTOCOLS[selectedProtocol]

  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialDurationMinutes || protocolConfig.defaultDurationMinutes || 3
  )
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [hasStarted, setHasStarted] = useState<boolean>(false)
  const [phaseIndex, setPhaseIndex] = useState<number>(0)
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(protocolConfig.phases[0].duration)
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0)
  const [completedCycles, setCompletedCycles] = useState<number>(0)
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const [isAudioChimeEnabled, setIsAudioChimeEnabled] = useState<boolean>(true)
  const [appleHealthSyncState, setAppleHealthSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [syncFeedbackMessage, setSyncFeedbackMessage] = useState<string>('')

  const targetTotalSeconds = durationMinutes * 60
  const activePhase = protocolConfig.phases[phaseIndex] || protocolConfig.phases[0]

  // Play peaceful chime using Web Audio API
  const playMindfulChime = useCallback((phaseType: string) => {
    if (!isAudioChimeEnabled) return
    const freq = phaseType === 'inhale' ? 528 : phaseType === 'exhale' ? 432 : 480
    playPrecisionTone({
      freq,
      duration: 0.45,
      type: 'sine',
      gainPeak: 0.16,
    })
  }, [isAudioChimeEnabled])

  // Reset internal states when switching protocols
  const handleSelectProtocol = (id: MindfulProtocolId) => {
    if (isPlaying) return
    setSelectedProtocol(id)
    const cfg = MINDFUL_PROTOCOLS[id]
    setDurationMinutes(cfg.defaultDurationMinutes)
    setPhaseIndex(0)
    setPhaseSecondsRemaining(cfg.phases[0].duration)
    setTotalSecondsElapsed(0)
    setCompletedCycles(0)
    setIsFinished(false)
    setHasStarted(false)
  }

  // Handle session completion & Apple Health logging
  const handleFinishSession = useCallback(async () => {
    setIsPlaying(false)
    setIsFinished(true)

    // Final congratulatory harmonic chime
    if (isAudioChimeEnabled) {
      playPrecisionTone({ freq: 528, duration: 0.7, type: 'sine', gainPeak: 0.2 })
    }

    const completedMins = Math.max(1, Math.round(totalSecondsElapsed / 60))
    onCompleted?.({ protocol: selectedProtocol, minutes: completedMins })

    // Sync to Apple Health Mindful Minutes
    setAppleHealthSyncState('syncing')
    try {
      const syncRes = await syncActivityToAppleHealth({
        type: 'mindfulness',
        durationMinutes: completedMins,
        notes: `AI Coach Gordon Mindful Moment: ${protocolConfig.name} (${completedMins} min session)`,
      })

      if (syncRes.synced) {
        setAppleHealthSyncState('synced')
        setSyncFeedbackMessage(
          syncRes.source === 'native-healthkit'
            ? `Logged ${completedMins} Mindful Minutes to Apple Health`
            : `Logged ${completedMins} Mindful Minutes to Wearable Log`
        )
      } else {
        setAppleHealthSyncState('synced')
        setSyncFeedbackMessage(`Mindful session completed (${completedMins} min)`)
      }
    } catch {
      setAppleHealthSyncState('synced')
      setSyncFeedbackMessage(`Session recorded (${completedMins} min)`)
    }
  }, [isAudioChimeEnabled, totalSecondsElapsed, onCompleted, selectedProtocol, protocolConfig.name])

  // Main countdown timer ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isPlaying && !isFinished) {
      interval = setInterval(() => {
        setTotalSecondsElapsed(prevTotal => {
          const nextTotal = prevTotal + 1
          if (nextTotal >= targetTotalSeconds) {
            void handleFinishSession()
            return targetTotalSeconds
          }
          return nextTotal
        })

        setPhaseSecondsRemaining(prevSec => {
          if (prevSec > 1) {
            return prevSec - 1
          }

          // Advance phase
          const nextIdx = (phaseIndex + 1) % protocolConfig.phases.length
          setPhaseIndex(nextIdx)
          if (nextIdx === 0) {
            setCompletedCycles(c => c + 1)
          }

          const nextPhase = protocolConfig.phases[nextIdx]
          playMindfulChime(nextPhase.type)
          return nextPhase.duration
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, isFinished, phaseIndex, protocolConfig.phases, targetTotalSeconds, handleFinishSession, playMindfulChime])

  if (!isOpen) return null

  // Calculate breathing circle scale
  const circleScale = !hasStarted || !isPlaying || isFinished
    ? 1
    : activePhase.type === 'inhale'
      ? 1.35
      : activePhase.type === 'hold-in'
        ? 1.35
        : activePhase.type === 'hold-out'
          ? 0.75
          : 0.8

  const progressPercent = Math.min(100, Math.round((totalSecondsElapsed / targetTotalSeconds) * 100))
  const remainingTotalSecs = Math.max(0, targetTotalSeconds - totalSecondsElapsed)
  const remM = Math.floor(remainingTotalSecs / 60).toString().padStart(2, '0')
  const remS = (remainingTotalSecs % 60).toString().padStart(2, '0')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mindful Moment Cooldown"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 10, 20, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 100003,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(8px, 3vw, 24px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'linear-gradient(180deg, #0D172A 0%, #080D1A 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.15)',
          color: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🧘</span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: '#38BDF8',
                  lineHeight: 1.1,
                }}
              >
                MINDFUL MOMENT &amp; PARASYMPATHETIC RESET
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Apple Health Mindful Minutes Sync · Autonomic Recovery
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mindful Moment"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94A3B8',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Protocol Switcher (Disabled while active session is running) */}
          {!hasStarted && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Nervous System Protocol
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {Object.values(MINDFUL_PROTOCOLS).map(proto => {
                  const isSelected = proto.id === selectedProtocol
                  return (
                    <button
                      key={proto.id}
                      type="button"
                      onClick={() => handleSelectProtocol(proto.id)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: isSelected ? '#38BDF8' : '#F1F5F9' }}>
                        {proto.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>
                        {proto.subtitle}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Duration Selector (Pre-session) */}
          {!hasStarted && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Duration
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[2, 3, 5, 10].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      background: durationMinutes === mins ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: durationMinutes === mins ? '1px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: durationMinutes === mins ? '#D4AF37' : '#94A3B8',
                      cursor: 'pointer',
                    }}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Central Animated Breathing Pacer Orb */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 0 16px',
              position: 'relative',
            }}
          >
            {/* Ambient Aura */}
            <div
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${activePhase.color}30 0%, transparent 70%)`,
                pointerEvents: 'none',
                transition: 'all 1s ease',
              }}
            />

            {/* Expanding/Contracting Breathing Ring */}
            <div
              style={{
                width: 170,
                height: 170,
                borderRadius: '50%',
                border: `3px solid ${activePhase.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${circleScale})`,
                transition: `transform ${activePhase.duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                background: 'radial-gradient(circle, rgba(13, 27, 42, 0.95) 0%, rgba(5, 10, 20, 0.98) 100%)',
                boxShadow: `0 0 25px ${activePhase.color}40, inset 0 0 20px ${activePhase.color}25`,
                zIndex: 2,
              }}
            >
              {isFinished ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32 }}>✨</div>
                  <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: '#34D399', letterSpacing: '0.05em' }}>
                    RESTORED
                  </div>
                </div>
              ) : !hasStarted ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>🌬️</div>
                  <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: '#38BDF8', letterSpacing: '0.05em' }}>
                    READY
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontSize: 'clamp(18px, 4.5vw, 22px)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: activePhase.color,
                      lineHeight: 1,
                    }}
                  >
                    {activePhase.label}
                  </div>
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                      color: '#FFFFFF',
                      lineHeight: 1.1,
                      marginTop: 2,
                    }}
                  >
                    {phaseSecondsRemaining}
                  </div>
                </div>
              )}
            </div>

            {/* Instruction Cue Below Circle */}
            <div
              style={{
                marginTop: 18,
                textAlign: 'center',
                minHeight: 38,
                maxWidth: 420,
                fontSize: 12.5,
                fontWeight: 600,
                color: '#CBD5E1',
                lineHeight: 1.4,
              }}
            >
              {isFinished
                ? 'Parasympathetic recovery achieved. Cortisol suppressed, autonomic equilibrium restored.'
                : hasStarted
                  ? activePhase.cue
                  : protocolConfig.description}
            </div>
          </div>

          {/* Time & Cycle Indicators */}
          {hasStarted && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                <span>Remaining: <strong style={{ color: '#FFFFFF' }}>{remM}:{remS}</strong></span>
                <span>Cycles Completed: <strong style={{ color: '#38BDF8' }}>{completedCycles}</strong></span>
              </div>
              <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #38BDF8 0%, #34D399 100%)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Apple Health Sync Feedback Badge */}
          {appleHealthSyncState === 'synced' && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#34D399',
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: 18 }}>🍎</span>
              <span>{syncFeedbackMessage}</span>
            </div>
          )}

          {/* Sound Chime Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <span style={{ fontSize: 11, color: '#64748B' }}>Acoustic Chime Cues</span>
            <button
              type="button"
              onClick={() => setIsAudioChimeEnabled(!isAudioChimeEnabled)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isAudioChimeEnabled ? '#38BDF8' : '#64748B',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>{isAudioChimeEnabled ? '🔔 Chimes On' : '🔕 Chimes Muted'}</span>
            </button>
          </div>
        </div>

        {/* Pinned Bottom Control Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isFinished ? (
            <button
              type="button"
              onClick={onClose}
              className="tactile-btn"
              style={{
                background: '#10B981',
                color: '#0A0E18',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 12.5,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Done &amp; Logged
            </button>
          ) : !hasStarted ? (
            <button
              type="button"
              onClick={() => {
                setHasStarted(true)
                setIsPlaying(true)
                playMindfulChime('inhale')
              }}
              className="tactile-btn"
              style={{
                width: '100%',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                color: '#0A0E18',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)',
              }}
            >
              <GaaIcon name="play" size={16} tone="dark" />
              <span>BEGIN MINDFUL RESET ({durationMinutes} MIN)</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </button>

              <button
                type="button"
                onClick={() => void handleFinishSession()}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38BDF8',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Complete Early &amp; Sync
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

