'use client'

import React from 'react'
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
}: {
  points: { label: string; value: number }[]
  stroke: string
  min?: number
  max?: number
}) {
  if (!points || points.length === 0) {
    return <div style={{ color: 'var(--gray)', fontSize: 12, padding: '8px 0' }}>No workout data recorded yet.</div>
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
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
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
  progression,
  progressPhotos,
  profile,
  bodyfatState,
  setBodyfatState,
  setStatus,
  formatWeight,
}: ProgressAnalyticsViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(180deg, #0A0F1E 0%, #04070E 100%)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GaaIcon name="bar-chart" size={18} tone="gold" />
          Athlete Progress &amp; Volume Trends
        </h2>
        <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-telemetry, monospace)' }}>
          NASM OPT™ Telemetry
        </span>
      </div>

      <WorkoutStreakCard
        logs={localWorkoutLogs}
        athleteId={profile?.full_name || 'GAA-EXEC-ATHLETE'}
        totalVolumeKg={progression.totalVolumeKg}
        optPhase={2}
      />
      <PersonalRecordsBoard units={units} />
      <GoalsTracker />

      {/* Volume & Periodization Trends */}
      <section style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 'clamp(12px, 2.5vw, 18px)', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GaaIcon name="trending-up" size={18} tone="gold" />
          Training Progression & Volume Load
        </h3>
        <div className="fitness-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: 10, marginBottom: 14 }}>
          <Stat label="Total Sets Logged" value={String(progression.totalSets)} />
          <Stat label="Total Reps Lifted" value={String(progression.totalReps)} />
          <Stat label={`Total Volume (${units === 'imperial' ? 'lb' : 'kg'})`} value={units === 'imperial' ? String(Math.round(progression.totalVolumeKg * 2.20462)) : String(progression.totalVolumeKg)} />
          <Stat label="Average RPE" value={String(progression.avgRpe || '-')} />
        </div>

        <div style={{ marginTop: 14 }}>
          <p style={{ margin: '0 0 6px', color: 'var(--gray)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Volume Load Over Time</p>
          <TrendChart
            points={progression.points.map(p => ({ label: shortDate(p.date), value: units === 'imperial' ? p.volume * 2.20462 : p.volume }))}
            stroke="var(--gold)"
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <p style={{ margin: '0 0 6px', color: 'var(--gray)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sets Per Session</p>
          <TrendChart points={progression.points.map(p => ({ label: shortDate(p.date), value: p.sets }))} stroke="#48BB78" />
        </div>

        <div style={{ marginTop: 14 }}>
          <p style={{ margin: '0 0 6px', color: 'var(--gray)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Avg RPE Trend</p>
          <TrendChart points={progression.points.map(p => ({ label: shortDate(p.date), value: p.avgRpe }))} stroke="#89A7C6" min={1} max={10} />
        </div>
      </section>

      {/* Recent Workout Sessions */}
      {localWorkoutLogs.length > 0 && (
        <section style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 'clamp(12px, 2.5vw, 18px)', borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="folder" size={18} tone="gold" />
            Workout Session History
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {localWorkoutLogs.map(log => (
              <div key={String(log.id)} style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontWeight: 700, color: 'var(--gold-lt)', fontSize: 14 }}>{String(log.session_title)}</div>
                <div style={{ color: 'var(--gray)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="calendar" size={12} tone="slate" />
                  {String(log.session_date)} {log.exertion_rpe ? `· RPE ${String(log.exertion_rpe)}/10` : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Set Ledger */}
      {localSetLogs.length > 0 && (
        <section style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 'clamp(12px, 2.5vw, 18px)', borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="clipboard" size={18} tone="gold" />
            Set-by-Set Ledger
          </h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {localSetLogs.slice(0, 20).map(row => (
              <div key={row.id} style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'var(--navy)', padding: '8px 12px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: 13 }}>{row.exercise_name}</div>
                <div style={{ color: 'var(--gray)', fontSize: 12 }}>
                  Set {row.set_number ?? '-'} · <strong style={{ color: 'var(--gold-lt)' }}>{row.reps} reps @ {formatWeight(row.weight_kg, units)}</strong> · RPE {row.rpe ?? '-'} · {row.session_date}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Progress Photos & Body Composition */}
      <div style={{ marginTop: 6 }}>
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
      </div>
    </div>
  )
}
