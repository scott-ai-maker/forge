'use client'

import React, { useMemo, useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  recommendWorkingLoad,
  type HistoricalSetRecord,
  type DynamicLoadRecommendation,
} from '@/lib/dynamic-load-recommender'
import { triggerHaptic } from '@/lib/offline-sync-queue'

interface DynamicLoadPrescriptionPillProps {
  exerciseName: string
  nasmOptPhase?: number | null
  targetRepsText?: string | null
  historicalSets: HistoricalSetRecord[]
  dailyReadinessScore?: number | null
  acwrRatio?: number | null
  preferredUnits?: 'imperial' | 'metric'
  onApplyRecommendation: (load: {
    weight: string
    reps: string
    rpe: string
    rir: string
    tempo: string
  }) => void
}

export default function DynamicLoadPrescriptionPill({
  exerciseName,
  nasmOptPhase = 1,
  targetRepsText,
  historicalSets = [],
  dailyReadinessScore,
  acwrRatio,
  preferredUnits = 'imperial',
  onApplyRecommendation,
}: DynamicLoadPrescriptionPillProps) {
  const [applied, setApplied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const rec: DynamicLoadRecommendation = useMemo(() => {
    return recommendWorkingLoad({
      exerciseName,
      nasmOptPhase,
      targetRepsText,
      historicalSets,
      dailyReadinessScore,
      acwrRatio,
      preferredUnits,
    })
  }, [exerciseName, nasmOptPhase, targetRepsText, historicalSets, dailyReadinessScore, acwrRatio, preferredUnits])

  const unitLabel = preferredUnits === 'imperial' ? 'lb' : 'kg'

  const handleApply = () => {
    triggerHaptic('heavy')
    onApplyRecommendation({
      weight: String(rec.recommendedWeight),
      reps: String(rec.recommendedReps),
      rpe: String(rec.recommendedRpe),
      rir: String(rec.recommendedRir),
      tempo: rec.recommendedTempo,
    })
    setApplied(true)
    setTimeout(() => setApplied(false), 2500)
  }

  const badgeBorderColor = {
    gold: 'rgba(212, 160, 23, 0.4)',
    green: 'rgba(74, 222, 128, 0.4)',
    amber: 'rgba(251, 191, 36, 0.4)',
    blue: 'rgba(56, 189, 248, 0.4)',
  }[rec.badgeColor]

  const badgeBgColor = {
    gold: 'rgba(212, 160, 23, 0.12)',
    green: 'rgba(74, 222, 128, 0.12)',
    amber: 'rgba(251, 191, 36, 0.12)',
    blue: 'rgba(56, 189, 248, 0.12)',
  }[rec.badgeColor]

  const badgeTextColor = {
    gold: 'var(--gold-lt)',
    green: '#86EFAC',
    amber: '#FDE047',
    blue: '#7DD3FC',
  }[rec.badgeColor]

  return (
    <div
      style={{
        marginBottom: 10,
        padding: '10px 12px',
        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.85) 0%, rgba(7, 13, 24, 0.95) 100%)',
        border: `1px solid ${badgeBorderColor}`,
        borderRadius: 6,
        display: 'grid',
        gap: 8,
      }}
    >
      {/* Top Bar: Telemetry Badge + 1-Tap Load Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '2px 7px',
              borderRadius: 4,
              background: badgeBgColor,
              border: `1px solid ${badgeBorderColor}`,
              color: badgeTextColor,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {rec.badgeColor === 'green' ? (
              <GaaIcon name="lightning" size={11} tone="emerald" />
            ) : rec.badgeColor === 'amber' ? (
              <GaaIcon name="bandage" size={11} tone="amber" />
            ) : rec.badgeColor === 'blue' ? (
              <GaaIcon name="shield-check" size={11} tone="cyan" />
            ) : (
              <GaaIcon name="target" size={11} tone="gold" />
            )}
            <span>{rec.badge}</span>
          </span>

          <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
            {rec.recommendedWeight} {unitLabel} × {rec.recommendedReps} reps @ RPE {rec.recommendedRpe}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleApply}
            className="tactile-btn"
            style={{
              background: applied ? 'rgba(74, 222, 128, 0.25)' : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: applied ? '1px solid #4ADE80' : 'none',
              color: applied ? '#86EFAC' : '#070D18',
              fontSize: 11,
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
              boxShadow: applied ? '0 0 12px rgba(74, 222, 128, 0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {applied ? (
              <>
                <GaaIcon name="check" size={11} tone="emerald" />
                <span>Applied to Set!</span>
              </>
            ) : (
              <>
                <GaaIcon name="lightning" size={11} style={{ color: '#070D18', stroke: '#070D18' }} />
                <span>1-Tap Load: {rec.recommendedWeight} {unitLabel}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDetails(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gray)',
              fontSize: 11,
              cursor: 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Toggle load calculation details"
          >
            {showDetails ? <GaaIcon name="chevron-up" size={12} tone="slate" /> : <GaaIcon name="sparkles" size={12} tone="gold" />}
          </button>
        </div>
      </div>

      {/* Expanded Sports Science Rationale Breakdown */}
      {showDetails && (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 4,
            fontSize: 11.5,
            color: '#CBD5E1',
            display: 'grid',
            gap: 4,
          }}
        >
          <div>
            <strong style={{ color: 'var(--gold-lt)' }}>Clinical Logic:</strong> {rec.rationale}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            {rec.estimated1RmLbs > 0 && (
              <span>
                1RM: <strong>{preferredUnits === 'imperial' ? `${rec.estimated1RmLbs} lb` : `${rec.estimated1RmKg} kg`}</strong>
              </span>
            )}
            <span>
              Target Intensity: <strong>{rec.targetIntensityPercentage}% 1RM</strong>
            </span>
            <span>
              Tempo: <strong>{rec.recommendedTempo}</strong>
            </span>
            <span>
              RIR: <strong>{rec.recommendedRir} reps in reserve</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
