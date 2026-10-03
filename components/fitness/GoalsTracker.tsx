'use client'

import { useState, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'

type GoalCategory = 'weight' | 'strength' | 'cardio' | 'body_composition' | 'custom'

interface ClientGoal {
  id: string
  title: string
  category: GoalCategory
  target_value: number | null
  target_unit: string | null
  baseline_value: number | null
  current_value: number | null
  target_date: string | null
  is_achieved: boolean
  achieved_at: string | null
  notes: string | null
  created_at: string
}

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  weight: 'Weight',
  strength: 'Strength',
  cardio: 'Cardio',
  body_composition: 'Body Composition',
  custom: 'Custom',
}

const CATEGORY_COLOR: Record<GoalCategory, string> = {
  weight: 'var(--gold)',
  strength: 'var(--error)',
  cardio: 'var(--success)',
  body_composition: '#7B8FD8',
  custom: 'var(--gray)',
}

function calcProgress(goal: ClientGoal): number | null {
  if (
    goal.baseline_value == null ||
    goal.target_value == null ||
    goal.current_value == null
  ) {
    return null
  }
  const range = Math.abs(goal.target_value - goal.baseline_value)
  if (range === 0) return 100
  const progress = Math.abs(goal.current_value - goal.baseline_value)
  return Math.min(Math.max(Math.round((progress / range) * 100), 0), 100)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProgressBar({ pct, achieved }: { pct: number; achieved: boolean }) {
  return (
    <div
      style={{
        height: 4,
        background: 'var(--navy-lt)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 8,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: achieved ? 'var(--success)' : 'var(--gold)',
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

const EMPTY_FORM = {
  title: '',
  category: 'custom' as GoalCategory,
  target_value: '',
  target_unit: '',
  baseline_value: '',
  current_value: '',
  target_date: '',
  notes: '',
}

export default function GoalsTracker() {
  const [goals, setGoals] = useState<ClientGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState<ClientGoal | null>(null)
  const [editCurrentValue, setEditCurrentValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/fitness/goals')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json() as { goals: ClientGoal[] }
      setGoals(json.goals ?? [])
    } catch {
      setError('Could not load goals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFormError(null)
      if (!form.title.trim()) {
        setFormError('Title is required.')
        return
      }
      setSaving(true)
      try {
        const res = await fetch('/api/fitness/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            category: form.category,
            target_value: form.target_value !== '' ? form.target_value : undefined,
            target_unit: form.target_unit || undefined,
            baseline_value: form.baseline_value !== '' ? form.baseline_value : undefined,
            current_value: form.current_value !== '' ? form.current_value : undefined,
            target_date: form.target_date || undefined,
            notes: form.notes || undefined,
          }),
        })
        if (!res.ok) {
          const j = await res.json() as { error?: string }
          throw new Error(j.error ?? 'Failed')
        }
        const j = await res.json() as { goal: ClientGoal }
        setGoals((prev) => [j.goal, ...prev])
        setForm({ ...EMPTY_FORM })
        setShowForm(false)
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Could not save goal.')
      } finally {
        setSaving(false)
      }
    },
    [form]
  )

  const handleToggleAchieved = useCallback(async (goal: ClientGoal) => {
    setUpdatingId(goal.id)
    try {
      const res = await fetch(`/api/fitness/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_achieved: !goal.is_achieved }),
      })
      if (!res.ok) throw new Error('Failed')
      const j = await res.json() as { goal: ClientGoal }
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? j.goal : g)))
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const handleUpdateCurrent = useCallback(
    async (goal: ClientGoal, newValue: string) => {
      if (newValue === '') return
      setUpdatingId(goal.id)
      try {
        const res = await fetch(`/api/fitness/goals/${goal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_value: newValue }),
        })
        if (!res.ok) throw new Error('Failed')
        const j = await res.json() as { goal: ClientGoal }
        setGoals((prev) => prev.map((g) => (g.id === goal.id ? j.goal : g)))
        setEditingGoal(null)
        setEditCurrentValue('')
      } finally {
        setUpdatingId(null)
      }
    },
    []
  )

  const handleDelete = useCallback(async (goalId: string) => {
    if (!confirm('Delete this goal?')) return
    setUpdatingId(goalId)
    try {
      await fetch(`/api/fitness/goals/${goalId}`, { method: 'DELETE' })
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const active = goals.filter((g) => !g.is_achieved)
  const achieved = goals.filter((g) => g.is_achieved)

  return (
    <section aria-labelledby="goals-heading">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2
          id="goals-heading"
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--white)',
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          GOALS
        </h2>
        <span style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v)
              setFormError(null)
              setForm({ ...EMPTY_FORM })
            }}
            style={{
              border: '1px solid var(--gold)',
              background: showForm ? 'rgba(212,160,23,0.14)' : 'transparent',
              color: 'var(--gold)',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Cancel' : '+ New Goal'}
          </button>
        </span>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--gold)',
              margin: 0,
            }}
          >
            NEW GOAL
          </p>

          <FormField label="Title *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Deadlift 200kg, Lose 10 lbs…"
              maxLength={200}
              required
              style={inputStyle}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as GoalCategory }))}
                style={inputStyle}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Target Date">
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Baseline">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.baseline_value}
                onChange={(e) => setForm((f) => ({ ...f, baseline_value: sanitizeNumericInput(e.target.value) }))}
                placeholder="0"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Current">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.current_value}
                onChange={(e) => setForm((f) => ({ ...f, current_value: sanitizeNumericInput(e.target.value) }))}
                placeholder="0"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Target">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={form.target_value}
                onChange={(e) => setForm((f) => ({ ...f, target_value: sanitizeNumericInput(e.target.value) }))}
                placeholder="0"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Unit">
              <input
                type="text"
                value={form.target_unit}
                onChange={(e) => setForm((f) => ({ ...f, target_unit: e.target.value }))}
                placeholder="kg / lbs / %"
                maxLength={30}
                style={inputStyle}
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Why this goal matters…"
              rows={2}
              maxLength={1000}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </FormField>

          {formError && (
            <p style={{ color: 'var(--error)', fontSize: 13, margin: 0 }}>{formError}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: 'none',
              padding: '10px 20px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              alignSelf: 'flex-start',
            }}
          >
            {saving ? 'Saving…' : 'Save Goal'}
          </button>
        </form>
      )}

      {loading && <p style={{ color: 'var(--gray)', fontSize: 13 }}>Loading goals…</p>}
      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}

      {!loading && !error && goals.length === 0 && (
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--gray)', fontSize: 14, margin: 0 }}>
            No goals set yet. Create your first goal to start tracking progress.
          </p>
        </div>
      )}

      {!loading && active.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 10,
              color: 'var(--gray)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Active ({active.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggleAchieved={handleToggleAchieved}
                onDelete={handleDelete}
                onEditCurrent={(g) => {
                  setEditingGoal(g)
                  setEditCurrentValue(g.current_value !== null ? String(g.current_value) : '')
                }}
                editingGoal={editingGoal}
                editCurrentValue={editCurrentValue}
                setEditCurrentValue={setEditCurrentValue}
                onUpdateCurrent={handleUpdateCurrent}
                updatingId={updatingId}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && achieved.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 10,
              color: 'var(--gray)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Achieved ({achieved.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {achieved.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggleAchieved={handleToggleAchieved}
                onDelete={handleDelete}
                onEditCurrent={() => {}}
                editingGoal={null}
                editCurrentValue=""
                setEditCurrentValue={() => {}}
                onUpdateCurrent={handleUpdateCurrent}
                updatingId={updatingId}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

interface GoalCardProps {
  goal: ClientGoal
  onToggleAchieved: (g: ClientGoal) => void
  onDelete: (id: string) => void
  onEditCurrent: (g: ClientGoal) => void
  editingGoal: ClientGoal | null
  editCurrentValue: string
  setEditCurrentValue: (v: string) => void
  onUpdateCurrent: (g: ClientGoal, v: string) => void
  updatingId: string | null
}

function GoalCard({
  goal,
  onToggleAchieved,
  onDelete,
  onEditCurrent,
  editingGoal,
  editCurrentValue,
  setEditCurrentValue,
  onUpdateCurrent,
  updatingId,
}: GoalCardProps) {
  const progress = calcProgress(goal)
  const isEditing = editingGoal?.id === goal.id
  const busy = updatingId === goal.id

  return (
    <div
      style={{
        background: 'var(--navy-mid)',
        border: `1px solid ${goal.is_achieved ? 'rgba(72,187,120,0.3)' : 'var(--navy-lt)'}`,
        padding: '12px 16px',
        opacity: goal.is_achieved ? 0.8 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Category dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: CATEGORY_COLOR[goal.category],
            marginTop: 5,
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                color: goal.is_achieved ? 'var(--success)' : 'var(--white)',
                textDecoration: goal.is_achieved ? 'line-through' : 'none',
              }}
            >
              {goal.title}
            </span>
            <span
              style={{
                fontSize: 10,
                color: CATEGORY_COLOR[goal.category],
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {CATEGORY_LABELS[goal.category]}
            </span>
            {goal.is_achieved && (
              <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ Achieved</span>
            )}
          </div>

          {/* Metrics row */}
          {(goal.baseline_value != null ||
            goal.current_value != null ||
            goal.target_value != null) && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 8,
                flexWrap: 'wrap',
              }}
            >
              {goal.baseline_value != null && (
                <Micro label="Baseline" value={`${goal.baseline_value}${goal.target_unit ? ` ${goal.target_unit}` : ''}`} />
              )}
              {goal.current_value != null && (
                <Micro
                  label="Current"
                  value={`${goal.current_value}${goal.target_unit ? ` ${goal.target_unit}` : ''}`}
                  highlight
                />
              )}
              {goal.target_value != null && (
                <Micro label="Target" value={`${goal.target_value}${goal.target_unit ? ` ${goal.target_unit}` : ''}`} />
              )}
              {goal.target_date && (
                <Micro label="Deadline" value={formatDate(goal.target_date) ?? ''} />
              )}
            </div>
          )}

          {/* Progress bar */}
          {progress !== null && (
            <div>
              <ProgressBar pct={progress} achieved={goal.is_achieved} />
              <span style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                {progress}% of the way there
              </span>
            </div>
          )}

          {/* Update current value inline */}
          {isEditing && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={editCurrentValue}
                onChange={(e) => setEditCurrentValue(sanitizeNumericInput(e.target.value))}
                placeholder="New value"
                autoFocus
                style={{
                  ...inputStyle,
                  width: 100,
                  padding: '6px 8px',
                }}
              />
              {goal.target_unit && (
                <span style={{ color: 'var(--gray)', fontSize: 13 }}>{goal.target_unit}</span>
              )}
              <button
                type="button"
                onClick={() => onUpdateCurrent(goal, editCurrentValue)}
                disabled={busy}
                style={{
                  background: 'var(--gold)',
                  color: 'var(--navy)',
                  border: 'none',
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                {busy ? '…' : 'Update'}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!goal.is_achieved && goal.target_value != null && (
            <button
              type="button"
              onClick={() => onEditCurrent(goal)}
              disabled={busy}
              title="Log current value"
              style={{ ...ghostBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <GaaIcon name="edit" size={13} tone="gold" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleAchieved(goal)}
            disabled={busy}
            title={goal.is_achieved ? 'Mark in progress' : 'Mark achieved'}
            style={{
              ...ghostBtn,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {goal.is_achieved ? (
              <GaaIcon name="refresh" size={13} tone="slate" />
            ) : (
              <GaaIcon name="check" size={13} tone="emerald" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            disabled={busy}
            title="Delete goal"
            style={{ ...ghostBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <GaaIcon name="close" size={13} tone="ruby" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Micro({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--gray)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-telemetry, monospace)',
          fontSize: 14,
          fontWeight: 700,
          color: highlight ? 'var(--gold)' : 'var(--white)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          color: 'var(--gray)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 4,
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 700,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--navy)',
  border: '1px solid var(--navy-lt)',
  color: 'var(--white)',
  fontFamily: 'Raleway, sans-serif',
  fontSize: 14,
  padding: '8px 10px',
  outline: 'none',
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--navy-lt)',
  color: 'var(--gray)',
  cursor: 'pointer',
  fontSize: 14,
  padding: '4px 8px',
  lineHeight: 1,
}
