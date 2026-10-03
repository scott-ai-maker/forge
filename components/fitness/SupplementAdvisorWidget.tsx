'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  generateSupplementStack,
  SupplementGoal,
  ClientSex,
  FitnessLevel,
  TimingWindow,
  PrescribedSupplementItem,
  DrugSupplementInteractionAlert,
} from '@/lib/supplement-prescriptions'
import { parseParqMedicationsAndConditions } from '@/lib/muscle-recovery-telemetry'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'

interface SupplementAdvisorWidgetProps {
  initialGoal?: SupplementGoal
  initialAge?: number
  initialSex?: ClientSex
  initialLevel?: FitnessLevel
  intake?: {
    parq_answers?: unknown
    parq_any_yes?: boolean
    medications?: string | null
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    allergies?: string | null
  } | null
}

export default function SupplementAdvisorWidget({
  initialGoal = 'hypertrophy',
  initialAge = 35,
  initialSex = 'male',
  initialLevel = 'intermediate',
  intake,
}: SupplementAdvisorWidgetProps) {
  const [goal, setGoal] = useState<SupplementGoal>(initialGoal)
  const [age, setAge] = useState<string>(String(initialAge))
  const [sex, setSex] = useState<ClientSex>(initialSex)
  const [level, setLevel] = useState<FitnessLevel>(initialLevel)

  // Clinical parsing of intake medications and conditions
  const parsedMedications = useMemo(() => {
    return parseParqMedicationsAndConditions(
      intake?.parq_answers as Record<string, unknown> | null,
      intake?.medications,
      intake?.medical_conditions
    )
  }, [intake])

  // Medical & Prescription Medication States
  const [takingAnticoagulants, setTakingAnticoagulants] = useState<boolean>(() => Boolean(parsedMedications.takingAnticoagulants))
  const [takingAntihypertensives, setTakingAntihypertensives] = useState<boolean>(() => Boolean(parsedMedications.takingAntihypertensives))
  const [takingThyroidHormone, setTakingThyroidHormone] = useState<boolean>(() => Boolean(parsedMedications.takingThyroidHormone))
  const [takingStatins, setTakingStatins] = useState<boolean>(() => Boolean(parsedMedications.takingStatins))
  const [takingAntidepressants, setTakingAntidepressants] = useState<boolean>(() => Boolean(parsedMedications.takingAntidepressants))
  const [takingDiabetesMedications, setTakingDiabetesMedications] = useState<boolean>(() => Boolean(parsedMedications.takingDiabetesMedications))
  const [takingOralAntibiotics, setTakingOralAntibiotics] = useState<boolean>(() => Boolean(parsedMedications.takingOralAntibiotics))
  const [takingImmunosuppressantsOrSteroids, setTakingImmunosuppressantsOrSteroids] = useState<boolean>(() => Boolean(parsedMedications.takingImmunosuppressantsOrSteroids))
  const [hasKidneyCondition, setHasKidneyCondition] = useState<boolean>(() => Boolean(parsedMedications.hasKidneyCondition))
  const [isPregnantOrNursing, setIsPregnantOrNursing] = useState<boolean>(false)

  // Synchronize when intake asynchronously loads
  useEffect(() => {
    if (parsedMedications.hasAnyReportedMedications) {
      if (parsedMedications.takingAnticoagulants) setTakingAnticoagulants(true)
      if (parsedMedications.takingAntihypertensives) setTakingAntihypertensives(true)
      if (parsedMedications.takingThyroidHormone) setTakingThyroidHormone(true)
      if (parsedMedications.takingStatins) setTakingStatins(true)
      if (parsedMedications.takingAntidepressants) setTakingAntidepressants(true)
      if (parsedMedications.takingDiabetesMedications) setTakingDiabetesMedications(true)
      if (parsedMedications.takingOralAntibiotics) setTakingOralAntibiotics(true)
      if (parsedMedications.takingImmunosuppressantsOrSteroids) setTakingImmunosuppressantsOrSteroids(true)
      if (parsedMedications.hasKidneyCondition) setHasKidneyCondition(true)
    }
  }, [parsedMedications])

  const [selectedTimingFilter, setSelectedTimingFilter] = useState<TimingWindow | 'all'>('all')

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

  const displayedItems = selectedTimingFilter === 'all'
    ? stack.prescribedItems
    : stack.prescribedItems.filter(i => i.timingWindow === selectedTimingFilter)

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {/* Widget Header */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
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
                ISSN & IOC Tier A/B Gold Standard
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>
                Pharmacological Drug-Nutrient Safety Shield
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '6px 0 0',
                color: 'var(--white)',
              }}
            >
              Precision Supplementation Protocol
            </h3>
          </div>

          <div
            style={{
              padding: '6px 14px',
              background: 'rgba(52,211,153,0.15)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ✓ NSF / USP Certified Standards
          </div>
        </div>

        <p style={{ margin: '10px 0 0', color: 'var(--gray)', fontSize: 13, lineHeight: 1.5, maxWidth: 850 }}>
          Formulated strictly from randomized controlled trials (ISSN, ACSM, IOC consensus) and cross-examined against your prescription medications to prevent drug-nutrient interactions, nutrient depletions, and adverse side effects.
        </p>
      </div>

      {/* Interactive Profile & Medication Inputs */}
      <div className="glass-card-gold" style={{ padding: 22, display: 'grid', gap: 18 }}>
        <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          1. Biometric Profile & Goal Inputs
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {/* Primary Goal */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
              Primary Goal
            </label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value as SupplementGoal)}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--navy)',
                border: '1px solid var(--navy-lt)',
                color: 'var(--white)',
                fontSize: 13,
                fontFamily: 'Raleway, sans-serif',
              }}
            >
              <option value="hypertrophy">Hypertrophy (Muscle Growth)</option>
              <option value="fat_loss">Fat Loss & Metabolic Rate</option>
              <option value="longevity_vitality">Longevity & Masters Vitality</option>
              <option value="athletic_power">Athletic Power & Rate of Force</option>
              <option value="general_health">Foundational Health & Energy</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
              Age (Years)
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              onFocus={selectOnFocus}
              value={age}
              onChange={e => setAge(sanitizeNumericInput(e.target.value))}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--navy)',
                border: '1px solid var(--navy-lt)',
                color: 'var(--white)',
                fontSize: 13,
                fontFamily: 'Raleway, sans-serif',
              }}
            />
          </div>

          {/* Biological Sex */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
              Biological Sex
            </label>
            <select
              value={sex}
              onChange={e => setSex(e.target.value as ClientSex)}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--navy)',
                border: '1px solid var(--navy-lt)',
                color: 'var(--white)',
                fontSize: 13,
                fontFamily: 'Raleway, sans-serif',
              }}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Fitness Level */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
              Current Level
            </label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value as FitnessLevel)}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--navy)',
                border: '1px solid var(--navy-lt)',
                color: 'var(--white)',
                fontSize: 13,
                fontFamily: 'Raleway, sans-serif',
              }}
            >
              <option value="beginner">Beginner (Foundational)</option>
              <option value="intermediate">Intermediate (Strength)</option>
              <option value="advanced_athlete">Advanced / Tier X Master</option>
            </select>
          </div>
        </div>

        {/* Prescription Medications Interactive Screening */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
          {parsedMedications.hasAnyReportedMedications && (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.35)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <GaaIcon name="shield-check" size={18} tone="emerald" />
              <div style={{ fontSize: 12, color: 'var(--white)' }}>
                <strong style={{ color: '#34D399' }}>Synced from GAA Health Profile:</strong> Active prescription medications detected{' '}
                <span style={{ color: 'var(--gold-lt)', fontFamily: 'var(--font-telemetry, monospace)' }}>
                  ({parsedMedications.rawMedicationsText || parsedMedications.detectedMedicationCategories.join(', ')})
                </span>
                . Contraindication shield &amp; timing intervals applied automatically.
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              2. Prescription Medication &amp; Drug Interaction Screening
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray)' }}>
              {parsedMedications.hasAnyReportedMedications
                ? 'Pre-populated from your intake form · Adjust as needed'
                : 'Check all that apply for automatic safety adjustments'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingAnticoagulants ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingAnticoagulants ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingAnticoagulants}
                onChange={e => setTakingAnticoagulants(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Blood Thinners:</strong> Warfarin, Eliquis, Xarelto, Plavix, Aspirin</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingAntihypertensives ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingAntihypertensives ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingAntihypertensives}
                onChange={e => setTakingAntihypertensives(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Blood Pressure:</strong> Lisinopril, Losartan, Metoprolol, Diuretics</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingThyroidHormone ? 'rgba(197,160,89,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingThyroidHormone ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingThyroidHormone}
                onChange={e => setTakingThyroidHormone(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Thyroid Hormone:</strong> Levothyroxine / Synthroid, Cytomel</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingStatins ? 'rgba(52,211,153,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingStatins ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingStatins}
                onChange={e => setTakingStatins(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Statins (Cholesterol):</strong> Lipitor, Crestor, Simvastatin</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingAntidepressants ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingAntidepressants ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingAntidepressants}
                onChange={e => setTakingAntidepressants(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Antidepressants:</strong> SSRIs / SNRIs (Zoloft, Lexapro, Cymbalta)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingDiabetesMedications ? 'rgba(52,211,153,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingDiabetesMedications ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingDiabetesMedications}
                onChange={e => setTakingDiabetesMedications(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Diabetes / GLP-1:</strong> Metformin, Ozempic, Mounjaro, Insulin</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingOralAntibiotics ? 'rgba(197,160,89,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingOralAntibiotics ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingOralAntibiotics}
                onChange={e => setTakingOralAntibiotics(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Oral Antibiotics:</strong> Ciprofloxacin, Doxycycline</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingImmunosuppressantsOrSteroids ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingImmunosuppressantsOrSteroids ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={takingImmunosuppressantsOrSteroids}
                onChange={e => setTakingImmunosuppressantsOrSteroids(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Steroids / Immunosuppressants:</strong> Prednisone, Tacrolimus</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: hasKidneyCondition ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: hasKidneyCondition ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={hasKidneyCondition}
                onChange={e => setHasKidneyCondition(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Renal / Kidney:</strong> Reduced eGFR or Kidney Condition</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: isPregnantOrNursing ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: isPregnantOrNursing ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={isPregnantOrNursing}
                onChange={e => setIsPregnantOrNursing(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Pregnancy:</strong> Pregnant or Lactating</span>
            </label>
          </div>
        </div>
      </div>

      {/* Pharmacological Drug-Supplement Interaction & Safety Shield Banner */}
      {stack.drugInteractions.length > 0 && (
        <div style={{ background: 'rgba(14,23,36,0.9)', border: '1px solid var(--gold)', padding: 20, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: 'var(--gold-lt)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="shield-check" size={14} tone="gold" />
              Active Pharmacological Drug-Supplement Safety Analysis ({stack.drugInteractions.length} Interacting Categories)
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(197,160,89,0.2)', color: 'var(--gold-lt)', border: '1px solid var(--gold)' }}>
              Clinical Pharmacokinetics Verified
            </span>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {stack.drugInteractions.map((interaction: DrugSupplementInteractionAlert, idx: number) => {
              const isCrit = interaction.severity === 'CRITICAL_CONTRAINDICATION'
              const isChrono = interaction.severity === 'CHRONO_SEPARATION_REQUIRED'

              const badgeBg = isCrit ? 'rgba(248,113,113,0.15)' : isChrono ? 'rgba(197,160,89,0.15)' : 'rgba(52,211,153,0.15)'
              const badgeColor = isCrit ? 'var(--error)' : isChrono ? 'var(--gold-lt)' : 'var(--success)'

              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(8,14,20,0.6)',
                    padding: 14,
                    border: `1px solid ${isCrit ? 'rgba(248,113,113,0.3)' : isChrono ? 'rgba(197,160,89,0.3)' : 'rgba(52,211,153,0.3)'}`,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: 14 }}>
                      {interaction.medicationCategory}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}` }}>
                      {interaction.severity.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                    <strong>Pharmacological Mechanism:</strong> {interaction.pharmacologicalRationale}
                  </p>

                  <div style={{ fontSize: 12, color: isCrit ? '#ff8787' : isChrono ? 'var(--gold-lt)' : 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <GaaIcon name="chevron-right" size={12} tone={isCrit ? 'ruby' : isChrono ? 'gold' : 'emerald'} />
                    Action Taken: {interaction.actionDirective}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mandatory Chrono-Separation Timing Rules Box */}
      {stack.chronoSeparationRules.length > 0 && (
        <div style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid var(--gold)', padding: 16, display: 'grid', gap: 6 }}>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="watch" size={13} tone="gold" /> Mandatory Chrono-Separation Timing Windows
          </div>
          {stack.chronoSeparationRules.map((rule, idx) => (
            <div key={idx} style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.5 }}>
              • {rule}
            </div>
          ))}
        </div>
      )}

      {/* 4-Window Chrono-Nutrition Timeline Filter */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
            Daily Chrono-Nutrition Timing Protocol ({displayedItems.length} Safe Compounds)
          </h4>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all' as const, label: 'All Daily', icon: null },
              { key: 'morning_with_breakfast' as const, label: 'Morning', icon: 'sun' as const },
              { key: 'pre_workout_45min' as const, label: 'Pre-Workout', icon: 'lightning' as const },
              { key: 'post_workout_anabolic' as const, label: 'Post-Workout', icon: 'drink' as const },
              { key: 'night_pre_sleep' as const, label: 'Bedtime', icon: 'moon' as const },
            ].map(tab => {
              const active = selectedTimingFilter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedTimingFilter(tab.key)}
                  className="tactile-btn"
                  style={{
                    padding: '6px 12px',
                    background: active ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                    color: active ? 'var(--navy)' : 'var(--white)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {tab.icon && (
                    <GaaIcon
                      name={tab.icon}
                      size={13}
                      tone={active ? 'dark' : 'slate'}
                    />
                  )}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Prescribed Items Grid */}
        <div style={{ display: 'grid', gap: 14 }}>
          {displayedItems.map((item: PrescribedSupplementItem) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '20px 22px',
                display: 'grid',
                gap: 10,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: item.evidenceTier.includes('Tier A') ? 'rgba(52,211,153,0.15)' : 'rgba(197,160,89,0.15)',
                        border: `1px solid ${item.evidenceTier.includes('Tier A') ? 'var(--success)' : 'var(--gold)'}`,
                        color: item.evidenceTier.includes('Tier A') ? 'var(--success)' : 'var(--gold-lt)',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.evidenceTier.split(' ')[0]} {item.evidenceTier.split(' ')[1]}
                    </span>
                    {item.isBeneficialCoPrescription && (
                      <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(52,211,153,0.2)', color: 'var(--success)', border: '1px solid var(--success)', fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <GaaIcon name="gem" size={11} tone="emerald" /> Beneficial Co-Prescription
                      </span>
                    )}
                    {item.isConditionalOrMastersOnly && (
                      <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.08)', color: 'var(--gray)', textTransform: 'uppercase' }}>
                        Contextual / Masters
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <GaaIcon name="watch" size={12} tone="gold" /> Timing: {item.timingLabel}
                  </div>

                  {item.chronoSeparationNote && (
                    <div style={{ fontSize: 11, color: '#ffc107', marginTop: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GaaIcon name="alert-triangle" size={12} tone="amber" /> {item.chronoSeparationNote}
                    </div>
                  )}

                  {item.warningNote && (
                    <div style={{ fontSize: 11, color: '#ff8787', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GaaIcon name="info" size={12} tone="ruby" /> {item.warningNote}
                    </div>
                  )}
                </div>

                <div className="tabular-nums" style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Clinical Target Dosage</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>
                    {item.optimalDosage}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, background: 'rgba(8,14,20,0.5)', padding: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong>Biological Mechanism:</strong> {item.biologicalMechanism}
              </div>

              {item.recommendedBrand && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'rgba(212,160,23,0.08)', padding: '10px 14px', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 6 }}>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>Clinical Partner Formulation</span>
                    <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700 }}>{item.recommendedBrand}® ({item.dispensarySku})</div>
                    <div style={{ fontSize: 11, color: 'var(--gold-lt)', marginTop: 2 }}>
                      Client Price: <strong>{item.clientDiscountPrice}</strong>{' '}
                      <span style={{ textDecoration: 'line-through', color: 'var(--gray)', fontSize: 10 }}>{item.retailPriceEstimate}</span>
                    </div>
                  </div>
                  <a
                    href={item.dispensaryUrl || 'https://us.fullscript.com/welcome/gordonathletic'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tactile-btn"
                    style={{
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                      color: '#080E14',
                      padding: '7px 14px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Order from Dispensary (15% Off) →
                  </a>
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="book" size={13} tone="slate" /> <em>{item.clinicalEvidenceSummary}</em>
                </span>
                <span style={{ color: 'var(--gold-lt)', fontSize: 11 }}>[{item.issnCitation}]</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Enforcement & Mandatory FDA Disclaimer */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(197,160,89,0.3)', padding: 16 }}>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="shield-check" size={13} tone="gold" /> {stack.thirdPartyQualityStandards.split(':')[0]}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
            {stack.thirdPartyQualityStandards.split(':').slice(1).join(':')}
          </p>
        </div>

        <div style={{ background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(255,255,255,0.08)', padding: 16 }}>
          <div style={{ color: 'var(--gray)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="scale" size={12} tone="slate" /> Mandatory FDA & Prescription Drug Interaction Disclaimer
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            {stack.legalDisclaimer}
          </p>
        </div>
      </div>
    </div>
  )
}
