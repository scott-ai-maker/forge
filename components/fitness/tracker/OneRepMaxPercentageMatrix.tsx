'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  calculate1Rm,
  getOneRepMaxPercentageTiers,
  OneRepMaxPercentageTier,
} from '@/lib/progressive-overload-engine'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'

export interface OneRepMaxPercentageMatrixProps {
  exerciseName: string
  currentWeight?: string | number
  currentReps?: string | number
  historicalMax1RmLbs?: number | null
  units: 'imperial' | 'metric'
  isWarmup?: boolean
  isTimed?: boolean
  onApplyLoad?: (weight: string, reps: string) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
  className?: string
}

export default function OneRepMaxPercentageMatrix({
  exerciseName,
  currentWeight,
  currentReps,
  historicalMax1RmLbs,
  units,
  isWarmup,
  isTimed,
  onApplyLoad,
  triggerHaptic,
  className = '',
}: OneRepMaxPercentageMatrixProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [baselineSource, setBaselineSource] = useState<'live' | 'pr' | 'custom'>('live')
  const [custom1RmInput, setCustom1RmInput] = useState<string>('')
  const [appliedTierPct, setAppliedTierPct] = useState<number | null>(null)

  const repsNum = Number(currentReps) || 0
  const rawWeight = Number(currentWeight) || 0
  const currentWeightLbs = units === 'imperial' ? rawWeight : rawWeight * 2.20462

  // Live 1RM estimate from current input
  const live1RmResult = useMemo(() => {
    if (repsNum > 0 && currentWeightLbs > 0 && !isWarmup) {
      return calculate1Rm(currentWeightLbs, repsNum)
    }
    return null
  }, [currentWeightLbs, repsNum, isWarmup])

  // Determine active effective 1RM in lbs based on selected source
  const hasHistoricalPr = Boolean(historicalMax1RmLbs && historicalMax1RmLbs > 0)
  const custom1RmLbs = useMemo(() => {
    const parsed = Number(custom1RmInput) || 0
    if (parsed <= 0) return 0
    return units === 'imperial' ? parsed : parsed * 2.20462
  }, [custom1RmInput, units])

  const effective1RmLbs = useMemo(() => {
    if (baselineSource === 'pr' && hasHistoricalPr) {
      return historicalMax1RmLbs!
    }
    if (baselineSource === 'custom' && custom1RmLbs > 0) {
      return custom1RmLbs
    }
    if (live1RmResult && live1RmResult.average1RmLbs > 0) {
      return live1RmResult.average1RmLbs
    }
    if (hasHistoricalPr) {
      return historicalMax1RmLbs!
    }
    return 0
  }, [baselineSource, hasHistoricalPr, historicalMax1RmLbs, custom1RmLbs, live1RmResult])

  const effective1RmKg = Math.round((effective1RmLbs / 2.20462) * 10) / 10

  // Generate NASM OPT percentage tiers (95% down to 50%)
  const percentageTiers = useMemo(() => {
    if (effective1RmLbs <= 0) return []
    return getOneRepMaxPercentageTiers(effective1RmLbs, units)
  }, [effective1RmLbs, units])

  // Current working intensity percentage
  const workingPct = useMemo(() => {
    if (!live1RmResult || live1RmResult.average1RmLbs <= 0 || currentWeightLbs <= 0) return null
    return Math.round((currentWeightLbs / live1RmResult.average1RmLbs) * 100)
  }, [live1RmResult, currentWeightLbs])

  // Disallow timed/endurance interval exercises
  if (isTimed) return null

  // Strict neutral hammer grip check per AGENTS.md guardrail
  const isHammerCurl = exerciseName.toLowerCase().includes('hammer curl')

  // If no 1RM is calculable or available at all, hide component
  if (effective1RmLbs <= 0 && (!live1RmResult || live1RmResult.average1RmLbs <= 0)) {
    return null
  }

  const handleToggleExpand = () => {
    triggerHaptic?.('tap')
    setIsExpanded(prev => !prev)
  }

  const handleSelectTier = (tier: OneRepMaxPercentageTier) => {
    triggerHaptic?.('success')
    const loadWeight = units === 'imperial' ? String(tier.weightLbs) : String(tier.weightKg)
    const loadReps = String(tier.suggestedReps)

    if (onApplyLoad) {
      onApplyLoad(loadWeight, loadReps)
    }

    setAppliedTierPct(tier.percentage)
    setTimeout(() => {
      setAppliedTierPct(null)
    }, 2200)
  }

  // Phase badge color helper
  const getPhaseColor = (optPhase: number) => {
    switch (optPhase) {
      case 4:
        return '#EF4444' // Ruby / Red (Maximal Strength)
      case 3:
        return '#D4AF37' // Gold (Hypertrophy / Muscular Development)
      case 2:
        return '#10B981' // Emerald (Strength Endurance)
      case 1:
        return '#06B6D4' // Cyan (Stabilization Endurance)
      case 0:
      default:
        return '#A855F7' // Purple (Warm-up / Potentiation)
    }
  }

  return (
    <div
      className={className}
      style={{
        marginTop: 10,
        marginBottom: 8,
        borderRadius: 8,
        border: '1px solid rgba(212,160,23,0.35)',
        background: 'linear-gradient(135deg, rgba(13,27,42,0.85) 0%, rgba(17,28,46,0.95) 100%)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
      data-testid="one-rep-max-percentage-matrix"
    >
      {/* ── Collapsed Banner / Primary Header ── */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          cursor: 'pointer',
          background: isExpanded
            ? 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(13,27,42,0.7) 100%)'
            : 'transparent',
          transition: 'background 0.2s ease',
        }}
        onClick={handleToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggleExpand()
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              color: 'var(--gold-lt, #F3E5AB)',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              letterSpacing: '0.04em',
            }}
          >
            <GaaIcon name="lightning" size={13} tone="gold" />
            <span>Est. 1RM:</span>
          </span>

          <span
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 15,
              color: '#FFFFFF',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {units === 'imperial'
              ? `${effective1RmLbs} LBS`
              : `${effective1RmKg} KG`}
          </span>

          {workingPct !== null && (
            <span
              style={{
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(212,160,23,0.15)',
                border: '1px solid rgba(212,160,23,0.3)',
                color: 'var(--gold-lt, #F3E5AB)',
                fontWeight: 600,
              }}
            >
              {workingPct}% of 1RM
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            handleToggleExpand()
          }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--gold-lt, #F3E5AB)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
          aria-label={isExpanded ? 'Collapse 1RM percentage matrix' : 'Expand 1RM percentage matrix'}
        >
          <GaaIcon name="bar-chart" size={11} tone="gold" />
          <span>{isExpanded ? 'Hide % Matrix ▲' : '% Matrix ▾'}</span>
        </button>
      </div>

      {/* ── Expanded Tray Content ── */}
      {isExpanded && (
        <div
          style={{
            padding: '10px 12px 14px 12px',
            borderTop: '1px solid rgba(212,160,23,0.2)',
            background: 'rgba(10,18,28,0.7)',
          }}
        >
          {/* Biomechanical Guardrail: Strict Neutral Hammer Grip (AGENTS.md) */}
          {isHammerCurl && (
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
              data-testid="hammer-curl-guardrail-banner"
            >
              <GaaIcon name="info" size={14} tone="ruby" />
              <div style={{ fontSize: 11, color: '#FECACA', lineHeight: 1.4 }}>
                <strong style={{ color: '#F87171' }}>Strict Neutral Grip Required:</strong> For all hammer curl
                movements, palms must strictly face inward toward each other with <em>zero supination or twisting</em>.
                Dumbbells must remain oriented vertically with thumbs pointed up toward the ceiling.
              </div>
            </div>
          )}

          {/* ── Baseline 1RM Source Switcher ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 10,
              fontSize: 11,
            }}
          >
            <span style={{ color: 'var(--gray, #94A3B8)', fontWeight: 600 }}>
              Calculate % Off:
            </span>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {live1RmResult && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('tap')
                    setBaselineSource('live')
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: baselineSource === 'live' ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${baselineSource === 'live' ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                    color: baselineSource === 'live' ? '#FFFFFF' : 'var(--gray, #94A3B8)',
                  }}
                >
                  Current Set ({units === 'imperial' ? `${live1RmResult.average1RmLbs} lb` : `${live1RmResult.average1RmKg} kg`})
                </button>
              )}

              {hasHistoricalPr && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('tap')
                    setBaselineSource('pr')
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: baselineSource === 'pr' ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${baselineSource === 'pr' ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                    color: baselineSource === 'pr' ? '#FFFFFF' : 'var(--gray, #94A3B8)',
                  }}
                >
                  PR Record ({units === 'imperial' ? `${historicalMax1RmLbs} lb` : `${Math.round((historicalMax1RmLbs! / 2.20462) * 10) / 10} kg`})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setBaselineSource('custom')
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: baselineSource === 'custom' ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${baselineSource === 'custom' ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                  color: baselineSource === 'custom' ? '#FFFFFF' : 'var(--gray, #94A3B8)',
                }}
              >
                Custom 1RM
              </button>
            </div>
          </div>

          {/* Custom 1RM Input Field */}
          {baselineSource === 'custom' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <label style={{ fontSize: 11, color: 'var(--gray, #94A3B8)', fontWeight: 600 }}>
                Target 1RM ({units === 'imperial' ? 'lbs' : 'kg'}):
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={custom1RmInput}
                onFocus={selectOnFocus}
                onChange={e => {
                  const sanitized = sanitizeNumericInput(e.target.value)
                  setCustom1RmInput(sanitized)
                }}
                placeholder={units === 'imperial' ? 'e.g. 225' : 'e.g. 100'}
                style={{
                  width: 80,
                  height: 30,
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 4,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 12,
                }}
                data-testid="custom-1rm-input"
              />
            </div>
          )}

          {/* ── Percentage Tiers Grid ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {percentageTiers.map(tier => {
              const phaseColor = getPhaseColor(tier.optPhase)
              const isApplied = appliedTierPct === tier.percentage

              // Check if current draft weight matches this tier
              const tierWeightDisplay = units === 'imperial' ? tier.weightLbs : tier.weightKg
              const isCurrentTier =
                rawWeight > 0 && Math.abs(rawWeight - tierWeightDisplay) <= (units === 'imperial' ? 2.5 : 1.25)

              return (
                <div
                  key={tier.percentage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: isCurrentTier
                      ? 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(13,27,42,0.85) 100%)'
                      : 'rgba(255,255,255,0.03)',
                    border: isCurrentTier
                      ? '1px solid rgba(212,160,23,0.5)'
                      : '1px solid rgba(255,255,255,0.06)',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                  data-testid={`percentage-tier-${tier.percentage}`}
                >
                  {/* Left: Percentage & Phase Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 85 }}>
                    <div
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: 'var(--font-telemetry, monospace)',
                        background: `${phaseColor}22`,
                        color: phaseColor,
                        border: `1px solid ${phaseColor}55`,
                        textAlign: 'center',
                      }}
                    >
                      {tier.percentage}%
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-telemetry, monospace)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#FFFFFF',
                        }}
                      >
                        {tierWeightDisplay} {units === 'imperial' ? 'lb' : 'kg'}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Rep Range & NASM OPT Goal */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt, #F3E5AB)' }}>
                        {tier.repRangeText}
                      </span>
                      {isCurrentTier && (
                        <span
                          style={{
                            fontSize: 9.5,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: 'rgba(212,160,23,0.3)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--gray, #94A3B8)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={`${tier.phaseTitle}: ${tier.trainingGoal}`}
                    >
                      {tier.phaseTitle} · {tier.trainingGoal}
                    </div>
                  </div>

                  {/* Right: 1-Tap Load Action */}
                  {onApplyLoad && (
                    <button
                      type="button"
                      onClick={() => handleSelectTier(tier)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: isApplied
                          ? '#10B981'
                          : 'linear-gradient(135deg, rgba(212,160,23,0.3) 0%, rgba(212,160,23,0.15) 100%)',
                        color: isApplied ? '#FFFFFF' : 'var(--gold-lt, #F3E5AB)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                      }}
                      aria-label={`Apply ${tier.percentage}% tier: ${tierWeightDisplay} ${units === 'imperial' ? 'lbs' : 'kg'} for ${tier.suggestedReps} reps`}
                      data-testid={`apply-tier-${tier.percentage}`}
                    >
                      <GaaIcon
                        name={isApplied ? 'check' : 'plus'}
                        size={11}
                        tone={isApplied ? 'emerald' : 'gold'}
                      />
                      <span>{isApplied ? 'Loaded!' : 'Apply'}</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* NASM OPT Phase Reference Footer */}
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
            <span>NASM OPT™ Working Load Percentages</span>
            <span>Brzycki & Epley Algorithm</span>
          </div>
        </div>
      )}
    </div>
  )
}
