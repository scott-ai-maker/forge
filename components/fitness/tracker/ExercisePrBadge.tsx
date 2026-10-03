'use client'

import React, { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { PersonalRecord } from '@/lib/personal-record-engine'

export interface ExercisePrBadgeProps {
  personalRecord?: PersonalRecord | null
  units: 'imperial' | 'metric'
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function ExercisePrBadge({
  personalRecord,
  units,
  triggerHaptic,
}: ExercisePrBadgeProps) {
  const [showTrendDrawer, setShowTrendDrawer] = useState(false)

  if (!personalRecord || personalRecord.allTimeBest1RmLbs <= 0) return null

  const display1Rm = units === 'imperial'
    ? `${personalRecord.allTimeBest1RmLbs} lb`
    : `${personalRecord.allTimeBest1RmKg} kg`
  const displayBestWeight = units === 'imperial'
    ? `${personalRecord.bestSetWeightLbs} lb`
    : `${personalRecord.bestSetWeightKg} kg`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          triggerHaptic?.('tap')
          setShowTrendDrawer(prev => !prev)
        }}
        className="tactile-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(212,160,23,0.28) 100%)',
          border: '1px solid rgba(245,158,11,0.5)',
          color: '#FDE68A',
          fontSize: 10.5,
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: 4,
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(245,158,11,0.2)',
        }}
        title="View 1RM historical trend progression"
      >
        <GaaIcon name="trophy" size={11} tone="gold" />
        <span>PR: {displayBestWeight} × {personalRecord.bestSetReps}</span>
        <span style={{ color: 'var(--gold-lt)', opacity: 0.85 }}>(1RM: {display1Rm})</span>
        <GaaIcon name={showTrendDrawer ? 'chevron-up' : 'chevron-down'} size={9} tone="inherit" />
      </button>

      {showTrendDrawer && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 6,
            background: 'rgba(10,15,24,0.95)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 11,
            color: '#CBD5E1',
            maxWidth: 320,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--gold)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <GaaIcon name="target" size={12} tone="gold" />
              <span>1RM Progression History</span>
            </span>
            <span style={{ color: '#94A3B8' }}>{personalRecord.totalSetsLogged} sets logged</span>
          </div>

          <div style={{ display: 'grid', gap: 4, maxHeight: 120, overflowY: 'auto', paddingRight: 4 }}>
            {personalRecord.progressionCurve.slice(-5).reverse().map((entry, idx) => {
              const entry1Rm = units === 'imperial' ? `${entry.estimated1RmLbs} lb` : `${entry.estimated1RmKg} kg`
              const entryWeight = units === 'imperial' ? `${entry.weightLbs} lb` : `${Math.round(entry.weightLbs / 2.20462 * 10) / 10} kg`
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 4px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ color: '#94A3B8', fontSize: 10 }}>{entry.date}</span>
                  <span style={{ fontWeight: 600 }}>{entryWeight} × {entry.reps}</span>
                  <span style={{ color: 'var(--gold-lt)', fontWeight: 800 }}>{entry1Rm}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
