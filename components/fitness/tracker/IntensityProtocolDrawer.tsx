'use client'

import React, { useState, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  calculateDropStages,
  calculateMyoRepsProtocol,
  formatIntensityProtocolNotes,
  roundToNearestIncrement,
  type DropStage,
  type IntensityProtocolData,
  type IntensityProtocolType,
} from '@/lib/intensity-protocols-engine'
import { playPrecisionTone } from '@/lib/web-audio-cadence-engine'
import { isIntensityProtocolOfferedForPhase } from '@/lib/nasm-opt-feature-matrix'

export interface IntensityProtocolDrawerProps {
  exerciseName: string
  currentWeight: string
  currentReps: string
  units: 'imperial' | 'metric'
  isTimed?: boolean
  nasmOptPhase?: number
  onLogIntensitySet: (protocolData: IntensityProtocolData) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function IntensityProtocolDrawer({
  exerciseName,
  currentWeight,
  currentReps,
  units,
  isTimed,
  nasmOptPhase,
  onLogIntensitySet,
  triggerHaptic,
}: IntensityProtocolDrawerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [protocolType, setProtocolType] = useState<IntensityProtocolType>('drop_set')

  const baseWeightNum = Number(currentWeight) || (units === 'imperial' ? 135 : 60)
  const baseRepsNum = parseInt(String(currentReps).replace(/\D/g, ''), 10) || 8

  // ── Drop Set State ──
  const [dropStages, setDropStages] = useState<DropStage[]>([])

  // Initialize/refresh drop stages when weight or reps change
  useEffect(() => {
    const weightLbs = units === 'imperial' ? baseWeightNum : baseWeightNum * 2.20462
    const generated = calculateDropStages(Math.round(weightLbs), baseRepsNum, 2, 20, units === 'imperial' ? 5 : 2.5)
    setDropStages(generated)
  }, [baseWeightNum, baseRepsNum, units])

  // ── Rest-Pause / Myo-Reps State ──
  const [miniSets, setMiniSets] = useState<number[]>([3, 3, 2])
  const [intraRestRemaining, setIntraRestRemaining] = useState<number | null>(null)

  // Intra-set timer countdown
  useEffect(() => {
    if (intraRestRemaining === null || intraRestRemaining <= 0) return
    const timer = setTimeout(() => {
      setIntraRestRemaining(prev => {
        if (prev === null || prev <= 1) {
          playPrecisionTone({ freq: 880, duration: 0.2, type: 'triangle' })
          triggerHaptic?.('success')
          return null
        }
        playPrecisionTone({ freq: 440, duration: 0.08, type: 'sine' })
        return prev - 1
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [intraRestRemaining, triggerHaptic])

  if (isTimed) return null
  if (nasmOptPhase !== undefined && !isIntensityProtocolOfferedForPhase(nasmOptPhase)) {
    return null
  }

  const isHammerCurl = /\b(hammer curl)\b/i.test(exerciseName)
  const unitLabel = units === 'imperial' ? 'lb' : 'kg'
  const unitFactor = units === 'imperial' ? 1 : 0.45359237

  // Update specific drop stage
  const handleUpdateStage = (idx: number, deltaWeight: number, deltaReps: number) => {
    triggerHaptic?.('tap')
    setDropStages(prev =>
      prev.map((s, i) => {
        if (i !== idx) return s
        const nextW = Math.max(5, s.weightLbs + deltaWeight)
        const nextR = Math.max(1, s.reps + deltaReps)
        const percentDrop = i === 0 ? 0 : Math.round(((prev[0].weightLbs - nextW) / prev[0].weightLbs) * 100)
        return {
          ...s,
          weightLbs: nextW,
          reps: nextR,
          percentDropFromInitial: percentDrop,
          volumeLbs: Math.round(nextW * nextR),
        }
      })
    )
  }

  // Add extra drop stage
  const handleAddDropStage = () => {
    triggerHaptic?.('tap')
    if (dropStages.length >= 4) return
    const lastStage = dropStages[dropStages.length - 1]
    const nextWeight = roundToNearestIncrement(lastStage.weightLbs * 0.8, 5)
    const nextReps = Math.max(4, Math.round(lastStage.reps * 0.85))
    const percentDrop = Math.round(((dropStages[0].weightLbs - nextWeight) / dropStages[0].weightLbs) * 100)

    setDropStages(prev => [
      ...prev,
      {
        stageNumber: prev.length + 1,
        weightLbs: nextWeight,
        reps: nextReps,
        percentDropFromInitial: percentDrop,
        volumeLbs: Math.round(nextWeight * nextReps),
      },
    ])
  }

  // Remove drop stage
  const handleRemoveDropStage = (idx: number) => {
    triggerHaptic?.('tap')
    if (dropStages.length <= 2) return
    setDropStages(prev =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, stageNumber: i + 1 }))
    )
  }

  // Compute total mechanical volume for drop set
  const totalDropVolumeLbs = dropStages.reduce((sum, s) => sum + s.volumeLbs, 0)
  const totalDropReps = dropStages.reduce((sum, s) => sum + s.reps, 0)

  // Submit Drop Set
  const handleLogDropSet = () => {
    triggerHaptic?.('success')
    const protocolData: IntensityProtocolData = {
      type: 'drop_set',
      exerciseName,
      initialWeightLbs: dropStages[0].weightLbs,
      initialReps: dropStages[0].reps,
      stages: dropStages,
      totalVolumeLbs: totalDropVolumeLbs,
      totalReps: totalDropReps,
    }
    protocolData.notes = formatIntensityProtocolNotes(protocolData, units)
    onLogIntensitySet(protocolData)
    setIsOpen(false)
  }

  // Submit Rest-Pause
  const handleLogRestPause = () => {
    triggerHaptic?.('success')
    const initialLbs = units === 'imperial' ? baseWeightNum : baseWeightNum * 2.20462
    const myo = calculateMyoRepsProtocol(initialLbs, baseRepsNum, miniSets, 15)

    const protocolData: IntensityProtocolData = {
      type: 'rest_pause',
      exerciseName,
      initialWeightLbs: Math.round(initialLbs),
      initialReps: baseRepsNum,
      stages: [
        { stageNumber: 1, weightLbs: initialLbs, reps: baseRepsNum, percentDropFromInitial: 0, volumeLbs: initialLbs * baseRepsNum },
        ...miniSets.map((r, i) => ({
          stageNumber: i + 2,
          weightLbs: initialLbs,
          reps: r,
          percentDropFromInitial: 0,
          volumeLbs: Math.round(initialLbs * r),
        })),
      ],
      totalVolumeLbs: myo.totalVolumeLbs,
      totalReps: baseRepsNum + miniSets.reduce((a, b) => a + b, 0),
    }
    protocolData.notes = formatIntensityProtocolNotes(protocolData, units)
    onLogIntensitySet(protocolData)
    setIsOpen(false)
  }

  return (
    <div
      style={{
        marginBottom: 10,
        background: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 6,
        padding: '8px 12px',
      }}
    >
      {/* ── Collapsible Drawer Launcher ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setIsOpen(prev => !prev)
          }}
          className="tactile-btn"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#FCD34D',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <GaaIcon name="flame" size={12} tone="amber" />
          <span>Intensity Protocols (Drop Sets & Myo-Reps)</span>
          {nasmOptPhase === 3 && (
            <span style={{ fontSize: 9, background: 'rgba(212,160,23,0.2)', color: 'var(--gold-lt)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              P3 Recommended
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--gray)', marginLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <GaaIcon name={isOpen ? 'chevron-up' : 'chevron-down'} size={10} tone="inherit" />
            <span>{isOpen ? 'Close' : 'Open'}</span>
          </span>
        </button>
      </div>

      {isOpen && (
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
          {/* Protocol Type Selector Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                setProtocolType('drop_set')
              }}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 4,
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                background: protocolType === 'drop_set' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${protocolType === 'drop_set' ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
                color: protocolType === 'drop_set' ? '#FFFFFF' : 'var(--gray)',
              }}
            >
              Drop Set (Strip Weight)
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                setProtocolType('rest_pause')
              }}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 4,
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                background: protocolType === 'rest_pause' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${protocolType === 'rest_pause' ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
                color: protocolType === 'rest_pause' ? '#FFFFFF' : 'var(--gray)',
              }}
            >
              Rest-Pause / Myo-Reps
            </button>
          </div>

          {/* ── Protocol 1: Drop Set (Load Stripping) ── */}
          {protocolType === 'drop_set' && (
            <div>
              <div style={{ display: 'grid', gap: 6 }}>
                {dropStages.map((stage, idx) => {
                  const displayWeight = Math.round(stage.weightLbs * unitFactor)
                  const step = units === 'imperial' ? 5 : 2.5

                  return (
                    <div
                      key={`stage-${stage.stageNumber}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: idx === 0 ? 'rgba(212,160,23,0.12)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${idx === 0 ? 'rgba(212,160,23,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 4,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 }}>
                        <span style={{ fontWeight: 800, color: idx === 0 ? 'var(--gold-lt)' : '#F59E0B' }}>
                          {idx === 0 ? 'Working Set' : `Drop ${idx}`}
                        </span>
                        {idx > 0 && (
                          <span style={{ fontSize: 9.5, color: '#38BDF8', fontWeight: 700 }}>
                            −{stage.percentDropFromInitial}%
                          </span>
                        )}
                      </div>

                      {/* Weight Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateStage(idx, -step, 0)}
                          style={{ width: 22, height: 22, borderRadius: 3, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                        >
                          −
                        </button>
                        <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, minWidth: 46, textAlign: 'center' }}>
                          {displayWeight} {unitLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateStage(idx, step, 0)}
                          style={{ width: 22, height: 22, borderRadius: 3, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                        >
                          +
                        </button>
                      </div>

                      {/* Reps Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateStage(idx, 0, -1)}
                          style={{ width: 22, height: 22, borderRadius: 3, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                        >
                          −
                        </button>
                        <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, minWidth: 42, textAlign: 'center' }}>
                          {stage.reps} reps
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateStage(idx, 0, 1)}
                          style={{ width: 22, height: 22, borderRadius: 3, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                        >
                          +
                        </button>
                      </div>

                      {idx > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDropStage(idx)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, cursor: 'pointer', padding: '0 4px' }}
                          title="Remove stage"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add Stage Button */}
              {dropStages.length < 4 && (
                <div style={{ marginTop: 6, textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={handleAddDropStage}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-lt)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>+ Add Another Drop Stage</span>
                  </button>
                </div>
              )}

              {/* Cumulative Volume Mini-HUD */}
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                }}
              >
                <div>
                  <span style={{ color: 'var(--gray)' }}>Cumulative Tonnage: </span>
                  <strong style={{ color: 'var(--gold-lt)', fontFamily: 'var(--font-telemetry, monospace)' }}>
                    {Math.round(totalDropVolumeLbs * unitFactor).toLocaleString()} {unitLabel}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray)' }}>Total Reps: </span>
                  <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-telemetry, monospace)' }}>
                    {totalDropReps} reps
                  </strong>
                </div>
              </div>

              {/* Submit Drop Set Button */}
              <button
                type="button"
                onClick={handleLogDropSet}
                className="tactile-btn"
                style={{
                  marginTop: 10,
                  width: '100%',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  border: '1px solid #FBBF24',
                  color: '#0A0E18',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '9px 14px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="lightning" size={12} tone="dark" />
                <span>Log Complete Drop Set ({dropStages.length} Stages · {Math.round(totalDropVolumeLbs * unitFactor).toLocaleString()} {unitLabel})</span>
              </button>
            </div>
          )}

          {/* ── Protocol 2: Rest-Pause / Myo-Reps ── */}
          {protocolType === 'rest_pause' && (
            <div>
              <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 8, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: 'var(--gold-lt)' }}>Activation Set</span>
                  <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800 }}>
                    {baseWeightNum} {unitLabel} × {baseRepsNum} reps
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--gray)' }}>
                  Take to near failure (RPE 9), then perform 15s intra-set rest intervals between mini-sets.
                </div>
              </div>

              {/* Intra-Set 15s Rest Timer */}
              <div
                style={{
                  padding: '8px 10px',
                  background: intraRestRemaining !== null ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${intraRestRemaining !== null ? '#38BDF8' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 4,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="timer" size={13} tone={intraRestRemaining !== null ? 'cyan' : 'slate'} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: intraRestRemaining !== null ? '#38BDF8' : 'var(--gray)' }}>
                    {intraRestRemaining !== null ? `Intra-Set Rest: ${intraRestRemaining}s` : '15s Intra-Set Rest Pacer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('tap')
                    setIntraRestRemaining(15)
                    playPrecisionTone({ freq: 660, duration: 0.15, type: 'triangle' })
                  }}
                  className="tactile-btn"
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid #38BDF8',
                    color: '#38BDF8',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  {intraRestRemaining !== null ? 'Restart 15s' : 'Start 15s Rest'}
                </button>
              </div>

              {/* Mini-Sets Breakdown */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, color: 'var(--gray)', fontWeight: 700 }}>Mini-Sets:</span>
                {miniSets.map((reps, i) => (
                  <div
                    key={`mini-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(0,0,0,0.4)',
                      padding: '3px 6px',
                      borderRadius: 3,
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: 11,
                    }}
                  >
                    <span>+{reps}</span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic?.('tap')
                        setMiniSets(prev => prev.map((r, idx) => (idx === i ? Math.max(1, r - 1) : r)))
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 0, fontSize: 11 }}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic?.('tap')
                        setMiniSets(prev => prev.map((r, idx) => (idx === i ? r + 1 : r)))
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 0, fontSize: 11 }}
                    >
                      +
                    </button>
                  </div>
                ))}
                {miniSets.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.('tap')
                      setMiniSets(prev => [...prev, 2])
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38BDF8',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Mini-Set
                  </button>
                )}
              </div>

              {/* Submit Rest-Pause Button */}
              <button
                type="button"
                onClick={handleLogRestPause}
                className="tactile-btn"
                style={{
                  marginTop: 6,
                  width: '100%',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  border: '1px solid #38BDF8',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '9px 14px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="lightning" size={12} tone="white" />
                <span>Log Rest-Pause ({baseRepsNum + miniSets.reduce((a, b) => a + b, 0)} Total Reps)</span>
              </button>
            </div>
          )}

          {/* Strict Hammer Curl Biomechanical Guardrail Reminder */}
          {isHammerCurl && (
            <div
              style={{
                marginTop: 8,
                padding: '6px 10px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 4,
                borderLeft: '2px solid #F59E0B',
                fontSize: 10.5,
                color: '#FCD34D',
                lineHeight: 1.35,
              }}
            >
              <strong>Biomechanical Guardrail: </strong>
              <span>Under drop set fatigue, maintain strict neutral hammer grip. Do not twist or supinate wrists to compensate for forearm exhaustion. Dumbbells must stay vertical.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
