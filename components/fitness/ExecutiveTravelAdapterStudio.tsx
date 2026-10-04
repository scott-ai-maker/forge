'use client'

import { useState } from 'react'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import {
  adaptWorkoutForTravel,
  ExercisePlanItem,
  TravelLocationScenario,
  TRAVEL_SCENARIO_META,
} from '@/lib/travel-workout-adapter'
import { isStrengthExercise } from '@/lib/exercise-logging-helpers'

interface ExecutiveTravelAdapterStudioProps {
  plan?: Record<string, unknown> | null
  onApplyTravelPlan?: (scenario: TravelLocationScenario, adaptedExercises: ExercisePlanItem[]) => void
}

const SCENARIO_ICONS: Record<TravelLocationScenario, GaaIconName> = {
  hotel_dumbbells_only: 'dumbbell',
  hotel_cables_cardio: 'lightning',
  hotel_room_bands: 'toolbox',
  commercial_full_gym: 'barbell',
}

const SCENARIO_KEYS = Object.keys(TRAVEL_SCENARIO_META) as TravelLocationScenario[]

export default function ExecutiveTravelAdapterStudio({
  plan,
  onApplyTravelPlan,
}: ExecutiveTravelAdapterStudioProps) {
  const workouts = Array.isArray(plan?.workouts) ? (plan.workouts as Record<string, unknown>[]) : []
  const firstWorkout = workouts[0]
  const planExercises = Array.isArray(firstWorkout?.exercises) ? (firstWorkout.exercises as Record<string, unknown>[]) : []
  const rawExercises: ExercisePlanItem[] = (Array.isArray(planExercises) && planExercises.length > 0)
    ? planExercises.map((ex: Record<string, unknown>) => ({
        name: String(ex?.name || 'Compound Movement'),
        sets: Number(ex?.sets) || 3,
        reps: String(ex?.reps || '10'),
        restSeconds: ex?.rest ? parseInt(String(ex.rest), 10) || 60 : 60,
        coachingCue: String(ex?.coachingCue || ex?.notes || 'Maintain controlled form'),
      }))
    : []

  const [selectedScenario, setSelectedScenario] = useState<TravelLocationScenario>('hotel_dumbbells_only')
  const [deployedStatus, setDeployedStatus] = useState<string | null>(null)

  const adaptedExercises = adaptWorkoutForTravel(rawExercises, selectedScenario)
  const currentMeta = TRAVEL_SCENARIO_META[selectedScenario] || TRAVEL_SCENARIO_META['hotel_dumbbells_only']

  const handleDeploy = () => {
    if (adaptedExercises.length === 0) return
    if (onApplyTravelPlan) {
      onApplyTravelPlan(selectedScenario, adaptedExercises)
    }
    setDeployedStatus(`Deployed ${currentMeta.label} protocol across your training split!`)
    setTimeout(() => setDeployedStatus(null), 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Studio Header Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(13,27,42,0.95) 100%)',
          border: '1px solid rgba(56,189,248,0.35)',
          borderRadius: 8,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GaaIcon name="travel" size={24} tone="cyan" />
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#38BDF8', fontWeight: 800 }}>
              Travel workout planner
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0', letterSpacing: '0.04em' }}>
              Adapt your workout for travel
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--gray)' }}>
              Adjust your workout to match the equipment you have available.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDeploy}
          disabled={adaptedExercises.length === 0}
          className="tactile-btn"
          style={{
            background: adaptedExercises.length === 0
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, rgba(56,189,248,0.3) 0%, rgba(56,189,248,0.15) 100%)',
            border: adaptedExercises.length === 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid #38BDF8',
            color: adaptedExercises.length === 0 ? 'var(--gray)' : '#FFFFFF',
            padding: '10px 18px',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: adaptedExercises.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="lightning" size={15} tone="cyan" />
          <span>Use this travel workout</span>
        </button>
      </div>

      {deployedStatus && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.4)',
            borderRadius: 8,
            color: '#34D399',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="check" size={14} tone="emerald" />
          <span>{deployedStatus}</span>
        </div>
      )}

      {/* ── Travel Scenario Selector Grid ── */}
      <div>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 8 }}>
          What equipment do you have?
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {SCENARIO_KEYS.map(scenarioKey => {
            const isSelected = selectedScenario === scenarioKey
            const meta = TRAVEL_SCENARIO_META[scenarioKey] || {
              label: scenarioKey,
              description: 'A workout matched to the equipment you have.',
              icon: 'barbell',
            }
            const iconName = SCENARIO_ICONS[scenarioKey] || 'travel'

            return (
              <button
                key={scenarioKey}
                type="button"
                onClick={() => setSelectedScenario(scenarioKey)}
                className="tactile-btn"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.06) 100%)'
                    : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <GaaIcon name={iconName} size={22} tone={isSelected ? 'cyan' : 'slate'} />
                  {isSelected && (
                    <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GaaIcon name="check" size={11} tone="cyan" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-sans, Raleway), sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isSelected ? '#38BDF8' : '#FFFFFF' }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.4 }}>
                  {meta.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Adapted Workout Preview ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38BDF8', fontWeight: 800 }}>
              Adapted Protocol Flow:
            </span>
            <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700, marginLeft: 8 }}>
              {currentMeta.label}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>
            {adaptedExercises.length} Movements Recalibrated
          </span>
        </div>

        {adaptedExercises.length === 0 ? (
          <div
            style={{
              padding: '24px 20px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 6,
              textAlign: 'center',
              color: 'var(--gray)',
              fontSize: 13,
            }}
          >
            No active workout plan loaded to adapt. Generate or assign a periodized workout block to enable travel equipment recalibration.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {adaptedExercises.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 6,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>
                    Standard Lift → Adapted Movement
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                    {ex.name}
                  </div>
                  {ex.coachingCue && (
                    <div style={{ fontSize: 12, color: 'var(--gold-lt)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="lightbulb" size={12} tone="gold" />
                      <em>{ex.coachingCue}</em>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#E2E8F0' }}>
                    <strong>{ex.sets}</strong> sets × <strong>{ex.reps}</strong>
                  </span>
                  {ex.tempo && isStrengthExercise(ex.name) && (
                    <span style={{ fontSize: 11, color: '#60A5FA', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', padding: '2px 7px', borderRadius: 3 }}>
                      Tempo: {ex.tempo}
                    </span>
                  )}
                  {ex.restSeconds ? (
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                      Rest: {ex.restSeconds}s
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Travel workout and recovery tips ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(13,27,42,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 8,
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <GaaIcon name="travel" size={18} tone="gold" />
          <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Travel workouts and recovery tips
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            fontSize: 12,
            color: '#E2E8F0',
            lineHeight: 1.5,
          }}
        >
          <div>
            <strong style={{ color: 'var(--white)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <GaaIcon name="droplet" size={12} tone="cyan" />
              <span>Hydration &amp; Cabin Pressure:</span>
            </strong>{' '}
            Consume 16 oz water with electrolytes for every 2 hours in flight. Avoid alcohol and excessive sodium in airports.
          </div>
          <div>
            <strong style={{ color: 'var(--white)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <GaaIcon name="sun" size={12} tone="gold" />
              <span>Circadian Reset:</span>
            </strong>{' '}
            Get 15–20 minutes of morning direct sunlight immediately upon landing in the new time zone to synchronize melatonin rhythm.
          </div>
          <div>
            <strong style={{ color: 'var(--white)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <GaaIcon name="utensils" size={12} tone="emerald" />
              <span>Food choices while traveling:</span>
            </strong>{' '}
            Target 40–50g lean protein first (filet, salmon, chicken breast) with steamed greens at business dinners before carbohydrate intake.
          </div>
        </div>
      </div>
    </div>
  )
}
