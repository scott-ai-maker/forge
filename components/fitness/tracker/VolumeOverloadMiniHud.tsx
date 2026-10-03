'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  computeVolumeOverloadTelemetry,
  type HistoricalSetLogInput,
  type VolumeOverloadSummary,
} from '@/lib/volume-overload-engine'

export interface VolumeOverloadMiniHudProps {
  exerciseName: string
  targetRepsText?: string | null
  currentSessionDate: string
  allExerciseLogs: HistoricalSetLogInput[]
  preferredUnits?: 'imperial' | 'metric'
  isTimed?: boolean
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function VolumeOverloadMiniHud({
  exerciseName,
  targetRepsText,
  currentSessionDate,
  allExerciseLogs,
  preferredUnits = 'imperial',
  isTimed = false,
  triggerHaptic,
}: VolumeOverloadMiniHudProps) {
  const [showCurveDrawer, setShowCurveDrawer] = useState(false)

  const summary: VolumeOverloadSummary = useMemo(() => {
    return computeVolumeOverloadTelemetry({
      exerciseName,
      targetRepsText,
      currentSessionDate,
      allExerciseLogs,
      preferredUnits,
    })
  }, [exerciseName, targetRepsText, currentSessionDate, allExerciseLogs, preferredUnits])

  // If timed or no sets logged at all in this session or history, we display a lightweight readiness pill
  if (isTimed) {
    return null
  }

  const unitLabel = preferredUnits === 'imperial' ? 'lb' : 'kg'
  const hasCurrentSets = summary.currentSessionSetsCount > 0
  const hasPriorSession = summary.previousSessionVolume !== null

  const fatigueColors = {
    pristine: { hex: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', label: 'Pristine Velocity' },
    optimal: { hex: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', label: 'Hypertrophic Fatigue' },
    elevated: { hex: '#EF4444', bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.45)', label: 'Elevated CNS Strain' },
  }[summary.fatigueStatus]

  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 8,
        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.75) 0%, rgba(10, 18, 30, 0.85) 100%)',
        border: '1px solid rgba(212, 160, 23, 0.25)',
        borderRadius: 6,
        padding: '10px 12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
      aria-label="Volume and Progressive Overload Mini-HUD"
    >
      {/* ── Header: Title, Volume Delta Pill & Curve Toggle ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--gold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GaaIcon name="bar-chart" size={12} tone="gold" />
            <span>Volume & Overload HUD</span>
          </span>

          {hasPriorSession && summary.volumeDelta !== null && summary.volumeDeltaPct !== null ? (
            <span
              className="font-telemetry"
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 4,
                background: summary.volumeDelta >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: summary.volumeDelta >= 0 ? '#6EE7B7' : '#FDE047',
                border: `1px solid ${summary.volumeDelta >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
              title={`Previous session volume: ${summary.previousSessionVolume?.toLocaleString()} ${unitLabel}`}
            >
              <GaaIcon
                name={summary.volumeDelta >= 0 ? 'trending-up' : 'sliders'}
                size={10}
                tone={summary.volumeDelta >= 0 ? 'emerald' : 'amber'}
              />
              <span>
                {summary.volumeDelta >= 0 ? `+${summary.volumeDeltaPct}%` : `${summary.volumeDeltaPct}%`} Overload
              </span>
            </span>
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--gray)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 6px',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Baseline Target
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setShowCurveDrawer(prev => !prev)
          }}
          className="tactile-btn"
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--gold-lt)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 4px',
          }}
        >
          <GaaIcon name="activity" size={11} tone="gold" />
          <span>{showCurveDrawer ? 'Hide Fatigue Curve' : 'Fatigue Curve'}</span>
        </button>
      </div>

      {/* ── Metric Tiles Grid (Tonnage, Peak 1RM, Fatigue Index) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 6,
          marginBottom: 8,
        }}
      >
        {/* Tonnage / Mechanical Volume */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 5,
            padding: '7px 9px',
          }}
        >
          <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>
            Session Tonnage
          </div>
          <div
            className="font-telemetry"
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#FFFFFF',
              marginTop: 2,
              display: 'flex',
              alignItems: 'baseline',
              gap: 3,
            }}
          >
            <span>{summary.currentSessionVolume.toLocaleString()}</span>
            <span style={{ fontSize: 10, color: 'var(--gold)' }}>{unitLabel}</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>
            {summary.currentSessionSetsCount} {summary.currentSessionSetsCount === 1 ? 'set' : 'sets'} · {summary.currentSessionRepsCount} reps
          </div>
        </div>

        {/* Peak Estimated 1RM */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 5,
            padding: '7px 9px',
          }}
        >
          <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>
            Peak Est. 1RM
          </div>
          <div
            className="font-telemetry"
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--gold-lt)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'baseline',
              gap: 3,
            }}
          >
            <span>
              {preferredUnits === 'imperial'
                ? summary.peakEstimated1RmLbs.toLocaleString()
                : Math.round((summary.peakEstimated1RmLbs / 2.20462) * 10) / 10}
            </span>
            <span style={{ fontSize: 10, color: 'var(--gold)' }}>{unitLabel}</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>
            Brzycki & Epley Peak
          </div>
        </div>

        {/* Fatigue Index */}
        <div
          style={{
            background: fatigueColors.bg,
            border: `1px solid ${fatigueColors.border}`,
            borderRadius: 5,
            padding: '7px 9px',
          }}
        >
          <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: fatigueColors.hex, fontWeight: 700 }}>
            Fatigue Index
          </div>
          <div
            className="font-telemetry"
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: fatigueColors.hex,
              marginTop: 2,
              display: 'flex',
              alignItems: 'baseline',
              gap: 3,
            }}
          >
            <span>{summary.currentFatiguePct > 0 ? `−${summary.currentFatiguePct}%` : '0.0%'}</span>
          </div>
          <div style={{ fontSize: 9.5, color: fatigueColors.hex, marginTop: 2, fontWeight: 600 }}>
            {fatigueColors.label}
          </div>
        </div>
      </div>

      {/* ── Set-by-Set Fatigue Degradation Curve (Expandable Drawer) ── */}
      {showCurveDrawer && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 5,
            padding: '8px 10px',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--gray-lt)',
              letterSpacing: '0.05em',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GaaIcon name="activity" size={11} tone="gold" />
            <span>Set-by-Set Power & Velocity Degradation</span>
          </div>

          {hasCurrentSets ? (
            <div style={{ display: 'grid', gap: 5 }}>
              {summary.setsTrajectory.map(s => {
                const percentRetained = Math.max(10, Math.round(100 - s.fatigueDropoffPct))
                const barColor =
                  s.fatigueDropoffPct >= 10
                    ? '#EF4444'
                    : s.fatigueDropoffPct >= 5
                      ? '#F59E0B'
                      : '#10B981'

                return (
                  <div
                    key={s.setNumber}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 65px',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 10.5,
                    }}
                  >
                    <span style={{ color: s.isWarmup ? 'var(--gray)' : 'var(--white)', fontWeight: 700 }}>
                      Set {s.setNumber} {s.isWarmup ? '(W)' : ''}
                    </span>

                    {/* Visual Progress Bar */}
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentRetained}%`,
                          background: barColor,
                          borderRadius: 3,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <span
                      className="font-telemetry"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: s.isWarmup ? 'var(--gray)' : barColor,
                        fontSize: 10,
                      }}
                    >
                      {s.isWarmup
                        ? 'Warmup'
                        : s.fatigueDropoffPct > 0
                          ? `−${s.fatigueDropoffPct}%`
                          : 'Peak 100%'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ fontSize: 10.5, color: 'var(--gray)', fontStyle: 'italic', padding: '4px 0' }}>
              No sets logged yet in this session. Log your first working set to activate the live fatigue curve.
            </div>
          )}

          <div style={{ fontSize: 9.5, color: 'var(--gray)', fontStyle: 'italic', marginTop: 6 }}>
            💡 Fatigue Guidance: Keep velocity degradation under 10% on primary compound lifts to maintain biomechanical integrity and prevent technique deterioration.
          </div>
        </div>
      )}

      {/* ── Official NASM 2-for-2 Progressive Overload Banner ── */}
      {summary.nasm2For2.eligibleForProgression ? (
        <div
          style={{
            padding: '7px 10px',
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.22) 0%, rgba(13, 27, 42, 0.8) 100%)',
            border: '1.5px solid var(--gold)',
            color: '#FFFFFF',
            fontSize: 11,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <GaaIcon name="trophy" size={13} tone="gold" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--gold-lt)' }}>
              🏆 NASM 2-for-2 Overload Trigger: +{summary.nasm2For2.recommendedWeightIncreaseLbs} lbs Recommended!
            </div>
            <div style={{ color: 'var(--gray-lt)', lineHeight: 1.35, marginTop: 1 }}>
              {summary.nasm2For2.reasoning}
            </div>
          </div>
        </div>
      ) : summary.nasm2For2.consecutiveSessionsOverTarget === 1 ? (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 4,
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#BAE6FD',
            fontSize: 10.5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <GaaIcon name="sparkles" size={12} tone="cyan" />
          <span>
            <strong>NASM 2-for-2 Progress:</strong> 1 of 2 consecutive workouts completed over target. Hit +2 reps on final set today to unlock recommended weight advance.
          </span>
        </div>
      ) : null}

      {/* ── Clinical Fatigue Advice Footer ── */}
      {hasCurrentSets && (
        <div
          style={{
            fontSize: 10.5,
            color: fatigueColors.hex,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            lineHeight: 1.3,
          }}
        >
          <GaaIcon
            name={summary.fatigueStatus === 'elevated' ? 'alert-triangle' : 'shield-check'}
            size={11}
            tone={summary.fatigueStatus === 'elevated' ? 'ruby' : 'emerald'}
          />
          <span>{summary.fatigueGuidance}</span>
        </div>
      )}
    </div>
  )
}
