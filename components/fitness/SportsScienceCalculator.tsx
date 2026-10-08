'use client'

import React, { useState } from 'react'
import {
  calculateOneRepMax,
  calculateTargetTrainingLoad,
  evaluateWaistToHipRatio,
  calculateJacksonPollock3BodyFat,
  calculateRockportVO2Max,
  evaluateYmcaStepTest,
  calculate1Point5MileRunVO2Max,
} from '@/lib/sports-science-knowledge'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'

export default function SportsScienceCalculator() {
  const [activeTab, setActiveTab] = useState<'1rm' | 'cardio' | 'body_comp'>('1rm')

  // 1RM State
  const [weightLifted, setWeightLifted] = useState<number>(225)
  const [repsPerformed, setRepsPerformed] = useState<number>(5)

  // Cardio State
  const [cardioMode, setCardioMode] = useState<'ymca' | 'rockport' | 'run'>('ymca')
  const [cardioAge, setCardioAge] = useState<string>('35')
  const [cardioSex, setCardioSex] = useState<'male' | 'female'>('male')
  const [ymcaRecoveryHr, setYmcaRecoveryHr] = useState<string>('92')
  const [rockportWeightLbs, setRockportWeightLbs] = useState<string>('185')
  const [rockportTimeMins, setRockportTimeMins] = useState<string>('14.0')
  const [rockportPostHr, setRockportPostHr] = useState<string>('128')
  const [runTimeMins, setRunTimeMins] = useState<string>('11.5')

  // Body Comp State
  const [bodySex, setBodySex] = useState<'male' | 'female'>('male')
  const [waistInches, setWaistInches] = useState<string>('33')
  const [hipsInches, setHipsInches] = useState<string>('39')
  const [skinfoldAge, setSkinfoldAge] = useState<string>('35')
  const [site1Mm, setSite1Mm] = useState<string>('12')
  const [site2Mm, setSite2Mm] = useState<string>('16')
  const [site3Mm, setSite3Mm] = useState<string>('14')

  // Calculations
  const calculated1RM = calculateOneRepMax(weightLifted, repsPerformed)
  const ymcaResult = evaluateYmcaStepTest({ age: parseNumericInput(cardioAge, 35), sex: cardioSex, recoveryHeartRateBpm: parseNumericInput(ymcaRecoveryHr, 92) })
  const rockportResult = calculateRockportVO2Max({
    weightLbs: parseNumericInput(rockportWeightLbs, 185),
    age: parseNumericInput(cardioAge, 35),
    sex: cardioSex,
    timeInMinutes: parseNumericInput(rockportTimeMins, 14.0),
    postWalkHeartRateBpm: parseNumericInput(rockportPostHr, 128),
  })
  const runVO2Max = calculate1Point5MileRunVO2Max(parseNumericInput(runTimeMins, 11.5))
  const whrResult = evaluateWaistToHipRatio(parseNumericInput(waistInches, 33), parseNumericInput(hipsInches, 39), bodySex)
  const skinfoldResult = calculateJacksonPollock3BodyFat({
    age: parseNumericInput(skinfoldAge, 35),
    sex: bodySex,
    site1Mm: parseNumericInput(site1Mm, 12),
    site2Mm: parseNumericInput(site2Mm, 16),
    site3Mm: parseNumericInput(site3Mm, 14),
  })

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
      {/* ── Cockpit Header ────────────────────────────────────────────── */}
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
            Forge Athletic · Sports Science Knowledge Matrix
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 22,
              letterSpacing: '0.04em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            Clinical Assessment & 1RM Load Prescriber
            <span
              style={{
                fontSize: 11,
                background: 'rgba(212,160,23,0.15)',
                color: 'var(--gold-lt)',
                padding: '3px 8px',
                borderRadius: 4,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              NASM VERIFIED
            </span>
          </h3>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: '1rm', label: '1RM & OPT Loads' },
            { id: 'cardio', label: 'Cardio & VO₂ Max' },
            { id: 'body_comp', label: 'Body Comp & WHR' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                background: activeTab === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab.id ? '#0A0F1D' : '#CBD5E1',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: 1RM PREDICTOR & NASM OPT LOADS ───────────────────────── */}
      {activeTab === '1rm' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          {/* Input Panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Submaximal Lift Input
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--gray)' }}>Weight Lifted:</span>
                  <strong className="tabular-nums" style={{ color: '#FFFFFF', fontFamily: 'var(--font-telemetry, monospace)' }}>{weightLifted} lbs</strong>
                </div>
                <input
                  type="range"
                  min={20}
                  max={600}
                  step={5}
                  value={weightLifted}
                  onChange={e => setWeightLifted(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--gray)' }}>Reps Completed:</span>
                  <strong className="tabular-nums" style={{ color: '#FFFFFF', fontFamily: 'var(--font-telemetry, monospace)' }}>{repsPerformed} Reps</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={repsPerformed}
                  onChange={e => setRepsPerformed(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div
                style={{
                  background: 'rgba(212,160,23,0.08)',
                  border: '1px solid rgba(212,160,23,0.5)',
                  borderRadius: 8,
                  padding: '16px',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Projected 1-Repetition Maximum
                </div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 38, fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1, margin: '6px 0 2px', letterSpacing: '-0.02em' }}>
                  {calculated1RM} LBS
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                  Derived from NASM 7th Edition Rep-Max Matrix
                </div>
              </div>
            </div>
          </div>

          {/* Prescribed OPT™ Phase Loading Table */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Prescribed OPT™ Phase Working Loads
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { phase: 'Phase 1: Stabilization', pct: 0.65, label: '50–70% 1RM', reps: '12–20 reps', tempo: '4/2/1' },
                { phase: 'Phase 2: Strength Endurance', pct: 0.75, label: '70–80% 1RM', reps: '8–12 reps', tempo: '2/0/2' },
                { phase: 'Phase 3: Hypertrophy', pct: 0.80, label: '75–85% 1RM', reps: '6–12 reps', tempo: '2/0/2' },
                { phase: 'Phase 4: Maximal Strength', pct: 0.90, label: '85–100% 1RM', reps: '1–5 reps', tempo: 'Explosive' },
                { phase: 'Phase 5: Power (Superset)', pct: 0.85, label: '85–90% Str / 30–45% Pwr', reps: '1–5 / 8–10', tempo: 'Max Velocity' },
              ].map(item => {
                const load = calculateTargetTrainingLoad(calculated1RM, item.pct)
                return (
                  <div
                    key={item.phase}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: '10px 14px',
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{item.phase}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                        {item.label} · {item.reps} ({item.tempo} tempo)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)' }}>
                        {load} LBS
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CARDIORESPIRATORY (VO2MAX & ZONES) ───────────────────── */}
      {activeTab === 'cardio' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          {/* Test Selector & Inputs */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[
                { key: 'ymca' as const, label: 'YMCA 3-Min Step' },
                { key: 'rockport' as const, label: 'Rockport 1-Mile' },
                { key: 'run' as const, label: '1.5-Mile Run' },
              ].map(mode => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setCardioMode(mode.key)}
                  style={{
                    flex: 1,
                    background: cardioMode === mode.key ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.05)',
                    color: cardioMode === mode.key ? 'var(--gold-lt)' : 'var(--gray)',
                    border: cardioMode === mode.key ? '1px solid rgba(212,160,23,0.45)' : '1px solid transparent',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--gray)' }}>Client Age</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={cardioAge}
                    onFocus={selectOnFocus}
                    onChange={e => setCardioAge(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--gray)' }}>Sex</label>
                  <select
                    value={cardioSex}
                    onChange={e => setCardioSex(e.target.value as 'male' | 'female')}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {cardioMode === 'ymca' && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--gray)' }}>60-Second Recovery Heart Rate (bpm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={ymcaRecoveryHr}
                    onFocus={selectOnFocus}
                    onChange={e => setYmcaRecoveryHr(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
              )}

              {cardioMode === 'rockport' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--gray)' }}>Body Weight (lbs)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={rockportWeightLbs}
                      onFocus={selectOnFocus}
                      onChange={e => setRockportWeightLbs(sanitizeNumericInput(e.target.value))}
                      style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--gray)' }}>1-Mile Walk Time (minutes, e.g. 14.5)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={rockportTimeMins}
                      onFocus={selectOnFocus}
                      onChange={e => setRockportTimeMins(sanitizeNumericInput(e.target.value))}
                      style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--gray)' }}>Immediate Post-Walk HR (bpm)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={rockportPostHr}
                      onFocus={selectOnFocus}
                      onChange={e => setRockportPostHr(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                      style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                    />
                  </div>
                </>
              )}

              {cardioMode === 'run' && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--gray)' }}>1.5-Mile Run Time (minutes, e.g. 11.5)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={runTimeMins}
                    onFocus={selectOnFocus}
                    onChange={e => setRunTimeMins(sanitizeNumericInput(e.target.value))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Cardiorespiratory Diagnostics & Target Zones
            </div>

            {cardioMode === 'ymca' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>YMCA Fitness Rating</div>
                  <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, letterSpacing: '0.04em', color: '#10B981', marginTop: 4 }}>{ymcaResult.rating}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-lt)', marginTop: 4 }}>NASM 3-Zone Heart Rate Prescription:</div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
                  <strong>Zone 1: </strong> {ymcaResult.targetHeartRateZone1}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
                  <strong>Zone 2: </strong> {ymcaResult.targetHeartRateZone2}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
                  <strong>Zone 3: </strong> {ymcaResult.targetHeartRateZone3}
                </div>
              </div>
            )}

            {cardioMode === 'rockport' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated VO₂ Max</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 32, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '-0.02em', marginTop: 4 }}>
                    {rockportResult.vo2MaxMlKgMin} mL/kg/min
                  </div>
                  <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Rating: {rockportResult.cardioRating}</div>
                </div>
              </div>
            )}

            {cardioMode === 'run' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Calculated VO₂ Max (1.5-Mile)</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 32, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '-0.02em', marginTop: 4 }}>
                    {runVO2Max} mL/kg/min
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: BODY COMPOSITION & WHR ──────────────────────────────── */}
      {activeTab === 'body_comp' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          {/* Waist-to-Hip Panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Waist-to-Hip Ratio (Cardiometabolic Risk)
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)' }}>Biological Sex</label>
                <select
                  value={bodySex}
                  onChange={e => setBodySex(e.target.value as 'male' | 'female')}
                  style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                >
                  <option value="male">Male (Threshold &gt; 0.95)</option>
                  <option value="female">Female (Threshold &gt; 0.80)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--gray)' }}>Waist Circumference (in)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={waistInches}
                    onFocus={selectOnFocus}
                    onChange={e => setWaistInches(sanitizeNumericInput(e.target.value))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--gray)' }}>Hips Circumference (in)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={hipsInches}
                    onFocus={selectOnFocus}
                    onChange={e => setHipsInches(sanitizeNumericInput(e.target.value))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Waist-to-Hip Ratio</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 26, fontWeight: 700, color: whrResult.riskCategory === 'Low Risk' ? '#10B981' : '#DC2626', marginTop: 4 }}>
                  {whrResult.ratio} <span style={{ fontSize: 14, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600, letterSpacing: '0.04em' }}>({whrResult.riskCategory})</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>{whrResult.clinicalStandard}</div>
              </div>
            </div>
          </div>

          {/* Jackson-Pollock 3-Site Skinfold Panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Jackson-Pollock 3-Site Skinfold Body Fat
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)' }}>Athlete Age (years)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={skinfoldAge}
                  onFocus={selectOnFocus}
                  onChange={e => setSkinfoldAge(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                  style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--gray)' }}>{bodySex === 'male' ? 'Chest (mm)' : 'Triceps (mm)'}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={site1Mm}
                    onFocus={selectOnFocus}
                    onChange={e => setSite1Mm(sanitizeNumericInput(e.target.value))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--gray)' }}>{bodySex === 'male' ? 'Abdomen (mm)' : 'Suprailiac (mm)'}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={site2Mm}
                    onFocus={selectOnFocus}
                    onChange={e => setSite2Mm(sanitizeNumericInput(e.target.value))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--gray)' }}>Thigh (mm)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={site3Mm}
                    onFocus={selectOnFocus}
                    onChange={e => setSite3Mm(sanitizeNumericInput(e.target.value))}
                    style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Calculated Body Fat (Siri Formula)</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 28, fontWeight: 700, color: 'var(--gold-lt)', marginTop: 4 }}>
                  {skinfoldResult.bodyFatPercent}% Body Fat
                </div>
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Classification: {skinfoldResult.classification}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
