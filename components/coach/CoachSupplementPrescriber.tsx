'use client'

import React, { useState, useEffect, useId, useRef } from 'react'
import {
  generateSupplementStack,
  normalizeSupplementGoal,
  normalizeClientSex,
  normalizeFitnessLevel,
  SupplementGoal,
  ClientSex,
  FitnessLevel,
  isDispensaryAndSupplementsEnabled,
} from '@/lib/supplement-prescriptions'
import { parseParqMedicationsAndConditions } from '@/lib/muscle-recovery-telemetry'
import ExecutiveSupplementTimeline from '@/components/fitness/ExecutiveSupplementTimeline'
import GaaIcon from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'

interface CoachSupplementPrescriberProps {
  clientId: string
  clientName?: string
  clientAge?: number
  clientSex?: ClientSex
  onPrescribeSuccess?: () => void
}

export default function CoachSupplementPrescriber({
  clientId,
  clientName = 'Client',
  clientAge = 38,
  clientSex = 'male',
  onPrescribeSuccess,
}: CoachSupplementPrescriberProps) {
  const fieldPrefix = useId()
  const goalSelectId = `${fieldPrefix}-goal`
  const ageInputId = `${fieldPrefix}-age`
  const sexSelectId = `${fieldPrefix}-sex`
  const levelSelectId = `${fieldPrefix}-level`
  const coachNoteId = `${fieldPrefix}-note`

  const userModifiedRef = useRef(false)

  const [goal, setGoal] = useState<SupplementGoal>('hypertrophy')
  const [age, setAge] = useState<string>(String(clientAge))
  const [sex, setSex] = useState<ClientSex>(clientSex)
  const [level, setLevel] = useState<FitnessLevel>('intermediate')

  // Medication States
  const [takingAnticoagulants, setTakingAnticoagulants] = useState<boolean>(false)
  const [takingAntihypertensives, setTakingAntihypertensives] = useState<boolean>(false)
  const [takingThyroidHormone, setTakingThyroidHormone] = useState<boolean>(false)
  const [takingStatins, setTakingStatins] = useState<boolean>(false)
  const [takingAntidepressants, setTakingAntidepressants] = useState<boolean>(false)
  const [takingDiabetesMedications, setTakingDiabetesMedications] = useState<boolean>(false)
  const [takingOralAntibiotics, setTakingOralAntibiotics] = useState<boolean>(false)
  const [takingImmunosuppressantsOrSteroids, setTakingImmunosuppressantsOrSteroids] = useState<boolean>(false)
  const [hasKidneyCondition, setHasKidneyCondition] = useState<boolean>(false)
  const [isPregnantOrNursing, setIsPregnantOrNursing] = useState<boolean>(false)

  const [customCoachNote, setCustomCoachNote] = useState<string>('')
  const [prescribedSuccess, setPrescribedSuccess] = useState<boolean>(false)
  const [isPrescribing, setIsPrescribing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Hydrate athlete's saved profile and intake medications when available
  useEffect(() => {
    let cancelled = false
    async function loadAthleteSupplementContext() {
      try {
        const res = await fetch(`/api/coach/clients/${encodeURIComponent(clientId)}/supplements`, {
          cache: 'no-store',
        })
        if (!res.ok || cancelled || userModifiedRef.current) return
        const payload = (await res.json()) as {
          profile?: Record<string, unknown> | null
          intake?: {
            parq_answers?: Record<string, unknown> | null
            medications?: string | null
            medical_conditions?: string | null
          } | null
        }
        if (cancelled || userModifiedRef.current) return

        if (payload.profile) {
          if (payload.profile.primary_goal || payload.profile.fitness_goal) {
            setGoal(normalizeSupplementGoal(payload.profile.primary_goal ?? payload.profile.fitness_goal))
          }
          const rawAge = Number(payload.profile.age)
          if (Number.isFinite(rawAge) && rawAge >= 18 && rawAge <= 100) {
            setAge(String(Math.round(rawAge)))
          }
          if (payload.profile.sex) {
            setSex(normalizeClientSex(payload.profile.sex))
          }
          if (payload.profile.training_experience || payload.profile.fitness_level) {
            setLevel(normalizeFitnessLevel(payload.profile.training_experience ?? payload.profile.fitness_level))
          }
        }

        if (payload.intake) {
          const parsedMeds = parseParqMedicationsAndConditions(
            payload.intake.parq_answers ?? null,
            payload.intake.medications ?? null,
            payload.intake.medical_conditions ?? null
          )
          if (parsedMeds.takingAnticoagulants) setTakingAnticoagulants(true)
          if (parsedMeds.takingAntihypertensives) setTakingAntihypertensives(true)
          if (parsedMeds.takingThyroidHormone) setTakingThyroidHormone(true)
          if (parsedMeds.takingStatins) setTakingStatins(true)
          if (parsedMeds.takingAntidepressants) setTakingAntidepressants(true)
          if (parsedMeds.takingDiabetesMedications) setTakingDiabetesMedications(true)
          if (parsedMeds.takingOralAntibiotics) setTakingOralAntibiotics(true)
          if (parsedMeds.takingImmunosuppressantsOrSteroids) setTakingImmunosuppressantsOrSteroids(true)
          if (parsedMeds.hasKidneyCondition) setHasKidneyCondition(true)
        }
      } catch {
        // Non-blocking fallback to prop defaults
      }
    }
    void loadAthleteSupplementContext()
    return () => {
      cancelled = true
    }
  }, [clientId])

  const parsedAgeNum = Math.min(100, Math.max(18, parseNumericInput(age, 35)))

  const stack = generateSupplementStack({
    goal,
    age: parsedAgeNum,
    sex,
    fitnessLevel: level,
    healthConditions: {
      takingAnticoagulants,
      takingAntihypertensives,
      takingThyroidHormone,
      takingStatins,
      takingAntidepressants,
      takingDiabetesMedications,
      takingOralAntibiotics,
      takingImmunosuppressantsOrSteroids,
      hasKidneyCondition,
      isPregnantOrNursing,
    },
  })

  const handlePrescribe = async () => {
    setIsPrescribing(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/coach/clients/${encodeURIComponent(clientId)}/supplements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          age: parsedAgeNum,
          sex,
          fitnessLevel: level,
          healthConditions: {
            takingAnticoagulants,
            takingAntihypertensives,
            takingThyroidHormone,
            takingStatins,
            takingAntidepressants,
            takingDiabetesMedications,
            takingOralAntibiotics,
            takingImmunosuppressantsOrSteroids,
            hasKidneyCondition,
            isPregnantOrNursing,
          },
          customCoachNote,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to prescribe supplement protocol')
      }

      setPrescribedSuccess(true)
      if (onPrescribeSuccess) {
        onPrescribeSuccess()
      }
      setTimeout(() => setPrescribedSuccess(false), 5000)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Prescription deployment failed.')
    } finally {
      setIsPrescribing(false)
    }
  }

  return (
    <div className="glass-card" style={{ padding: '24px 28px', display: 'grid', gap: 20, minWidth: 0 }}>
      {/* Header */}
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
              }}
            >
              Sports Nutrition Advisory Portal
            </span>
            <span style={{ color: 'var(--gray)', fontSize: 13 }}>
              Evidence-Based Nutrient Timing &amp; Safety Screening
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: 'var(--white)',
            }}
          >
            Configure Supplement Guide: {clientName}
          </h3>
        </div>

        <button
          type="button"
          onClick={handlePrescribe}
          disabled={isPrescribing || !isDispensaryAndSupplementsEnabled}
          className="tactile-btn"
          style={{
            minHeight: 44,
            padding: '10px 22px',
            background: !isDispensaryAndSupplementsEnabled
              ? 'rgba(255, 255, 255, 0.08)'
              : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
            border: !isDispensaryAndSupplementsEnabled ? '1px solid rgba(245, 158, 11, 0.45)' : 'none',
            color: !isDispensaryAndSupplementsEnabled ? '#FBBF24' : '#080E14',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 800,
            cursor: isPrescribing || !isDispensaryAndSupplementsEnabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: !isDispensaryAndSupplementsEnabled ? 'none' : '0 4px 14px rgba(197,160,89,0.35)',
          }}
        >
          <GaaIcon
            name="supplements"
            size={16}
            style={{
              color: !isDispensaryAndSupplementsEnabled ? '#FBBF24' : '#080E14',
              stroke: !isDispensaryAndSupplementsEnabled ? '#FBBF24' : '#080E14',
            }}
          />
          <span>
            {!isDispensaryAndSupplementsEnabled
              ? 'Dispensary Offline'
              : isPrescribing
              ? 'Publishing Guide...'
              : 'Publish Guide & Concierge Update'}
          </span>
        </button>
      </div>

      {!isDispensaryAndSupplementsEnabled && (
        <div
          role="status"
          style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#F8FAFC',
            fontSize: 13,
            borderRadius: 8,
          }}
        >
          Supplement publishing is currently paused via environment configuration.
        </div>
      )}

      {prescribedSuccess && (
        <div
          role="status"
          aria-live="polite"
          style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.15)', border: '1px solid var(--success)', color: 'var(--white)', fontSize: 14, borderRadius: 6 }}
        >
          ✓ Precision Sports Science Supplement Guide successfully published to {clientName}&apos;s client portal and dispatched to their Concierge Chat.
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: 14, borderRadius: 6 }}
        >
          {errorMessage}
        </div>
      )}

      {/* Input Selector Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12, background: 'rgba(8,14,20,0.6)', padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <label htmlFor={goalSelectId} style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Goal</label>
          <select
            id={goalSelectId}
            value={goal}
            onChange={e => {
              userModifiedRef.current = true
              setGoal(e.target.value as SupplementGoal)
            }}
            style={{ width: '100%', minHeight: 44, padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 'max(1rem, 1em)', borderRadius: 4 }}
          >
            <option value="hypertrophy">Hypertrophy (Muscle Growth)</option>
            <option value="fat_loss">Fat Loss &amp; Metabolic Rate</option>
            <option value="longevity_vitality">Longevity &amp; Masters Vitality</option>
            <option value="athletic_power">Athletic Power</option>
            <option value="general_health">Foundational Health</option>
          </select>
        </div>

        <div>
          <label htmlFor={ageInputId} style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Age</label>
          <input
            id={ageInputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            onFocus={selectOnFocus}
            value={age}
            onChange={e => {
              userModifiedRef.current = true
              setAge(sanitizeNumericInput(e.target.value))
            }}
            style={{ width: '100%', minHeight: 44, padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 'max(1rem, 1em)', borderRadius: 4 }}
          />
        </div>

        <div>
          <label htmlFor={sexSelectId} style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Sex</label>
          <select
            id={sexSelectId}
            value={sex}
            onChange={e => {
              userModifiedRef.current = true
              setSex(e.target.value as ClientSex)
            }}
            style={{ width: '100%', minHeight: 44, padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 'max(1rem, 1em)', borderRadius: 4 }}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor={levelSelectId} style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Level</label>
          <select
            id={levelSelectId}
            value={level}
            onChange={e => {
              userModifiedRef.current = true
              setLevel(e.target.value as FitnessLevel)
            }}
            style={{ width: '100%', minHeight: 44, padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 'max(1rem, 1em)', borderRadius: 4 }}
          >
            <option value="beginner">Beginner (Foundational)</option>
            <option value="intermediate">Intermediate (Strength)</option>
            <option value="advanced_athlete">Advanced / Tier X Master</option>
          </select>
        </div>
      </div>

      {/* Prescription Medications Checklist */}
      <fieldset style={{ margin: 0, background: 'rgba(8,14,20,0.4)', padding: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 8, minWidth: 0 }}>
        <legend style={{ padding: '0 4px', fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          Client Prescription Medications &amp; Safety Screening
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 8, fontSize: 12, color: 'var(--white)' }}>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingAnticoagulants} onChange={e => { userModifiedRef.current = true; setTakingAnticoagulants(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Blood Thinners (Warfarin/Eliquis)</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingAntihypertensives} onChange={e => { userModifiedRef.current = true; setTakingAntihypertensives(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Blood Pressure (ACEi/ARBs/Beta)</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingThyroidHormone} onChange={e => { userModifiedRef.current = true; setTakingThyroidHormone(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Thyroid (Levothyroxine)</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingStatins} onChange={e => { userModifiedRef.current = true; setTakingStatins(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Statins (Lipitor/Crestor)</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingAntidepressants} onChange={e => { userModifiedRef.current = true; setTakingAntidepressants(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Antidepressants (SSRIs/SNRIs)</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingDiabetesMedications} onChange={e => { userModifiedRef.current = true; setTakingDiabetesMedications(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Diabetes (Metformin/Ozempic)</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingOralAntibiotics} onChange={e => { userModifiedRef.current = true; setTakingOralAntibiotics(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Oral Antibiotics</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={takingImmunosuppressantsOrSteroids} onChange={e => { userModifiedRef.current = true; setTakingImmunosuppressantsOrSteroids(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Steroids / Immunosuppressants</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={hasKidneyCondition} onChange={e => { userModifiedRef.current = true; setHasKidneyCondition(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Kidney / Renal Sensitivity</span>
          </label>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px' }}>
            <input type="checkbox" checked={isPregnantOrNursing} onChange={e => { userModifiedRef.current = true; setIsPregnantOrNursing(e.target.checked) }} style={{ accentColor: 'var(--gold)', flexShrink: 0 }} />
            <span>Pregnant / Nursing</span>
          </label>
        </div>
      </fieldset>

      {/* Drug Interactions Safety Alert Banner */}
      {stack.drugInteractions.length > 0 && (
        <div style={{ background: 'rgba(14,23,36,0.85)', border: '1px solid var(--gold)', padding: 14, display: 'grid', gap: 6 }}>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="shield" size={13} tone="gold" />
            <span>Medication Safety Flags &amp; Clinical Precautions ({stack.drugInteractions.length})</span>
          </div>
          {stack.drugInteractions.map((diag, idx) => (
            <div key={idx} style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.4 }}>
              <strong>{diag.medicationCategory}:</strong> {diag.actionDirective}
            </div>
          ))}
        </div>
      )}

      {/* Protocol Summary Card */}
      <div className="glass-card-gold" style={{ padding: 18, display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Generated Supplement Guide Preview ({stack.prescribedItems.length} Evidence-Based Compounds)
            </div>
            <div style={{ fontSize: 12, color: 'var(--white)', marginTop: 2 }}>
              <strong>Routine Schedule:</strong> {stack.routineSummary.dailyCoreCount} Daily Core (Every Day) · {stack.routineSummary.workoutOnlyCount} Workout Days Only · {stack.routineSummary.conditionalCount} Conditional
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <a
              href={stack.dispensaryInfo.defaultThorneUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 10.5,
                padding: '8px 12px',
                borderRadius: 4,
                background: stack.dispensaryInfo.isThorneLinked ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                color: stack.dispensaryInfo.isThorneLinked ? 'var(--success)' : '#FBBF24',
                border: `1px solid ${stack.dispensaryInfo.isThorneLinked ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
                fontWeight: 700,
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              {stack.dispensaryInfo.isThorneLinked ? 'Thorne Dispensary Live · 15% Off ↗' : 'Thorne Catalog ↗'}
            </a>
          </div>
        </div>

        {/* Titration Rule Directive Banner */}
        <div style={{ background: 'rgba(8,14,20,0.6)', border: '1px solid rgba(212,160,23,0.3)', padding: '10px 14px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--gold-lt)' }}>
          <GaaIcon name="shield-check" size={13} tone="gold" />
          <span><strong>Titration Protocol:</strong> {stack.routineSummary.titrationRule}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 10 }}>
          {stack.prescribedItems.map(item => (
            <div key={item.id} style={{ background: 'rgba(8,14,20,0.6)', padding: 12, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, display: 'grid', gap: 4 }}>
              <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{item.name}</span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: item.routineTier === 'daily_core' ? 'rgba(96,165,250,0.15)' : item.routineTier === 'workout_days' ? 'rgba(234,179,8,0.15)' : 'rgba(168,85,247,0.15)',
                    color: item.routineTier === 'daily_core' ? '#60A5FA' : item.routineTier === 'workout_days' ? '#FACC15' : '#C084FC',
                    border: `1px solid ${item.routineTier === 'daily_core' ? 'rgba(96,165,250,0.3)' : item.routineTier === 'workout_days' ? 'rgba(234,179,8,0.3)' : 'rgba(168,85,247,0.3)'}`,
                  }}
                >
                  {item.routineTier === 'daily_core' ? 'Daily Core' : item.routineTier === 'workout_days' ? 'Workout Only' : 'Adjunct'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gold-lt)' }}>
                {item.optimalDosage} · {item.timingLabel.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10.5, color: item.workoutDayOnly ? '#FACC15' : 'var(--gray-lt)' }}>
                {item.restDayDirective} · {item.mealInstruction}
              </div>
              {item.chronoSeparationNote && (
                <div style={{ fontSize: 10, color: '#ffc107', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <GaaIcon name="alert-triangle" size={11} tone="amber" />
                  <span>{item.chronoSeparationNote}</span>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>{item.clinicalEvidenceSummary.slice(0, 75)}...</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coach Custom Directive */}
      <div>
        <label htmlFor={coachNoteId} style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
          Coach Special Directives / Brand Guidance (Optional)
        </label>
        <input
          id={coachNoteId}
          type="text"
          maxLength={600}
          value={customCoachNote}
          onChange={e => setCustomCoachNote(e.target.value)}
          placeholder="e.g. Select Thorne NSF Certified for Sport® formulations via your 15%-off Forge Athletic dispensary link."
          style={{ width: '100%', minHeight: 44, padding: '10px 12px', background: 'rgba(8,14,20,0.8)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--white)', fontSize: 'max(1rem, 1em)', borderRadius: 4 }}
        />
      </div>

      {/* Scope of Practice & Non-Prescriptive Advisory Notice */}
      <div style={{ background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(255,255,255,0.08)', padding: 14, borderRadius: 6, display: 'grid', gap: 4 }}>
        <div style={{ color: 'var(--gray-lt)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <GaaIcon name="shield-check" size={13} tone="gold" />
          <span>Professional Scope of Practice &amp; Legal Boundary (NASM-CPT®)</span>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.5 }}>
          Sports nutrition guides configured here are strictly educational ergogenic recommendations derived from peer-reviewed sports science research (ISSN, ACSM, IOC consensus). Certified personal trainers do not diagnose deficiency, prescribe medications, or provide medical nutrition therapy. Clients must obtain physician clearance before starting any supplement routine, particularly when managing medical conditions or taking prescription medications.
        </p>
      </div>

      {/* Live Chrono-Dosing Timeline Preview */}
      <div style={{ marginTop: 12 }}>
        <ExecutiveSupplementTimeline
          initialStack={stack}
          athleteName={clientName}
          isCoachView={true}
        />
      </div>
    </div>
  )
}
