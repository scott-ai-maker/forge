'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  calculateBarbellPlates,
  getWeightPresetsForExercise,
  isOlympicWeightExercise,
  type PlateCount,
} from '@/lib/barbell-plate-calculator'

export interface PlateAdjustmentPresetsProps {
  exerciseName: string
  currentWeight?: string | number
  units: 'imperial' | 'metric'
  isTimed?: boolean
  isBand?: boolean
  onChangeWeight: (newWeight: string) => void
  onOpenPlateCalculator?: (targetWeightLbs: number) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function PlateAdjustmentPresets({
  exerciseName,
  currentWeight,
  units,
  isTimed,
  isBand,
  onChangeWeight,
  onOpenPlateCalculator,
  triggerHaptic,
}: PlateAdjustmentPresetsProps) {
  const [showMilestones, setShowMilestones] = useState(false)

  const numWeight = Number(currentWeight) || 0
  const weightLbs = units === 'imperial' ? numWeight : numWeight * 2.20462
  const isOlympic = isOlympicWeightExercise(exerciseName) || (units === 'imperial' ? numWeight >= 45 : numWeight >= 20)

  const config = useMemo(() => {
    return getWeightPresetsForExercise(exerciseName, units, numWeight)
  }, [exerciseName, units, numWeight])

  const plateCalc = useMemo(() => {
    if (!isOlympic || weightLbs < 45) return null
    return calculateBarbellPlates(weightLbs, 'olympic_45')
  }, [isOlympic, weightLbs])

  if (isTimed || isBand) return null

  const handleAdjust = (delta: number) => {
    triggerHaptic?.('tap')
    const next = Math.max(0, Math.round((numWeight + delta) * 10) / 10)
    onChangeWeight(String(next))
  }

  const handleSetExact = (weightVal: number) => {
    triggerHaptic?.('heavy')
    onChangeWeight(String(weightVal))
  }

  const handleAddPlatePerSide = (plateLbs: number) => {
    triggerHaptic?.('tap')
    // Adding to both sides: total += plateLbs * 2 (converted to current units)
    const delta = units === 'imperial'
      ? plateLbs * 2
      : Math.round(((plateLbs * 2) / 2.20462) * 10) / 10
    const next = Math.max(0, Math.round((numWeight + delta) * 10) / 10)
    onChangeWeight(String(next))
  }

  const unitLabel = units === 'imperial' ? 'lb' : 'kg'

  return (
    <div style={{ marginTop: 6 }} aria-label="Plate Loading and Weight Presets">
      {/* ── Micro-Loading Increments & BW Reset Strip ── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {config.microIncrements.map(inc => {
          const isPositive = inc > 0
          const displayLabel = isPositive ? `+${inc}` : `${inc}`
          return (
            <button
              key={inc}
              type="button"
              onClick={() => handleAdjust(inc)}
              className="tactile-btn"
              title={`Adjust weight by ${displayLabel} ${unitLabel}`}
              style={{
                background: isPositive ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.08)',
                border: isPositive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(239,68,68,0.25)',
                color: isPositive ? 'var(--gold-lt)' : '#FCA5A5',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              {displayLabel}{unitLabel}
            </button>
          )
        })}

        {/* Clear to Bodyweight 0 */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            onChangeWeight('0')
          }}
          className="tactile-btn"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--gray)',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 3,
            cursor: 'pointer',
          }}
          title="Reset load to bodyweight (0)"
        >
          BW (0)
        </button>

        {/* Toggle Rack Milestone Presets */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setShowMilestones(prev => !prev)
          }}
          className="tactile-btn"
          style={{
            background: showMilestones ? 'rgba(212,160,23,0.25)' : 'rgba(212,160,23,0.1)',
            border: '1px solid rgba(212,160,23,0.3)',
            color: 'var(--gold-lt)',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 3,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
          title="Toggle quick weight milestones"
        >
          <GaaIcon name="sliders" size={10} tone="gold" />
          <span>{showMilestones ? 'Hide Presets' : 'Presets'}</span>
        </button>
      </div>

      {/* ── Expandable Milestone Presets Strip ── */}
      {showMilestones && (
        <div
          style={{
            marginTop: 6,
            padding: '6px 8px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(212,160,23,0.25)',
            borderRadius: 4,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 9.5, color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase', marginRight: 2 }}>
            {config.isBarbell ? 'Barbell Racks:' : 'Dumbbell Rack:'}
          </span>
          {config.presets.map(p => {
            const isCurrent = Math.abs(numWeight - p.weight) < 0.1
            return (
              <button
                key={p.weight}
                type="button"
                onClick={() => handleSetExact(p.weight)}
                className="tactile-btn"
                style={{
                  background: isCurrent
                    ? 'rgba(212,160,23,0.3)'
                    : p.isMilestone
                      ? 'rgba(56,189,248,0.12)'
                      : 'rgba(255,255,255,0.05)',
                  border: isCurrent
                    ? '1.5px solid var(--gold)'
                    : p.isMilestone
                      ? '1px solid rgba(56,189,248,0.3)'
                      : '1px solid rgba(255,255,255,0.1)',
                  color: isCurrent ? 'var(--gold-lt)' : p.isMilestone ? '#7DD3FC' : '#E2E8F0',
                  fontSize: 10,
                  fontWeight: p.isMilestone || isCurrent ? 800 : 600,
                  padding: '2px 6px',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Interactive Barbell Sleeve & Plate Loading Strip ── */}
      {plateCalc && (
        <div
          style={{
            marginTop: 6,
            background: 'rgba(10, 16, 26, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5,
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {/* Top Line: Weight per side, badges, and 3D Rack link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 800 }}>
                Per side ({plateCalc.weightPerSide} lb):
              </span>

              {plateCalc.platesPerSide.length === 0 ? (
                <span style={{ fontSize: 10, color: 'var(--gray)', fontStyle: 'italic' }}>
                  Empty 45lb Bar
                </span>
              ) : (
                plateCalc.platesPerSide.map((p: PlateCount) =>
                  Array.from({ length: p.count }).map((_, cIdx) => (
                    <span
                      key={`${p.denomination.weightLbs}-${cIdx}`}
                      style={{
                        background: p.denomination.color,
                        color: p.denomination.textColor,
                        fontSize: 9.5,
                        fontWeight: 900,
                        padding: '1px 5px',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'inline-block',
                      }}
                    >
                      {p.denomination.weightLbs}
                    </span>
                  ))
                )
              )}
            </div>

            {onOpenPlateCalculator && (
              <button
                type="button"
                onClick={() => onOpenPlateCalculator(Math.round(weightLbs))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <span>3D Rack</span>
                <GaaIcon name="external-link" size={10} tone="gold" />
              </button>
            )}
          </div>

          {/* Bottom Line: Quick 1-Tap Plate Addition Shortcuts (+45, +25, +10, +5, +2.5 per side) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9.5, color: 'var(--gray)', fontWeight: 600 }}>
              +Plate/Side:
            </span>
            {[45, 25, 10, 5, 2.5].map(pl => (
              <button
                key={pl}
                type="button"
                onClick={() => handleAddPlatePerSide(pl)}
                className="tactile-btn"
                title={`Add ${pl} lb plate to each side (+${pl * 2} lbs total)`}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                +{pl}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
