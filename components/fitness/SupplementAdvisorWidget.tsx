'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  generateSupplementStack,
  SupplementGoal,
  ClientSex,
  FitnessLevel,
  TimingWindow,
  RoutineTier,
  PrescribedSupplementItem,
  DrugSupplementInteractionAlert,
  getDispensaryPartnerInfo,
  isThorneAccountLinked,
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

type ActiveFilterMode =
  | 'all'
  | RoutineTier
  | TimingWindow

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

  const [activeFilter, setActiveFilter] = useState<ActiveFilterMode>('all')

  const dispensaryInfo = useMemo(() => getDispensaryPartnerInfo(), [])

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

  const displayedItems = useMemo(() => {
    if (activeFilter === 'all') return stack.prescribedItems
    if (activeFilter === 'daily_core') return stack.tieredSchedule.dailyCore
    if (activeFilter === 'workout_days') return stack.tieredSchedule.workoutDays
    if (activeFilter === 'conditional_adjunct') return stack.tieredSchedule.conditionalAdjuncts
    return stack.prescribedItems.filter(i => i.timingWindow === activeFilter)
  }, [activeFilter, stack])

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* ── 1. WIDGET HEADER & TITANIUM SAFETY SHIELD ──────────────────────── */}
      <div className="glass-card" style={{ padding: '24px 28px', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
                  borderRadius: 4,
                }}
              >
                ISSN &amp; IOC Tier A/B Gold Standard
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>
                Precision Nutrition &amp; Medication Safety Engine
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '8px 0 0',
                color: 'var(--white)',
              }}
            >
              Precision Performance Supplementation Guide
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                borderRadius: 4,
              }}
            >
              ✓ NSF / USP Certified Standards
            </div>

            <div
              style={{
                padding: '6px 14px',
                background: isThorneAccountLinked ? 'rgba(52,211,153,0.12)' : 'rgba(197,160,89,0.12)',
                border: isThorneAccountLinked ? '1px solid var(--success)' : '1px solid rgba(197,160,89,0.4)',
                color: isThorneAccountLinked ? 'var(--success)' : 'var(--gold-lt)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 4,
              }}
            >
              {isThorneAccountLinked ? 'Thorne Linked (15% Off)' : 'Thorne Setup In Progress'}
            </div>
          </div>
        </div>

        {/* ⚠️ CRITICAL TITANIUM SAFETY DIRECTIVE: DO NOT TAKE ALL SUPPLEMENTS AT ONCE */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(13,27,42,0.92) 100%)',
            border: '1.5px solid var(--gold)',
            borderRadius: 8,
            padding: '16px 20px',
            display: 'grid',
            gap: 8,
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold-lt)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <GaaIcon name="alert-triangle" size={16} tone="gold" />
            <span>Client Safety Directive: Do Not Take All Supplements At Once</span>
          </div>
          <div style={{ color: 'var(--white)', fontSize: 13, lineHeight: 1.6 }}>
            <strong>This guide is an evidence-informed options catalog, NOT a mandatory checklist.</strong> A balanced athlete routine requires only <strong>2 to 3 daily core essentials</strong>. Ergogenic recovery aids are taken <em>strictly on workout days around training</em>.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 4 }}>
            <div style={{ background: 'rgba(8,14,20,0.6)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'var(--gray-lt)' }}>
              <strong style={{ color: 'var(--gold-lt)' }}>☀️ Rest Days (Non-Training):</strong> Take only your <strong>{stack.routineSummary.dailyCoreCount} Daily Core</strong> items with meals or bedtime. Do NOT take pre-workouts, protein shakes, or intra-workout mixes.
            </div>
            <div style={{ background: 'rgba(8,14,20,0.6)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'var(--gray-lt)' }}>
              <strong style={{ color: '#34D399' }}>⚡ Workout Days:</strong> Take your {stack.routineSummary.dailyCoreCount} Daily Core items + <strong>{stack.routineSummary.workoutDaysCount} Workout Aids</strong> timed 30–45m before or within 60m after your training session.
            </div>
            <div style={{ background: 'rgba(8,14,20,0.6)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'var(--gray-lt)' }}>
              <strong style={{ color: '#60A5FA' }}>1-at-a-Time Titration:</strong> Never introduce multiple supplements on the same day. Start with ONE single compound. Wait 7–14 days before introducing the next to monitor gastrointestinal tolerance.
            </div>
          </div>
        </div>

        {/* Dispensary Status Banner */}
        <div style={{ background: 'rgba(8,14,20,0.5)', padding: '12px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--gray)' }}>
            <strong style={{ color: 'var(--white)' }}>Partner Dispensary Status: </strong>
            {isThorneAccountLinked ? (
              <span>Fullscript &amp; Thorne live with exclusive 15% athlete courtesy discount.</span>
            ) : (
              <span>
                Fullscript dispensary active with 15% discount. Thorne practitioner linking is currently in progress — athletes may browse verified formulations directly at{' '}
                <a href="https://www.thorne.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
                  Thorne.com
                </a>.
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            Purchasing supplements through dispensary links is 100% voluntary.
          </span>
        </div>
      </div>

      {/* ── 2. ATHLETE BIOMETRIC & MEDICATION SCREENING ───────────────────── */}
      <div className="glass-card-gold" style={{ padding: 22, display: 'grid', gap: 18 }}>
        <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          1. Athlete Physical Profile &amp; Goal Inputs
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
                borderRadius: 4,
              }}
            >
              <option value="hypertrophy">Hypertrophy (Muscle Growth)</option>
              <option value="fat_loss">Fat Loss &amp; Metabolic Rate</option>
              <option value="longevity_vitality">Longevity &amp; Masters Vitality</option>
              <option value="athletic_power">Athletic Power &amp; Rate of Force</option>
              <option value="general_health">Foundational Health &amp; Energy</option>
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
                borderRadius: 4,
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
                borderRadius: 4,
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
                borderRadius: 4,
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
                <strong style={{ color: '#34D399' }}>Synced from Forge Athletic Health Profile:</strong> Active prescription medications detected{' '}
                <span style={{ color: 'var(--gold-lt)', fontFamily: 'var(--font-telemetry, monospace)' }}>
                  ({parsedMedications.rawMedicationsText || parsedMedications.detectedMedicationCategories.join(', ')})
                </span>
                . Contraindication shield &amp; timing intervals applied automatically.
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              2. Prescription Medication &amp; Clinical Safety Screening
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray)' }}>
              {parsedMedications.hasAnyReportedMedications
                ? 'Pre-populated from intake · Check/uncheck to adjust safety shields'
                : 'Select all that apply for automatic pharmacological screening'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingAnticoagulants ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingAnticoagulants ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingAnticoagulants}
                onChange={e => setTakingAnticoagulants(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Blood Thinners:</strong> Warfarin, Eliquis, Xarelto, Plavix, Aspirin</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingAntihypertensives ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingAntihypertensives ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingAntihypertensives}
                onChange={e => setTakingAntihypertensives(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Blood Pressure:</strong> Lisinopril, Losartan, Metoprolol, Diuretics</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingThyroidHormone ? 'rgba(197,160,89,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingThyroidHormone ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingThyroidHormone}
                onChange={e => setTakingThyroidHormone(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Thyroid Hormone:</strong> Levothyroxine / Synthroid, Cytomel</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingStatins ? 'rgba(52,211,153,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingStatins ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingStatins}
                onChange={e => setTakingStatins(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Statins (Cholesterol):</strong> Lipitor, Crestor, Simvastatin</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingAntidepressants ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingAntidepressants ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingAntidepressants}
                onChange={e => setTakingAntidepressants(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Antidepressants:</strong> SSRIs / SNRIs (Zoloft, Lexapro, Cymbalta)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingDiabetesMedications ? 'rgba(52,211,153,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingDiabetesMedications ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingDiabetesMedications}
                onChange={e => setTakingDiabetesMedications(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Diabetes / GLP-1:</strong> Metformin, Ozempic, Mounjaro, Insulin</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingOralAntibiotics ? 'rgba(197,160,89,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingOralAntibiotics ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingOralAntibiotics}
                onChange={e => setTakingOralAntibiotics(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Oral Antibiotics:</strong> Ciprofloxacin, Doxycycline</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: takingImmunosuppressantsOrSteroids ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: takingImmunosuppressantsOrSteroids ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={takingImmunosuppressantsOrSteroids}
                onChange={e => setTakingImmunosuppressantsOrSteroids(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Steroids / Immunosuppressants:</strong> Prednisone, Tacrolimus</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: hasKidneyCondition ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: hasKidneyCondition ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <input
                type="checkbox"
                checked={hasKidneyCondition}
                onChange={e => setHasKidneyCondition(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span><strong>Renal / Kidney:</strong> Reduced eGFR or Kidney Condition</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--white)', cursor: 'pointer', background: isPregnantOrNursing ? 'rgba(248,113,113,0.15)' : 'rgba(8,14,20,0.5)', padding: '8px 12px', border: isPregnantOrNursing ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
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

      {/* ── 3. PHARMACOLOGICAL INTERACTION & CONTRAINDICATION SHIELD ───────── */}
      {stack.drugInteractions.length > 0 && (
        <div style={{ background: 'rgba(14,23,36,0.95)', border: '1.5px solid var(--gold)', borderRadius: 8, padding: 20, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: 'var(--gold-lt)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="shield-check" size={14} tone="gold" />
              Medication Safety Precautions ({stack.drugInteractions.length} Interventions Active)
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(197,160,89,0.2)', color: 'var(--gold-lt)', border: '1px solid var(--gold)', borderRadius: 3 }}>
              Physician Clearance Advised
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
                    borderRadius: 6,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: 14 }}>
                      {interaction.medicationCategory}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}`, borderRadius: 3 }}>
                      {interaction.severity.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                    <strong>Pharmacological Mechanism:</strong> {interaction.pharmacologicalRationale}
                  </p>

                  <div style={{ fontSize: 12, color: isCrit ? '#ff8787' : isChrono ? 'var(--gold-lt)' : 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <GaaIcon name="chevron-right" size={12} tone={isCrit ? 'ruby' : isChrono ? 'gold' : 'emerald'} />
                    Precautionary Action: {interaction.actionDirective}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mandatory Chrono-Separation Timing Rules Box */}
      {stack.chronoSeparationRules.length > 0 && (
        <div style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid var(--gold)', borderRadius: 8, padding: 16, display: 'grid', gap: 8 }}>
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

      {/* ── 4. DAILY ROUTINE BREAKDOWN & WHAT TO TAKE WHEN ────────────────── */}
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
              Your Tailored Daily Routine
            </h4>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              Showing {displayedItems.length} evidence-informed items · Categorized for clarity so you never over-supplement
            </div>
          </div>

          {/* Interactive Tier & Timing Filter Bar */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all' as const, label: `All (${stack.prescribedItems.length})`, icon: null },
              { key: 'daily_core' as const, label: `☀️ Daily Core (${stack.tieredSchedule.dailyCore.length})`, icon: null },
              { key: 'workout_days' as const, label: `⚡ Workout Days (${stack.tieredSchedule.workoutDays.length})`, icon: null },
              { key: 'conditional_adjunct' as const, label: `✦ Profile Specific (${stack.tieredSchedule.conditionalAdjuncts.length})`, icon: null },
              { key: 'morning_with_breakfast' as const, label: 'Morning', icon: 'sun' as const },
              { key: 'pre_workout_45min' as const, label: 'Pre-Workout', icon: 'lightning' as const },
              { key: 'post_workout_anabolic' as const, label: 'Post-Workout', icon: 'drink' as const },
              { key: 'night_pre_sleep' as const, label: 'Bedtime', icon: 'moon' as const },
            ].map(tab => {
              const active = activeFilter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className="tactile-btn"
                  style={{
                    padding: '6px 12px',
                    background: active ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                    color: active ? 'var(--navy)' : 'var(--white)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: 4,
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

        {/* ── 5. PRESCRIBED SUPPLEMENT CARDS ─────────────────────────────────── */}
        <div style={{ display: 'grid', gap: 14 }}>
          {displayedItems.map((item: PrescribedSupplementItem) => {
            const isDailyCore = item.routineTier === 'daily_core'
            const isWorkoutDay = item.routineTier === 'workout_days'
            const isThorneBrand = item.recommendedBrand?.toLowerCase() === 'thorne'

            return (
              <div
                key={item.id}
                className="glass-card"
                style={{
                  padding: '20px 22px',
                  display: 'grid',
                  gap: 12,
                  border: isDailyCore
                    ? '1.5px solid rgba(212,160,23,0.45)'
                    : isWorkoutDay
                    ? '1.5px solid rgba(52,211,153,0.35)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                }}
              >
                {/* Card Top: Badges & Routine Tier */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--white)' }}>
                        {item.name}
                      </span>

                      {/* Routine Tier Badge */}
                      <span
                        style={{
                          padding: '3px 8px',
                          background: isDailyCore
                            ? 'rgba(212,160,23,0.2)'
                            : isWorkoutDay
                            ? 'rgba(52,211,153,0.2)'
                            : 'rgba(129,140,248,0.2)',
                          border: isDailyCore
                            ? '1px solid var(--gold)'
                            : isWorkoutDay
                            ? '1px solid var(--success)'
                            : '1px solid #818CF8',
                          color: isDailyCore ? 'var(--gold-lt)' : isWorkoutDay ? '#34D399' : '#A5B4FC',
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderRadius: 3,
                        }}
                      >
                        {isDailyCore
                          ? '☀️ Tier 1: Daily Core Foundation'
                          : isWorkoutDay
                          ? '⚡ Tier 2: Workout Days Only'
                          : '✦ Tier 3: Specialized Adjunct'}
                      </span>

                      {/* NSF Verification Badge */}
                      {item.nsfCertifiedForSportRecommended && (
                        <span
                          style={{
                            padding: '2px 6px',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'var(--gray-lt)',
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            borderRadius: 3,
                          }}
                        >
                          NSF for Sport
                        </span>
                      )}

                      {item.isBeneficialCoPrescription && (
                        <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(52,211,153,0.2)', color: 'var(--success)', border: '1px solid var(--success)', fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 3 }}>
                          <GaaIcon name="gem" size={11} tone="emerald" /> Beneficial Co-Prescription
                        </span>
                      )}
                    </div>

                    {/* Frequency & Rest-Day Directive */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <GaaIcon name="watch" size={12} tone="gold" />
                        <strong>When:</strong> {item.timingLabel}
                      </span>

                      <span style={{ fontSize: 12, color: item.workoutDayOnly ? '#F87171' : '#34D399', fontWeight: 600 }}>
                        <strong>Rest Days:</strong> {item.workoutDayOnly ? '✕ Skip (Not needed)' : '✓ Take Daily'}
                      </span>
                    </div>

                    {/* Meal & Digestion Instruction */}
                    <div style={{ fontSize: 12, color: 'var(--gray-lt)', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 4, marginTop: 4 }}>
                      <strong>How to Take:</strong> {item.mealInstruction}
                    </div>

                    {item.chronoSeparationNote && (
                      <div style={{ fontSize: 11.5, color: '#ffc107', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <GaaIcon name="alert-triangle" size={12} tone="amber" /> {item.chronoSeparationNote}
                      </div>
                    )}

                    {item.warningNote && (
                      <div style={{ fontSize: 11.5, color: '#ff8787', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <GaaIcon name="info" size={12} tone="ruby" /> {item.warningNote}
                      </div>
                    )}
                  </div>

                  {/* Target Dosage */}
                  <div className="tabular-nums" style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Clinical Target Dosage
                    </div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 16, fontWeight: 700, color: 'var(--white)', marginTop: 2 }}>
                      {item.optimalDosage}
                    </div>
                  </div>
                </div>

                {/* Biological Mechanism */}
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, background: 'rgba(8,14,20,0.5)', padding: 12, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 }}>
                  <strong>Biological Mechanism:</strong> {item.biologicalMechanism}
                </div>

                {/* Recommended Brand & Dispensary Link Handling */}
                {item.recommendedBrand && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'rgba(212,160,23,0.08)', padding: '10px 14px', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 6 }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                        Recommended Pure Formulation
                      </span>
                      <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700 }}>
                        {item.recommendedBrand}® ({item.dispensarySku})
                      </div>

                      {item.clientDiscountPrice && (
                        <div style={{ fontSize: 11, color: 'var(--gold-lt)', marginTop: 2 }}>
                          Client Price: <strong>{item.clientDiscountPrice}</strong>{' '}
                          <span style={{ textDecoration: 'line-through', color: 'var(--gray)', fontSize: 10 }}>{item.retailPriceEstimate}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>· 15% Courtesy Discount</span>
                        </div>
                      )}

                      {!isThorneAccountLinked && isThorneBrand && (
                        <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>
                          Thorne dispensary link in setup · Direct catalog search provided
                        </div>
                      )}
                    </div>

                    <a
                      href={item.dispensaryUrl || (isThorneBrand ? 'https://www.thorne.com/products' : dispensaryInfo.defaultFullscriptUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tactile-btn"
                      style={{
                        background: isThorneBrand && !isThorneAccountLinked
                          ? 'rgba(255,255,255,0.08)'
                          : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                        color: isThorneBrand && !isThorneAccountLinked ? 'var(--gold-lt)' : '#080E14',
                        border: isThorneBrand && !isThorneAccountLinked ? '1px solid rgba(197,160,89,0.5)' : 'none',
                        padding: '8px 16px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isThorneBrand && !isThorneAccountLinked
                        ? 'Browse on Thorne.com →'
                        : 'Order from Dispensary (15% Off) →'}
                    </a>
                  </div>
                )}

                {/* Citation & Scientific Evidence */}
                <div style={{ fontSize: 11.5, color: 'var(--gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="book" size={13} tone="slate" /> <em>{item.clinicalEvidenceSummary}</em>
                  </span>
                  <span style={{ color: 'var(--gold-lt)', fontSize: 11 }}>[{item.issnCitation}]</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 6. TITANIUM SCOPE OF PRACTICE & MANDATORY LIABILITY FOOTER ──────── */}
      <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
        {/* Scope of Practice Notice */}
        <div style={{ background: 'rgba(8,14,20,0.85)', border: '1px solid rgba(197,160,89,0.3)', borderRadius: 8, padding: 18 }}>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="shield-check" size={14} tone="gold" />
            <span>Professional Scope of Practice &amp; Safe Harbor (NASM-CPT® &amp; CSNC Track)</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.6 }}>
            {stack.scopeOfPracticeNotice}
          </p>
        </div>

        {/* Mandatory Physician Consultation Warning */}
        <div style={{ background: 'rgba(8,14,20,0.85)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: 18 }}>
          <div style={{ color: '#F87171', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="alert-triangle" size={14} tone="ruby" />
            <span>Physician Consultation &amp; Medication Interaction Directive</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-lt)', lineHeight: 1.6 }}>
            {stack.medicalSupervisionWarning}
          </p>
        </div>

        {/* Whole-Food First & Adverse Reactions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <div style={{ background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
            <div style={{ color: 'var(--gold-lt)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Whole-Food Primacy Rule
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.5 }}>
              {stack.wholeFoodFirstNotice}
            </p>
          </div>

          <div style={{ background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
            <div style={{ color: 'var(--error)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Adverse Reaction Protocol
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.5 }}>
              {stack.discontinueAndConsultNotice}
            </p>
          </div>
        </div>

        {/* Statutory FDA & FTC Disclaimers */}
        <div style={{ background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 16 }}>
          <div style={{ color: 'var(--gray)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="scale" size={12} tone="slate" /> Mandatory FDA &amp; FTC Affiliate Disclaimers
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            {stack.legalDisclaimer}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 10.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
            {stack.ftcAffiliateDisclosure}
          </p>
        </div>
      </div>
    </div>
  )
}
