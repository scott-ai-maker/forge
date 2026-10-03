'use client'

import React, { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  RPE_SCALE_POINTS,
  getRpeScalePoint,
  normalizeRpeValue,
  mapRpeToRir,
  getFatigueSafetyNotice,
  type RpeScalePoint,
} from '@/lib/rpe-exertion-scale'

export interface RpeRirExertionSelectorProps {
  exerciseName: string
  currentRpe: string | number | undefined
  currentRir?: string | number | undefined
  isStrength?: boolean
  onChangeRpe: (rpe: string) => void
  onChangeRir?: (rir: string) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function RpeRirExertionSelector({
  exerciseName,
  currentRpe,
  currentRir,
  isStrength = true,
  onChangeRpe,
  onChangeRir,
  triggerHaptic,
}: RpeRirExertionSelectorProps) {
  const [showScienceDrawer, setShowScienceDrawer] = useState(false)

  const numRpe = normalizeRpeValue(currentRpe)
  const activePoint = getRpeScalePoint(numRpe)
  const safetyNotice = getFatigueSafetyNotice(
    exerciseName,
    numRpe,
    currentRir !== undefined && currentRir !== '' ? Number(currentRir) : undefined
  )

  const handleSelectPoint = (pt: RpeScalePoint) => {
    triggerHaptic?.('tap')
    onChangeRpe(String(pt.rpe))
    if (onChangeRir && isStrength) {
      onChangeRir(String(pt.rir))
    }
  }

  const handleStep = (delta: number) => {
    triggerHaptic?.('tap')
    const nextRpe = Math.min(10, Math.max(1, Math.round((numRpe + delta) * 10) / 10))
    onChangeRpe(String(nextRpe))
    if (onChangeRir && isStrength) {
      onChangeRir(String(mapRpeToRir(nextRpe)))
    }
  }

  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 8,
        background: 'rgba(13, 27, 42, 0.7)',
        border: `1px solid ${activePoint.borderColor}`,
        borderRadius: 6,
        padding: '10px 12px',
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
      aria-label="Interactive RPE and RIR Exertion Selector"
    >
      {/* ── Header: Title, Active Telemetry Badge & Guide Toggle ── */}
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
            <GaaIcon name="sliders" size={12} tone="gold" />
            <span>Exertion Scale (RPE / RIR)</span>
          </span>

          <span
            className="font-telemetry"
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
              background: activePoint.bgTint,
              color: activePoint.colorHex,
              border: `1px solid ${activePoint.borderColor}`,
            }}
          >
            RPE {numRpe.toFixed(1)} {isStrength ? `· ${mapRpeToRir(numRpe)} RIR` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Quick Fine-Tuning Steppers */}
          <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleStep(-0.5)}
              className="tactile-btn"
              disabled={numRpe <= 1.0}
              aria-label="Decrease RPE by 0.5"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--white)',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 3,
                cursor: numRpe <= 1.0 ? 'not-allowed' : 'pointer',
                opacity: numRpe <= 1.0 ? 0.4 : 1,
              }}
            >
              −0.5
            </button>
            <button
              type="button"
              onClick={() => handleStep(0.5)}
              className="tactile-btn"
              disabled={numRpe >= 10.0}
              aria-label="Increase RPE by 0.5"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--white)',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 3,
                cursor: numRpe >= 10.0 ? 'not-allowed' : 'pointer',
                opacity: numRpe >= 10.0 ? 0.4 : 1,
              }}
            >
              +0.5
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              setShowScienceDrawer(prev => !prev)
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
            <GaaIcon name="info" size={11} tone="gold" />
            <span>{showScienceDrawer ? 'Hide Details' : 'Science Cues'}</span>
          </button>
        </div>
      </div>

      {/* ── Quick Exertion Buttons Strip ── */}
      <div
        role="radiogroup"
        aria-label="RPE Exertion Level Selector"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(62px, 1fr))',
          gap: 4,
          marginBottom: 6,
        }}
      >
        {RPE_SCALE_POINTS.map(pt => {
          const isSelected = Math.abs(numRpe - pt.rpe) < 0.25
          return (
            <button
              key={pt.rpe}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelectPoint(pt)}
              title={`${pt.shortLabel}: ${pt.effortDescription}`}
              className="tactile-btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px 4px',
                borderRadius: 4,
                cursor: 'pointer',
                background: isSelected ? pt.bgTint : 'rgba(255, 255, 255, 0.04)',
                border: isSelected
                  ? `1.5px solid ${pt.colorHex}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isSelected ? `0 0 8px ${pt.borderColor}` : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                className="font-telemetry"
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isSelected ? pt.colorHex : '#E2E8F0',
                  lineHeight: 1.1,
                }}
              >
                {pt.rpe % 1 === 0 ? `${pt.rpe}.0` : pt.rpe}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  marginTop: 2,
                  color: isSelected ? '#FFFFFF' : 'var(--gray)',
                  whiteSpace: 'nowrap',
                }}
              >
                {isStrength ? `${pt.rir} RIR` : pt.shortLabel.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Active Exertion Description Banner ── */}
      <div
        style={{
          fontSize: 11,
          lineHeight: 1.4,
          color: '#E2E8F0',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 4,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            color: activePoint.colorHex,
            textTransform: 'uppercase',
            fontSize: 10,
            letterSpacing: '0.04em',
          }}
        >
          {activePoint.shortLabel}:
        </span>
        <span style={{ color: 'var(--gray-lt)' }}>{activePoint.effortDescription}</span>
      </div>

      {/* ── Expandable Sports Science & Respiratory Drawer ── */}
      {showScienceDrawer && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 10px',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: 11,
            color: 'var(--gray-lt)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gold)' }}>
            <GaaIcon name="sparkles" size={12} tone="gold" />
            <strong>Cardiorespiratory Coupling & Intra-Abdominal Pacing:</strong>
          </div>
          <div style={{ paddingLeft: 16 }}>{activePoint.respiratoryPattern}</div>

          <div style={{ fontSize: 10, color: 'var(--gray)', fontStyle: 'italic', marginTop: 2 }}>
            💡 Sports Science Tip: Reps-In-Reserve (RIR) directly models velocity loss. An RPE 8.0 represents ~15-20% velocity loss from the first repetition, providing the optimal volume stimulus without excessive CNS fatigue.
          </div>
        </div>
      )}

      {/* ── Biomechanical Fatigue Notice / Guardrail Alert ── */}
      {safetyNotice && (
        <div
          style={{
            marginTop: 8,
            padding: '7px 10px',
            borderRadius: 4,
            fontSize: 11,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            background:
              safetyNotice.level === 'critical'
                ? 'rgba(239, 68, 68, 0.15)'
                : safetyNotice.level === 'caution'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(56, 189, 248, 0.1)',
            border:
              safetyNotice.level === 'critical'
                ? '1px solid rgba(239, 68, 68, 0.5)'
                : safetyNotice.level === 'caution'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(56, 189, 248, 0.3)',
            color:
              safetyNotice.level === 'critical'
                ? '#FCA5A5'
                : safetyNotice.level === 'caution'
                  ? '#FDE68A'
                  : '#BAE6FD',
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <GaaIcon
              name={safetyNotice.level === 'critical' ? 'alert-triangle' : 'info'}
              size={13}
              tone={safetyNotice.level === 'critical' ? 'ruby' : 'gold'}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 2 }}>{safetyNotice.title}</div>
            <div style={{ lineHeight: 1.35 }}>{safetyNotice.message}</div>
          </div>
        </div>
      )}
    </div>
  )
}
