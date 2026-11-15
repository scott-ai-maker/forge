'use client'

import React, { useEffect, useMemo, useState } from 'react'
import PreWorkoutReadinessBridge from '@/components/fitness/PreWorkoutReadinessBridge'
import ExecutiveTravelAdapterStudio from '@/components/fitness/ExecutiveTravelAdapterStudio'
import CoachTravelRecalibratorModal from '@/components/coach/CoachTravelRecalibratorModal'
import {
  applyExpressAndEnvironmentToExercises,
  type ExercisePlanItem,
  type TravelLocationScenario,
} from '@/lib/travel-workout-adapter'
import {
  ENVIRONMENT_PROFILE_META,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  savePostureProfileState,
} from '@/lib/posture-profile-state'
import { setStoredTierId, useTierAccess } from '@/lib/tierEntitlements'

export const dynamic = 'force-dynamic'

const HARNESS_WORKOUT_PLAN = {
  name: 'Phase 2 Strength Endurance Split',
  nasmOptPhase: 2,
  workouts: [
    {
      day: 1,
      focus: 'Lower Body & Core',
      exercises: [
        { name: 'Cat-Cow Thoracic Flow', sets: '1', reps: '60s', rest: '15s', block: 'warmup' },
        { name: 'Barbell Back Squat', sets: '4', reps: '8-10', tempo: '3/1/1', rest: '90s', block: 'resistance' },
        { name: 'Barbell Conventional Deadlift', sets: '4', reps: '6-8', tempo: '3/1/1', rest: '90s', block: 'resistance' },
        { name: 'Barbell Bent-Over Row', sets: '3', reps: '10-12', tempo: '2/1/2', rest: '75s', block: 'resistance' },
        { name: 'Barbell Overhead Press', sets: '3', reps: '8-10', tempo: '2/0/1', rest: '75s', block: 'resistance' },
        { name: 'Barbell Curl', sets: '3', reps: '12', tempo: '2/1/1', rest: '60s', block: 'resistance' },
        { name: 'Cable Tricep Pushdown', sets: '3', reps: '12-15', tempo: '2/0/2', rest: '60s', block: 'resistance' },
      ],
    },
    {
      day: 2,
      focus: 'Upper Push & Scapular Pull',
      exercises: [
        { name: 'Barbell Bench Press', sets: '4', reps: '8-10', tempo: '3/1/1', rest: '90s', block: 'resistance' },
        { name: 'Barbell Overhead Press', sets: '4', reps: '8-10', tempo: '2/1/1', rest: '90s', block: 'resistance' },
        { name: 'Barbell Bent-Over Row', sets: '4', reps: '10-12', tempo: '2/1/2', rest: '75s', block: 'resistance' },
      ],
    },
  ],
}

export default function ExpressTravelTestHarnessPage() {
  const { tierId, entitlements } = useTierAccess()
  const [hydrated, setHydrated] = useState(false)
  const [activeDay, setActiveDay] = useState<number>(1)
  const [expressModeActive, setExpressModeActiveState] = useState(false)
  const [environmentProfile, setEnvironmentProfileState] = useState<
    'home_gym' | 'full_gym' | 'hotel_travel' | 'bodyweight_only'
  >('home_gym')
  const [adaptedByDay, setAdaptedByDay] = useState<Record<number, ExercisePlanItem[]>>({})
  const [lastDeployedScenario, setLastDeployedScenario] = useState<TravelLocationScenario | null>(
    null
  )
  const [coachModalOpen, setCoachModalOpen] = useState(false)
  const [coachModalSuccessCount, setCoachModalSuccessCount] = useState(0)

  useEffect(() => {
    const sync = () => {
      const state = loadPostureProfileState()
      setExpressModeActiveState(state.expressModeActive)
      setEnvironmentProfileState(state.environmentProfile)
    }
    sync()
    setHydrated(true)
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [])

  const currentWorkout = useMemo(
    () => HARNESS_WORKOUT_PLAN.workouts.find(w => w.day === activeDay) || HARNESS_WORKOUT_PLAN.workouts[0],
    [activeDay]
  )

  const liveResistanceExercises = useMemo(() => {
    const base = adaptedByDay[activeDay]
      ? adaptedByDay[activeDay].map(ae => ({
          name: ae.name,
          sets: String(ae.sets),
          reps: ae.reps,
          tempo: ae.tempo ?? '3/1/1',
          rest: ae.restSeconds ? `${ae.restSeconds}s` : '60s',
          block: 'resistance',
          alreadyManuallyAdapted: true,
        }))
      : currentWorkout.exercises

    return applyExpressAndEnvironmentToExercises(base, {
      environmentProfile,
      expressModeActive,
    }).filter(ex => ex.block === 'resistance')
  }, [activeDay, adaptedByDay, currentWorkout.exercises, environmentProfile, expressModeActive])

  const seedYesterdaySwap = () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    const current = loadPostureProfileState()
    savePostureProfileState({
      ...current,
      environmentProfile: 'home_gym',
      environmentSwapDates: [yesterday],
    })
  }

  const seedStaleHistoricalSwaps = () => {
    const current = loadPostureProfileState()
    savePostureProfileState({
      ...current,
      environmentProfile: 'home_gym',
      environmentSwapDates: ['2026-04-10', '2026-04-11'],
    })
  }

  return (
    <div
      data-testid="express-travel-harness"
      data-hydrated={hydrated ? 'true' : 'false'}
      style={{
        minHeight: '100dvh',
        background: '#090A0D',
        color: '#F8FAFC',
        padding: 'clamp(12px, 3vw, 24px)',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#38BDF8',
              }}
            >
              Forge Athletic Feature #7 Diagnostics Harness
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>
              20-Minute Express Mode &amp; Environment / Hotel Travel Adapter
            </h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              data-testid="harness-tier-toggle"
              onClick={() => setStoredTierId(tierId === 'core_lab' ? 'plus' : 'core_lab')}
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.14)',
                background: '#181B22',
                color: '#E2E8F0',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tier: {tierId} ({entitlements.multiDayTravelPass ? 'Multi-Day Travel Pass' : 'Single-Day Swap'})
            </button>

            <button
              type="button"
              data-testid="harness-seed-yesterday-swap"
              onClick={seedYesterdaySwap}
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(251,191,36,0.35)',
                background: 'rgba(251,191,36,0.12)',
                color: '#FDE68A',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Seed Yesterday Swap
            </button>

            <button
              type="button"
              data-testid="harness-seed-stale-swaps"
              onClick={seedStaleHistoricalSwaps}
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.14)',
                background: '#181B22',
                color: '#CBD5E1',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Seed Stale Historical Swaps
            </button>

            <button
              type="button"
              data-testid="harness-open-coach-modal"
              onClick={() => setCoachModalOpen(true)}
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(56,189,248,0.45)',
                background: 'rgba(56,189,248,0.14)',
                color: '#BAE6FD',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Open Coach Travel Modal ({coachModalSuccessCount})
            </button>
          </div>
        </header>

        {/* Pre-Workout Readiness Bridge (20m Express + Gym Environment Select + TierUpgradeModal) */}
        <section aria-label="Pre-Workout Readiness and Live Session Preview">
          <PreWorkoutReadinessBridge workoutTitle={`Day ${activeDay}: ${currentWorkout.focus}`} />

          <div
            data-testid="harness-live-session-card"
            style={{
              background: '#111318',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Active Resistance Block · Day {activeDay}
                </div>
                <div data-testid="harness-live-session-summary" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                  {liveResistanceExercises.length} Primary Lifts · {ENVIRONMENT_PROFILE_META[environmentProfile].label} ·{' '}
                  {expressModeActive ? '20m Express Active' : '45m Standard'}
                  {lastDeployedScenario ? ` · Studio: ${lastDeployedScenario}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2].map(d => (
                  <button
                    key={d}
                    type="button"
                    data-testid={`harness-active-day-${d}`}
                    aria-pressed={activeDay === d}
                    onClick={() => setActiveDay(d)}
                    style={{
                      minHeight: 44,
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: activeDay === d ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.12)',
                      background: activeDay === d ? 'rgba(56,189,248,0.16)' : '#181B22',
                      color: '#F8FAFC',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    View Day {d}
                  </button>
                ))}
              </div>
            </div>

            <ul
              role="list"
              data-testid="harness-live-exercise-list"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gap: 8,
              }}
            >
              {liveResistanceExercises.map((ex, idx) => (
                <li
                  key={`${activeDay}-${idx}-${ex.name}`}
                  data-testid={`harness-exercise-row-${idx}`}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#090A0D',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{ex.name}</span>
                  <span style={{ fontSize: 12, color: '#CBD5E1', fontFamily: 'monospace' }}>
                    {ex.sets} sets × {ex.reps} · Rest {ex.rest}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Executive Travel Adapter Studio */}
        <section aria-label="Travel Workout Planner Studio">
          <ExecutiveTravelAdapterStudio
            plan={HARNESS_WORKOUT_PLAN as unknown as Record<string, unknown>}
            activeDay={activeDay}
            onApplyTravelPlan={(scenario, adapted, targetDay, mapByDay) => {
              setLastDeployedScenario(scenario)
              if (mapByDay && Object.keys(mapByDay).length > 0) {
                setAdaptedByDay(prev => ({ ...prev, ...mapByDay }))
              } else {
                const resolvedDay = typeof targetDay === 'number' ? targetDay : activeDay
                setAdaptedByDay(prev => ({ ...prev, [resolvedDay]: adapted }))
              }
            }}
          />
        </section>

        <CoachTravelRecalibratorModal
          clientId="client-demo-007"
          clientName="Alex Rivera"
          currentPlan={{
            id: 'plan-harness-1',
            name: HARNESS_WORKOUT_PLAN.name,
            nasm_opt_phase: HARNESS_WORKOUT_PLAN.nasmOptPhase,
            plan_json: HARNESS_WORKOUT_PLAN,
          }}
          isOpen={coachModalOpen}
          onClose={() => setCoachModalOpen(false)}
          onPlanDeployed={() => setCoachModalSuccessCount(c => c + 1)}
        />
      </div>
    </div>
  )
}
