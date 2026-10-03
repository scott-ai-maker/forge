'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  evaluateHeartRateRecovery,
  getBreathWorkCadenceState,
  getIntraRestMobilityCue,
  type BreathingPattern,
} from '@/lib/active-rest-cardio-pacer'
import { classifyHeartRateZone } from '@/lib/rest-timer-audio-hr-engine'
import { playPrecisionTone } from '@/lib/web-audio-cadence-engine'

export interface ActiveRestCardioPacerTrayProps {
  exerciseName: string
  elapsedRestSeconds: number
  totalRestSeconds: number
  currentHeartRateBpm?: number | null
  restingHeartRateBpm?: number | null
  userAge?: number
  onClose?: () => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function ActiveRestCardioPacerTray({
  exerciseName,
  elapsedRestSeconds,
  totalRestSeconds,
  currentHeartRateBpm,
  restingHeartRateBpm = 60,
  userAge = 30,
  onClose,
  triggerHaptic,
}: ActiveRestCardioPacerTrayProps) {
  const [pattern, setPattern] = useState<BreathingPattern>('down_regulation_4_2_6')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState<'breath' | 'hrr' | 'mobility'>('breath')

  // Peak HR at set completion estimation (or from telemetry if higher)
  const estimatedPeakHr = useMemo(() => {
    return Math.max(145, (currentHeartRateBpm || 135) + 12)
  }, [exerciseName])

  // Live HR recovery computation
  const effectiveCurrentBpm = currentHeartRateBpm || Math.max(80, Math.round(estimatedPeakHr - (elapsedRestSeconds * 0.4)))
  const hrr = useMemo(() => {
    return evaluateHeartRateRecovery({
      peakHeartRateBpm: estimatedPeakHr,
      currentHeartRateBpm: effectiveCurrentBpm,
      elapsedRestSeconds,
      restingHeartRateBpm: restingHeartRateBpm || 60,
      userAge,
    })
  }, [estimatedPeakHr, effectiveCurrentBpm, elapsedRestSeconds, restingHeartRateBpm, userAge])

  // 5-Tier Heart Rate Zone classification
  const hrZone = useMemo(() => {
    return classifyHeartRateZone(effectiveCurrentBpm, userAge, restingHeartRateBpm || 60)
  }, [effectiveCurrentBpm, userAge, restingHeartRateBpm])

  // Breath-work cadence
  const breathState = useMemo(() => {
    return getBreathWorkCadenceState(elapsedRestSeconds, pattern)
  }, [elapsedRestSeconds, pattern])

  // Contextual intra-rest mobility cue
  const mobility = useMemo(() => {
    return getIntraRestMobilityCue(exerciseName)
  }, [exerciseName])

  // Audio tone cue on breath phase transitions
  const lastPhaseRef = useRef(breathState.phase)
  useEffect(() => {
    if (lastPhaseRef.current !== breathState.phase) {
      lastPhaseRef.current = breathState.phase
      if (soundEnabled) {
        playPrecisionTone({
          freq: breathState.toneFreq,
          duration: 0.12,
          type: 'sine',
          gainPeak: 0.12,
        })
      }
    }
  }, [breathState.phase, breathState.toneFreq, soundEnabled])

  // Dynamic radial scale for breathing animation (0.75 to 1.25 scale)
  const ringScale = 0.8 + (breathState.phaseProgress * 0.4)

  return (
    <div
      className="active-rest-cardio-tray"
      style={{
        marginTop: 10,
        background: 'rgba(10, 16, 28, 0.98)',
        border: '1.5px solid rgba(56, 189, 248, 0.4)',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.7), 0 0 16px rgba(56, 189, 248, 0.15)',
        color: '#E2E8F0',
      }}
      role="region"
      aria-label="Active Rest Cardio & Breath-Work Pacer"
    >
      {/* ── Sub-Nav Tabs: Breath Pacer | HR Recovery | Intra-Rest Mobility ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 8,
          marginBottom: 10,
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              setActiveTab('breath')
            }}
            style={{
              background: activeTab === 'breath' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
              border: activeTab === 'breath' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid transparent',
              color: activeTab === 'breath' ? '#38BDF8' : '#94A3B8',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GaaIcon name="heart" size={11} tone="cyan" />
            <span>Breath Pacer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              setActiveTab('hrr')
            }}
            style={{
              background: activeTab === 'hrr' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
              border: activeTab === 'hrr' ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid transparent',
              color: activeTab === 'hrr' ? '#34D399' : '#94A3B8',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GaaIcon name="activity" size={11} tone="emerald" />
            <span>HR Recovery ({hrr.dropBpm > 0 ? `-${hrr.dropBpm}` : '0'} bpm)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              setActiveTab('mobility')
            }}
            style={{
              background: activeTab === 'mobility' ? 'rgba(212, 160, 23, 0.22)' : 'transparent',
              border: activeTab === 'mobility' ? '1px solid rgba(212, 160, 23, 0.6)' : '1px solid transparent',
              color: activeTab === 'mobility' ? 'var(--gold-lt)' : '#94A3B8',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GaaIcon name="sparkles" size={11} tone="gold" />
            <span>Active Mobility</span>
          </button>
        </div>

        {/* Sound toggle & Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              setSoundEnabled(prev => !prev)
            }}
            style={{
              background: soundEnabled ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: soundEnabled ? '#38BDF8' : '#64748B',
              padding: '3px 6px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
            title={soundEnabled ? 'Breath audio tone enabled' : 'Mute breath audio'}
          >
            <GaaIcon name={soundEnabled ? 'volume' : 'volume-x'} size={11} tone="inherit" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close Pacer Tray"
            >
              <GaaIcon name="close" size={13} tone="slate" />
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: BREATH-WORK CADENCE PACER ── */}
      {activeTab === 'breath' && (
        <div>
          {/* Pattern Selector */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {(
              [
                { id: 'down_regulation_4_2_6', label: '4-2-6 Vagal Tone' },
                { id: 'box_4_4_4_4', label: '4-4-4-4 Box Focus' },
                { id: 'physiological_sigh', label: '2-1-6 Physio Sigh' },
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setPattern(opt.id)
                }}
                style={{
                  flex: 1,
                  background: pattern === opt.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.04)',
                  border: pattern === opt.id ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                  color: pattern === opt.id ? '#38BDF8' : '#94A3B8',
                  padding: '4px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Animated Cadence Ring & Guidance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '12px 0 6px 0',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 90,
                height: 90,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              {/* Outer Pulsing Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(56, 189, 248, 0.6)',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%)',
                  transform: `scale(${ringScale})`,
                  transition: 'transform 0.4s ease-out',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
                }}
              />
              {/* Center Phase Display */}
              <div
                style={{
                  zIndex: 2,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {breathState.phaseLabel}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#38BDF8',
                    fontWeight: 700,
                    fontFamily: 'var(--font-telemetry, monospace)',
                  }}
                >
                  {Math.ceil(breathState.phaseDurationSeconds - breathState.phaseElapsedSeconds)}s left
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                color: '#CBD5E1',
                textAlign: 'center',
                fontStyle: 'italic',
                maxWidth: 320,
              }}
            >
              "{breathState.guidanceText}"
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 9.5,
                color: '#64748B',
                fontFamily: 'var(--font-telemetry, monospace)',
              }}
            >
              Cycle {breathState.cycleCount} · {breathState.patternLabel}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: HEART RATE RECOVERY TELEMETRY ── */}
      {activeTab === 'hrr' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase' }}>Set Peak HR</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#F87171', fontFamily: 'monospace' }}>
                {hrr.peakHeartRateBpm} <span style={{ fontSize: 10, fontWeight: 500 }}>bpm</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase' }}>Current HR</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                {hrr.currentHeartRateBpm} <span style={{ fontSize: 10, fontWeight: 500 }}>bpm</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase' }}>HR Drop</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#34D399', fontFamily: 'monospace' }}>
                -{hrr.dropBpm} <span style={{ fontSize: 10, fontWeight: 500 }}>bpm</span>
              </div>
            </div>
          </div>

          {/* Vagal Reactivation Tier Badge */}
          <div
            style={{
              background: `${hrr.tierColor}18`,
              border: `1px solid ${hrr.tierColor}60`,
              borderRadius: 6,
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="activity" size={12} tone="inherit" style={{ color: hrr.tierColor }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: hrr.tierColor }}>
                {hrr.tierLabel}
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                color: '#CBD5E1',
                fontFamily: 'monospace',
              }}
            >
              Target: ≤ {hrr.targetRecoveryBpm} bpm
            </span>
          </div>

          {/* 5-Zone Cardiac Recovery Horizon Bar */}
          <div
            data-testid="hr-5zone-meter"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: '8px 10px',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#E2E8F0' }}>
                Cardiac Zone: <strong style={{ color: hrZone.zoneColor }}>{hrZone.zoneLabel}</strong>
              </span>
              <span style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'monospace' }}>
                {hrZone.percentHrMax}% HRmax
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, height: 6 }}>
              {[1, 2, 3, 4, 5].map(z => {
                const colors = ['#10B981', '#0EA5E9', '#F59E0B', '#F97316', '#EF4444']
                const isActive = hrZone.zone === z
                return (
                  <div
                    key={z}
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      background: colors[z - 1],
                      opacity: isActive ? 1 : 0.25,
                      border: isActive ? '1px solid #FFFFFF' : 'none',
                    }}
                    title={`Zone ${z}`}
                  />
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#64748B', marginTop: 4 }}>
              <span>Z1 (Recovery)</span>
              <span>Z2 (Aerobic)</span>
              <span>Z3 (Moderate)</span>
              <span>Z4 (Threshold)</span>
              <span>Z5 (Peak)</span>
            </div>
          </div>

          <div style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.4 }}>
            {hrr.clinicalInsight}
          </div>
        </div>
      )}

      {/* ── TAB 3: INTRA-REST ACTIVE MOBILITY & GUARDRAILS ── */}
      {activeTab === 'mobility' && (
        <div>
          {/* Biomechanical Guardrail Banner for Hammer Curls */}
          {mobility.isHammerCurl && mobility.guardrailMandate && (
            <div
              style={{
                background: 'rgba(212, 160, 23, 0.18)',
                border: '1.5px solid var(--gold)',
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 8,
                fontSize: 10.5,
                color: 'var(--gold-lt)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <GaaIcon name="alert-triangle" size={14} tone="gold" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Biomechanical Guardrail: Strict Neutral Hammer Grip
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: '#FDE68A', marginTop: 2 }}>
                  {mobility.guardrailMandate}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FFFFFF' }}>
                {mobility.title}
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontWeight: 700,
                }}
              >
                ~{mobility.durationSuggestionSec}s Active Reset
              </span>
            </div>

            <div style={{ fontSize: 10.5, color: '#CBD5E1', lineHeight: 1.45, marginBottom: 6 }}>
              {mobility.action}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Target Areas:
              </span>
              {mobility.targetMuscles.map(muscle => (
                <span
                  key={muscle}
                  style={{
                    fontSize: 9.5,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#94A3B8',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
