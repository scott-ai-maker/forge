'use client'

import React, { useState, useMemo, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  evaluateExecutiveSleepSession,
  type ExecutiveSleepRecord,
  type ExecutiveSleepAnalysis,
} from '@/lib/executive-sleep-engine'
import { DailyBiometricSummary } from '@/lib/wearables-telemetry'

interface ExecutiveSleepBiometricsHudProps {
  initialRecord?: ExecutiveSleepRecord
  telemetry?: DailyBiometricSummary | null
  onRecordSaved?: (record: ExecutiveSleepRecord) => void
}

export default function ExecutiveSleepBiometricsHud({
  initialRecord,
  telemetry,
  onRecordSaved: _onRecordSaved,
}: ExecutiveSleepBiometricsHudProps) {
  const [currentRecord, setCurrentRecord] = useState<ExecutiveSleepRecord>(() => {
    if (initialRecord) return initialRecord
    const now = new Date().toISOString().split('T')[0]
    const total = telemetry?.sleepHours ?? 7.9
    const deep = telemetry?.deepSleepHours ?? 2.2
    const rem = 2.1
    const awake = 0.4
    const light = Math.max(0, Math.round((total - deep - rem - awake) * 10) / 10)
    return {
      date: telemetry?.date ?? now,
      bedtime: telemetry?.bedtime || '22:30',
      wakeTime: telemetry?.wakeTime || '06:45',
      totalSleepDurationHours: total,
      timeInBedHours: Math.round((total + awake + 0.3) * 10) / 10,
      stages: { deep, rem, light, awake },
      nocturnalHrvRmssdMs: telemetry?.hrvRmssdMs ?? 76,
      baselineHrvRmssdMs: 72,
      nocturnalMinRhrBpm: telemetry?.restingHeartRate ? telemetry.restingHeartRate - 6 : 48,
      daytimeAvgRhrBpm: telemetry?.restingHeartRate ?? 54,
      respiratoryRateBpm: 13.8,
      skinTempDeviationCelsius: -0.1,
      sleepLatencyMinutes: 12,
      awakeningsCount: 1,
      provider: telemetry?.provider ?? 'apple_health',
    }
  })

  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (telemetry && !isEditing) {
      const now = new Date().toISOString().split('T')[0]
      const total = telemetry.sleepHours ?? 7.9
      const deep = telemetry.deepSleepHours ?? 2.2
      const rem = 2.1
      const awake = 0.4
      const light = Math.max(0, Math.round((total - deep - rem - awake) * 10) / 10)
      setCurrentRecord(prev => ({
        ...prev,
        date: telemetry.date ?? now,
        bedtime: telemetry.bedtime || prev.bedtime,
        wakeTime: telemetry.wakeTime || prev.wakeTime,
        totalSleepDurationHours: total,
        timeInBedHours: Math.round((total + awake + 0.3) * 10) / 10,
        stages: { deep, rem, light, awake },
        nocturnalHrvRmssdMs: telemetry.hrvRmssdMs ?? prev.nocturnalHrvRmssdMs,
        nocturnalMinRhrBpm: telemetry.restingHeartRate ? telemetry.restingHeartRate - 6 : prev.nocturnalMinRhrBpm,
        daytimeAvgRhrBpm: telemetry.restingHeartRate ?? prev.daytimeAvgRhrBpm,
        provider: telemetry.provider ?? 'apple_health',
      }))
    }
  }, [telemetry, isEditing])

  const analysis: ExecutiveSleepAnalysis = useMemo(() => {
    return evaluateExecutiveSleepSession(currentRecord)
  }, [currentRecord])

  const tierColors = {
    elite: { border: '#4ADE80', bg: 'rgba(74, 222, 128, 0.12)', text: '#86EFAC' },
    optimal: { border: '#D4AF37', bg: 'rgba(212, 160, 23, 0.12)', text: 'var(--gold-lt)' },
    compromised: { border: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)', text: '#FDE047' },
    critical: { border: '#F87171', bg: 'rgba(239, 68, 68, 0.12)', text: '#FCA5A5' },
  }[analysis.sleepQualityTier]

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(8, 14, 24, 0.95) 0%, rgba(13, 27, 42, 0.92) 100%)',
        border: '1px solid rgba(212, 160, 23, 0.25)',
        borderRadius: 8,
        padding: '16px 18px',
        display: 'grid',
        gap: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '3px 8px',
                background: 'rgba(197, 160, 89, 0.15)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(197, 160, 89, 0.35)',
                borderRadius: 4,
              }}
            >
              Sleep Architecture &amp; Autonomics
            </span>
            <span style={{ fontSize: 11, color: telemetry?.sleepHours ? '#34D399' : '#38BDF8', fontWeight: 700 }}>
              {telemetry?.sleepHours
                ? `● Live Ingestion Active (${currentRecord.provider ? currentRecord.provider.replace('_', ' ').toUpperCase() : 'APPLE HEALTH'})`
                : '○ Baseline Projection Mode'}
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em', margin: '4px 0 0' }}>
            EXECUTIVE SLEEP RECOVERY MATRIX
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              background: telemetry?.sleepHours ? 'rgba(16,185,129,0.12)' : 'rgba(212,160,23,0.12)',
              border: telemetry?.sleepHours ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(212,160,23,0.4)',
              borderRadius: 6,
              color: telemetry?.sleepHours ? '#34D399' : 'var(--gold-lt)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name={telemetry?.sleepHours ? 'check' : 'activity'} size={12} tone={telemetry?.sleepHours ? 'emerald' : 'gold'} />
            <span>
              {telemetry?.sleepHours
                ? `Auto-Synced via ${currentRecord.provider === 'google_fit' ? 'Google Health Connect' : 'Apple Health'}`
                : `Awaiting Ingestion (${currentRecord.provider === 'google_fit' ? 'Health Connect' : 'Apple Health'})`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(prev => !prev)}
            className="tactile-btn"
            style={{
              padding: '7px 12px',
              background: isEditing ? 'var(--gold)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: isEditing ? '#080E14' : '#FFFFFF',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name={isEditing ? 'check' : 'edit'} size={12} tone="inherit" />
            <span>{isEditing ? 'Save Adjustment' : 'Manual Adjust'}</span>
          </button>
        </div>
      </div>


      {/* ── Main Score & Stage Overview Strip ───────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          background: tierColors.bg,
          border: `1px solid ${tierColors.border}`,
          borderRadius: 8,
          padding: '12px 14px',
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sleep Recovery Score
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: tierColors.text, lineHeight: 1, margin: '2px 0' }}>
            {analysis.overallSleepScore}%
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: tierColors.text, textTransform: 'uppercase' }}>
            ● {analysis.sleepQualityTier} Tier
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Total Sleep
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: '#FFFFFF', lineHeight: 1, margin: '2px 0' }}>
            {currentRecord.totalSleepDurationHours} <span style={{ fontSize: 14, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>hrs</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#BAE6FD' }}>
            {analysis.sleepEfficiencyPercent}% Efficiency
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Deep Restorative
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: '#38BDF8', lineHeight: 1, margin: '2px 0' }}>
            {currentRecord.stages.deep} <span style={{ fontSize: 14, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>hrs</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#34D399' }}>
            {Math.round((currentRecord.stages.deep / currentRecord.totalSleepDurationHours) * 100)}% Physical Repair
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            REM Neuro-Cognitive
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: '#C084FC', lineHeight: 1, margin: '2px 0' }}>
            {currentRecord.stages.rem} <span style={{ fontSize: 14, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>hrs</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#DDD6FE' }}>
            {Math.round((currentRecord.stages.rem / currentRecord.totalSleepDurationHours) * 100)}% Cognitive
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Nocturnal HRV
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1, margin: '2px 0' }}>
            {currentRecord.nocturnalHrvRmssdMs} <span style={{ fontSize: 14, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>ms</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--gold-lt)' }}>
            Basal RHR: {currentRecord.daytimeAvgRhrBpm} BPM
          </div>
        </div>
      </div>

      {/* ── Sleep Stages Visual Progress Bar ────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>
          <span>Sleep Hypnogram Stage Breakdown:</span>
          <span>{currentRecord.timeInBedHours}h In Bed</span>
        </div>
        <div style={{ height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${(currentRecord.stages.deep / currentRecord.timeInBedHours) * 100}%`, background: '#38BDF8' }} title="Deep Sleep" />
          <div style={{ width: `${(currentRecord.stages.rem / currentRecord.timeInBedHours) * 100}%`, background: '#C084FC' }} title="REM Sleep" />
          <div style={{ width: `${(currentRecord.stages.light / currentRecord.timeInBedHours) * 100}%`, background: 'rgba(255,255,255,0.3)' }} title="Light Core Sleep" />
          <div style={{ width: `${(currentRecord.stages.awake / currentRecord.timeInBedHours) * 100}%`, background: '#EF4444' }} title="Awake / Restless" />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10.5, color: 'var(--gray)' }}>
          <span style={{ color: '#38BDF8' }}>● Deep ({currentRecord.stages.deep}h)</span>
          <span style={{ color: '#C084FC' }}>● REM ({currentRecord.stages.rem}h)</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>● Core/Light ({currentRecord.stages.light}h)</span>
          <span style={{ color: '#EF4444' }}>● Awake ({currentRecord.stages.awake}h)</span>
        </div>
      </div>

      {/* ── Manual Adjust Sliders (When Editing) ─────────────────────── */}
      {isEditing && (
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
            Manual Sleep Stage Adjustments
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
                <span>Total Duration:</span>
                <strong style={{ color: '#FFF' }}>{currentRecord.totalSleepDurationHours} hrs</strong>
              </div>
              <input
                type="range"
                min={4}
                max={11}
                step={0.1}
                value={currentRecord.totalSleepDurationHours}
                onChange={e => setCurrentRecord(prev => ({ ...prev, totalSleepDurationHours: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
                <span>Deep Sleep:</span>
                <strong style={{ color: '#38BDF8' }}>{currentRecord.stages.deep} hrs</strong>
              </div>
              <input
                type="range"
                min={0.2}
                max={3.5}
                step={0.1}
                value={currentRecord.stages.deep}
                onChange={e => setCurrentRecord(prev => ({ ...prev, stages: { ...prev.stages, deep: Number(e.target.value) } }))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
                <span>Nocturnal HRV:</span>
                <strong style={{ color: 'var(--gold-lt)' }}>{currentRecord.nocturnalHrvRmssdMs} ms</strong>
              </div>
              <input
                type="range"
                min={25}
                max={120}
                value={currentRecord.nocturnalHrvRmssdMs}
                onChange={e => setCurrentRecord(prev => ({ ...prev, nocturnalHrvRmssdMs: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Training Prescription Impact ────────────────────────────── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 14px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          <GaaIcon name="lightning" size={12} tone="gold" />
          <span>Training Prescription Impact from Sleep</span>
        </div>
        <p style={{ margin: 0, color: '#E2E8F0', fontSize: 12.5, lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--gold-lt)' }}>{analysis.trainingCapacityStatus}:</strong> {analysis.clinicalGuidance}
        </p>
      </div>
    </div>
  )
}
