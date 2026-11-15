'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import {
  adaptWorkoutForTravel,
  ExercisePlanItem,
  TravelLocationScenario,
  TRAVEL_SCENARIO_META,
} from '@/lib/travel-workout-adapter'
import { isStrengthExercise } from '@/lib/exercise-logging-helpers'
import {
  recordEnvironmentSelection,
  type EnvironmentProfileId,
} from '@/lib/posture-profile-state'

interface ExecutiveTravelAdapterStudioProps {
  plan?: Record<string, unknown> | null
  activeDay?: number
  onApplyTravelPlan?: (
    scenario: TravelLocationScenario,
    adaptedExercises: ExercisePlanItem[],
    targetDay?: number | 'all',
    adaptedByDay?: Record<number, ExercisePlanItem[]>
  ) => void
}

const SCENARIO_ICONS: Record<TravelLocationScenario, GaaIconName> = {
  hotel_dumbbells_only: 'dumbbell',
  hotel_cables_cardio: 'lightning',
  hotel_room_bands: 'toolbox',
  commercial_full_gym: 'barbell',
}

const SCENARIO_TO_ENVIRONMENT_PROFILE: Record<TravelLocationScenario, EnvironmentProfileId> = {
  hotel_dumbbells_only: 'hotel_travel',
  hotel_cables_cardio: 'hotel_travel',
  hotel_room_bands: 'hotel_travel',
  commercial_full_gym: 'full_gym',
}

const SCENARIO_KEYS = Object.keys(TRAVEL_SCENARIO_META) as TravelLocationScenario[]

function mapRawPlanExercises(rawList: unknown): ExercisePlanItem[] {
  if (!Array.isArray(rawList) || rawList.length === 0) return []
  return rawList.map((item: Record<string, unknown>) => ({
    name: String(item?.originalBarbellName || item?.name || 'Compound Movement'),
    sets: Number(item?.sets) || 3,
    reps: String(item?.originalReps || item?.reps || '10'),
    tempo: item?.originalTempo
      ? String(item.originalTempo)
      : item?.tempo
        ? String(item.tempo)
        : undefined,
    restSeconds: item?.rest ? parseInt(String(item.rest), 10) || 60 : 60,
    coachingCue: String(item?.coachingCue || item?.notes || 'Maintain controlled form'),
    originalBarbellName: item?.originalBarbellName ? String(item.originalBarbellName) : undefined,
    originalTempo: item?.originalTempo ? String(item.originalTempo) : undefined,
    originalReps: item?.originalReps ? String(item.originalReps) : undefined,
  }))
}

export default function ExecutiveTravelAdapterStudio({
  plan,
  activeDay,
  onApplyTravelPlan,
}: ExecutiveTravelAdapterStudioProps) {
  const workouts = useMemo(
    () => (Array.isArray(plan?.workouts) ? (plan.workouts as Record<string, unknown>[]) : []),
    [plan?.workouts]
  )

  const defaultDay = useMemo(() => {
    if (typeof activeDay === 'number' && workouts.some(w => Number(w?.day) === activeDay)) {
      return activeDay
    }
    return Number(workouts[0]?.day) || 1
  }, [activeDay, workouts])

  const [selectedDay, setSelectedDay] = useState<number>(defaultDay)
  const [applyScope, setApplyScope] = useState<'single_day' | 'all_days'>('single_day')
  const [selectedScenario, setSelectedScenario] =
    useState<TravelLocationScenario>('hotel_dumbbells_only')
  const [deployedStatus, setDeployedStatus] = useState<string | null>(null)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scenarioGroupLabelId = useId()
  const dayGroupLabelId = useId()

  useEffect(() => {
    setSelectedDay(defaultDay)
  }, [defaultDay])

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current)
      }
    }
  }, [])

  const selectedWorkout = useMemo(() => {
    return (
      workouts.find((w, idx) => (Number(w?.day) || idx + 1) === selectedDay) ||
      workouts[0] ||
      null
    )
  }, [workouts, selectedDay])

  const rawExercises = useMemo(
    () => mapRawPlanExercises(selectedWorkout?.exercises),
    [selectedWorkout]
  )

  const adaptedExercises = useMemo(
    () => adaptWorkoutForTravel(rawExercises, selectedScenario),
    [rawExercises, selectedScenario]
  )
  const currentMeta =
    TRAVEL_SCENARIO_META[selectedScenario] || TRAVEL_SCENARIO_META['hotel_dumbbells_only']

  const handleDeploy = () => {
    if (adaptedExercises.length === 0) return

    const adaptedByDay: Record<number, ExercisePlanItem[]> = {}
    if (applyScope === 'all_days' && workouts.length > 0) {
      workouts.forEach((w, idx) => {
        const dayNum = Number(w?.day) || idx + 1
        adaptedByDay[dayNum] = adaptWorkoutForTravel(
          mapRawPlanExercises(w?.exercises),
          selectedScenario
        )
      })
    } else {
      adaptedByDay[selectedDay] = adaptedExercises
    }

    recordEnvironmentSelection(SCENARIO_TO_ENVIRONMENT_PROFILE[selectedScenario])

    if (onApplyTravelPlan) {
      onApplyTravelPlan(
        selectedScenario,
        adaptedExercises,
        applyScope === 'all_days' ? 'all' : selectedDay,
        adaptedByDay
      )
    }

    const firstDayNum = Number(workouts[0]?.day) || 1
    const scopeSummary =
      applyScope === 'all_days' && workouts.length > 1
        ? `all ${workouts.length} workout days`
        : selectedDay === firstDayNum
          ? `your first workout day (Day ${selectedDay})`
          : `workout Day ${selectedDay}`
    setDeployedStatus(`Applied ${currentMeta.label} to ${scopeSummary}.`)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setDeployedStatus(null), 4500)
  }

  return (
    <div data-testid="executive-travel-adapter-studio" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              flexShrink: 0,
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
              Adjust any training day—or your full weekly split—to match the equipment you have available.
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="travel-studio-deploy-btn"
          onClick={handleDeploy}
          disabled={adaptedExercises.length === 0}
          className="tactile-btn"
          style={{
            minHeight: 44,
            background: adaptedExercises.length === 0
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, rgba(56,189,248,0.3) 0%, rgba(56,189,248,0.15) 100%)',
            border: adaptedExercises.length === 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid #38BDF8',
            color: adaptedExercises.length === 0 ? 'var(--gray)' : '#FFFFFF',
            padding: '10px 18px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: adaptedExercises.length === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8,
          }}
        >
          <GaaIcon name="lightning" size={15} tone="cyan" />
          <span>
            {applyScope === 'all_days' && workouts.length > 1
              ? `Apply to all ${workouts.length} workout days`
              : 'Use this travel workout'}
          </span>
        </button>
      </div>

      {deployedStatus && (
        <div
          role="status"
          aria-live="polite"
          data-testid="travel-studio-deployed-status"
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

      {/* ── Multi-Day Selector & Scope Toggle ── */}
      {workouts.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
          }}
        >
          <div>
            <div
              id={dayGroupLabelId}
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--gray)',
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              Preview workout day
            </div>
            <div
              role="group"
              aria-labelledby={dayGroupLabelId}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
            >
              {workouts.map((w, idx) => {
                const dayNum = Number(w?.day) || idx + 1
                const focusLabel = String(w?.focus || `Session ${dayNum}`)
                const isDayActive = selectedDay === dayNum
                return (
                  <button
                    key={dayNum}
                    type="button"
                    data-testid={`travel-studio-day-${dayNum}`}
                    aria-pressed={isDayActive}
                    onClick={() => setSelectedDay(dayNum)}
                    className="tactile-btn"
                    style={{
                      minHeight: 44,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: isDayActive
                        ? '1px solid #38BDF8'
                        : '1px solid rgba(255,255,255,0.1)',
                      background: isDayActive
                        ? 'rgba(56,189,248,0.16)'
                        : 'rgba(255,255,255,0.03)',
                      color: isDayActive ? '#FFFFFF' : 'var(--gray)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Day {dayNum}: {focusLabel}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              data-testid="travel-studio-scope-single"
              aria-pressed={applyScope === 'single_day'}
              onClick={() => setApplyScope('single_day')}
              className="tactile-btn"
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 8,
                border:
                  applyScope === 'single_day'
                    ? '1px solid rgba(52,211,153,0.6)'
                    : '1px solid rgba(255,255,255,0.1)',
                background:
                  applyScope === 'single_day'
                    ? 'rgba(52,211,153,0.14)'
                    : 'rgba(255,255,255,0.03)',
                color: applyScope === 'single_day' ? '#6EE7B7' : 'var(--gray)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Current Day Only
            </button>
            <button
              type="button"
              data-testid="travel-studio-scope-all"
              aria-pressed={applyScope === 'all_days'}
              onClick={() => setApplyScope('all_days')}
              className="tactile-btn"
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 8,
                border:
                  applyScope === 'all_days'
                    ? '1px solid rgba(52,211,153,0.6)'
                    : '1px solid rgba(255,255,255,0.1)',
                background:
                  applyScope === 'all_days'
                    ? 'rgba(52,211,153,0.14)'
                    : 'rgba(255,255,255,0.03)',
                color: applyScope === 'all_days' ? '#6EE7B7' : 'var(--gray)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Workout Days
            </button>
          </div>
        </div>
      )}

      {/* ── Travel Scenario Selector Grid ── */}
      <div>
        <div
          id={scenarioGroupLabelId}
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--gold-lt)',
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          What equipment do you have?
        </div>
        <div
          role="group"
          aria-labelledby={scenarioGroupLabelId}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
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
                data-testid={`travel-scenario-${scenarioKey}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedScenario(scenarioKey)}
                className="tactile-btn"
                style={{
                  minHeight: 44,
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
                      <span>Selected</span>
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
              Adapted Protocol Flow (Day {selectedDay}):
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
          <div data-testid="travel-studio-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {adaptedExercises.map((ex, idx) => (
              <div
                key={`${selectedDay}-${idx}-${ex.name}`}
                data-testid={`travel-preview-item-${idx}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
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
                    {ex.originalBarbellName && ex.originalBarbellName !== ex.name
                      ? `Adapted from: ${ex.originalBarbellName}`
                      : 'Prescribed Movement'}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
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
