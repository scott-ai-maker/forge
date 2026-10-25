'use client'

import React, { useState } from 'react'
import {
  generateSupplementStack,
  SupplementGoal,
  ClientSex,
  FitnessLevel,
} from '@/lib/supplement-prescriptions'
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

  const stack = generateSupplementStack({
    goal,
    age: parseNumericInput(age, 30),
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
      const res = await fetch(`/api/coach/clients/${clientId}/supplements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          age,
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
    <div className="glass-card" style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          disabled={isPrescribing}
          className="tactile-btn"
          style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
            border: 'none',
            color: '#080E14',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 800,
            cursor: isPrescribing ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(197,160,89,0.35)',
          }}
        >
          <GaaIcon name="supplements" size={16} style={{ color: '#080E14', stroke: '#080E14' }} />
          <span>{isPrescribing ? 'Publishing Guide...' : 'Publish Guide & Concierge Update'}</span>
        </button>
      </div>

      {prescribedSuccess && (
        <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.15)', border: '1px solid var(--success)', color: 'var(--white)', fontSize: 14, borderRadius: 6 }}>
          ✓ Precision Sports Science Supplement Guide successfully published to {clientName}&apos;s client portal and dispatched to their Concierge Chat.
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: 14, borderRadius: 6 }}>
          {errorMessage}
        </div>
      )}

      {/* Input Selector Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, background: 'rgba(8,14,20,0.6)', padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>Goal</label>
          <select
            value={goal}
            onChange={e => setGoal(e.target.value as SupplementGoal)}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 12 }}
          >
            <option value="hypertrophy">Hypertrophy (Muscle Growth)</option>
            <option value="fat_loss">Fat Loss & Metabolic Rate</option>
            <option value="longevity_vitality">Longevity & Masters Vitality</option>
            <option value="athletic_power">Athletic Power</option>
            <option value="general_health">Foundational Health</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>Age</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            onFocus={selectOnFocus}
            value={age}
            onChange={e => setAge(sanitizeNumericInput(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>Sex</label>
          <select
            value={sex}
            onChange={e => setSex(e.target.value as ClientSex)}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 12 }}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>Level</label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value as FitnessLevel)}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 12 }}
          >
            <option value="beginner">Beginner (Foundational)</option>
            <option value="intermediate">Intermediate (Strength)</option>
            <option value="advanced_athlete">Advanced / Tier X Master</option>
          </select>
        </div>
      </div>

      {/* Prescription Medications Checklist */}
      <div style={{ background: 'rgba(8,14,20,0.4)', padding: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          Client Prescription Medications & Safety Screening
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 12, color: 'var(--white)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingAnticoagulants} onChange={e => setTakingAnticoagulants(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Blood Thinners (Warfarin/Eliquis)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingAntihypertensives} onChange={e => setTakingAntihypertensives(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Blood Pressure (ACEi/ARBs/Beta)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingThyroidHormone} onChange={e => setTakingThyroidHormone(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Thyroid (Levothyroxine)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingStatins} onChange={e => setTakingStatins(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Statins (Lipitor/Crestor)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingAntidepressants} onChange={e => setTakingAntidepressants(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Antidepressants (SSRIs/SNRIs)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingDiabetesMedications} onChange={e => setTakingDiabetesMedications(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Diabetes (Metformin/Ozempic)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingOralAntibiotics} onChange={e => setTakingOralAntibiotics(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Oral Antibiotics
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={takingImmunosuppressantsOrSteroids} onChange={e => setTakingImmunosuppressantsOrSteroids(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Steroids / Immunosuppressants
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasKidneyCondition} onChange={e => setHasKidneyCondition(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Kidney / Renal Sensitivity
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={isPregnantOrNursing} onChange={e => setIsPregnantOrNursing(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Pregnant / Nursing
          </label>
        </div>
      </div>

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
            <span
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 4,
                background: stack.dispensaryInfo.isThorneLinked ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                color: stack.dispensaryInfo.isThorneLinked ? 'var(--success)' : '#FBBF24',
                border: `1px solid ${stack.dispensaryInfo.isThorneLinked ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {stack.dispensaryInfo.isThorneLinked ? 'Thorne: Dispensary Linked' : 'Thorne: Setup Pending (Direct Fallback)'}
            </span>
          </div>
        </div>

        {/* Titration Rule Directive Banner */}
        <div style={{ background: 'rgba(8,14,20,0.6)', border: '1px solid rgba(212,160,23,0.3)', padding: '10px 14px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--gold-lt)' }}>
          <GaaIcon name="shield-check" size={13} tone="gold" />
          <span><strong>Titration Protocol:</strong> {stack.routineSummary.titrationRule}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {stack.prescribedItems.map(item => (
            <div key={item.id} style={{ background: 'rgba(8,14,20,0.6)', padding: 12, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, display: 'grid', gap: 4 }}>
              <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
          Coach Special Directives / Brand Guidance (Optional)
        </label>
        <input
          type="text"
          value={customCoachNote}
          onChange={e => setCustomCoachNote(e.target.value)}
          placeholder="e.g. Ensure Thorne or Momentous brand is purchased for third-party NSF verification."
          style={{ width: '100%', padding: '10px 12px', background: 'rgba(8,14,20,0.8)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--white)', fontSize: 13, borderRadius: 4 }}
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
