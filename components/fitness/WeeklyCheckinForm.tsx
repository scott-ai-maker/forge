'use client'

import { useState, useEffect, useCallback } from 'react'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'

interface WeeklyCheckin {
  id: string
  week_start: string
  sleep_quality: number | null
  stress_level: number | null
  soreness_level: number | null
  energy_level: number | null
  weight_kg: number | null
  notes: string | null
  coach_feedback: string | null
  coach_rating_adjustment: number | null
}

interface WeeklyCheckinFormProps {
  preferredUnits?: 'metric' | 'imperial'
}

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

function RatingInput({
  label,
  hint,
  descriptions,
  value,
  onChange,
}: {
  label: string
  hint: string
  descriptions: Record<string, string>
  value: string
  onChange: (v: string) => void
}) {
  const options = ['1', '2', '3', '4', '5']
  const inputId = `rating-${label.toLowerCase().replace(/\s+/g, '-')}`
  const selectedDescription = value ? descriptions[value] : null

  return (
    <div>
      <span id={inputId} style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 6 }}>
        {label} (1-5)
      </span>
      <p style={{ margin: '0 0 8px', color: 'var(--gray)', fontSize: 12 }}>{hint}</p>
      <div style={{ display: 'flex', gap: 8 }} role="group" aria-labelledby={inputId}>
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            aria-pressed={value === opt}
            aria-label={`${descriptions[opt]} (${label})`}
            style={{
              flex: 1,
              padding: '10px 0',
              border: `1px solid ${value === opt ? 'var(--gold)' : 'var(--navy-lt)'}`,
              background: value === opt ? 'rgba(212,160,23,0.18)' : 'var(--navy-mid)',
              color: value === opt ? 'var(--gold)' : 'var(--gray)',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <p style={{ margin: '6px 0 0', color: 'var(--gray)', fontSize: 12 }}>
        {selectedDescription ? `Selected: ${value} - ${selectedDescription}` : 'Select a number, or tap again to clear.'}
      </p>
    </div>
  )
}

export default function WeeklyCheckinForm({ preferredUnits = 'imperial' }: WeeklyCheckinFormProps) {
  const thisWeek = getMonday(new Date())
  const [existing, setExisting] = useState<WeeklyCheckin | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState({
    sleep_quality: '',
    stress_level: '',
    soreness_level: '',
    energy_level: '',
    weight: '',
    notes: '',
  })

  const load = useCallback(async () => {
    setLoaded(false)
    setLoadError(null)
    try {
      const res = await fetch('/api/fitness/checkin')
      if (res.status === 401) {
        console.warn('Weekly check-in requires a signed-in session.')
        setLoadError('Please sign in to load your check-in, then retry.')
        return
      }
      if (!res.ok) throw new Error('Could not load your check-in. Please retry.')
      const payload = await res.json()
      if (!Array.isArray(payload.checkins)) throw new Error('Check-in response was invalid. Please retry.')
      const thisWeekCheckin = payload.checkins.find((c: WeeklyCheckin) => c.week_start === thisWeek)
      if (thisWeekCheckin) {
        setExisting(thisWeekCheckin)
        setForm({
          sleep_quality: thisWeekCheckin.sleep_quality ? String(thisWeekCheckin.sleep_quality) : '',
          stress_level: thisWeekCheckin.stress_level ? String(thisWeekCheckin.stress_level) : '',
          soreness_level: thisWeekCheckin.soreness_level ? String(thisWeekCheckin.soreness_level) : '',
          energy_level: thisWeekCheckin.energy_level ? String(thisWeekCheckin.energy_level) : '',
          weight: thisWeekCheckin.weight_kg
            ? preferredUnits === 'imperial'
              ? String(Math.round(thisWeekCheckin.weight_kg * 2.20462 * 10) / 10)
              : String(thisWeekCheckin.weight_kg)
            : '',
          notes: thisWeekCheckin.notes ?? '',
        })
      }
    } catch (error) {
      console.error('Weekly check-in load failed:', error)
      setLoadError(error instanceof Error ? error.message : 'Could not load your check-in. Please retry.')
    } finally {
      setLoaded(true)
    }
  }, [thisWeek, preferredUnits])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [load])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    if (form.weight && (!Number.isFinite(Number(form.weight)) || Number(form.weight) <= 0)) {
      setError('Enter a positive weight or leave it blank.')
      return
    }
    setSaving(true)
    setError(null)

    const weightKg = form.weight
      ? preferredUnits === 'imperial'
        ? Math.round(Number(form.weight) * 0.453592 * 100) / 100
        : Number(form.weight)
      : undefined

    try {
      const res = await fetch('/api/fitness/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: thisWeek,
          sleep_quality: form.sleep_quality ? Number(form.sleep_quality) : null,
          stress_level: form.stress_level ? Number(form.stress_level) : null,
          soreness_level: form.soreness_level ? Number(form.soreness_level) : null,
          energy_level: form.energy_level ? Number(form.energy_level) : null,
          weight_kg: weightKg ?? null,
          notes: form.notes || null,
        }),
      })

      if (res.status === 401) {
        console.warn('Weekly check-in save requires a signed-in session.')
        setError('Please sign in to save your check-in. Your entries are still here.')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save check-in')
      if (!data.id) throw new Error('Could not confirm your saved check-in. Please retry.')
      setSaved(true)
      setExisting(previous => ({ ...previous, ...data }))
    } catch (error) {
      console.error('Weekly check-in save failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to save check-in. Please retry.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return <p role="status" style={{ color: 'var(--gray)', fontSize: 14 }}>Loading your check-in...</p>
  }

  if (loadError) {
    return (
      <div role="alert" className="fitness-coach-checkin">
        <p>{loadError}</p>
        <button type="button" onClick={() => void load()}>Retry check-in</button>
      </div>
    )
  }

  const sleepDescriptions: Record<string, string> = {
    '1': 'Very poor sleep quality',
    '2': 'Poor sleep quality',
    '3': 'Average sleep quality',
    '4': 'Good sleep quality',
    '5': 'Excellent sleep quality',
  }

  const stressDescriptions: Record<string, string> = {
    '1': 'Very high stress',
    '2': 'High stress',
    '3': 'Moderate stress',
    '4': 'Low stress',
    '5': 'Very low stress',
  }

  const sorenessDescriptions: Record<string, string> = {
    '1': 'Very sore',
    '2': 'Sore',
    '3': 'Moderately sore',
    '4': 'Light soreness',
    '5': 'Fresh / recovered',
  }

  const energyDescriptions: Record<string, string> = {
    '1': 'Very low energy',
    '2': 'Low energy',
    '3': 'Moderate energy',
    '4': 'High energy',
    '5': 'Very high energy',
  }

  const weekLabel = new Date(`${thisWeek}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="fitness-coach-checkin" style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 14, borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--gold)' }}>
        Weekly Check-In
      </h3>
      <p style={{ margin: '0 0 14px', color: 'var(--gray)', fontSize: 13 }}>
        Week of {weekLabel} · {existing ? 'Update your check-in' : 'How are you feeling this week?'}
      </p>

      {existing?.coach_feedback && (
        <div style={{ padding: '12px 16px', border: '1px solid rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.08)', borderRadius: 6, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 800 }}>
              Coach Scott Gordon · Direct Feedback
            </span>
            {existing.coach_rating_adjustment !== null && existing.coach_rating_adjustment !== undefined && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: existing.coach_rating_adjustment > 0 ? 'rgba(52,211,153,0.2)' : existing.coach_rating_adjustment < 0 ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)', color: existing.coach_rating_adjustment > 0 ? '#34D399' : existing.coach_rating_adjustment < 0 ? '#38BDF8' : 'var(--white)', fontWeight: 700 }}>
                {existing.coach_rating_adjustment > 0 ? `+${existing.coach_rating_adjustment} Load Increase` : existing.coach_rating_adjustment < 0 ? `${existing.coach_rating_adjustment} Deload Buffer` : 'Volume Calibrated'}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--white)', lineHeight: 1.55 }}>{existing.coach_feedback}</p>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
        <p style={{ margin: '-4px 0 0', color: 'var(--gray)', fontSize: 12, lineHeight: 1.45 }}>
          Choose how you feel this week. Tap a selected rating again to clear it.
        </p>
        <div className="fitness-coach-rating-grid">
          <RatingInput label="Sleep Quality" hint="1 = poor sleep, 5 = excellent sleep" descriptions={sleepDescriptions} value={form.sleep_quality} onChange={v => setForm(p => ({ ...p, sleep_quality: v }))} />
          <RatingInput label="Stress Level" hint="1 = very high stress, 5 = very low stress" descriptions={stressDescriptions} value={form.stress_level} onChange={v => setForm(p => ({ ...p, stress_level: v }))} />
          <RatingInput label="Soreness" hint="1 = very sore, 5 = fresh" descriptions={sorenessDescriptions} value={form.soreness_level} onChange={v => setForm(p => ({ ...p, soreness_level: v }))} />
          <RatingInput label="Energy Level" hint="1 = low energy, 5 = high energy" descriptions={energyDescriptions} value={form.energy_level} onChange={v => setForm(p => ({ ...p, energy_level: v }))} />
        </div>

        <div>
          <label htmlFor="weight-input" style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 6 }}>
            Current Weight ({preferredUnits === 'imperial' ? 'lb' : 'kg'}) — optional
          </label>
          <input
            id="weight-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            onFocus={selectOnFocus}
            value={form.weight}
            onChange={e => setForm(p => ({ ...p, weight: sanitizeNumericInput(e.target.value) }))}
            className="sgf-form-input"
            placeholder={preferredUnits === 'imperial' ? 'e.g. 185' : 'e.g. 84.0'}
            aria-describedby="weight-hint"
          />
          <p id="weight-hint" style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: 12 }}>
            Track your current weight to monitor progress
          </p>
        </div>

        <div>
          <label htmlFor="notes-input" style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 6 }}>
            Notes for your coach — optional
          </label>
          <textarea
            id="notes-input"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="sgf-form-input"
            style={{ minHeight: 88 }}
            placeholder="How did training feel this week? Note any changes to medications, new joint aches or injuries, schedule changes, or wins/struggles Coach Gordon should know..."
            aria-describedby="notes-hint"
          />
          <p id="notes-hint" style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: 12 }}>
            Coach Gordon reviews all client notes before adjusting training volume, tempo, or recovery protocols.
          </p>
        </div>

        {error && <p role="alert" style={{ margin: 0, color: 'var(--error)', fontSize: 13 }}>{error}</p>}
        {saved && <p role="status" style={{ margin: 0, color: 'var(--success)', fontSize: 13 }}>Check-in saved ✓</p>}

        <button
          type="submit"
          disabled={saving || !loaded || Boolean(loadError)}
          aria-label={existing ? 'Update check-in' : 'Submit check-in'}
          aria-busy={saving}
          style={{
            border: 0,
            background: saving ? 'var(--navy-lt)' : 'var(--gold)',
            color: '#0D1B2A',
            padding: '12px 20px',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            letterSpacing: '0.08em',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : existing ? 'Update Check-In' : 'Submit Check-In'}
        </button>
      </form>
    </div>
  )
}
