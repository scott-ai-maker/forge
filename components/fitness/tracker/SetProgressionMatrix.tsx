'use client'

import React from 'react'
import { GaaIcon } from '@/components/ui/GaaIcon'

export interface LoggedSetData {
  id?: string
  set_number?: string | number
  weight_kg?: number | null
  reps?: string | number | null
  rpe?: string | number | null
  rir?: string | number | null
  session_date?: string
  is_warmup?: boolean
}

export interface SetProgressionMatrixProps {
  targetSets: string | number
  sessionDate: string
  currentSetNumber: number
  loggedSets: LoggedSetData[]
  units: 'imperial' | 'metric'
  onSelectSet: (setNumber: number, prefillWeight?: string, prefillReps?: string) => void
  onAddSet: (nextSetNumber: number) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function SetProgressionMatrix({
  targetSets,
  sessionDate,
  currentSetNumber,
  loggedSets,
  units,
  onSelectSet,
  onAddSet,
  triggerHaptic,
}: SetProgressionMatrixProps) {
  const targetSetCount = typeof targetSets === 'number' ? targetSets : (parseInt(String(targetSets), 10) || 3)
  const sessionLoggedSets = loggedSets.filter(l => !l.session_date || l.session_date === sessionDate)
  const maxDisplaySets = Math.max(targetSetCount, sessionLoggedSets.length + 1)

  return (
    <div
      style={{
        marginBottom: 12,
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 6,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--gold)',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <GaaIcon name="bar-chart" size={13} tone="gold" /> Set Progression Matrix ({sessionLoggedSets.length}/{targetSetCount} sets completed)
        </span>
        <span
          style={{
            fontSize: 10.5,
            color: sessionLoggedSets.length >= targetSetCount ? '#34D399' : 'var(--gray)',
            fontWeight: 700,
          }}
        >
          {sessionLoggedSets.length >= targetSetCount
            ? '✓ Target Met'
            : `${Math.max(0, targetSetCount - sessionLoggedSets.length)} sets remaining`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {Array.from({ length: maxDisplaySets }).map((_, idx) => {
          const setIndex = idx + 1
          const loggedSet =
            sessionLoggedSets.find(s => Number(s.set_number) === setIndex) || sessionLoggedSets[idx]
          const isCurrent = currentSetNumber === setIndex
          const isDone = Boolean(loggedSet)

          const loggedWeight = loggedSet
            ? units === 'imperial'
              ? loggedSet.weight_kg
                ? Math.round(loggedSet.weight_kg * 2.20462)
                : 0
              : loggedSet.weight_kg || 0
            : null

          return (
            <button
              key={setIndex}
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                onSelectSet(
                  setIndex,
                  loggedSet ? String(loggedWeight) : undefined,
                  loggedSet ? String(loggedSet.reps) : undefined
                )
              }}
              className="tactile-btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                borderRadius: 5,
                minWidth: 64,
                cursor: 'pointer',
                background: isDone
                  ? 'rgba(16,185,129,0.15)'
                  : isCurrent
                    ? 'rgba(212,160,23,0.22)'
                    : 'rgba(255,255,255,0.04)',
                border: isDone
                  ? '1.5px solid #10B981'
                  : isCurrent
                    ? '1.5px solid var(--gold)'
                    : '1px solid rgba(255,255,255,0.12)',
                color: isDone ? '#6EE7B7' : isCurrent ? 'var(--gold-lt)' : 'var(--gray)',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                {isDone ? (loggedSet.is_warmup ? '✓ (W)' : '✓ ') : ''}Set {setIndex}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  marginTop: 2,
                  color: isDone ? '#FFFFFF' : isCurrent ? 'var(--gold-lt)' : 'var(--gray)',
                }}
              >
                {isDone
                  ? `${loggedWeight}${units === 'imperial' ? 'lb' : 'kg'} × ${loggedSet.reps}`
                  : isCurrent
                    ? 'Active ➔'
                    : 'Pending'}
              </span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            onAddSet(maxDisplaySets + 1)
          }}
          className="tactile-btn"
          style={{
            padding: '6px 10px',
            borderRadius: 5,
            background: 'rgba(255,255,255,0.06)',
            border: '1px dashed rgba(255,255,255,0.25)',
            color: 'var(--white)',
            fontSize: 10.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add Set
        </button>
      </div>
    </div>
  )
}
