import { Suspense } from 'react'
import FitnessTrackerClient from "@/components/fitness/FitnessTrackerClient"

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

export default function FitnessMobileTestHarnessPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0D1B2A", overflowX: "hidden" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", width: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
        <Suspense fallback={<div style={{ color: '#E2E8F0', padding: 20 }}>Loading test harness...</div>}>
          <FitnessTrackerClient
            profile={{
              full_name: "Scott Gordon",
              preferred_units: "imperial",
              fitness_goal: "Athletic Hypertrophy",
            }}
            latestPlan={MOCK_PLAN as any}
            allPlans={[MOCK_PLAN as any]}
            logs={[]}
            setLogs={[]}
            latestAnalysis={null}
            initialWorkspace="train"
          />
        </Suspense>
      </div>
    </main>
  )
}
