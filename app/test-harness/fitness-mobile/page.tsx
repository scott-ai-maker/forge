import { Suspense } from 'react'
import FitnessTrackerClient from "@/components/fitness/FitnessTrackerClient"
import ClientSettingsStudio from '@/components/settings/ClientSettingsStudio'
import GlobalCoachGordonHost from '@/components/fitness/GlobalCoachGordonHost'
import { buildWorkoutSchedule } from '@/lib/workout-schedule'
import { generateCorrectiveExercisePlan, NasmAssessmentRecord } from '@/lib/nasm-assessments'

export const dynamic = 'force-dynamic'

const { overactiveMuscles: mockOveractive, underactiveMuscles: mockUnderactive, plan: mockCorrectivePlan } = generateCorrectiveExercisePlan([
  { compensation: 'arms_fall_forward', view: 'lateral', checkpoint: 'shoulders', severity: 'moderate' },
  { compensation: 'knees_move_inward', view: 'anterior', checkpoint: 'knees', severity: 'moderate' },
  { compensation: 'excessive_forward_lean', view: 'lateral', checkpoint: 'lphc', severity: 'moderate' },
])

const MOCK_ASSESSMENT: NasmAssessmentRecord = {
  id: 'test-assessment-1',
  client_id: 'test-user',
  coach_id: 'coach-gordon',
  assessment_date: new Date().toISOString(),
  static_posture: [
    { checkpoint: 'lphc', observation: 'Anterior Pelvic Tilt', distortionSyndrome: 'lower_crossed' },
    { checkpoint: 'shoulders', observation: 'Protracted Scapulae', distortionSyndrome: 'upper_crossed' },
  ],
  ohsa_findings: [
    { compensation: 'arms_fall_forward', view: 'lateral', checkpoint: 'shoulders', severity: 'moderate' },
    { compensation: 'knees_move_inward', view: 'anterior', checkpoint: 'knees', severity: 'moderate' },
    { compensation: 'excessive_forward_lean', view: 'lateral', checkpoint: 'lphc', severity: 'moderate' },
  ],
  overactive_muscles: mockOveractive,
  underactive_muscles: mockUnderactive,
  prescribed_correctives: mockCorrectivePlan,
  coach_summary_notes: 'Athlete demonstrates common Upper & Lower Crossed compensations with tight latissimus dorsi and adductors, alongside inhibited gluteus medius and lower trapezius. Prioritize SMR on calves/lats and prone cobra activation.',
  created_at: new Date().toISOString(),
}

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
  searchParams: Promise<{ view?: string; scenario?: string; workspace?: string; tab?: string; openScanner?: string; scanner?: string }>
}) {
  const params = await searchParams
  const variety = Object.entries(VARIETY_SCENARIOS).find(([name]) => name === params.scenario)?.[1]
  const isReadinessScenario = params.scenario?.startsWith('readiness')
  const isBodyCompScenario = params.scenario === 'bodycomp' || params.scenario === 'lab-bodycomp' || params.scenario === 'bodycomp-scanner'
  const isVideoScenario = params.scenario === 'video' || params.scenario === 'lab-video' || params.scenario === 'form-review'
  const isRoadmapScenario = params.scenario === 'roadmap' || params.scenario === 'lab-roadmap' || params.scenario === 'periodization'
  const isNutritionScenario = params.scenario === 'nutrition' || params.scenario === 'lab-nutrition' || params.scenario === 'macros'
  const isTravelScenario = params.scenario === 'travel' || params.scenario === 'lab-travel' || params.scenario === 'hotel'
  const isAssessmentScenario = params.scenario === 'assessment' || params.scenario === 'lab-assessment' || params.scenario === 'movement'
  const isSleepScenario = params.scenario === 'sleep' || params.scenario === 'lab-sleep' || params.scenario === 'sleep-hud'
  const isLabScenario = isReadinessScenario || isBodyCompScenario || isVideoScenario || isRoadmapScenario || isNutritionScenario || isTravelScenario || isAssessmentScenario || isSleepScenario || params.scenario?.startsWith('lab')
  const effectiveWorkspace = (params.workspace as any) || (isBodyCompScenario ? 'bodycomp' : isVideoScenario ? 'video' : isRoadmapScenario ? 'roadmap' : isNutritionScenario ? 'nutrition' : isTravelScenario ? 'travel' : isAssessmentScenario ? 'assessment' : isSleepScenario ? 'sleep' : isLabScenario ? 'lab' : 'train')
  const effectiveTab = (params.tab as any) || (
    params.scenario === 'readiness-acwr' ? 'acwr'
      : params.scenario === 'readiness-deload' ? 'deload'
      : params.scenario === 'readiness-heatmap' ? 'heatmap'
      : isReadinessScenario ? 'gate'
      : undefined
  )

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

  // Construct realistic 21-day timeline for readiness & ACWR scenarios
  const now = new Date()
  const getDateStr = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  }

  const isRed = params.scenario === 'readiness-red'
  const isYellow = params.scenario === 'readiness-yellow'

  const readinessLogs = isReadinessScenario ? [
    // Week 1 (Days 1–7: Acute window)
    { id: 'r-log-1', session_date: getDateStr(1), session_title: 'Upper Compound Power', exertion_rpe: isRed ? 10 : isYellow ? 8.5 : 8, completed: true },
    { id: 'r-log-2', session_date: getDateStr(3), session_title: 'Lower Chain Hypertrophy', exertion_rpe: isRed ? 9.5 : isYellow ? 8.5 : 7.5, completed: true },
    { id: 'r-log-3', session_date: getDateStr(5), session_title: 'Full Body Athletic Engine', exertion_rpe: isRed ? 9 : isYellow ? 8 : 7.5, completed: true },
    ...(isRed ? [
      { id: 'r-log-extra-1', session_date: getDateStr(2), session_title: 'Heavy Deadlift Contrast', exertion_rpe: 10, completed: true },
      { id: 'r-log-extra-2', session_date: getDateStr(4), session_title: 'Metabolic Sprint Intervals', exertion_rpe: 9.5, completed: true },
      { id: 'r-log-extra-3', session_date: getDateStr(6), session_title: 'High-Volume Squat Cluster', exertion_rpe: 10, completed: true },
    ] : isYellow ? [
      { id: 'r-log-extra-1', session_date: getDateStr(2), session_title: 'Shoulders & Arms Volume', exertion_rpe: 8.5, completed: true },
    ] : []),
    // Week 2 (Days 8–14: Chronic baseline)
    { id: 'r-log-4', session_date: getDateStr(8), session_title: 'Upper Compound Power', exertion_rpe: 7.5, completed: true },
    { id: 'r-log-5', session_date: getDateStr(10), session_title: 'Lower Chain Hypertrophy', exertion_rpe: 8, completed: true },
    { id: 'r-log-6', session_date: getDateStr(12), session_title: 'Full Body Athletic Engine', exertion_rpe: 7, completed: true },
    // Week 3 (Days 15–21: Chronic baseline)
    { id: 'r-log-7', session_date: getDateStr(15), session_title: 'Upper Compound Power', exertion_rpe: 7.5, completed: true },
    { id: 'r-log-8', session_date: getDateStr(17), session_title: 'Lower Chain Hypertrophy', exertion_rpe: 8, completed: true },
    { id: 'r-log-9', session_date: getDateStr(19), session_title: 'Full Body Athletic Engine', exertion_rpe: 7.5, completed: true },
  ] : []

  const readinessSetLogs = isReadinessScenario ? readinessLogs.flatMap((log, lIdx) => [
    { id: `r-set-${lIdx}-1`, session_date: log.session_date, exercise_name: 'Barbell Bench Press', set_number: 1, reps: 10, weight_kg: 80, rpe: log.exertion_rpe },
    { id: `r-set-${lIdx}-2`, session_date: log.session_date, exercise_name: 'Barbell Bench Press', set_number: 2, reps: 10, weight_kg: 80, rpe: log.exertion_rpe },
    { id: `r-set-${lIdx}-3`, session_date: log.session_date, exercise_name: 'Barbell Back Squat', set_number: 1, reps: 8, weight_kg: 100, rpe: log.exertion_rpe },
    { id: `r-set-${lIdx}-4`, session_date: log.session_date, exercise_name: 'Barbell Back Squat', set_number: 2, reps: 8, weight_kg: 100, rpe: log.exertion_rpe },
  ]) : []

  const mockTelemetry = isReadinessScenario || isSleepScenario ? {
    date: getDateStr(0),
    provider: 'apple_health' as const,
    sleepHours: isRed ? 5.2 : isYellow ? 6.4 : 7.9,
    deepSleepHours: 2.2,
    restingHeartRate: isRed ? 64 : isYellow ? 58 : 50,
    hrvRmssdMs: isRed ? 32 : isYellow ? 48 : 76,
    cnsStressScore: isRed ? 44 : isYellow ? 68 : 92,
    updatedAt: new Date().toISOString(),
  } : undefined

  return (
    <main style={{ minHeight: "100vh", background: "#0D1B2A", overflowX: "hidden", paddingBottom: "clamp(140px, 18vh, 180px)" }}>
      <div className="dashboard-fitness-content" style={{ maxWidth: 1440, margin: "0 auto", width: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
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
              age: 38,
              sex: 'male',
              ...(params.scenario === 'lab-bodycomp' ? { weight_kg: 80, height_cm: 180, sex: 'male' as const, preferred_units: 'metric' as const } : {}),
            }}
            latestPlan={plan}
            allPlans={[plan]}
            latestAssessment={isAssessmentScenario ? MOCK_ASSESSMENT : null}
            logs={isReadinessScenario ? readinessLogs : params.scenario === 'progress' ? Array.from({ length: 12 }, (_, index) => ({
              id: `progress-session-${index}`,
              session_title: `Workout ${index + 1}`,
              session_date: `2026-10-${String(index + 1).padStart(2, '0')}`,
              completed: true,
              workout_plan_id: plan.id,
              exertion_rpe: 7,
            })) : []}
            setLogs={isReadinessScenario ? readinessSetLogs : params.scenario === 'progress' ? Array.from({ length: 24 }, (_, index) => ({
              id: `progress-set-${index}`,
              exercise_name: index === 23 ? 'Standing Hip Flexor Static Stretch' : 'Barbell Flat Bench Press',
              session_date: `2026-10-${String(Math.floor(index / 2) + 1).padStart(2, '0')}`,
              reps: index === 23 ? 30 : 10,
              weight_kg: index === 23 ? 0 : 40 + index,
              set_number: index % 2 + 1,
              rpe: index < 2 ? undefined : 7,
            })) : []}
            latestAnalysis={isBodyCompScenario ? { estimated_bodyfat_percent: 14.8 } : null}
            initialWorkspace={effectiveWorkspace}
            initialTab={effectiveTab}
            initialOpenScanner={params.scenario === 'bodycomp-scanner' || params.openScanner === 'true' || params.scanner === 'true'}
            initialTelemetry={mockTelemetry}
          />}
        </Suspense>
      </div>
      <GlobalCoachGordonHost />
    </main>
  )
}
