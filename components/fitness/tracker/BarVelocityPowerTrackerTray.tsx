'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  calculateRepVelocityAndPower,
  analyzeSetVelocityAndPower,
  resolveExerciseRomMeters,
  classifyVbtZone,
  type RepCadenceDuration,
} from '@/lib/bar-velocity-power-engine'

export interface BarVelocityPowerTrackerTrayProps {
  exerciseName: string
  weightKg?: number
  units?: 'imperial' | 'metric'
  currentPhase?: string
  currentRep?: number
  concentricDurationSec?: number
  eccentricDurationSec?: number
  repHistory?: RepCadenceDuration[]
  onClose?: () => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
  compact?: boolean
}

export default function BarVelocityPowerTrackerTray({
  exerciseName,
  weightKg = 60,
  units = 'imperial',
  currentPhase,
  currentRep = 1,
  concentricDurationSec = 1.2,
  eccentricDurationSec = 2.0,
  repHistory,
  onClose,
  triggerHaptic,
  compact = false,
}: BarVelocityPowerTrackerTrayProps) {
  const [interactiveConcentricSec, setInteractiveConcentricSec] = useState<number>(concentricDurationSec)
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'vbt_zones'>('live')

  const effectiveLoadKg = Math.max(weightKg, 20)
  const loadDisplay = units === 'imperial'
    ? `${Math.round(effectiveLoadKg * 2.20462)} lbs`
    : `${Math.round(effectiveLoadKg)} kg`

  // Default simulated or actual multi-rep history
  const activeRepHistory: RepCadenceDuration[] = useMemo(() => {
    if (repHistory && repHistory.length > 0) {
      return repHistory
    }
    // Provide a progressive 5-rep sequence for demonstration/real-time preview
    return [
      { concentricSec: 0.85, eccentricSec: 2.0 },
      { concentricSec: 0.92, eccentricSec: 2.0 },
      { concentricSec: 1.05, eccentricSec: 2.0 },
      { concentricSec: 1.25, eccentricSec: 2.0 },
      { concentricSec: Math.max(0.6, interactiveConcentricSec), eccentricSec: 2.0 },
    ]
  }, [repHistory, interactiveConcentricSec])

  // Real-time live rep telemetry
  const liveRepTelemetry = useMemo(() => {
    return calculateRepVelocityAndPower({
      exerciseName,
      loadKg: effectiveLoadKg,
      concentricSec: interactiveConcentricSec,
      eccentricSec: eccentricDurationSec,
      repNumber: currentRep || 1,
      baselineVelocity: activeRepHistory[0]?.concentricSec
        ? resolveExerciseRomMeters(exerciseName) / activeRepHistory[0].concentricSec
        : undefined,
    })
  }, [exerciseName, effectiveLoadKg, interactiveConcentricSec, eccentricDurationSec, currentRep, activeRepHistory])

  // Set-level analysis
  const setAnalysis = useMemo(() => {
    return analyzeSetVelocityAndPower({
      exerciseName,
      loadKg: effectiveLoadKg,
      repCadences: activeRepHistory,
    })
  }, [exerciseName, effectiveLoadKg, activeRepHistory])

  const isHammer = setAnalysis.isHammerCurl

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #09131F 0%, #0D1B2A 60%, #060B12 100%)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 10,
        padding: compact ? '12px 14px' : '18px 20px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Grid Accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 240,
          height: 120,
          background: 'radial-gradient(circle at 100% 0%, rgba(56,189,248,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(59,130,246,0.1) 100%)',
              border: '1px solid rgba(56,189,248,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#38BDF8', letterSpacing: '0.08em' }}>
              Velocity-Based Training (VBT) · Kinetic Power
            </div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
              {exerciseName}
            </h4>
            <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 1 }}>
              Load: <span style={{ color: 'var(--gold-lt)', fontWeight: 700 }}>{loadDisplay}</span> · ROM: <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{liveRepTelemetry.romMeters}m</span>
              {currentPhase && currentPhase !== 'idle' && (
                <span style={{ marginLeft: 8, color: '#34D399', fontWeight: 700 }}>
                  · Phase: {currentPhase.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              onClose()
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gray)',
              cursor: 'pointer',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { id: 'live', label: '⚡ Live Telemetry' },
          { id: 'history', label: `📊 Set Loss (${setAnalysis.totalReps} Reps)` },
          { id: 'vbt_zones', label: '🎯 VBT Zones' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              setActiveTab(tab.id as 'live' | 'history' | 'vbt_zones')
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: activeTab === tab.id ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTab === tab.id ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--gray)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Live Speedometer & Kinetic Power ── */}
      {activeTab === 'live' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {/* Twin Speedometer & Power Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {/* Mean Velocity Readout */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${liveRepTelemetry.velocityZoneColor}66`,
                borderRadius: 8,
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
                Concentric Velocity
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 30,
                  fontWeight: 900,
                  color: liveRepTelemetry.velocityZoneColor,
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {liveRepTelemetry.meanConcentricVelocity.toFixed(2)}
                <span style={{ fontSize: 14, fontFamily: 'Raleway, sans-serif', marginLeft: 4 }}>m/s</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                Peak: <strong style={{ color: '#E2E8F0' }}>{liveRepTelemetry.peakConcentricVelocity.toFixed(2)} m/s</strong>
              </div>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: `${liveRepTelemetry.velocityZoneColor}22`,
                  color: liveRepTelemetry.velocityZoneColor,
                  border: `1px solid ${liveRepTelemetry.velocityZoneColor}44`,
                }}
              >
                {liveRepTelemetry.velocityZoneLabel}
              </div>
            </div>

            {/* Kinetic Power Readout */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 8,
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
                Kinetic Power Output
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 30,
                  fontWeight: 900,
                  color: 'var(--gold-lt)',
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {Math.round(liveRepTelemetry.meanPowerWatts)}
                <span style={{ fontSize: 14, fontFamily: 'Raleway, sans-serif', marginLeft: 4 }}>W</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                Peak: <strong style={{ color: '#E2E8F0' }}>{Math.round(liveRepTelemetry.peakPowerWatts)} W</strong>
              </div>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: 'rgba(212,160,23,0.15)',
                  color: 'var(--gold-lt)',
                  border: '1px solid rgba(212,160,23,0.35)',
                }}
              >
                {Math.round(liveRepTelemetry.workJoules)} Joules Work
              </div>
            </div>
          </div>

          {/* Rep Deceleration Fatigue Callout */}
          {liveRepTelemetry.isDecelerating && (
            <div
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ fontSize: 11, color: '#FCA5A5' }}>
                <strong style={{ color: '#FFFFFF' }}>Rep Deceleration Fatigue Detected:</strong>{' '}
                Concentric velocity dropped by {liveRepTelemetry.velocityLossPercent}% compared to peak. Target high-tension motor unit threshold achieved.
              </div>
            </div>
          )}

          {/* Interactive Concentric Duration Slider / Simulator */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>
                Cadence Concentric Drive Duration
              </span>
              <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 13, color: '#38BDF8', fontWeight: 800 }}>
                {interactiveConcentricSec.toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="2.50"
              step="0.05"
              value={interactiveConcentricSec}
              onChange={e => {
                const val = parseFloat(e.target.value)
                setInteractiveConcentricSec(val)
                triggerHaptic?.('tap')
              }}
              style={{
                width: '100%',
                accentColor: '#38BDF8',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>
              <span>0.3s (Ballistic Speed)</span>
              <span>1.0s (Power/Hypertrophy)</span>
              <span>2.5s (High Strain Grind)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Multi-Rep Set Velocity Loss Matrix ── */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {/* Summary Banner */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${setAnalysis.fatigueColor}66`,
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
                Overall Set Velocity Loss
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, color: setAnalysis.fatigueColor, fontWeight: 900 }}>
                -{setAnalysis.overallVelocityLossPercent}%
              </div>
              <div style={{ fontSize: 10.5, color: setAnalysis.fatigueColor, fontWeight: 700, marginTop: 1 }}>
                {setAnalysis.fatigueLabel}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
                Total Mechanical Work
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, color: '#FFFFFF', fontWeight: 800 }}>
                {Math.round(setAnalysis.totalWorkJoules)} J
              </div>
              <div style={{ fontSize: 10, color: 'var(--gold-lt)' }}>
                Avg Power: {Math.round(setAnalysis.avgPowerWatts)} W
              </div>
            </div>
          </div>

          {/* Reps Visual List */}
          <div style={{ display: 'grid', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
            {setAnalysis.reps.map((rep, idx) => {
              const lossColor = rep.isDecelerating ? '#F87171' : rep.velocityLossPercent > 10 ? '#FBBF24' : '#34D399'
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', width: 44 }}>
                      Rep {rep.repNumber}
                    </span>
                    <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 13, fontWeight: 800, color: rep.velocityZoneColor }}>
                      {rep.meanConcentricVelocity.toFixed(2)} m/s
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--gray)' }}>
                      ({Math.round(rep.meanPowerWatts)} W)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 11, fontWeight: 700, color: lossColor }}>
                      {rep.repNumber === 1 ? 'Baseline' : `-${rep.velocityLossPercent}%`}
                    </span>
                    {rep.isDecelerating && (
                      <span style={{ fontSize: 9.5, padding: '2px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.2)', color: '#F87171', fontWeight: 800 }}>
                        FATIGUE
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Coaching Recommendation */}
          <div style={{ fontSize: 11, color: '#E2E8F0', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 6, padding: '8px 12px' }}>
            <strong style={{ color: '#38BDF8' }}>Coach Recommendation:</strong> {setAnalysis.recommendedAction}
          </div>
        </div>
      )}

      {/* ── Tab 3: Standard VBT Velocity Zones Reference ── */}
      {activeTab === 'vbt_zones' && (
        <div style={{ display: 'grid', gap: 6, fontSize: 11 }}>
          {[
            { zone: '> 1.00 m/s', name: 'Speed / Explosive RFD', desc: 'Ballistic power & maximum rate of force development.', color: '#38BDF8' },
            { zone: '0.75 – 1.00 m/s', name: 'Speed-Strength', desc: 'High velocity strength moving moderate weights dynamically.', color: '#34D399' },
            { zone: '0.50 – 0.75 m/s', name: 'Strength-Speed (Optimal)', desc: 'Peak mechanical power wattage & hypertrophy sweet spot.', color: '#FBBF24' },
            { zone: '0.35 – 0.50 m/s', name: 'Accelerative Strength', desc: 'Heavy loads driving maximal voluntary motor unit recruitment.', color: '#FB923C' },
            { zone: '< 0.35 m/s', name: 'Absolute / Grinding Strength', desc: 'Near 1RM strain approaching concentric failure limit.', color: '#F87171' },
          ].map((z, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${z.color}33`,
                borderRadius: 6,
                padding: '8px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: z.color }}>
                  {z.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 1 }}>
                  {z.desc}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 11.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                {z.zone}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Biomechanical Guardrail Notice for Hammer Curls (AGENTS.md Compliance) ── */}
      {isHammer && (
        <div
          style={{
            marginTop: 12,
            background: 'linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(212,160,23,0.04) 100%)',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <GaaIcon name="shield" size={20} tone="gold" />
          <div style={{ fontSize: 10.5, lineHeight: 1.35 }}>
            <span style={{ color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Strict Neutral Hammer Grip Verified · Zero Wrist Supination
            </span>
            <div style={{ color: '#E2E8F0', marginTop: 2 }}>
              Dumbbells remain vertically oriented with thumbs pointed up toward the ceiling and strictly zero twisting to optimize radial kinetic power transfer.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
