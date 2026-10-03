'use client'

import React, { useState, useMemo } from 'react'
import {
  evaluateDaviesTest,
  evaluateSharkSkillTest,
  evaluateProShuttle,
  evaluatePushUpEndurance,
  calculateCompositeAthleticProfile,
  DaviesTestResult,
  SharkSkillResult,
  ProShuttleResult,
  PushUpEnduranceResult,
} from '@/lib/nasm-performance-testing'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'

interface AthleticPerformanceStudioProps {
  initialSex?: 'male' | 'female' | 'other'
  initialAge?: number
}

export default function AthleticPerformanceStudio({
  initialSex = 'male',
  initialAge = 30,
}: AthleticPerformanceStudioProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'davies' | 'shark' | 'shuttle' | 'pushups'>('overview')
  const [sex, setSex] = useState<'male' | 'female' | 'other'>(initialSex)
  const age = initialAge

  // 1. Davies Test Form State
  const [d1, setD1] = useState<string>('34')
  const [d2, setD2] = useState<string>('36')
  const [d3, setD3] = useState<string>('35')

  // 2. Shark Skill Form State
  const [sharkRTime, setSharkRTime] = useState<string>('9.2')
  const [sharkRPen, setSharkRPen] = useState<string>('0')
  const [sharkLTime, setSharkLTime] = useState<string>('9.8')
  const [sharkLPen, setSharkLPen] = useState<string>('1')

  // 3. Pro Shuttle Form State
  const [shuttleTime, setShuttleTime] = useState<string>('4.45')

  // 4. Push-Up Endurance Form State
  const [pushupReps, setPushupReps] = useState<string>('38')

  // Calculated Results
  const daviesResult: DaviesTestResult = useMemo(() => {
    return evaluateDaviesTest(parseNumericInput(d1, 0), parseNumericInput(d2, 0), parseNumericInput(d3, 0), sex)
  }, [d1, d2, d3, sex])

  const sharkResult: SharkSkillResult = useMemo(() => {
    return evaluateSharkSkillTest(
      parseNumericInput(sharkRTime, 10),
      parseNumericInput(sharkRPen, 0),
      parseNumericInput(sharkLTime, 10),
      parseNumericInput(sharkLPen, 0)
    )
  }, [sharkRTime, sharkRPen, sharkLTime, sharkLPen])

  const shuttleResult: ProShuttleResult = useMemo(() => {
    return evaluateProShuttle(parseNumericInput(shuttleTime, 5.0), sex)
  }, [shuttleTime, sex])

  const pushupResult: PushUpEnduranceResult = useMemo(() => {
    return evaluatePushUpEndurance(parseNumericInput(pushupReps, 0), sex, age)
  }, [pushupReps, sex, age])

  const compositeProfile = useMemo(() => {
    return calculateCompositeAthleticProfile(daviesResult, sharkResult, shuttleResult, pushupResult)
  }, [daviesResult, sharkResult, shuttleResult, pushupResult])

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0D1424 0%, #070B14 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: 'clamp(14px, 3.5vw, 24px)',
        color: '#FFFFFF',
        boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
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
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              NASM OPT™ SAQ Standards
            </span>
            <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 600 }}>
              Speed, Agility & Quickness (SAQ)
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 22,
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: '#FFFFFF',
            }}
          >
            ATHLETIC AGILITY & NEUROMUSCULAR PERFORMANCE LAB
          </h3>
        </div>

        {/* Tab Navigation */}
        <div className="responsive-tabs-scroll" style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'overview', label: 'Athletic Composite', icon: 'bar-chart' as const },
            { id: 'davies', label: 'Davies 36" Agility', icon: 'hand' as const },
            { id: 'shark', label: 'Shark Skill 9-Box', icon: 'target' as const },
            { id: 'shuttle', label: '5-10-5 Pro Shuttle', icon: 'lightning' as const },
            { id: 'pushups', label: 'Muscular Endurance', icon: 'muscle' as const },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'overview' | 'davies' | 'shark' | 'shuttle' | 'pushups')}
              style={{
                background: activeTab === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#0A0E18' : 'var(--gray)',
                border: activeTab === tab.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <GaaIcon name={tab.icon} size={12} tone={activeTab === tab.id ? 'dark' : 'gold'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Athlete Profile Bar ───────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--gray)' }}>
            Sex: <strong style={{ color: '#FFF' }}>{sex.toUpperCase()}</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray)' }}>
            Age: <strong style={{ color: '#FFF' }}>{age} YRS</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>Normative Table Calibration:</span>
          <span style={{ fontSize: 11, background: 'rgba(212,160,23,0.15)', color: 'var(--gold-lt)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
            NASM Table 13.1 - 13.4 Active
          </span>
        </div>
      </div>

      {/* ── TAB 1: ATHLETIC COMPOSITE OVERVIEW ────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Hero Composite Rating Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(13,20,36,0.95) 100%)',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: 10,
              padding: 'clamp(14px, 3.5vw, 24px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                Neuromuscular Athleticism Index
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 48, fontWeight: 700, color: 'var(--gold)', lineHeight: 1, margin: '6px 0' }}>
                {compositeProfile.overallAthleticismScore} <span style={{ fontSize: 22, color: 'var(--gray)' }}>/ 100</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#34D399' }}>
                {compositeProfile.tier}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                Recommended OPT Focus: <strong style={{ color: '#FFF' }}>{compositeProfile.recommendedOptPhase}</strong>
              </div>
            </div>

            {/* 4 Pillars Mini-Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Upper Agility (Davies)</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: 'var(--gold-lt)' }}>
                  {compositeProfile.upperAgilityScore}% · <span style={{ fontSize: 12, color: '#FFF' }}>{daviesResult.fitnessRating}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Lower Control (Shark)</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#60A5FA' }}>
                  {compositeProfile.lowerAgilityScore}% · <span style={{ fontSize: 12, color: '#FFF' }}>{sharkResult.asymmetryPercent}% Asym</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Deceleration (5-10-5)</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#34D399' }}>
                  {compositeProfile.decelerationSpeedScore}% · <span style={{ fontSize: 12, color: '#FFF' }}>{shuttleResult.timeSeconds}s</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Endurance (Push-Ups)</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>
                  {compositeProfile.muscularEnduranceScore}% · <span style={{ fontSize: 12, color: '#FFF' }}>{pushupResult.reps} reps</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Insights */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="sparkles" size={13} tone="gold" />
              <span>Clinical SAQ &amp; Neuromuscular Recommendations</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#E2E8F0', fontSize: 13, lineHeight: 1.6 }}>
              {compositeProfile.actionableInsights.map((insight, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── TAB 2: DAVIES TEST ───────────────────────────────────────── */}
      {activeTab === 'davies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 18 }}>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.04em', margin: '0 0 8px', color: 'var(--gold-lt)' }}>
              Davies Upper-Body Agility Assessment
            </h4>
            <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.45, margin: '0 0 16px' }}>
              Place two lines of tape 36 inches apart. In a push-up plank, touch alternating tape lines with alternating hands for 15 seconds. Perform 3 trials.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 80px), 1fr))', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>Trial 1 (15s)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={d1}
                  onFocus={selectOnFocus}
                  onChange={e => setD1(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '8px 10px', borderRadius: 4 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>Trial 2 (15s)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={d2}
                  onFocus={selectOnFocus}
                  onChange={e => setD2(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '8px 10px', borderRadius: 4 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>Trial 3 (15s)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={d3}
                  onFocus={selectOnFocus}
                  onChange={e => setD3(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '8px 10px', borderRadius: 4 }}
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
              Average Touch Output
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 44, fontWeight: 700, color: 'var(--gold)', lineHeight: 1, margin: '6px 0' }}>
              {daviesResult.averageTouches} <span style={{ fontSize: 18, color: 'var(--gray)' }}>touches / 15s</span>
            </div>
            <div style={{ fontSize: 16, color: '#34D399', fontWeight: 800 }}>
              Rating: {daviesResult.fitnessRating} ({daviesResult.score} / 100)
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 10, lineHeight: 1.45 }}>
              {daviesResult.recommendations.join(' ')}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SHARK SKILL TEST ──────────────────────────────────── */}
      {activeTab === 'shark' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 18 }}>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.04em', margin: '0 0 8px', color: 'var(--gold-lt)' }}>
              Shark Skill 9-Box Grid Agility Test
            </h4>
            <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.45, margin: '0 0 16px' }}>
              Hop sequentially into 9 numbered 12-inch boxes on a single leg. A +0.10s penalty is applied for each fault (hands off hips, line touch, wrong box).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {/* Right Leg */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: '#60A5FA', fontWeight: 700, marginBottom: 6 }}>Right Leg</div>
                <label style={{ fontSize: 10, color: 'var(--gray)', display: 'block' }}>Time (sec)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={sharkRTime}
                  onFocus={selectOnFocus}
                  onChange={e => setSharkRTime(sanitizeNumericInput(e.target.value))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '6px 8px', borderRadius: 4, marginBottom: 6 }}
                />
                <label style={{ fontSize: 10, color: 'var(--gray)', display: 'block' }}>Penalties (+0.10s)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={sharkRPen}
                  onFocus={selectOnFocus}
                  onChange={e => setSharkRPen(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '6px 8px', borderRadius: 4 }}
                />
              </div>

              {/* Left Leg */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, marginBottom: 6 }}>Left Leg</div>
                <label style={{ fontSize: 10, color: 'var(--gray)', display: 'block' }}>Time (sec)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={sharkLTime}
                  onFocus={selectOnFocus}
                  onChange={e => setSharkLTime(sanitizeNumericInput(e.target.value))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '6px 8px', borderRadius: 4, marginBottom: 6 }}
                />
                <label style={{ fontSize: 10, color: 'var(--gray)', display: 'block' }}>Penalties (+0.10s)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={sharkLPen}
                  onFocus={selectOnFocus}
                  onChange={e => setSharkLPen(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '6px 8px', borderRadius: 4 }}
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
              Bilateral Neuromuscular Asymmetry
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 44, fontWeight: 700, color: sharkResult.asymmetryPercent > 12 ? '#EF4444' : '#34D399', lineHeight: 1, margin: '6px 0' }}>
              {sharkResult.asymmetryPercent}% <span style={{ fontSize: 18, color: 'var(--gray)' }}>{sharkResult.dominantLeg === 'symmetrical' ? 'Balanced' : `${sharkResult.dominantLeg.toUpperCase()} Dominant`}</span>
            </div>
            <div style={{ fontSize: 13, color: '#E2E8F0', marginTop: 4 }}>
              Right: <strong>{sharkResult.rightLegAdjustedSeconds}s</strong> ({sharkResult.rightLegRating}) · Left: <strong>{sharkResult.leftLegAdjustedSeconds}s</strong> ({sharkResult.leftLegRating})
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 10, lineHeight: 1.45 }}>
              {sharkResult.coachingCues.join(' ')}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: 5-10-5 PRO SHUTTLE ───────────────────────────────── */}
      {activeTab === 'shuttle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 18 }}>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.04em', margin: '0 0 8px', color: 'var(--gold-lt)' }}>
              5-10-5 Pro Shuttle Agility Test
            </h4>
            <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.45, margin: '0 0 16px' }}>
              Sprint 5 yards to right (touch line), 10 yards to left (touch line), and 5 yards through the center cone. Measures lateral plant, deceleration, and hip re-acceleration.
            </p>

            <div>
              <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                Recorded Time (Seconds)
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={shuttleTime}
                onFocus={selectOnFocus}
                onChange={e => setShuttleTime(sanitizeNumericInput(e.target.value))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '10px', borderRadius: 4 }}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
              Deceleration & COD Velocity
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 44, fontWeight: 700, color: 'var(--gold)', lineHeight: 1, margin: '6px 0' }}>
              {shuttleResult.timeSeconds}s
            </div>
            <div style={{ fontSize: 16, color: '#34D399', fontWeight: 800 }}>
              Rating: {shuttleResult.rating} ({shuttleResult.score} / 100)
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 10, lineHeight: 1.45 }}>
              {shuttleResult.decelerationEfficiency}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PUSH-UP ENDURANCE ─────────────────────────────────── */}
      {activeTab === 'pushups' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 18 }}>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.04em', margin: '0 0 8px', color: 'var(--gold-lt)' }}>
              1-Minute Push-Up Endurance Test
            </h4>
            <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.45, margin: '0 0 16px' }}>
              Continuous maximal push-ups in 60 seconds with strict kinetic chain alignment (no sagging or hiking at hips).
            </p>

            <div>
              <label style={{ fontSize: 11, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                Total Reps Completed
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={pushupReps}
                onFocus={selectOnFocus}
                onChange={e => setPushupReps(sanitizeNumericInput(e.target.value, { allowDecimals: false }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '10px', borderRadius: 4 }}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
              Muscular Endurance Capacity
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 44, fontWeight: 700, color: 'var(--gold)', lineHeight: 1, margin: '6px 0' }}>
              {pushupResult.reps} <span style={{ fontSize: 18, color: 'var(--gray)' }}>reps</span>
            </div>
            <div style={{ fontSize: 16, color: '#34D399', fontWeight: 800 }}>
              Rating: {pushupResult.rating} ({pushupResult.score} / 100)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
