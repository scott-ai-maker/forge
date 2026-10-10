import React from 'react'
import CoachDashboardPeriodizationStudio, { ClientSummaryOption } from '@/components/coach/CoachDashboardPeriodizationStudio'

export const dynamic = 'force-dynamic'

const MOCK_PERIODIZATION_CLIENTS: ClientSummaryOption[] = [
  {
    id: 'athlete-scott',
    fullName: 'Scott Gordon',
    email: 'scott.gordon72@outlook.com',
    goal: 'Phase 1: Stabilization & Hypertrophy Recomposition',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    equipmentAccess: ['dumbbell', 'band', 'stability ball', 'bench', 'bodyweight'],
    sessionsPerWeek: 4,
    age: 52,
    medicalConditions: 'Lower back stiffness on heavy morning axial loading',
    contraindications: [],
    ohsaCompensations: ['Arms Fall Forward', 'Anterior Pelvic Tilt'],
    existingPlan: {
      id: 'plan-scott-01',
      name: 'Scott Mesocycle 1: Core & Kinetic Foundation',
      goal: 'Recomposition',
      nasm_opt_phase: 1,
      phase_name: 'Phase 1: Stabilization Endurance',
      sessions_per_week: 4,
      plan_json: {
        clinicalRationale: 'Focus on rotational stability and glute medius activation to mitigate anterior pelvic tilt.',
      },
    },
  },
  {
    id: 'athlete-jennifer',
    fullName: 'Jennifer Miller',
    email: 'jennifer@example.com',
    goal: 'Fat Loss & Functional Carry Capacity',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    equipmentAccess: ['dumbbell', 'band', 'reebok step', 'bodyweight'],
    sessionsPerWeek: 3,
    age: 46,
    medicalConditions: 'Runner knee discomfort on deep impact lunges',
    contraindications: ['Avoid heavy plyometric lunges'],
    ohsaCompensations: ['Knee Valgus'],
    existingPlan: null,
  },
]

export default function CoachPeriodizationTestHarness() {
  return (
    <main
      data-hydrated="true"
      style={{
        minHeight: '100vh',
        background: 'var(--navy)',
        padding: '30px 20px',
        color: '#FFFFFF',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 24, marginBottom: 20 }}>
          Coach Periodization Studio Test Harness
        </h1>
        <CoachDashboardPeriodizationStudio clients={MOCK_PERIODIZATION_CLIENTS} />
      </div>
    </main>
  )
}
