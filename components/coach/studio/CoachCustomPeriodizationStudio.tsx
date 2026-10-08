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

export interface CoachCustomPeriodizationStudioProps {
  clientId: string
  clientName: string
  clientAge?: number | null
  clientSex?: 'male' | 'female'
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
  clientSex = 'female',
  initialGoal = 'fat_loss',
  initialPhase = 1,
  initialEquipmentAccess = ['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight'],
  initialSessionsPerWeek = 3,
  contraindicationTags = [],
  injuriesLimitations = null,
  existingPlan,
  onPlanAssigned,
  onClose,
}: CoachCustomPeriodizationStudioProps) {
  // Modal states
  const [isIntakeDrawerOpen, setIsIntakeDrawerOpen] = useState<boolean>(!existingPlan?.plan_json?.workouts)
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
              }
            }),
            dailyPeriodizationMemo: String(w.notes || 'Prioritize form and neuromuscular control.'),
          }
        }),
        periodizationWeeklyMemos: periodizationPlan?.weeklyMemos || [],
        clinicalRationale: typeof planJson.clinicalRationale === 'string' ? planJson.clinicalRationale : '',
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
          injuriesLimitations: injuriesLimitations || undefined,
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
          handPortionPlan: currentPlan.handPortionPlan,
          dualCardioPlan: currentPlan.dualCardioPlan,
          strengthCardioBlendSummary: currentPlan.strengthCardioBlendSummary,
          periodizationPlan: {
            weeklyMemos: currentPlan.periodizationWeeklyMemos,
            ragSourcesCited: currentPlan.ragSourcesCited,
          },
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Deployment failed (status ${res.status}).`)
      }

      setDeploySuccessMessage(`✓ Successfully assigned "${currentPlan.planTitle}" to ${clientName}!`)

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
      {/* Studio Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid rgba(212,160,23,0.2)',
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(212,160,23,0.4)',
            }}
          >
            <GaaIcon name="target" size={20} style={{ color: '#0A0E18' }} />
          </div>

          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800 }}>
              Master Periodization Studio · Gemini 3.8 Flash
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '0.03em',
              }}
            >
              Coach Gordon AI Custom Program Studio
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsIntakeDrawerOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#0A0E18',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="target" size={14} style={{ color: '#0A0E18' }} />
            {currentPlan ? 'Modify Intake / Re-Synthesize' : 'Open AI Intake Form'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                borderRadius: 6,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Exit Studio
            </button>
          )}
        </div>
      </div>

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

      {/* Empty State Banner if no plan is generated yet */}
      {!currentPlan && !isSynthesizing && (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(212,160,23,0.3)',
            borderRadius: 10,
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(212,160,23,0.1)',
              border: '1px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GaaIcon name="clipboard" size={28} style={{ color: 'var(--gold-lt)' }} />
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 19,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Ready to Generate {clientName}&apos;s Custom NASM OPT™ Program
          </h3>

          <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', maxWidth: 540, lineHeight: 1.5 }}>
            Open the AI Personalization Intake to capture {clientName}&apos;s lifestyle rhythms, movement superpowers, strict exclusions, home gym quirks, and nutrition mindset.
          </p>

          <button
            type="button"
            onClick={() => setIsIntakeDrawerOpen(true)}
            style={{
              marginTop: 6,
              background: 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#0A0E18',
              borderRadius: 8,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(212,160,23,0.3)',
            }}
          >
            <GaaIcon name="target" size={16} style={{ color: '#0A0E18' }} />
            Open Deep Personalization Intake
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
          clientSex,
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
