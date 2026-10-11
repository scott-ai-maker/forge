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

export default async function FitnessMobileTestHarnessPage({ searchParams }: {
  searchParams: Promise<{ view?: string; scenario?: string }>
}) {
  const params = await searchParams
  const plan = params.scenario === 'schedule' ? {
    ...MOCK_PLAN,
    plan_json: {
      workouts: [
        ...MOCK_PLAN.plan_json.workouts,
        { ...MOCK_PLAN.plan_json.workouts[0], day: 2, focus: 'Schedule navigation check' },
      ],
    },
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
