'use client'

import React, { useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { BAND_COLOR_SPECTRUM, BandResistanceLevel } from '@/lib/exercise-logging-helpers'

interface BandResistanceChartModalProps {
  isOpen: boolean
  onClose: () => void
  preferredUnits?: 'imperial' | 'metric'
  onSelectBand?: (band: BandResistanceLevel) => void
  selectedBandId?: string | null
}

export default function BandResistanceChartModal({
  isOpen,
  onClose,
  preferredUnits = 'imperial',
  onSelectBand,
  selectedBandId,
}: BandResistanceChartModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="band-matrix-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 3vw, 20px)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxSizing: 'border-box',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="band-chart-title"
      onClick={onClose}
    >
      <div
        className="band-matrix-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #162235 0%, #0D1B2A 100%)',
          border: '1px solid rgba(212, 160, 23, 0.4)',
          borderRadius: 12,
          maxWidth: 680,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,160,23,0.2)',
          color: '#FFFFFF',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <style>{`
          .band-matrix-scroll-body {
            overflow-y: auto;
            padding: 22px 24px;
            -webkit-overflow-scrolling: touch;
          }
          .band-matrix-desktop-table {
            display: block;
            overflow-x: auto;
            margin-bottom: 20px;
          }
          .band-matrix-mobile-cards {
            display: none;
          }
          .band-matrix-footer {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
          }
          .band-matrix-got-it-btn {
            width: auto;
          }
          @media (max-width: 640px) {
            .band-matrix-scroll-body {
              padding: 14px 12px;
            }
            .band-matrix-desktop-table {
              display: none !important;
            }
            .band-matrix-mobile-cards {
              display: flex !important;
              flex-direction: column;
              gap: 10px;
              margin-bottom: 16px;
            }
            .band-matrix-footer {
              justify-content: stretch;
            }
            .band-matrix-got-it-btn {
              width: 100% !important;
              text-align: center;
              padding: 12px 20px !important;
            }
          }
        `}</style>

        {/* Scrollable Modal Content */}
        <div className="band-matrix-scroll-body">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                id="band-chart-title"
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 'clamp(16px, 4vw, 20px)',
                  fontWeight: 700,
                  color: 'var(--gold-lt)',
                  margin: 0,
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  lineHeight: 1.25,
                }}
              >
                <GaaIcon name="activity" size={18} tone="gold" />
                <span>Resistance Band Matrix</span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--gray)', lineHeight: 1.4 }}>
                Standard Forge Athletic elastic resistance spectrum for progressive overload calibration
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tactile-btn"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--gray)',
                padding: '6px 12px',
                minHeight: 34,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
              }}
              aria-label="Close modal"
            >
              <GaaIcon name="close" size={12} tone="inherit" />
              <span>Close</span>
            </button>
          </div>

          {/* Desktop Matrix Table (>= 641px) */}
          <div className="band-matrix-desktop-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(212,160,23,0.3)', color: 'var(--gold)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 800 }}>Band</th>
                  <th style={{ padding: '8px 10px', fontWeight: 800 }}>Level</th>
                  <th style={{ padding: '8px 10px', fontWeight: 800 }}>
                    Est. Resistance ({preferredUnits === 'imperial' ? 'LBS' : 'KG'})
                  </th>
                  <th style={{ padding: '8px 10px', fontWeight: 800 }}>Recommended For</th>
                  {onSelectBand && (
                    <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'center' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {BAND_COLOR_SPECTRUM.map((band: BandResistanceLevel, idx) => {
                  const rangeStr = preferredUnits === 'imperial'
                    ? `${band.weightLbsMin}–${band.weightLbsMax} lbs (~${band.weightLbsAvg} lb)`
                    : `${Math.round(band.weightLbsMin / 2.20462)}–${Math.round(band.weightLbsMax / 2.20462)} kg (~${band.weightKgAvg} kg)`
                  const isSelected = selectedBandId === band.id

                  return (
                    <tr
                      key={band.id}
                      onClick={() => onSelectBand?.(band)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: isSelected
                          ? 'rgba(212,160,23,0.15)'
                          : idx % 2 === 0
                            ? 'rgba(255,255,255,0.02)'
                            : 'transparent',
                        cursor: onSelectBand ? 'pointer' : 'default',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '10px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: band.colorHex, marginRight: 8, boxShadow: `0 0 8px ${band.colorHex}66`, flexShrink: 0 }} />
                          <span style={{ color: band.colorHex }}>{band.colorName}</span>
                        </div>
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
                      {onSelectBand && (
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectBand(band)
                            }}
                            className="tactile-btn"
                            style={{
                              background: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(212,160,23,0.15)',
                              border: isSelected ? '1px solid #10B981' : '1px solid rgba(212,160,23,0.4)',
                              color: isSelected ? '#34D399' : 'var(--gold-lt)',
                              padding: '5px 12px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {isSelected ? (
                              <>
                                <GaaIcon name="check" size={11} tone="emerald" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select</span>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Deck (< 640px) */}
          <div className="band-matrix-mobile-cards">
            {BAND_COLOR_SPECTRUM.map((band: BandResistanceLevel) => {
              const isSelected = selectedBandId === band.id
              const rangeStr = preferredUnits === 'imperial'
                ? `${band.weightLbsMin}–${band.weightLbsMax} lbs`
                : `${Math.round(band.weightLbsMin / 2.20462)}–${Math.round(band.weightLbsMax / 2.20462)} kg`
              const avgStr = preferredUnits === 'imperial'
                ? `~${band.weightLbsAvg} lb avg`
                : `~${band.weightKgAvg} kg avg`

              return (
                <div
                  key={band.id}
                  onClick={() => onSelectBand?.(band)}
                  role={onSelectBand ? 'button' : undefined}
                  tabIndex={onSelectBand ? 0 : undefined}
                  style={{
                    background: isSelected ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '11px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    cursor: onSelectBand ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 14px rgba(212,160,23,0.25)' : 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Top: Band color indicator, name, level, resistance pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: band.colorHex,
                          boxShadow: `0 0 8px ${band.colorHex}88`,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 800, fontSize: 14, color: band.colorHex }}>
                        {band.colorName}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#CBD5E1',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {band.label.split('(')[1]?.replace(')', '') ?? ''}
                      </span>
                    </div>

                    {/* Resistance Value Badge */}
                    <div
                      style={{
                        background: 'rgba(212,160,23,0.12)',
                        border: '1px solid rgba(212,160,23,0.3)',
                        borderRadius: 6,
                        padding: '3px 8px',
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ display: 'block', color: 'var(--gold-lt)', fontWeight: 800, fontSize: 12, lineHeight: 1.2 }}>
                        {rangeStr}
                      </span>
                      <span style={{ display: 'block', color: 'var(--gray)', fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>
                        {avgStr}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Recommended exercises & Select button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.35, flex: 1, minWidth: 0 }}>
                      <span style={{ color: 'var(--gray)', fontWeight: 600 }}>Best for: </span>
                      <span>{band.recommendedFor}</span>
                    </div>

                    {onSelectBand && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectBand(band)
                        }}
                        className="tactile-btn"
                        style={{
                          background: isSelected ? 'rgba(16,185,129,0.25)' : 'rgba(212,160,23,0.18)',
                          border: isSelected ? '1px solid #10B981' : '1px solid rgba(212,160,23,0.45)',
                          color: isSelected ? '#34D399' : 'var(--gold-lt)',
                          padding: '6px 12px',
                          minHeight: 34,
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        {isSelected ? (
                          <>
                            <GaaIcon name="check" size={11} tone="emerald" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <span>Select</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* NASM Clinical Elastic Resistance Protocol Guide */}
          <div
            style={{
              background: 'rgba(212,160,23,0.06)',
              borderLeft: '3px solid var(--gold)',
              borderRadius: '0 6px 6px 0',
              padding: '10px 12px',
              fontSize: 11.5,
              lineHeight: 1.45,
              color: '#E2E8F0',
            }}
          >
            <div style={{ fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
              <GaaIcon name="sparkles" size={12} tone="gold" />
              <span>NASM OPT™ Variable Elastic Resistance Dynamics:</span>
            </div>
            <p style={{ margin: '0 0 5px' }}>
              • <strong>Ascending Tension Curve:</strong> Elastic bands deliver minimum tension at starting stretch and maximum tension at peak contraction.
            </p>
            <p style={{ margin: '0 0 5px' }}>
              • <strong>Logging Recommendation:</strong> Select the primary band color used. The representative weight is automatically recorded for strength progression analytics.
            </p>
            <p style={{ margin: 0 }}>
              • <strong>Combining Bands:</strong> When stacking multiple bands (e.g. Red + Green), sum their representative weights (~55 lbs) for your set log.
            </p>
          </div>

          {/* Footer */}
          <div className="band-matrix-footer">
            <button
              type="button"
              onClick={onClose}
              className="band-matrix-got-it-btn tactile-btn"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                border: 'none',
                color: '#0A0E18',
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '10px 24px',
                minHeight: 40,
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
