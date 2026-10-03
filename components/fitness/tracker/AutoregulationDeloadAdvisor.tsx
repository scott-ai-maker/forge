'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  evaluateExerciseAutoregulation,
  computeSessionRpeTelemetry,
  CompletedSetPerformance,
  AutoregulationAdvice,
} from '@/lib/autoregulation-advisor-engine'
import type { DropStage } from '@/lib/intensity-protocols-engine'
import {
  generateClusterSetPlan,
  generateMyoRepsPlan,
  type ClusterSetPlan,
  type MyoRepsPlan,
} from '@/lib/cluster-myoreps-advisor-engine'

export interface AutoregulationDeloadAdvisorProps {
  exerciseName: string
  currentDraftWeight: string | number
  currentDraftReps: string | number
  targetReps?: string | number | null
  completedSets: CompletedSetPerformance[]
  units: 'imperial' | 'metric'
  isTimed?: boolean
  sessionDurationMinutes?: number
  allSessionSets?: CompletedSetPerformance[]
  velocityLossPercent?: number
  onApplyDeloadWeight?: (newWeight: string) => void
  onApplyRepCap?: (newReps: string) => void
  onExtendRestTimer?: (additionalSeconds: number) => void
  onOpenDropSet?: (stages: DropStage[]) => void
  onApplyClusterSet?: (clusterPlan: ClusterSetPlan) => void
  onApplyMyoReps?: (myoPlan: MyoRepsPlan) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
  className?: string
}

export default function AutoregulationDeloadAdvisor({
  exerciseName,
  currentDraftWeight,
  currentDraftReps,
  targetReps,
  completedSets,
  units,
  isTimed,
  sessionDurationMinutes = 45,
  allSessionSets,
  velocityLossPercent,
  onApplyDeloadWeight,
  onApplyRepCap,
  onExtendRestTimer,
  onOpenDropSet,
  onApplyClusterSet,
  onApplyMyoReps,
  triggerHaptic,
  className = '',
}: AutoregulationDeloadAdvisorProps) {
  const [showSessionGauge, setShowSessionGauge] = useState(false)
  const [showDropSetPreview, setShowDropSetPreview] = useState(false)
  const [showClusterPreview, setShowClusterPreview] = useState(false)
  const [showMyoRepsPreview, setShowMyoRepsPreview] = useState(false)
  const [appliedAction, setAppliedAction] = useState<string | null>(null)

  const rawWeight = Number(currentDraftWeight) || 0
  const weightLbs = units === 'imperial' ? rawWeight : rawWeight * 2.20462
  const repsNum = Number(currentDraftReps) || 0

  const advice: AutoregulationAdvice = useMemo(() => {
    return evaluateExerciseAutoregulation({
      exerciseName,
      currentDraftWeightLbs: weightLbs,
      currentDraftReps: repsNum,
      targetReps,
      completedSets,
      units,
      velocityLossPercent,
    })
  }, [exerciseName, weightLbs, repsNum, targetReps, completedSets, units, velocityLossPercent])

  const sessionTelemetry = useMemo(() => {
    const setsToEvaluate = allSessionSets && allSessionSets.length > 0 ? allSessionSets : completedSets
    return computeSessionRpeTelemetry(setsToEvaluate, sessionDurationMinutes)
  }, [allSessionSets, completedSets, sessionDurationMinutes])

  const clusterPlan: ClusterSetPlan = useMemo(() => {
    return generateClusterSetPlan({
      exerciseName,
      currentWeightLbs: weightLbs,
      targetReps: targetReps ?? repsNum,
      units,
    })
  }, [exerciseName, weightLbs, targetReps, repsNum, units])

  const myoPlan: MyoRepsPlan = useMemo(() => {
    return generateMyoRepsPlan({
      exerciseName,
      currentWeightLbs: weightLbs,
      targetReps: targetReps ?? repsNum,
      units,
    })
  }, [exerciseName, weightLbs, targetReps, repsNum, units])

  if (isTimed) return null

  // Don't clutter UI if athlete is fresh and hasn't logged any sets yet
  if (advice.fatigueLevel === 'fresh') {
    return null
  }

  const handleApplyWeight = (newWeightStr: string) => {
    triggerHaptic?.('success')
    onApplyDeloadWeight?.(newWeightStr)
    setAppliedAction('weight')
    setTimeout(() => setAppliedAction(null), 2500)
  }

  const handleApplyReps = (newRepsStr: string) => {
    triggerHaptic?.('success')
    onApplyRepCap?.(newRepsStr)
    setAppliedAction('reps')
    setTimeout(() => setAppliedAction(null), 2500)
  }

  const handleExtendRest = (secs: number) => {
    triggerHaptic?.('tap')
    onExtendRestTimer?.(secs)
    setAppliedAction('rest')
    setTimeout(() => setAppliedAction(null), 2500)
  }

  const getSeverityTheme = () => {
    switch (advice.fatigueLevel) {
      case 'critical_overload':
        return {
          border: '1px solid rgba(239, 68, 68, 0.6)',
          bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(13, 27, 42, 0.9) 100%)',
          badgeBg: 'rgba(239, 68, 68, 0.25)',
          badgeColor: '#EF4444',
          iconName: 'alert-triangle' as const,
          iconTone: 'ruby' as const,
        }
      case 'elevated_fatigue':
        return {
          border: '1px solid rgba(245, 158, 11, 0.5)',
          bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(13, 27, 42, 0.85) 100%)',
          badgeBg: 'rgba(245, 158, 11, 0.2)',
          badgeColor: '#F59E0B',
          iconName: 'flame' as const,
          iconTone: 'amber' as const,
        }
      case 'optimal_strain':
      default:
        return {
          border: '1px solid rgba(16, 185, 129, 0.35)',
          bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 27, 42, 0.75) 100%)',
          badgeBg: 'rgba(16, 185, 129, 0.18)',
          badgeColor: '#10B981',
          iconName: 'shield' as const,
          iconTone: 'emerald' as const,
        }
    }
  }

  const theme = getSeverityTheme()
  const displaySuggestedWeight = units === 'imperial' ? advice.suggestedWeightLbs : advice.suggestedWeightKg

  return (
    <div
      className={className}
      style={{
        marginTop: 10,
        marginBottom: 8,
        borderRadius: 8,
        border: theme.border,
        background: theme.bg,
        padding: '10px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
      data-testid="autoregulation-deload-advisor"
    >
      {/* ── Advisor Header & Badge ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GaaIcon name={theme.iconName} size={14} tone={theme.iconTone} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#FFFFFF',
            }}
          >
            Autoregulation Advisor
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 4,
              background: theme.badgeBg,
              color: theme.badgeColor,
              border: `1px solid ${theme.badgeColor}55`,
            }}
          >
            {advice.badgeText}
          </span>
        </div>

        {/* Foster Session RPE Gauge Toggle */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setShowSessionGauge(prev => !prev)
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--gray, #94A3B8)',
            fontSize: 10.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 700,
          }}
          aria-label={showSessionGauge ? 'Hide Session sRPE Gauge' : 'Show Session sRPE Gauge'}
        >
          <GaaIcon name="activity" size={11} tone="gold" />
          <span>sRPE Gauge {showSessionGauge ? '▲' : '▾'}</span>
        </button>
      </div>

      {/* ── Headline & Rationale ── */}
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#FFFFFF', marginBottom: 3 }}>
        {advice.headline}
      </div>
      <div style={{ fontSize: 11, color: 'var(--gray, #94A3B8)', lineHeight: 1.45, marginBottom: 8 }}>
        {advice.rationale}
      </div>

      {/* ── Biomechanical Guardrail: Strict Neutral Hammer Grip (AGENTS.md) ── */}
      {advice.isHammerCurl && advice.biomechanicalWarning && (
        <div
          style={{
            marginBottom: 8,
            padding: '8px 10px',
            borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
          data-testid="hammer-curl-fatigue-guardrail"
        >
          <GaaIcon name="alert-triangle" size={14} tone="ruby" />
          <div style={{ fontSize: 10.5, color: '#FECACA', lineHeight: 1.4 }}>
            <strong style={{ color: '#F87171' }}>Strict Neutral Grip Guardrail:</strong> Under forearm and
            brachioradialis fatigue, maintain strictly vertical dumbbells with thumbs pointed toward the ceiling and{' '}
            <em>strictly zero twisting or supination</em>. Do not swing torso to compensate.
          </div>
        </div>
      )}

      {/* ── Acute Fatigue Drop Alert Banner ── */}
      {advice.hasAcuteFatigueDrop && (
        <div
          style={{
            marginBottom: 8,
            padding: '7px 10px',
            borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6,
          }}
          data-testid="acute-fatigue-drop-alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>⚠️</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Acute Fatigue Drop: −{advice.acuteFatigueDropPercent}%
            </span>
          </div>
          {advice.acuteFatigueDropReason && (
            <span style={{ fontSize: 10, color: '#FCA5A5', fontWeight: 600 }}>
              {advice.acuteFatigueDropReason}
            </span>
          )}
        </div>
      )}

      {/* ── 1-Tap Action Buttons ── */}
      {(advice.action !== 'maintain' || advice.suggestedRestExtensionSeconds || advice.dropSetRecommendation?.shouldConvert || onApplyClusterSet || onApplyMyoReps) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {displaySuggestedWeight !== undefined && onApplyDeloadWeight && (
            <button
              type="button"
              onClick={() => handleApplyWeight(String(displaySuggestedWeight))}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                background: appliedAction === 'weight' ? '#10B981' : 'rgba(212,160,23,0.25)',
                border: `1px solid ${appliedAction === 'weight' ? '#10B981' : '#D4AF37'}`,
                color: appliedAction === 'weight' ? '#FFFFFF' : 'var(--gold-lt, #F3E5AB)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
              }}
              data-testid="apply-deload-weight-btn"
            >
              <GaaIcon
                name={appliedAction === 'weight' ? 'check' : 'scale'}
                size={11}
                tone={appliedAction === 'weight' ? 'emerald' : 'gold'}
              />
              <span>
                {appliedAction === 'weight'
                  ? 'Applied!'
                  : `Apply ${advice.action === 'reduce_load_15pct' ? '−15%' : advice.action === 'reduce_load_10pct' ? '−10%' : '−5%'} Load (${displaySuggestedWeight} ${units === 'imperial' ? 'lb' : 'kg'})`}
              </span>
            </button>
          )}

          {advice.dropSetRecommendation?.shouldConvert && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                setShowDropSetPreview(prev => !prev)
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                background: showDropSetPreview ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.18)',
                border: '1px solid #EF4444',
                color: '#FECACA',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
              }}
              data-testid="convert-drop-set-btn"
            >
              <span>🔥</span>
              <span>{showDropSetPreview ? 'Hide Drop-Set' : 'Convert to Drop-Set (3 Stages)'}</span>
            </button>
          )}

          {onApplyClusterSet && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                setShowClusterPreview(prev => !prev)
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                background: showClusterPreview ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.18)',
                border: '1px solid #3B82F6',
                color: '#93C5FD',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
              }}
              data-testid="convert-cluster-set-btn"
            >
              <span>⚡</span>
              <span>{showClusterPreview ? 'Hide Cluster Set' : `Convert to Cluster Set (3×${clusterPlan.repsPerCluster})`}</span>
            </button>
          )}

          {onApplyMyoReps && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                setShowMyoRepsPreview(prev => !prev)
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                background: showMyoRepsPreview ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.18)',
                border: '1px solid #A855F7',
                color: '#E9D5FF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
              }}
              data-testid="convert-myoreps-btn"
            >
              <span>💥</span>
              <span>{showMyoRepsPreview ? 'Hide Myo-Reps' : 'Convert to Myo-Reps (Act + 4 mini)'}</span>
            </button>
          )}

          {advice.suggestedReps !== undefined && onApplyRepCap && (
            <button
              type="button"
              onClick={() => handleApplyReps(String(advice.suggestedReps))}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                background: appliedAction === 'reps' ? '#10B981' : 'rgba(56,189,248,0.2)',
                border: `1px solid ${appliedAction === 'reps' ? '#10B981' : '#38BDF8'}`,
                color: appliedAction === 'reps' ? '#FFFFFF' : '#BAE6FD',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
              }}
              data-testid="apply-rep-cap-btn"
            >
              <GaaIcon
                name={appliedAction === 'reps' ? 'check' : 'target'}
                size={11}
                tone={appliedAction === 'reps' ? 'emerald' : 'gold'}
              />
              <span>{appliedAction === 'reps' ? 'Applied!' : `Cap at ${advice.suggestedReps} Reps`}</span>
            </button>
          )}

          {advice.suggestedRestExtensionSeconds !== undefined && onExtendRestTimer && (
            <button
              type="button"
              onClick={() => handleExtendRest(advice.suggestedRestExtensionSeconds!)}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                background: appliedAction === 'rest' ? '#10B981' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: appliedAction === 'rest' ? '#FFFFFF' : '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
              }}
              data-testid="extend-rest-timer-btn"
            >
              <GaaIcon
                name={appliedAction === 'rest' ? 'check' : 'timer'}
                size={11}
                tone={appliedAction === 'rest' ? 'emerald' : 'slate'}
              />
              <span>{appliedAction === 'rest' ? 'Extended!' : `+${advice.suggestedRestExtensionSeconds}s Rest`}</span>
            </button>
          )}
        </div>
      )}

      {/* ── Drop Set Preview Tray ── */}
      {showDropSetPreview && advice.dropSetRecommendation && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 6,
          }}
          data-testid="drop-set-preview-tray"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase' }}>
              Auto-Regulated 3-Stage Drop Set Plan
            </span>
            <span style={{ fontSize: 10, color: 'var(--gray)' }}>
              Total Vol: {units === 'imperial' ? `${advice.dropSetRecommendation.totalVolumeLbs.toLocaleString()} lbs` : `${advice.dropSetRecommendation.totalVolumeKg.toLocaleString()} kg`}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
            {advice.dropSetRecommendation.stages.map((stg, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  padding: '6px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Stage {stg.stageNumber} {i > 0 && `(-${stg.percentDropFromInitial}%)`}
                </div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  {units === 'imperial' ? `${stg.weightLbs} lb` : `${Math.round(stg.weightLbs / 2.20462)} kg`}
                </div>
                <div style={{ fontSize: 10, color: 'var(--gold-lt)' }}>
                  {stg.reps} reps
                </div>
              </div>
            ))}
          </div>
          {onOpenDropSet && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('heavy')
                onOpenDropSet(advice.dropSetRecommendation!.stages)
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                border: '1px solid #EF4444',
                borderRadius: 4,
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
              }}
              data-testid="arm-drop-set-btn"
            >
              Arm Drop Set Protocol ➔
            </button>
          )}
        </div>
      )}

      {/* ── Cluster Set Preview Tray ── */}
      {showClusterPreview && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: 6,
          }}
          data-testid="cluster-set-preview-tray"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase' }}>
              Auto-Regulated Cluster Set Protocol ({clusterPlan.clusterCount}×{clusterPlan.repsPerCluster})
            </span>
            <span style={{ fontSize: 10, color: 'var(--gray, #94A3B8)' }}>
              Intra-Rest: {clusterPlan.intraRestSeconds}s | Vol: {units === 'imperial' ? `${clusterPlan.totalVolumeLbs.toLocaleString()} lbs` : `${clusterPlan.totalVolumeKg.toLocaleString()} kg`}
            </span>
          </div>

          {clusterPlan.guardrailMandate && (
            <div
              style={{
                marginBottom: 8,
                padding: '6px 8px',
                borderRadius: 4,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontSize: 10,
                color: '#FECACA',
                lineHeight: 1.35,
              }}
              data-testid="cluster-hammer-guardrail-alert"
            >
              <strong style={{ color: '#F87171' }}>Guardrail:</strong> {clusterPlan.guardrailMandate}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${clusterPlan.clusterCount}, 1fr)`, gap: 6, marginBottom: 8 }}>
            {clusterPlan.stages.map((stg) => (
              <div
                key={stg.clusterIndex}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 4,
                  padding: '6px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9.5, color: '#93C5FD', textTransform: 'uppercase', fontWeight: 700 }}>
                  Cluster {stg.clusterIndex}
                </div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  {units === 'imperial' ? `${stg.weightLbs} lb` : `${stg.weightKg} kg`}
                </div>
                <div style={{ fontSize: 10, color: 'var(--gold-lt, #F3E5AB)' }}>
                  {stg.reps} reps
                </div>
                <div style={{ fontSize: 8.5, color: stg.intraRestSeconds > 0 ? '#38BDF8' : '#34D399', marginTop: 2, fontWeight: 600 }}>
                  {stg.intraRestSeconds > 0 ? `${stg.intraRestSeconds}s rest` : 'Rack bar'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 }}>
            {clusterPlan.rationale}
          </div>

          {onApplyClusterSet && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('heavy')
                onApplyClusterSet(clusterPlan)
                setAppliedAction('cluster')
                setTimeout(() => setAppliedAction(null), 2500)
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: appliedAction === 'cluster' ? '#10B981' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                border: '1px solid #3B82F6',
                borderRadius: 4,
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              data-testid="arm-cluster-set-btn"
            >
              {appliedAction === 'cluster' ? 'Cluster Set Armed! ✓' : 'Arm Cluster Set Protocol ➔'}
            </button>
          )}
        </div>
      )}

      {/* ── Myo-Reps Preview Tray ── */}
      {showMyoRepsPreview && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: 'rgba(26, 16, 37, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: 6,
          }}
          data-testid="myoreps-preview-tray"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#E9D5FF', textTransform: 'uppercase' }}>
              Auto-Regulated Myo-Reps Protocol (Act + {myoPlan.miniSets.length} mini)
            </span>
            <span style={{ fontSize: 10, color: 'var(--gray, #94A3B8)' }}>
              Effective Reps: {myoPlan.totalEffectiveReps} | Vol: {units === 'imperial' ? `${myoPlan.totalVolumeLbs.toLocaleString()} lbs` : `${myoPlan.totalVolumeKg.toLocaleString()} kg`}
            </span>
          </div>

          {myoPlan.guardrailMandate && (
            <div
              style={{
                marginBottom: 8,
                padding: '6px 8px',
                borderRadius: 4,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontSize: 10,
                color: '#FECACA',
                lineHeight: 1.35,
              }}
              data-testid="myoreps-hammer-guardrail-alert"
            >
              <strong style={{ color: '#F87171' }}>Guardrail:</strong> {myoPlan.guardrailMandate}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 8 }}>
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: 4,
                padding: '6px 4px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 8.5, color: '#C084FC', textTransform: 'uppercase', fontWeight: 700 }}>
                Activation
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 12, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                {units === 'imperial' ? `${myoPlan.activationWeightLbs} lb` : `${myoPlan.activationWeightKg} kg`}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--gold-lt, #F3E5AB)' }}>
                {myoPlan.activationReps} reps
              </div>
              <div style={{ fontSize: 8, color: '#A855F7', marginTop: 2, fontWeight: 600 }}>
                {myoPlan.intraRestSeconds}s rest
              </div>
            </div>

            {myoPlan.miniSets.map((mini) => (
              <div
                key={mini.miniSetIndex}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: 4,
                  padding: '6px 4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 8.5, color: '#E9D5FF', textTransform: 'uppercase', fontWeight: 700 }}>
                  Mini #{mini.miniSetIndex}
                </div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 12, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  +{mini.targetReps}
                </div>
                <div style={{ fontSize: 9.5, color: '#34D399' }}>
                  eff. reps
                </div>
                <div style={{ fontSize: 8, color: mini.intraRestSeconds > 0 ? '#C084FC' : '#10B981', marginTop: 2, fontWeight: 600 }}>
                  {mini.intraRestSeconds > 0 ? `${mini.intraRestSeconds}s` : 'Done'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 }}>
            {myoPlan.rationale}
          </div>

          {onApplyMyoReps && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('heavy')
                onApplyMyoReps(myoPlan)
                setAppliedAction('myoreps')
                setTimeout(() => setAppliedAction(null), 2500)
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: appliedAction === 'myoreps' ? '#10B981' : 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
                border: '1px solid #A855F7',
                borderRadius: 4,
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              data-testid="arm-myoreps-btn"
            >
              {appliedAction === 'myoreps' ? 'Myo-Reps Protocol Armed! ✓' : 'Arm Myo-Reps Protocol ➔'}
            </button>
          )}
        </div>
      )}

      {/* ── Foster Session-RPE & Systemic Fatigue Gauge Tray ── */}
      {showSessionGauge && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'grid',
            gap: 6,
          }}
          data-testid="session-rpe-gauge-tray"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 4,
              fontSize: 11,
            }}
          >
            <span style={{ color: 'var(--gray, #94A3B8)', fontWeight: 600 }}>
              Foster Session Load (sRPE × Min):
            </span>
            <span
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontWeight: 800,
                color: sessionTelemetry.loadZoneColor,
              }}
            >
              {sessionTelemetry.fosterTrainingLoadAu} A.U. ({sessionTelemetry.loadZoneLabel})
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 4,
              fontSize: 10.5,
              color: 'var(--gray, #94A3B8)',
            }}
          >
            <span>Avg Session RPE: <strong style={{ color: '#FFFFFF' }}>{sessionTelemetry.averageRpe}</strong></span>
            <span>Avg Working RIR: <strong style={{ color: '#FFFFFF' }}>{sessionTelemetry.averageRir}</strong></span>
            <span>Working Sets: <strong style={{ color: '#FFFFFF' }}>{sessionTelemetry.totalWorkingSets}</strong></span>
            <span>Failure Sets: <strong style={{ color: sessionTelemetry.failureSetsCount > 0 ? '#EF4444' : '#FFFFFF' }}>{sessionTelemetry.failureSetsCount}</strong></span>
          </div>

          <div style={{ fontSize: 10, color: 'var(--gray, #64748B)', marginTop: 2 }}>
            <em>{sessionTelemetry.sessionGuidance}</em>
          </div>
        </div>
      )}
    </div>
  )
}
