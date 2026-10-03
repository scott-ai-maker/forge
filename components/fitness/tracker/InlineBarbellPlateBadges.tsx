'use client'

import React from 'react'
import { isOlympicWeightExercise, calculateBarbellPlates } from '@/lib/barbell-plate-calculator'

export interface InlineBarbellPlateBadgesProps {
  exerciseName: string
  draftWeight?: string
  units: 'imperial' | 'metric'
  isTimed?: boolean
  isBand?: boolean
  onOpenPlateCalculator?: (targetWeightLbs: number) => void
}

export default function InlineBarbellPlateBadges({
  exerciseName,
  draftWeight,
  units,
  isTimed,
  isBand,
  onOpenPlateCalculator,
}: InlineBarbellPlateBadgesProps) {
  if (isTimed || isBand) return null

  const weightNum = Number(draftWeight) || 0
  const weightLbs = units === 'imperial' ? weightNum : weightNum * 2.20462
  const isOlympic = isOlympicWeightExercise(exerciseName) || weightLbs >= 45

  if (!isOlympic || weightLbs < 45) return null

  const plateCalc = calculateBarbellPlates(weightLbs, 'olympic_45')

  return (
    <div
      style={{
        marginTop: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 6,
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: '4px 8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 700 }}>
          Per side ({plateCalc.weightPerSide} lb):
        </span>
        {plateCalc.platesPerSide.length === 0 ? (
          <span style={{ fontSize: 10, color: 'var(--gray)', fontStyle: 'italic' }}>Empty 45lb Bar</span>
        ) : (
          plateCalc.platesPerSide.map(p =>
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
          }}
        >
          3D Rack ↗
        </button>
      )}
    </div>
  )
}
