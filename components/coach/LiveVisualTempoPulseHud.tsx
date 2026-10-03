'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { speakNasmCue } from '@/lib/nasm-assessments'

export type TempoAudioMode = 'silent' | 'voice' | 'tick'

export interface TempoDigits {
  ecc: number
  iso: number
  con: number
  isoTop?: number
}

export function parseTempoString(tempoStr: string | null | undefined): TempoDigits {
  const raw = String(tempoStr ?? '').toLowerCase().trim()
  if (raw.includes('4/2/1') || raw.includes('4-2-1')) return { ecc: 4, iso: 2, con: 1, isoTop: 1 }
  if (raw.includes('3/1/1') || raw.includes('3-1-1')) return { ecc: 3, iso: 1, con: 1, isoTop: 0 }
  if (raw.includes('2/0/2') || raw.includes('2-0-2')) return { ecc: 2, iso: 0, con: 2, isoTop: 0 }
  if (raw.includes('1/1/1') || raw.includes('1-1-1')) return { ecc: 1, iso: 1, con: 1, isoTop: 0 }
  if (raw.includes('x/x/x') || raw.includes('explosive') || raw.includes('pap')) return { ecc: 1, iso: 0, con: 1, isoTop: 0 }

  const parts = raw.split(/[/–-]/).map(p => Number(p.trim())).filter(n => Number.isFinite(n))
  if (parts.length >= 3) {
    return { ecc: parts[0] || 2, iso: parts[1] || 0, con: parts[2] || 2, isoTop: parts[3] || 0 }
  }
  return { ecc: 2, iso: 0, con: 2, isoTop: 0 }
}

interface LiveVisualTempoPulseHudProps {
  isActive: boolean
  exerciseName?: string
  tempoString?: string | null
  targetReps?: number
  onStop: () => void
  onLogSet?: (tutSeconds: number, completedReps: number) => void
}

export default function LiveVisualTempoPulseHud({
  isActive,
  exerciseName = 'Active Exercise',
  tempoString = '4/2/1',
  targetReps = 8,
  onStop,
  onLogSet,
}: LiveVisualTempoPulseHudProps) {
  const [activeTempo, setActiveTempo] = useState<string>(tempoString || '4/2/1')
  const [phase, setPhase] = useState<'eccentric' | 'isometric' | 'concentric'>('eccentric')
  const [secLeft, setSecLeft] = useState<number>(4)
  const [repCount, setRepCount] = useState<number>(1)
  const [totalTutSec, setTotalTutSec] = useState<number>(0)
  const [audioMode, setAudioMode] = useState<TempoAudioMode>('silent')
  const [progressPct, setProgressPct] = useState<number>(0)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync activeTempo with prop changes
  useEffect(() => {
    if (tempoString) {
      setActiveTempo(tempoString)
    }
  }, [tempoString])

  // Play low-latency synth tick if audio mode is active
  const playTick = useCallback((freq = 520, duration = 0.04) => {
    if (audioMode !== 'tick') return
    try {
      if (!audioCtxRef.current) {
        const windowAudio = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
        const AudioClass = windowAudio.AudioContext || windowAudio.webkitAudioContext
        if (AudioClass) audioCtxRef.current = new AudioClass()
      }
      const ctx = audioCtxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') void ctx.resume()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [audioMode])

  // Main high-precision animation loop
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current)
      setTotalTutSec(0)
      setRepCount(1)
      setProgressPct(0)
      return
    }

    const { ecc, iso, con } = parseTempoString(activeTempo)
    let currentPhase: 'eccentric' | 'isometric' | 'concentric' = 'eccentric'
    let phaseTotalSec = ecc || 2
    let phaseElapsedMs = 0
    let currentReps = 1
    let tutMs = 0

    setPhase('eccentric')
    setSecLeft(ecc || 2)
    setRepCount(1)
    setProgressPct(0)

    if (audioMode === 'voice') speakNasmCue(`Rep 1. Lower ${ecc} seconds.`)
    else if (audioMode === 'tick') playTick(600)

    const intervalMs = 50 // 20 updates per second for butter-smooth progress bar

    timerRef.current = setInterval(() => {
      phaseElapsedMs += intervalMs
      tutMs += intervalMs
      setTotalTutSec(Math.floor(tutMs / 1000))

      const currentPhaseSecTotal = phaseTotalSec
      const currentPct = Math.min(100, Math.round((phaseElapsedMs / (currentPhaseSecTotal * 1000)) * 100))
      setProgressPct(currentPct)

      const remainingSec = Math.max(1, Math.ceil(currentPhaseSecTotal - phaseElapsedMs / 1000))
      setSecLeft(remainingSec)

      // Phase transitions
      if (phaseElapsedMs >= currentPhaseSecTotal * 1000) {
        phaseElapsedMs = 0

        if (currentPhase === 'eccentric') {
          if (iso > 0) {
            currentPhase = 'isometric'
            phaseTotalSec = iso
            if (audioMode === 'voice') speakNasmCue('Hold.')
            else if (audioMode === 'tick') playTick(750)
          } else {
            currentPhase = 'concentric'
            phaseTotalSec = con
            if (audioMode === 'voice') speakNasmCue('Drive up!')
            else if (audioMode === 'tick') playTick(950)
          }
        } else if (currentPhase === 'isometric') {
          currentPhase = 'concentric'
          phaseTotalSec = con
          if (audioMode === 'voice') speakNasmCue('Drive!')
          else if (audioMode === 'tick') playTick(950)
        } else {
          // Rep Completed -> Return to Eccentric
          currentReps += 1
          setRepCount(currentReps)
          currentPhase = 'eccentric'
          phaseTotalSec = ecc
          if (audioMode === 'voice') speakNasmCue(`Rep ${currentReps}. Lower.`)
          else if (audioMode === 'tick') playTick(600)
        }

        setPhase(currentPhase)
      }
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, activeTempo, audioMode, playTick])

  if (!isActive) return null

  const phaseMeta = {
    eccentric: {
      label: '1. Eccentric (Descent)',
      color: '#38BDF8',
      glow: 'rgba(56, 189, 248, 0.4)',
      bg: 'rgba(56, 189, 248, 0.12)',
      cue: 'Control 4s negative descent',
    },
    isometric: {
      label: '2. Isometric (Pause in Hole)',
      color: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.4)',
      bg: 'rgba(245, 158, 11, 0.12)',
      cue: 'Maintain peak tension, no bounce',
    },
    concentric: {
      label: '3. Concentric (Drive Up)',
      color: '#10B981',
      glow: 'rgba(16, 185, 129, 0.4)',
      bg: 'rgba(16, 185, 129, 0.12)',
      cue: 'Explosive drive through floor',
    },
  }[phase]

  const tempoPresets = ['4/2/1', '3/1/1', '2/0/2', '1/1/1']

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        maxWidth: 480,
        zIndex: 35,
        background: 'linear-gradient(180deg, rgba(8, 14, 24, 0.96) 0%, rgba(4, 8, 14, 0.98) 100%)',
        border: `1.5px solid ${phaseMeta.color}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: `0 12px 30px rgba(0, 0, 0, 0.7), 0 0 20px ${phaseMeta.glow}`,
        backdropFilter: 'blur(12px)',
        display: 'grid',
        gap: 10,
        boxSizing: 'border-box',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: phaseMeta.color,
              boxShadow: `0 0 8px ${phaseMeta.color}`,
              animation: 'pulse 1s infinite',
            }}
          />
          <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: '#FFFFFF', letterSpacing: '0.04em' }}>
            {exerciseName}
          </span>
          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: phaseMeta.bg, color: phaseMeta.color, fontWeight: 700 }}>
            {activeTempo} Cadence
          </span>
        </div>

        {/* Audio Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {(['silent', 'voice', 'tick'] as TempoAudioMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setAudioMode(mode)}
              style={{
                padding: '3px 7px',
                borderRadius: 4,
                border: audioMode === mode ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: audioMode === mode ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: audioMode === mode ? 'var(--gold-lt)' : 'var(--gray)',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {mode === 'silent' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GaaIcon name="ban" size={10} tone="inherit" />
                  <span>Silent</span>
                </span>
              ) : mode === 'voice' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GaaIcon name="speech" size={10} tone="inherit" />
                  <span>Voice</span>
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GaaIcon name="headphones" size={10} tone="inherit" />
                  <span>Tick</span>
                </span>
              )}
            </button>
          ))}

          <button
            type="button"
            onClick={onStop}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid #EF4444',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#FCA5A5',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Primary Kinetic Biomechanical Progress Bar */}
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          <strong style={{ color: phaseMeta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {phaseMeta.label}
          </strong>
          <span style={{ color: '#FFFFFF', fontWeight: 800, fontFamily: 'monospace' }}>
            {secLeft}s left
          </span>
        </div>

        {/* Dynamic Glowing Progress Track */}
        <div
          style={{
            height: 10,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 5,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${phaseMeta.color}88 0%, ${phaseMeta.color} 100%)`,
              borderRadius: 5,
              boxShadow: `0 0 10px ${phaseMeta.color}`,
              transition: 'width 0.05s linear',
            }}
          />
        </div>
      </div>

      {/* Telemetry Footer: Rep Count, TUT & Log Set Trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Rep:</span>
            <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 18, color: '#FFFFFF' }}>
              {repCount}
            </span>
            {targetReps && (
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>/ {targetReps}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>TUT:</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--gold-lt)', fontWeight: 800 }}>
              {totalTutSec}s
            </span>
          </div>
        </div>

        {/* Quick Tempo Presets & Log Set */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {tempoPresets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setActiveTempo(preset)}
                style={{
                  padding: '2px 5px',
                  borderRadius: 3,
                  background: activeTempo === preset ? 'rgba(197, 160, 89, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeTempo === preset ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeTempo === preset ? 'var(--gold-lt)' : 'var(--gray)',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {onLogSet && (
            <button
              type="button"
              onClick={() => onLogSet(totalTutSec, repCount)}
              className="tactile-btn"
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                border: 'none',
                color: '#080E14',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <GaaIcon name="check" size={11} style={{ color: '#080E14', stroke: '#080E14' }} />
              <span>Log Set ({totalTutSec}s TUT)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

