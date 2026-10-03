'use client'

import React from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { BAND_COLOR_SPECTRUM, BandResistanceLevel } from '@/lib/exercise-logging-helpers'

interface BandResistanceChartModalProps {
  isOpen: boolean
  onClose: () => void
  preferredUnits?: 'imperial' | 'metric'
}

export default function BandResistanceChartModal({
  isOpen,
  onClose,
  preferredUnits = 'imperial',
}: BandResistanceChartModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(8px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="band-chart-title"
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #162235 0%, #0D1B2A 100%)',
          border: '1px solid rgba(212, 160, 23, 0.4)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,160,23,0.2)',
          color: '#FFFFFF',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3
              id="band-chart-title"
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--gold-lt)',
                margin: 0,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GaaIcon name="activity" size={18} tone="gold" />
              <span>Resistance Band Matrix &amp; Weight Equivalent</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--gray)' }}>
              Standard GAA elastic resistance spectrum for accurate progressive overload logging
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--gray)',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="close" size={12} tone="inherit" />
            <span>Close</span>
          </button>
        </div>

        {/* Matrix Table */}
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(212,160,23,0.3)', color: 'var(--gold)' }}>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>Band</th>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>Level</th>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>
                  Est. Resistance ({preferredUnits === 'imperial' ? 'LBS' : 'KG'})
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>Recommended For</th>
              </tr>
            </thead>
            <tbody>
              {BAND_COLOR_SPECTRUM.map((band: BandResistanceLevel, idx) => {
                const rangeStr = preferredUnits === 'imperial'
                  ? `${band.weightLbsMin}–${band.weightLbsMax} lbs (~${band.weightLbsAvg} lb)`
                  : `${Math.round(band.weightLbsMin / 2.20462)}–${Math.round(band.weightLbsMax / 2.20462)} kg (~${band.weightKgAvg} kg)`

                return (
                  <tr
                    key={band.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 10px', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: band.colorHex, marginRight: 8 }} />
                      <span style={{ color: band.colorHex }}>{band.colorName}</span>
                    </td>
                    <td style={{ padding: '10px 10px', color: '#E2E8F0', fontSize: 12 }}>
                      {band.label.split('(')[1]?.replace(')', '') ?? ''}
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--gold-lt)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {rangeStr}
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--gray)', fontSize: 11.5 }}>
                      {band.recommendedFor}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* NASM Clinical Elastic Resistance Protocol Guide */}
        <div
          style={{
            background: 'rgba(212,160,23,0.06)',
            borderLeft: '3px solid var(--gold)',
            borderRadius: '0 6px 6px 0',
            padding: '12px 14px',
            fontSize: 12,
            lineHeight: 1.5,
            color: '#E2E8F0',
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="sparkles" size={13} tone="gold" />
            <span>NASM OPT™ Variable Elastic Resistance Dynamics:</span>
          </div>
          <p style={{ margin: '0 0 6px' }}>
            • <strong>Ascending Tension Curve:</strong> Elastic bands deliver minimum tension at starting stretch and maximum tension at peak contraction.
          </p>
          <p style={{ margin: '0 0 6px' }}>
            • <strong>Logging Recommendation:</strong> Select the primary band color used. The representative weight is automatically recorded for strength progression analytics.
          </p>
          <p style={{ margin: 0 }}>
            • <strong>Combining Bands:</strong> When stacking multiple bands (e.g. Red + Green), sum their representative weights (~55 lbs) for your set log.
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: 'none',
              color: '#0A0E18',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '8px 20px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}

