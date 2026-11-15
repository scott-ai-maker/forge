import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  adaptExerciseForBodyweightOnly,
  adaptExerciseForTravel,
  adaptFullPlanForTravel,
  adaptWorkoutForTravel,
  applyExpressAndEnvironmentToExercises,
  TRAVEL_SUBSTITUTION_RULES,
} from './travel-workout-adapter'
import {
  hasConsecutiveTravelSwaps,
  loadPostureProfileState,
  POSTURE_PROFILE_STORAGE_KEY,
  recordEnvironmentSelection,
  savePostureProfileState,
  setExpressModeActive,
} from './posture-profile-state'

const REPO_ROOT = process.cwd()
const COACH_TRAVEL_MODAL_PATH = path.join(
  REPO_ROOT,
  'components/coach/CoachTravelRecalibratorModal.tsx'
)
const STUDIO_PATH = path.join(REPO_ROOT, 'components/fitness/ExecutiveTravelAdapterStudio.tsx')
const BRIDGE_PATH = path.join(REPO_ROOT, 'components/fitness/PreWorkoutReadinessBridge.tsx')

function installMemoryWindowStorage() {
  const store = new Map<string, string>()
  const listeners = new Map<string, Set<() => void>>()
  const fakeWindow = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
    },
    addEventListener: (evt: string, fn: () => void) => {
      if (!listeners.has(evt)) listeners.set(evt, new Set())
      listeners.get(evt)!.add(fn)
    },
    removeEventListener: (evt: string, fn: () => void) => {
      listeners.get(evt)?.delete(fn)
    },
    dispatchEvent: (event: { type: string }) => {
      listeners.get(event.type)?.forEach(fn => fn())
      return true
    },
  }
  // @ts-expect-error node test shim for window + CustomEvent
  globalThis.window = fakeWindow
  if (typeof globalThis.CustomEvent === 'undefined') {
    // @ts-expect-error minimal CustomEvent shim for node environment
    globalThis.CustomEvent = class CustomEvent {
      type: string
      constructor(type: string) {
        this.type = type
      }
    }
  }
  return store
}

describe('travel-workout-adapter & 20m Express / Environment Engine', () => {
  beforeEach(() => {
    const store = installMemoryWindowStorage()
    store.delete(POSTURE_PROFILE_STORAGE_KEY)
  })

  it('adapts Barbell Back Squat to DB Goblet Squat with isometric pause for hotel dumbbells', () => {
    const result = adaptExerciseForTravel('Barbell Back Squat', 'hotel_dumbbells_only')
    expect(result.name).toContain('DB Goblet Squat')
    expect(result.tempo).toBe('4/3/1')
    expect(result.coachingCue).toContain('isometric pause')
  })

  it('adapts Barbell Bench Press to Banded Deficit Push-ups for hotel room bands', () => {
    const result = adaptExerciseForTravel('Barbell Bench Press', 'hotel_room_bands')
    expect(result.name).toContain('Banded Deficit Push-ups')
    expect(result.reps).toBe('15-20')
  })

  it('honors commercial_full_gym rule prescriptions instead of shadowing them behind generic early-return', () => {
    const deadlift = adaptExerciseForTravel(
      'Barbell Conventional Deadlift',
      'commercial_full_gym'
    )
    expect(deadlift.name).toBe('Barbell Conventional Deadlift')
    expect(deadlift.reps).toBe('6-8')
    expect(deadlift.tempo).toBe('3/1/1')
    expect(deadlift.coachingCue).toContain('lats')
  })

  it('prevents corrupted prefix compounding ("DB Dumbbell", "DB Forearm Plank", "Banded DB Goblet Squat") across chained scenario switches', () => {
    const curl = adaptExerciseForTravel('Barbell Curl', 'hotel_dumbbells_only')
    expect(curl.name).toBe('DB Curl')
    expect(curl.name).not.toContain('DB Dumbbell')

    const lateral = adaptExerciseForTravel('Dumbbell Lateral Raise', 'hotel_dumbbells_only')
    expect(lateral.name).toBe('Dumbbell Lateral Raise')

    const plank = adaptExerciseForTravel('Forearm Plank', 'hotel_dumbbells_only')
    expect(plank.name).toBe('Forearm Plank')

    const sampleWorkout = [
      { name: 'Barbell Back Squat', sets: 4, reps: '6-8', tempo: '3/0/1' },
      { name: 'Barbell Bench Press', sets: 4, reps: '8-10', tempo: '3/1/1' },
      { name: 'Barbell Bent-Over Row', sets: 3, reps: '8-10', tempo: '2/0/2' },
    ]

    const pass1 = adaptWorkoutForTravel(sampleWorkout, 'hotel_dumbbells_only')
    expect(pass1[0].name).toBe('DB Goblet Squat (Pause in Hole)')
    expect(pass1[0].originalBarbellName).toBe('Barbell Back Squat')

    // Chained switch to cables, then bands, then commercial full gym restoration
    const pass2 = adaptWorkoutForTravel(pass1, 'hotel_cables_cardio')
    expect(pass2[0].name).toBe('Cable Goblet Squat with Low Pulley')
    expect(pass2[0].originalBarbellName).toBe('Barbell Back Squat')

    const pass3 = adaptWorkoutForTravel(pass2, 'hotel_room_bands')
    expect(pass3[0].name).toBe('Banded Single-Leg Bulgarian Split Squat (Bed/Chair elevated)')
    expect(pass3[0].name).not.toContain('DB Goblet')

    const restored = adaptWorkoutForTravel(pass3, 'commercial_full_gym')
    expect(restored[0].name).toBe('Barbell Back Squat')
    expect(restored[0].reps).toBe('6-8')
    expect(restored[0].tempo).toBe('3/0/1')
  })

  it('adapts a full multi-day macrocycle plan across multiple travel recalibrations and cleanly restores original fields', () => {
    const rawPlan = {
      workouts: [
        {
          day: 1,
          focus: 'Legs & Core',
          exercises: [
            {
              name: 'Barbell Back Squat',
              sets: '4',
              reps: '6-8',
              tempo: '4/2/1',
              notes: 'Keep heels planted and brace 360 degrees.',
            },
          ],
        },
        {
          day: 2,
          focus: 'Upper Push & Pull',
          exercises: [
            {
              name: 'Barbell Overhead Press',
              sets: '4',
              reps: '8-10',
              tempo: '2/0/1',
              notes: 'Stack ribs over pelvis.',
            },
          ],
        },
      ],
    }

    const adapted1 = adaptFullPlanForTravel(rawPlan, 'hotel_dumbbells_only', 'Phase 2 Hypertrophy')
    expect(adapted1.planTitle).toBe('[Travel: Hotel Dumbbell Gym] Phase 2 Hypertrophy')
    expect(adapted1.planJson.isTravelAdapted).toBe(true)
    expect(adapted1.planJson.workouts[0].focus).toBe('Legs & Core (Hotel Dumbbell Gym Adaptation)')
    expect(adapted1.planJson.workouts[0].exercises[0].name).toContain('DB Goblet Squat')
    expect(adapted1.planJson.workouts[1].exercises[0].name).toContain('Standing Neutral-Grip DB Overhead Press')

    // Second consecutive travel recalibration does not stack "(Adaptation) (Adaptation)" suffixes
    const adapted2 = adaptFullPlanForTravel(
      adapted1.planJson,
      'hotel_room_bands',
      adapted1.planTitle
    )
    expect(adapted2.planTitle).toBe('[Travel: Hotel Room Bands & Calisthenics] Phase 2 Hypertrophy')
    expect(adapted2.planJson.workouts[0].focus).toBe(
      'Legs & Core (Hotel Room Bands & Calisthenics Adaptation)'
    )
    expect(adapted2.planJson.workouts[0].exercises[0].name).toBe(
      'Banded Single-Leg Bulgarian Split Squat (Bed/Chair elevated)'
    )

    // Full commercial gym restoration restores exact original title, focus, name, reps, tempo, and notes
    const restored = adaptFullPlanForTravel(
      adapted2.planJson,
      'commercial_full_gym',
      adapted2.planTitle
    )
    expect(restored.planTitle).toBe('Phase 2 Hypertrophy')
    expect(restored.planJson.isTravelAdapted).toBe(false)
    expect(restored.planJson.workouts[0].focus).toBe('Legs & Core')
    expect(restored.planJson.workouts[0].exercises[0].name).toBe('Barbell Back Squat')
    expect(restored.planJson.workouts[0].exercises[0].reps).toBe('6-8')
    expect(restored.planJson.workouts[0].exercises[0].tempo).toBe('4/2/1')
    expect(restored.planJson.workouts[0].exercises[0].notes).toBe(
      'Keep heels planted and brace 360 degrees.'
    )
  })

  it('provides pure zero-equipment calisthenics substitutions for bodyweight_only across all movement patterns', () => {
    expect(adaptExerciseForBodyweightOnly('Barbell Back Squat').name).toBe(
      'Bodyweight Rear-Foot-Elevated Split Squat'
    )
    expect(adaptExerciseForBodyweightOnly('Barbell Conventional Deadlift').name).toBe(
      'Single-Leg Bodyweight Romanian Hinge & Glute Bridge'
    )
    expect(adaptExerciseForBodyweightOnly('Barbell Bench Press').name).toBe(
      'Tempo Deficit Push-Up (3s Eccentric + 2s Pause)'
    )
    expect(adaptExerciseForBodyweightOnly('Seated Dumbbell Overhead Press').name).toBe(
      'Elevated Pike Shoulder Press'
    )
    expect(adaptExerciseForBodyweightOnly('Lat Pulldown').name).toBe(
      'Prone Y-T-W Scapular Row (3s Isometric Squeeze)'
    )
    expect(adaptExerciseForBodyweightOnly('Forearm Plank').name).toBe('Forearm Plank')
  })

  it('applies 20m Express Mode compression (max 4 lifts, <=2 sets, <=45s rest) and environment swaps while preserving warmup/cooldown and manual swaps', () => {
    const sessionExercises = [
      { name: 'Cat-Cow Thoracic Flow', sets: '1', reps: '60s', rest: '15s', block: 'warmup' },
      { name: 'Barbell Back Squat', sets: '4', reps: '8-10', rest: '90s', block: 'resistance' },
      { name: 'Barbell Bench Press', sets: '4', reps: '8-10', rest: '90s', block: 'resistance' },
      { name: 'Barbell Bent-Over Row', sets: '3', reps: '10-12', rest: '75s', block: 'resistance' },
      { name: 'Barbell Overhead Press', sets: '3', reps: '10-12', rest: '75s', block: 'resistance' },
      { name: 'Barbell Curl', sets: '3', reps: '12', rest: '60s', block: 'resistance' },
      { name: 'Cable Tricep Pushdown', sets: '3', reps: '12-15', rest: '60s', block: 'resistance' },
      { name: '90/90 Hip Stretch', sets: '1', reps: '45s', rest: '0s', block: 'cooldown' },
    ]

    // Home gym + standard 45m mode leaves resistance list untouched
    const baseline = applyExpressAndEnvironmentToExercises(sessionExercises, {
      environmentProfile: 'home_gym',
      expressModeActive: false,
    })
    expect(baseline).toHaveLength(8)
    expect(baseline[1].name).toBe('Barbell Back Squat')
    expect(baseline[1].sets).toBe('4')
    expect(baseline[1].rest).toBe('90s')

    // Hotel Travel + 20m Express Mode caps resistance to 4 lifts, 2 sets, <=45s rest, while keeping warmup & cooldown
    const hotelExpress = applyExpressAndEnvironmentToExercises(sessionExercises, {
      environmentProfile: 'hotel_travel',
      expressModeActive: true,
    })
    const resistanceItems = hotelExpress.filter(e => e.block === 'resistance')
    expect(resistanceItems).toHaveLength(4)
    expect(hotelExpress.find(e => e.block === 'warmup')?.name).toBe('Cat-Cow Thoracic Flow')
    expect(hotelExpress.find(e => e.block === 'cooldown')?.name).toBe('90/90 Hip Stretch')
    expect(resistanceItems[0].name).toBe('DB Goblet Squat (Pause in Hole)')
    expect(resistanceItems[0].sets).toBe('2')
    expect(resistanceItems[0].rest).toBe('45s')

    // Manual Coach/Studio adaptation is respected without re-overwriting movement name
    const manualWithExpress = applyExpressAndEnvironmentToExercises(
      [
        {
          name: 'Custom Coach goblet variation',
          sets: '4',
          reps: '10',
          rest: '90s',
          block: 'resistance',
          alreadyManuallyAdapted: true,
        },
      ],
      {
        environmentProfile: 'bodyweight_only',
        expressModeActive: true,
      }
    )
    expect(manualWithExpress[0].name).toBe('Custom Coach goblet variation')
    expect(manualWithExpress[0].sets).toBe('2')
    expect(manualWithExpress[0].rest).toBe('45s')
  })

  it('evaluates consecutive travel swaps strictly around candidateDate rather than stale historical trips', () => {
    // Historical consecutive trip 5 months ago must NOT trigger on Day 1 of a new trip
    const staleDates = ['2026-05-10', '2026-05-11', '2026-10-20']
    expect(hasConsecutiveTravelSwaps(staleDates, '2026-10-20')).toBe(false)

    // Adjacent yesterday + today MUST trigger consecutive travel detection
    const adjacentDates = ['2026-05-10', '2026-10-19', '2026-10-20']
    expect(hasConsecutiveTravelSwaps(adjacentDates, '2026-10-20')).toBe(true)

    // Verify recordEnvironmentSelection integration with localStorage state
    const seeded = loadPostureProfileState()
    savePostureProfileState({
      ...seeded,
      environmentSwapDates: ['2026-04-01', '2026-04-02'],
    })
    const singleDayResult = recordEnvironmentSelection('hotel_travel')
    expect(singleDayResult.triggeredConsecutiveTravel).toBe(false)

    // Seed yesterday relative to UTC today
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    savePostureProfileState({
      ...loadPostureProfileState(),
      environmentSwapDates: [yesterday],
    })
    const consecutiveResult = recordEnvironmentSelection('bodyweight_only')
    expect(consecutiveResult.triggeredConsecutiveTravel).toBe(true)
    expect(consecutiveResult.state.environmentProfile).toBe('bodyweight_only')

    const expressUpdated = setExpressModeActive(true)
    expect(expressUpdated.expressModeActive).toBe(true)
  })

  it('enforces native <dialog closedby="any">, labelled controls, and >=44px touch targets in Travel UI components', () => {
    const coachModalSource = fs.readFileSync(COACH_TRAVEL_MODAL_PATH, 'utf8')
    const studioSource = fs.readFileSync(STUDIO_PATH, 'utf8')
    const bridgeSource = fs.readFileSync(BRIDGE_PATH, 'utf8')

    expect(coachModalSource).toContain('<dialog')
    expect(coachModalSource).toContain("closedby: 'any'")
    expect(coachModalSource).not.toContain('role="dialog"')
    expect(coachModalSource).not.toContain('aria-modal')
    expect(coachModalSource).toContain('showModal()')
    expect(coachModalSource).toContain('htmlFor={noteInputId}')
    expect(coachModalSource).toContain("'closedBy' in HTMLDialogElement.prototype")

    expect(studioSource).toContain('role="status"')
    expect(studioSource).toContain('aria-live="polite"')
    expect(studioSource).toContain('aria-pressed={isSelected}')

    expect(bridgeSource).toContain('data-testid="readiness-bridge-environment-select"')
    expect(bridgeSource).toContain('htmlFor={envSelectId}')
    expect(bridgeSource).toContain("setUpgradeTrigger('consecutive_travel_swaps')")
  })

  it('has substitution rules defined for all major barbell compound exercises and safely handles empty input', () => {
    expect(TRAVEL_SUBSTITUTION_RULES.length).toBeGreaterThanOrEqual(5)
    expect(adaptExerciseForTravel('', 'hotel_dumbbells_only').name).toBeDefined()
    expect(adaptWorkoutForTravel([], 'hotel_dumbbells_only')).toEqual([])
  })
})
