'use client'

import { useState, useEffect } from 'react'
import CoachCustomPeriodizationStudio from '@/components/coach/studio/CoachCustomPeriodizationStudio'
import CoachTravelRecalibratorModal from '@/components/coach/CoachTravelRecalibratorModal'
import GaaIcon from '@/components/ui/GaaIcon'
import { NASM_OPT_PHASE_STANDARDS, GeneratedMacrocyclePlan, type HandPortionNutritionPlan } from '@/lib/rag-nasm-program-generator'
import { parseInjuriesFromText } from '@/lib/sports-injuries'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import type { ParqEvaluationResult } from '@/lib/liability-shield'
import type { NutritionTargetsSnapshot } from '@/lib/weight-loss-program'
import type {
  CoachProgramTemplateRecord,
  EquipmentLibraryRecord,
  ExerciseLibraryRecord,
  WorkoutProgramTemplateRecord,
} from '@/lib/coach-programs'

interface LatestWorkoutPlan {
  id?: string | null
  name?: string | null
  goal?: string | null
  nasm_opt_phase?: number | null
  phase_name?: string | null
  sessions_per_week?: number | null
  estimated_duration_mins?: number | null
  created_at?: string | null
  plan_json?: {
    nutritionTargets?: NutritionTargetsSnapshot
    workouts?: Array<{
      day: number
      focus: string
      scheduledDate?: string | null
      notes?: string | null
      exercises: Array<{
        libraryExerciseId?: string | null
        name: string
        sets: string
        reps: string
        tempo?: string | null
        rest?: string | null
        notes?: string | null
        description?: string | null
        primaryEquipment?: string[] | null
        imageUrl?: string | null
        videoUrl?: string | null
      }>
    }>
    isTravelAdapted?: boolean
    travelScenario?: string
    travelRecalibratedAt?: string
    overwrittenAt?: string
    [key: string]: unknown
  } | null
}

interface CoachProgramWorkspaceProps {
  clientId: string
  clientName?: string
  latestPlan: LatestWorkoutPlan | null
  allPlans?: LatestWorkoutPlan[]
  latestAssessment?: NasmAssessmentRecord | null
  templates?: WorkoutProgramTemplateRecord[]
  coachTemplates?: CoachProgramTemplateRecord[]
  exercises?: ExerciseLibraryRecord[]
  equipment?: EquipmentLibraryRecord[]
  contraindicationNotes?: string[]
  contraindicationTags?: string[]
  injuriesLimitations?: string | null
  medicalEvaluation?: ParqEvaluationResult | null
  readinessSummary?: {
    completionRate14d: number
    avgRpe14d: number | null
    completedSessions7d: number
    daysSinceLastCompleted: number | null
    readiness: 'high' | 'moderate' | 'low'
    recommendation: string
  }
  initialEquipmentAccess?: string[]
  libraryEquipmentNames?: string[]
  cardioEquipmentAccess?: string[]
  initialSessionsPerWeek?: number | null
  clientAge?: number | null
  preferredTrainingDays?: string[]
}

const OPT_PHASES_ORDER = [
  { phase: 1, label: '1. Stabilization', short: 'Stabilization' },
  { phase: 2, label: '2. Strength End.', short: 'Strength End.' },
  { phase: 3, label: '3. Hypertrophy', short: 'Hypertrophy' },
  { phase: 4, label: '4. Max Strength', short: 'Max Strength' },
  { phase: 5, label: '5. Power & PAP', short: 'Power / PAP' },
]

export default function CoachProgramWorkspace({
  clientId,
  clientName = 'Athlete',
  latestPlan,
  allPlans = [],
  latestAssessment,
  contraindicationNotes = [],
  contraindicationTags = [],
  injuriesLimitations = null,
  medicalEvaluation,
  initialEquipmentAccess = [],
  initialSessionsPerWeek = null,
  clientAge = null,
}: CoachProgramWorkspaceProps) {
  const [plansList, setPlansList] = useState<LatestWorkoutPlan[]>(
    allPlans && allPlans.length > 0 ? allPlans : (latestPlan ? [latestPlan] : [])
  )
  const [activePlan, setActivePlan] = useState<LatestWorkoutPlan | null>(latestPlan ?? (plansList[0] ?? null))
  const [showActivePlanDetails, setShowActivePlanDetails] = useState<boolean>(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false)
  const [isTravelModalOpen, setIsTravelModalOpen] = useState<boolean>(false)
  const [isDeletingPlanId, setIsDeletingPlanId] = useState<string | null>(null)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const currentPhase = activePlan?.nasm_opt_phase ?? 1
  const nextPhase = currentPhase < 5 ? currentPhase + 1 : 1

  // Studio Controls synchronized with active plan
  const [studioPhase, setStudioPhase] = useState<number>(currentPhase)
  const [studioGoal] = useState<'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'>(() => {
    const rawGoal = String(activePlan?.goal ?? '').toLowerCase()
    if (rawGoal.includes('fat') || rawGoal.includes('loss')) return 'fat_loss'
    if (rawGoal.includes('hyper') || rawGoal.includes('gain') || rawGoal.includes('muscle')) return 'hypertrophy'
    if (rawGoal.includes('perf') || rawGoal.includes('power') || rawGoal.includes('strength')) return 'performance'
    return 'hypertrophy'
  })

  const ohsaCompensations = latestAssessment?.ohsa_findings?.map(f => f.compensation) ?? []

  const handleAdvanceToNextPhase = () => {
    setStudioPhase(nextPhase)
    const studioEl = document.getElementById('rag-studio-section')
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleEditActivePlan = () => {
    setStudioPhase(currentPhase)
    const studioEl = document.getElementById('rag-studio-section')
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this workout program? This cannot be undone.')) return
    setIsDeletingPlanId(planId)
    try {
      const res = await fetch(`/api/coach/workout-plans?id=${planId}&clientId=${clientId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete plan.')
      }
      const updated = plansList.filter(p => p.id !== planId)
      setPlansList(updated)
      if (activePlan?.id === planId) {
        setActivePlan(updated[0] ?? null)
      }
      setActionStatus('✓ Program version removed successfully.')
      setTimeout(() => setActionStatus(null), 4000)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      alert(errObj?.message || 'Error deleting plan')
    } finally {
      setIsDeletingPlanId(null)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('tab=periodization')) {
      const el = document.getElementById('rag-studio-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [])

  const handlePlanAssignedFromStudio = (
    newPlan: GeneratedMacrocyclePlan,
    nutritionTargets?: NutritionTargetsSnapshot
  ) => {
    const updatedPlanRecord: LatestWorkoutPlan = {
      id: activePlan?.id || 'assigned-plan-' + Date.now(),
      name: newPlan.planTitle,
      goal: newPlan.primaryGoal,
      nasm_opt_phase: newPlan.nasmOptPhase,
      phase_name: newPlan.phaseName,
      sessions_per_week: newPlan.sessionsPerWeek,
      estimated_duration_mins: 55,
      created_at: new Date().toISOString(),
      plan_json: {
        ...(nutritionTargets ? { nutritionTargets } : {}),
        clinicalRationale: newPlan.clinicalRationale,
        handPortionPlan: newPlan.handPortionPlan,
        dualCardioPlan: newPlan.dualCardioPlan,
        strengthCardioBlendSummary: newPlan.strengthCardioBlendSummary,
        periodizationPlan: {
          weeklyMemos: newPlan.periodizationWeeklyMemos,
          ragSourcesCited: newPlan.ragSourcesCited,
        },
        workouts: newPlan.workouts.map(w => ({
          day: w.day,
          focus: w.focus,
          notes: w.dailyPeriodizationMemo,
          exercises: w.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            tempo: ex.tempo,
            rest: ex.rest,
            notes: undefined,
            description: ex.nasmClinicalSource,
          })),
        })),
      },
    }

    setActivePlan(updatedPlanRecord)
    setPlansList(prev => [updatedPlanRecord, ...prev.filter(p => p.id !== updatedPlanRecord.id)])
    setActionStatus(`✓ Deployed "${newPlan.planTitle}" to ${clientName}'s active programming! Advancing to Stage 7: Delivery Kickoff...`)
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = `/coach/clients/${clientId}?tab=sessions#workspace-tab-content`
      }
    }, 1400)
  }

  const activeWorkouts = activePlan?.plan_json?.workouts ?? []
  const currentPhaseStandards = NASM_OPT_PHASE_STANDARDS[currentPhase] ?? NASM_OPT_PHASE_STANDARDS[1]
  const detectedInjuries = parseInjuriesFromText(injuriesLimitations)
  const allContraTags = Array.from(
    new Set([...contraindicationTags, ...detectedInjuries.selectedInjuryIds])
  )
  const hasMedicalAlert = allContraTags.length > 0 || (medicalEvaluation && medicalEvaluation.flaggedQuestionsCount > 0)

  return (
    <div style={{ display: 'grid', gap: 22, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* ── PAR-Q Medical Alert Banner ─────────────────────────────────── */}
      {hasMedicalAlert && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(20,10,15,0.95) 100%)',
            border: '1px solid rgba(239,68,68,0.45)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 8px 24px rgba(239,68,68,0.15)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, background: '#EF4444', color: '#FFFFFF', fontWeight: 800, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="alert-triangle" size={12} tone="white" />
                <span>PAR-Q Medical Alert</span>
              </span>
              <span style={{ color: 'var(--gold-lt)', fontSize: 12, fontWeight: 700 }}>
                {medicalEvaluation?.riskTier || 'Health Screening Limitations Reported'}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#FFFFFF', fontSize: 13, lineHeight: 1.4 }}>
              <strong>Reported Limitations / Red Flags:</strong> {contraindicationNotes.join(' · ') || 'Client reported health screening conditions requiring movement adaptations.'}
            </p>
            <p style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: 12 }}>
              Use the RAG Program Studio below to generate a safe protocol with automatic joint/vascular substitutions and overwrite the client's preexisting routine.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('rag-studio-section')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 12,
              borderRadius: 6,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="lightning" size={13} tone="inherit" />
            <span>Overwrite with Safe Protocol →</span>
          </button>
        </div>
      )}

      {actionStatus && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', color: '#34D399', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
          {actionStatus}
        </div>
      )}

      {/* ── Active Assigned Program Master Status Cockpit ────────────────── */}
      {activePlan ? (
        <div
          style={{
            border: '1px solid rgba(212,160,23,0.45)',
            background: 'linear-gradient(180deg, rgba(20,28,48,0.95) 0%, rgba(10,14,24,0.98) 100%)',
            padding: 'clamp(14px, 3.5vw, 24px)',
            borderRadius: 14,
            display: 'grid',
            gap: 18,
            boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
            boxSizing: 'border-box',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 11,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                    color: '#0A0E18',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="check" size={11} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
                  <span>Active Assigned Program</span>
                </span>
                <span
                  style={{
                    fontSize: 11,
                    background: 'rgba(212,160,23,0.15)',
                    color: 'var(--gold-lt)',
                    border: '1px solid rgba(212,160,23,0.3)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  Phase {activePlan.nasm_opt_phase ?? 1}: {activePlan.phase_name ?? 'Stabilization Endurance'}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  margin: '8px 0 4px',
                  color: '#FFFFFF',
                }}
              >
                {activePlan.name || 'Personalized NASM OPT™ Program'}
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><GaaIcon name="lightning" size={13} tone="gold" /> <span><strong>{activePlan.sessions_per_week ?? 4}</strong> Days / Week</span></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><GaaIcon name="timer" size={13} tone="gold" /> <span><strong>{activePlan.estimated_duration_mins ?? 55}</strong> Mins / Session</span></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><GaaIcon name="target" size={13} tone="gold" /> <span>Goal: <strong>{activePlan.goal?.replace(/_/g, ' ') || 'Hypertrophy'}</strong></span></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><GaaIcon name="grid" size={13} tone="gold" /> <span>Routine Days: <strong>{activeWorkouts.length || activePlan.sessions_per_week || 4}</strong></span></span>
              </div>
            </div>

            {/* Quick Actions to tie into RAG Studio */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a
                href={`/coach/clients/${clientId}?tab=sessions#workspace-tab-content`}
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#080E14',
                  padding: '9px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 900,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}
              >
                <span>Proceed to Stage 7: Delivery Kickoff ➔</span>
              </a>

              <button
                type="button"
                onClick={() => setShowActivePlanDetails(prev => !prev)}
                style={{
                  background: showActivePlanDetails ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#FFFFFF',
                  padding: '9px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name={showActivePlanDetails ? 'chevron-up' : 'chevron-down'} size={12} tone="white" />
                <span>{showActivePlanDetails ? 'Hide Routine Breakdown' : 'View Active Routine'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTravelModalOpen(true)}
                className="tactile-btn"
                style={{
                  background: activePlan?.plan_json?.isTravelAdapted ? 'rgba(245,158,11,0.2)' : 'rgba(197,160,89,0.15)',
                  border: activePlan?.plan_json?.isTravelAdapted ? '1.5px solid #F59E0B' : '1px solid var(--gold)',
                  color: activePlan?.plan_json?.isTravelAdapted ? '#FCD34D' : 'var(--gold-lt)',
                  padding: '9px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <GaaIcon name="plane" size={14} tone={activePlan?.plan_json?.isTravelAdapted ? 'amber' : 'gold'} />
                <span>{activePlan?.plan_json?.isTravelAdapted ? 'Active: Travel Split (Recalibrate)' : 'Travel & Hotel Re-Calibrate'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHistoryDrawer(prev => !prev)}
                style={{
                  background: showHistoryDrawer ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  padding: '9px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="calendar" size={12} tone="gold" />
                <span>Program History ({plansList.length})</span>
              </button>

              <button
                type="button"
                onClick={handleEditActivePlan}
                style={{
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  padding: '9px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="edit" size={13} tone="gold" />
                <span>Edit / Overwrite Routine</span>
              </button>

              <button
                type="button"
                onClick={handleAdvanceToNextPhase}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  border: 'none',
                  color: '#0A0E18',
                  padding: '9px 18px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(212,160,23,0.35)',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="lightning" size={13} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
                <span>Advance to Phase {nextPhase} ({OPT_PHASES_ORDER.find(p => p.phase === nextPhase)?.short})</span>
              </button>
            </div>
          </div>

          {typeof activePlan.plan_json?.clinicalRationale === 'string' && activePlan.plan_json.clinicalRationale && (
            <div
              style={{
                padding: '14px 18px',
                border: '1px solid rgba(212,160,23,0.35)',
                borderRadius: 8,
                background: 'rgba(212,160,23,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
                <GaaIcon name="clipboard" size={13} style={{ color: 'var(--gold-lt)' }} />
                <span>Coach Gordon Clinical Memo</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#E2E8F0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {activePlan.plan_json.clinicalRationale}
              </p>
            </div>
          )}

          {Boolean(activePlan.plan_json?.handPortionPlan) && (() => {
            const hp = activePlan.plan_json?.handPortionPlan as HandPortionNutritionPlan | undefined
            return (
              <section
                aria-label="Active program hand-portion nutrition plan"
                style={{
                  padding: '14px 16px',
                  border: '1px solid rgba(212,160,23,0.45)',
                  borderRadius: 9,
                  background: 'rgba(8,14,24,0.8)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {hp?.title || 'Precision Nutrition Hand-Portion Plate (No Calorie Counting)'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#F87171', fontWeight: 800 }}>✋ Protein</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {hp?.guidelines?.protein?.portionsPerMeal}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#34D399', fontWeight: 800 }}>✊ Vegetables</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {hp?.guidelines?.vegetables?.portionsPerMeal}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#FBBF24', fontWeight: 800 }}>🤲 Smart Carbs</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {hp?.guidelines?.smartCarbs?.portionsPerMeal}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#38BDF8', fontWeight: 800 }}>👍 Healthy Fats</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {hp?.guidelines?.healthyFats?.portionsPerMeal}
                    </div>
                  </div>
                </div>
              </section>
            )
          })()}

          {activePlan.plan_json?.nutritionTargets && (
            <section
              aria-label="Active program nutrition targets"
              style={{
                padding: '14px 16px',
                border: '1px solid rgba(212,160,23,0.45)',
                borderRadius: 9,
                background: 'rgba(8,14,24,0.8)',
              }}
            >
              <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Daily nutrition targets · saved with this program
              </div>
              <div style={{ marginTop: 6, color: '#FFFFFF', fontSize: 21, fontWeight: 800, fontFamily: 'var(--font-telemetry, monospace)' }}>
                {activePlan.plan_json.nutritionTargets.targetCalories.toLocaleString()} kcal / day
              </div>
              <div style={{ marginTop: 3, color: 'var(--gray)', fontSize: 14 }}>
                Protein {activePlan.plan_json.nutritionTargets.proteinGrams}g · Carbs {activePlan.plan_json.nutritionTargets.carbGrams}g · Fat {activePlan.plan_json.nutritionTargets.fatGrams}g
              </div>
            </section>
          )}

          {/* ── Program History & Version Switcher Drawer ─────────────── */}
          {showHistoryDrawer && (
            <div
              style={{
                background: 'rgba(10,14,24,0.95)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
                    Program Version History ({plansList.length} total)
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                    Switch active routines, inspect past mesocycles, or delete deprecated programs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 18 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {plansList.map((planItem, idx) => {
                  const isCurrentActive = (planItem.id && activePlan?.id) ? planItem.id === activePlan.id : idx === 0
                  return (
                    <div
                      key={planItem.id || `plan-${idx}`}
                      style={{
                        padding: '12px 16px',
                        background: isCurrentActive ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.02)',
                        border: isCurrentActive ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: 14 }}>
                            {planItem.name || `Phase ${planItem.nasm_opt_phase ?? 1} Routine`}
                          </span>
                          {isCurrentActive && (
                            <span style={{ fontSize: 10, background: 'var(--gold)', color: '#0A0E18', fontWeight: 800, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase' }}>
                              Active
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                            Phase {planItem.nasm_opt_phase ?? 1} · {planItem.sessions_per_week ?? 4}d/wk
                          </span>
                        </div>
                        {planItem.created_at && (
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                            Created: {new Date(planItem.created_at).toLocaleDateString()}
                            {planItem.plan_json?.overwrittenAt && ` · Overwritten: ${new Date(planItem.plan_json.overwrittenAt as string).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!isCurrentActive && (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePlan(planItem)
                              setActionStatus(`✓ Activated "${planItem.name || 'Protocol'}"`)
                              setTimeout(() => setActionStatus(null), 3000)
                            }}
                            style={{
                              padding: '5px 12px',
                              background: 'rgba(212,160,23,0.15)',
                              border: '1px solid rgba(212,160,23,0.4)',
                              color: 'var(--gold-lt)',
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            Set as Active
                          </button>
                        )}
                        {planItem.id && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(planItem.id!)}
                            disabled={isDeletingPlanId === planItem.id}
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              color: '#F87171',
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 4,
                              cursor: isDeletingPlanId === planItem.id ? 'wait' : 'pointer',
                            }}
                          >
                            {isDeletingPlanId === planItem.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 5-Phase Periodization Stepper Bar */}
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '14px 16px',
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
              <span>NASM OPT™ Periodization Progression</span>
              <span style={{ color: 'var(--gold-lt)' }}>Current: Phase {currentPhase} ({currentPhaseStandards.phaseName})</span>
            </div>

            <div className="responsive-tabs-scroll" style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
              {OPT_PHASES_ORDER.map(item => {
                const isActive = item.phase === currentPhase
                const isPast = item.phase < currentPhase

                return (
                  <div
                    key={item.phase}
                    style={{
                      flex: 1,
                      minWidth: 100,
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: isActive
                        ? 'rgba(212,160,23,0.18)'
                        : isPast
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.02)',
                      border: isActive
                        ? '1px solid var(--gold)'
                        : isPast
                        ? '1px solid rgba(255,255,255,0.12)'
                        : '1px solid rgba(255,255,255,0.04)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: isActive ? 'var(--gold-lt)' : isPast ? '#FFFFFF' : 'var(--gray)',
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--gray)', marginTop: 2 }}>
                      {isActive ? '● Active' : isPast ? '✓ Done' : 'Next'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Expandable Active Plan Routine Breakdown */}
          {showActivePlanDetails && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: 16,
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                Active Plan Daily Exercises & Tempos ({activeWorkouts.length} Days)
              </div>

              {activeWorkouts.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--gray)' }}>
                  Detailed exercise list is active on client's dashboard.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {activeWorkouts.map(w => (
                    <div
                      key={w.day}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-lt)', marginBottom: 6 }}>
                        Day {w.day}: {w.focus}
                      </div>

                      <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
                        {w.exercises?.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                              gap: 6,
                              padding: '6px 0',
                              borderBottom: exIdx < w.exercises.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            }}
                          >
                            <span style={{ color: '#FFFFFF', fontWeight: 600, minWidth: 140 }}>• {ex.name}</span>
                            <span style={{ color: 'var(--gray)', fontSize: 12 }}>
                              {ex.sets} sets × {ex.reps} reps {ex.tempo ? `| Tempo: ${ex.tempo}` : ''} {ex.rest ? `| Rest: ${ex.rest}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            border: '1px dashed rgba(212,160,23,0.4)',
            background: 'rgba(212,160,23,0.05)',
            padding: 'clamp(14px, 3.5vw, 22px)',
            borderRadius: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            boxSizing: 'border-box',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div>
            <span
              style={{
                fontSize: 10,
                background: 'rgba(212,160,23,0.2)',
                color: 'var(--gold-lt)',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              No Program Assigned Yet
            </span>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, margin: '6px 0 2px', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              Ready for Initial Periodization
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)' }}>
              Use the NASM OPT™ Program Generator Studio below to synthesize and assign their initial training mesocycle.
            </p>
          </div>
        </div>
      )}

      {/* ── Linked NASM Assessment Card ───────────────────────────────── */}
      {latestAssessment && (
        <div
          style={{
            border: '1px solid rgba(52,211,153,0.35)',
            background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(10,20,30,0.95) 100%)',
            padding: 'clamp(14px, 3.5vw, 18px)',
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            boxSizing: 'border-box',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  background: '#10B981',
                  color: '#0A0E18',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                }}
              >
                Kinetic Assessment Linked
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 12 }}>
                Screened {new Date(latestAssessment.assessment_date).toLocaleDateString()}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.4 }}>
              <strong>{latestAssessment.ohsa_findings?.length ?? 0} Compensations Screened:</strong>{' '}
              {latestAssessment.ohsa_findings?.map(f => f.compensation.replace(/_/g, ' ')).join(', ') || 'Clean kinetic chain'}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11 }}>
              <span style={{ color: '#F87171' }}>
                Inhibit/Lengthen: {(latestAssessment.overactive_muscles ?? []).slice(0, 3).join(', ') || 'None'}
              </span>
              <span style={{ color: '#34D399' }}>
                Activate/Integrate: {(latestAssessment.underactive_muscles ?? []).slice(0, 3).join(', ') || 'None'}
              </span>
            </div>
          </div>

          <a
            href={`/coach/clients/${clientId}?tab=assessment`}
            style={{
              padding: '6px 14px',
              border: '1px solid #10B981',
              background: 'rgba(16,185,129,0.15)',
              color: '#34D399',
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              textTransform: 'uppercase',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            Review Full CEx Plan →
          </a>
        </div>
      )}

      {/* ── Periodization Engine Studio ────────────────────────────── */}
      <div id="rag-studio-section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CoachCustomPeriodizationStudio
          clientId={clientId}
          clientName={clientName}
          clientAge={clientAge}
          initialGoal={studioGoal}
          initialPhase={studioPhase}
          initialEquipmentAccess={initialEquipmentAccess}
          initialSessionsPerWeek={initialSessionsPerWeek || 3}
          initialCompensations={ohsaCompensations}
          contraindicationTags={allContraTags}
          contraindicationNotes={contraindicationNotes}
          injuriesLimitations={injuriesLimitations}
          existingPlan={activePlan}
          onPlanAssigned={handlePlanAssignedFromStudio}
        />
      </div>

      {isTravelModalOpen && (
        <CoachTravelRecalibratorModal
          isOpen={isTravelModalOpen}
          clientId={clientId}
          clientName={clientName}
          currentPlan={activePlan}
          onClose={() => setIsTravelModalOpen(false)}
          onPlanDeployed={(newPlan) => {
            setActivePlan(newPlan as LatestWorkoutPlan)
          }}
        />
      )}
    </div>
  )
}
