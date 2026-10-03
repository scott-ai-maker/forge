'use client'

import React from 'react'
import { GaaIcon } from '@/components/ui/GaaIcon'

export interface CarouselSetLog {
  id: string
  session_date: string
  set_number?: number | null
  weight_kg?: number | null
  reps?: number | null
  rpe?: number | null
  rir?: number | null
  tempo?: string | null
  is_warmup?: boolean | null
  notes?: string | null
}

interface HorizontalSetsCarouselProps {
  logs: CarouselSetLog[]
  units: 'metric' | 'imperial'
  isTimed?: boolean
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
  onSelectSet?: (log: CarouselSetLog) => void
}

function formatChipWeight(weightKg: number | null | undefined, units: 'metric' | 'imperial'): string {
  if (weightKg === null || weightKg === undefined || weightKg <= 0) return 'BW'
  if (units === 'imperial') {
    const lbs = Math.round(weightKg * 2.20462 * 10) / 10
    return `${lbs} lb`
  }
  const kg = Math.round(weightKg * 10) / 10
  return `${kg} kg`
}

export const HorizontalSetsCarousel: React.FC<HorizontalSetsCarouselProps> = ({
  logs,
  units,
  isTimed = false,
  triggerHaptic,
  onSelectSet,
}) => {
  if (!logs || logs.length === 0) return null

  return (
    <div
      data-testid="horizontal-sets-carousel"
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 800,
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <GaaIcon name="check" size={10} tone="gold" />
          <span>Completed Sets ({logs.length})</span>
        </div>
        <span style={{ fontSize: 9.5, color: 'var(--gray)' }}>
          Swipe for history →
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {logs.map((row) => {
          const isWarmup = Boolean(row.is_warmup)
          const setLabel = isWarmup
            ? `W${row.set_number ?? ''}`
            : `S${row.set_number ?? ''}`
          const bandTag = row.notes?.match(/\[Band:\s*([^\]]+)\]/)?.[1]

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                onSelectSet?.(row)
              }}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 4,
                background: isWarmup
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(212, 160, 23, 0.12)',
                border: isWarmup
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(212, 160, 23, 0.35)',
                color: isWarmup ? 'var(--gray)' : 'var(--gold-lt)',
                fontSize: 11,
                cursor: onSelectSet ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                transition: 'background 0.1s ease',
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: isWarmup ? 'var(--gray)' : 'var(--gold)',
                }}
              >
                {setLabel}
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>
                {isTimed
                  ? `${row.reps ?? 0}s`
                  : `${formatChipWeight(row.weight_kg, units)} × ${row.reps ?? 0}`}
              </span>
              {row.rpe && (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ color: '#93C5FD', fontWeight: 700, fontSize: 10.5 }}>
                    @{row.rpe}
                  </span>
                </>
              )}
              {bandTag && (
                <span
                  style={{
                    background: 'rgba(212, 160, 23, 0.2)',
                    color: 'var(--gold)',
                    padding: '1px 4px',
                    borderRadius: 3,
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  {bandTag.split('(')[0].trim()}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
