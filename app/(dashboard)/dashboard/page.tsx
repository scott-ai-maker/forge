import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { normalizeDashboardWorkspace } from '@/lib/validation'
import LogoutButton from '@/components/auth/LogoutButton'
import SuccessBanner from '@/components/dashboard/SuccessBanner'
import SiteHeader from '@/components/ui/SiteHeader'
import ClientMembershipStatusBanner from '@/components/dashboard/ClientMembershipStatusBanner'
import ExecutiveCommandCenterClient from '@/components/dashboard/ExecutiveCommandCenterClient'
import { generateSundayDossier } from '@/lib/sunday-dossier-engine'
import {
  extractWorkoutDayTag,
  filterSetLogsForMicrocycleWeek,
  resolveNextUnfinishedWorkoutDay,
  resolveWorkoutDayCompletion,
  resolveMicrocycleWeekCompletedCount,
  filterLogsForPlan,
} from '@/lib/fitness'
import { calculateActiveMicrocycleProgress } from '@/lib/periodization-roadmap'
import { calculateEstimatedWorkoutDuration } from '@/lib/workout-duration-engine'

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: packages },
    { data: sessions },
    { data: clientRow },
    { data: latestPlan },
    { data: weeklySetLogs },
    { data: weeklyCardioLogs },
    { data: recentPrs },
    { data: workoutLogs },
  ] = await Promise.all([
    supabase
      .from('client_packages')
      .select('*')
      .eq('client_id', user.id)
      .order('purchased_at', { ascending: false }),
    supabase
      .from('sessions')
      .select('*')
      .eq('client_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('clients')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workout_set_logs')
      .select('session_date, weight_lbs, reps, is_warmup, rpe, exercise_name, notes, created_at')
      .eq('user_id', user.id)
      .gte('session_date', sevenDaysAgo.split('T')[0])
      .order('session_date', { ascending: false }),
    supabase
      .from('cardio_logs')
      .select('session_date, activity_type, duration_mins, avg_heart_rate')
      .eq('user_id', user.id)
      .gte('session_date', sevenDaysAgo.split('T')[0])
      .order('session_date', { ascending: false }),
    supabase
      .from('personal_records')
      .select('exercise_name, weight_lbs, reps, achieved_at')
      .eq('user_id', user.id)
      .gte('achieved_at', sevenDaysAgo)
      .order('achieved_at', { ascending: false }),
    supabase
      .from('workout_logs')
      .select('id, session_title, session_date, completed, notes, exertion_rpe, created_at')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(30),
  ])

  const [{ data: profile }, { data: intakeForm }, { data: wearableMetric }] = await Promise.all([
    supabase
      .from('fitness_profiles')
      .select('onboarding_completed_at, fitness_goal, age, height_cm, weight_kg, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('client_intake_forms')
      .select('user_id, consent_signed_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('athlete_wearable_metrics')
      .select('resting_heart_rate')
      .eq('client_id', user.id)
      .order('sample_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const isOnboardingCompleted = Boolean(profile?.onboarding_completed_at)
  const isOnboardingStarted = Boolean(
    !isOnboardingCompleted && (
      profile?.height_cm != null ||
      profile?.weight_kg != null ||
      profile?.fitness_goal != null ||
      intakeForm != null
    )
  )
  const needsOnboarding = !isOnboardingCompleted
  const clientName = clientRow?.full_name || user.email?.split('@')[0] || 'Athlete'
  const currentGoal = latestPlan?.goal || profile?.fitness_goal || (needsOnboarding ? 'Intake & PAR-Q Pending' : 'Awaiting Protocol Assignment')
  const currentPlanPhase = latestPlan?.phase_name
    ? `Phase ${latestPlan.nasm_opt_phase}: ${latestPlan.phase_name}`
    : (needsOnboarding ? 'Intake & PAR-Q Pending' : (profile?.fitness_goal || 'Awaiting Protocol Assignment'))

  const restingHeartRate = wearableMetric?.resting_heart_rate ?? 54

  const dossier = generateSundayDossier(
    clientName,
    currentPlanPhase,
    weeklySetLogs ?? [],
    weeklyCardioLogs ?? [],
    recentPrs ?? [],
    4,
    restingHeartRate,
    68
  )

  const now = new Date()
  const activePackages = (packages ?? []).filter(
    p => !p.expires_at || new Date(p.expires_at) > now
  )
  const totalRemaining = activePackages.reduce(
    (sum, p) => sum + (p.sessions_remaining ?? 0),
    0
  )

  const activePackage = activePackages[0] ?? packages?.[0]

  const planJson = (latestPlan as { plan_json?: unknown } | null)?.plan_json
  const parsedPlanJson = typeof planJson === 'string'
    ? (() => {
        try {
          return JSON.parse(planJson) as { workouts?: Array<{ day: number; focus: string; scheduledDate?: string | null; notes?: string | null; exercises: Array<{ name: string; sets: string; reps: string; tempo?: string | null; rest?: string | null }> }> }
        } catch {
          return null
        }
      })()
    : (planJson as { workouts?: Array<{ day: number; focus: string; scheduledDate?: string | null; notes?: string | null; exercises: Array<{ name: string; sets: string; reps: string; tempo?: string | null; rest?: string | null }> }> } | null)

  const planWorkouts: Array<{
    day: number
    focus: string
    scheduledDate?: string | null
    notes?: string | null
    exercises: Array<{
      name: string
      sets: string
      reps: string
      tempo?: string | null
      rest?: string | null
    }>
  }> = Array.isArray(parsedPlanJson?.workouts) ? parsedPlanJson.workouts : []

  const sessionsPerWeek = Number(latestPlan?.sessions_per_week) || (planWorkouts.length > 0 ? planWorkouts.length : 4)
  const planCompletedLogs = filterLogsForPlan(workoutLogs ?? [], latestPlan, planWorkouts)
  const completedWorkoutCount = planCompletedLogs.length > 0
    ? planCompletedLogs.length
    : (workoutLogs ?? []).filter(l => l.completed !== false).length
  const activePlanLogs = planCompletedLogs.length > 0 ? planCompletedLogs : (workoutLogs ?? [])
  const rawActiveWeek = Math.min(12, Math.floor(completedWorkoutCount / sessionsPerWeek) + 1)
  const completedInActiveWeek = resolveMicrocycleWeekCompletedCount({
    planWorkouts,
    workoutLogs: activePlanLogs,
    currentWeek: rawActiveWeek,
    sessionsPerWeek,
    planId: latestPlan?.id,
  })
  const microcycleProgress = calculateActiveMicrocycleProgress(
    completedWorkoutCount,
    sessionsPerWeek,
    12,
    completedInActiveWeek
  )

  const todayStr = new Date().toISOString().split('T')[0]
  const todayScheduledWorkout = planWorkouts.find(w => w.scheduledDate === todayStr)
  const nextUnfinishedDay = resolveNextUnfinishedWorkoutDay(planWorkouts, activePlanLogs, latestPlan?.id, sessionsPerWeek)
  const activeWorkout = todayScheduledWorkout || planWorkouts.find(w => w.day === nextUnfinishedDay) || planWorkouts[0]

  const activeWorkoutCompletion = activeWorkout
    ? resolveWorkoutDayCompletion({
        day: activeWorkout.day,
        planWorkouts,
        workoutLogs: activePlanLogs,
        currentWeek: microcycleProgress.currentWeek,
        sessionsPerWeek,
        planId: latestPlan?.id,
      })
    : { isCompleted: false, completedLog: null, completionCount: 0 }

  const activeWorkoutCompletedLog = activeWorkoutCompletion.completedLog
  const isWorkoutCompleted = activeWorkoutCompletion.isCompleted

  const activeDaySetLogs = activeWorkout
    ? filterSetLogsForMicrocycleWeek({
        setLogs: (weeklySetLogs ?? []).map(s => ({
          ...s,
          exercise_name: s.exercise_name,
          reps: s.reps,
          weight_kg: s.weight_lbs ? s.weight_lbs / 2.20462 : null,
          is_warmup: s.is_warmup,
          notes: s.notes,
          session_date: s.session_date,
          created_at: s.created_at,
        })),
        workoutLogs: activePlanLogs,
        workoutDay: activeWorkout.day,
        currentWeek: microcycleProgress.currentWeek,
        sessionsPerWeek,
      })
    : []

  const activeDayLoggedWorkingSets = activeDaySetLogs.filter(s => !s.is_warmup).length
  const activeDayTotalTargetSets = ((activeWorkout?.exercises as Array<{ sets?: string | number } | undefined>) ?? []).reduce((sum: number, ex) => {
    const parsed = parseInt(String(ex?.sets || '3').trim(), 10)
    return sum + (isNaN(parsed) ? 3 : parsed)
  }, 0)

  const activeDayExerciseCount = (activeWorkout?.exercises ?? []).length
  const isWorkoutInProgress = activeDayLoggedWorkingSets > 0 && !isWorkoutCompleted
  const totalVolumeMovedLbs = activeDaySetLogs.reduce((acc, s) => acc + ((s.weight_lbs ?? 0) * (s.reps ?? 0)), 0)
  const activeWorkoutDurationMins = activeWorkout
    ? calculateEstimatedWorkoutDuration({
        workout: activeWorkout,
        optPhase: latestPlan?.nasm_opt_phase,
      }).totalDurationMins
    : undefined

  const params = await searchParams
  const showSuccess = params.success === 'true'
  const workspace = normalizeDashboardWorkspace(params.workspace)

  return (
    <main className="dashboard-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        links={[
          { href: '/dashboard', label: 'Today' },
          { href: '/dashboard/fitness', label: 'Training & progress' },
          { href: '/dashboard/dossier', label: 'Progress summary' },
          { href: '/dashboard/book', label: 'Book a session' },
          { href: '/dashboard/messages', label: 'Messages' },
          { href: '/dashboard/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div className="dashboard-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(12px, 2.2vw, 22px) clamp(8px, 1.8vw, 16px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {showSuccess && <SuccessBanner />}

        <ClientMembershipStatusBanner
          status={((clientRow as { status?: 'active' | 'paused' | 'archived' } | null)?.status || 'active')}
          statusReason={(clientRow as { status_reason?: string } | null)?.status_reason}
        />

        <ExecutiveCommandCenterClient
          clientName={clientName}
          activePackage={activePackage ? { package_name: activePackage.package_name } : null}
          currentPlanPhase={currentPlanPhase}
          currentGoal={currentGoal}
          isWorkoutInProgress={isWorkoutInProgress}
          isWorkoutCompleted={isWorkoutCompleted}
          activeWorkout={activeWorkout}
          activeDayLoggedWorkingSets={activeDayLoggedWorkingSets}
          activeDayTotalTargetSets={activeDayTotalTargetSets}
          activeDayExerciseCount={activeDayExerciseCount}
          activeWorkoutDurationMins={activeWorkoutDurationMins}
          totalVolumeMovedLbs={totalVolumeMovedLbs}
          latestPlan={latestPlan ? { nasm_opt_phase: latestPlan.nasm_opt_phase, phase_name: latestPlan.phase_name, estimated_duration_mins: activeWorkoutDurationMins || latestPlan.estimated_duration_mins || 75 } : null}
          needsOnboarding={needsOnboarding}
          isOnboardingCompleted={isOnboardingCompleted}
          isOnboardingStarted={isOnboardingStarted}
          dossier={dossier}
          packages={(packages ?? []).map(p => ({ id: p.id, package_name: p.package_name, purchased_at: p.purchased_at, sessions_remaining: p.sessions_remaining, sessions_total: p.sessions_total, expires_at: p.expires_at }))}
          sessions={(sessions ?? []).map(s => ({ id: s.id, scheduled_at: s.scheduled_at, duration_mins: s.duration_mins, notes: s.notes, status: s.status }))}
          totalRemaining={totalRemaining}
          initialWorkspace={workspace}
        />
      </div>
    </main>
  )
}
