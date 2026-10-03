'use client'

import React, { useState, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  NASM_PLYOMETRIC_LIBRARY,
  PlyometricTier,
  calculateRsi,
  evaluateLandingMechanics,
  generatePlyometricProtocol,
  NASM_LANDING_FAULTS,
} from '@/lib/nasm-plyometric-engine'

interface PlyometricPowerStudioProps {
  initialOptPhase?: number
  athleteBodyweightLbs?: number
}

type StudioTab = 'library' | 'rsi_lab' | 'screener' | 'prescriber'

export default function PlyometricPowerStudio({
  initialOptPhase = 1,
  athleteBodyweightLbs = 185,
}: PlyometricPowerStudioProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('library')
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | PlyometricTier>('all')

  // Landing Freeze Metronome Timer for Phase 1 drills
  const [activeTimerExercise, setActiveTimerExercise] = useState<string | null>(null)
  const [landingSecondsLeft, setLandingSecondsLeft] = useState<number>(0)
  const [timerRunning, setTimerRunning] = useState<boolean>(false)

  // RSI Calculator State
  const [jumpHeightCm, setJumpHeightCm] = useState<number>(38)
  const [contactTimeMs, setContactTimeMs] = useState<number>(165)
  const [bodyweightLbs, setBodyweightLbs] = useState<number>(athleteBodyweightLbs)

  // Landing Fault Screener State
  const [selectedFaults, setSelectedFaults] = useState<string[]>([])

  // Program Prescriber State
  const [prescribedPhase, setPrescribedPhase] = useState<number>(initialOptPhase)
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false)

  // Landing Hold Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerRunning && landingSecondsLeft > 0) {
      interval = setInterval(() => {
        setLandingSecondsLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning, landingSecondsLeft])

  function triggerLandingFreeze(exerciseId: string, seconds = 5) {
    setActiveTimerExercise(exerciseId)
    setLandingSecondsLeft(seconds)
    setTimerRunning(true)
  }

  // Calculations
  const rsiResult = calculateRsi({
    jumpHeightCm,
    contactTimeMs,
    bodyweightLbs,
  })

  const landingScreenResult = evaluateLandingMechanics(selectedFaults)
  const currentSessionProtocol = generatePlyometricProtocol(prescribedPhase)

  const filteredExercises = NASM_PLYOMETRIC_LIBRARY.filter(ex => {
    if (selectedTierFilter === 'all') return true
    return ex.tier === selectedTierFilter
  })

  function toggleFault(faultId: string) {
    setSelectedFaults(prev =>
      prev.includes(faultId) ? prev.filter(id => id !== faultId) : [...prev, faultId]
    )
  }

  function handleCopyProtocol() {
    const text = `GORDON ATHLETIC ADVISORY — ${currentSessionProtocol.tierTitle}
Overview: ${currentSessionProtocol.sessionOverview}
Rest Between Drills: ${currentSessionProtocol.restBetweenExercisesSec}s

${currentSessionProtocol.exercises
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.exercise.name} (${item.exercise.tierLabel})
   • Volume: ${item.sets} | ${item.reps}
   • Tempo: ${item.tempo}
   • Landing Focus: ${item.landingFocus}`
  )
  .join('\n\n')}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedSuccess(true)
      setTimeout(() => setCopiedSuccess(false), 2500)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0A0E18 0%, #060912 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 14,
        padding: 'clamp(14px, 3.5vw, 24px)',
        color: '#FFFFFF',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      }}
    >
      {/* ── Studio Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold-lt)',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Gordon Athletic Advisory · NASM Reactive Power Standards
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 22,
              letterSpacing: '0.04em',
              margin: 0,
              color: '#FFFFFF',
            }}
          >
            Dynamic Plyometric & Reactive Power Matrix Studio
          </h3>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Stretch-Shortening Cycle (SSC) Mechanics · Amortization Phase Optimization · 3-Tier OPT™ Reactive Continuum
          </p>
        </div>

        {/* Studio Tabs */}
        <div className="responsive-tabs-scroll" style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'library', label: '1. 3-Tier Exercise Matrix' },
            { key: 'rsi_lab', label: '2. RSI & Power Lab' },
            { key: 'screener', label: '3. Landing Fault Screener' },
            { key: 'prescriber', label: '4. 1-Click Protocol' },
          ].map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as StudioTab)}
                className="tactile-btn"
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? '1px solid #D4A017' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#F5D77F' : '#CCCCCC',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── TAB 1: 3-TIER PLYOMETRIC EXERCISE MATRIX ──────────────────── */}
      {activeTab === 'library' && (
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Filter Tier:
            </span>
            {[
              { key: 'all', label: 'All Tiers (1–3)' },
              { key: 'stabilization', label: 'Tier 1: Stabilization (Phase 1)' },
              { key: 'strength', label: 'Tier 2: Strength (Phases 2-4)' },
              { key: 'power', label: 'Tier 3: Power (Phase 5)' },
            ].map(pill => {
              const active = selectedTierFilter === pill.key
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setSelectedTierFilter(pill.key as 'all' | PlyometricTier)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: active ? '1px solid #D4A017' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? '#D4A017' : 'transparent',
                    color: active ? '#0A0E18' : '#FFFFFF',
                  }}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>

          {/* Exercise Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
            {filteredExercises.map(ex => {
              const isTimerTarget = activeTimerExercise === ex.id && timerRunning
              const isStab = ex.tier === 'stabilization'

              return (
                <div
                  key={ex.id}
                  style={{
                    background: 'rgba(14,23,38,0.7)',
                    border: isTimerTarget ? '1px solid #10B981' : isStab ? '1px solid rgba(59,130,246,0.4)' : ex.tier === 'strength' ? '1px solid rgba(212,160,23,0.4)' : '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: isTimerTarget ? '0 0 15px rgba(16,185,129,0.3)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: isStab ? 'rgba(59,130,246,0.15)' : ex.tier === 'strength' ? 'rgba(212,160,23,0.15)' : 'rgba(239,68,68,0.15)',
                          color: isStab ? '#60A5FA' : ex.tier === 'strength' ? '#F5D77F' : '#F87171',
                          border: isStab ? '1px solid rgba(59,130,246,0.3)' : ex.tier === 'strength' ? '1px solid rgba(212,160,23,0.3)' : '1px solid rgba(239,68,68,0.3)',
                        }}
                      >
                        {ex.tierLabel}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                        {ex.plane} Plane
                      </span>
                    </div>

                    <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 17, margin: '4px 0 6px', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                      {ex.name}
                    </h4>

                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                      {ex.primaryFocus}
                    </p>

                    {/* Prescribed Parameters */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px 10px',
                        borderRadius: 6,
                        marginTop: 10,
                        fontSize: 11,
                      }}
                    >
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Volume: </span>
                        <strong style={{ color: '#FFFFFF' }}>{ex.prescribedSets} · {ex.prescribedReps}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Rest: </span>
                        <strong style={{ color: '#FFFFFF' }}>{ex.restIntervalSec}s</strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tempo: </span>
                        <span style={{ color: 'var(--gold-lt)' }}>{ex.tempo}</span>
                      </div>
                    </div>

                    {/* Coaching Cues */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                        Key Coaching & Landing Cues:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                        {ex.coachingCues.slice(0, 2).map((cue, idx) => (
                          <li key={idx}>{cue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Interactive Metronome Landing Timer (for Tier 1) */}
                  {isStab ? (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                      {isTimerTarget ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.15)', padding: '6px 12px', borderRadius: 6 }}>
                          <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                            HOLD STATUE FREEZE:
                          </span>
                          <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}>
                            {landingSecondsLeft}s
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerLandingFreeze(ex.id, 5)}
                          style={{
                            width: '100%',
                            padding: '7px 12px',
                            borderRadius: 6,
                            background: 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(59,130,246,0.4)',
                            color: '#60A5FA',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <GaaIcon name="watch" size={11} tone="cyan" />
                          <span>Trigger 5-Second Landing Freeze</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ground Contact:</span>
                      <strong style={{ color: ex.tier === 'power' ? '#F87171' : 'var(--gold-lt)' }}>
                        {ex.tier === 'power' ? '< 150 ms (Rapid SSC)' : '< 500 ms (Rhythmic)'}
                      </strong>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: RSI & RATE OF FORCE DEVELOPMENT (RFD) LAB ──────────── */}
      {activeTab === 'rsi_lab' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          {/* Telemetry Input Panel */}
          <div
            style={{
              background: 'rgba(14,23,38,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.03em', margin: '0 0 12px', color: '#FFFFFF' }}>
              Stretch-Shortening Cycle Biometrics
            </h4>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Jump Height */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Vertical Jump Height</span>
                  <strong style={{ color: 'var(--gold-lt)' }}>
                    {jumpHeightCm} cm ({(jumpHeightCm / 2.54).toFixed(1)} in)
                  </strong>
                </div>
                <input
                  type="range"
                  min={15}
                  max={75}
                  value={jumpHeightCm}
                  onChange={e => setJumpHeightCm(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#D4A017' }}
                />
              </div>

              {/* Ground Contact Time */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Ground Contact Time (Amortization)</span>
                  <strong style={{ color: contactTimeMs <= 150 ? '#10B981' : contactTimeMs > 250 ? '#F87171' : 'var(--gold-lt)' }}>
                    {contactTimeMs} ms
                  </strong>
                </div>
                <input
                  type="range"
                  min={80}
                  max={450}
                  value={contactTimeMs}
                  onChange={e => setContactTimeMs(Number(e.target.value))}
                  style={{ width: '100%', accentColor: contactTimeMs <= 150 ? '#10B981' : '#D4A017' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  <span>80ms (Elite Recoil)</span>
                  <span>150ms (SSC Threshold)</span>
                  <span>450ms (Slow Yielding)</span>
                </div>
              </div>

              {/* Athlete Bodyweight */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Athlete Bodyweight</span>
                  <strong style={{ color: '#FFFFFF' }}>{bodyweightLbs} lbs</strong>
                </div>
                <input
                  type="range"
                  min={100}
                  max={300}
                  value={bodyweightLbs}
                  onChange={e => setBodyweightLbs(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#D4A017' }}
                />
              </div>
            </div>
          </div>

          {/* Biomechanical Diagnostic Results */}
          <div
            style={{
              background: 'rgba(14,23,38,0.7)',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 10,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', marginBottom: 6 }}>
                Reactive Elasticity & RFD Output
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 38, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {rsiResult.rsiScore}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  RSI Score
                </span>
              </div>

              {/* Status Badge */}
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: rsiResult.rsiScore >= 2.5 ? 'rgba(16,185,129,0.2)' : rsiResult.rsiScore >= 2.0 ? 'rgba(59,130,246,0.2)' : rsiResult.rsiScore >= 1.5 ? 'rgba(212,160,23,0.2)' : 'rgba(239,68,68,0.2)',
                    color: rsiResult.rsiScore >= 2.5 ? '#34D399' : rsiResult.rsiScore >= 2.0 ? '#60A5FA' : rsiResult.rsiScore >= 1.5 ? '#F5D77F' : '#F87171',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {rsiResult.rating}
                </span>
              </div>

              {/* Telemetry Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginTop: 16,
                  background: 'rgba(0,0,0,0.35)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase' }}>Amortization Speed</div>
                  <strong style={{ color: '#FFFFFF' }}>{rsiResult.amortizationClassification}</strong>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase' }}>Peak Deceleration Impact</div>
                  <strong style={{ color: 'var(--gold-lt)' }}>
                    {rsiResult.estimatedGroundReactionForceLbs} lbs ({rsiResult.grfMultiplier}× BW)
                  </strong>
                </div>
              </div>

              {/* Clinical Recommendation */}
              <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--gold-lt)' }}>Sports Science Directive: </strong>
                {rsiResult.coachingRecommendation}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPrescribedPhase(rsiResult.prescribedTier === 'stabilization' ? 1 : rsiResult.prescribedTier === 'strength' ? 2 : 5)
                setActiveTab('prescriber')
              }}
              className="tactile-btn"
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                background: 'linear-gradient(135deg, #D4A017 0%, #AA7C11 100%)',
                color: '#0A0E18',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Apply Prescribed Protocol ({rsiResult.prescribedTier.toUpperCase()}) →
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: LANDING MECHANICS FAULT SCREENER ───────────────────── */}
      {activeTab === 'screener' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <div
            style={{
              background: 'rgba(14,23,38,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.03em', margin: '0 0 4px', color: '#FFFFFF' }}>
                  Deceleration Biomechanics & Landing Fault Screener
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  Observe athlete landing from a 12-18" box jump-down or maximal vertical jump. Check all observed compensations.
                </p>
              </div>

              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  background: landingScreenResult.recommendedOptPhaseCap === 5 ? 'rgba(16,185,129,0.15)' : landingScreenResult.recommendedOptPhaseCap === 3 ? 'rgba(212,160,23,0.15)' : 'rgba(239,68,68,0.15)',
                  color: landingScreenResult.recommendedOptPhaseCap === 5 ? '#34D399' : landingScreenResult.recommendedOptPhaseCap === 3 ? '#F5D77F' : '#F87171',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Max Allowed OPT™ Phase: Phase {landingScreenResult.recommendedOptPhaseCap}
              </div>
            </div>
          </div>

          {/* Faults Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {Object.values(NASM_LANDING_FAULTS).map(fault => {
              const selected = selectedFaults.includes(fault.id)

              return (
                <div
                  key={fault.id}
                  onClick={() => toggleFault(fault.id)}
                  style={{
                    background: selected ? 'rgba(239,68,68,0.12)' : 'rgba(14,23,38,0.6)',
                    border: selected ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 15, letterSpacing: '0.02em', color: selected ? '#F87171' : '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {selected ? (
                          <GaaIcon name="alert-triangle" size={13} tone="ruby" />
                        ) : (
                          <span style={{ width: 13, height: 13, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, display: 'inline-block' }} />
                        )}
                        <span>{fault.name}</span>
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: fault.severity === 'severe' ? 'rgba(239,68,68,0.2)' : 'rgba(212,160,23,0.2)',
                          color: fault.severity === 'severe' ? '#F87171' : '#F5D77F',
                        }}
                      >
                        {fault.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: '#F87171', marginTop: 4, lineHeight: 1.4 }}>
                      <strong>Injury Risk: </strong>
                      {fault.injuryRisk}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, fontSize: 11, color: 'var(--gold-lt)', lineHeight: 1.4 }}>
                    <strong>Corrective Cue: </strong>
                    {fault.correctiveAdjustment}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: 1-CLICK PLYOMETRIC PROGRAM PRESCRIBER ──────────────── */}
      {activeTab === 'prescriber' && (
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Phase Selector */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select OPT™ Training Phase:
            </span>
            {[
              { phase: 1, label: 'Phase 1: Stabilization' },
              { phase: 2, label: 'Phase 2: Strength Endurance' },
              { phase: 3, label: 'Phase 3: Hypertrophy' },
              { phase: 4, label: 'Phase 4: Max Strength' },
              { phase: 5, label: 'Phase 5: Power' },
            ].map(p => {
              const active = prescribedPhase === p.phase
              return (
                <button
                  key={p.phase}
                  type="button"
                  onClick={() => setPrescribedPhase(p.phase)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: active ? '1px solid #D4A017' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? '#D4A017' : 'transparent',
                    color: active ? '#0A0E18' : '#FFFFFF',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Session Overview Card */}
          <div
            style={{
              background: 'rgba(14,23,38,0.7)',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, letterSpacing: '0.03em', margin: 0, color: '#FFFFFF' }}>
                  {currentSessionProtocol.tierTitle}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', maxWidth: 650, lineHeight: 1.4 }}>
                  {currentSessionProtocol.sessionOverview}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyProtocol}
                className="tactile-btn"
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  background: copiedSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                  border: copiedSuccess ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.15)',
                  color: copiedSuccess ? '#34D399' : '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {copiedSuccess ? (
                  <>
                    <GaaIcon name="check" size={12} tone="emerald" />
                    <span>Protocol Copied!</span>
                  </>
                ) : (
                  <>
                    <GaaIcon name="folder" size={12} tone="inherit" />
                    <span>Copy Full Workout</span>
                  </>
                )}
              </button>
            </div>

            {/* Prescribed Exercise Table */}
            <div style={{ display: 'grid', gap: 12 }}>
              {currentSessionProtocol.exercises.map((item, idx) => (
                <div
                  key={item.exercise.id}
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        background: 'rgba(212,160,23,0.15)',
                        color: 'var(--gold-lt)',
                        border: '1px solid rgba(212,160,23,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-telemetry, monospace)',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <strong style={{ color: '#FFFFFF', fontSize: 14 }}>{item.exercise.name}</strong>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        Target: {item.exercise.targetMuscles.slice(0, 3).join(', ')} · Plane: {item.exercise.plane}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Sets/Reps: </span>
                      <strong style={{ color: '#FFFFFF' }}>{item.sets} · {item.reps}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tempo: </span>
                      <strong style={{ color: 'var(--gold-lt)' }}>{item.tempo}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
