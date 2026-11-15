import React from 'react'
import ClientMembershipStatusBanner from '@/components/dashboard/ClientMembershipStatusBanner'
import ExecutiveCommandCenterClient from '@/components/dashboard/ExecutiveCommandCenterClient'
import { generateSundayDossier } from '@/lib/sunday-dossier-engine'
import type { ClientStatus } from '@/lib/client-lifecycle'

export const dynamic = 'force-dynamic'

interface CommandCenterHarnessProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CommandCenterHarnessPage({ searchParams }: CommandCenterHarnessProps) {
  const params = await searchParams
  const rawStatus = typeof params.status === 'string' ? params.status : 'active'
  const status: ClientStatus =
    rawStatus === 'paused' || rawStatus === 'archived' ? rawStatus : 'active'
  const onboardingComplete = params.onboarding !== 'pending'
  const completedToday = params.completed === '1'

  const dossier = generateSundayDossier(
    'Marcus Sterling',
    'Phase 2: Strength Endurance',
    [
      { session_date: '2026-11-10', weight_kg: 100, reps: 8, is_warmup: false, rpe: 8, exercise_name: 'Barbell Bench Press' },
      { session_date: '2026-11-10', weight_kg: 100, reps: 8, is_warmup: false, rpe: 8, exercise_name: 'Barbell Bench Press' },
      { session_date: '2026-11-12', weight_kg: 120, reps: 6, is_warmup: false, rpe: 8.5, exercise_name: 'Barbell Back Squat' },
      { session_date: '2026-11-14', weight_kg: 110, reps: 8, is_warmup: false, rpe: 8, exercise_name: 'Barbell Romanian Deadlift' },
    ],
    [
      { session_date: '2026-11-11', activity_type: 'Zone 2 Bike', duration_mins: 35, avg_heart_rate: 128 },
    ],
    [
      { exercise_name: 'Barbell Back Squat', max_weight_kg: 140, max_weight_reps: 5, max_weight_date: '2026-11-12' },
    ],
    4,
    51,
    74,
    6200
  )

  const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  return (
    <main
      className="dashboard-page forge-obsidian-canvas"
      style={{ minHeight: '100dvh', backgroundColor: '#090A0D' }}
    >
      <div
        className="dashboard-content pb-24"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '16px 16px calc(6rem + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <ClientMembershipStatusBanner
          status={status}
          statusReason={status === 'paused' ? 'Executive travel Sabbatical' : status === 'archived' ? 'Season concluded' : null}
        />

        <ExecutiveCommandCenterClient
          clientName="Marcus Sterling"
          activePackage={{ package_name: 'Forge Performance Plus' }}
          currentPlanPhase="Phase 2: Strength Endurance"
          currentGoal="Joint-First Strength & Postural Resilience"
          isWorkoutInProgress={false}
          isWorkoutCompleted={completedToday}
          activeWorkout={{
            day: 2,
            focus: 'Upper Push / Pull Supersets',
            exercises: [
              { name: 'Dumbbell Bench Press', sets: 3, reps: 10 },
              { name: 'Stability Ball Push-Up', sets: 3, reps: 12 },
              { name: 'Seated Cable Row', sets: 3, reps: 10 },
              { name: 'Single-Arm Dumbbell Row', sets: 3, reps: 12 },
              { name: 'Standing Cable Scaption', sets: 2, reps: 15 },
              { name: 'Pallof Anti-Rotation Press', sets: 2, reps: 12 },
            ],
          }}
          activeDayLoggedWorkingSets={0}
          activeDayTotalTargetSets={16}
          activeDayExerciseCount={6}
          activeWorkoutDurationMins={52}
          totalVolumeMovedLbs={completedToday ? 14850 : 0}
          latestPlan={{
            nasm_opt_phase: 2,
            phase_name: 'Strength Endurance',
            estimated_duration_mins: 52,
          }}
          needsOnboarding={!onboardingComplete}
          isOnboardingCompleted={onboardingComplete}
          isOnboardingStarted={false}
          dossier={dossier}
          packages={[
            {
              id: 'pkg-1',
              package_name: 'Forge Performance Plus',
              purchased_at: '2026-10-01T00:00:00Z',
              sessions_remaining: 3,
              sessions_total: 4,
              expires_at: null,
            },
          ]}
          sessions={[
            {
              id: 'sess-1',
              scheduled_at: futureDate,
              duration_mins: 60,
              notes: 'Movement re-screen & squat mechanics',
              status: 'scheduled',
            },
          ]}
          totalRemaining={3}
          activeLiveSessionHref={params.live === '1' ? '/dashboard/live?teamId=forge-hq' : null}
        />
      </div>
    </main>
  )
}
