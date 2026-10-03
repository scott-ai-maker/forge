'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { speakCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import type { AssessmentCaptureSlot } from './UnifiedLiveStudioHud'

export interface ConsultationGateMeta {
  gateNumber: number
  title: string
  shortTitle: string
  minuteRange: string
  startMinute: number
  endMinute: number
  clinicalObjective: string
  keyCues: string[]
  recommendedActionLabel: string
}

export const CONSULTATION_PLAYBOOK_GATES: ConsultationGateMeta[] = [
  {
    gateNumber: 1,
    title: 'Gate 1: CNS Readiness & Allostatic Triage',
    shortTitle: '1. CNS Triage',
    minuteRange: '0:00 – 8:00',
    startMinute: 0,
    endMinute: 8,
    clinicalObjective: 'PAR-Q+ clearance, sleep architecture review, and baseline allostatic load scoring.',
    keyCues: [
      'Inquire about travel velocity and time zone shifts over past 72 hours.',
      'Check resting HRV trend and central nervous system readiness.',
      'Confirm zero acute contraindications for dynamic movement screens.',
    ],
    recommendedActionLabel: 'Log CNS Clearance',
  },
  {
    gateNumber: 2,
    title: 'Gate 2: Static Gravitational Mesh Screen',
    shortTitle: '2. Static Mesh',
    minuteRange: '8:00 – 18:00',
    startMinute: 8,
    endMinute: 18,
    clinicalObjective: 'Capture 3-view static postural alignment along true gravitational vertical plumb line.',
    keyCues: [
      'Prompt client to align feet hip-width with neutral anatomical gaze.',
      'Snap Anterior (Q-angle, shoulder height), Lateral (plumb line, pelvic tilt), Posterior (calcaneal eversion).',
      'Run AI Postural Mesh scanner on captured views.',
    ],
    recommendedActionLabel: 'Capture Static Views',
  },
  {
    gateNumber: 3,
    title: 'Gate 3: Dynamic Overhead Squat Assessment (OHSA)',
    shortTitle: '3. Dynamic OHSA',
    minuteRange: '18:00 – 30:00',
    startMinute: 18,
    endMinute: 30,
    clinicalObjective: '5 reps anterior, lateral, posterior. Identify kinetic chain compensations & 2-for-2 thresholds.',
    keyCues: [
      'Instruct thumbs up, arms fully extended overhead at 4/2/1 tempo.',
      'Observe knee valgus (adductor complex/TFL overactivity vs glute medius underactivity).',
      'Evaluate forward torso lean, arms falling forward, and asymmetrical weight shifts.',
    ],
    recommendedActionLabel: 'Open OHSA Lab',
  },
  {
    gateNumber: 4,
    title: 'Gate 4: Metabolic Base & Cardiorespiratory Calibration',
    shortTitle: '4. Metabolic Base',
    minuteRange: '30:00 – 38:00',
    startMinute: 30,
    endMinute: 38,
    clinicalObjective: 'Calibrate Zone 2 aerobic threshold, Tanaka maximum heart rate, and HRV recovery kinetics.',
    keyCues: [
      'Assess 2-minute step recovery heart rate or aerobic baseline.',
      'Establish Zone 2 target heart rate range (60-70% HR max).',
      'Verify wearable sync (Apple Watch, WHOOP, Oura, Garmin).',
    ],
    recommendedActionLabel: 'Calibrate Zone 2',
  },
  {
    gateNumber: 5,
    title: 'Gate 5: Master Periodization Allocation & Prescription',
    shortTitle: '5. Prescription',
    minuteRange: '38:00 – 45:00',
    startMinute: 38,
    endMinute: 45,
    clinicalObjective: 'Prescribe NASM-OPT Phase allocation, weekly microcycle frequency, and generate SOAP memo.',
    keyCues: [
      'Deliver diagnostic findings with Clinical Aristocracy authority.',
      'Prescribe target OPT phase (Stabilization, Strength Endurance, Hypertrophy).',
      'Lock in weekly live check-in slot and conclude boardroom consultation.',
    ],
    recommendedActionLabel: 'Conclude & Sign SOAP Memo',
  },
]

export function computeConsultationGate(sessionDurationSec: number): number {
  const minutes = sessionDurationSec / 60
  if (minutes < 8) return 1
  if (minutes < 18) return 2
  if (minutes < 30) return 3
  if (minutes < 38) return 4
  return 5
}

export function formatConsultationCountdown(sessionDurationSec: number): {
  formattedRemaining: string
  isOvertime: boolean
  remainingSec: number
} {
  const totalConsultationSec = 45 * 60
  const remaining = totalConsultationSec - sessionDurationSec
  const isOvertime = remaining < 0
  const absRemaining = Math.abs(remaining)
  const mins = Math.floor(absRemaining / 60)
  const secs = absRemaining % 60
  const formatted = `${isOvertime ? '+' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  return {
    formattedRemaining: formatted,
    isOvertime,
    remainingSec: remaining,
  }
}

interface LiveConsultationPlaybookModalProps {
  isOpen: boolean
  onClose: () => void
  athleteName: string
  sessionDurationSec: number
  clientAge?: number
  currentBpm?: number
  capturedFrames?: Record<AssessmentCaptureSlot, string | null>
  onCaptureSlot?: (slot: AssessmentCaptureSlot) => void
  onOpenPostureMesh?: () => void
  onOpenNasmSuite?: () => void
  onOpenTelestrator?: () => void
  onConcludeConsultation?: () => void
}

export default function LiveConsultationPlaybookModal({
  isOpen,
  onClose,
  athleteName,
  sessionDurationSec,
  clientAge = 35,
  currentBpm = 118,
  capturedFrames,
  onCaptureSlot,
  onOpenPostureMesh,
  onOpenNasmSuite,
  onOpenTelestrator,
  onConcludeConsultation,
}: LiveConsultationPlaybookModalProps) {
  const autoGate = useMemo(() => computeConsultationGate(sessionDurationSec), [sessionDurationSec])
  const [selectedGate, setSelectedGate] = useState<number>(autoGate)

  // Clinical Consultation State
  const [allostaticLoad, setAllostaticLoad] = useState<'low' | 'moderate' | 'high'>('moderate')
  const [targetOptPhase, setTargetOptPhase] = useState<number>(2)
  const [observedDistortions, setObservedDistortions] = useState<Record<string, boolean>>({
    knee_valgus: false,
    forward_lean: false,
    arms_fall_forward: false,
    asymmetric_shift: false,
    feet_flatten: false,
  })
  const [consultationNotes, setConsultationNotes] = useState<string>('')
  const [cueFeedback, setCueFeedback] = useState<string | null>(null)

  const countdown = useMemo(() => formatConsultationCountdown(sessionDurationSec), [sessionDurationSec])
  const currentGateMeta = useMemo(() => {
    return CONSULTATION_PLAYBOOK_GATES.find(g => g.gateNumber === selectedGate) || CONSULTATION_PLAYBOOK_GATES[0]
  }, [selectedGate])

  // Tanaka Age-Predicted Max Heart Rate
  const tanakaMaxHr = useMemo(() => Math.round(208 - 0.7 * clientAge), [clientAge])
  const zone2Floor = useMemo(() => Math.round(tanakaMaxHr * 0.60), [tanakaMaxHr])
  const zone2Ceiling = useMemo(() => Math.round(tanakaMaxHr * 0.70), [tanakaMaxHr])

  const triggerVoicePrompt = (text: string) => {
    speakCoachVoiceCue(text)
    setCueFeedback('✓ Prompt spoken aloud via coach neural voice')
    setTimeout(() => setCueFeedback(null), 3500)
  }

  const toggleDistortion = (key: string) => {
    setObservedDistortions(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-playbook-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 2vw, 24px)',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #0A0F1D 0%, #060912 100%)',
          border: '1.5px solid rgba(212, 160, 23, 0.45)',
          borderRadius: 14,
          boxShadow: '0 25px 80px rgba(0,0,0,0.95), 0 0 35px rgba(212,160,23,0.2)',
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#FFFFFF',
          position: 'relative',
        }}
      >
        {/* ── Header Ribbon & Telemetry Countdown ── */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(212,160,23,0.3)',
            background: 'rgba(10, 16, 30, 0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: countdown.isOvertime ? '#EF4444' : '#34D399',
                  boxShadow: `0 0 8px ${countdown.isOvertime ? '#EF4444' : '#34D399'}`,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: 'var(--gold-lt)',
                }}
              >
                Gordon Athletic Advisory · Clinical Consultation Playbook
              </span>
            </div>
            <h2
              id="consultation-playbook-title"
              className="font-serif"
              style={{
                fontSize: 20,
                color: '#FFFFFF',
                margin: '4px 0 0',
                letterSpacing: '0.04em',
                fontWeight: 700,
              }}
            >
              45-MINUTE LIVE DIAGNOSTIC CONSULTATION
            </h2>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              Athlete: <strong style={{ color: '#FFF' }}>{athleteName}</strong> · Standard 5-Gate Clinical Sequence
            </div>
          </div>

          {/* Master 45-Minute Countdown Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: 'rgba(0,0,0,0.55)',
                border: `1px solid ${countdown.isOvertime ? 'rgba(239,68,68,0.5)' : 'rgba(212,160,23,0.4)'}`,
                borderRadius: 8,
                padding: '6px 14px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800, letterSpacing: '0.08em' }}>
                {countdown.isOvertime ? 'Session Overtime' : 'Time Remaining'}
              </div>
              <div
                className="font-telemetry"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: countdown.isOvertime ? '#F87171' : countdown.remainingSec < 600 ? '#FBBF24' : 'var(--gold-lt)',
                  lineHeight: 1.1,
                }}
              >
                {countdown.formattedRemaining}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close consultation playbook"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── 5-Gate Interactive Step Navigator ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            background: 'rgba(0,0,0,0.45)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {CONSULTATION_PLAYBOOK_GATES.map(gate => {
            const isSelected = selectedGate === gate.gateNumber
            const isAuto = autoGate === gate.gateNumber
            const isCompleted = autoGate > gate.gateNumber
            return (
              <button
                key={gate.gateNumber}
                type="button"
                onClick={() => setSelectedGate(gate.gateNumber)}
                style={{
                  padding: '10px 8px',
                  background: isSelected
                    ? 'rgba(212,160,23,0.16)'
                    : 'transparent',
                  border: 'none',
                  borderBottom: isSelected ? '2px solid var(--gold-lt)' : '2px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isCompleted && (
                    <span style={{ color: '#34D399', fontSize: 10, fontWeight: 900 }}>✓</span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? 'var(--gold-lt)' : isCompleted ? '#34D399' : 'var(--gray)',
                    }}
                  >
                    {gate.shortTitle}
                  </span>
                </div>
                <span
                  className="font-telemetry"
                  style={{
                    fontSize: 9.5,
                    color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {gate.minuteRange}
                </span>
                {isAuto && (
                  <span
                    style={{
                      fontSize: 8,
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34D399',
                      padding: '0 4px',
                      borderRadius: 3,
                      fontWeight: 800,
                      marginTop: 2,
                    }}
                  >
                    Active Time
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Active Gate Detailed Execution View ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Gate Title & Objective */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h3
                className="font-serif"
                style={{
                  fontSize: 18,
                  color: 'var(--gold-lt)',
                  margin: 0,
                  letterSpacing: '0.04em',
                  fontWeight: 700,
                }}
              >
                {currentGateMeta.title}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(212,160,23,0.12)',
                  color: 'var(--gold-lt)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontWeight: 700,
                }}
              >
                Window: {currentGateMeta.minuteRange}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gray-lt)', lineHeight: 1.5, fontStyle: 'italic' }}>
              Objective: {currentGateMeta.clinicalObjective}
            </p>
          </div>

          {/* Key Clinical Script & Cues */}
          <div
            style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="clipboard" size={12} tone="gold" />
              <span>Consultant Cue Script &amp; Directives</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {currentGateMeta.keyCues.map((cue, idx) => (
                <li key={idx}>{cue}</li>
              ))}
            </ul>

            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => triggerVoicePrompt(currentGateMeta.keyCues[0])}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(212,160,23,0.12)',
                  border: '1px solid rgba(212,160,23,0.35)',
                  borderRadius: 4,
                  color: 'var(--gold-lt)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="volume-2" size={12} tone="gold" />
                <span>Speak Form Cue Aloud</span>
              </button>
              {cueFeedback && (
                <span style={{ fontSize: 11.5, color: '#34D399', fontWeight: 700, alignSelf: 'center' }}>
                  {cueFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Gate-Specific Interactive Controls */}
          {selectedGate === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Allostatic CNS Load Assessment
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { id: 'low', label: 'Low / Optimal', desc: 'Normal HRV, optimal recovery readiness', color: '#34D399' },
                  { id: 'moderate', label: 'Moderate Load', desc: 'Mild sympathetic bias, slight fatigue', color: '#FBBF24' },
                  { id: 'high', label: 'High / Suppressed', desc: 'Elevated stress, deload recommended', color: '#F87171' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAllostaticLoad(item.id as any)}
                    style={{
                      padding: 12,
                      background: allostaticLoad === item.id ? `${item.color}15` : 'rgba(0,0,0,0.35)',
                      border: `1px solid ${allostaticLoad === item.id ? item.color : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: item.color }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedGate === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Static Gravitational Views (3-Slot Capture)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {(['anterior', 'lateral', 'posterior'] as AssessmentCaptureSlot[]).map(slot => {
                  const isCaptured = Boolean(capturedFrames?.[slot])
                  return (
                    <div
                      key={slot}
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: `1px solid ${isCaptured ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 6,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: isCaptured ? '#34D399' : '#FFF' }}>
                        {isCaptured ? `✓ ${slot}` : slot}
                      </div>
                      <button
                        type="button"
                        onClick={() => onCaptureSlot?.(slot)}
                        style={{
                          padding: '6px 10px',
                          background: isCaptured ? 'rgba(16,185,129,0.15)' : 'rgba(212,160,23,0.15)',
                          border: `1px solid ${isCaptured ? '#10B981' : 'var(--gold)'}`,
                          color: isCaptured ? '#34D399' : 'var(--gold-lt)',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isCaptured ? 'Re-Capture' : 'Capture Slot'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {onOpenPostureMesh && (
                <button
                  type="button"
                  onClick={onOpenPostureMesh}
                  className="tactile-btn"
                  style={{
                    marginTop: 6,
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(14,23,36,0.8) 100%)',
                    border: '1px solid var(--gold)',
                    borderRadius: 6,
                    color: 'var(--gold-lt)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <GaaIcon name="crosshair" size={13} tone="gold" />
                  <span>Launch AI Postural Mesh Scanner ➔</span>
                </button>
              )}
            </div>
          )}

          {selectedGate === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Kinetic Chain Checkpoints &amp; Distortions Observed
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  { key: 'knee_valgus', label: 'Knee Valgus (Inward Buckle)', cue: 'Overactive Adductors / Underactive Glute Med' },
                  { key: 'forward_lean', label: 'Excessive Forward Trunk Lean', cue: 'Overactive Hip Flexors / Soleus' },
                  { key: 'arms_fall_forward', label: 'Arms Fall Forward', cue: 'Overactive Latissimus / Pec Major' },
                  { key: 'asymmetric_shift', label: 'Asymmetrical Weight Shift', cue: 'Side-to-side adductor / glute asymmetry' },
                  { key: 'feet_flatten', label: 'Feet Flatten / Turn Out', cue: 'Peroneal / lateral gastrocnemius overactivity' },
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      background: observedDistortions[item.key] ? 'rgba(239,68,68,0.12)' : 'rgba(0,0,0,0.35)',
                      border: `1px solid ${observedDistortions[item.key] ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 6,
                      padding: '8px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(observedDistortions[item.key])}
                      onChange={() => toggleDistortion(item.key)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: observedDistortions[item.key] ? '#F87171' : '#FFF' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>{item.cue}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {onOpenNasmSuite && (
                  <button
                    type="button"
                    onClick={onOpenNasmSuite}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'rgba(212,160,23,0.15)',
                      border: '1px solid var(--gold)',
                      color: 'var(--gold-lt)',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="movement-screen" size={13} tone="gold" />
                    <span>Open Full NASM OHSA Lab</span>
                  </button>
                )}
                {onOpenTelestrator && (
                  <button
                    type="button"
                    onClick={onOpenTelestrator}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Telestrator Angle Tool
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedGate === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Metabolic &amp; Aerobic Threshold Telemetry
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ background: 'rgba(0,0,0,0.45)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>Tanaka Max HR</div>
                  <div className="font-telemetry" style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginTop: 4 }}>
                    {tanakaMaxHr} <span style={{ fontSize: 13, color: 'var(--gold-lt)' }}>BPM</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>208 - (0.7 × {clientAge})</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.45)', padding: 12, borderRadius: 6, border: '1px solid rgba(52,211,153,0.3)' }}>
                  <div style={{ fontSize: 10, color: '#34D399', textTransform: 'uppercase', fontWeight: 800 }}>Target Zone 2</div>
                  <div className="font-telemetry" style={{ fontSize: 22, fontWeight: 800, color: '#34D399', marginTop: 4 }}>
                    {zone2Floor}–{zone2Ceiling} <span style={{ fontSize: 12 }}>BPM</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>60% – 70% aerobic base</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.45)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>Live Athlete Heart Rate</div>
                  <div className="font-telemetry" style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginTop: 4 }}>
                    {currentBpm} <span style={{ fontSize: 13, color: 'var(--gold-lt)' }}>BPM</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#34D399', marginTop: 2 }}>Live Bluetooth/Ant+ sync</div>
                </div>
              </div>
            </div>
          )}

          {selectedGate === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                NASM-OPT Master Periodization Prescription
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {[
                  { phase: 1, name: 'Phase 1', desc: 'Stabilization' },
                  { phase: 2, name: 'Phase 2', desc: 'Strength Endur.' },
                  { phase: 3, name: 'Phase 3', desc: 'Hypertrophy' },
                  { phase: 4, name: 'Phase 4', desc: 'Max Strength' },
                  { phase: 5, name: 'Phase 5', desc: 'Power' },
                ].map(p => (
                  <button
                    key={p.phase}
                    type="button"
                    onClick={() => setTargetOptPhase(p.phase)}
                    style={{
                      padding: '8px 4px',
                      background: targetOptPhase === p.phase ? 'rgba(212,160,23,0.2)' : 'rgba(0,0,0,0.4)',
                      border: `1px solid ${targetOptPhase === p.phase ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 4,
                      color: targetOptPhase === p.phase ? 'var(--gold-lt)' : '#FFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{p.name}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>{p.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Boardroom Consultation Findings (SOAP Note Draft)
                </label>
                <textarea
                  value={consultationNotes}
                  onChange={e => setConsultationNotes(e.target.value)}
                  placeholder={`Summary of clinical findings for ${athleteName}: Orthopedic observations, kinetic compensations, and microcycle roadmap...`}
                  style={{
                    width: '100%',
                    height: 64,
                    marginTop: 4,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    padding: 8,
                    fontSize: 12,
                    color: '#FFF',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              </div>

              {onConcludeConsultation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onConcludeConsultation()
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    color: '#FFF',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 14px rgba(16,185,129,0.3)',
                  }}
                >
                  <GaaIcon name="shield-check" size={14} tone="inherit" />
                  <span>Conclude Diagnostic Consultation &amp; Sign SOAP Memo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Navigation ── */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(8,12,22,0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            disabled={selectedGate <= 1}
            onClick={() => setSelectedGate(g => Math.max(1, g - 1))}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: selectedGate <= 1 ? 'var(--gray)' : '#FFF',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              cursor: selectedGate <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Previous Gate
          </button>

          <div style={{ fontSize: 11, color: 'var(--gray)' }}>
            Gate <strong style={{ color: 'var(--gold-lt)' }}>{selectedGate}</strong> of 5
          </div>

          <button
            type="button"
            disabled={selectedGate >= 5}
            onClick={() => setSelectedGate(g => Math.min(5, g + 1))}
            style={{
              padding: '6px 14px',
              background: selectedGate >= 5 ? 'rgba(255,255,255,0.05)' : 'rgba(212,160,23,0.2)',
              border: `1px solid ${selectedGate >= 5 ? 'rgba(255,255,255,0.15)' : 'var(--gold)'}`,
              color: selectedGate >= 5 ? 'var(--gray)' : 'var(--gold-lt)',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              cursor: selectedGate >= 5 ? 'not-allowed' : 'pointer',
            }}
          >
            Advance to Next Gate →
          </button>
        </div>
      </div>
    </div>
  )
}
