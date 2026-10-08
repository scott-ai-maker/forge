'use client'

import React, { useState } from 'react'
import type {
  GeneratedMacrocyclePlan,
  GeneratedWorkoutDay,
  GeneratedExerciseItem,
} from '@/lib/rag-nasm-program-generator'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'
import { GaaIcon } from '@/components/ui/GaaIcon'

export interface CoachProgramPreviewCanvasProps {
  plan: GeneratedMacrocyclePlan
  clientId: string
  clientName: string
  isDeploying: boolean
  deploySuccessMessage: string | null
  deployErrorMessage: string | null
  onUpdatePlan: (updatedPlan: GeneratedMacrocyclePlan) => void
  onDeployPlan: (overwrite: boolean) => Promise<void>
  onOpenIntakeDrawer: () => void
  onOpenExerciseVideo: (exerciseName: string) => void
  onOpenExerciseSwap: (exerciseName: string, workoutDayIndex: number, exerciseIndex: number) => void
}

export default function CoachProgramPreviewCanvas({
  plan,
  clientName,
  isDeploying,
  deploySuccessMessage,
  deployErrorMessage,
  onUpdatePlan,
  onDeployPlan,
  onOpenIntakeDrawer,
  onOpenExerciseVideo,
  onOpenExerciseSwap,
}: CoachProgramPreviewCanvasProps) {
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1)
  const [isEditingMemo, setIsEditingMemo] = useState<boolean>(false)
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'memo' | 'nutrition' | 'cardio' | 'matrix'>('matrix')

  const currentDayIndex = plan.workouts.findIndex(w => w.day === activeDayNumber)
  const activeWorkout: GeneratedWorkoutDay =
    currentDayIndex >= 0 ? plan.workouts[currentDayIndex] : plan.workouts[0]
  const safeDayIndex = currentDayIndex >= 0 ? currentDayIndex : 0

  // Inline exercise edits
  const handleExerciseChange = (
    exerciseIndex: number,
    field: keyof GeneratedExerciseItem,
    value: string
  ) => {
    const updatedWorkouts = [...plan.workouts]
    const updatedExercises = [...updatedWorkouts[safeDayIndex].exercises]
    const targetEx = { ...updatedExercises[exerciseIndex] }

    if (field === 'coachingCues') {
      targetEx.coachingCues = value.split('\n').filter(Boolean)
    } else {
      (targetEx as Record<string, unknown>)[field] = value
    }

    updatedExercises[exerciseIndex] = targetEx
    updatedWorkouts[safeDayIndex] = {
      ...updatedWorkouts[safeDayIndex],
      exercises: updatedExercises,
    }

    onUpdatePlan({
      ...plan,
      workouts: updatedWorkouts,
    })
  }

  // Remove exercise
  const handleRemoveExercise = (exerciseIndex: number) => {
    const updatedWorkouts = [...plan.workouts]
    const updatedExercises = updatedWorkouts[safeDayIndex].exercises.filter((_, idx) => idx !== exerciseIndex)
    updatedWorkouts[safeDayIndex] = {
      ...updatedWorkouts[safeDayIndex],
      exercises: updatedExercises,
    }
    onUpdatePlan({
      ...plan,
      workouts: updatedWorkouts,
    })
  }

  // Add a blank exercise
  const handleAddExercise = () => {
    const updatedWorkouts = [...plan.workouts]
    const updatedExercises = [
      ...updatedWorkouts[safeDayIndex].exercises,
      {
        block: 'resistance' as const,
        name: 'New Custom Exercise',
        sets: '3',
        reps: '12',
        tempo: plan.nasmOptPhase === 1 ? '4/2/1' : '2/0/2',
        rest: '60s',
        coachingCues: ['Focus on controlled tempo and kinetic alignment.'],
        nasmClinicalSource: 'Coach Custom Movement Addition',
      },
    ]
    updatedWorkouts[safeDayIndex] = {
      ...updatedWorkouts[safeDayIndex],
      exercises: updatedExercises,
    }
    onUpdatePlan({
      ...plan,
      workouts: updatedWorkouts,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Top Canvas Header ────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(13,22,41,0.95) 0%, rgba(8,13,26,0.98) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: 'rgba(212,160,23,0.2)',
                color: 'var(--gold-lt, #F5D061)',
                padding: '3px 8px',
                borderRadius: 4,
                fontWeight: 800,
              }}
            >
              NASM OPT™ {plan.phaseName || `Phase ${plan.nasmOptPhase}`}
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              {plan.sessionsPerWeek} Days / Week · {plan.totalWeeks || 4}-Week Mesocycle
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '6px 0 2px',
              letterSpacing: '0.03em',
            }}
          >
            {plan.planTitle}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1' }}>
            Tailored bespoke program for <strong>{clientName}</strong> · Primary Focus: <strong>{plan.primaryGoal}</strong>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={onOpenIntakeDrawer}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(212,160,23,0.3)',
              color: 'var(--gold-lt, #F5D061)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="target" size={14} style={{ color: 'var(--gold-lt)' }} />
            Edit Intake Nuance
          </button>

          <button
            type="button"
            onClick={() => onDeployPlan(overwriteExisting)}
            disabled={isDeploying}
            style={{
              background: isDeploying
                ? 'rgba(212,160,23,0.5)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 800,
              cursor: isDeploying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            {isDeploying ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    border: '2px solid #FFFFFF',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Deploying...
              </>
            ) : (
              <>
                <GaaIcon name="shield-check" size={16} style={{ color: '#FFFFFF' }} />
                Approve & Deploy to Athlete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Deployment Feedback */}
      {deploySuccessMessage && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)',
            border: '1px solid #10B981',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#6EE7B7',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="shield-check" size={16} style={{ color: '#10B981' }} />
          {deploySuccessMessage}
        </div>
      )}

      {deployErrorMessage && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.1) 100%)',
            border: '1px solid #EF4444',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#FCA5A5',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="alert-triangle" size={16} style={{ color: '#EF4444' }} />
          {deployErrorMessage}
        </div>
      )}

      {/* ── Sub-Navigation Tabs ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          paddingBottom: 6,
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          style={{
            background: activeTab === 'matrix' ? 'rgba(212,160,23,0.2)' : 'transparent',
            border: activeTab === 'matrix' ? '1px solid var(--gold)' : '1px solid transparent',
            color: activeTab === 'matrix' ? 'var(--gold-lt)' : '#94A3B8',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="dumbbell" size={14} style={{ color: activeTab === 'matrix' ? 'var(--gold-lt)' : '#94A3B8' }} />
          Workouts Matrix ({plan.workouts.length} Days)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('memo')}
          style={{
            background: activeTab === 'memo' ? 'rgba(212,160,23,0.2)' : 'transparent',
            border: activeTab === 'memo' ? '1px solid var(--gold)' : '1px solid transparent',
            color: activeTab === 'memo' ? 'var(--gold-lt)' : '#94A3B8',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="clipboard" size={14} style={{ color: activeTab === 'memo' ? 'var(--gold-lt)' : '#94A3B8' }} />
          Master Coach Memo
        </button>

        {plan.handPortionPlan && (
          <button
            type="button"
            onClick={() => setActiveTab('nutrition')}
            style={{
              background: activeTab === 'nutrition' ? 'rgba(212,160,23,0.2)' : 'transparent',
              border: activeTab === 'nutrition' ? '1px solid var(--gold)' : '1px solid transparent',
              color: activeTab === 'nutrition' ? 'var(--gold-lt)' : '#94A3B8',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="utensils" size={14} style={{ color: activeTab === 'nutrition' ? 'var(--gold-lt)' : '#94A3B8' }} />
            Precision Hand-Portion Plate
          </button>
        )}

        {plan.dualCardioPlan && (
          <button
            type="button"
            onClick={() => setActiveTab('cardio')}
            style={{
              background: activeTab === 'cardio' ? 'rgba(212,160,23,0.2)' : 'transparent',
              border: activeTab === 'cardio' ? '1px solid var(--gold)' : '1px solid transparent',
              color: activeTab === 'cardio' ? 'var(--gold-lt)' : '#94A3B8',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="activity" size={14} style={{ color: activeTab === 'cardio' ? 'var(--gold-lt)' : '#94A3B8' }} />
            Dual-Cardio Architecture
          </button>
        )}
      </div>

      {/* ── TAB 1: MASTER COACH BRIEFING MEMO ───────────────────────── */}
      {activeTab === 'memo' && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(13,22,41,0.9) 0%, rgba(8,13,26,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--gold, #D4A017)',
                  color: '#0A0E18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                G
              </span>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontSize: 18,
                    fontWeight: 700,
                    margin: 0,
                    color: '#FFFFFF',
                  }}
                >
                  Master Coach Briefing Memo · Coach Gordon
                </h3>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  Authentic clinical rationale written directly to {clientName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingMemo(!isEditingMemo)}
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
              {isEditingMemo ? '✓ Done Editing' : '✏️ Edit Memo'}
            </button>
          </div>

          {isEditingMemo ? (
            <textarea
              rows={14}
              value={plan.clinicalRationale || ''}
              onChange={e => onUpdatePlan({ ...plan, clinicalRationale: e.target.value })}
              style={{
                width: '100%',
                background: '#070C18',
                color: '#FFFFFF',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8,
                padding: 16,
                fontSize: 14,
                lineHeight: 1.6,
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: 20,
                color: '#E2E8F0',
                fontSize: 14,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {plan.clinicalRationale || 'No clinical rationale generated.'}
            </div>
          )}

          {/* RAG Sources Cited */}
          {plan.ragSourcesCited && plan.ragSourcesCited.length > 0 && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
                NASM Clinical Knowledge Bases Cited:
              </span>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#94A3B8' }}>
                {plan.ragSourcesCited.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PRECISION NUTRITION HAND-PORTIONS ─────────────────── */}
      {activeTab === 'nutrition' && plan.handPortionPlan && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(13,22,41,0.9) 0%, rgba(8,13,26,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Precision Nutrition Architecture
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '4px 0',
              }}
            >
              {plan.handPortionPlan.title}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
              Zero calorie counting. Visual hand portions tailored to {clientName}&apos;s physiological demands ({plan.handPortionPlan.mealsPerDay} meals/day).
            </p>
          </div>

          {/* 4 Hand Portions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {/* Protein */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>✋</span>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#F87171', fontWeight: 800 }}>
                    Protein
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    {plan.handPortionPlan.guidelines.protein.portionsPerMeal} ({plan.handPortionPlan.guidelines.protein.handMeasure})
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
                <strong>Examples:</strong> {plan.handPortionPlan.guidelines.protein.examples}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                {plan.handPortionPlan.guidelines.protein.rationale}
              </div>
            </div>

            {/* Vegetables */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>✊</span>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#34D399', fontWeight: 800 }}>
                    Vegetables
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    {plan.handPortionPlan.guidelines.vegetables.portionsPerMeal} ({plan.handPortionPlan.guidelines.vegetables.handMeasure})
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
                <strong>Examples:</strong> {plan.handPortionPlan.guidelines.vegetables.examples}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                {plan.handPortionPlan.guidelines.vegetables.rationale}
              </div>
            </div>

            {/* Smart Carbs */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🤲</span>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#FBBF24', fontWeight: 800 }}>
                    Smart Carbs
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    {plan.handPortionPlan.guidelines.smartCarbs.portionsPerMeal} ({plan.handPortionPlan.guidelines.smartCarbs.handMeasure})
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
                <strong>Examples:</strong> {plan.handPortionPlan.guidelines.smartCarbs.examples}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                {plan.handPortionPlan.guidelines.smartCarbs.rationale}
              </div>
            </div>

            {/* Healthy Fats */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>👍</span>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800 }}>
                    Healthy Fats
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    {plan.handPortionPlan.guidelines.healthyFats.portionsPerMeal} ({plan.handPortionPlan.guidelines.healthyFats.handMeasure})
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
                <strong>Examples:</strong> {plan.handPortionPlan.guidelines.healthyFats.examples}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                {plan.handPortionPlan.guidelines.healthyFats.rationale}
              </div>
            </div>
          </div>

          {/* Satiety Cue & Hydration */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 4 }}>
                🥢 Mindful Satiety Cue (Hara Hachi Bu)
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#E2E8F0', lineHeight: 1.5 }}>
                {plan.handPortionPlan.mindfulEatingCue}
              </p>
            </div>

            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800, marginBottom: 4 }}>
                💧 Hydration Anchor
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#E2E8F0', lineHeight: 1.5 }}>
                {plan.handPortionPlan.hydrationAnchor}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: DUAL-CARDIO ARCHITECTURE ──────────────────────────── */}
      {activeTab === 'cardio' && plan.dualCardioPlan && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(13,22,41,0.9) 0%, rgba(8,13,26,0.95) 100%)',
            border: '1px solid rgba(56,189,248,0.35)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800 }}>
              Biomechanical & Lifestyle Cardio Splitting
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '4px 0',
              }}
            >
              Dual-Cardio Protocol Blueprint
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
              Clean split between high-heat post-lift conditioning and fresh outdoor NEAT recovery rituals.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Card 1: Sweaty In-Home Finisher */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#F87171', fontWeight: 800 }}>
                  💦 Protocol A: Post-Lift Finisher
                </span>
                <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 700 }}>
                  {plan.dualCardioPlan.sweatyFinisher.durationMins} Mins
                </span>
              </div>

              <h4 style={{ margin: 0, fontSize: 16, color: '#FFFFFF' }}>
                {plan.dualCardioPlan.sweatyFinisher.title}
              </h4>

              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                <div><strong>Modality:</strong> {plan.dualCardioPlan.sweatyFinisher.modality}</div>
                <div><strong>Intensity Zone:</strong> {plan.dualCardioPlan.sweatyFinisher.zone}</div>
                <div><strong>Timing:</strong> {plan.dualCardioPlan.sweatyFinisher.timing}</div>
              </div>

              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                {plan.dualCardioPlan.sweatyFinisher.rationale}
              </div>
            </div>

            {/* Card 2: Fresh NEAT Walk */}
            {plan.dualCardioPlan.freshNeatWalk && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 8,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800 }}>
                    🌿 Protocol B: Fresh NEAT Ritual
                  </span>
                  <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 700 }}>
                    {plan.dualCardioPlan.freshNeatWalk.durationMins} Mins
                  </span>
                </div>

                <h4 style={{ margin: 0, fontSize: 16, color: '#FFFFFF' }}>
                  {plan.dualCardioPlan.freshNeatWalk.title}
                </h4>

                <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                  <div><strong>Modality:</strong> {plan.dualCardioPlan.freshNeatWalk.modality}</div>
                  <div><strong>Frequency:</strong> {plan.dualCardioPlan.freshNeatWalk.frequency}</div>
                  <div><strong>Timing:</strong> {plan.dualCardioPlan.freshNeatWalk.timing}</div>
                </div>

                <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                  {plan.dualCardioPlan.freshNeatWalk.rationale}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: WORKOUT MATRIX & EXERCISES ───────────────────────── */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Day Selector Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {plan.workouts.map(w => {
              const isSelected = w.day === activeDayNumber
              return (
                <button
                  key={w.day}
                  type="button"
                  onClick={() => setActiveDayNumber(w.day)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
                    background: isSelected ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.04)',
                    color: isSelected ? 'var(--gold-lt)' : '#CBD5E1',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Day {w.day}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>· {w.focus}</span>
                </button>
              )
            })}
          </div>

          {/* Active Workout Day View */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(13,22,41,0.9) 0%, rgba(8,13,26,0.95) 100%)',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* Day Focus Header */}
            <div
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--gold-lt)',
                    fontWeight: 800,
                  }}
                >
                  Day {activeWorkout.day} Focus ({activeWorkout.estimatedDurationMins || 35} mins)
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontSize: 19,
                    color: '#FFFFFF',
                    margin: '4px 0 2px',
                  }}
                >
                  {activeWorkout.focus}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                  {activeWorkout.dailyPeriodizationMemo}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddExercise}
                style={{
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold-lt)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                + Add Movement
              </button>
            </div>

            {/* Warm-Up Protocol Banner */}
            {activeWorkout.warmupProtocol && (
              <div
                style={{
                  background: 'rgba(56,189,248,0.06)',
                  border: '1px solid rgba(56,189,248,0.2)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800 }}>
                    Inhibit (SMR Foam Roll)
                  </div>
                  <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2 }}>
                    {activeWorkout.warmupProtocol.inhibitSmr?.join(', ') || 'Calves, Thoracic Spine'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800 }}>
                    Lengthen (Static Stretch)
                  </div>
                  <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2 }}>
                    {activeWorkout.warmupProtocol.lengthenStaticStretch?.join(', ') || 'Hip Flexors, Latissimus Dorsi'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800 }}>
                    Activate (Dynamic Movement)
                  </div>
                  <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2 }}>
                    {activeWorkout.warmupProtocol.activateDynamic?.join(', ') || 'Glute Bridges, Arm Hugs'}
                  </div>
                </div>
              </div>
            )}

            {/* Exercise Matrix Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeWorkout.exercises.map((ex, exIndex) => {
                const imgUrl = resolveGaaExerciseImage(ex.name) || BRAND_LOGO_FALLBACK_IMAGE
                return (
                  <div
                    key={`${ex.name}-${exIndex}`}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      {/* Thumbnail & Video Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          onClick={() => onOpenExerciseVideo(ex.name)}
                          title="Watch Official NASM Edge Demonstration"
                          style={{
                            width: 64,
                            height: 48,
                            borderRadius: 6,
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            background: '#04070E',
                            border: '1px solid rgba(212,160,23,0.3)',
                            flexShrink: 0,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={ex.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontSize: 14, color: 'var(--gold-lt)' }}>▶</span>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontSize: 10,
                                textTransform: 'uppercase',
                                color: 'var(--gold-lt)',
                                background: 'rgba(212,160,23,0.15)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontWeight: 800,
                              }}
                            >
                              {ex.block.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>
                              {ex.nasmClinicalSource || 'NASM Edge Catalog'}
                            </span>
                          </div>

                          <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                            {ex.name}
                          </div>
                        </div>
                      </div>

                      {/* Row Actions: Swap & Remove */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onOpenExerciseSwap(ex.name, safeDayIndex, exIndex)}
                          title="Substitute with biomechanically safe alternative"
                          style={{
                            background: 'rgba(212,160,23,0.12)',
                            border: '1px solid rgba(212,160,23,0.35)',
                            color: 'var(--gold-lt)',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          🔄 Swap
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(exIndex)}
                          title="Remove exercise"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#F87171',
                            borderRadius: 6,
                            padding: '6px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Inline Editable Prescription Controls */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                        gap: 8,
                        background: 'rgba(0,0,0,0.2)',
                        padding: '8px 10px',
                        borderRadius: 6,
                      }}
                    >
                      <div>
                        <label style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>Sets</label>
                        <input
                          type="text"
                          value={ex.sets}
                          onChange={e => handleExerciseChange(exIndex, 'sets', e.target.value)}
                          style={{
                            width: '100%',
                            background: '#070C18',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 4,
                            padding: '4px 6px',
                            fontSize: 12,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>Reps</label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={e => handleExerciseChange(exIndex, 'reps', e.target.value)}
                          style={{
                            width: '100%',
                            background: '#070C18',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 4,
                            padding: '4px 6px',
                            fontSize: 12,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>Tempo</label>
                        <input
                          type="text"
                          value={ex.tempo}
                          onChange={e => handleExerciseChange(exIndex, 'tempo', e.target.value)}
                          style={{
                            width: '100%',
                            background: '#070C18',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 4,
                            padding: '4px 6px',
                            fontSize: 12,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>Rest</label>
                        <input
                          type="text"
                          value={ex.rest}
                          onChange={e => handleExerciseChange(exIndex, 'rest', e.target.value)}
                          style={{
                            width: '100%',
                            background: '#070C18',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 4,
                            padding: '4px 6px',
                            fontSize: 12,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Coaching Cues */}
                    <div>
                      <label style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 2 }}>
                        Coaching Cues & Kinetic Anchors
                      </label>
                      <input
                        type="text"
                        value={ex.coachingCues?.join(' | ') || ''}
                        onChange={e => handleExerciseChange(exIndex, 'coachingCues', e.target.value)}
                        placeholder="e.g. Keep chest tall, brace core, drive through midfoot..."
                        style={{
                          width: '100%',
                          background: '#070C18',
                          color: '#FFFFFF',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 4,
                          padding: '6px 8px',
                          fontSize: 11,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Bottom Deployment Bar ────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          bottom: 12,
          background: 'linear-gradient(135deg, rgba(13,22,41,0.98) 0%, rgba(8,13,26,0.98) 100%)',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 10,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={overwriteExisting}
            onChange={e => setOverwriteExisting(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 12, color: '#E2E8F0' }}>
            Set as {clientName}&apos;s primary active workout program (overwrites active plan)
          </span>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onOpenIntakeDrawer}
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
            ← Modify Intake
          </button>

          <button
            type="button"
            onClick={() => onDeployPlan(overwriteExisting)}
            disabled={isDeploying}
            style={{
              background: isDeploying
                ? 'rgba(212,160,23,0.5)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              borderRadius: 6,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 800,
              cursor: isDeploying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            {isDeploying ? 'Deploying Program...' : '✓ Approve & Deploy Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
