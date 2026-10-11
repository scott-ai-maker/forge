import { Suspense } from 'react'
import FitnessTrackerClient from "@/components/fitness/FitnessTrackerClient"
import ClientSettingsStudio from '@/components/settings/ClientSettingsStudio'
import { buildWorkoutSchedule } from '@/lib/workout-schedule'

export const dynamic = 'force-dynamic'

const MOCK_PLAN = {
  id: "test-mobile-plan",
  user_id: "test-user",
  name: "Phase 1: Stabilization Endurance",
  phase_name: "Stabilization Endurance",
  nasm_opt_phase: 1,
  estimated_duration_mins: 55,
  created_at: new Date().toISOString(),
  plan_json: {
    clinicalRationale: 'Follow the prescribed tempo and prioritize controlled movement throughout your training session.',
    workouts: [
      {
        day: 1,
        focus: "Chest, Back & Core Stabilization",
        scheduledDate: new Date().toISOString().split("T")[0],
        exercises: [
          {
            name: "Barbell Flat Bench Press",
            sets: "3",
            reps: "10",
            tempo: "4/2/1",
            rest: "60s",
            block: "strength",
          },
          {
            name: "Incline Dumbbell Bench Press",
            sets: "3",
            reps: "12",
            tempo: "2/0/2",
            rest: "60s",
            block: "strength",
          },
          {
            name: "Cable Chest Fly",
            sets: "3",
            reps: "12",
            tempo: "2/0/2",
            rest: "60s",
            block: "strength",
          },
        ],
      },
    ],
  },
}

const VARIETY_SCENARIOS = {
  timed: { phase: 1, exercises: [
    { name: 'Standing Hip Flexor Static Stretch', sets: '1', reps: '30s hold per side', block: 'resistance', rest: '0s' },
    { name: 'Foam Roll Calves', sets: '1', reps: '45s / side', block: 'resistance', rest: '0s' },
    { name: 'Plank', sets: '2', reps: '30-60s hold', block: 'resistance', rest: '30s' },
  ] },
  band: { phase: 1, exercises: [
    { name: 'Resistance Band Standing Row', sets: '2', reps: '12-20', block: 'resistance', rest: '60s', tempo: '4/2/1' },
  ] },
  circuit: { phase: 1, exercises: [
    { name: 'Leg Circuit Frontal', sets: '2-3', reps: '12-20', block: 'resistance', rest: '60s', tempo: '4/2/1' },
    { name: 'Single-Leg Squat', sets: '2', reps: '8-10 reps per leg', block: 'resistance', rest: '60s' },
  ] },
  hypertrophy: { phase: 3, exercises: [
    { name: 'Barbell Bench Press', sets: '3', reps: '8-12', block: 'resistance', rest: '60s', tempo: '2/0/2' },
    { name: 'Bent-Over Barbell Row', sets: '3', reps: '8-12', block: 'resistance', rest: '60s', tempo: '2/0/2' },
  ] },
  strength: { phase: 4, exercises: [
    { name: 'Barbell Back Squat', sets: '4', reps: '1-5', block: 'resistance', rest: '180s', tempo: '1/1/1' },
  ] },
  power: { phase: 5, exercises: [
    { name: 'Barbell Back Squat', sets: '3', reps: '1-5', block: 'resistance', rest: '90s', tempo: '2/0/1' },
    { name: 'Squat Jump', sets: '3', reps: '8-10', block: 'resistance', rest: '90s', tempo: 'X/0/X' },
  ] },
}

export default async function FitnessMobileTestHarnessPage({ searchParams }: {
  searchParams: Promise<{ view?: string; scenario?: string }>
}) {
  const params = await searchParams
  const variety = Object.entries(VARIETY_SCENARIOS).find(([name]) => name === params.scenario)?.[1]
  const plan = params.scenario === 'schedule' ? {
    ...MOCK_PLAN,
    plan_json: {
      workouts: [
        ...MOCK_PLAN.plan_json.workouts,
        { ...MOCK_PLAN.plan_json.workouts[0], day: 2, focus: 'Schedule navigation check' },
      ],
    },
  } : params.scenario === 'superset' ? {
    ...MOCK_PLAN,
    name: 'Phase 2: Strength Endurance',
    phase_name: 'Strength Endurance',
    nasm_opt_phase: 2,
    plan_json: { workouts: [{
      ...MOCK_PLAN.plan_json.workouts[0],
      exercises: [
        { name: 'Dumbbell Romanian Deadlift', sets: '2', reps: '8-10', tempo: '2/0/2', rest: '60s', block: 'strength' },
        { name: 'Single-Leg Romanian Deadlift', sets: '2', reps: '12–15', tempo: '4/2/1', rest: '60s', block: 'strength' },
      ],
    }] },
  } : variety ? {
    ...MOCK_PLAN,
    name: `Phase ${variety.phase}: Workout Variety UAT`,
    nasm_opt_phase: variety.phase,
    plan_json: { workouts: [{ ...MOCK_PLAN.plan_json.workouts[0], exercises: variety.exercises }] },
  } : MOCK_PLAN
  return (
    <main style={{ minHeight: "100vh", background: "#0D1B2A", overflowX: "hidden" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", width: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
        <Suspense fallback={<div style={{ color: '#E2E8F0', padding: 20 }}>Loading test harness...</div>}>
          {params.view === 'settings' ? (
            <ClientSettingsStudio
              initialProfile={{
                email: 'uat@example.com',
                fullName: 'UAT Athlete',
                phone: '',
                role: 'client',
                avatarUrl: null,
                pendingEmail: null,
              }}
              initialTab="schedule"
              workoutSchedule={buildWorkoutSchedule(plan.plan_json)}
            />
          ) : <FitnessTrackerClient
            profile={{
              full_name: "Scott Gordon",
              preferred_units: "imperial",
              fitness_goal: "Athletic Hypertrophy",
            }}
            latestPlan={plan}
            allPlans={[plan]}
            logs={[]}
            setLogs={[]}
            latestAnalysis={null}
            initialWorkspace="train"
          />}
        </Suspense>
      </div>
    </main>
  )
}
