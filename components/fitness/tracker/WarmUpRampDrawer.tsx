'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  generateWarmUpProgressionStages,
  isHammerCurlMovement,
  WarmUpProtocolType,
  WarmUpWizardStage,
} from '@/lib/warmup-progression-wizard'
import { isOlympicWeightExercise } from '@/lib/barbell-plate-calculator'

export interface WarmUpRampDrawerProps {
  exerciseKey: string
  exerciseName: string
  draftWeight?: string
  oneRmLbs?: number | null
  units: 'imperial' | 'metric'
  isTimed?: boolean
  isBand?: boolean
  isOpen: boolean
  onToggle: () => void
  prescribedReps?: string | number | null
  onLogWarmupStage: (
    stageWeight: string,
    reps: number,
    restSeconds: number,
    stageNumber: number,
    totalStages?: number,
    stageTitle?: string
  ) => void
  onPopulateWorkingWeight?: (workingWeight: string, targetReps?: string) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
  className?: string
}

export default function WarmUpRampDrawer({
  exerciseKey: _exerciseKey,
  exerciseName,
  draftWeight,
  oneRmLbs,
  units,
  isTimed,
  isBand,
  isOpen,
  onToggle,
  prescribedReps,
  onLogWarmupStage,
  onPopulateWorkingWeight,
  triggerHaptic,
  className = '',
}: WarmUpRampDrawerProps) {
  const [protocolType, setProtocolType] = useState<WarmUpProtocolType>('standard_4')
  const [baselineMode, setBaselineMode] = useState<'working_weight' | 'one_rep_max'>('working_weight')
  const [completedStageNumbers, setCompletedStageNumbers] = useState<Set<number>>(new Set())
  const [targetWeightOffsetLbs, setTargetWeightOffsetLbs] = useState<number>(0)

  const isBarbell = isOlympicWeightExercise(exerciseName)
  const isDb = /\b(dumbbell|dumbbells|\bdb\b)\b/i.test(exerciseName)

  // Default target working weight
  const typedWeightNum = Number(draftWeight) || 0
  const baseTargetNum = typedWeightNum > 0 ? typedWeightNum : (isDb ? 50 : 135)
  const baseTargetLbs = units === 'imperial' ? baseTargetNum : baseTargetNum * 2.20462
  const effectiveWorkingWeightLbs = Math.max(isBarbell ? 45 : 10, baseTargetLbs + targetWeightOffsetLbs)

  const hasOneRm = Boolean(oneRmLbs && oneRmLbs > 0)
  const isHammer = isHammerCurlMovement(exerciseName)

  // Generate structured warm-up progression stages
  const rampStages = useMemo(() => {
    return generateWarmUpProgressionStages({
      exerciseName,
      targetWorkingWeightLbs: effectiveWorkingWeightLbs,
      oneRmLbs,
      baselineMode: hasOneRm && baselineMode === 'one_rep_max' ? 'one_rep_max' : 'working_weight',
      protocolType,
      units,
      barbellType: 'olympic_45',
    })
  }, [
    exerciseName,
    effectiveWorkingWeightLbs,
    oneRmLbs,
    baselineMode,
    hasOneRm,
    protocolType,
    units,
  ])

  if (isTimed || isBand) return null
  if (rampStages.length === 0) return null

  const displayTargetWeight =
    units === 'imperial'
      ? Math.round(effectiveWorkingWeightLbs)
      : Math.round((effectiveWorkingWeightLbs / 2.20462) * 10) / 10

  const handleLogStage = (stage: WarmUpWizardStage) => {
    triggerHaptic?.('success')
    const loadWeight = units === 'imperial' ? String(stage.weightLbs) : String(stage.weightKg)

    setCompletedStageNumbers(prev => new Set(prev).add(stage.stageNumber))

    onLogWarmupStage(
      loadWeight,
      stage.reps,
      stage.restSeconds,
      stage.stageNumber,
      stage.totalStages,
      stage.stageTitle
    )

    // Automatically auto-populate working set when final warm-up ramp stage is logged!
    if (stage.stageNumber === stage.totalStages && onPopulateWorkingWeight) {
      const workingWeightStr = String(displayTargetWeight)
      onPopulateWorkingWeight(workingWeightStr, prescribedReps ? String(prescribedReps) : undefined)
    }
  }

  const handleManualAutoPopulateWorkingSet = () => {
    triggerHaptic?.('success')
    if (onPopulateWorkingWeight) {
      onPopulateWorkingWeight(String(displayTargetWeight), prescribedReps ? String(prescribedReps) : undefined)
    }
  }

  const getStageBadgeColor = (stageNum: number, total: number) => {
    const ratio = stageNum / total
    if (ratio <= 0.25) return '#06B6D4' // Cyan (Priming)
    if (ratio <= 0.5) return '#10B981'  // Emerald (Speed)
    if (ratio <= 0.75) return '#D4AF37' // Gold (Transition)
    return '#F59E0B'                   // Amber / Orange (PAP Primer)
  }

  return (
    <div
      className={className}
      style={{
        marginBottom: 12,
        background: 'linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(13,27,42,0.85) 100%)',
        border: '1px solid rgba(212,160,23,0.35)',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
      data-testid="warmup-progression-wizard"
    >
      {/* ── Wizard Accordion Toggle Header ── */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
          cursor: 'pointer',
          background: isOpen ? 'rgba(212,160,23,0.12)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              color: 'var(--gold-lt, #F3E5AB)',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="flame" size={13} tone="gold" />
            <span>Warm-Up Ramp-Up Wizard</span>
          </span>

          <span
            style={{
              fontSize: 10.5,
              padding: '1px 6px',
              borderRadius: 3,
              background: 'rgba(212,160,23,0.18)',
              color: 'var(--gold-lt, #F3E5AB)',
              fontWeight: 700,
            }}
          >
            {rampStages.length} Sets to {displayTargetWeight} {units === 'imperial' ? 'lb' : 'kg'}
          </span>
        </div>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            triggerHaptic?.('tap')
            onToggle()
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--gold-lt, #F3E5AB)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          aria-label={isOpen ? 'Collapse warm-up wizard' : 'Expand warm-up wizard'}
        >
          <GaaIcon name={isOpen ? 'chevron-up' : 'chevron-down'} size={11} tone="gold" />
          <span>{isOpen ? 'Close' : 'Open Wizard ▾'}</span>
        </button>
      </div>

      {/* ── Expanded Wizard Tray ── */}
      {isOpen && (
        <div
          style={{
            padding: '10px 12px 14px 12px',
            borderTop: '1px solid rgba(212,160,23,0.2)',
            background: 'rgba(10,18,28,0.7)',
          }}
        >
          {/* Biomechanical Guardrail: Strict Neutral Hammer Grip (AGENTS.md) */}
          {isHammer && (
            <div
              style={{
                marginBottom: 10,
                padding: '8px 10px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
              data-testid="warmup-hammer-guardrail-banner"
            >
              <GaaIcon name="info" size={14} tone="ruby" />
              <div style={{ fontSize: 11, color: '#FECACA', lineHeight: 1.4 }}>
                <strong style={{ color: '#F87171' }}>Strict Neutral Grip Required:</strong> For all hammer curl
                movements, palms must strictly face inward toward each other with <em>zero supination or twisting</em>.
                Dumbbells must remain oriented vertically with thumbs pointed up toward the ceiling.
              </div>
            </div>
          )}

          {/* ── Protocol & Baseline Controls ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
              fontSize: 11,
            }}
          >
            {/* Protocol Type Selector */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setProtocolType('standard_4')
                  setBaselineMode('working_weight')
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: protocolType === 'standard_4' && baselineMode === 'working_weight'
                    ? 'rgba(212,160,23,0.3)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${protocolType === 'standard_4' && baselineMode === 'working_weight' ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                  color: protocolType === 'standard_4' && baselineMode === 'working_weight' ? '#FFFFFF' : 'var(--gray, #94A3B8)',
                }}
              >
                Standard (4 Sets)
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setProtocolType('express_3')
                  setBaselineMode('working_weight')
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: protocolType === 'express_3'
                    ? 'rgba(212,160,23,0.3)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${protocolType === 'express_3' ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                  color: protocolType === 'express_3' ? '#FFFFFF' : 'var(--gray, #94A3B8)',
                }}
              >
                Express (3 Sets)
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setProtocolType('heavy_compound_5')
                  setBaselineMode('working_weight')
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: protocolType === 'heavy_compound_5'
                    ? 'rgba(212,160,23,0.3)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${protocolType === 'heavy_compound_5' ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                  color: protocolType === 'heavy_compound_5' ? '#FFFFFF' : 'var(--gray, #94A3B8)',
                }}
              >
                Heavy (5 Sets)
              </button>

              {hasOneRm && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('tap')
                    setBaselineMode('one_rep_max')
                    setProtocolType('one_rep_max')
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: baselineMode === 'one_rep_max'
                      ? 'rgba(212,160,23,0.3)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${baselineMode === 'one_rep_max' ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                    color: baselineMode === 'one_rep_max' ? '#FFFFFF' : 'var(--gray, #94A3B8)',
                  }}
                >
                  1RM % Mode ({units === 'imperial' ? `${oneRmLbs} lb` : `${Math.round((oneRmLbs! / 2.20462) * 10) / 10} kg`})
                </button>
              )}
            </div>

            {/* Target Weight Adjustment Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--gray, #94A3B8)' }}>Target:</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setTargetWeightOffsetLbs(prev => prev - 5)
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 11,
                }}
                aria-label="Decrease target working weight by 5 lbs"
              >
                −
              </button>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  minWidth: 44,
                  textAlign: 'center',
                }}
              >
                {displayTargetWeight} {units === 'imperial' ? 'lb' : 'kg'}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setTargetWeightOffsetLbs(prev => prev + 5)
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 11,
                }}
                aria-label="Increase target working weight by 5 lbs"
              >
                +
              </button>
            </div>
          </div>

          {/* ── Progression Stage Cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rampStages.map(stage => {
              const displayWeight =
                units === 'imperial' ? stage.weightLbs : stage.weightKg
              const isCompleted = completedStageNumbers.has(stage.stageNumber)
              const badgeColor = getStageBadgeColor(stage.stageNumber, stage.totalStages)

              return (
                <div
                  key={stage.stageNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    background: isCompleted
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(0,0,0,0.35)',
                    border: isCompleted
                      ? '1px solid rgba(16,185,129,0.35)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    transition: 'all 0.2s ease',
                  }}
                  data-testid={`warmup-stage-${stage.stageNumber}`}
                >
                  {/* Left: Stage Number & Target Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          fontFamily: 'var(--font-telemetry, monospace)',
                          color: badgeColor,
                          background: `${badgeColor}22`,
                          border: `1px solid ${badgeColor}55`,
                          padding: '1px 5px',
                          borderRadius: 3,
                        }}
                      >
                        STAGE {stage.stageNumber}/{stage.totalStages} ({stage.percentage}%)
                      </span>

                      <span
                        style={{
                          fontFamily: 'var(--font-telemetry, monospace)',
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#FFFFFF',
                        }}
                      >
                        {displayWeight} {units === 'imperial' ? 'lb' : 'kg'} × {stage.reps} reps
                      </span>

                      <span style={{ fontSize: 10, color: 'var(--gray, #94A3B8)' }}>
                        ⏱ {stage.restSeconds}s rest
                      </span>

                      {isCompleted && (
                        <span
                          style={{
                            fontSize: 9.5,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: 'rgba(16,185,129,0.2)',
                            color: '#10B981',
                            fontWeight: 700,
                          }}
                        >
                          ✓ Logged
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 3 }}>
                      <strong style={{ color: 'var(--gold-lt, #F3E5AB)' }}>{stage.stageTitle}:</strong>{' '}
                      {stage.physiologicalObjective}
                    </div>

                    {/* Equipment Plate Breakdown */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: 10, color: 'var(--gray, #64748B)' }}>
                        Equipment:
                      </span>
                      <span style={{ fontSize: 10.5, color: '#CBD5E1', fontWeight: 600 }}>
                        {stage.platesSummary}
                      </span>

                      {/* Visual colored plate chips for barbells */}
                      {stage.platesPerSide && stage.platesPerSide.length > 0 && (
                        <div style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
                          {stage.platesPerSide.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              style={{
                                padding: '1px 4px',
                                borderRadius: 2,
                                fontSize: 9.5,
                                fontWeight: 800,
                                background: p.denomination.color,
                                color: p.denomination.textColor,
                                border: '1px solid rgba(255,255,255,0.2)',
                              }}
                              title={`${p.count} × ${p.denomination.weightLbs} lb plate per side`}
                            >
                              {p.count > 1 ? `${p.count}×` : ''}{p.denomination.weightLbs}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: 1-Tap Log Warm-Up Action */}
                  <button
                    type="button"
                    onClick={() => handleLogStage(stage)}
                    className="tactile-btn"
                    style={{
                      background: isCompleted
                        ? 'rgba(16,185,129,0.2)'
                        : 'linear-gradient(135deg, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.12) 100%)',
                      border: isCompleted
                        ? '1px solid rgba(16,185,129,0.5)'
                        : '1px solid rgba(212,160,23,0.5)',
                      color: isCompleted ? '#34D399' : 'var(--gold-lt, #F3E5AB)',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '6px 12px',
                      borderRadius: 5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                    aria-label={`Log warm-up stage ${stage.stageNumber}: ${displayWeight} ${units === 'imperial' ? 'lb' : 'kg'} for ${stage.reps} reps`}
                    data-testid={`log-warmup-stage-${stage.stageNumber}`}
                  >
                    <GaaIcon
                      name={isCompleted ? 'check' : 'lightning'}
                      size={12}
                      tone={isCompleted ? 'emerald' : 'gold'}
                    />
                    <span>{isCompleted ? 'Logged' : '1-Tap Log'}</span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* ── Working Set 1 Auto-Populator Quick Action Banner ── */}
          {onPopulateWorkingWeight && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 10px',
                borderRadius: 6,
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
              data-testid="warmup-autopopulate-banner"
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <GaaIcon name="lightning" size={12} tone="cyan" />
                  <span>Auto-Populator Ready: Working Set 1</span>
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                  Logging final warm-up or tapping below arms Set 1 at {displayTargetWeight} {units === 'imperial' ? 'lb' : 'kg'}.
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualAutoPopulateWorkingSet}
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  border: '1px solid #38BDF8',
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '5px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title={`Arm Working Set 1 at ${displayTargetWeight} ${units === 'imperial' ? 'lb' : 'kg'}`}
                data-testid="btn-arm-working-set"
              >
                <GaaIcon name="check" size={11} tone="inherit" />
                <span>Arm Set 1 ({displayTargetWeight} {units === 'imperial' ? 'lb' : 'kg'})</span>
              </button>
            </div>
          )}

          {/* Wizard Footer Reference */}
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 10,
              color: 'var(--gray, #64748B)',
            }}
          >
            <span>NASM Kinetic Warm-Up & PAP Primer</span>
            <span>Non-Fatiguing Potentiation Model</span>
          </div>
        </div>
      )}
    </div>
  )
}
