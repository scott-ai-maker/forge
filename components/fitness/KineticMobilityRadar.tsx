'use client'

import React from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { calculateKineticRadarScores, KineticRadarScores, NasmAssessmentRecord } from '@/lib/nasm-assessments'

interface KineticMobilityRadarProps {
  assessment?: Partial<NasmAssessmentRecord> | null
}

export default function KineticMobilityRadar({ assessment }: KineticMobilityRadarProps) {
  const radar: KineticRadarScores = calculateKineticRadarScores(assessment)

  const size = 320
  const center = size / 2
  const maxRadius = 110

  // 5 axes coordinates: Ankle (top), LPHC (top-right), Thoracic (bottom-right), Core (bottom-left), Cardio (top-left)
  const numAxes = 5
  const angleStep = (Math.PI * 2) / numAxes

  const getCoordinates = (valueNormalized: number, axisIndex: number) => {
    // start at top (-PI / 2)
    const angle = -Math.PI / 2 + axisIndex * angleStep
    const radius = (valueNormalized / 100) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const scores = [
    radar.ankleMobility,
    radar.lphcControl,
    radar.thoracicExtension,
    radar.coreStability,
    radar.cardioRecovery,
  ]

  const axesLabels = [
    { label: 'Ankle / Foot', score: radar.ankleMobility },
    { label: 'LPHC / Pelvis', score: radar.lphcControl },
    { label: 'Thoracic / Scapula', score: radar.thoracicExtension },
    { label: 'Core Stability', score: radar.coreStability },
    { label: 'Cardio Recovery', score: radar.cardioRecovery },
  ]

  const polygonPoints = scores
    .map((val, idx) => {
      const { x, y } = getCoordinates(val, idx)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const concentricLevels = [25, 50, 75, 100]

  return (
    <div className="glass-card" style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                padding: '4px 10px',
                background: 'rgba(197,160,89,0.15)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(197,160,89,0.4)',
              }}
            >
              5-Axis Biomechanical Telemetry
            </span>
            <span style={{ color: 'var(--gray)', fontSize: 13 }}>
              Kinetic Chain Movement Balance
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: 'var(--white)',
            }}
          >
            Kinetic Mobility Radar Scorecard
          </h3>
        </div>

        <div className="tabular-nums" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Overall Movement Index
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1 }}>
            {radar.overallMobilityIndex}%
          </div>
        </div>
      </div>

      {/* Radar Graphic & Breakdown Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 24, alignItems: 'center' }}>
        {/* SVG Radar Chart */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background concentric web polygons */}
            {concentricLevels.map((lvl, lIdx) => {
              const bgPoints = Array.from({ length: numAxes })
                .map((_, aIdx) => {
                  const { x, y } = getCoordinates(lvl, aIdx)
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                })
                .join(' ')
              return (
                <polygon
                  key={lIdx}
                  points={bgPoints}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray={lIdx < 3 ? '2 2' : 'none'}
                />
              )
            })}

            {/* Axis radius spokes */}
            {Array.from({ length: numAxes }).map((_, aIdx) => {
              const outer = getCoordinates(100, aIdx)
              return (
                <line
                  key={aIdx}
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
              )
            })}

            {/* Current Client Mobility Area */}
            <polygon
              points={polygonPoints}
              fill="rgba(197, 160, 89, 0.22)"
              stroke="var(--gold)"
              strokeWidth="2.5"
            />

            {/* Data Vertex Nodes and Labels */}
            {scores.map((val, idx) => {
              const pt = getCoordinates(val, idx)
              const labelPt = getCoordinates(122, idx)
              const axis = axesLabels[idx]
              return (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="var(--gold-lt)"
                    stroke="var(--navy)"
                    strokeWidth="2"
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.75)"
                    fontSize="9"
                    fontFamily="Raleway, sans-serif"
                    fontWeight="600"
                  >
                    {axis?.label ?? ''}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Diagnostic Axis Telemetry List */}
        <div style={{ display: 'grid', gap: 10 }}>
          {radar.diagnostics.map((diag, idx) => {
            const isOptimal = diag.status === 'Optimal'
            const isImpaired = diag.status === 'Impaired'
            return (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(8,14,20,0.6)',
                  border: `1px solid ${isImpaired ? 'rgba(248,113,113,0.3)' : isOptimal ? 'rgba(52,211,153,0.3)' : 'rgba(197,160,89,0.3)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13 }}>
                    {diag.axis}
                  </div>
                  <div style={{ fontSize: 11, color: isImpaired ? 'var(--error)' : 'var(--gray)', marginTop: 2 }}>
                    {diag.impairedMuscles.join(', ')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GaaIcon name="target" size={11} tone="gold" />
                    <span>{diag.recommendedDrill}</span>
                  </div>
                </div>

                <div className="tabular-nums" style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontSize: 18,
                      fontWeight: 700,
                      color: isImpaired ? 'var(--error)' : isOptimal ? 'var(--success)' : 'var(--gold-lt)',
                      lineHeight: 1,
                    }}
                  >
                    {diag.score}%
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: isImpaired ? 'var(--error)' : isOptimal ? 'var(--success)' : 'var(--gold-lt)',
                    }}
                  >
                    {diag.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
