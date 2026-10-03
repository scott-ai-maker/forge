'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  COMMON_SPORTS_INJURIES,
  getAllSportsInjuries,
  parseInjuriesFromText,
  serializeInjuriesWithNotes,
  SportsInjuryRegion,
  type SportsInjuryDefinition,
} from '@/lib/sports-injuries'

type Units = 'metric' | 'imperial'
type WorkoutLocation = 'home' | 'gym' | 'both'

export interface BaselineFitnessProfileData {
  preferredUnits?: 'imperial' | 'metric'
  age?: number | null
  sex?: string | null
  heightCm?: number | null
  weightKg?: number | null
  waistCm?: number | null
  neckCm?: number | null
  hipCm?: number | null
  activityLevel?: string | null
  trainingDaysPerWeek?: number | null
  preferredTrainingDays?: string[]
  fitnessGoal?: string | null
  targetWeightKg?: number | null
  targetBodyfatPercent?: number | null
  injuriesLimitations?: string | null
  experienceLevel?: string | null
  workoutLocation?: string | null
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
  onboardingCompletedAt?: string | null
}

interface BaselineFitnessSettingsStudioProps {
  initialData?: BaselineFitnessProfileData
  onNavigateTab?: (tab: 'wearables' | 'spotify' | 'billing' | 'fitness' | 'medical' | 'profile' | 'security' | 'notifications') => void
}

const DEFAULT_EQUIPMENT_OPTIONS = [
  'Bodyweight',
  'Dumbbells',
  'Barbell',
  'Cable Machine',
  'Resistance Bands',
  'Kettlebells',
  'Suspension Trainer (TRX)',
  'Stability Ball',
  'BOSU Balance Trainer',
  'Bench',
  'Pull-up Bar',
  'Foam Roller',
]

const CARDIO_EQUIPMENT_OPTIONS = [
  { key: 'treadmill', label: 'Treadmill' },
  { key: 'stationary-bike', label: 'Stationary Bike' },
  { key: 'rowing-machine', label: 'Rowing Machine' },
  { key: 'elliptical', label: 'Elliptical' },
  { key: 'stairmaster', label: 'Stairmaster / StepMill' },
  { key: 'assault-bike', label: 'Assault / Air Bike' },
  { key: 'ski-erg', label: 'Ski Erg' },
  { key: 'jump-rope', label: 'Jump Rope' },
  { key: 'outdoor-running', label: 'Outdoor Running' },
  { key: 'outdoor-cycling', label: 'Outdoor Cycling' },
  { key: 'swimming', label: 'Swimming Pool' },
  { key: 'hiking', label: 'Trails / Hiking' },
] as const

const TRAINING_DAY_OPTIONS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

function getDefaultPreferredTrainingDays(count: number): string[] {
  const patterns: Record<number, string[]> = {
    2: ['monday', 'thursday'],
    3: ['monday', 'wednesday', 'friday'],
    4: ['monday', 'tuesday', 'thursday', 'friday'],
    5: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    7: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  }
  return (patterns[count] ?? patterns[4]).slice(0, Math.max(2, Math.min(7, count)))
}

export default function BaselineFitnessSettingsStudio({
  initialData,
  onNavigateTab,
}: BaselineFitnessSettingsStudioProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>(DEFAULT_EQUIPMENT_OPTIONS)

  const initialUnits: Units = initialData?.preferredUnits === 'imperial' ? 'imperial' : 'metric'
  const isMetricInitial = initialUnits === 'metric'

  const initialHeightCm = initialData?.heightCm != null ? Number(initialData.heightCm) : null
  const totalInches = initialHeightCm != null ? Math.round(initialHeightCm / 2.54) : 0

  const initialWeightKg = initialData?.weightKg != null ? Number(initialData.weightKg) : null
  const initialWeightLb = initialWeightKg != null ? Math.round(initialWeightKg / 0.45359237) : ''

  const initialTargetWeightKg = initialData?.targetWeightKg != null ? Number(initialData.targetWeightKg) : null
  const initialTargetWeightLb = initialTargetWeightKg != null ? Math.round(initialTargetWeightKg / 0.45359237) : ''

  const [form, setForm] = useState({
    preferredUnits: initialUnits,
    age: initialData?.age != null ? String(initialData.age) : '30',
    sex: initialData?.sex || 'male',
    heightCm: initialHeightCm != null ? String(initialHeightCm) : '',
    heightFt: totalInches ? String(Math.floor(totalInches / 12)) : '',
    heightIn: totalInches ? String(totalInches % 12) : '',
    weightKg: initialWeightKg != null ? String(initialWeightKg) : '',
    weightLb: initialWeightLb ? String(initialWeightLb) : '',
    waist: initialData?.waistCm != null
      ? (isMetricInitial ? String(initialData.waistCm) : String(Math.round(initialData.waistCm / 2.54 * 10) / 10))
      : '',
    neck: initialData?.neckCm != null
      ? (isMetricInitial ? String(initialData.neckCm) : String(Math.round(initialData.neckCm / 2.54 * 10) / 10))
      : '',
    hip: initialData?.hipCm != null
      ? (isMetricInitial ? String(initialData.hipCm) : String(Math.round(initialData.hipCm / 2.54 * 10) / 10))
      : '',
    activityLevel: initialData?.activityLevel || 'moderate',
    trainingDaysPerWeek: initialData?.trainingDaysPerWeek != null ? String(initialData.trainingDaysPerWeek) : '4',
    preferredTrainingDays: Array.isArray(initialData?.preferredTrainingDays) && initialData.preferredTrainingDays.length > 0
      ? initialData.preferredTrainingDays
      : getDefaultPreferredTrainingDays(4),
    fitnessGoal: initialData?.fitnessGoal || 'fat-loss',
    targetWeightKg: initialTargetWeightKg != null ? String(initialTargetWeightKg) : '',
    targetWeightLb: initialTargetWeightLb ? String(initialTargetWeightLb) : '',
    targetBodyfatPercent: initialData?.targetBodyfatPercent != null ? String(initialData.targetBodyfatPercent) : '',
    injuriesLimitations: initialData?.injuriesLimitations || '',
    experienceLevel: initialData?.experienceLevel || 'beginner',
    workoutLocation: (initialData?.workoutLocation as WorkoutLocation) || 'gym',
    equipmentAccess: (initialData?.equipmentAccess || ['Bodyweight']).filter(
      item => item.toLowerCase() !== 'none' && item.toLowerCase() !== 'no equipment'
    ),
    cardioEquipmentAccess: initialData?.cardioEquipmentAccess || [],
  })

  // Sports Injuries & Orthopedic Profile State
  const initialInjuriesParsed = useMemo(
    () => parseInjuriesFromText(initialData?.injuriesLimitations),
    [initialData?.injuriesLimitations]
  )
  const [selectedInjuryIds, setSelectedInjuryIds] = useState<string[]>(initialInjuriesParsed.selectedInjuryIds)
  const [injuryCustomNotes, setInjuryCustomNotes] = useState<string>(initialInjuriesParsed.customNotes)
  const [injuryRegionFilter, setInjuryRegionFilter] = useState<'all' | SportsInjuryRegion>('all')
  const [expandedInjuryDetailId, setExpandedInjuryDetailId] = useState<string | null>(null)

  const toggleInjury = (id: string) => {
    triggerHaptic('tap')
    setSelectedInjuryIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      const serialized = serializeInjuriesWithNotes(next, injuryCustomNotes)
      setForm(f => ({ ...f, injuriesLimitations: serialized }))
      return next
    })
  }

  const handleNotesChange = (text: string) => {
    setInjuryCustomNotes(text)
    const serialized = serializeInjuriesWithNotes(selectedInjuryIds, text)
    setForm(f => ({ ...f, injuriesLimitations: serialized }))
  }

  // Load equipment library options while strictly omitting any "none"
  useEffect(() => {
    let active = true

    async function fetchEquipment() {
      try {
        const res = await fetch('/api/fitness/profile')
        if (!res.ok) return
        const payload = await res.json()
        const rawNames: string[] = Array.isArray(payload?.availableEquipment)
          ? payload.availableEquipment.map((item: unknown) => String(item ?? '').trim()).filter(Boolean)
          : []

        const cleaned = rawNames.filter(name => {
          const lower = name.toLowerCase()
          return lower !== 'none' && lower !== 'no equipment'
        })

        if (cleaned.length > 0 && active) {
          const bodyweightItem = cleaned.find(i => i.toLowerCase() === 'bodyweight') ?? 'Bodyweight'
          const others = cleaned.filter(i => i.toLowerCase() !== 'bodyweight')
          setEquipmentOptions([bodyweightItem, ...new Set(others)])
        }
      } catch {
        // use defaults
      }
    }

    void fetchEquipment()
    return () => {
      active = false
    }
  }, [])

  function updateField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateTrainingDaysPerWeek(value: string) {
    setForm(prev => {
      const normalizedCount = Math.max(2, Math.min(7, Number(value) || 2))
      const nextSelected = [...prev.preferredTrainingDays]

      if (nextSelected.length > normalizedCount) {
        nextSelected.splice(normalizedCount)
      }

      if (nextSelected.length < normalizedCount) {
        for (const day of getDefaultPreferredTrainingDays(normalizedCount)) {
          if (nextSelected.includes(day)) continue
          nextSelected.push(day)
          if (nextSelected.length === normalizedCount) break
        }
      }

      return {
        ...prev,
        trainingDaysPerWeek: value,
        preferredTrainingDays: nextSelected,
      }
    })
  }

  function toggleEquipment(key: string) {
    setForm(prev => {
      const has = prev.equipmentAccess.includes(key)
      return {
        ...prev,
        equipmentAccess: has ? prev.equipmentAccess.filter(item => item !== key) : [...prev.equipmentAccess, key],
      }
    })
  }

  function toggleCardioEquipment(key: string) {
    setForm(prev => {
      const has = prev.cardioEquipmentAccess.includes(key)
      return {
        ...prev,
        cardioEquipmentAccess: has ? prev.cardioEquipmentAccess.filter(item => item !== key) : [...prev.cardioEquipmentAccess, key],
      }
    })
  }

  function togglePreferredTrainingDay(key: string) {
    setForm(prev => {
      const has = prev.preferredTrainingDays.includes(key)
      if (has) {
        return {
          ...prev,
          preferredTrainingDays: prev.preferredTrainingDays.filter(item => item !== key),
        }
      }
      const limit = Math.max(2, Math.min(7, Number(prev.trainingDaysPerWeek) || 2))
      if (prev.preferredTrainingDays.length >= limit) return prev
      return {
        ...prev,
        preferredTrainingDays: [...prev.preferredTrainingDays, key],
      }
    })
  }

  function toNumber(value: string) {
    if (!value.trim()) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  function inchesToCm(value: number | null) {
    return value === null ? null : Math.round(value * 2.54 * 100) / 100
  }

  function poundsToKg(value: number | null) {
    return value === null ? null : Math.round(value * 0.45359237 * 100) / 100
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)

    const isMetric = form.preferredUnits === 'metric'
    const heightCm = isMetric
      ? toNumber(form.heightCm)
      : inchesToCm((toNumber(form.heightFt) ?? 0) * 12 + (toNumber(form.heightIn) ?? 0))

    const weightKg = isMetric
      ? toNumber(form.weightKg)
      : poundsToKg(toNumber(form.weightLb))

    const waistCm = isMetric ? toNumber(form.waist) : inchesToCm(toNumber(form.waist))
    const neckCm = isMetric ? toNumber(form.neck) : inchesToCm(toNumber(form.neck))
    const hipCm = isMetric ? toNumber(form.hip) : inchesToCm(toNumber(form.hip))
    const targetWeightKg = isMetric
      ? toNumber(form.targetWeightKg)
      : poundsToKg(toNumber(form.targetWeightLb))

    if (!heightCm || !weightKg) {
      setStatusMessage({ type: 'error', text: 'Height and weight are required.' })
      setSaving(false)
      return
    }

    const trainingDaysCount = Number(form.trainingDaysPerWeek) || 4
    if (form.preferredTrainingDays.length !== trainingDaysCount) {
      setStatusMessage({
        type: 'error',
        text: `Please select exactly ${trainingDaysCount} preferred training day${trainingDaysCount === 1 ? '' : 's'}.`,
      })
      setSaving(false)
      return
    }

    const sanitizedEquipment = form.equipmentAccess.filter(
      item => item.toLowerCase() !== 'none' && item.toLowerCase() !== 'no equipment'
    )

    try {
      const res = await fetch('/api/fitness/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredUnits: form.preferredUnits,
          age: toNumber(form.age),
          sex: form.sex,
          heightCm,
          weightKg,
          waistCm,
          neckCm,
          hipCm,
          activityLevel: form.activityLevel,
          trainingDaysPerWeek: trainingDaysCount,
          preferredTrainingDays: form.preferredTrainingDays,
          fitnessGoal: form.fitnessGoal,
          targetWeightKg,
          targetBodyfatPercent: toNumber(form.targetBodyfatPercent),
          injuriesLimitations: form.injuriesLimitations,
          experienceLevel: form.experienceLevel,
          workoutLocation: form.workoutLocation,
          equipmentAccess: sanitizedEquipment.length > 0 ? sanitizedEquipment : ['Bodyweight'],
          cardioEquipmentAccess: form.cardioEquipmentAccess,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: payload.error || 'Failed to update baseline profile' })
        setSaving(false)
        return
      }

      triggerHaptic('success')
      setStatusMessage({
        type: 'success',
        text: '✓ Baseline fitness profile updated successfully! Calibrations saved.',
      })
      router.refresh()
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Network error while updating profile',
      })
    } finally {
      setSaving(false)
    }
  }

  const equipmentChoices = useMemo(() => {
    return equipmentOptions.map(option => ({
      key: option,
      label: option,
    }))
  }, [equipmentOptions])

  const completedDate = initialData?.onboardingCompletedAt
    ? new Date(initialData.onboardingCompletedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Status Ribbon ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(13,27,42,0.9) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 800,
                background: completedDate ? 'rgba(46,204,113,0.2)' : 'rgba(212,160,23,0.2)',
                color: completedDate ? '#2ECC71' : 'var(--gold-lt)',
                padding: '3px 8px',
                borderRadius: 4,
                border: completedDate ? '1px solid rgba(46,204,113,0.4)' : '1px solid rgba(212,160,23,0.4)',
              }}
            >
              {completedDate ? '✓ Baseline Setup Active' : 'Setup In Progress'}
            </span>
            {completedDate && (
              <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                Calibrated on {completedDate}
              </span>
            )}
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, margin: '6px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
            BASELINE BIOMETRICS & FITNESS SETUP
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--gray)', maxWidth: 650 }}>
            Configure your core vitals, equipment availability, and weekly training days. Your NASM OPT periodization models calibrate directly from these settings.
          </p>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('medical')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--white)',
              padding: '10px 16px',
              borderRadius: 6,
              fontSize: 12.5,
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="shield" size={15} tone="amber" />
            <span>Review PAR-Q+ Health Clearance →</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 600,
            background: statusMessage.type === 'success' ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)',
            border: statusMessage.type === 'success' ? '1px solid rgba(46,204,113,0.4)' : '1px solid rgba(231,76,60,0.4)',
            color: statusMessage.type === 'success' ? '#2ECC71' : 'var(--error)',
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* ── Settings Form ── */}
      <form onSubmit={handleSave} style={{ display: 'grid', gap: 24 }}>
        {/* Section 1: Units Preference */}
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Measurement Standards
            </span>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              PREFERRED DISPLAY UNITS
            </h4>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['imperial', 'metric'] as Units[]).map(unit => (
              <button
                key={unit}
                type="button"
                onClick={() => updateField('preferredUnits', unit)}
                style={{
                  padding: '10px 18px',
                  border: form.preferredUnits === unit ? '1px solid var(--gold)' : '1px solid var(--navy-lt)',
                  background: form.preferredUnits === unit ? 'var(--gold)' : 'rgba(255,255,255,0.02)',
                  color: form.preferredUnits === unit ? '#0D1B2A' : 'var(--white)',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: form.preferredUnits === unit ? 800 : 500,
                  cursor: 'pointer',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {unit === 'imperial' ? 'Imperial (ft/in, lb)' : 'Metric (cm, kg)'}
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Core Biometrics */}
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Physiological Profile
            </span>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              CORE BIOMETRIC VITALS
            </h4>
          </div>

          <div className="sgf-form-grid">
            <div>
              <label className="sgf-form-label">Age</label>
              <input
                value={form.age}
                onChange={e => updateField('age', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="numeric"
                onFocus={selectOnFocus}
                required
              />
            </div>

            <div>
              <label className="sgf-form-label">Biological Sex</label>
              <select value={form.sex} onChange={e => updateField('sex', e.target.value)} className="sgf-form-input">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {form.preferredUnits === 'metric' ? (
              <>
                <div>
                  <label className="sgf-form-label">Height (cm)</label>
                  <input
                    value={form.heightCm}
                    onChange={e => updateField('heightCm', sanitizeNumericInput(e.target.value))}
                    className="sgf-form-input"
                    type="text"
                    inputMode="decimal"
                    onFocus={selectOnFocus}
                    required
                  />
                </div>

                <div>
                  <label className="sgf-form-label">Weight (kg)</label>
                  <input
                    value={form.weightKg}
                    onChange={e => updateField('weightKg', sanitizeNumericInput(e.target.value))}
                    className="sgf-form-input"
                    type="text"
                    inputMode="decimal"
                    onFocus={selectOnFocus}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label className="sgf-form-label">Height (ft)</label>
                    <input
                      value={form.heightFt}
                      onChange={e => updateField('heightFt', sanitizeNumericInput(e.target.value))}
                      className="sgf-form-input"
                      type="text"
                      inputMode="numeric"
                      onFocus={selectOnFocus}
                      required
                    />
                  </div>
                  <div>
                    <label className="sgf-form-label">Height (in)</label>
                    <input
                      value={form.heightIn}
                      onChange={e => updateField('heightIn', sanitizeNumericInput(e.target.value))}
                      className="sgf-form-input"
                      type="text"
                      inputMode="numeric"
                      onFocus={selectOnFocus}
                    />
                  </div>
                </div>

                <div>
                  <label className="sgf-form-label">Weight (lb)</label>
                  <input
                    value={form.weightLb}
                    onChange={e => updateField('weightLb', sanitizeNumericInput(e.target.value))}
                    className="sgf-form-input"
                    type="text"
                    inputMode="decimal"
                    onFocus={selectOnFocus}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="sgf-form-label">Waist Circumference ({form.preferredUnits === 'metric' ? 'cm' : 'in'})</label>
              <input
                value={form.waist}
                onChange={e => updateField('waist', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocus}
              />
            </div>

            <div>
              <label className="sgf-form-label">Neck Circumference ({form.preferredUnits === 'metric' ? 'cm' : 'in'})</label>
              <input
                value={form.neck}
                onChange={e => updateField('neck', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocus}
              />
            </div>

            <div>
              <label className="sgf-form-label">Hip Circumference ({form.preferredUnits === 'metric' ? 'cm' : 'in'})</label>
              <input
                value={form.hip}
                onChange={e => updateField('hip', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocus}
              />
            </div>

            <div>
              <label className="sgf-form-label">Target Weight ({form.preferredUnits === 'metric' ? 'kg' : 'lb'})</label>
              <input
                value={form.preferredUnits === 'metric' ? form.targetWeightKg : form.targetWeightLb}
                onChange={e => updateField(form.preferredUnits === 'metric' ? 'targetWeightKg' : 'targetWeightLb', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocus}
              />
            </div>

            <div>
              <label className="sgf-form-label">Target Body Fat (%)</label>
              <input
                value={form.targetBodyfatPercent}
                onChange={e => updateField('targetBodyfatPercent', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocus}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Training Goals & Schedule */}
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Periodization Architecture
            </span>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              GOALS & TRAINING FREQUENCY
            </h4>
          </div>

          <div className="sgf-form-grid" style={{ marginBottom: 20 }}>
            <div>
              <label className="sgf-form-label">Primary Goal</label>
              <select value={form.fitnessGoal} onChange={e => updateField('fitnessGoal', e.target.value)} className="sgf-form-input">
                <option value="fat-loss">Fat Loss</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="performance">Performance & Power</option>
                <option value="general-fitness">General Fitness & Longevity</option>
              </select>
            </div>

            <div>
              <label className="sgf-form-label">Experience Level</label>
              <select value={form.experienceLevel} onChange={e => updateField('experienceLevel', e.target.value)} className="sgf-form-input">
                <option value="beginner">Beginner (0–1 years)</option>
                <option value="intermediate">Intermediate (1–3 years)</option>
                <option value="advanced">Advanced (3+ years)</option>
              </select>
            </div>

            <div>
              <label className="sgf-form-label">Workout Location</label>
              <select value={form.workoutLocation} onChange={e => updateField('workoutLocation', e.target.value)} className="sgf-form-input">
                <option value="gym">Commercial Gym Suite</option>
                <option value="home">Home Gym / Living Room</option>
                <option value="both">Hybrid (Both Gym & Home)</option>
              </select>
            </div>

            <div>
              <label className="sgf-form-label">Weekly Training Sessions</label>
              <input
                value={form.trainingDaysPerWeek}
                onChange={e => updateTrainingDaysPerWeek(sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="numeric"
                onFocus={selectOnFocus}
                required
              />
            </div>
          </div>

          <div>
            <label className="sgf-form-label">Preferred Training Days (Select {form.trainingDaysPerWeek})</label>
            <p style={{ margin: '0 0 10px', color: 'var(--gray)', fontSize: 13 }}>
              Your calendar macrocycles will align to these designated training days.
            </p>
            <div className="sgf-form-grid" style={{ gap: 8 }}>
              {TRAINING_DAY_OPTIONS.map(day => (
                <label
                  key={day.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: form.preferredTrainingDays.includes(day.key) ? '1px solid var(--gold)' : '1px solid var(--navy-lt)',
                    background: form.preferredTrainingDays.includes(day.key) ? 'rgba(212,160,23,0.1)' : 'var(--navy-mid)',
                    padding: '10px 12px',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: 13.5,
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.preferredTrainingDays.includes(day.key)}
                    onChange={() => togglePreferredTrainingDay(day.key)}
                  />
                  <span>{day.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Equipment Suite (Bodyweight Only, No "None") */}
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Apparatus & Hardware Access
            </span>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              RESISTANCE EQUIPMENT ACCESS
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Select all equipment you have access to. Exercises requiring unselected gear will automatically be substituted by the NASM engine.
            </p>
          </div>

          <div className="sgf-form-grid" style={{ gap: 8 }}>
            {equipmentChoices.map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: form.equipmentAccess.includes(option.key) ? '1px solid var(--gold)' : '1px solid var(--navy-lt)',
                  background: form.equipmentAccess.includes(option.key) ? 'rgba(212,160,23,0.1)' : 'var(--navy-mid)',
                  padding: '10px 12px',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 13.5,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.equipmentAccess.includes(option.key)}
                  onChange={() => toggleEquipment(option.key)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Section 5: Cardio Equipment Access */}
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Aerobic Conditioning
            </span>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              CARDIO & METABOLIC APPARATUS
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Identifies the machines and environments available for Zone 2 and HIIT stage cardio prescriptions.
            </p>
          </div>

          <div className="sgf-form-grid" style={{ gap: 8 }}>
            {CARDIO_EQUIPMENT_OPTIONS.map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: form.cardioEquipmentAccess.includes(option.key) ? '1px solid var(--gold)' : '1px solid var(--navy-lt)',
                  background: form.cardioEquipmentAccess.includes(option.key) ? 'rgba(212,160,23,0.1)' : 'var(--navy-mid)',
                  padding: '10px 12px',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 13.5,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.cardioEquipmentAccess.includes(option.key)}
                  onChange={() => toggleCardioEquipment(option.key)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Section 6: Sports Injuries, Biomechanical Guardrails & Pain Cues */}
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="shield-check" size={13} tone="gold" />
                <span>NASM Biomechanics &amp; Orthopedic Protection</span>
              </span>
              {selectedInjuryIds.length > 0 && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(212,160,23,0.18)', border: '1px solid rgba(212,160,23,0.45)', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  {selectedInjuryIds.length} Safeguard{selectedInjuryIds.length === 1 ? '' : 's'} Active
                </span>
              )}
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, margin: '4px 0 2px', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              COMMON SPORTS INJURIES &amp; LIMITATIONS
            </h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--gray)', lineHeight: 1.5 }}>
              Select any active, recurring, or prior sports injuries (e.g. Runner&apos;s Knee, Tennis Elbow). Your master training plan and daily exercises will automatically adapt with joint-sparing substitutions, corrective warmups, and personalized cues.
            </p>
          </div>

          {/* Active Protection Shield Banner (shown when injuries are selected) */}
          {selectedInjuryIds.length > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(13,27,42,0.9) 100%)',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GaaIcon name="award" size={16} tone="gold" />
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)' }}>
                  Active Biomechanical Plan Augmentations ({selectedInjuryIds.length}):
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedInjuryIds.map(id => {
                  const def = COMMON_SPORTS_INJURIES[id]
                  return (
                    <span
                      key={id}
                      style={{
                        fontSize: 11,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(212,160,23,0.3)',
                        borderRadius: 4,
                        padding: '3px 8px',
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <strong style={{ color: 'var(--gold)' }}>{def?.name || id}</strong>
                      <button
                        type="button"
                        onClick={() => toggleInjury(id)}
                        aria-label={`Remove ${def?.name || id}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--gray)',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 12,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.4 }}>
                ✓ Exercises with high joint shear are auto-substituted with safe regressions. Corrective SMR &amp; activation protocols are injected into your daily warmups.
              </div>
            </div>
          )}

          {/* Region Filter Bar */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'all' as const, label: 'All Injuries' },
              { id: 'knee' as const, label: 'Knee & Leg' },
              { id: 'elbow' as const, label: 'Elbow & Arm' },
              { id: 'shoulder' as const, label: 'Shoulder' },
              { id: 'spine' as const, label: 'Spine & Back' },
              { id: 'hip' as const, label: 'Hip & Groin' },
              { id: 'foot_ankle' as const, label: 'Foot & Ankle' },
              { id: 'wrist' as const, label: 'Wrist & Hand' },
            ].map(tab => {
              const isSelected = injuryRegionFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap')
                    setInjuryRegionFilter(tab.id)
                  }}
                  style={{
                    padding: '6px 12px',
                    background: isSelected ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    color: isSelected ? 'var(--gold-lt)' : 'var(--gray)',
                    fontSize: 11.5,
                    fontWeight: isSelected ? 800 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Sports Injuries Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {getAllSportsInjuries()
              .filter(injury => injuryRegionFilter === 'all' || injury.region === injuryRegionFilter)
              .map(injury => {
                const isSelected = selectedInjuryIds.includes(injury.id)
                const isExpanded = expandedInjuryDetailId === injury.id

                return (
                  <div
                    key={injury.id}
                    style={{
                      background: isSelected ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInjury(injury.id)}
                          style={{
                            marginTop: 3,
                            accentColor: 'var(--gold)',
                            cursor: 'pointer',
                          }}
                        />
                        <div>
                          <div style={{ color: isSelected ? 'var(--gold-lt)' : '#FFFFFF', fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
                            {injury.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 3, lineHeight: 1.4 }}>
                            {injury.shortDescription}
                          </div>
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap')
                          setExpandedInjuryDetailId(prev => (prev === injury.id ? null : injury.id))
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: isExpanded ? 'var(--gold-lt)' : 'var(--gray)',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                        aria-label="View protocol details"
                      >
                        {isExpanded ? 'Hide ▲' : 'Details ℹ'}
                      </button>
                    </div>

                    {/* Expandable Protocol & Safeguard Details */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: 4,
                          paddingTop: 8,
                          borderTop: '1px solid rgba(255,255,255,0.08)',
                          fontSize: 11,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          color: '#CBD5E1',
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--gold)' }}>Trainer Protocol: </strong>
                          <span>{injury.trainerProtocol}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#F87171' }}>Avoided Movements: </strong>
                          <span>{injury.blacklistedExercises.slice(0, 3).join(', ')}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#34D399' }}>Safe Substitutions: </strong>
                          <span>{injury.prescribedSubstitutions.map(s => s.replacement).slice(0, 2).join('; ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>

          {/* Detailed Custom Notes */}
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 700, marginBottom: 6 }}>
              Detailed Injury Context, Severity or Doctor&apos;s Notes (Optional)
            </label>
            <textarea
              value={injuryCustomNotes}
              onChange={e => handleNotesChange(e.target.value)}
              className="sgf-form-input"
              style={{ minHeight: 75 }}
              placeholder="e.g. Right tennis elbow flared up 2 weeks ago during pickleball; left knee only aches on deep stairs or downhill walking."
            />
          </div>
        </section>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={saving}
            style={{
              border: 0,
              background: saving ? 'var(--navy-lt)' : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
              color: '#0D1B2A',
              padding: '14px 28px',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              letterSpacing: '0.08em',
              fontSize: 13,
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              borderRadius: 6,
              boxShadow: '0 4px 18px rgba(212,160,23,0.35)',
              fontWeight: 700,
            }}
          >
            {saving ? 'Updating Profile...' : 'Save Baseline Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
