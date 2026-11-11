'use client'

import React, { useId, useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import {
  buildRagHomeGymBlueprint,
  mapProfileGoalToHomeGymGoal,
  type HomeGymBudgetTier,
  type HomeGymCeilingHeight,
  type HomeGymClientConcern,
  type HomeGymFloorLevel,
  type HomeGymHouseholdUsers,
  type HomeGymModalityPreference,
  type HomeGymPrimaryGoal,
  type HomeGymSpaceType,
  type HomeGymBuildLineItem,
  type RagHomeGymBlueprint,
} from '@/lib/rag-home-gym-builder'

export interface RagHomeGymBuilderProps {
  assessment?: NasmAssessmentRecord | null
  ownedEquipment?: string[] | null
  optPhase?: number | null
  goal?: string | null
  injuriesLimitations?: string | null
  athleteName?: string | null
  coachClientId?: string | null
}

const SPACE_OPTIONS: Array<{ value: HomeGymSpaceType; label: string; detail: string }> = [
  {
    value: 'corner_apartment',
    label: 'Compact Corner (~25–40 sq ft)',
    detail: 'Living room, bedroom, or apartment corner',
  },
  {
    value: 'spare_room_office',
    label: 'Spare Room / Office (~50–90 sq ft)',
    detail: 'Dedicated room or flex den',
  },
  {
    value: 'garage_basement',
    label: 'Garage / Basement (100+ sq ft)',
    detail: 'Full barbell & rack bay footprint',
  },
]

const CEILING_OPTIONS: Array<{ value: HomeGymCeilingHeight; label: string; detail: string }> = [
  {
    value: 'low_under_84in',
    label: 'Low (< 7 ft / < 84")',
    detail: 'Older basement joists or attic',
  },
  {
    value: 'standard_84_to_95in',
    label: 'Standard (7\'0" – 7\'11")',
    detail: 'Fits 80.7" Adonis™ & 84" PR-1100',
  },
  {
    value: 'tall_96in_plus',
    label: '8 ft+ Ceiling (96"+)',
    detail: 'Fits full 93" PR-4000 & standing OHP',
  },
]

const FLOOR_OPTIONS: Array<{ value: HomeGymFloorLevel; label: string }> = [
  { value: 'ground_slab', label: 'Ground-Level Concrete / Garage Slab' },
  { value: 'upper_floor_wood_condo', label: 'Upper-Floor Apartment / Suspended Wood Subfloor' },
]

const BUDGET_OPTIONS: Array<{ value: HomeGymBudgetTier; label: string; detail: string }> = [
  { value: 'essential_under_750', label: 'Essential (< $750)', detail: 'Core CEx + bench/accessory start' },
  { value: 'studio_1500', label: 'Home Studio ($1,500)', detail: 'QuickDraw™ DBs + Bench + KB + CEx' },
  { value: 'functional_3000', label: 'Functional Suite ($3,000)', detail: 'Unlocks Cable Tower or Rack + Bar' },
  { value: 'sanctuary_5000', label: 'Full Sanctuary ($5,000)', detail: 'Complete Rack, Cable, DB & CEx Gym' },
]

const USER_OPTIONS: Array<{ value: HomeGymHouseholdUsers; label: string }> = [
  { value: 'solo_athlete', label: 'Just Me (Solo Athlete)' },
  { value: 'couple_shared', label: '2 Users (Partner / Spouse)' },
  { value: 'family_multi_user', label: 'Whole Household (3+ Users)' },
]

const GOAL_OPTIONS: Array<{ value: HomeGymPrimaryGoal; label: string }> = [
  { value: 'fat_loss', label: 'Fat Loss & Metabolic Conditioning (OPT™ Phases 1–2)' },
  { value: 'hypertrophy', label: 'Hypertrophy & Physique Development (OPT™ Phase 3)' },
  { value: 'maximal_strength', label: 'Maximal Compound Strength (OPT™ Phase 4)' },
  { value: 'athletic_power', label: 'Explosive Athletic Power & Conditioning (OPT™ Phase 5)' },
  { value: 'posture_longevity', label: 'Posture Restoration, Joint Health & Longevity (NASM-CES)' },
  { value: 'golf_rotational', label: 'Rotational Power & Thoracic Mobility (Golf / Court Sports)' },
]

const MODALITY_OPTIONS: Array<{ value: HomeGymModalityPreference; label: string }> = [
  { value: 'dumbbells_bench', label: 'Adjustable Dumbbells & Multi-Angle Bench' },
  { value: 'cables_functional', label: 'Functional Pulley / Cable Vector Training' },
  { value: 'barbell_rack', label: 'Barbell, Bumper Plates & Enclosed Power Rack' },
  { value: 'kettlebell_conditioning', label: 'Kettlebell Swings, Carries & Conditioning' },
  { value: 'corrective_mobility', label: 'Clinical Shoulder, Hip & SMR Pre-Hab Suite' },
]

const CONCERN_OPTIONS: Array<{ value: HomeGymClientConcern; label: string }> = [
  { value: 'apartment_noise', label: 'Minimize Noise & Vibration (Neighbors Below)' },
  { value: 'floor_protection', label: 'Protect Hardwood / Tile / Finished Subfloor' },
  { value: 'solo_safety', label: 'Lifting Solo Without a Spotter' },
  { value: 'minimal_clutter', label: 'Keep Room Clean & Clutter-Free' },
  { value: 'joint_friendly', label: 'Shoulder, Knee, or Lower-Back Friendly Ergonomics' },
]

export default function RagHomeGymBuilder({
  assessment = null,
  ownedEquipment = null,
  optPhase = null,
  goal = null,
  injuriesLimitations = null,
  athleteName = null,
  coachClientId = null,
}: RagHomeGymBuilderProps) {
  const uid = useId()
  const initialGoal = mapProfileGoalToHomeGymGoal(goal)

  const [spaceType, setSpaceType] = useState<HomeGymSpaceType>('spare_room_office')
  const [ceilingHeight, setCeilingHeight] = useState<HomeGymCeilingHeight>('standard_84_to_95in')
  const [floorLevel, setFloorLevel] = useState<HomeGymFloorLevel>('ground_slab')
  const [budgetTier, setBudgetTier] = useState<HomeGymBudgetTier>('studio_1500')
  const [customBudgetRaw, setCustomBudgetRaw] = useState<string>('')
  const [budgetError, setBudgetError] = useState<string>('')
  const [primaryGoal, setPrimaryGoal] = useState<HomeGymPrimaryGoal>(initialGoal)
  const [householdUsers, setHouseholdUsers] = useState<HomeGymHouseholdUsers>('solo_athlete')
  const [preferredModalities, setPreferredModalities] = useState<HomeGymModalityPreference[]>([
    'dumbbells_bench',
    'corrective_mobility',
  ])
  const [concerns, setConcerns] = useState<HomeGymClientConcern[]>(['minimal_clutter'])

  const [blueprint, setBlueprint] = useState<RagHomeGymBlueprint>(() =>
    buildRagHomeGymBlueprint({
      athleteName,
      spaceType: 'spare_room_office',
      ceilingHeight: 'standard_84_to_95in',
      floorLevel: 'ground_slab',
      budgetTier: 'studio_1500',
      primaryGoal: initialGoal,
      householdUsers: 'solo_athlete',
      preferredModalities: ['dumbbells_bench', 'corrective_mobility'],
      concerns: ['minimal_clutter'],
      assessment,
      ownedEquipment,
      optPhase,
      injuriesLimitations,
    })
  )

  const [statusMessage, setStatusMessage] = useState<string>('')
  const [copiedSku, setCopiedSku] = useState<string | null>(null)
  const [coachNote, setCoachNote] = useState<string>('')
  const [isSendingToInbox, setIsSendingToInbox] = useState<boolean>(false)

  if (!blueprint.isEnabled) {
    return null
  }

  const toggleModality = (mod: HomeGymModalityPreference) => {
    setPreferredModalities(prev =>
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    )
  }

  const toggleConcern = (c: HomeGymClientConcern) => {
    setConcerns(prev => (prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]))
  }

  const validateCustomBudget = (raw: string): number | null | 'invalid' => {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const cleaned = trimmed.replace(/[$,\s]/g, '')
    if (!/^\d+$/.test(cleaned)) return 'invalid'
    const num = Number(cleaned)
    if (num < 150 || num > 15000) return 'invalid'
    return num
  }

  const handleBudgetBlur = () => {
    const res = validateCustomBudget(customBudgetRaw)
    if (res === 'invalid') {
      setBudgetError('Enter a whole dollar amount between 150 and 15000, or leave blank to use your selected tier.')
    }
  }

  const handleGenerateBlueprint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsedBudget = validateCustomBudget(customBudgetRaw)
    if (parsedBudget === 'invalid') {
      setBudgetError('Enter a whole dollar amount between 150 and 15000, or leave blank to use your selected tier.')
      const el = document.getElementById(`${uid}-custom-budget`)
      el?.focus()
      return
    }

    const next = buildRagHomeGymBlueprint({
      athleteName,
      spaceType,
      ceilingHeight,
      floorLevel,
      budgetTier,
      customMaxBudgetUsd: parsedBudget,
      primaryGoal,
      householdUsers,
      preferredModalities,
      concerns,
      assessment,
      ownedEquipment,
      optPhase,
      injuriesLimitations,
    })
    setBlueprint(next)
    setStatusMessage(
      `Updated RAG Home-Gym Blueprint: ${next.phase1ImmediateBuild.length} Phase 1 items (${next.phase1MemberFormatted}) unlocking ${next.optUnlockPercentage}% of NASM OPT™ capabilities.`
    )
  }

  const handleSendToAthleteInbox = async () => {
    if (!coachClientId || isSendingToInbox) return
    const parsedBudget = validateCustomBudget(customBudgetRaw)
    if (parsedBudget === 'invalid') {
      setBudgetError('Enter a whole dollar amount between 150 and 15000, or leave blank to use your selected tier.')
      return
    }

    setIsSendingToInbox(true)
    setStatusMessage('')
    try {
      const res = await fetch(`/api/coach/clients/${coachClientId}/home-gym-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceType,
          ceilingHeight,
          floorLevel,
          budgetTier,
          customMaxBudgetUsd: parsedBudget,
          primaryGoal,
          householdUsers,
          preferredModalities,
          concerns,
          sendToAthleteInbox: true,
          customCoachNote: coachNote,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatusMessage(json?.error || 'Unable to send blueprint to athlete inbox.')
      } else {
        if (json.blueprint) {
          setBlueprint(json.blueprint)
        }
        setStatusMessage(
          `✓ Dispatched custom Home-Gym Blueprint directly to ${athleteName || 'athlete'}'s Concierge Inbox.`
        )
      }
    } catch {
      setStatusMessage('Network error while sending blueprint to athlete inbox.')
    } finally {
      setIsSendingToInbox(false)
    }
  }

  const handleCopyPromoCode = async (sku: string, code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code)
        setCopiedSku(sku)
        setTimeout(() => {
          setCopiedSku(current => (current === sku ? null : current))
        }, 2200)
      }
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {/* ── 1. NASM HGD DISCOVERY & SITE NEEDS FORM ─────────────────────────── */}
      <section className="glass-card" style={{ padding: '24px 26px', display: 'grid', gap: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '3px 9px',
                background: 'rgba(212, 160, 23, 0.16)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(212, 160, 23, 0.45)',
                borderRadius: 4,
              }}
            >
              NASM HGD RAG Architect
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(56, 189, 248, 0.14)',
                color: '#7DD3FC',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                letterSpacing: '0.06em',
              }}
            >
              SPACE · CEILING · ACOUSTICS · ORTHOPEDICS · BUDGET
            </span>
          </div>

          <h4
            id={`${uid}-form-heading`}
            style={{
              margin: '8px 0 4px',
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--white)',
              letterSpacing: '0.03em',
            }}
          >
            Custom Home-Gym Needs &amp; Site Discovery Builder
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.55, maxWidth: 820 }}>
            Powered by Forge Athletic&apos;s NASM Home Gym Design (HGD) &amp; OPT™ RAG Knowledge Base. Enter your room dimensions, ceiling clearance, budget, and training priorities to synthesize a conflict-free buildout across <strong>REP Fitness</strong>, <strong>Crossover Symmetry</strong>, and <strong>Perform Better</strong>.
          </p>
        </div>

        <form
          aria-labelledby={`${uid}-form-heading`}
          action="/api/fitness/home-gym-builder"
          method="POST"
          onSubmit={handleGenerateBlueprint}
          style={{ display: 'grid', gap: 20 }}
          noValidate
        >
          {/* Primary Goal Select (6 options -> <select> per decision matrix) */}
          <div style={{ display: 'grid', gap: 6 }}>
            <label
              htmlFor={`${uid}-primary-goal`}
              style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--white)', letterSpacing: '0.03em' }}
            >
              1. Primary Short &amp; Long-Term Training Goal
            </label>
            <select
              id={`${uid}-primary-goal`}
              name="primaryGoal"
              value={primaryGoal}
              onChange={e => setPrimaryGoal(e.target.value as HomeGymPrimaryGoal)}
              className="forge-hgb-control"
              style={{
                font: 'inherit',
                fontSize: 'max(1rem, 1em)',
                minHeight: 48,
                padding: '10px 14px',
                borderRadius: 7,
                background: 'rgba(8, 14, 24, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.24)',
                color: '#FFFFFF',
                boxSizing: 'border-box',
              }}
            >
              {GOAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Space & Ceiling Grid (3 options each -> visible radios inside <fieldset><legend>) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 16,
            }}
          >
            <fieldset
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'grid',
                gap: 8,
              }}
            >
              <legend style={{ padding: '0 6px', fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
                2. Available Floor Space
              </legend>
              {SPACE_OPTIONS.map(opt => {
                const id = `${uid}-space-${opt.value}`
                return (
                  <div
                    key={opt.value}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 48, padding: '4px 0' }}
                  >
                    <input
                      type="radio"
                      id={id}
                      name="spaceType"
                      value={opt.value}
                      checked={spaceType === opt.value}
                      onChange={() => setSpaceType(opt.value)}
                      className="forge-hgb-radio"
                      style={{ marginTop: 4, width: 18, height: 18, accentColor: '#D4A017', flexShrink: 0 }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer', lineHeight: 1.35 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                        {opt.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--gray)' }}>{opt.detail}</span>
                    </label>
                  </div>
                )
              })}
            </fieldset>

            <fieldset
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'grid',
                gap: 8,
              }}
            >
              <legend style={{ padding: '0 6px', fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
                3. Ceiling Height Clearance
              </legend>
              {CEILING_OPTIONS.map(opt => {
                const id = `${uid}-ceiling-${opt.value}`
                return (
                  <div
                    key={opt.value}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 48, padding: '4px 0' }}
                  >
                    <input
                      type="radio"
                      id={id}
                      name="ceilingHeight"
                      value={opt.value}
                      checked={ceilingHeight === opt.value}
                      onChange={() => setCeilingHeight(opt.value)}
                      className="forge-hgb-radio"
                      style={{ marginTop: 4, width: 18, height: 18, accentColor: '#D4A017', flexShrink: 0 }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer', lineHeight: 1.35 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                        {opt.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--gray)' }}>{opt.detail}</span>
                    </label>
                  </div>
                )
              })}
            </fieldset>
          </div>

          {/* Floor Substrate & Household Users */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 16,
            }}
          >
            <fieldset
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'grid',
                gap: 8,
              }}
            >
              <legend style={{ padding: '0 6px', fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
                4. Installation Floor &amp; Subfloor
              </legend>
              {FLOOR_OPTIONS.map(opt => {
                const id = `${uid}-floor-${opt.value}`
                return (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48 }}>
                    <input
                      type="radio"
                      id={id}
                      name="floorLevel"
                      value={opt.value}
                      checked={floorLevel === opt.value}
                      onChange={() => setFloorLevel(opt.value)}
                      className="forge-hgb-radio"
                      style={{ width: 18, height: 18, accentColor: '#D4A017', flexShrink: 0 }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                      {opt.label}
                    </label>
                  </div>
                )
              })}
            </fieldset>

            <fieldset
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'grid',
                gap: 8,
              }}
            >
              <legend style={{ padding: '0 6px', fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
                5. Who Will Use the Home Gym?
              </legend>
              {USER_OPTIONS.map(opt => {
                const id = `${uid}-users-${opt.value}`
                return (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48 }}>
                    <input
                      type="radio"
                      id={id}
                      name="householdUsers"
                      value={opt.value}
                      checked={householdUsers === opt.value}
                      onChange={() => setHouseholdUsers(opt.value)}
                      className="forge-hgb-radio"
                      style={{ width: 18, height: 18, accentColor: '#D4A017', flexShrink: 0 }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                      {opt.label}
                    </label>
                  </div>
                )
              })}
            </fieldset>
          </div>

          {/* Budget Stratification (4 visible radios + optional exact USD override) */}
          <fieldset
            style={{
              margin: 0,
              padding: 14,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.14)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'grid',
              gap: 12,
            }}
          >
            <legend style={{ padding: '0 6px', fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
              6. Phase 1 Project Budget Target
            </legend>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: 10,
              }}
            >
              {BUDGET_OPTIONS.map(opt => {
                const id = `${uid}-budget-${opt.value}`
                return (
                  <div
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      minHeight: 48,
                      padding: '8px 10px',
                      borderRadius: 6,
                      border:
                        budgetTier === opt.value && !customBudgetRaw.trim()
                          ? '1px solid rgba(212, 160, 23, 0.55)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      background:
                        budgetTier === opt.value && !customBudgetRaw.trim()
                          ? 'rgba(212, 160, 23, 0.1)'
                          : 'rgba(8, 14, 24, 0.6)',
                    }}
                  >
                    <input
                      type="radio"
                      id={id}
                      name="budgetTier"
                      value={opt.value}
                      checked={budgetTier === opt.value}
                      onChange={() => setBudgetTier(opt.value)}
                      className="forge-hgb-radio"
                      style={{ marginTop: 4, width: 18, height: 18, accentColor: '#D4A017', flexShrink: 0 }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer', lineHeight: 1.35 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: '#FFFFFF' }}>
                        {opt.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--gray)' }}>{opt.detail}</span>
                    </label>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gap: 4, maxWidth: 360 }}>
              <label
                htmlFor={`${uid}-custom-budget`}
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}
              >
                Optional Exact Budget Cap (USD, $150–$15,000):
              </label>
              <input
                type="text"
                id={`${uid}-custom-budget`}
                name="customMaxBudgetUsd"
                inputMode="numeric"
                enterKeyHint="done"
                value={customBudgetRaw}
                aria-invalid={budgetError ? 'true' : undefined}
                aria-describedby={`${uid}-budget-hint`}
                onBlur={handleBudgetBlur}
                onChange={e => {
                  setCustomBudgetRaw(e.target.value)
                  if (budgetError) setBudgetError('')
                }}
                placeholder="e.g. 2200"
                className="forge-hgb-control"
                style={{
                  font: 'inherit',
                  fontSize: 'max(1rem, 1em)',
                  minHeight: 48,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(8, 14, 24, 0.9)',
                  border: budgetError
                    ? '1px solid #F87171'
                    : '1px solid rgba(255, 255, 255, 0.24)',
                  color: '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
              <span
                id={`${uid}-budget-hint`}
                style={{ fontSize: 11, color: budgetError ? '#FCA5A5' : 'var(--gray)' }}
              >
                {budgetError || 'Leave blank to use your selected tier above. Already-owned gear is credited at $0.'}
              </span>
            </div>
          </fieldset>

          {/* Multi-Select Checkboxes: Modalities & Concerns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 16,
            }}
          >
            <fieldset
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'grid',
                gap: 6,
              }}
            >
              <legend style={{ padding: '0 6px', fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
                7. Preferred Training Modalities
              </legend>
              {MODALITY_OPTIONS.map(opt => {
                const id = `${uid}-mod-${opt.value}`
                const checked = preferredModalities.includes(opt.value)
                return (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48 }}>
                    <input
                      type="checkbox"
                      id={id}
                      name="preferredModalities"
                      value={opt.value}
                      checked={checked}
                      onChange={() => toggleModality(opt.value)}
                      className="forge-hgb-radio"
                      style={{ width: 18, height: 18, accentColor: '#D4A017', flexShrink: 0 }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer', fontSize: 12.5, color: '#FFFFFF', fontWeight: 600 }}>
                      {opt.label}
                    </label>
                  </div>
                )
              })}
            </fieldset>

            <fieldset
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'grid',
                gap: 6,
              }}
            >
              <legend style={{ padding: '0 6px', fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
                8. Home-Gym Concerns &amp; Constraints
              </legend>
              {CONCERN_OPTIONS.map(opt => {
                const id = `${uid}-concern-${opt.value}`
                const checked = concerns.includes(opt.value)
                return (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48 }}>
                    <input
                      type="checkbox"
                      id={id}
                      name="concerns"
                      value={opt.value}
                      checked={checked}
                      onChange={() => toggleConcern(opt.value)}
                      className="forge-hgb-radio"
                      style={{ width: 18, height: 18, accentColor: '#D4A017', flexShrink: 0 }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer', fontSize: 12.5, color: '#FFFFFF', fontWeight: 600 }}>
                      {opt.label}
                    </label>
                  </div>
                )
              })}
            </fieldset>
          </div>

          {coachClientId && (
            <div style={{ display: 'grid', gap: 6 }}>
              <label
                htmlFor={`${uid}-coach-note`}
                style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}
              >
                Optional Coach Setup Note (Included When Dispatched to Athlete Inbox)
              </label>
              <textarea
                id={`${uid}-coach-note`}
                name="customCoachNote"
                rows={2}
                value={coachNote}
                onChange={e => setCoachNote(e.target.value)}
                placeholder="e.g. Start with the QuickDraw dumbbells, AB-3000 bench, and Crossover Symmetry door cords—we can add the Adonis tower in Mesocycle 2."
                className="forge-hgb-control"
                style={{
                  font: 'inherit',
                  fontSize: 'max(1rem, 1em)',
                  padding: '10px 12px',
                  borderRadius: 7,
                  background: 'rgba(8, 14, 24, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.24)',
                  color: '#FFFFFF',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="forge-hgb-control"
              style={{
                minHeight: 48,
                padding: '12px 22px',
                borderRadius: 7,
                border: 'none',
                background: 'linear-gradient(135deg, var(--gold, #D4A017) 0%, var(--gold-lt, #F3D27A) 100%)',
                color: '#080E14',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 13.5,
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
              }}
            >
              Generate Custom RAG Home-Gym Blueprint
            </button>

            {coachClientId && (
              <button
                type="button"
                disabled={isSendingToInbox}
                onClick={handleSendToAthleteInbox}
                className="forge-hgb-control"
                style={{
                  minHeight: 48,
                  padding: '12px 18px',
                  borderRadius: 7,
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  background: 'rgba(52, 211, 153, 0.14)',
                  color: '#34D399',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isSendingToInbox ? 'wait' : 'pointer',
                }}
              >
                {isSendingToInbox
                  ? 'Sending Blueprint...'
                  : `Send Blueprint to ${athleteName || 'Athlete'}'s Inbox`}
              </button>
            )}

            <div
              role="status"
              aria-live="polite"
              style={{ fontSize: 12.5, color: '#34D399', fontWeight: 700 }}
            >
              {statusMessage}
            </div>
          </div>
        </form>
      </section>

      {/* ── 2. GENERATED BLUEPRINT SUMMARY & OPT UNLOCK SCORE ─────────────────── */}
      <section
        aria-labelledby={`${uid}-blueprint-heading`}
        className="glass-card"
        style={{ padding: '24px 26px', display: 'grid', gap: 18 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ maxWidth: 740 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Synthesized Procurement &amp; Architecture Plan
            </div>
            <h4
              id={`${uid}-blueprint-heading`}
              style={{
                margin: '6px 0 6px',
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              {blueprint.blueprintTitle}
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55 }}>
              {blueprint.architectSummaryMemo}
            </p>
          </div>

          <div
            className="tabular-nums"
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: 'rgba(212, 160, 23, 0.1)',
                border: '1px solid rgba(212, 160, 23, 0.4)',
                minWidth: 185,
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                Phase 1 Buildout ({blueprint.phase1ImmediateBuild.length} Items)
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 21, fontWeight: 800, color: '#FFFFFF', marginTop: 3 }}>
                {blueprint.phase1MemberFormatted}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                Budget Headroom: <strong style={{ color: '#34D399' }}>{blueprint.remainingBudgetHeadroomFormatted}</strong>
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                minWidth: 175,
              }}
            >
              <div style={{ fontSize: 10, color: '#34D399', textTransform: 'uppercase', fontWeight: 800 }}>
                OPT™ Phases 1–5 Coverage
              </div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 21, fontWeight: 800, color: '#FFFFFF', marginTop: 3 }}>
                {blueprint.optUnlockPercentage}% Unlocked
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                {blueprint.unlockedCapabilitySummary}
              </div>
            </div>
          </div>
        </div>

        {/* Unlocked Movement Families */}
        {blueprint.unlockedMovementFamilies.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {blueprint.unlockedMovementFamilies.map(fam => (
              <span
                key={fam}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.28)',
                  color: '#A7F3D0',
                }}
              >
                ✓ {fam}
              </span>
            ))}
          </div>
        )}

        {/* Already-Owned Credited Assets */}
        {blueprint.ownedCoreAssets.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(52, 211, 153, 0.07)',
              border: '1px solid rgba(52, 211, 153, 0.28)',
              fontSize: 12.5,
              color: '#D1FAE5',
            }}
          >
            <strong>Credited From Your Equipment Profile ($0.00 Spend):</strong>{' '}
            {blueprint.ownedCoreAssets.map(i => i.name).join(' · ')}
          </div>
        )}

        {/* Phase 1 Immediate Buildout Grid */}
        <div style={{ display: 'grid', gap: 12 }}>
          <h5 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Phase 1 · Immediate Prescribed Buildout (Within {blueprint.resolvedBudgetFormatted} Cap)
          </h5>

          {blueprint.phase1ImmediateBuild.length === 0 ? (
            <div style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: 'var(--gray)', fontSize: 13 }}>
              Your existing equipment already covers every foundational item within this budget tier. Increase your budget cap or inspect Phase 2 upgrades below.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
                gap: 14,
              }}
            >
              {blueprint.phase1ImmediateBuild.map(item => (
                <BuilderLineItemCard
                  key={item.id}
                  item={item}
                  phaseBadge="Phase 1 Core"
                  copiedSku={copiedSku}
                  onCopyPromoCode={handleCopyPromoCode}
                />
              ))}
            </div>
          )}
        </div>

        {/* NASM HGD Site, Clearance & Safety Specs */}
        <div style={{ display: 'grid', gap: 10, paddingTop: 6 }}>
          <h5 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#7DD3FC', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            NASM HGD Architectural Site, Clearance &amp; Safety Specifications
          </h5>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 12,
            }}
          >
            {blueprint.siteEngineeringSpecs.map(spec => (
              <article
                key={spec.id}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(8, 14, 24, 0.78)',
                  border: '1px solid rgba(56, 189, 248, 0.24)',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="shield-check" size={14} tone="cyan" />
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7DD3FC' }}>
                    {spec.category}
                  </span>
                </div>
                <h6 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>{spec.title}</h6>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>{spec.specification}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Phase 2 Future Expansion Roadmap */}
        {blueprint.phase2ExpansionRoadmap.length > 0 && (
          <div style={{ display: 'grid', gap: 12, paddingTop: 6 }}>
            <h5 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--gray-lt, #CBD5E1)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Phase 2 · Future Modular Expansion Roadmap (Next Upgrades)
            </h5>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
                gap: 12,
              }}
            >
              {blueprint.phase2ExpansionRoadmap.slice(0, 3).map(item => (
                <BuilderLineItemCard
                  key={item.id}
                  item={item}
                  phaseBadge="Phase 2 Upgrade"
                  copiedSku={copiedSku}
                  onCopyPromoCode={handleCopyPromoCode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cited NASM RAG Knowledge Provenance */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 14,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Retrieved NASM RAG Knowledge Base Citations ({blueprint.ragCitations.length} Sources)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 8,
            }}
          >
            {blueprint.ragCitations.map(cit => (
              <div
                key={cit.id}
                style={{
                  padding: '8px 11px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 11.5,
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{cit.title}</div>
                <div style={{ color: 'var(--gray)', marginTop: 2 }}>{cit.appliedRule}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .forge-hgb-control:focus-visible,
        .forge-hgb-radio:focus-visible {
          outline: 2px solid var(--gold-lt, #f3d27a);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

function BuilderLineItemCard({
  item,
  phaseBadge,
  copiedSku,
  onCopyPromoCode,
}: {
  item: HomeGymBuildLineItem
  phaseBadge: string
  copiedSku: string | null
  onCopyPromoCode: (sku: string, code: string) => void
}) {
  const hasDiscount = item.discountPercentage > 0
  const ctaText = hasDiscount
    ? `Order on ${item.partnerBrand} (${item.discountPercentage}% Off) →`
    : `Configure on ${item.partnerBrand} →`
  const ctaAria = hasDiscount
    ? `Order ${item.name} on ${item.partnerBrand} (${item.discountPercentage}% Off)`
    : `Configure ${item.name} on ${item.partnerBrand}`

  return (
    <article
      style={{
        border:
          phaseBadge === 'Phase 1 Core'
            ? '1px solid rgba(212, 160, 23, 0.38)'
            : '1px solid rgba(255, 255, 255, 0.12)',
        background: 'linear-gradient(180deg, rgba(13, 22, 36, 0.94) 0%, rgba(8, 14, 24, 0.96) 100%)',
        borderRadius: 10,
        padding: 16,
        display: 'grid',
        gap: 10,
        alignContent: 'space-between',
      }}
    >
      <header style={{ display: 'grid', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '2px 7px',
              borderRadius: 4,
              background: phaseBadge === 'Phase 1 Core' ? 'rgba(212, 160, 23, 0.2)' : 'rgba(255,255,255,0.08)',
              color: phaseBadge === 'Phase 1 Core' ? 'var(--gold-lt)' : 'var(--gray)',
            }}
          >
            {phaseBadge} · {item.partnerBrand}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#34D399' }}>
            {hasDiscount ? `${item.discountPercentage}% Off Member Perk` : 'Free US Shipping'}
          </span>
        </div>
        <h6 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.35 }}>
          {item.name}
        </h6>
      </header>

      <div style={{ display: 'grid', gap: 6 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45 }}>
          {item.architectRationale}
        </p>
        <div style={{ fontSize: 11, color: 'var(--gray)' }}>
          <strong>Logistics:</strong> {item.shippingClass}
        </div>
      </div>

      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div className="tabular-nums">
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 15.5, fontWeight: 800, color: '#FFFFFF' }}>
            {item.clientPriceFormatted}
            {hasDiscount && (
              <>
                {' '}
                <span style={{ fontSize: 11.5, color: 'var(--gray)', textDecoration: 'line-through', fontWeight: 500 }}>
                  {item.retailPriceFormatted}
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {item.promoCode && (
            <button
              type="button"
              onClick={() => onCopyPromoCode(item.sku, item.promoCode!)}
              aria-label={`Copy promo code ${item.promoCode} for ${item.name}`}
              style={{
                padding: '6px 10px',
                minBlockSize: 36,
                borderRadius: 5,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'var(--gold-lt)',
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {copiedSku === item.sku ? '✓ Copied' : `Code: ${item.promoCode}`}
            </button>
          )}

          <a
            href={item.dispensaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ctaAria}
            style={{
              padding: '8px 13px',
              minBlockSize: 36,
              borderRadius: 5,
              background: 'linear-gradient(135deg, var(--gold, #D4A017) 0%, var(--gold-lt, #F3D27A) 100%)',
              color: '#080E14',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {ctaText}
          </a>
        </div>
      </footer>
    </article>
  )
}
