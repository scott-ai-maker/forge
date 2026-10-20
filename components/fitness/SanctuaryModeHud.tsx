'use client'

import React, { useState } from 'react'
import ForgeIcon from '@/components/ui/ForgeIcon'
import {
  type SanctuaryBreathingCadence,
  type BreathingPhaseState,
  type SanctuaryInterventionCue,
} from '@/lib/sanctuary-mode-engine'
import {
  getStoredSanctuaryAudioNotes,
  type SanctuaryAudioNote,
} from '@/lib/sanctuary-audio-notes-engine'
import SanctuaryAudioNotePlayer from '@/components/fitness/SanctuaryAudioNotePlayer'

export interface SanctuaryModeHudProps {
  isWorkoutActive: boolean
  isRestActive: boolean
  focusScore: number
  distractionCount: number
  downRegBreathsCompleted: number
  breathingState: BreathingPhaseState
  cadence: SanctuaryBreathingCadence
  onChangeCadence: (cadence: SanctuaryBreathingCadence) => void
  audioBreathPacerEnabled: boolean
  onToggleAudioBreathPacer: () => void
  activeIntervention: SanctuaryInterventionCue | null
  onDismissIntervention: () => void
  onToggleSanctuaryActive?: () => void
  isSanctuaryActive?: boolean
}

export default function SanctuaryModeHud({
  isWorkoutActive,
  isRestActive,
  focusScore,
  distractionCount: _distractionCount,
  downRegBreathsCompleted,
  breathingState,
  cadence,
  onChangeCadence,
  audioBreathPacerEnabled,
  onToggleAudioBreathPacer,
  activeIntervention,
  onDismissIntervention,
  onToggleSanctuaryActive: _onToggleSanctuaryActive,
  isSanctuaryActive = true,
}: SanctuaryModeHudProps) {
  const [expanded, setExpanded] = useState(false)
  const [showAudioNotesModal, setShowAudioNotesModal] = useState(false)
  const [selectedAudioNote, setSelectedAudioNote] = useState<SanctuaryAudioNote | null>(null)

  if (!isWorkoutActive || !isSanctuaryActive) return null

  // Focus score color
  const scoreColor = focusScore >= 90 ? '#34D399' : focusScore >= 75 ? '#FBBF24' : '#F87171'

  // Breathing circle scale factor
  const scale =
    breathingState.phase === 'inhale'
      ? 1 + (breathingState.progressPercent / 100) * 0.35
      : breathingState.phase === 'hold_in'
      ? 1.35
      : breathingState.phase === 'exhale'
      ? 1.35 - (breathingState.progressPercent / 100) * 0.35
      : 1.0

  return (
    <>
      {/* ── DISTRACTION INTERVENTION ALERT MODAL ── */}
      {activeIntervention && (
        <div
          role="alertdialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(4, 7, 14, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: '100%',
              background: 'linear-gradient(180deg, #0F172A 0%, #080E18 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.6)',
              borderRadius: 16,
              padding: '28px 24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(245, 158, 11, 0.25)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 9999,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#FDE68A',
                fontFamily: 'var(--font-telemetry)',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              <span>SANCTUARY SHIELD</span>
              <span>·</span>
              <span>KINETIC FOCUS</span>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                margin: '0 0 10px',
              }}
            >
              {activeIntervention.headline}
            </h3>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: '#CBD5E1',
                margin: '0 0 20px',
              }}
            >
              {activeIntervention.coachMessage}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                marginBottom: 24,
                fontSize: 12,
                color: '#FDE68A',
                fontFamily: 'var(--font-telemetry)',
              }}
            >
              <ForgeIcon name="shield-check" size={14} style={{ color: '#F59E0B' }} />
              <span>{activeIntervention.suggestedAction}</span>
            </div>

            <button
              type="button"
              onClick={onDismissIntervention}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                border: '1px solid #D4AF37',
                color: '#0A0E18',
                padding: '12px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              I&apos;m Locked In // Return to Lift
            </button>
          </div>
        </div>
      )}

      {/* ── TOP SANCTUARY MODE HUD BAR ── */}
      <aside
        aria-label="Sanctuary Mode Focus Bar"
        style={{
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto 16px',
          background: 'linear-gradient(90deg, rgba(8, 14, 24, 0.95) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(8, 14, 24, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 12,
          padding: '10px 16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 158, 11, 0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Brand Stance & Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
                animation: 'pulse 2s infinite',
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: '#FBBF24',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>SANCTUARY MODE</span>
                <span style={{ color: '#64748B' }}>{'//'}</span>
                <span style={{ color: '#E2E8F0' }}>ZERO DISTRACTIONS</span>
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                The gym is sacred ground · Hands on the bar
              </div>
            </div>
          </div>

          {/* Telemetry Metrics & Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Focus Discipline Pill */}
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontFamily: 'var(--font-telemetry)',
              }}
              title="Sanctuary Discipline Score based on uninterrupted training intervals"
            >
              <ForgeIcon name="target" size={13} style={{ color: scoreColor }} />
              <span style={{ color: '#94A3B8' }}>Focus:</span>
              <strong style={{ color: scoreColor }}>{focusScore}%</strong>
            </div>

            {/* Breaths Completed Pill */}
            {downRegBreathsCompleted > 0 && (
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-telemetry)',
                  color: '#34D399',
                }}
              >
                <span>🫁 {downRegBreathsCompleted} Breaths</span>
              </div>
            )}

            {/* Audio Breath Pacer Toggle */}
            <button
              type="button"
              onClick={onToggleAudioBreathPacer}
              style={{
                background: audioBreathPacerEnabled ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: audioBreathPacerEnabled ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.15)',
                color: audioBreathPacerEnabled ? '#FBBF24' : '#94A3B8',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontFamily: 'var(--font-telemetry)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
              title={audioBreathPacerEnabled ? 'Audio Breath Chimes ON' : 'Turn ON In-Ear Breath Chimes'}
            >
              <ForgeIcon name={audioBreathPacerEnabled ? 'zap' : 'activity'} size={13} />
              <span>{audioBreathPacerEnabled ? 'Audio Pacer ON' : 'Audio Pacer'}</span>
            </button>

            {/* Coach Voice Notes Button */}
            <button
              type="button"
              data-testid="sanctuary-coach-notes-btn"
              onClick={() => {
                const notes = getStoredSanctuaryAudioNotes()
                setSelectedAudioNote(notes[0] || null)
                setShowAudioNotesModal(true)
              }}
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: 'var(--gold-lt, #F3E5AB)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontFamily: 'var(--font-telemetry)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Open Coach Gordon In-Ear Voice Notes"
            >
              <ForgeIcon name="headphones" size={13} />
              <span>Coach Memos</span>
            </button>

            {/* Expand / Minimize Breath Sphere Button */}
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontFamily: 'var(--font-telemetry)',
                cursor: 'pointer',
              }}
            >
              {expanded ? '▲ Collapse' : '▼ Breath Pacer'}
            </button>
          </div>
        </div>

        {/* ── EXPANDED INTERACTIVE BREATH SPHERE (OR ACTIVE DURING REST) ── */}
        {(expanded || isRestActive) && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Cadence Selector Tabs */}
            <div
              style={{
                display: 'inline-flex',
                gap: 6,
                background: 'rgba(0, 0, 0, 0.35)',
                padding: 4,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {(
                [
                  { id: 'box_4x4', label: 'Box 4x4 (Power Reset)' },
                  { id: 'down_reg_4_2_6', label: '4-2-6 (Vagal Recovery)' },
                  { id: 'cardiac_recovery', label: 'Cardiac Drift (Zone 2)' },
                ] as const
              ).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChangeCadence(c.id)}
                  style={{
                    background: cadence === c.id ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                    border: cadence === c.id ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid transparent',
                    color: cadence === c.id ? '#FBBF24' : '#64748B',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 10.5,
                    fontFamily: 'var(--font-telemetry)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Visual Animated Breathing Sphere */}
            <div
              style={{
                position: 'relative',
                width: 140,
                height: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '8px 0 14px',
              }}
            >
              {/* Outer Pulsing Aura */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background:
                    breathingState.phase === 'inhale'
                      ? 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)'
                      : breathingState.phase === 'exhale'
                      ? 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
                  transform: `scale(${scale})`,
                  transition: 'transform 1s ease-in-out',
                }}
              />

              {/* Main Core Ring */}
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  border:
                    breathingState.phase === 'inhale'
                      ? '2px solid #38BDF8'
                      : breathingState.phase === 'exhale'
                      ? '2px solid #34D399'
                      : '2px solid #F59E0B',
                  background: 'rgba(15, 23, 42, 0.85)',
                  boxShadow:
                    breathingState.phase === 'inhale'
                      ? '0 0 20px rgba(56, 189, 248, 0.4)'
                      : breathingState.phase === 'exhale'
                      ? '0 0 20px rgba(52, 211, 153, 0.4)'
                      : '0 0 20px rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${scale})`,
                  transition: 'transform 1s ease-in-out, border-color 0.3s, box-shadow 0.3s',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                  }}
                >
                  {breathingState.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 11,
                    color: '#FBBF24',
                    fontWeight: 700,
                  }}
                >
                  {breathingState.remainingInPhase}s
                </div>
              </div>
            </div>

            {/* Sublabel and Coaching Instruction */}
            <div
              style={{
                fontSize: 12,
                color: '#94A3B8',
                maxWidth: 420,
                lineHeight: 1.4,
              }}
            >
              {breathingState.sublabel} · Resynthesizing phosphagen (ATP-CP)
            </div>
          </div>
        )}
      </aside>

      {/* ── COACH GORDON SANCTUARY AUDIO NOTES MODAL ── */}
      {showAudioNotesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sanctuary-audio-notes-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(4, 7, 14, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              maxWidth: 540,
              width: '100%',
              background: 'linear-gradient(180deg, #0F172A 0%, #080E18 100%)',
              border: '1.5px solid rgba(212, 175, 55, 0.6)',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(212, 175, 55, 0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ForgeIcon name="headphones" size={18} style={{ color: 'var(--gold)' }} />
                <div>
                  <h3
                    id="sanctuary-audio-notes-title"
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Coach Gordon · In-Ear Memos
                  </h3>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--gold-lt)',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    AUTONOMIC RECOVERY · DEEP FOCUS · 100% COACHING
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAudioNotesModal(false)}
                aria-label="Close Coach Memos"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <ForgeIcon name="close" size={16} />
              </button>
            </div>

            {selectedAudioNote ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SanctuaryAudioNotePlayer
                  note={selectedAudioNote}
                  autoPlayOnMount
                  onClose={() => setSelectedAudioNote(null)}
                />

                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Other Available Coach Memos:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {getStoredSanctuaryAudioNotes()
                      .filter(n => n.id !== selectedAudioNote.id)
                      .map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setSelectedAudioNote(n)}
                          style={{
                            textAlign: 'left',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 6,
                            padding: '8px 12px',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>
                              {n.category.replace('_', ' ')} · {n.durationSeconds}s
                            </div>
                          </div>
                          <ForgeIcon name="play" size={11} style={{ color: 'var(--gold)' }} />
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {getStoredSanctuaryAudioNotes().map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedAudioNote(n)}
                    style={{
                      textAlign: 'left',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: '#CBD5E1', fontStyle: 'italic', marginTop: 2 }}>
                        &ldquo;{n.transcript.slice(0, 70)}...&rdquo;
                      </div>
                    </div>
                    <ForgeIcon name="headphones" size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
