'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'

type Units = 'metric' | 'imperial'
type WorkoutLocation = 'home' | 'gym' | 'both'

const PARQ_QUESTIONS = [
  { key: 'parqQ1', label: 'Has a doctor ever said you have a heart condition and should only do activity recommended by a doctor?' },
  { key: 'parqQ2', label: 'Do you feel chest pain during physical activity?' },
  { key: 'parqQ3', label: 'In the past month, have you had chest pain when not doing physical activity?' },
  { key: 'parqQ4', label: 'Do you lose balance because of dizziness, or have you lost consciousness?' },
  { key: 'parqQ5', label: 'Do you have a bone or joint problem that could be made worse by increased activity?' },
  { key: 'parqQ6', label: 'Is your doctor currently prescribing medication for blood pressure or a heart condition?' },
  { key: 'parqQ7', label: 'Do you know of any other reason you should not participate in exercise?' },
] as const

const DEFAULT_EQUIPMENT_OPTIONS = ['Bodyweight']

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

function getDefaultPreferredTrainingDays(count: number) {
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

export default function OnboardingForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [equipmentOptions, setEquipmentOptions] = useState<string[]>(DEFAULT_EQUIPMENT_OPTIONS)
  const [form, setForm] = useState({
    preferredUnits: 'metric' as Units,
    age: '30',
    sex: 'male',
    heightCm: '',
    heightFt: '',
    heightIn: '',
    weightKg: '',
    weightLb: '',
    waist: '',
    neck: '',
    hip: '',
    activityLevel: 'moderate',
    trainingDaysPerWeek: '4',
    preferredTrainingDays: getDefaultPreferredTrainingDays(4),
    fitnessGoal: 'fat-loss',
    targetWeightKg: '',
    targetWeightLb: '',
    targetBodyfatPercent: '',
    injuriesLimitations: '',
    experienceLevel: 'beginner',
    workoutLocation: 'gym' as WorkoutLocation,
    equipmentAccess: ['Bodyweight'],
    cardioEquipmentAccess: [] as string[],
    parqQ1: '',
    parqQ2: '',
    parqQ3: '',
    parqQ4: '',
    parqQ5: '',
    parqQ6: '',
    parqQ7: '',
    medicalConditions: '',
    medications: '',
    surgeriesOrInjuries: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    primaryPhysicianName: '',
    primaryPhysicianPhone: '',
    legalConsentLiability: false,
    legalConsentInformed: false,
    legalConsentPrivacy: false,
    legalConsentCoaching: false,
    legalConsentEmergency: false,
    legalSignatureName: '',
  })

  function updateField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateBooleanField(key: string, value: boolean) {
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

  const [isCompleted, setIsCompleted] = useState(false)
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null)
  const [draftSaving, setDraftSaving] = useState(false)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfileAndEquipment() {
      const res = await fetch('/api/fitness/profile', { method: 'GET' })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) return

      const rawEquipment: string[] = Array.isArray(payload?.availableEquipment)
        ? payload.availableEquipment.map((item: unknown) => String(item ?? '').trim()).filter(Boolean)
        : []

      // Strictly exclude any variation of "none" or "no equipment"
      const names = rawEquipment.filter(item => {
        const lower = item.toLowerCase()
        return lower !== 'none' && lower !== 'no equipment'
      })

      const bodyweightOption = names.find(item => item.trim().toLowerCase() === 'bodyweight') ?? 'Bodyweight'
      const otherNames = names.filter(item => item.trim().toLowerCase() !== 'bodyweight')
      const available = [bodyweightOption, ...new Set(otherNames)]
      const normalizedAvailable = new Set(available.map(item => item.toLowerCase()))

      if (!active || available.length === 0) return

      setEquipmentOptions(available)

      const profile = payload?.profile
      const intake = payload?.intake
      const localDraftRaw = typeof window !== 'undefined' ? localStorage.getItem('gaa_baseline_onboarding_draft') : null
      let localDraft: Record<string, unknown> | null = null
      if (localDraftRaw) {
        try {
          localDraft = JSON.parse(localDraftRaw)
        } catch {
          // ignore corrupted local draft
        }
      }

      if (profile?.onboarding_completed_at) {
        setIsCompleted(true)
      }

      if (profile?.before_photo_url) {
        setPhotoPreview(profile.before_photo_url)
      }

      setForm(prev => {
        const units: Units = (localDraft?.preferredUnits as Units) || profile?.preferred_units || prev.preferredUnits
        const isMetric = units === 'metric'

        let heightCm = prev.heightCm
        let heightFt = prev.heightFt
        let heightIn = prev.heightIn
        const rawHeightCm = profile?.height_cm != null ? Number(profile.height_cm) : null

        if (rawHeightCm != null) {
          if (isMetric) {
            heightCm = String(rawHeightCm)
          } else {
            const totalInches = Math.round(rawHeightCm / 2.54)
            heightFt = String(Math.floor(totalInches / 12))
            heightIn = String(totalInches % 12)
          }
        }

        let weightKg = prev.weightKg
        let weightLb = prev.weightLb
        const rawWeightKg = profile?.weight_kg != null ? Number(profile.weight_kg) : null
        if (rawWeightKg != null) {
          if (isMetric) {
            weightKg = String(rawWeightKg)
          } else {
            weightLb = String(Math.round(rawWeightKg / 0.45359237))
          }
        }

        let waist = prev.waist
        const rawWaistCm = profile?.waist_cm != null ? Number(profile.waist_cm) : null
        if (rawWaistCm != null) {
          waist = isMetric ? String(rawWaistCm) : String(Math.round(rawWaistCm / 2.54 * 10) / 10)
        }

        let neck = prev.neck
        const rawNeckCm = profile?.neck_cm != null ? Number(profile.neck_cm) : null
        if (rawNeckCm != null) {
          neck = isMetric ? String(rawNeckCm) : String(Math.round(rawNeckCm / 2.54 * 10) / 10)
        }

        let hip = prev.hip
        const rawHipCm = profile?.hip_cm != null ? Number(profile.hip_cm) : null
        if (rawHipCm != null) {
          hip = isMetric ? String(rawHipCm) : String(Math.round(rawHipCm / 2.54 * 10) / 10)
        }

        const rawEquipAccess = Array.isArray(profile?.equipment_access)
          ? profile.equipment_access.filter((e: string) => {
              const lower = String(e).toLowerCase().trim()
              return lower !== 'none' && lower !== 'no equipment'
            })
          : prev.equipmentAccess

        const parqAnswers = intake?.parq_answers || {}

        const merged = {
          ...prev,
          preferredUnits: units,
          age: profile?.age != null ? String(profile.age) : prev.age,
          sex: profile?.sex || prev.sex,
          heightCm,
          heightFt,
          heightIn,
          weightKg,
          weightLb,
          waist,
          neck,
          hip,
          activityLevel: profile?.activity_level || prev.activityLevel,
          trainingDaysPerWeek: profile?.training_days_per_week != null ? String(profile.training_days_per_week) : prev.trainingDaysPerWeek,
          preferredTrainingDays: Array.isArray(profile?.preferred_training_days) && profile.preferred_training_days.length > 0
            ? profile.preferred_training_days
            : prev.preferredTrainingDays,
          fitnessGoal: profile?.fitness_goal || prev.fitnessGoal,
          targetWeightKg: profile?.target_weight_kg != null ? String(profile?.target_weight_kg) : prev.targetWeightKg,
          targetWeightLb: profile?.target_weight_kg != null ? String(Math.round(Number(profile.target_weight_kg) / 0.45359237)) : prev.targetWeightLb,
          targetBodyfatPercent: profile?.target_bodyfat_percent != null ? String(profile.target_bodyfat_percent) : prev.targetBodyfatPercent,
          injuriesLimitations: profile?.injuries_limitations || prev.injuriesLimitations,
          experienceLevel: profile?.experience_level || prev.experienceLevel,
          workoutLocation: (profile?.workout_location as WorkoutLocation) || prev.workoutLocation,
          equipmentAccess: rawEquipAccess.length > 0 ? rawEquipAccess : ['Bodyweight'],
          cardioEquipmentAccess: Array.isArray(profile?.cardio_equipment_access) ? profile.cardio_equipment_access : prev.cardioEquipmentAccess,

          parqQ1: parqAnswers.q1 !== undefined ? (parqAnswers.q1 ? 'yes' : 'no') : prev.parqQ1,
          parqQ2: parqAnswers.q2 !== undefined ? (parqAnswers.q2 ? 'yes' : 'no') : prev.parqQ2,
          parqQ3: parqAnswers.q3 !== undefined ? (parqAnswers.q3 ? 'yes' : 'no') : prev.parqQ3,
          parqQ4: parqAnswers.q4 !== undefined ? (parqAnswers.q4 ? 'yes' : 'no') : prev.parqQ4,
          parqQ5: parqAnswers.q5 !== undefined ? (parqAnswers.q5 ? 'yes' : 'no') : prev.parqQ5,
          parqQ6: parqAnswers.q6 !== undefined ? (parqAnswers.q6 ? 'yes' : 'no') : prev.parqQ6,
          parqQ7: parqAnswers.q7 !== undefined ? (parqAnswers.q7 ? 'yes' : 'no') : prev.parqQ7,
          medicalConditions: intake?.medical_conditions || prev.medicalConditions,
          medications: intake?.medications || prev.medications,
          surgeriesOrInjuries: intake?.surgeries_or_injuries || prev.surgeriesOrInjuries,
          allergies: intake?.allergies || prev.allergies,
          emergencyContactName: intake?.emergency_contact_name || prev.emergencyContactName,
          emergencyContactPhone: intake?.emergency_contact_phone || prev.emergencyContactPhone,
          primaryPhysicianName: intake?.primary_physician_name || prev.primaryPhysicianName,
          primaryPhysicianPhone: intake?.primary_physician_phone || prev.primaryPhysicianPhone,
          legalConsentLiability: intake?.consent_liability_waiver ?? prev.legalConsentLiability,
          legalConsentInformed: intake?.consent_informed_consent ?? prev.legalConsentInformed,
          legalConsentPrivacy: intake?.consent_privacy_practices ?? prev.legalConsentPrivacy,
          legalConsentCoaching: intake?.consent_coaching_agreement ?? prev.legalConsentCoaching,
          legalConsentEmergency: intake?.consent_emergency_care ?? prev.legalConsentEmergency,
          legalSignatureName: intake?.consent_signature_name || prev.legalSignatureName,
        }

        if (localDraft && typeof localDraft === 'object') {
          // If local draft has values, merge them
          return {
            ...merged,
            ...localDraft,
            equipmentAccess: Array.isArray(localDraft.equipmentAccess)
              ? (localDraft.equipmentAccess as string[]).filter((item: string) => normalizedAvailable.has(item.toLowerCase()) && item.toLowerCase() !== 'none' && item.toLowerCase() !== 'no equipment')
              : merged.equipmentAccess,
          }
        }

        return {
          ...merged,
          equipmentAccess: merged.equipmentAccess.filter((item: string) => normalizedAvailable.has(item.toLowerCase())),
        }
      })

      setHasLoadedInitial(true)
    }

    void loadProfileAndEquipment()

    return () => {
      active = false
    }
  }, [])

  // Auto-save draft changes to localStorage after initial load
  useEffect(() => {
    if (!hasLoadedInitial || isCompleted) return
    try {
      localStorage.setItem('gaa_baseline_onboarding_draft', JSON.stringify(form))
    } catch {
      // ignore storage write errors
    }
  }, [form, hasLoadedInitial, isCompleted])

  const equipmentChoices = useMemo(() => {
    return equipmentOptions.map(option => ({
      key: option,
      label: option,
    }))
  }, [equipmentOptions])

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
      if (prev.preferredTrainingDays.length >= limit) {
        return prev
      }

      return {
        ...prev,
        preferredTrainingDays: [...prev.preferredTrainingDays, key],
      }
    })
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    const formData = new FormData()
    formData.append('photo', file)

    try {
      const res = await fetch('/api/fitness/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Photo upload failed')
        setPhotoPreview(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed')
      setPhotoPreview(null)
    } finally {
      setUploading(false)
    }
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

  function buildPayload() {
    const preferredUnits = form.preferredUnits
    const heightCm = preferredUnits === 'metric'
      ? toNumber(form.heightCm)
      : inchesToCm((toNumber(form.heightFt) ?? 0) * 12 + (toNumber(form.heightIn) ?? 0))

    const weightKg = preferredUnits === 'metric'
      ? toNumber(form.weightKg)
      : poundsToKg(toNumber(form.weightLb))

    const waistCm = preferredUnits === 'metric' ? toNumber(form.waist) : inchesToCm(toNumber(form.waist))
    const neckCm = preferredUnits === 'metric' ? toNumber(form.neck) : inchesToCm(toNumber(form.neck))
    const hipCm = preferredUnits === 'metric' ? toNumber(form.hip) : inchesToCm(toNumber(form.hip))
    const targetWeightKg = preferredUnits === 'metric'
      ? toNumber(form.targetWeightKg)
      : poundsToKg(toNumber(form.targetWeightLb))

    return {
      preferredUnits,
      age: form.age,
      sex: form.sex,
      heightCm,
      weightKg,
      waistCm,
      neckCm,
      hipCm,
      activityLevel: form.activityLevel,
      trainingDaysPerWeek: form.trainingDaysPerWeek,
      preferredTrainingDays: form.preferredTrainingDays,
      fitnessGoal: form.fitnessGoal,
      targetWeightKg,
      targetBodyfatPercent: form.targetBodyfatPercent,
      injuriesLimitations: form.injuriesLimitations,
      experienceLevel: form.experienceLevel,
      workoutLocation: form.workoutLocation,
      equipmentAccess: form.equipmentAccess,
      cardioEquipmentAccess: form.cardioEquipmentAccess,
      intake: {
        parqAnswers: {
          q1: form.parqQ1 === 'yes',
          q2: form.parqQ2 === 'yes',
          q3: form.parqQ3 === 'yes',
          q4: form.parqQ4 === 'yes',
          q5: form.parqQ5 === 'yes',
          q6: form.parqQ6 === 'yes',
          q7: form.parqQ7 === 'yes',
        },
        medicalConditions: form.medicalConditions,
        medications: form.medications,
        surgeriesOrInjuries: form.surgeriesOrInjuries,
        allergies: form.allergies,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        primaryPhysicianName: form.primaryPhysicianName,
        primaryPhysicianPhone: form.primaryPhysicianPhone,
        liabilityWaiver: form.legalConsentLiability,
        informedConsent: form.legalConsentInformed,
        privacyPractices: form.legalConsentPrivacy,
        coachingAgreement: form.legalConsentCoaching,
        emergencyCare: form.legalConsentEmergency,
        signatureName: form.legalSignatureName,
      },
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const requestBody = buildPayload()

    const parqAnswered = ['parqQ1', 'parqQ2', 'parqQ3', 'parqQ4', 'parqQ5', 'parqQ6', 'parqQ7']
      .every(key => {
        const value = form[key as keyof typeof form]
        return value === 'yes' || value === 'no'
      })

    if (!parqAnswered) {
      setError('Please answer all PAR-Q health screening questions.')
      setSaving(false)
      return
    }

    if (!form.emergencyContactName.trim() || !form.emergencyContactPhone.trim()) {
      setError('Emergency contact name and phone are required.')
      setSaving(false)
      return
    }

    if (!form.legalConsentLiability || !form.legalConsentInformed || !form.legalConsentPrivacy || !form.legalConsentCoaching || !form.legalConsentEmergency) {
      setError('All legal consent acknowledgements are required before continuing.')
      setSaving(false)
      return
    }

    if (!form.legalSignatureName.trim()) {
      setError('Your full legal name is required as an electronic signature.')
      setSaving(false)
      return
    }

    if (!requestBody.heightCm || !requestBody.weightKg) {
      setError('Height and weight are required.')
      setSaving(false)
      return
    }

    if (!requestBody.equipmentAccess?.length) {
      setError('Select at least one equipment option.')
      setSaving(false)
      return
    }

    if (requestBody.preferredTrainingDays.length !== Number(requestBody.trainingDaysPerWeek)) {
      setError('Select the same number of preferred training days as sessions per week.')
      setSaving(false)
      return
    }

    const res = await fetch('/api/fitness/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const payload = await res.json()

    if (!res.ok) {
      setError(payload.error ?? 'Could not save onboarding profile')
      setSaving(false)
      return
    }

    try {
      localStorage.removeItem('gaa_baseline_onboarding_draft')
    } catch {
      // ignore
    }

    router.push('/dashboard/fitness')
    router.refresh()
  }

  async function handleSaveDraft() {
    setDraftSaving(true)
    setError(null)
    setDraftSavedMessage(null)

    try {
      const requestBody = buildPayload()
      const res = await fetch('/api/fitness/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody,
          saveDraft: true,
        }),
      })

      if (typeof window !== 'undefined') {
        localStorage.setItem('gaa_baseline_onboarding_draft', JSON.stringify(form))
      }

      if (res.ok) {
        setDraftSavedMessage('✓ Draft saved! Your baseline setup progress is safely stored. You can return anytime.')
      } else {
        setDraftSavedMessage('✓ Progress saved locally to this device.')
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.setItem('gaa_baseline_onboarding_draft', JSON.stringify(form))
      }
      setDraftSavedMessage('✓ Progress saved locally to this device.')
    } finally {
      setDraftSaving(false)
      setTimeout(() => setDraftSavedMessage(null), 6000)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
      {isCompleted && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.12) 0%, rgba(14, 23, 36, 0.95) 100%)',
            border: '1px solid rgba(46, 204, 113, 0.45)',
            borderRadius: 8,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2ECC71', fontWeight: 800 }}>
              ✓ Baseline Setup Completed
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Your baseline profile is already active and calibrated. You can also review and modify your vitals, goals, and equipment anytime in Settings.
            </p>
          </div>
          <a
            href="/dashboard/settings?tab=fitness"
            className="sgf-button sgf-button-secondary"
            style={{ padding: '8px 14px', fontSize: 12, textDecoration: 'none' }}
          >
            Manage in Settings →
          </a>
        </div>
      )}

      {draftSavedMessage && (
        <div
          style={{
            background: 'rgba(212, 160, 23, 0.15)',
            border: '1px solid var(--gold)',
            borderRadius: 6,
            padding: '10px 14px',
            color: 'var(--gold-lt)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {draftSavedMessage}
        </div>
      )}

      <section style={{ border: '1px solid var(--navy-lt)', padding: 14, background: 'var(--navy-mid)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>
          Intake + PAR-Q + Legal (Required)
        </h3>
        <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13 }}>
          Complete this section before any training recommendations are generated. If any PAR-Q answer is Yes,
          physician clearance is recommended before high-intensity activity.
        </p>
      </section>

      <div style={{ display: 'grid', gap: 12 }}>
        <label className="sgf-form-label">PAR-Q Health Screening</label>
        {PARQ_QUESTIONS.map(question => (
          <div key={question.key} style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: '10px 12px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: 14 }}>{question.label}</p>
            <div style={{ display: 'flex', gap: 14 }}>
              <label htmlFor={`${question.key}-yes`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  id={`${question.key}-yes`}
                  type="radio"
                  name={question.key}
                  value="yes"
                  checked={form[question.key] === 'yes'}
                  onChange={e => updateField(question.key, e.target.value)}
                />
                <span>Yes</span>
              </label>
              <label htmlFor={`${question.key}-no`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  id={`${question.key}-no`}
                  type="radio"
                  name={question.key}
                  value="no"
                  checked={form[question.key] === 'no'}
                  onChange={e => updateField(question.key, e.target.value)}
                />
                <span>No</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="sgf-form-grid">
        <div>
          <label className="sgf-form-label">Medical Conditions</label>
          <textarea value={form.medicalConditions} onChange={e => updateField('medicalConditions', e.target.value)} className="sgf-form-input" style={{ minHeight: 72 }} placeholder="Heart, respiratory, metabolic, neurological, etc." />
        </div>
        <div>
          <label className="sgf-form-label">Current Medications</label>
          <textarea value={form.medications} onChange={e => updateField('medications', e.target.value)} className="sgf-form-input" style={{ minHeight: 72 }} placeholder="Include dosage/frequency if relevant." />
        </div>
        <div>
          <label className="sgf-form-label">Surgeries / Prior Injuries</label>
          <textarea value={form.surgeriesOrInjuries} onChange={e => updateField('surgeriesOrInjuries', e.target.value)} className="sgf-form-input" style={{ minHeight: 72 }} placeholder="Include dates if known." />
        </div>
        <div>
          <label className="sgf-form-label">Allergies</label>
          <textarea value={form.allergies} onChange={e => updateField('allergies', e.target.value)} className="sgf-form-input" style={{ minHeight: 72 }} placeholder="Medication, food, latex, etc." />
        </div>
        <div>
          <label className="sgf-form-label">Emergency Contact Name</label>
          <input value={form.emergencyContactName} onChange={e => updateField('emergencyContactName', e.target.value)} className="sgf-form-input" required />
        </div>
        <div>
          <label className="sgf-form-label">Emergency Contact Phone</label>
          <input value={form.emergencyContactPhone} onChange={e => updateField('emergencyContactPhone', e.target.value)} className="sgf-form-input" required />
        </div>
        <div>
          <label className="sgf-form-label">Primary Physician (optional)</label>
          <input value={form.primaryPhysicianName} onChange={e => updateField('primaryPhysicianName', e.target.value)} className="sgf-form-input" />
        </div>
        <div>
          <label className="sgf-form-label">Physician Phone (optional)</label>
          <input value={form.primaryPhysicianPhone} onChange={e => updateField('primaryPhysicianPhone', e.target.value)} className="sgf-form-input" />
        </div>
      </div>

      <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: '12px' }}>
        <label className="sgf-form-label">Legal Consents</label>
        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="legal-consent-liability"><input id="legal-consent-liability" type="checkbox" checked={form.legalConsentLiability} onChange={e => updateBooleanField('legalConsentLiability', e.target.checked)} /> I acknowledge and accept liability waiver terms for exercise participation.</label>
          <label htmlFor="legal-consent-informed"><input id="legal-consent-informed" type="checkbox" checked={form.legalConsentInformed} onChange={e => updateBooleanField('legalConsentInformed', e.target.checked)} /> I provide informed consent for exercise coaching and programming.</label>
          <label htmlFor="legal-consent-privacy"><input id="legal-consent-privacy" type="checkbox" checked={form.legalConsentPrivacy} onChange={e => updateBooleanField('legalConsentPrivacy', e.target.checked)} /> I acknowledge privacy and data handling notices for sensitive health information.</label>
          <label htmlFor="legal-consent-coaching"><input id="legal-consent-coaching" type="checkbox" checked={form.legalConsentCoaching} onChange={e => updateBooleanField('legalConsentCoaching', e.target.checked)} /> I agree to coaching terms, expectations, and communication standards.</label>
          <label htmlFor="legal-consent-emergency"><input id="legal-consent-emergency" type="checkbox" checked={form.legalConsentEmergency} onChange={e => updateBooleanField('legalConsentEmergency', e.target.checked)} /> I consent to emergency response actions if urgent medical risk is identified.</label>
        </div>
        <div style={{ marginTop: 10 }}>
          <label className="sgf-form-label">Electronic Signature (Full Legal Name)</label>
          <input value={form.legalSignatureName} onChange={e => updateField('legalSignatureName', e.target.value)} className="sgf-form-input" required />
        </div>
      </div>

      <div>
        <label className="sgf-form-label">Units</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['metric', 'imperial'] as Units[]).map(units => (
            <button
              key={units}
              type="button"
              onClick={() => updateField('preferredUnits', units)}
              style={{
                padding: '10px 14px',
                border: '1px solid var(--navy-lt)',
                background: form.preferredUnits === units ? 'var(--gold)' : 'var(--navy-mid)',
                color: form.preferredUnits === units ? '#0D1B2A' : 'var(--white)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {units === 'metric' ? 'Metric (cm / kg)' : 'Imperial (ft/in / lb)'}
            </button>
          ))}
        </div>
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
            autoComplete="off"
            onFocus={selectOnFocus}
            required
          />
        </div>

        <div>
          <label className="sgf-form-label">Sex</label>
          <select value={form.sex} onChange={e => updateField('sex', e.target.value)} className="sgf-form-input">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="sgf-form-label">Your Photo (Before)</label>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 14px',
              border: '2px dashed var(--navy-lt)',
              background: 'var(--navy-mid)',
              color: 'var(--white)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 14,
            }}
          />
          {uploading && <p style={{ margin: '8px 0 0 0', fontSize: 12, color: 'var(--gold)' }}>Uploading...</p>}
        </div>
        {photoPreview && (
          <div style={{ marginTop: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} />
          </div>
        )}
      </div>

      <div className="sgf-form-grid">
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
                autoComplete="off"
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
                autoComplete="off"
                onFocus={selectOnFocus}
                required
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="sgf-form-label">Height (ft)</label>
              <input
                value={form.heightFt}
                onChange={e => updateField('heightFt', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
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
                autoComplete="off"
                onFocus={selectOnFocus}
              />
            </div>

            <div>
              <label className="sgf-form-label">Weight (lb)</label>
              <input
                value={form.weightLb}
                onChange={e => updateField('weightLb', sanitizeNumericInput(e.target.value))}
                className="sgf-form-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                onFocus={selectOnFocus}
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="sgf-form-label">Waist ({form.preferredUnits === 'metric' ? 'cm' : 'in'})</label>
          <input
            value={form.waist}
            onChange={e => updateField('waist', sanitizeNumericInput(e.target.value))}
            className="sgf-form-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            onFocus={selectOnFocus}
          />
        </div>

        <div>
          <label className="sgf-form-label">Neck ({form.preferredUnits === 'metric' ? 'cm' : 'in'})</label>
          <input
            value={form.neck}
            onChange={e => updateField('neck', sanitizeNumericInput(e.target.value))}
            className="sgf-form-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            onFocus={selectOnFocus}
          />
        </div>

        <div>
          <label className="sgf-form-label">Hip ({form.preferredUnits === 'metric' ? 'cm' : 'in'}, optional)</label>
          <input
            value={form.hip}
            onChange={e => updateField('hip', sanitizeNumericInput(e.target.value))}
            className="sgf-form-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            onFocus={selectOnFocus}
          />
        </div>

        <div>
          <label className="sgf-form-label">Training Days Per Week</label>
          <input
            value={form.trainingDaysPerWeek}
            onChange={e => updateTrainingDaysPerWeek(sanitizeNumericInput(e.target.value))}
            className="sgf-form-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            onFocus={selectOnFocus}
            required
          />
        </div>

        <div>
          <label className="sgf-form-label">Primary Goal</label>
          <select value={form.fitnessGoal} onChange={e => updateField('fitnessGoal', e.target.value)} className="sgf-form-input">
            <option value="fat-loss">Fat Loss</option>
            <option value="muscle-gain">Muscle Gain</option>
            <option value="performance">Performance</option>
            <option value="general-fitness">General Fitness</option>
          </select>
        </div>

        <div>
          <label className="sgf-form-label">Experience Level</label>
          <select value={form.experienceLevel} onChange={e => updateField('experienceLevel', e.target.value)} className="sgf-form-input">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="sgf-form-label">Workout Location</label>
          <select value={form.workoutLocation} onChange={e => updateField('workoutLocation', e.target.value)} className="sgf-form-input">
            <option value="home">Home</option>
            <option value="gym">Commercial Gym</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="sgf-form-label">Target Weight ({form.preferredUnits === 'metric' ? 'kg' : 'lb'})</label>
          <input
            value={form.preferredUnits === 'metric' ? form.targetWeightKg : form.targetWeightLb}
            onChange={e => updateField(form.preferredUnits === 'metric' ? 'targetWeightKg' : 'targetWeightLb', sanitizeNumericInput(e.target.value))}
            className="sgf-form-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
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
            autoComplete="off"
            onFocus={selectOnFocus}
          />
        </div>
      </div>

      <div>
        <label className="sgf-form-label">Preferred Training Days</label>
        <p style={{ margin: '0 0 8px', color: 'var(--gray)', fontSize: 13 }}>
          Pick exactly {form.trainingDaysPerWeek} day{form.trainingDaysPerWeek === '1' ? '' : 's'} so your monthly program lands on the days you can actually train.
        </p>
        <div className="sgf-form-grid" style={{ gap: 8 }}>
          {TRAINING_DAY_OPTIONS.map(option => (
            <label
              key={option.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--navy-lt)',
                background: 'var(--navy-mid)',
                padding: '10px 12px',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={form.preferredTrainingDays.includes(option.key)}
                onChange={() => togglePreferredTrainingDay(option.key)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="sgf-form-label">Injuries / Limitations</label>
        <textarea
          value={form.injuriesLimitations}
          onChange={e => updateField('injuriesLimitations', e.target.value)}
          className="sgf-form-input" style={{ minHeight: 90 }}
          placeholder="Shoulder pain, knee history, etc."
        />
      </div>

      <div>
        <label className="sgf-form-label">Equipment Access</label>
        <div className="sgf-form-grid" style={{ gap: 8 }}>
          {equipmentChoices.map(option => (
            <label
              key={option.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--navy-lt)',
                background: 'var(--navy-mid)',
                padding: '10px 12px',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14,
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
      </div>

      <div>
        <label className="sgf-form-label">Cardio Equipment Access (select all that apply)</label>
        <p style={{ margin: '0 0 8px', color: 'var(--gray)', fontSize: 13 }}>This helps your coach program cardio and conditioning sessions tailored to what you have available.</p>
        <div className="sgf-form-grid" style={{ gap: 8 }}>
          {CARDIO_EQUIPMENT_OPTIONS.map(option => (
            <label
              key={option.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--navy-lt)',
                background: 'var(--navy-mid)',
                padding: '10px 12px',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14,
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
      </div>

      {error && <p style={{ margin: 0, color: 'var(--error)' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button
          type="submit"
          disabled={saving || draftSaving}
          style={{
            border: 0,
            background: saving ? 'var(--navy-lt)' : 'var(--gold)',
            color: '#0D1B2A',
            padding: '13px 22px',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            letterSpacing: '0.08em',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: saving ? 'not-allowed' : 'pointer',
            borderRadius: 6,
          }}
        >
          {saving ? 'Saving...' : isCompleted ? 'Update Profile' : 'Complete Setup'}
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || draftSaving}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'var(--white)',
            padding: '12px 18px',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 600,
            fontSize: 13.5,
            cursor: draftSaving ? 'not-allowed' : 'pointer',
            borderRadius: 6,
          }}
        >
          {draftSaving ? 'Saving Draft...' : 'Save Draft & Continue Later'}
        </button>
      </div>
    </form>
  )
}
