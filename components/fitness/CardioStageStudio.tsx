'use client'

import React, { useState, useMemo } from 'react'
import {
  calculateCardioZones,
  generateStageWorkout,
  calculateRockportVo2Max,
  evaluateYmcaStepTest,
  StageConditioningWorkout,
} from '@/lib/nasm-cardio-stage-engine'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'

interface CardioStageStudioProps {
  initialAge?: number
  initialRestingHr?: number
  sex?: 'male' | 'female' | 'other'
  weightLbs?: number
  onLaunchWorkout?: (workout: StageConditioningWorkout) => void
}

export default function CardioStageStudio({
  initialAge = 35,
  initialRestingHr = 65,
  sex = 'male',
  weightLbs = 185,
  onLaunchWorkout,
}: CardioStageStudioProps) {
  const [age, setAge] = useState<number>(initialAge)
  const [restingHr, setRestingHr] = useState<number>(initialRestingHr)
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1)
  const [isStagePrescriptionCollapsed, setIsStagePrescriptionCollapsed] = useState<boolean>(false)
  const [testTab, setTestTab] = useState<'zones' | 'stages' | 'rockport' | 'ymca'>('stages')

  // Rockport form state
  const [rockportTime, setRockportTime] = useState<string>('14.5')
  const [rockportHr, setRockportHr] = useState<string>('138')
  const [rockportResult, setRockportResult] = useState<ReturnType<typeof calculateRockportVo2Max> | null>(null)

  // YMCA form state
  const [ymcaHr, setYmcaHr] = useState<string>('92')
  const [ymcaResult, setYmcaResult] = useState<ReturnType<typeof evaluateYmcaStepTest> | null>(null)

  const zones = useMemo(() => calculateCardioZones(age, restingHr), [age, restingHr])
  const stageWorkout = useMemo(() => generateStageWorkout(activeStage, age, restingHr), [activeStage, age, restingHr])

  const handleCalculateRockport = (e: React.FormEvent) => {
    e.preventDefault()
    const res = calculateRockportVo2Max({
      weightLbs,
      age,
      sex,
      timeMinutes: parseNumericInput(rockportTime, 15),
      endHeartRateBpm: parseNumericInput(rockportHr, 140),
    })
    setRockportResult(res)
  }

  const handleCalculateYmca = (e: React.FormEvent) => {
    e.preventDefault()
    const res = evaluateYmcaStepTest(parseNumericInput(ymcaHr, 95), age, sex)
    setYmcaResult(res)
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #0A0E1A 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: 'clamp(10px, 2.5vw, 20px)',
        color: '#FFFFFF',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* ── Studio Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 14,
          marginBottom: 16,
          maxWidth: '100%',
        }}
      >
        <div style={{ maxWidth: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#0A0E18',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              NASM OPT™ Cardio Standards
            </span>
            <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 600 }}>
              Bioenergetics & Threshold Conditioning
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 'clamp(18px, 4vw, 22px)',
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: '#FFFFFF',
              lineHeight: 1.15,
              wordBreak: 'break-word',
            }}
          >
            CARDIORESPIRATORY STAGE TRAINING STUDIO
          </h3>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            maxWidth: '100%',
          }}
        >
          {[
            { id: 'stages', label: '3-Stage Protocols' },
            { id: 'zones', label: '5-Zone Target Matrix' },
            { id: 'rockport', label: 'Rockport 1-Mile Test' },
            { id: 'ymca', label: 'YMCA 3-Min Step Test' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTestTab(t.id as typeof testTab)}
              style={{
                background: testTab === t.id ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                color: testTab === t.id ? '#0A0E18' : 'var(--gray)',
                border: testTab === t.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ATHLETE BIOMETRICS BAR ──────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: 12,
          alignItems: 'center',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
            <span>Athlete Age:</span>
            <strong style={{ color: 'var(--gold-lt)' }}>{age} yrs</strong>
          </div>
          <input
            type="range"
            min={18}
            max={80}
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--gold)', marginTop: 4 }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
            <span>Resting HR:</span>
            <strong style={{ color: 'var(--gold-lt)' }}>{restingHr} BPM</strong>
          </div>
          <input
            type="range"
            min={40}
            max={100}
            value={restingHr}
            onChange={e => setRestingHr(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--gold)', marginTop: 4 }}
          />
        </div>

        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tanaka HRmax</div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: 'var(--gold)', lineHeight: 1.1, marginTop: 2 }}>
            {zones.hrMaxBpm} <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>BPM</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>HR Reserve</div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: '#34D399', lineHeight: 1.1, marginTop: 2 }}>
            {zones.hrReserveBpm} <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>BPM</span>
          </div>
        </div>
      </div>

      {/* ── TAB 1: 3-STAGE CONDITIONING WORKOUT BUILDER ───────────────── */}
      {testTab === 'stages' && (
        <div>
          {/* Stage Selector Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 8, marginBottom: 14 }}>
            {[
              { num: 1, title: 'Stage 1: Aerobic Base', sub: 'Phase 1 OPT (Zone 1 Steady)', color: '#10B981' },
              { num: 2, title: 'Stage 2: VT1 Intervals', sub: 'Phase 2-3 OPT (1:3 Ratio)', color: '#F59E0B' },
              { num: 3, title: 'Stage 3: VT2 Peak HIIT', sub: 'Phase 4-5 OPT (Max Power)', color: '#EF4444' },
            ].map(s => (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStage(s.num as 1 | 2 | 3)}
                style={{
                  background: activeStage === s.num ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.02)',
                  border: activeStage === s.num ? `2px solid ${s.color}` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ fontSize: 11, color: s.color, fontWeight: 800, textTransform: 'uppercase' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{s.sub}</div>
              </button>
            ))}
          </div>

          {/* Active Stage Prescription Card */}
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 10,
              padding: 'clamp(12px, 3vw, 18px)',
              display: 'grid',
              gap: 14,
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 'clamp(18px, 4vw, 22px)', letterSpacing: '0.03em', margin: 0, color: 'var(--gold-lt)', lineHeight: 1.15 }}>
                  {stageWorkout.title}
                </h4>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{stageWorkout.subtitle}</div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 4, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GaaIcon name="watch" size={11} tone="inherit" />
                  <span>{stageWorkout.durationMins} Mins</span>
                </span>
                <span style={{ fontSize: 11, background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.4)', padding: '4px 8px', borderRadius: 4, color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GaaIcon name="flame" size={11} tone="gold" />
                  <span>{stageWorkout.targetRpe}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsStagePrescriptionCollapsed(prev => !prev)}
                  className="tactile-btn"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: 'var(--gold-lt)',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {isStagePrescriptionCollapsed ? '▼ Expand' : '▲ Collapse'}
                </button>
              </div>
            </div>

            {!isStagePrescriptionCollapsed && (
              <>
                {/* Interval Sequence Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10.5, color: '#10B981', textTransform: 'uppercase', fontWeight: 800 }}>
                      1. Warm-Up (&lt; 75% HRR)
                    </div>
                    <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 4, lineHeight: 1.4 }}>{stageWorkout.warmup}</div>
                  </div>

                  <div style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                      2. Main Conditioning ({stageWorkout.workRestRatio})
                    </div>
                    <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 4, lineHeight: 1.4 }}>{stageWorkout.mainConditioning}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10.5, color: '#60A5FA', textTransform: 'uppercase', fontWeight: 800 }}>
                      3. Cool-Down & Regeneration
                    </div>
                    <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 4, lineHeight: 1.4 }}>{stageWorkout.cooldown}</div>
                  </div>
                </div>

                {/* Coaching Cues */}
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: 'var(--gray)' }}>
                  <strong style={{ color: 'var(--gold-lt)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <GaaIcon name="sparkles" size={12} tone="gold" />
                    <span>NASM Master Trainer Coaching Cues:</span>
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {stageWorkout.coachingCues.map((cue, idx) => (
                      <li key={idx} style={{ marginBottom: 3 }}>{cue}</li>
                    ))}
                  </ul>
                </div>

                {onLaunchWorkout && (
                  <button
                    type="button"
                    onClick={() => onLaunchWorkout(stageWorkout)}
                    className="tactile-btn"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                      color: '#0A0E18',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(212,160,23,0.3)',
                      alignSelf: 'start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="rocket" size={14} tone="dark" />
                    <span>Load into Cardio Log Draft</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: 3-ZONE TARGET DIAL ─────────────────────────────────── */}
      {testTab === 'zones' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { zone: zones.zone1, color: '#10B981', border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.06)' },
            { zone: zones.zone2, color: '#F59E0B', border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.06)' },
            { zone: zones.zone3, color: '#EF4444', border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.06)' },
          ].map(({ zone, color, border, bg }) => (
            <div
              key={zone.code}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                gap: 12,
                alignItems: 'center',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color, fontWeight: 800, textTransform: 'uppercase' }}>
                  {zone.name}
                </div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '2px 0' }}>
                  {zone.minBpm} - {zone.maxBpm} <span style={{ fontSize: 12, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>BPM</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray)' }}>{zone.pctRange} · {zone.intensity}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <GaaIcon name="speech" size={12} tone="gold" />
                  <span>Talk Test Marker:</span>
                </div>
                <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2, lineHeight: 1.4 }}>{zone.talkTest}</div>
                <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>
                  <strong>Target OPT Phase:</strong> {zone.optPhase}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 6, fontSize: 11, color: 'var(--gray)' }}>
                <div style={{ color: 'var(--gold-lt)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <GaaIcon name="microscope" size={12} tone="gold" />
                  <span>Bioenergetic Pathway:</span>
                </div>
                <div style={{ marginTop: 2 }}>{zone.bioenergeticFocus}</div>
                <div style={{ marginTop: 4, color: '#FFFFFF' }}>Perceived Exertion: <strong>{zone.rpeScale}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: ROCKPORT 1-MILE WALK TEST ─────────────────────────── */}
      {testTab === 'rockport' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
          <form onSubmit={handleCalculateRockport} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '14px 16px', maxWidth: '100%', boxSizing: 'border-box' }}>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.03em', margin: '0 0 12px', color: 'var(--gold-lt)' }}>
              Rockport 1-Mile Walk Screening
            </h4>
            <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.45, margin: '0 0 14px' }}>
              Walk 1 mile as fast as possible without jogging. Record total elapsed time and heart rate immediately upon finishing (10-second carotid pulse × 6).
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                  Time to Complete (Minutes)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={rockportTime}
                  onChange={e => setRockportTime(sanitizeNumericInput(e.target.value))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '8px 10px', borderRadius: 4, boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                  Finish Heart Rate (BPM)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={rockportHr}
                  onChange={e => setRockportHr(sanitizeNumericInput(e.target.value))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '8px 10px', borderRadius: 4, boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 6,
                }}
              >
                Calculate VO2 Max
              </button>
            </div>
          </form>

          {rockportResult && (
            <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                Clinical Cardiorespiratory Capacity
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 34, fontWeight: 700, color: 'var(--gold)', margin: '4px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {rockportResult.vo2Max} <span style={{ fontSize: 15, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>mL/kg/min</span>
              </div>
              <div style={{ fontSize: 14, color: '#34D399', fontWeight: 700 }}>
                Rating: {rockportResult.fitnessCategory}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 8, lineHeight: 1.45 }}>
                {rockportResult.description}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: YMCA 3-MINUTE STEP TEST ───────────────────────────── */}
      {testTab === 'ymca' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
          <form onSubmit={handleCalculateYmca} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '14px 16px', maxWidth: '100%', boxSizing: 'border-box' }}>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.03em', margin: '0 0 12px', color: 'var(--gold-lt)' }}>
              YMCA 3-Minute Step Test
            </h4>
            <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.45, margin: '0 0 14px' }}>
              Step on and off a 12-inch bench for 3 minutes at 96 BPM (24 steps/min). Sit down immediately and count pulse for 60 continuous seconds.
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                  1-Minute Recovery Heart Rate (BPM)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={ymcaHr}
                  onChange={e => setYmcaHr(sanitizeNumericInput(e.target.value))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '8px 10px', borderRadius: 4, boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 6,
                }}
              >
                Evaluate Recovery Rating
              </button>
            </div>
          </form>

          {ymcaResult && (
            <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                Autonomic Recovery Pulse Rating
              </div>
              <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 24, letterSpacing: '0.04em', color: 'var(--gold)', margin: '4px 0', lineHeight: 1.1 }}>
                {ymcaResult.fitnessRating}
              </div>
              <div style={{ fontSize: 13, color: '#60A5FA', fontWeight: 700 }}>
                Recommended Starting Protocol: Stage {ymcaResult.suggestedStartingStage}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 8, lineHeight: 1.45 }}>
                {ymcaResult.rationale}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
