'use client'

import React, { useState } from 'react'
import CoachAiIntakeDrawer, { CoachAiIntakeFormData } from './CoachAiIntakeDrawer'
import CoachProgramPreviewCanvas from './CoachProgramPreviewCanvas'
import SmartExerciseSwapModal from '@/components/coach/SmartExerciseSwapModal'
import { resolveExerciseVideoEmbed } from '@/lib/nasm-exercise-video-catalog'
import type { ExerciseSubstitution } from '@/lib/nasm-exercise-substitution'
import type {
  GeneratedMacrocyclePlan,
  GeneratedWorkoutDay,
  GeneratedExerciseItem,
  HandPortionNutritionPlan,
  DualCardioPlanSummary,
  StrengthCardioBlendSummary,
} from '@/lib/rag-nasm-program-generator'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { COACH_DISPLAY_NAME } from '@/lib/program-personalization'

export interface CoachCustomPeriodizationStudioProps {
  clientId: string
  clientName: string
  clientAge?: number | null
  clientSex?: string | null
  clientGoalLabel?: string | null
  clientPhaseName?: string | null
  clientExperienceLevel?: string | null
  initialGoal?: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'
  initialPhase?: number
  initialEquipmentAccess?: string[]
  initialSessionsPerWeek?: number | null
  initialCompensations?: string[]
  contraindicationTags?: string[]
  contraindicationNotes?: string[]
  injuriesLimitations?: string | null
  existingPlan?: {
    id?: string | null
    name?: string | null
    goal?: string | null
    nasm_opt_phase?: number | null
    phase_name?: string | null
    sessions_per_week?: number | null
    plan_json?: Record<string, unknown> | null
  } | null
  onPlanAssigned?: (plan: GeneratedMacrocyclePlan) => void
  onClose?: () => void
}

export default function CoachCustomPeriodizationStudio({
  clientId,
  clientName,
  clientAge,
  clientSex,
  clientGoalLabel,
  clientPhaseName,
  clientExperienceLevel,
  initialGoal = 'fat_loss',
  initialPhase = 1,
  initialEquipmentAccess = ['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight'],
  initialSessionsPerWeek = 3,
  initialCompensations = [],
  contraindicationTags = [],
  contraindicationNotes = [],
  injuriesLimitations = null,
  existingPlan,
  onPlanAssigned,
  onClose,
}: CoachCustomPeriodizationStudioProps) {
  const isSandbox = clientId === 'sandbox-athlete'
  const clientFirstName = isSandbox ? 'this athlete' : (clientName.trim().split(/\s+/)[0] || clientName)
  const compensations = initialCompensations.map(c => c.trim()).filter(Boolean)
  const limitationsText = Array.from(
    new Set(
      [injuriesLimitations, ...contraindicationNotes]
        .map(value => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  ).join(' · ')
  const initials = clientName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
  const sexLabel = clientSex ? clientSex.charAt(0).toUpperCase() + clientSex.slice(1).toLowerCase() : null
  const profileFacts: Array<{ label: string; value: string }> = [
    { label: sexLabel ? 'Age · Sex' : 'Age', value: [clientAge ? String(clientAge) : null, sexLabel].filter(Boolean).join(' · ') || 'Not set' },
    { label: 'Goal', value: clientGoalLabel?.trim() || initialGoal.replace(/_/g, ' ') },
    { label: 'Phase', value: clientPhaseName?.trim() || `Phase ${initialPhase}` },
    { label: 'Sessions / week', value: String(initialSessionsPerWeek || 3) },
    { label: 'Experience', value: clientExperienceLevel?.trim() || 'Not set' },
    ...(existingPlan?.name ? [{ label: 'Current plan', value: existingPlan.name }] : []),
  ]
  const normalizedSex: 'male' | 'female' | undefined =
    clientSex?.toLowerCase() === 'male' ? 'male' : clientSex?.toLowerCase() === 'female' ? 'female' : undefined
  const normalizedExperience = (['beginner', 'intermediate', 'advanced', 'elite'] as const).find(
    level => level === clientExperienceLevel?.toLowerCase()
  )
  const intakeGuidancePrefill = [
    compensations.length ? `Movement screen: ${compensations.join(', ')}.` : '',
    limitationsText ? `Limitations: ${limitationsText}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Modal states
  const [isIntakeDrawerOpen, setIsIntakeDrawerOpen] = useState<boolean>(false)
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false)
  const [synthesisError, setSynthesisError] = useState<string | null>(null)

  // Deploy states
  const [isDeploying, setIsDeploying] = useState<boolean>(false)
  const [deploySuccessMessage, setDeploySuccessMessage] = useState<string | null>(null)
  const [deployErrorMessage, setDeployErrorMessage] = useState<string | null>(null)

  // Video Preview Modal
  const [videoModalExercise, setVideoModalExercise] = useState<string | null>(null)

  // Smart Exercise Swap Modal
  const [swapTarget, setSwapTarget] = useState<{
    exerciseName: string
    workoutDayIndex: number
    exerciseIndex: number
  } | null>(null)

  // Plan State (initialized from existingPlan if available, otherwise null until generated)
  const [currentPlan, setCurrentPlan] = useState<GeneratedMacrocyclePlan | null>(() => {
    if (existingPlan?.plan_json?.workouts && Array.isArray(existingPlan.plan_json.workouts)) {
      const planJson = existingPlan.plan_json
      const periodizationPlan = planJson.periodizationPlan as { ragSourcesCited?: string[]; weeklyMemos?: string[] } | undefined
      const blendSummary = planJson.strengthCardioBlendSummary as StrengthCardioBlendSummary | undefined
      const handPortionPlan = (planJson.handPortionPlan as HandPortionNutritionPlan) || null
      const dualCardioPlan = (planJson.dualCardioPlan as DualCardioPlanSummary) || null

      return {
        planTitle: existingPlan.name || `${clientName} · Bespoke NASM OPT™ Program`,
        primaryGoal: existingPlan.goal || initialGoal,
        nasmOptPhase: existingPlan.nasm_opt_phase || initialPhase,
        phaseName: existingPlan.phase_name || `Phase ${existingPlan.nasm_opt_phase || initialPhase}`,
        totalWeeks: 4,
        sessionsPerWeek: existingPlan.sessions_per_week || initialSessionsPerWeek || 3,
        ragSourcesCited: periodizationPlan?.ragSourcesCited || [
          'NASM Essentials of Personal Fitness Training 7th Ed',
        ],
        strengthCardioBlendSummary: blendSummary || {
          goal: existingPlan.goal || initialGoal,
          blendRatio: '60% Strength / 40% Cardio',
          strengthPct: 60,
          cardioPct: 40,
          weeklyStrengthSessions: existingPlan.sessions_per_week || 3,
          weeklyCardioMinutes: 90,
          primaryCardioStages: 'Stage 1 & Stage 2',
          interferenceShieldStrategy: 'Concurrent separation of lifting and conditioning',
          clinicalGuideline: 'Maintain distinct energy pathway stimulus.',
        },
        workouts: (Array.isArray(planJson.workouts) ? planJson.workouts : []).map(rawW => {
          const w = (rawW || {}) as Record<string, unknown>
          const rawExercises = Array.isArray(w.exercises) ? w.exercises : []
          return {
            day: Number(w.day) || 1,
            dayName: `Day ${w.day || 1}`,
            focus: String(w.focus || 'Full Body Integration'),
            nasmOptPhase: existingPlan.nasm_opt_phase || initialPhase,
            phaseName: existingPlan.phase_name || `Phase ${existingPlan.nasm_opt_phase || initialPhase}`,
            estimatedDurationMins: Number(w.estimatedDurationMins) || 40,
            warmupProtocol: (w.warmupProtocol as GeneratedWorkoutDay['warmupProtocol']) || {
              inhibitSmr: ['Calves', 'Thoracic Spine'],
              lengthenStaticStretch: ['Gastrocnemius', 'Hip Flexors'],
              activateDynamic: ['Glute Bridge', 'Arm Crosses'],
            },
            exercises: rawExercises.map(rawEx => {
              const ex = (rawEx || {}) as Record<string, unknown>
              return {
                block: (ex.block as GeneratedExerciseItem['block']) || 'resistance',
                name: String(ex.name || 'Exercise'),
                sets: String(ex.sets || '3'),
                reps: String(ex.reps || '12'),
                tempo: String(ex.tempo || '4/2/1'),
                rest: String(ex.rest || '60s'),
                coachingCues: ex.notes ? [String(ex.notes)] : ['Focus on kinetic alignment and core bracing.'],
                nasmClinicalSource: String(ex.description || 'NASM Edge Catalog'),
                whyForYou: typeof ex.personalReason === 'string' ? ex.personalReason : undefined,
              }
            }),
            dailyPeriodizationMemo: String(w.notes || 'Prioritize form and neuromuscular control.'),
          }
        }),
        periodizationWeeklyMemos: periodizationPlan?.weeklyMemos || [],
        clinicalRationale: typeof planJson.clinicalRationale === 'string' ? planJson.clinicalRationale : '',
        coachPersonalNote: typeof planJson.coachPersonalNote === 'string' ? planJson.coachPersonalNote : undefined,
        handPortionPlan,
        dualCardioPlan,
      }
    }
    return null
  })

  // Synthesize program with Gemini 3.8 Flash
  const handleSynthesize = async (formData: CoachAiIntakeFormData) => {
    setIsSynthesizing(true)
    setSynthesisError(null)
    setDeploySuccessMessage(null)
    setDeployErrorMessage(null)

    try {
      const csrfCookie = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('csrf-session='))?.split('=')[1]
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (csrfCookie) {
        headers['x-csrf-token'] = csrfCookie
      }

      const res = await fetch('/api/coach/ai-architect', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientName: formData.clientName,
          clientAge: formData.clientAge,
          clientSex: formData.clientSex,
          goal: formData.goal,
          targetNasmPhase: formData.targetNasmPhase,
          trainingDaysPerWeek: formData.trainingDaysPerWeek,
          experienceLevel: formData.experienceLevel,
          equipmentAccess: formData.equipmentAccess,
          lifestyleRhythm: formData.lifestyleRhythm,
          movementSuperpowers: formData.movementSuperpowers,
          strictExclusions: formData.strictExclusions,
          functionalDemands: formData.functionalDemands,
          nutritionPhilosophy: formData.nutritionPhilosophy,
          dualCardioSplit: formData.dualCardioSplit,
          coachGuidanceNotes: formData.coachGuidanceNotes,
          contraindicationTags,
          injuriesLimitations: limitationsText || undefined,
          kineticCompensations: compensations.length > 0 ? compensations : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Synthesis failed (status ${res.status}).`)
      }

      if (!data.plan) {
        throw new Error('AI Coach Architect did not return a valid NASM OPT™ program plan.')
      }

      setCurrentPlan(data.plan)
      setIsIntakeDrawerOpen(false)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setSynthesisError(errObj?.message || 'Error synthesizing program.')
    } finally {
      setIsSynthesizing(false)
    }
  }

  // Handle Substitution Selected from SmartExerciseSwapModal
  const handleSubstitutionSelected = (substitution: ExerciseSubstitution) => {
    if (!currentPlan || !swapTarget) return

    const updatedWorkouts = [...currentPlan.workouts]
    const targetWorkout = { ...updatedWorkouts[swapTarget.workoutDayIndex] }
    const updatedExercises = [...targetWorkout.exercises]

    const existingEx = updatedExercises[swapTarget.exerciseIndex]
    updatedExercises[swapTarget.exerciseIndex] = {
      ...existingEx,
      name: substitution.name,
      tempo: substitution.prescribedTempo || existingEx.tempo,
      nasmClinicalSource: substitution.reasoning
        ? `Substitute for ${swapTarget.exerciseName}: ${substitution.reasoning}`
        : existingEx.nasmClinicalSource,
      whyForYou: substitution.reasoning
        ? `Swapped in for ${swapTarget.exerciseName}: ${substitution.reasoning}`
        : existingEx.whyForYou,
    }

    targetWorkout.exercises = updatedExercises
    updatedWorkouts[swapTarget.workoutDayIndex] = targetWorkout

    setCurrentPlan({
      ...currentPlan,
      workouts: updatedWorkouts,
    })

    setSwapTarget(null)
  }

  // Deploy Program to Athlete via /api/coach/workout-plans
  const handleDeployPlan = async (overwrite: boolean) => {
    if (!currentPlan) return
    setIsDeploying(true)
    setDeploySuccessMessage(null)
    setDeployErrorMessage(null)

    try {
      const csrfCookie = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('csrf-session='))?.split('=')[1]
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (csrfCookie) {
        headers['x-csrf-token'] = csrfCookie
      }

      const workoutsPayload = currentPlan.workouts.map(w => ({
        day: w.day,
        focus: w.focus,
        notes: w.dailyPeriodizationMemo,
        cardioProtocol: w.cardioProtocol ?? null,
        exercises: w.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          tempo: ex.tempo,
          rest: ex.rest,
          notes: ex.coachingCues?.join(' | ') || undefined,
          description: ex.nasmClinicalSource,
          personalReason: ex.whyForYou?.trim() || undefined,
          block: ex.block,
        })),
      }))

      const res = await fetch('/api/coach/workout-plans', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientId,
          name: currentPlan.planTitle,
          goal: currentPlan.primaryGoal,
          nasmOptPhase: Number(currentPlan.nasmOptPhase),
          phaseName: currentPlan.phaseName,
          sessionsPerWeek: Number(currentPlan.sessionsPerWeek),
          estimatedDurationMins: 45,
          overwrite,
          targetPlanId: overwrite && existingPlan?.id ? existingPlan.id : undefined,
          workouts: workoutsPayload,
          clinicalRationale: currentPlan.clinicalRationale,
          coachPersonalNote: currentPlan.coachPersonalNote?.trim() || undefined,
          handPortionPlan: currentPlan.handPortionPlan,
          dualCardioPlan: currentPlan.dualCardioPlan,
          strengthCardioBlendSummary: currentPlan.strengthCardioBlendSummary,
          periodizationPlan: {
            weeklyMemos: currentPlan.periodizationWeeklyMemos,
            ragSourcesCited: currentPlan.ragSourcesCited,
          },
          isCertifiedByCoach: true,
          coachCertifiedAt: new Date().toISOString(),
          certifiedBy: 'Coach Gordon (NASM Master Trainer)',
          safetyGateCertified: true,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Deployment failed (status ${res.status}).`)
      }

      setDeploySuccessMessage(
        `Certified & Sent to ${clientFirstName}. Master Coach Safety Gate certified · "${currentPlan.planTitle}"${currentPlan.coachPersonalNote?.trim() ? ' with your personal note' : ''} is active.`
      )

      if (onPlanAssigned) {
        onPlanAssigned(currentPlan)
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setDeployErrorMessage(errObj?.message || 'Error deploying plan to athlete.')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #090F1E 0%, #050811 100%)',
        border: '1px solid rgba(212,160,23,0.35)',
        borderRadius: 14,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Studio Header — coach-led, AI as assistant */}
      <header className="coach-builder-header">
        <div className="coach-builder-header-text">
          <div className="coach-builder-eyebrow">
            Program Builder
            <span className="coach-builder-ai-chip">
              <GaaIcon name="sparkles" size={11} tone="gold" />
              AI-assisted
            </span>
          </div>
          <h2 className="coach-builder-title">
            {isSandbox ? 'New athlete template' : `${clientFirstName}'s program`}
          </h2>
          <p className="coach-builder-subtitle">
            Built by {COACH_DISPLAY_NAME} · every exercise explained to {isSandbox ? 'your athlete' : clientFirstName}
          </p>
        </div>

        <div className="coach-builder-header-actions">
          <button
            type="button"
            className="coach-builder-btn coach-builder-btn-primary"
            onClick={() => setIsIntakeDrawerOpen(true)}
          >
            <GaaIcon name="edit" size={14} tone="dark" />
            {currentPlan ? 'Refine intake' : 'Start personal intake'}
          </button>

          {onClose && (
            <button type="button" className="coach-builder-btn coach-builder-btn-ghost" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </header>

      {/* Athlete profile — who this program is for */}
      <section className="coach-builder-profile" aria-label={`Who you're building for`}>
        <div className="coach-builder-profile-head">
          <div className="coach-builder-avatar" aria-hidden="true">
            {isSandbox ? <GaaIcon name="user" size={18} tone="gold" /> : initials}
          </div>
          <div>
            <div className="coach-builder-profile-kicker">Who you&apos;re building for</div>
            <div className="coach-builder-profile-name">{isSandbox ? 'Template athlete' : clientName}</div>
          </div>
        </div>

        <dl className="coach-builder-profile-grid">
          {profileFacts.map(fact => (
            <div key={fact.label} className="coach-builder-fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="coach-builder-profile-tags">
          <div className="coach-builder-tag-group">
            <span className="coach-builder-tag-label">Movement screen</span>
            {compensations.length > 0 ? (
              <div className="coach-builder-chip-row">
                {compensations.map(c => (
                  <span key={c} className="coach-builder-chip coach-builder-chip-warn">{c}</span>
                ))}
              </div>
            ) : (
              <span className="coach-builder-muted">No screen yet</span>
            )}
          </div>
          <div className="coach-builder-tag-group">
            <span className="coach-builder-tag-label">Limitations &amp; injuries</span>
            {limitationsText || contraindicationTags.length > 0 ? (
              <div className="coach-builder-chip-row">
                {limitationsText && <span className="coach-builder-chip coach-builder-chip-alert">{limitationsText}</span>}
                {contraindicationTags.map(tag => (
                  <span key={tag} className="coach-builder-chip coach-builder-chip-alert">{tag.replace(/_/g, ' ')}</span>
                ))}
              </div>
            ) : (
              <span className="coach-builder-muted">None reported</span>
            )}
          </div>
          {initialEquipmentAccess.length > 0 && (
            <div className="coach-builder-tag-group">
              <span className="coach-builder-tag-label">Equipment</span>
              <div className="coach-builder-chip-row">
                {initialEquipmentAccess.map(eq => (
                  <span key={eq} className="coach-builder-chip">{eq}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Synthesis Error Display */}
      {synthesisError && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.1) 100%)',
            border: '1px solid #EF4444',
            borderRadius: 8,
            padding: '14px 18px',
            color: '#FCA5A5',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <GaaIcon name="alert-triangle" size={18} style={{ color: '#EF4444' }} />
          <div>
            <strong>Synthesis Error:</strong> {synthesisError}
          </div>
        </div>
      )}

      {/* Empty state — invite the coach to start with the person */}
      {!currentPlan && !isSynthesizing && (
        <div className="coach-builder-empty">
          <div className="coach-builder-empty-icon" aria-hidden="true">
            <GaaIcon name="handshake" size={26} tone="gold" />
          </div>
          <h3 className="coach-builder-empty-title">
            {isSandbox ? 'Build a reusable template' : `Let's build ${clientFirstName}'s first program`}
          </h3>
          <p className="coach-builder-empty-copy">
            {isSandbox
              ? 'Capture goals, schedule, equipment and preferences. AI drafts the program; you review every exercise before it goes anywhere.'
              : `Start with ${clientFirstName}'s story — schedule, favorite movements, what to avoid, and life outside the gym. AI drafts the program, you shape it, and ${clientFirstName} sees why each exercise is there.`}
          </p>
          <button
            type="button"
            className="coach-builder-btn coach-builder-btn-primary coach-builder-btn-lg"
            onClick={() => setIsIntakeDrawerOpen(true)}
          >
            <GaaIcon name="edit" size={16} tone="dark" />
            Start personal intake
          </button>
        </div>
      )}

      {/* Program Preview Canvas */}
      {currentPlan && (
        <CoachProgramPreviewCanvas
          plan={currentPlan}
          clientId={clientId}
          clientName={clientName}
          isDeploying={isDeploying}
          deploySuccessMessage={deploySuccessMessage}
          deployErrorMessage={deployErrorMessage}
          onUpdatePlan={setCurrentPlan}
          onDeployPlan={handleDeployPlan}
          onOpenIntakeDrawer={() => setIsIntakeDrawerOpen(true)}
          onOpenExerciseVideo={exName => setVideoModalExercise(exName)}
          onOpenExerciseSwap={(exName, dayIdx, exIdx) => {
            setSwapTarget({
              exerciseName: exName,
              workoutDayIndex: dayIdx,
              exerciseIndex: exIdx,
            })
          }}
        />
      )}

      {/* Intake Drawer */}
      <CoachAiIntakeDrawer
        isOpen={isIntakeDrawerOpen}
        onClose={() => setIsIntakeDrawerOpen(false)}
        clientName={clientName}
        clientId={clientId}
        initialData={{
          clientAge: clientAge ?? undefined,
          clientSex: normalizedSex,
          experienceLevel: normalizedExperience,
          coachGuidanceNotes: intakeGuidancePrefill || undefined,
          goal: initialGoal,
          targetNasmPhase: initialPhase,
          trainingDaysPerWeek: initialSessionsPerWeek || 3,
          equipmentAccess: initialEquipmentAccess,
        }}
        onSynthesize={handleSynthesize}
        isSynthesizing={isSynthesizing}
      />

      {/* Video Demonstration Modal */}
      {videoModalExercise && (() => {
        const videoRes = resolveExerciseVideoEmbed(videoModalExercise)
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100006,
              background: 'rgba(3,7,18,0.92)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={e => {
              if (e.target === e.currentTarget) setVideoModalExercise(null)
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 720,
                background: '#0D1629',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
                    Official NASM Edge Video Demonstration
                  </div>
                  <h3
                    id="video-modal-title"
                    style={{
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontSize: 18,
                      color: '#FFFFFF',
                      margin: '2px 0 0',
                    }}
                  >
                    {videoModalExercise}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setVideoModalExercise(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Video Player */}
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000000' }}>
                <iframe
                  src={videoRes.embedUrl}
                  title={`Demonstration for ${videoModalExercise}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>

              {/* Video Footer */}
              <div style={{ padding: '12px 20px', fontSize: 12, color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                <span>{videoRes.sourceTitle}</span>
                <a
                  href={videoRes.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--gold-lt)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Open on YouTube ↗
                </a>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Smart Exercise Swap Modal */}
      {swapTarget && (
        <SmartExerciseSwapModal
          currentExerciseName={swapTarget.exerciseName}
          optPhase={currentPlan?.phaseName || `Phase ${currentPlan?.nasmOptPhase || 1}`}
          onSelectSubstitution={handleSubstitutionSelected}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  )
}
