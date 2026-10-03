'use client'

import { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  BarbellType,
  BARBELL_OPTIONS,
  PLATE_DENOMINATIONS,
  calculateBarbellPlates,
} from '@/lib/barbell-plate-calculator'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'

interface BarbellPlateCalculatorProps {
  initialWeightLbs?: number
  initialBarType?: BarbellType
  onClose?: () => void
  isModal?: boolean
}

export default function BarbellPlateCalculator({
  initialWeightLbs = 225,
  initialBarType = 'olympic_45',
  onClose,
  isModal = false,
}: BarbellPlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState<string>(String(initialWeightLbs))
  const [barType, setBarType] = useState<BarbellType>(initialBarType)
  const [availableDenoms, setAvailableDenoms] = useState<number[]>([45, 35, 25, 10, 5, 2.5])

  const numericTargetWeight = parseNumericInput(targetWeight, 0)
  const result = calculateBarbellPlates(numericTargetWeight, barType, availableDenoms)

  const quickPresets = [95, 135, 185, 225, 275, 315, 365, 405, 495]

  // Flattened plates list for visual sleeve representation
  const flattenedPlates: Array<{ weightLbs: number; color: string; textColor: string; heightPct: number; thicknessPx: number }> = []
  for (const group of result.platesPerSide) {
    for (let i = 0; i < group.count; i++) {
      flattenedPlates.push(group.denomination)
    }
  }

  const containerContent = (
    <div
      style={{
        background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
        border: '1px solid rgba(212,160,23,0.35)',
        borderRadius: 12,
        padding: 'clamp(18px, 4vw, 24px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: isModal ? '0 25px 60px rgba(0,0,0,0.85)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
            Tactical In-Gym Assistant
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em', fontWeight: 700 }}>
            BARBELL &amp; PLATE LOADING CALCULATOR
          </h3>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GaaIcon name="close" size={14} tone="slate" />
          </button>
        )}
      </div>

      {/* Target Weight & Barbell Selector Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 6 }}>
            Target Barbell Weight (LBS)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={targetWeight}
              onFocus={selectOnFocus}
              onChange={e => setTargetWeight(sanitizeNumericInput(e.target.value))}
              placeholder="225"
              aria-label="Target barbell weight in pounds"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontFamily: 'var(--font-telemetry, monospace)',
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: '0.04em',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setTargetWeight(w => String(Math.max(0, parseNumericInput(w, 0) - 5)))}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => setTargetWeight(w => String(parseNumericInput(w, 0) + 5))}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
            >
              +5
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 6 }}>
            Barbell Type
          </label>
          <select
            value={barType}
            onChange={e => setBarType(e.target.value as BarbellType)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--navy)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 13,
              outline: 'none',
            }}
          >
            {Object.values(BARBELL_OPTIONS).map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Weight Presets */}
      <div>
        <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>
          Quick Load Presets:
        </span>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginTop: 4 }}>
          {quickPresets.map(preset => {
            const isSelected = numericTargetWeight === preset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setTargetWeight(String(preset))}
                style={{
                  background: isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                  border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                  color: isSelected ? '#0A0E18' : 'var(--white)',
                  borderRadius: 4,
                  padding: '5px 10px',
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {preset} LBS
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Visual Barbell Sleeve Diagram ── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
          Barbell Sleeve Configuration (One Side Shown)
        </span>

        {/* Visual Bar & Plates Graphic */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 120,
            width: '100%',
            maxWidth: 440,
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Barbell Shaft */}
          <div
            style={{
              width: 50,
              height: 16,
              background: 'linear-gradient(180deg, #94A3B8 0%, #475569 50%, #334155 100%)',
              borderTopLeftRadius: 3,
              borderBottomLeftRadius: 3,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />

          {/* Barbell Collar (Thick stopper ring) */}
          <div
            style={{
              width: 14,
              height: 48,
              background: 'linear-gradient(180deg, #CBD5E1 0%, #64748B 50%, #334155 100%)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 0 8px rgba(0,0,0,0.5)',
            }}
          />

          {/* Barbell Sleeve (Center bar under plates) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(180deg, #94A3B8 0%, #64748B 50%, #475569 100%)',
              height: 22,
              minWidth: 160,
              padding: '0 4px',
              borderTopRightRadius: 4,
              borderBottomRightRadius: 4,
              border: '1px solid rgba(255,255,255,0.2)',
              position: 'relative',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4)',
            }}
          >
            {/* Plates stacked next to collar */}
            {flattenedPlates.length === 0 ? (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingLeft: 12, fontStyle: 'italic' }}>
                Empty Bar
              </span>
            ) : (
              flattenedPlates.map((p, idx) => (
                <div
                  key={idx}
                  title={`${p.weightLbs} lbs plate`}
                  style={{
                    width: p.thicknessPx,
                    height: `${p.heightPct}%`,
                    maxHeight: 110,
                    background: p.color,
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.5)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 2px 0 6px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 2,
                  }}
                >
                  <span
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      fontSize: 8.5,
                      fontWeight: 800,
                      color: p.textColor,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      userSelect: 'none',
                    }}
                  >
                    {p.weightLbs}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plate Breakdown Summary Box */}
        <div
          style={{
            background: 'rgba(212,160,23,0.08)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 6,
            padding: '10px 16px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, color: 'var(--gold-lt)', letterSpacing: '0.04em', fontWeight: 700 }}>
            {result.plateSummaryText}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 2 }}>
            Total Weight: <strong style={{ color: '#FFF' }}>{result.actualTotalWeightLbs} LBS</strong> ({result.barbell.weightLbs}lb bar + {result.weightPerSide}lb × 2 sides)
            {!result.isExact && (
              <span style={{ color: '#F87171', marginLeft: 6 }}>
                (Remaining: {result.remainderLbs} lbs)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plate Denomination Inventory Filter */}
      <div>
        <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>
          Available Gym Plates:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {Object.values(PLATE_DENOMINATIONS).map(denom => {
            const isEnabled = availableDenoms.includes(denom.weightLbs)
            return (
              <button
                key={denom.weightLbs}
                type="button"
                onClick={() => {
                  if (isEnabled) {
                    setAvailableDenoms(prev => prev.filter(w => w !== denom.weightLbs))
                  } else {
                    setAvailableDenoms(prev => [...prev, denom.weightLbs])
                  }
                }}
                style={{
                  background: isEnabled ? denom.color : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(0,0,0,0.4)',
                  color: isEnabled ? denom.textColor : 'var(--gray)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: isEnabled ? 1 : 0.4,
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{denom.weightLbs} lb</span>
                <GaaIcon name={isEnabled ? 'check' : 'close'} size={10} tone="inherit" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 540, width: '100%' }}>
          {containerContent}
        </div>
      </div>
    )
  }

  return containerContent
}
