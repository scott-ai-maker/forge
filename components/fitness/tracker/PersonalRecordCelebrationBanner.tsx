'use client'

import React, { useEffect, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { PrDetectionResult } from '@/lib/personal-record-engine'
import { generatePersonalRecordSeal } from '@/lib/cryptographic-seal'

export interface PersonalRecordCelebrationBannerProps {
  prData: PrDetectionResult | null
  units: 'imperial' | 'metric'
  onDismiss: () => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export function formatWeightVal(val: number): string {
  if (!Number.isFinite(val)) return '0'
  const rounded = Math.round(val * 10) / 10
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
}

export default function PersonalRecordCelebrationBanner({
  prData,
  units,
  onDismiss,
  triggerHaptic,
}: PersonalRecordCelebrationBannerProps) {
  useEffect(() => {
    if (prData && prData.isNewPr) {
      triggerHaptic?.('success')
      const timer = setTimeout(() => {
        onDismiss()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [prData, triggerHaptic, onDismiss])

  const sealHash = useMemo(() => {
    if (!prData) return ''
    return generatePersonalRecordSeal({
      exerciseName: prData.exerciseName,
      weightLbsOrKg: Math.round(prData.loggedWeightLbs * 10) / 10,
      reps: prData.loggedReps,
    })
  }, [prData])

  if (!prData || !prData.isNewPr) return null

  const formattedWeight = formatWeightVal(
    units === 'imperial' ? prData.loggedWeightLbs : prData.loggedWeightLbs / 2.20462
  )
  const displayWeight = `${formattedWeight} ${units === 'imperial' ? 'LB' : 'KG'}`

  const formatted1Rm = formatWeightVal(
    units === 'imperial' ? prData.new1RmLbs : prData.new1RmKg
  )
  const display1Rm = `${formatted1Rm} ${units === 'imperial' ? 'LB' : 'KG'}`

  const formattedDelta = formatWeightVal(
    units === 'imperial' ? prData.deltaLbs : prData.deltaLbs / 2.20462
  )
  const displayDelta = `+${formattedDelta} ${units === 'imperial' ? 'LB' : 'KG'}`

  return (
    <aside
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100000,
        maxWidth: 'calc(100vw - 24px)',
        width: 520,
        background: 'linear-gradient(180deg, #0A0F1E 0%, #04070E 100%)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1.5px solid rgba(212, 175, 55, 0.65)',
        borderRadius: 8,
        padding: '14px 18px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.92), 0 0 28px rgba(212,175,55,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        {/* Sovereign Institutional Seal Badge */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1.5px solid #D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
          }}
        >
          <GaaIcon name="award" size={22} tone="gold" />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#D4AF37',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Institutional Maximum Surpassed
            </div>

            {/* Cryptographic Seal */}
            <div
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 10,
                fontWeight: 700,
                color: '#F8FAFC',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: 3,
                padding: '1px 6px',
                letterSpacing: '0.04em',
              }}
            >
              {sealHash}
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 15,
              fontWeight: 700,
              color: '#F8FAFC',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '0.03em',
              marginTop: 2,
            }}
          >
            {prData.exerciseName}
          </div>

          {/* High-Density Monospace Telemetry */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 5,
              flexWrap: 'wrap',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              LOAD: <strong style={{ color: '#F8FAFC' }}>{displayWeight} × {prData.loggedReps} REPS</strong>
            </span>
            <span style={{ color: 'rgba(148, 163, 184, 0.4)' }}>|</span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#D4AF37',
                padding: '1px 6px',
                borderRadius: 3,
              }}
            >
              EST. 1RM: {display1Rm} {!prData.isFirstRecord && `(${displayDelta})`}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          triggerHaptic?.('tap')
          onDismiss()
        }}
        className="tactile-btn"
        style={{
          background: 'rgba(148, 163, 184, 0.12)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          color: '#94A3B8',
          borderRadius: 4,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label="Acknowledge and dismiss record verification"
      >
        <GaaIcon name="close" size={13} tone="white" />
      </button>
    </aside>
  )
}
