'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  calculateReadinessScore,
  generateDeloadMicrocycle,
  ReadinessEvaluation,
  DeloadMicrocycleProtocol,
} from '@/lib/readiness-telemetry'
import { calculateAcwrFromWorkoutLogs } from '@/lib/coach-triage'
import { DailyBiometricSummary } from '@/lib/wearables-telemetry'

interface ReadinessRecoveryTrackerProps {
  initialSex?: 'male' | 'female'
  initialAge?: number
  initialConditioning?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  clientGoal?: string
  intake?: {
    parq_answers?: unknown
    medications?: string | null
    medical_conditions?: string | null
    allergies?: string | null
  } | null
  profile?: {
    age?: number
    sex?: 'male' | 'female' | 'other'
    experience_level?: string | null
    activity_level?: string | null
    fitness_goal?: string | null
  } | null
  initialTab?: 'heatmap' | 'gate' | 'acwr' | 'deload' | '3d'
  workoutLogs?: Array<{ id?: string; session_date: string; session_title?: string; exertion_rpe?: number; created_at?: string }>
  workoutSetLogs?: Array<{ id?: string; session_date: string; exercise_name: string; set_number?: number; reps?: number; rpe?: number; tempo?: string; created_at?: string }>
  workoutPlans?: Array<{ id?: string; plan_json?: { workouts?: Array<{ focus: string; exercises: Array<{ name: string; sets: string; reps: string; tempo?: string | null }> }> }; created_at?: string }>
  telemetry?: DailyBiometricSummary | null
}

export default function ReadinessRecoveryTracker({
  initialSex: _initialSex = 'male',
  initialAge: _initialAge = 38,
  initialConditioning: _initialConditioning,
  clientGoal: _clientGoal,
  intake: _intake,
  profile: _profile,
  initialTab = 'gate',
  workoutLogs = [],
  workoutSetLogs = [],
  workoutPlans: _workoutPlans = [],
  telemetry,
}: ReadinessRecoveryTrackerProps) {
  const normalizedInitialTab = initialTab === '3d' || initialTab === 'heatmap' ? 'gate' : initialTab
  // Biological & Wearable Inputs (calibrated strictly from telemetry or user entry, no fake numbers)
  const [sleepHours, setSleepHours] = useState<number | null>(telemetry?.sleepHours ?? null)
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [restingHeartRate, setRestingHeartRate] = useState<number | null>(telemetry?.restingHeartRate ?? null)
  const [baselineRhr, setBaselineRhr] = useState<number>(52)
  const [sorenessLevel, setSorenessLevel] = useState<number | null>(null)
  const [stressLevel, setStressLevel] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'gate' | 'acwr' | 'deload'>(normalizedInitialTab)

  // Real ACWR Workload derived from athlete's actual logged sets
  const realAcwr = useMemo(() => {
    return calculateAcwrFromWorkoutLogs(workoutLogs, workoutSetLogs)
  }, [workoutLogs, workoutSetLogs])

  // Synchronize activeTab if initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === '3d' || initialTab === 'heatmap' ? 'gate' : initialTab)
    }
  }, [initialTab])

  // Synchronize state when telemetry prop updates
  React.useEffect(() => {
    if (telemetry) {
      if (typeof telemetry.sleepHours === 'number') setSleepHours(telemetry.sleepHours)
      if (typeof telemetry.restingHeartRate === 'number') setRestingHeartRate(telemetry.restingHeartRate)
    }
  }, [telemetry])

  // Compute Master Readiness Evaluation using real biological and workload data
  const evaluation: ReadinessEvaluation = useMemo(() => {
    const dailySlice = realAcwr.hasData && realAcwr.acuteWorkloadUnits > 0 ? realAcwr.acuteWorkloadUnits / 7 : 0
    return calculateReadinessScore({
      sleepHours,
      sleepQuality,
      restingHeartRate,
      baselineRhr,
      sorenessLevel,
      stressLevel,
      recentWorkloadUnits: realAcwr.hasData
        ? [
            dailySlice,
            dailySlice,
            dailySlice,
            dailySlice,
            dailySlice,
            dailySlice,
            dailySlice,
          ]
        : null,
      chronicAvgWeeklyWorkload: realAcwr.hasData ? realAcwr.chronicWorkloadUnits : null,
    })
  }, [sleepHours, sleepQuality, restingHeartRate, baselineRhr, sorenessLevel, stressLevel, realAcwr])

  const deloadPlan: DeloadMicrocycleProtocol = useMemo(() => {
    return evaluation.deloadPlan ?? generateDeloadMicrocycle()
  }, [evaluation.deloadPlan])

  const providerName = telemetry?.provider === 'google_fit' ? 'Google Health Connect' : 'Apple Health'

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* ── Studio Header ────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 'clamp(14px, 3vw, 24px) clamp(10px, 2.5vw, 24px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                  borderRadius: 4,
                }}
              >
                Recovery check
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>
                Wearable data and your own check-in
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '8px 0 0',
                color: 'var(--white)',
              }}
            >
              Recovery &amp; readiness
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                padding: '7px 12px',
                background: telemetry?.updatedAt ? 'rgba(16,185,129,0.12)' : 'rgba(212,160,23,0.12)',
                border: telemetry?.updatedAt ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(212,160,23,0.4)',
                borderRadius: 4,
                color: telemetry?.updatedAt ? '#34D399' : 'var(--gold-lt)',
                fontSize: 11.5,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name={telemetry?.updatedAt ? 'check' : 'activity'} size={13} tone={telemetry?.updatedAt ? 'emerald' : 'gold'} />
              <span>{telemetry?.updatedAt ? `Auto-Synced (${providerName})` : `Awaiting Telemetry (${providerName})`}</span>
            </div>

            <a
              href="/dashboard/settings?tab=wearables"
              className="tactile-btn"
              style={{
                minHeight: 44,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--white)',
                fontSize: 12,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                textDecoration: 'none',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="settings" size={13} tone="white" />
              <span>Wearable settings</span>
            </a>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          {[
            {
              id: 'gate',
              icon: 'target' as const,
              label: evaluation.gate === 'NO_DATA' ? 'Daily check-in' : `Daily check-in (${evaluation.gate})`,
            },
            {
              id: 'acwr',
              icon: 'periodization' as const,
              label: realAcwr.hasData && realAcwr.acwrRatio !== null
                ? `Workload (${realAcwr.acwrRatio.toFixed(2)})`
                : 'Workload',
            },
            { id: 'deload', icon: 'shield' as const, label: 'Recovery week' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as 'gate' | 'acwr' | 'deload')}
              style={{
                minHeight: 44,
                background: activeTab === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? 'var(--navy)' : 'var(--white)',
                border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                padding: '10px 14px',
                borderRadius: 4,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name={tab.icon} size={13} tone={activeTab === tab.id ? 'inherit' : 'gold'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Gate & Readiness Analysis */}
      {activeTab === 'gate' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Daily Gate Hero Card */}
          <div
            className="glass-card-gold"
            style={{
              padding: 'clamp(12px, 3vw, 24px)',
              borderLeft: `4px solid ${evaluation.color}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 24,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    background: evaluation.color,
                    color: '#0A0E18',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 900,
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  GATE: {evaluation.gate === 'NO_DATA' ? 'NO DATA' : evaluation.gate}
                </span>
                <span style={{ color: 'var(--gold-lt)', fontSize: 13, fontWeight: 700 }}>
                  {evaluation.score !== null ? `Readiness Score: ${evaluation.score}/100` : 'Readiness Score: No Telemetry'}
                </span>
              </div>
              <h3 style={{ margin: '10px 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 24, letterSpacing: '0.02em', color: 'var(--white)' }}>
                {evaluation.recommendation}
              </h3>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: 14, maxWidth: 640 }}>
                {evaluation.tier} · Gate: {evaluation.gate === 'NO_DATA' ? 'No Data' : evaluation.gate}
              </p>
              <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                <span style={{ color: '#CBD5E1' }}>
                  Workload Status: <strong style={{ color: evaluation.color }}>{evaluation.acwr.zone}</strong>
                </span>
                <span style={{ color: '#CBD5E1' }}>
                  ACWR: <strong style={{ color: '#FFF' }}>{evaluation.acwr.ratio !== null ? evaluation.acwr.ratio.toFixed(2) : 'No Data'}</strong>
                </span>
                <span style={{ color: '#CBD5E1' }}>
                  Resting Heart Rate Delta:{' '}
                  <strong style={{ color: '#FFF' }}>
                    {restingHeartRate !== null
                      ? (restingHeartRate - baselineRhr > 0
                          ? `+${restingHeartRate - baselineRhr} BPM`
                          : `${restingHeartRate - baselineRhr} BPM`)
                      : 'No Data'}
                  </strong>{' '}
                  {restingHeartRate !== null ? `(Basal ${restingHeartRate} BPM vs Baseline ${baselineRhr} BPM)` : '(Awaiting RHR)'}
                </span>
              </div>
            </div>

            {/* Intra-Workout Throttler Controls */}
            <details className="fitness-card-disclosure fitness-lab-panel" style={{ background: 'rgba(8,14,20,0.7)', width: '100%' }}>
              <summary>Suggested workout adjustments</summary>
              <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="lightning" size={12} tone="gold" />
                <span>Intra-Workout Throttler</span>
              </div>
              <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Volume Allowance:</span>
                  <strong style={{ color: evaluation.color }}>
                    {evaluation.hasTelemetry ? `${Math.round(evaluation.intensityMultiplier * 100)}%` : 'Baseline (100%)'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>RPE Ceiling:</span>
                  <strong style={{ color: '#FFF' }}>
                    {evaluation.hasTelemetry ? `RPE ${evaluation.rpeCap} (RIR ${Math.round((10 - evaluation.rpeCap) * 10) / 10})` : 'Standard (Uncapped)'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Rest Intervals:</span>
                  <strong style={{ color: '#FFF' }}>
                    {evaluation.restIntervalAdjustmentSec > 0 ? `+${evaluation.restIntervalAdjustmentSec}s Extended` : 'Standard Baseline'}
                  </strong>
                </div>
              </div>
            </details>
          </div>

          {/* Biological Input Sliders */}
          <details className="glass-card fitness-card-disclosure fitness-lab-panel">
            <summary>Daily check-in inputs</summary>
            <p style={{ fontSize: 12, color: 'var(--gray)' }}>Adjust these inputs to explore your readiness. Changes here are not saved to your profile or wearable data.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.04em', color: 'var(--white)' }}>
                Active Biological &amp; Autonomic Metrics
              </h4>
              <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>
                {telemetry?.updatedAt ? 'Wearable data with manual adjustments' : 'Manual check-in'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                  <label htmlFor="readiness-sleep-duration" style={{ cursor: 'pointer' }}>Sleep duration</label>
                  <strong className="tabular-nums" style={{ color: 'var(--gold-lt)' }}>{sleepHours !== null ? `${sleepHours} hrs` : '-- hrs'}</strong>
                </div>
                <input
                  id="readiness-sleep-duration"
                  className="forge-range-slider"
                  type="range"
                  min={4}
                  max={10}
                  step={0.1}
                  value={sleepHours ?? 7.5}
                  aria-valuetext={sleepHours !== null ? `${sleepHours} hours` : 'Not set (default 7.5 hours)'}
                  onChange={e => setSleepHours(Number(e.target.value))}
                  onPointerUp={e => setSleepHours(Number(e.currentTarget.value))}
                  style={{
                    width: '100%',
                    ['--attr-min' as string]: '4',
                    ['--attr-max' as string]: '10',
                    ['--control-value' as string]: String(sleepHours ?? 7.5),
                    ['--slider-fill-color' as string]: 'var(--gold, #D4A017)',
                    ['--slider-thumb-color' as string]: 'var(--gold, #D4A017)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                  <label htmlFor="readiness-sleep-quality" style={{ cursor: 'pointer' }}>Sleep quality</label>
                  <strong className="tabular-nums" style={{ color: 'var(--white)' }}>{sleepQuality !== null ? `${sleepQuality}/10` : '--/10'}</strong>
                </div>
                <input
                  id="readiness-sleep-quality"
                  className="forge-range-slider"
                  type="range"
                  min={1}
                  max={10}
                  value={sleepQuality ?? 8}
                  aria-valuetext={sleepQuality !== null ? `${sleepQuality} out of 10` : 'Not set (default 8 out of 10)'}
                  onChange={e => setSleepQuality(Number(e.target.value))}
                  onPointerUp={e => setSleepQuality(Number(e.currentTarget.value))}
                  style={{
                    width: '100%',
                    ['--attr-min' as string]: '1',
                    ['--attr-max' as string]: '10',
                    ['--control-value' as string]: String(sleepQuality ?? 8),
                    ['--slider-fill-color' as string]: 'var(--gold, #D4A017)',
                    ['--slider-thumb-color' as string]: 'var(--gold, #D4A017)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                  <label htmlFor="readiness-resting-hr" style={{ cursor: 'pointer' }}>Resting heart rate</label>
                  <strong className="tabular-nums" style={{ color: 'var(--white)' }}>{restingHeartRate !== null ? `${restingHeartRate} BPM` : '-- BPM'}</strong>
                </div>
                <input
                  id="readiness-resting-hr"
                  className="forge-range-slider"
                  type="range"
                  min={40}
                  max={90}
                  value={restingHeartRate ?? 60}
                  aria-valuetext={restingHeartRate !== null ? `${restingHeartRate} beats per minute` : 'Not set (default 60 BPM)'}
                  onChange={e => setRestingHeartRate(Number(e.target.value))}
                  onPointerUp={e => setRestingHeartRate(Number(e.currentTarget.value))}
                  style={{
                    width: '100%',
                    ['--attr-min' as string]: '40',
                    ['--attr-max' as string]: '90',
                    ['--control-value' as string]: String(restingHeartRate ?? 60),
                    ['--slider-fill-color' as string]: 'var(--gold, #D4A017)',
                    ['--slider-thumb-color' as string]: 'var(--gold, #D4A017)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                  <label htmlFor="readiness-baseline-rhr" style={{ cursor: 'pointer' }}>Baseline resting heart rate</label>
                  <strong className="tabular-nums" style={{ color: 'var(--white)' }}>{baselineRhr} BPM</strong>
                </div>
                <input
                  id="readiness-baseline-rhr"
                  className="forge-range-slider"
                  type="range"
                  min={40}
                  max={80}
                  value={baselineRhr}
                  aria-valuetext={`${baselineRhr} beats per minute`}
                  onChange={e => setBaselineRhr(Number(e.target.value))}
                  style={{
                    width: '100%',
                    ['--attr-min' as string]: '40',
                    ['--attr-max' as string]: '80',
                    ['--control-value' as string]: String(baselineRhr),
                    ['--slider-fill-color' as string]: 'var(--gold, #D4A017)',
                    ['--slider-thumb-color' as string]: 'var(--gold, #D4A017)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                  <label htmlFor="readiness-soreness-level" style={{ cursor: 'pointer' }}>Soreness level</label>
                  <strong className="tabular-nums" style={{ color: 'var(--white)' }}>{sorenessLevel !== null ? `${sorenessLevel}/10` : '--/10'}</strong>
                </div>
                <input
                  id="readiness-soreness-level"
                  className="forge-range-slider"
                  type="range"
                  min={1}
                  max={10}
                  value={sorenessLevel ?? 3}
                  aria-valuetext={sorenessLevel !== null ? `${sorenessLevel} out of 10` : 'Not set (default 3 out of 10)'}
                  onChange={e => setSorenessLevel(Number(e.target.value))}
                  onPointerUp={e => setSorenessLevel(Number(e.currentTarget.value))}
                  style={{
                    width: '100%',
                    ['--attr-min' as string]: '1',
                    ['--attr-max' as string]: '10',
                    ['--control-value' as string]: String(sorenessLevel ?? 3),
                    ['--slider-fill-color' as string]: 'var(--gold, #D4A017)',
                    ['--slider-thumb-color' as string]: 'var(--gold, #D4A017)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                  <label htmlFor="readiness-stress-level" style={{ cursor: 'pointer' }}>Stress level</label>
                  <strong className="tabular-nums" style={{ color: 'var(--white)' }}>{stressLevel !== null ? `${stressLevel}/10` : '--/10'}</strong>
                </div>
                <input
                  id="readiness-stress-level"
                  className="forge-range-slider"
                  type="range"
                  min={1}
                  max={10}
                  value={stressLevel ?? 3}
                  aria-valuetext={stressLevel !== null ? `${stressLevel} out of 10` : 'Not set (default 3 out of 10)'}
                  onChange={e => setStressLevel(Number(e.target.value))}
                  onPointerUp={e => setStressLevel(Number(e.currentTarget.value))}
                  style={{
                    width: '100%',
                    ['--attr-min' as string]: '1',
                    ['--attr-max' as string]: '10',
                    ['--control-value' as string]: String(stressLevel ?? 3),
                    ['--slider-fill-color' as string]: 'var(--gold, #D4A017)',
                    ['--slider-thumb-color' as string]: 'var(--gold, #D4A017)',
                  }}
                />
              </div>
            </div>
          </details>
        </div>
      )}

      {/* ── TAB 2: REAL ACWR WORKLOAD RATIO MONITOR ───────────────────────── */}
      {activeTab === 'acwr' && (
        <div style={{ display: 'grid', gap: 20 }}>
          <div
            className="glass-card-gold"
            style={{
              padding: '24px 28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                Live Acute-to-Chronic Workload Ratio (ACWR)
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 44, fontWeight: 700, color: (realAcwr.acwrRatio ?? 0) > 1.49 ? '#EF4444' : realAcwr.hasData ? 'var(--gold)' : 'var(--gray)', lineHeight: 1, margin: '6px 0', letterSpacing: '-0.02em' }}>
                {realAcwr.acwrRatio !== null ? realAcwr.acwrRatio.toFixed(2) : '--'}{' '}
                <span style={{ fontSize: 16, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif', letterSpacing: '0.08em', fontWeight: 600 }}>ACWR</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: (realAcwr.acwrRatio ?? 0) > 1.49 ? '#EF4444' : realAcwr.hasData ? '#34D399' : '#94A3B8' }}>
                {realAcwr.acwrZone}{realAcwr.isCalibrating ? ' (Baseline Calibrating)' : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                {realAcwr.hasData
                  ? realAcwr.isCalibrating
                    ? `Baseline calibration active: establishing chronic workload baseline across ${workoutSetLogs.length} logged working sets.`
                    : `Real-time training load from ${workoutSetLogs.length} logged working sets across the macrocycle.`
                  : 'No workout sets or sessions logged in the last 28 days. Telemetry required to establish ACWR.'}
              </div>
            </div>

            <div style={{ background: 'rgba(8,14,20,0.6)', padding: 18, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>
                Workload Architecture
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>7-Day Acute Volume:</span>
                  <strong style={{ color: '#FFFFFF' }}>{realAcwr.hasData ? `${Math.round(realAcwr.acuteWorkloadUnits).toLocaleString()} kg·reps` : 'No Data'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>{realAcwr.isCalibrating ? 'Chronic Baseline (Calibrating):' : '28-Day Chronic Baseline:'}</span>
                  <strong style={{ color: '#FFFFFF' }}>{realAcwr.hasData ? `${Math.round(realAcwr.chronicWorkloadUnits).toLocaleString()} kg·reps/wk` : 'No Data'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Injury Risk Status:</span>
                  <strong style={{ color: !realAcwr.hasData ? '#94A3B8' : realAcwr.acwrRatio! >= 1.5 ? '#EF4444' : realAcwr.acwrRatio! >= 0.8 && realAcwr.acwrRatio! <= 1.3 ? '#34D399' : 'var(--gold-lt)' }}>
                    {!realAcwr.hasData
                      ? 'No Data (Baseline Not Established)'
                      : realAcwr.isCalibrating
                        ? 'Optimal (Baseline Calibration Phase)'
                        : realAcwr.acwrRatio! >= 1.5
                        ? 'High Risk (Spike > 1.50)'
                        : realAcwr.acwrRatio! >= 0.8 && realAcwr.acwrRatio! <= 1.3
                          ? 'Optimal Sweet Spot'
                          : 'Moderate Overreaching'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: 1-WEEK DELOAD PROTOCOL ────────────────────────────── */}
      {activeTab === 'deload' && (
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="glass-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                  NASM Integrated Recovery Protocol
                </span>
                <h4 style={{ margin: '4px 0 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, letterSpacing: '0.03em', color: '#FFFFFF' }}>
                  {deloadPlan.protocolTitle}
                </h4>
              </div>
              <span style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 4, color: '#34D399', fontSize: 12, fontWeight: 700 }}>
                {deloadPlan.durationDays} Day Protocol
              </span>
            </div>

            <p style={{ color: 'var(--gray)', fontSize: 13.5, lineHeight: 1.5, margin: '0 0 16px' }}>
              {deloadPlan.rationale}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Volume Reduction</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', marginTop: 4 }}>{deloadPlan.volumeReduction}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intensity Target</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: '#34D399', marginTop: 4 }}>{deloadPlan.intensityStrategy}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CNS Restoration</div>
                <div style={{ fontFamily: 'var(--font-sans, Raleway), sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', color: '#38BDF8', marginTop: 4 }}>{deloadPlan.cnsRecoveryAction}</div>
              </div>
            </div>

            {deloadPlan.days && deloadPlan.days.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 10 }}>
                  7-Day Microcycle Schedule
                </div>
                <ol
                  role="list"
                  data-testid="deload-microcycle-schedule"
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  {deloadPlan.days.map(day => (
                    <li
                      key={day.day}
                      style={{
                        background: 'rgba(8,14,20,0.55)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        padding: '12px 14px',
                        display: 'grid',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <strong style={{ color: '#FFFFFF', fontSize: 13.5 }}>
                          Day {day.day}: {day.title}
                        </strong>
                        <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 11.5, color: '#34D399', fontWeight: 700 }}>
                          {day.volumeReductionPct > 0 ? `-${day.volumeReductionPct}% Volume · ` : ''}RPE ≤ {day.rpeCap}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#CBD5E1' }}>{day.focus}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: 'var(--gray)' }}>
                        <span>Sets: <strong style={{ color: 'var(--gold-lt)' }}>{day.targetSets}</strong></span>
                        <span>Conditioning: <strong style={{ color: '#E2E8F0' }}>{day.conditioning}</strong></span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                        Mobility: <span style={{ color: '#CBD5E1' }}>{day.mobilityFocus}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
