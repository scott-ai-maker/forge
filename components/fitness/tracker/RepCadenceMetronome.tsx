'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  parseMovementTempo,
  PrecisionCadenceScheduler,
  CadencePhase,
} from '@/lib/web-audio-cadence-engine'
import { calculateRepVelocityAndPower } from '@/lib/bar-velocity-power-engine'
import { isVbtOfferedForPhase, getNasmOptPhaseFeatureRules } from '@/lib/nasm-opt-feature-matrix'
import BarVelocityPowerTrackerTray from './BarVelocityPowerTrackerTray'

export interface RepCadenceMetronomeProps {
  tempo: string
  targetReps: number | string
  exerciseName: string
  weightKg?: number
  units?: 'imperial' | 'metric'
  nasmOptPhase?: number
  onCompleteReps?: (completedReps: number) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function RepCadenceMetronome({
  tempo,
  targetReps,
  exerciseName,
  weightKg,
  units = 'imperial',
  nasmOptPhase,
  onCompleteReps,
  triggerHaptic,
}: RepCadenceMetronomeProps) {
  const parsedTempo = parseMovementTempo(tempo)
  const totalRepsNum = typeof targetReps === 'number' ? targetReps : (parseInt(String(targetReps).replace(/\D/g, ''), 10) || 8)

  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [currentPhase, setCurrentPhase] = useState<CadencePhase>('idle')
  const [currentRep, setCurrentRep] = useState<number>(0)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [preCountSec, setPreCountSec] = useState<number>(3)
  const [showVelocityTray, setShowVelocityTray] = useState<boolean>(false)

  const effectiveLoadKg = weightKg && weightKg > 0 ? weightKg : 50
  const instantaneousVelocity = useMemo(() => {
    return calculateRepVelocityAndPower({
      exerciseName,
      loadKg: effectiveLoadKg,
      concentricSec: parsedTempo.concentricSec || 1.2,
      eccentricSec: parsedTempo.eccentricSec || 2.0,
      repNumber: currentRep || 1,
    })
  }, [exerciseName, effectiveLoadKg, parsedTempo.concentricSec, parsedTempo.eccentricSec, currentRep])

  const schedulerRef = useRef<PrecisionCadenceScheduler | null>(null)

  // Cleanup scheduler on unmount
  useEffect(() => {
    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.stop()
      }
    }
  }, [])

  const handleStart = () => {
    triggerHaptic?.('heavy')
    if (schedulerRef.current) {
      schedulerRef.current.stop()
    }

    const scheduler = new PrecisionCadenceScheduler({
      eccentricSec: parsedTempo.eccentricSec,
      isometricSec: parsedTempo.isometricSec,
      concentricSec: parsedTempo.concentricSec,
      preCountSec,
      totalReps: totalRepsNum,
      soundEnabled,
      onPhaseChange: (phase, rep, sec) => {
        setCurrentPhase(phase)
        setCurrentRep(rep)
        setSecondsRemaining(sec)
        triggerHaptic?.('tap')
      },
      onComplete: () => {
        setIsRunning(false)
        setIsPaused(false)
        setCurrentPhase('idle')
        triggerHaptic?.('success')
        onCompleteReps?.(totalRepsNum)
      },
    })

    schedulerRef.current = scheduler
    scheduler.start()
    setIsRunning(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    triggerHaptic?.('tap')
    if (schedulerRef.current) {
      schedulerRef.current.pause()
      setIsPaused(true)
    }
  }

  const handleResume = () => {
    triggerHaptic?.('tap')
    if (schedulerRef.current) {
      schedulerRef.current.resume()
      setIsPaused(false)
    }
  }

  const handleStop = () => {
    triggerHaptic?.('tap')
    if (schedulerRef.current) {
      schedulerRef.current.stop()
    }
    setIsRunning(false)
    setIsPaused(false)
    setCurrentPhase('idle')
    setCurrentRep(0)
    setSecondsRemaining(0)
  }

  const handleFinishEarly = () => {
    triggerHaptic?.('success')
    const completed = Math.max(1, currentRep || 1)
    handleStop()
    onCompleteReps?.(completed)
  }

  const toggleSound = () => {
    triggerHaptic?.('tap')
    const next = !soundEnabled
    setSoundEnabled(next)
    if (schedulerRef.current) {
      schedulerRef.current.setSoundEnabled(next)
    }
  }

  const isHammerCurl = /\b(hammer curl)\b/i.test(exerciseName)

  // Phase Theme & Color Coding
  const getPhaseStyles = () => {
    switch (currentPhase) {
      case 'pre_exercise_countdown':
        return {
          title: 'GET IN POSITION',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          progress: secondsRemaining / (preCountSec || 3),
        }
      case 'eccentric':
        return {
          title: 'LOWERING (ECCENTRIC)',
          color: '#38BDF8',
          bg: 'rgba(56, 189, 248, 0.15)',
          border: 'rgba(56, 189, 248, 0.4)',
          progress: secondsRemaining / (parsedTempo.eccentricSec || 1),
        }
      case 'isometric':
        return {
          title: 'PAUSE & HOLD (ISOMETRIC)',
          color: '#D4AF37',
          bg: 'rgba(212, 160, 23, 0.18)',
          border: 'rgba(212, 160, 23, 0.45)',
          progress: secondsRemaining / (parsedTempo.isometricSec || 1),
        }
      case 'concentric':
        return {
          title: 'DRIVE / EXPLODE (CONCENTRIC)',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.18)',
          border: 'rgba(16, 185, 129, 0.45)',
          progress: secondsRemaining / (parsedTempo.concentricSec || 1),
        }
      default:
        return {
          title: 'READY TO START',
          color: 'var(--gold-lt)',
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.12)',
          progress: 1,
        }
    }
  }

  const phaseStyle = getPhaseStyles()

  return (
    <div
      style={{
        marginTop: 8,
        marginBottom: 8,
        background: 'linear-gradient(145deg, rgba(13,27,42,0.85) 0%, rgba(10,14,24,0.95) 100%)',
        border: '1px solid rgba(212, 160, 23, 0.25)',
        borderRadius: 6,
        padding: '8px 12px',
        overflow: 'hidden',
      }}
    >
      {/* ── Compact Header / Launcher ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setIsExpanded(prev => !prev)
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
            color: 'var(--gold-lt)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <GaaIcon name="timer" size={12} tone="gold" />
          <span>Cadence Metronome: {parsedTempo.raw}</span>
          <span style={{ fontSize: 9.5, color: 'var(--gray)', fontWeight: 600 }}>
            ({parsedTempo.repDurationSec}s / rep)
          </span>
          <span style={{ fontSize: 9.5, color: 'var(--gray)', marginLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <GaaIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={10} tone="inherit" />
            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              setShowVelocityTray(prev => !prev)
              if (!isExpanded && !showVelocityTray) {
                setIsExpanded(true)
              }
            }}
            className="tactile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: showVelocityTray ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.1)',
              border: `1px solid ${showVelocityTray ? '#38BDF8' : 'rgba(56, 189, 248, 0.35)'}`,
              color: '#38BDF8',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            title="Toggle Bar Velocity & Kinetic Power Output Tracker"
          >
            <span>⚡</span>
            <span>{showVelocityTray ? 'VBT Active' : 'Bar Velocity'}</span>
          </button>

          {!isExpanded && !isRunning && (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(true)
                handleStart()
              }}
              className="tactile-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              <GaaIcon name="play" size={10} tone="cyan" />
              <span>Start Tempo ({parsedTempo.raw})</span>
            </button>
          )}

          {isRunning && !isExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: phaseStyle.color,
                  background: phaseStyle.bg,
                  padding: '2px 6px',
                  borderRadius: 3,
                  border: `1px solid ${phaseStyle.border}`,
                }}
              >
                Rep {currentRep}/{totalRepsNum} · {secondsRemaining}s
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                style={{ background: 'none', border: 'none', color: 'var(--gold-lt)', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Open HUD
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded Metronome HUD ── */}
      {isExpanded && (
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
          {/* Phase Telemetry Banner */}
          <div
            style={{
              padding: '10px 12px',
              background: phaseStyle.bg,
              border: `1px solid ${phaseStyle.border}`,
              borderRadius: 6,
              marginBottom: 10,
              position: 'relative',
              overflow: 'hidden',
              transition: 'background 0.3s ease, border-color 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: phaseStyle.color,
                    boxShadow: `0 0 8px ${phaseStyle.color}`,
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 800, color: phaseStyle.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {phaseStyle.title}
                </span>
                {currentPhase === 'concentric' && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #10B981',
                      color: '#6EE7B7',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ⚡ {instantaneousVelocity.meanConcentricVelocity.toFixed(2)} m/s · {Math.round(instantaneousVelocity.meanPowerWatts)}W
                  </span>
                )}
              </div>

              {/* Sound & Mute Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className="tactile-btn"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: soundEnabled ? 'var(--gold-lt)' : 'var(--gray)',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title={soundEnabled ? 'Mute Web Audio Ticks' : 'Enable Web Audio Ticks'}
              >
                <GaaIcon name="lightning" size={10} tone={soundEnabled ? 'gold' : 'slate'} />
                <span>Audio: {soundEnabled ? 'ON' : 'MUTED'}</span>
              </button>
            </div>

            {/* Countdown & Rep Counter Telemetry */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 26, fontWeight: 800, color: '#FFFFFF' }}>
                {isRunning ? (
                  <>
                    <span>{secondsRemaining}</span>
                    <span style={{ fontSize: 13, color: 'var(--gray)', marginLeft: 4 }}>SEC</span>
                  </>
                ) : (
                  <span style={{ fontSize: 15, color: 'var(--gray)' }}>STANDBY</span>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                  Rep Progress
                </span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 800, color: 'var(--gold-lt)' }}>
                  {currentRep} <span style={{ fontSize: 13, color: 'var(--gray)' }}>/ {totalRepsNum}</span>
                </span>
              </div>
            </div>

            {/* Dynamic Contraction Bar */}
            <div
              style={{
                marginTop: 8,
                height: 5,
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(5, phaseStyle.progress * 100)}%`,
                  background: phaseStyle.color,
                  transition: 'width 0.95s linear',
                  borderRadius: 3,
                }}
              />
            </div>
          </div>

          {/* Interactive Pacing Controls */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStart}
                className="tactile-btn"
                style={{
                  flex: 2,
                  minWidth: 140,
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  border: '1px solid #38BDF8',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="play" size={12} tone="white" />
                <span>Start Set Metronome</span>
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={handleResume}
                className="tactile-btn"
                style={{
                  flex: 2,
                  minWidth: 140,
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: '1px solid #10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="play" size={12} tone="white" />
                <span>Resume Pacer</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="tactile-btn"
                style={{
                  flex: 2,
                  minWidth: 140,
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #F59E0B',
                  color: '#FCD34D',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>⏸ Pause Pacer</span>
              </button>
            )}

            {isRunning && (
              <>
                <button
                  type="button"
                  onClick={handleFinishEarly}
                  className="tactile-btn"
                  style={{
                    flex: 1,
                    minWidth: 110,
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10B981',
                    color: '#6EE7B7',
                    fontWeight: 700,
                    fontSize: 11,
                    padding: '8px 10px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                  title="Finish set at current completed reps"
                >
                  <GaaIcon name="check" size={11} tone="emerald" />
                  <span>Finish ({currentRep})</span>
                </button>

                <button
                  type="button"
                  onClick={handleStop}
                  className="tactile-btn"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--gray)',
                    fontSize: 11,
                    padding: '8px 10px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  title="Reset Metronome"
                >
                  Reset
                </button>
              </>
            )}
          </div>

          {/* ── Velocity-Based Training (VBT) & Kinetic Power Drawer ── */}
          {(nasmOptPhase === undefined || isVbtOfferedForPhase(nasmOptPhase)) && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('tap')
                  setShowVelocityTray(prev => !prev)
                }}
                className="tactile-btn"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: showVelocityTray ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.08)',
                  border: `1px solid ${showVelocityTray ? '#38BDF8' : 'rgba(56, 189, 248, 0.3)'}`,
                  borderRadius: 6,
                  color: '#38BDF8',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚡</span>
                  <span>Bar Velocity &amp; Kinetic Power Output (VBT)</span>
                  {(nasmOptPhase === 4 || nasmOptPhase === 5) && (
                    <span style={{ fontSize: 8.5, background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 3, padding: '1px 4px', textTransform: 'uppercase' }}>
                      P{nasmOptPhase} Focus
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#E2E8F0', fontFamily: 'var(--font-telemetry, monospace)' }}>
                    {instantaneousVelocity.meanConcentricVelocity.toFixed(2)} m/s · {Math.round(instantaneousVelocity.meanPowerWatts)}W
                  </span>
                  <span>{showVelocityTray ? '▲' : '▼'}</span>
                </div>
              </button>

            {showVelocityTray && (
              <div style={{ marginTop: 8 }}>
                <BarVelocityPowerTrackerTray
                  exerciseName={exerciseName}
                  weightKg={effectiveLoadKg}
                  units={units}
                  currentPhase={currentPhase}
                  currentRep={currentRep}
                  concentricDurationSec={parsedTempo.concentricSec}
                  eccentricDurationSec={parsedTempo.eccentricSec}
                  onClose={() => setShowVelocityTray(false)}
                  triggerHaptic={triggerHaptic}
                />
              </div>
            )}
          </div>
        )}

          {/* Pre-Exercise Setup Interval Setting */}
          {!isRunning && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--gray)', fontWeight: 600 }}>
                Get-Ready Countdown:
              </span>
              {[2, 3, 5].map(secs => (
                <button
                  key={`pre-${secs}`}
                  type="button"
                  onClick={() => setPreCountSec(secs)}
                  style={{
                    background: preCountSec === secs ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${preCountSec === secs ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                    color: preCountSec === secs ? 'var(--gold-lt)' : 'var(--gray)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  {secs}s
                </button>
              ))}
            </div>
          )}

          {/* Biomechanical Rationale Callout */}
          <div
            style={{
              marginTop: 10,
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              borderLeft: '2px solid var(--gold)',
              fontSize: 10.5,
              color: 'var(--gray)',
              lineHeight: 1.4,
            }}
          >
            <strong style={{ color: 'var(--gold-lt)' }}>{parsedTempo.phaseTitle}: </strong>
            <span>{parsedTempo.biomechanicalRationale}</span>
          </div>

          {/* Strict Hammer Curl Biomechanical Guardrail Reminder */}
          {isHammerCurl && (
            <div
              style={{
                marginTop: 6,
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
              <span>Strict neutral grip required. Palms must face inward toward each other with zero twisting/supination. Dumbbells oriented vertically throughout entire repetition.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
