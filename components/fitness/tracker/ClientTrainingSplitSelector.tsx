'use client'

import React, { useState, useMemo } from 'react'
import {
  recommendClientTrainingSplits,
  normalizeClientGoal,
  normalizeExperienceLevel,
  type TrainingSplitId,
} from '@/lib/client-training-recommendations'
import GaaIcon from '@/components/ui/GaaIcon'

export interface ClientTrainingSplitSelectorProps {
  isCoachCertified: boolean
  hasActiveWorkouts: boolean
  currentSplit?: TrainingSplitId | null
  initialExperienceLevel?: string | null
  initialDaysPerWeek?: number | null
  initialGoal?: string | null
  equipmentAccess?: string[] | null
  injuriesLimitations?: string | null
  onPlanGenerated: (updatedPlan: unknown, statusMsg: string) => void
}

const GOAL_CHOICES: Array<{ value: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'; label: string }> = [
  { value: 'fat_loss', label: 'Fat Loss & Recomposition' },
  { value: 'hypertrophy', label: 'Muscle Hypertrophy' },
  { value: 'performance', label: 'Strength & Athletic Power' },
  { value: 'general_fitness', label: 'Longevity & General Fitness' },
]

const LEVEL_CHOICES: Array<{ value: 'beginner' | 'intermediate' | 'advanced' | 'elite'; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'elite', label: 'Elite' },
]

const CARDIO_CHOICES: Array<{
  value: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush'
  label: string
}> = [
  { value: 'integrated_finishers', label: 'Post-Lift Cardio Finishers' },
  { value: 'dedicated_conditioning', label: 'Alternating Conditioning Days' },
  { value: 'minimal_flush', label: 'Strength Focus (Minimal Cardio)' },
]

export default function ClientTrainingSplitSelector({
  isCoachCertified,
  hasActiveWorkouts,
  currentSplit,
  initialExperienceLevel,
  initialDaysPerWeek,
  initialGoal,
  equipmentAccess,
  injuriesLimitations,
  onPlanGenerated,
}: ClientTrainingSplitSelectorProps) {
  const [isOpen, setIsOpen] = useState<boolean>(!hasActiveWorkouts)
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>(() =>
    normalizeExperienceLevel(initialExperienceLevel)
  )
  const [daysPerWeek, setDaysPerWeek] = useState<number>(() =>
    Math.min(6, Math.max(2, Number(initialDaysPerWeek) || 4))
  )
  const [goal, setGoal] = useState<'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'>(() =>
    normalizeClientGoal(initialGoal)
  )
  const [cardioBlendStyle, setCardioBlendStyle] = useState<
    'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush'
  >('integrated_finishers')
  const [selectedSplit, setSelectedSplit] = useState<TrainingSplitId | 'auto'>(
    currentSplit || 'auto'
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const recommendation = useMemo(
    () =>
      recommendClientTrainingSplits({
        experienceLevel,
        trainingDaysPerWeek: daysPerWeek,
        fitnessGoal: goal,
        equipmentAccess,
        injuriesLimitations,
        preferredSplit: 'auto',
      }),
    [experienceLevel, daysPerWeek, goal, equipmentAccess, injuriesLimitations]
  )

  const effectiveSelectedSplit: TrainingSplitId =
    selectedSplit === 'auto' ? recommendation.recommendedSplitId : selectedSplit

  const activeSplitOption =
    recommendation.options.find(o => o.id === effectiveSelectedSplit) ||
    recommendation.options[0]

  // If the plan was custom-certified by Coach Gordon, show a clean certification badge
  if (isCoachCertified) {
    return (
      <div
        data-testid="coach-certified-protocol-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 12px',
          marginBottom: 12,
          borderRadius: 6,
          background: 'rgba(212, 160, 23, 0.08)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#FDE68A', fontWeight: 700 }}>
          <GaaIcon name="shield-check" size={14} tone="gold" />
          <span>Custom Protocol Certified by Coach Gordon</span>
        </div>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>
          Bespoke 1-on-1 Periodization Active
        </span>
      </div>
    )
  }

  async function handleGenerateSplitRoutine(overrideSplit?: TrainingSplitId) {
    const targetSplit = overrideSplit || effectiveSelectedSplit
    setIsGenerating(true)
    setErrorMsg(null)

    const goalDisplayMap: Record<typeof goal, string> = {
      fat_loss: 'Fat Loss & Body Recomposition',
      hypertrophy: 'Muscle Hypertrophy & Development',
      performance: 'Maximal Strength & Athletic Power',
      general_fitness: 'Functional Longevity & General Fitness',
    }

    try {
      const res = await fetch('/api/fitness/training-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingSplit: targetSplit,
          trainingDaysPerWeek: daysPerWeek,
          fitnessGoal: goalDisplayMap[goal],
          experienceLevel,
          targetNasmPhase: recommendation.recommendedNasmPhase,
          cardioBlendStyle,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErrorMsg(data.message || data.error || 'Could not generate training split.')
        setIsGenerating(false)
        return
      }

      const splitTitle =
        recommendation.options.find(o => o.id === targetSplit)?.title ||
        recommendation.recommendedSplitTitle

      setSelectedSplit(targetSplit)
      setIsOpen(false)
      setIsGenerating(false)
      onPlanGenerated(
        data.plan,
        `✓ Built your custom ${splitTitle} (${daysPerWeek} Days/Week · Phase ${recommendation.recommendedNasmPhase}) via the Forge NASM RAG Engine.`
      )
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error generating workout routine.')
      setIsGenerating(false)
    }
  }

  return (
    <div
      data-testid="client-training-split-selector"
      style={{
        border: '1px solid rgba(212, 160, 23, 0.38)',
        background: 'linear-gradient(180deg, rgba(15, 25, 42, 0.96) 0%, rgba(8, 14, 26, 0.98) 100%)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 14,
      }}
    >
      {/* Top Summary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 260px' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(212, 160, 23, 0.14)',
              border: '1px solid rgba(212, 160, 23, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GaaIcon name="sparkles" size={16} tone="gold" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--gold-lt, #FDE68A)',
                  fontWeight: 800,
                }}
              >
                Forge RAG Split Architect
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#7DD3FC',
                  fontWeight: 700,
                }}
              >
                Recommended: {recommendation.recommendedSplitTitle}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#E2E8F0', fontWeight: 600, marginTop: 2 }}>
              {hasActiveWorkouts
                ? `Active Split: ${activeSplitOption.title} · ${daysPerWeek} Days/Wk · OPT™ Phase ${recommendation.recommendedNasmPhase}`
                : `Choose how you want to train (${daysPerWeek} Days/Wk · ${experienceLevel.toUpperCase()} · ${recommendation.equipmentSummaryLabel})`}
            </div>
          </div>
        </div>

        <button
          type="button"
          data-testid="toggle-split-selector-btn"
          onClick={() => setIsOpen(prev => !prev)}
          className="tactile-btn"
          style={{
            background: isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(212, 160, 23, 0.18)',
            border: '1px solid rgba(212, 160, 23, 0.5)',
            color: 'var(--gold-lt, #FDE68A)',
            padding: '7px 13px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="sliders" size={13} tone="gold" />
          <span>{isOpen ? 'Hide Split Options' : 'Choose Training Split / Customize'}</span>
        </button>
      </div>

      {/* Expandable Split Recommendations & Customizer */}
      {isOpen && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Step 1: Athlete Profile & Schedule Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
              gap: 10,
              background: 'rgba(4, 8, 16, 0.65)',
              padding: 12,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div>
              <label
                htmlFor="split-days-select"
                style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}
              >
                Days Trained / Week
              </label>
              <select
                id="split-days-select"
                data-testid="split-days-select"
                value={daysPerWeek}
                onChange={e => {
                  setDaysPerWeek(Number(e.target.value))
                  setSelectedSplit('auto')
                }}
                style={{
                  width: '100%',
                  background: '#0B1324',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#FFFFFF',
                  padding: '7px 9px',
                  borderRadius: 5,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {[2, 3, 4, 5, 6].map(d => (
                  <option key={d} value={d}>
                    {d} Days / Week {d === 4 ? '(Ideal for Upper/Lower or Push/Pull)' : d === 3 ? '(Ideal for Full-Body or PPL)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="split-level-select"
                style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}
              >
                Fitness &amp; Experience Level
              </label>
              <select
                id="split-level-select"
                data-testid="split-level-select"
                value={experienceLevel}
                onChange={e => {
                  setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'elite')
                  setSelectedSplit('auto')
                }}
                style={{
                  width: '100%',
                  background: '#0B1324',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#FFFFFF',
                  padding: '7px 9px',
                  borderRadius: 5,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {LEVEL_CHOICES.map(l => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="split-goal-select"
                style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}
              >
                Primary Training Goal
              </label>
              <select
                id="split-goal-select"
                data-testid="split-goal-select"
                value={goal}
                onChange={e => {
                  setGoal(e.target.value as 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness')
                  setSelectedSplit('auto')
                }}
                style={{
                  width: '100%',
                  background: '#0B1324',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#FFFFFF',
                  padding: '7px 9px',
                  borderRadius: 5,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {GOAL_CHOICES.map(g => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="split-cardio-select"
                style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}
              >
                Cardio Conditioning Style
              </label>
              <select
                id="split-cardio-select"
                data-testid="split-cardio-select"
                value={cardioBlendStyle}
                onChange={e =>
                  setCardioBlendStyle(
                    e.target.value as 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush'
                  )
                }
                style={{
                  width: '100%',
                  background: '#0B1324',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#FFFFFF',
                  padding: '7px 9px',
                  borderRadius: 5,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {CARDIO_CHOICES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Personalized RAG Recommendation Banner */}
          <div
            style={{
              background: 'rgba(212, 160, 23, 0.08)',
              border: '1px solid rgba(212, 160, 23, 0.35)',
              borderRadius: 6,
              padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--gold-lt, #FDE68A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ★ NASM RAG Recommendation for Your Profile
              </span>
              <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-telemetry, monospace)' }}>
                Target: OPT™ Phase {recommendation.recommendedNasmPhase} ({recommendation.recommendedPhaseName})
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
              Based on your <strong>{experienceLevel}</strong> experience level, <strong>{daysPerWeek} days/week</strong> schedule,{' '}
              <strong>{recommendation.equipmentSummaryLabel}</strong> access, and <strong>{goal.replace(/_/g, ' ')}</strong> goal, we recommend the{' '}
              <strong style={{ color: '#FDE68A' }}>{recommendation.recommendedSplitTitle}</strong>. Select it below or choose any alternative training split architecture—our RAG engine will craft your unique exercise selection, sets, reps, and tempo automatically.
            </p>
          </div>

          {/* Step 3: Selectable Training Split Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: 10,
            }}
          >
            {recommendation.options.map(opt => {
              const isSelected = effectiveSelectedSplit === opt.id
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  data-testid={`split-option-card-${opt.id}`}
                  onClick={() => setSelectedSplit(opt.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedSplit(opt.id)
                    }
                  }}
                  style={{
                    border: isSelected
                      ? '1.5px solid var(--gold, #D4A017)'
                      : opt.isTopRecommendation
                        ? '1px solid rgba(52, 211, 153, 0.45)'
                        : '1px solid rgba(255,255,255,0.12)',
                    background: isSelected
                      ? 'linear-gradient(145deg, rgba(212, 160, 23, 0.16) 0%, rgba(12, 20, 36, 0.96) 100%)'
                      : 'rgba(10, 17, 30, 0.85)',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 14px rgba(212,160,23,0.22)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: opt.isTopRecommendation
                            ? 'rgba(52, 211, 153, 0.18)'
                            : 'rgba(255, 255, 255, 0.07)',
                          color: opt.isTopRecommendation ? '#34D399' : '#94A3B8',
                          border: opt.isTopRecommendation
                            ? '1px solid rgba(52, 211, 153, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {opt.isTopRecommendation ? '★ Best Match for You' : opt.matchBadge}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontFamily: 'var(--font-telemetry, monospace)',
                          fontWeight: 700,
                          color: isSelected ? 'var(--gold-lt, #FDE68A)' : '#CBD5E1',
                        }}
                      >
                        {opt.fitScore}% Fit
                      </span>
                    </div>

                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#FFFFFF', marginBottom: 3 }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4, marginBottom: 8 }}>
                      {opt.whyForYou}
                    </div>
                  </div>

                  {/* Day-by-Day Preview Pills */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      borderRadius: 6,
                      padding: '7px 8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-lt, #FDE68A)', fontWeight: 700, marginBottom: 2 }}>
                      {daysPerWeek}-Day Microcycle Structure:
                    </div>
                    {opt.daySchedulePreview.map((dayLine, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 11,
                          color: '#CBD5E1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        • {dayLine}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FCA5A5',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              RAG Knowledge Base: <strong style={{ color: '#CBD5E1' }}>{activeSplitOption.ragCitation}</strong>
            </div>

            <button
              type="button"
              data-testid="generate-client-split-btn"
              disabled={isGenerating}
              onClick={() => handleGenerateSplitRoutine(effectiveSelectedSplit)}
              className="sgf-button sgf-button-primary"
              style={{
                padding: '9px 18px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: isGenerating ? 'wait' : 'pointer',
                opacity: isGenerating ? 0.75 : 1,
              }}
            >
              {isGenerating
                ? 'Crafting Your Custom RAG Routine...'
                : `Build My ${activeSplitOption.title} (${daysPerWeek} Days/Wk) →`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

