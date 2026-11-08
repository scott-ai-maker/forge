import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, isMasterCoachEmail, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

export interface ClientEngagement {
  clientId: string
  fullName: string | null
  email: string
  sessionsRemaining: number
  workoutLogsLast28: number
  setsLoggedLast28?: number
  volumeLbsLast28?: number
  workoutCompliancePct: number | null
  checkinsLast8: number
  lastCheckinDate: string | null
  lastWorkoutDate: string | null
  streakDays: number
  hasActiveGoals: number
  trend: 'improving' | 'stable' | 'declining' | 'new'
}

export async function GET(req: NextRequest) {
  let coachId = ''
  let isMasterCoach = false
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
    isMasterCoach = isMasterCoachEmail(authz.user.email) || authz.user.user_metadata?.surface_role === 'coach'
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const now = new Date()

  const since28 = new Date(now)
  since28.setDate(since28.getDate() - 28)
  const since28Str = since28.toISOString().slice(0, 10)

  const since56 = new Date(now)
  since56.setDate(since56.getDate() - 56)
  const since56Str = since56.toISOString().slice(0, 10)

  // Load assigned clients (or assigned + unassigned for Master Coach)
  let clientsQuery = admin
    .from('clients')
    .select('id, email, full_name, created_at, designated_coach_id')
    .eq('role', 'client')
    .order('full_name', { ascending: true })

  if (isMasterCoach) {
    clientsQuery = clientsQuery.or(`designated_coach_id.eq.${coachId},designated_coach_id.is.null`)
  } else {
    clientsQuery = clientsQuery.eq('designated_coach_id', coachId)
  }

  const { data: clients, error: clientsError } = await clientsQuery

  if (clientsError) {
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 })
  }

  if (!clients || clients.length === 0) {
    return NextResponse.json({ clients: [], summary: buildSummary([]) })
  }

  const clientIds = clients.map((c) => c.id)

  // Parallel data fetch across workout_logs, workout_set_logs, cardio_logs, fitness_profiles, workout_plans, packages, checkins, and goals
  const [
    packagesRes,
    workoutLogsRes,
    setLogsRes,
    cardioLogsRes,
    profilesRes,
    plansRes,
    checkinsRes,
    goalsRes,
  ] = await Promise.all([
    admin
      .from('client_packages')
      .select('client_id, sessions_remaining, expires_at')
      .in('client_id', clientIds),
    admin
      .from('workout_logs')
      .select('user_id, session_date, completed, created_at')
      .in('user_id', clientIds)
      .order('session_date', { ascending: false })
      .limit(2000),
    admin
      .from('workout_set_logs')
      .select('user_id, session_date, reps, weight_kg, is_warmup, created_at')
      .in('user_id', clientIds)
      .order('session_date', { ascending: false })
      .limit(5000),
    admin
      .from('cardio_logs')
      .select('user_id, session_date, duration_mins, created_at')
      .in('user_id', clientIds)
      .order('session_date', { ascending: false })
      .limit(1000),
    admin
      .from('fitness_profiles')
      .select('user_id, training_days_per_week, onboarding_completed_at')
      .in('user_id', clientIds),
    admin
      .from('workout_plans')
      .select('user_id, sessions_per_week, plan_json, created_at')
      .in('user_id', clientIds)
      .order('created_at', { ascending: false }),
    admin
      .from('weekly_checkins')
      .select('user_id, week_start, created_at')
      .in('user_id', clientIds)
      .order('created_at', { ascending: false })
      .limit(clientIds.length * 8),
    admin
      .from('client_goals')
      .select('user_id, is_achieved')
      .in('user_id', clientIds)
      .eq('is_achieved', false),
  ])

  // Build active sessions remaining lookup (filtering out expired packages)
  const sessionsMap = new Map<string, number>()
  for (const pkg of packagesRes.data ?? []) {
    if (pkg.expires_at && new Date(pkg.expires_at) <= now) {
      continue
    }
    const current = sessionsMap.get(pkg.client_id) ?? 0
    sessionsMap.set(pkg.client_id, current + (pkg.sessions_remaining ?? 0))
  }

  // Build unified distinct training dates per client across workout_logs, workout_set_logs, and cardio_logs
  const allDatesByClient = new Map<string, Set<string>>()
  const recordClientWorkoutDate = (userId: string | null | undefined, rawDate: string | null | undefined) => {
    if (!userId || !rawDate) return
    const dateStr = String(rawDate).slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return
    const existing = allDatesByClient.get(userId) ?? new Set<string>()
    existing.add(dateStr)
    allDatesByClient.set(userId, existing)
  }

  for (const log of workoutLogsRes.data ?? []) {
    if (log.completed === false) continue
    recordClientWorkoutDate(log.user_id, log.session_date || log.created_at)
  }

  const setsLast28Map = new Map<string, number>()
  const volumeKgLast28Map = new Map<string, number>()
  for (const setLog of setLogsRes.data ?? []) {
    const dateStr = String(setLog.session_date || setLog.created_at || '').slice(0, 10)
    recordClientWorkoutDate(setLog.user_id, dateStr)
    if (dateStr >= since28Str) {
      setsLast28Map.set(setLog.user_id, (setsLast28Map.get(setLog.user_id) ?? 0) + 1)
      if (!setLog.is_warmup) {
        const volKg = (Number(setLog.reps) || 0) * (Number(setLog.weight_kg) || 0)
        if (Number.isFinite(volKg) && volKg > 0) {
          volumeKgLast28Map.set(setLog.user_id, (volumeKgLast28Map.get(setLog.user_id) ?? 0) + volKg)
        }
      }
    }
  }

  for (const cardioLog of cardioLogsRes.data ?? []) {
    recordClientWorkoutDate(cardioLog.user_id, cardioLog.session_date || cardioLog.created_at)
  }

  // Profile & Plan target sessions per week lookup
  const profileMap = new Map<string, { training_days_per_week?: number | null; onboarding_completed_at?: string | null }>()
  for (const prof of profilesRes.data ?? []) {
    profileMap.set(prof.user_id, prof)
  }

  const latestPlanMap = new Map<string, { sessions_per_week?: number | null; workoutsCount: number }>()
  for (const plan of plansRes.data ?? []) {
    if (latestPlanMap.has(plan.user_id)) continue
    const rawPlanJson = plan.plan_json as { workouts?: unknown[] } | null
    const workoutsCount = Array.isArray(rawPlanJson?.workouts) ? rawPlanJson.workouts.length : 0
    latestPlanMap.set(plan.user_id, {
      sessions_per_week: plan.sessions_per_week,
      workoutsCount,
    })
  }

  // Check-ins map: last 8 per client
  const checkinsByClient = new Map<string, { week_start: string; created_at: string }[]>()
  for (const ci of checkinsRes.data ?? []) {
    const existing = checkinsByClient.get(ci.user_id) ?? []
    if (existing.length < 8) {
      existing.push({ week_start: ci.week_start, created_at: ci.created_at })
      checkinsByClient.set(ci.user_id, existing)
    }
  }

  // Active goals per client
  const activeGoalsMap = new Map<string, number>()
  for (const g of goalsRes.data ?? []) {
    activeGoalsMap.set(g.user_id, (activeGoalsMap.get(g.user_id) ?? 0) + 1)
  }

  const engagement: ClientEngagement[] = clients.map((client) => {
    const dateSet = allDatesByClient.get(client.id) ?? new Set<string>()
    const sortedDatesDesc = Array.from(dateSet).sort((a, b) => b.localeCompare(a))

    const logs28 = sortedDatesDesc.filter((d) => d >= since28Str)
    const logsPrev28 = sortedDatesDesc.filter((d) => d >= since56Str && d < since28Str)

    const logCount28 = logs28.length
    const logCountPrev28 = logsPrev28.length
    const checkins = checkinsByClient.get(client.id) ?? []
    const latestCheckin = checkins[0]
    const lastCheckinDate = latestCheckin
      ? (latestCheckin.created_at ? String(latestCheckin.created_at).slice(0, 10) : latestCheckin.week_start)
      : null
    const lastWorkoutDate = sortedDatesDesc[0] ?? null
    const activeGoals = activeGoalsMap.get(client.id) ?? 0

    // Resolve client's target sessions per week from plan or fitness profile (default 4)
    const planInfo = latestPlanMap.get(client.id)
    const profileInfo = profileMap.get(client.id)
    const sessionsPerWeek =
      Number(planInfo?.sessions_per_week) ||
      Number(profileInfo?.training_days_per_week) ||
      (planInfo?.workoutsCount && planInfo.workoutsCount > 0 ? planInfo.workoutsCount : 4)

    // Prorate 28-day target if the client joined fewer than 28 days ago
    const clientCreatedAt = (client as { created_at?: string | null }).created_at
    const daysSinceJoined = clientCreatedAt
      ? Math.max(7, Math.min(28, Math.ceil((now.getTime() - new Date(clientCreatedAt).getTime()) / 86_400_000)))
      : 28
    const targetSessionsWindow = Math.max(1, Math.round((sessionsPerWeek * daysSinceJoined) / 7))

    const hasOnboardedOrPlan = Boolean(profileInfo?.onboarding_completed_at || planInfo || sortedDatesDesc.length > 0)
    const compliance =
      logCount28 > 0
        ? Math.min(Math.round((logCount28 / targetSessionsWindow) * 100), 100)
        : hasOnboardedOrPlan
        ? 0
        : null

    // Streak: count consecutive days with at least one workout going back from today (or yesterday)
    let streak = 0
    const cursor = new Date(now)
    const todayIso = cursor.toISOString().slice(0, 10)
    if (!dateSet.has(todayIso)) {
      // Allow streak to continue from yesterday if today hasn't been logged yet
      cursor.setDate(cursor.getDate() - 1)
    }
    for (let i = 0; i < 28; i++) {
      const d = cursor.toISOString().slice(0, 10)
      if (dateSet.has(d)) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    // Trend
    let trend: ClientEngagement['trend']
    if (logCount28 === 0 && logCountPrev28 === 0) {
      trend = 'new'
    } else if (logCount28 > logCountPrev28 * 1.1) {
      trend = 'improving'
    } else if (logCount28 < logCountPrev28 * 0.8) {
      trend = 'declining'
    } else {
      trend = 'stable'
    }

    return {
      clientId: client.id,
      fullName: client.full_name ?? null,
      email: client.email,
      sessionsRemaining: sessionsMap.get(client.id) ?? 0,
      workoutLogsLast28: logCount28,
      setsLoggedLast28: setsLast28Map.get(client.id) ?? 0,
      volumeLbsLast28: Math.round((volumeKgLast28Map.get(client.id) ?? 0) * 2.20462),
      workoutCompliancePct: compliance,
      checkinsLast8: checkins.length,
      lastCheckinDate,
      lastWorkoutDate,
      streakDays: streak,
      hasActiveGoals: activeGoals,
      trend,
    }
  })

  return NextResponse.json({
    clients: engagement,
    summary: buildSummary(engagement),
  })
}

function buildSummary(data: ClientEngagement[]) {
  const total = data.length
  if (total === 0) {
    return {
      totalClients: 0,
      avgCompliancePct: null,
      improving: 0,
      declining: 0,
      needsAttention: 0,
    }
  }

  const withCompliance = data.filter((c) => c.workoutCompliancePct !== null)
  const avgCompliance =
    withCompliance.length > 0
      ? Math.round(
          withCompliance.reduce((s, c) => s + (c.workoutCompliancePct ?? 0), 0) /
            withCompliance.length
        )
      : null

  return {
    totalClients: total,
    avgCompliancePct: avgCompliance,
    improving: data.filter((c) => c.trend === 'improving').length,
    declining: data.filter((c) => c.trend === 'declining').length,
    needsAttention: data.filter(
      (c) =>
        c.trend === 'declining' ||
        (c.workoutCompliancePct !== null && c.workoutCompliancePct < 50) ||
        (c.lastCheckinDate === null && c.workoutLogsLast28 === 0)
    ).length,
  }
}
