'use client'

import React, { useState } from 'react'
import { isTimedStaticStretch, isFoamRollerExercise } from '@/lib/exercise-logging-helpers'
import WorkoutStreakCard from '@/components/fitness/WorkoutStreakCard'
import PersonalRecordsBoard from '@/components/fitness/PersonalRecordsBoard'
import GoalsTracker from '@/components/fitness/GoalsTracker'
import ProgressPhotoTimeline from '@/components/fitness/ProgressPhotoTimeline'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface WorkoutLogRecord {
  id: string
  session_title: string
  session_date: string
  exertion_rpe?: number
  completed?: boolean
  notes?: string | null
  workout_plan_id?: string | null
}

interface WorkoutSetLogRecord {
  id: string
  session_date: string
  exercise_name: string
  set_number?: number
  reps: number
  weight_kg?: number
  rest_seconds?: number
  rpe?: number
  rir?: number
  is_warmup?: boolean
  notes?: string | null
}

interface ProgressPhotoEntry {
  id: string
  photo_url: string
  taken_at: string
  notes?: string | null
  created_at?: string | null
}

interface ProgressionPoint {
  date: string
  volume: number
  sets: number
  avgRpe: number
}

import { HubProfileData } from './FitnessLabDiagnosticsView'

interface ProgressAnalyticsViewProps {
  localWorkoutLogs: WorkoutLogRecord[]
  localSetLogs: WorkoutSetLogRecord[]
  units: 'metric' | 'imperial'
  optPhase?: number
  sessionsPerWeek?: number
  progression: {
    totalSets: number
    totalReps: number
    totalVolumeKg: number
    avgRpe: number
    points: ProgressionPoint[]
  }
  progressPhotos: ProgressPhotoEntry[]
  profile: HubProfileData | null
  bodyfatState: { estimated: string }
  setBodyfatState: React.Dispatch<React.SetStateAction<{ estimated: string }>>
  setStatus: (msg: string | null) => void
  formatWeight: (kg: number | undefined, units: 'metric' | 'imperial') => string
}

function shortDate(dateStr: string) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parts[1]}/${parts[2]}`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy)', padding: '10px 12px', borderRadius: 4 }}>
      <div style={{ color: 'var(--gray)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>{value}</div>
    </div>
  )
}

function TrendChart({
  points,
  stroke,
  min,
  max,
  label,
}: {
  points: { label: string; value: number }[]
  stroke: string
  min?: number
  max?: number
  label: string
}) {
  if (!points || points.length === 0) {
    return <div style={{ color: 'var(--gray)', fontSize: 12, padding: '8px 0' }}>{label === 'Average effort (RPE)' ? 'No effort ratings recorded yet.' : 'No workout data recorded yet.'}</div>
  }

  const values = points.map(p => p.value)
  const effectiveMin = min !== undefined ? min : Math.min(...values, 0)
  const effectiveMax = max !== undefined ? max : Math.max(...values, 1)
  const range = effectiveMax - effectiveMin || 1

  const width = 300
  const height = 70
  const padding = 10

  const coords = points.map((p, i) => {
    const x = padding + (i / Math.max(1, points.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((p.value - effectiveMin) / range) * (height - 2 * padding)
    return { x, y, ...p }
  })

  const pathD = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x},${c.y}`, '')

  return (
    <div style={{ background: 'var(--navy)', border: '1px solid var(--navy-lt)', padding: '8px 10px', borderRadius: 4, overflowX: 'auto' }}>
      <svg role="img" aria-label={label} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <title>{label}</title>
        <desc>{points.map(point => `${point.label}: ${point.value.toFixed(1)}`).join('; ')}</desc>
        <path d={pathD} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill={stroke} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--gray)' }}>
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  )
}

export default function ProgressAnalyticsView({
  localWorkoutLogs,
  localSetLogs,
  units,
  optPhase,
  sessionsPerWeek,
  progression,
  progressPhotos,
  profile,
  bodyfatState,
  setBodyfatState,
  setStatus,
  formatWeight,
}: ProgressAnalyticsViewProps) {
  const [trend, setTrend] = useState<'volume' | 'sets' | 'effort'>('volume')
  const [historyLimit, setHistoryLimit] = useState(10)
  const [setLimit, setSetLimit] = useState(10)
  const workouts = [...localWorkoutLogs].sort((a, b) => b.session_date.localeCompare(a.session_date))
  const sets = [...localSetLogs].sort((a, b) => b.session_date.localeCompare(a.session_date) || (b.set_number ?? 0) - (a.set_number ?? 0))
  const trendPoints = [...progression.points].sort((a, b) => a.date.localeCompare(b.date))
  const trendLabel = trend === 'volume' ? `Volume (${units === 'imperial' ? 'lb' : 'kg'})` : trend === 'sets' ? 'Sets per training day' : 'Average effort (RPE)'
  return (
    <div className="fitness-progress-view" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(180deg, #0A0F1E 0%, #04070E 100%)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GaaIcon name="bar-chart" size={18} tone="gold" />
          Your progress
        </h2>
        <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-telemetry, monospace)' }}>
          Training trends
        </span>
      </div>

      {/* Volume & Periodization Trends */}
      <section style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 'clamp(12px, 2.5vw, 18px)', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GaaIcon name="trending-up" size={18} tone="gold" />
          Training overview
        </h3>
        <div className="fitness-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: 10, marginBottom: 14 }}>
          <Stat label="Total Sets Logged" value={String(progression.totalSets)} />
          <Stat label="Recorded Reps / Seconds" value={progression.totalReps.toLocaleString()} />
          <Stat label={`Total Volume (${units === 'imperial' ? 'lb' : 'kg'})`} value={Math.round(progression.totalVolumeKg * (units === 'imperial' ? 2.20462 : 1)).toLocaleString()} />
          <Stat label="Average RPE" value={String(progression.avgRpe || '-')} />
        </div>

        <label style={{ display: 'grid', gap: 6, color: 'var(--gray)', fontSize: 12 }}>
          View trend
          <select aria-label="View progress trend" value={trend} onChange={event => {
            const value = event.target.value
            if (value === 'volume' || value === 'sets' || value === 'effort') setTrend(value)
          }}>
            <option value="volume">Volume load</option>
            <option value="sets">Sets per training day</option>
            <option value="effort">Effort (RPE)</option>
          </select>
        </label>
        <p style={{ color: 'var(--gray)', fontSize: 12 }}>{trendLabel} · All loaded training history</p>
        <TrendChart label={trendLabel}
          points={trendPoints.filter(p => trend !== 'effort' || p.avgRpe > 0).map(p => ({
            label: shortDate(p.date),
            value: trend === 'volume' ? p.volume * (units === 'imperial' ? 2.20462 : 1) : trend === 'sets' ? p.sets : p.avgRpe,
          }))}
          stroke="var(--gold)" min={trend === 'effort' ? 1 : undefined} max={trend === 'effort' ? 10 : undefined}
        />
      </section>

      <details className="fitness-card-disclosure fitness-progress-panel">
        <summary>Training consistency</summary>
        <WorkoutStreakCard logs={localWorkoutLogs} athleteId={profile?.full_name || 'GAA-EXEC-ATHLETE'} totalVolumeKg={progression.totalVolumeKg} optPhase={optPhase} sessionsPerWeek={sessionsPerWeek} />
      </details>
      <details className="fitness-card-disclosure fitness-progress-panel">
        <summary>Personal records</summary>
        <PersonalRecordsBoard units={units} />
      </details>
      <details className="fitness-card-disclosure fitness-progress-panel">
        <summary>Goals</summary>
        <GoalsTracker />
      </details>
      {/* Recent Workout Sessions */}
      {localWorkoutLogs.length > 0 && (
        <details className="fitness-card-disclosure fitness-progress-panel">
          <summary>Workout history ({workouts.length})</summary>
          <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="folder" size={18} tone="gold" />
            Workout Session History
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {workouts.slice(0, historyLimit).map(log => (
              <div key={String(log.id)} style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontWeight: 700, color: 'var(--gold-lt)', fontSize: 14 }}>{String(log.session_title)}</div>
                <div style={{ color: 'var(--gray)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="calendar" size={12} tone="slate" />
                  {String(log.session_date)} {log.exertion_rpe ? `· RPE ${String(log.exertion_rpe)}/10` : ''}
                </div>
              </div>
            ))}
          </div>
          {historyLimit < workouts.length && <button type="button" onClick={() => setHistoryLimit(value => value + 10)}>Show more workouts</button>}
        </details>
      )}

      {/* Recent Set Ledger */}
      {localSetLogs.length > 0 && (
        <details className="fitness-card-disclosure fitness-progress-panel">
          <summary>Set history ({sets.length})</summary>
          <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="clipboard" size={18} tone="gold" />
            Set-by-Set Ledger
          </h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {sets.slice(0, setLimit).map(row => (
              <div key={row.id} style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'var(--navy)', padding: '8px 12px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: 13 }}>{row.exercise_name}</div>
                <div style={{ color: 'var(--gray)', fontSize: 12 }}>
                  Set {row.set_number ?? '-'}{row.is_warmup ? ' · Warm-up' : ''} · <strong style={{ color: 'var(--gold-lt)' }}>
                    {isTimedStaticStretch(row.exercise_name, null, null) || isFoamRollerExercise(row.exercise_name)
                      ? `${row.reps}s`
                      : `${row.reps} reps @ ${formatWeight(row.weight_kg, units)}`}
                  </strong> · RPE {row.rpe ?? '-'} · {row.session_date}
                </div>
              </div>
            ))}
          </div>
          {setLimit < sets.length && <button type="button" onClick={() => setSetLimit(value => value + 10)}>Show more sets</button>}
        </details>
      )}

      {/* Progress Photos & Body Composition */}
      <details className="fitness-card-disclosure fitness-progress-panel">
        <summary>Progress photos &amp; body composition</summary>
        <ProgressPhotoTimeline
          initialPhotos={progressPhotos}
          canUpload
          subtitle="Upload progress photos and calculate your approximate body fat percentage over time."
          bodyFatInputs={{
            sex: profile?.sex,
            heightCm: profile?.height_cm,
            weightKg: profile?.weight_kg,
            waistCm: profile?.waist_cm,
            neckCm: profile?.neck_cm,
            hipCm: profile?.hip_cm,
          }}
          estimatedBodyfat={bodyfatState.estimated || null}
          onEstimatedBodyfat={(value) => {
            setBodyfatState({ estimated: String(value) })
            setStatus(`Approximate body-fat estimate: ${value}%`)
          }}
        />
      </details>
    </div>
  )
}
