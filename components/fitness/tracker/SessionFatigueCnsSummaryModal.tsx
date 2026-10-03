'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  calculateSessionFatigueCnsIndex,
  type SessionSetRecord,
  type CnsReadinessReport,
} from '@/lib/session-fatigue-cns-index'

export interface SessionFatigueCnsSummaryModalProps {
  workoutDayNumber: number
  workoutFocus?: string
  sessionDurationMinutes: number
  initialRpe?: number | string
  setLogs: SessionSetRecord[]
  units?: 'imperial' | 'metric'
  onConfirmWorkout: (finalRpe: number) => void
  onClose: () => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function SessionFatigueCnsSummaryModal({
  workoutDayNumber,
  workoutFocus = 'Strength Session',
  sessionDurationMinutes,
  initialRpe = 8,
  setLogs,
  units = 'imperial',
  onConfirmWorkout,
  onClose,
  triggerHaptic,
}: SessionFatigueCnsSummaryModalProps) {
  const [activeRpe, setActiveRpe] = useState<number>(Number(initialRpe) || 8)

  const report: CnsReadinessReport = useMemo(() => {
    return calculateSessionFatigueCnsIndex({
      sessionDurationMinutes,
      sessionRpe: activeRpe,
      setLogs,
      units,
    })
  }, [sessionDurationMinutes, activeRpe, setLogs, units])

  const handleAdjustRpe = (newVal: number) => {
    triggerHaptic?.('tap')
    setActiveRpe(Math.max(1, Math.min(10, Math.round(newVal * 10) / 10)))
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(12px)',
        overflowY: 'auto',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Session Fatigue & CNS Readiness Index Summary"
      data-testid="cns-fatigue-summary-modal"
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0A1220 0%, #050B14 100%)',
          border: '1.5px solid rgba(212,160,23,0.5)',
          borderRadius: 14,
          padding: '20px 22px',
          maxWidth: 540,
          width: '100%',
          boxShadow: '0 24px 70px rgba(0,0,0,0.9), 0 0 30px rgba(212,160,23,0.25)',
          display: 'grid',
          gap: 14,
          maxHeight: '94vh',
          overflowY: 'auto',
          color: '#FFFFFF',
        }}
      >
        {/* ── Header Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                textTransform: 'uppercase',
                color: 'var(--gold-lt, #F3E5AB)',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name="activity" size={12} tone="gold" />
              <span>Session Fatigue & CNS Readiness Index</span>
            </div>
            <h3
              style={{
                margin: '2px 0 0',
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 19,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.03em',
              }}
            >
              Day {workoutDayNumber}: {workoutFocus}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
            aria-label="Close modal"
          >
            <GaaIcon name="close" size={16} tone="slate" />
          </button>
        </div>

        {/* ── Primary CNS Readiness Score & Foster Training Load Gauge ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          {/* Left: CNS Score */}
          <div>
            <div style={{ fontSize: 9.5, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>
              CNS Readiness Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  color: report.tierColor,
                  lineHeight: 1,
                }}
              >
                {report.cnsScore}
              </span>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700 }}>/ 100</span>
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: report.tierColor, marginTop: 3 }}>
              {report.tierLabel}
            </div>
            <div style={{ fontSize: 9.5, color: '#CBD5E1', marginTop: 1 }}>
              ~{report.recoveryHoursNeeded}h recovery horizon
            </div>
          </div>

          {/* Right: Foster Training Load */}
          <div>
            <div style={{ fontSize: 9.5, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>
              Foster Training Load
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  color: report.loadZoneColor,
                  lineHeight: 1,
                }}
              >
                {report.fosterTrainingLoadAu}
              </span>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>A.U.</span>
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: report.loadZoneColor, marginTop: 3 }}>
              {report.loadZoneLabel}
            </div>
            <div style={{ fontSize: 9.5, color: '#CBD5E1', marginTop: 1 }}>
              {report.totalWorkingSets} sets · {report.sessionDurationMinutes} mins
            </div>
          </div>
        </div>

        {/* ── Interactive Session RPE Tuning Bar ── */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              Foster Session RPE: {activeRpe.toFixed(1)} / 10
            </span>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>
              Adjust to re-tune CNS recovery horizon
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleAdjustRpe(activeRpe - 0.5)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              -0.5
            </button>

            <input
              type="range"
              min="5"
              max="10"
              step="0.5"
              value={activeRpe}
              onChange={e => handleAdjustRpe(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#38BDF8', cursor: 'pointer' }}
              aria-label="Session RPE Slider"
            />

            <button
              type="button"
              onClick={() => handleAdjustRpe(activeRpe + 0.5)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              +0.5
            </button>
          </div>
        </div>

        {/* ── Biomechanical Guardrail Verification Banner for Hammer Curls ── */}
        {report.hammerCurlGuardrailVerified && (
          <div
            style={{
              background: 'rgba(212, 160, 23, 0.15)',
              border: '1px solid var(--gold, #D4AF37)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
            data-testid="hammer-guardrail-audit-banner"
          >
            <GaaIcon name="shield-check" size={16} tone="gold" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-lt, #F3E5AB)', textTransform: 'uppercase' }}>
                Strict Neutral Hammer Grip Integrity: 100% Verified
              </div>
              <div style={{ fontSize: 10, color: '#FDE68A', marginTop: 1, lineHeight: 1.4 }}>
                {report.guardrailMessage}
              </div>
            </div>
          </div>
        )}

        {/* ── Muscle Group Mechanical Tension Distribution ── */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
            Mechanical Tension & Muscle Fatigue Distribution
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {report.muscleDistribution.map(group => (
              <div
                key={group.muscleGroup}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 6,
                  padding: '6px 10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#FFFFFF' }}>
                      {group.label}
                    </span>
                    {group.hasHammerCurl && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: '1px 4px',
                          borderRadius: 2,
                          background: 'rgba(212,160,23,0.25)',
                          color: 'var(--gold-lt)',
                          border: '1px solid rgba(212,160,23,0.5)',
                          fontWeight: 800,
                        }}
                      >
                        Neutral Grip
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>
                    {group.totalSets} sets ({group.highTensionSets} high-tension) · {group.volumeLbs.toLocaleString()} lb
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(8, group.percentageOfTotal))}%`,
                      height: '100%',
                      background: group.hasHammerCurl ? 'var(--gold)' : '#38BDF8',
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Clinical Recovery Guidance Note ── */}
        <div style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.45, fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          Coach Note: {report.clinicalRecoveryGuidance}
        </div>

        {/* ── Confirmation Button ── */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('success')
            onConfirmWorkout(activeRpe)
          }}
          className="tactile-btn"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
            border: '1px solid #D4AF37',
            color: '#0A0E18',
            padding: '11px 16px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 4,
          }}
        >
          <GaaIcon name="check" size={15} tone="inherit" />
          <span>Confirm & Close Workout Session</span>
        </button>
      </div>
    </div>
  )
}
