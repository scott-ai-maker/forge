'use client'

import { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { identifyHeartRateZone, StageConditioningWorkout } from '@/lib/nasm-cardio-stage-engine'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'
import CardioStageStudio from './CardioStageStudio'

const CARDIO_ACTIVITY_OPTIONS = [
  { key: 'treadmill', label: 'Treadmill' },
  { key: 'stationary-bike', label: 'Stationary Bike' },
  { key: 'rowing-machine', label: 'Rowing Machine' },
  { key: 'elliptical', label: 'Elliptical' },
  { key: 'stairmaster', label: 'Stairmaster' },
  { key: 'assault-bike', label: 'Assault / Air Bike' },
  { key: 'ski-erg', label: 'Ski Erg' },
  { key: 'jump-rope', label: 'Jump Rope' },
  { key: 'outdoor-running', label: 'Outdoor Running' },
  { key: 'outdoor-cycling', label: 'Outdoor Cycling' },
  { key: 'swimming', label: 'Swimming' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'other', label: 'Other' },
]

interface CardioLog {
  id: string
  session_date: string
  activity_type: string
  duration_mins: number
  distance_km?: number | null
  avg_heart_rate?: number | null
  calories?: number | null
  perceived_effort?: number | null
  notes?: string | null
}

interface CardioLogFormProps {
  initialLogs: CardioLog[]
  preferredUnits?: 'metric' | 'imperial'
  athleteAge?: number
  athleteRestingHr?: number
}

export default function CardioLogForm({
  initialLogs,
  preferredUnits = 'imperial',
  athleteAge = 35,
  athleteRestingHr = 65,
}: CardioLogFormProps) {
  const [logs, setLogs] = useState<CardioLog[]>(initialLogs)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showStudio, setShowStudio] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    session_date: today,
    activity_type: 'outdoor-running',
    duration_mins: '',
    distance: '',
    avg_heart_rate: '',
    calories: '',
    perceived_effort: '',
    notes: '',
  })

  const isImperial = preferredUnits === 'imperial'

  const currentBpm = Number(form.avg_heart_rate) || 0
  const liveZone = currentBpm > 40
    ? identifyHeartRateZone(currentBpm, athleteAge, athleteRestingHr)
    : null

  const handleLaunchStageWorkout = (workout: StageConditioningWorkout) => {
    setForm(prev => ({
      ...prev,
      duration_mins: String(workout.durationMins),
      perceived_effort: workout.stage === 1 ? '4' : (workout.stage === 2 ? '6' : '8'),
      notes: `${workout.title} (${workout.workRestRatio}). Protocol: ${workout.mainConditioning}`,
    }))
    setShowForm(true)
    setShowStudio(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const distanceKm = form.distance
      ? isImperial
        ? Math.round(Number(form.distance) * 1.60934 * 1000) / 1000
        : Number(form.distance)
      : undefined

    const res = await fetch('/api/fitness/cardio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_date: form.session_date,
        activity_type: form.activity_type,
        duration_mins: Number(form.duration_mins),
        distance_km: distanceKm || null,
        avg_heart_rate: form.avg_heart_rate ? Number(form.avg_heart_rate) : null,
        calories: form.calories ? Number(form.calories) : null,
        perceived_effort: form.perceived_effort ? Number(form.perceived_effort) : null,
        notes: form.notes || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to log session')
    } else {
      const data = await res.json()
      setLogs(prev => [data, ...prev])
      setForm({ session_date: today, activity_type: 'outdoor-running', duration_mins: '', distance: '', avg_heart_rate: '', calories: '', perceived_effort: '', notes: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    background: 'var(--navy-mid)',
    border: '1px solid var(--navy-lt)',
    color: 'var(--white)',
    fontSize: 13,
    borderRadius: 4,
    boxSizing: 'border-box' as const,
  }

  const fieldLabelStyle = {
    display: 'block',
    fontSize: 11,
    color: 'var(--gray)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 3,
  }

  return (
    <section aria-labelledby="cardio-log-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 id="cardio-log-heading" style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
          Cardio &amp; Metabolic Conditioning
        </h3>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowStudio(p => !p)}
            className="tactile-btn"
            style={{
              padding: '7px 12px',
              background: showStudio ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.06)',
              color: showStudio ? 'var(--gold-lt)' : 'var(--white)',
              border: showStudio ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="lightning" size={13} tone={showStudio ? 'gold' : 'slate'} />
            <span>{showStudio ? 'Hide Stage Studio' : 'Stage Studio & VO2max'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowForm(p => !p)}
            className="tactile-btn"
            style={{
              padding: '7px 12px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              color: '#0D1B2A',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name={showForm ? 'close' : 'plus'} size={13} tone="inherit" />
            <span>{showForm ? 'Cancel' : 'Log Cardio'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Stage Studio */}
      {showStudio && (
        <div style={{ marginBottom: 12, maxWidth: '100%', boxSizing: 'border-box' }}>
          <CardioStageStudio
            initialAge={athleteAge}
            initialRestingHr={athleteRestingHr}
            onLaunchWorkout={handleLaunchStageWorkout}
          />
        </div>
      )}

      {/* ── Cardio Log Form ───────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          style={{
            display: 'grid',
            gap: 12,
            marginBottom: 12,
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 8,
            padding: 'clamp(12px, 3vw, 16px)',
            background: 'rgba(13,27,42,0.75)',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
            <GaaIcon name="lightning" size={12} tone="gold" />
            <span>New Cardio &amp; Conditioning Log Entry</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 8 }}>
            <div>
              <label style={fieldLabelStyle}>Session Date</label>
              <input
                type="date"
                value={form.session_date}
                onChange={e => setForm(p => ({ ...p, session_date: e.target.value }))}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Activity Type</label>
              <select
                value={form.activity_type}
                onChange={e => setForm(p => ({ ...p, activity_type: e.target.value }))}
                style={inputStyle}
              >
                {CARDIO_ACTIVITY_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))', gap: 8 }}>
            <div>
              <label style={fieldLabelStyle}>Duration (min)</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.duration_mins}
                onChange={e => setForm(p => ({ ...p, duration_mins: sanitizeNumericInput(e.target.value) }))}
                style={inputStyle}
                required
                placeholder="30"
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>
                Distance ({isImperial ? 'mi' : 'km'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.distance}
                onChange={e => setForm(p => ({ ...p, distance: sanitizeNumericInput(e.target.value) }))}
                style={inputStyle}
                placeholder="3.1"
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Avg Heart Rate</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.avg_heart_rate}
                onChange={e => setForm(p => ({ ...p, avg_heart_rate: sanitizeNumericInput(e.target.value) }))}
                style={inputStyle}
                placeholder="145 BPM"
              />
            </div>
          </div>

          {/* Live NASM Zone Pill */}
          {liveZone && (
            <div
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${liveZone.color}`,
                borderRadius: 6,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 12,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  background: liveZone.color,
                  color: '#000',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  textTransform: 'uppercase',
                }}
              >
                {liveZone.zoneName}
              </span>
              <span style={{ color: '#E2E8F0', wordBreak: 'break-word' }}>{liveZone.description}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 8 }}>
            <div>
              <label style={fieldLabelStyle}>Calories (kcal)</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.calories}
                onChange={e => setForm(p => ({ ...p, calories: sanitizeNumericInput(e.target.value) }))}
                style={inputStyle}
                placeholder="320"
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Perceived Exertion (RPE 1-10)</label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.perceived_effort}
                onChange={e => setForm(p => ({ ...p, perceived_effort: sanitizeNumericInput(e.target.value) }))}
                style={inputStyle}
                placeholder="7"
              />
            </div>
          </div>

          <div>
            <label style={fieldLabelStyle}>Session Notes / Intervals</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }}
              placeholder="Stage protocol, interval work/rest ratios, or breathing cues"
            />
          </div>

          {error && <p style={{ margin: 0, color: 'var(--error)', fontSize: 13 }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="tactile-btn"
            style={{
              padding: '10px 0',
              background: saving ? 'var(--navy-lt)' : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              color: '#0D1B2A',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="check" size={14} tone="inherit" />
            <span>{saving ? 'Saving...' : 'Log Cardio Session'}</span>
          </button>
        </form>
      )}

      {/* ── Logged Sessions List with Zone Badges ─────────────────── */}
      {logs.length === 0 ? (
        <p style={{ color: 'var(--gray)', fontSize: 14, margin: 0 }}>No cardio sessions logged yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 6, maxWidth: '100%', boxSizing: 'border-box' }}>
          {logs.slice(0, 10).map(log => {
            const actLabel = CARDIO_ACTIVITY_OPTIONS.find(o => o.key === log.activity_type)?.label ?? log.activity_type
            const distDisplay = log.distance_km
              ? isImperial
                ? `${Math.round(log.distance_km / 1.60934 * 100) / 100} mi`
                : `${log.distance_km} km`
              : null

            const zone = log.avg_heart_rate
              ? identifyHeartRateZone(log.avg_heart_rate, athleteAge, athleteRestingHr)
              : null

            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                  flexWrap: 'wrap',
                  gap: 8,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 13.5, color: 'var(--white)' }}>
                    {actLabel}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                    {new Date(`${log.session_date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {zone && (
                    <span
                      style={{
                        fontSize: 10,
                        color: zone.color,
                        border: `1px solid ${zone.color}`,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {zone.zoneName.split(':')[0]}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--gray)', flexWrap: 'wrap' }}>
                  <span><strong>{log.duration_mins}</strong> min</span>
                  {distDisplay && <span><strong>{distDisplay}</strong></span>}
                  {log.avg_heart_rate && <span><strong>{log.avg_heart_rate}</strong> bpm</span>}
                  {log.perceived_effort && <span>RPE <strong>{log.perceived_effort}</strong></span>}
                  {log.calories && <span>{log.calories} kcal</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
