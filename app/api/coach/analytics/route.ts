import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

export interface ClientEngagement {
  clientId: string
  fullName: string | null
  email: string
  sessionsRemaining: number
  workoutLogsLast28: number
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
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
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

  // Load assigned clients
  const { data: clients, error: clientsError } = await admin
    .from('clients')
    .select('id, email, full_name')
    .eq('designated_coach_id', coachId)
    .eq('role', 'client')
    .order('full_name', { ascending: true })

  if (clientsError) {
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 })
  }

  if (!clients || clients.length === 0) {
    return NextResponse.json({ clients: [], summary: buildSummary([]) })
  }

  const clientIds = clients.map((c) => c.id)

  // Parallel data fetch
  const [packagesRes, workoutLogsRes, workoutLogs56Res, checkinsRes, goalsRes] = await Promise.all([
    admin
      .from('client_packages')
      .select('client_id, sessions_remaining')
      .in('client_id', clientIds),
    admin
      .from('workout_logs')
      .select('user_id, session_date, completed')
      .in('user_id', clientIds)
      .gte('session_date', since28Str)
      .eq('completed', true)
      .order('session_date', { ascending: false }),
    admin
      .from('workout_logs')
      .select('user_id, session_date, completed')
      .in('user_id', clientIds)
      .gte('session_date', since56Str)
      .lt('session_date', since28Str)
      .eq('completed', true),
    admin
      .from('weekly_checkins')
      .select('user_id, week_start, created_at')
      .in('user_id', clientIds)
      .order('week_start', { ascending: false })
      .limit(clientIds.length * 8),
    admin
      .from('client_goals')
      .select('user_id, is_achieved')
      .in('user_id', clientIds)
      .eq('is_achieved', false),
  ])

  // Build lookup maps
  const sessionsMap = new Map<string, number>()
  for (const pkg of packagesRes.data ?? []) {
    const current = sessionsMap.get(pkg.client_id) ?? 0
    sessionsMap.set(pkg.client_id, current + (pkg.sessions_remaining ?? 0))
  }

  // Workout logs last 28 days per client
  const logsLast28Map = new Map<string, string[]>()
  for (const log of workoutLogsRes.data ?? []) {
    const existing = logsLast28Map.get(log.user_id) ?? []
    existing.push(log.session_date)
    logsLast28Map.set(log.user_id, existing)
  }

  // Workout logs 28-56 days ago (for trend)
  const logsPrev28Map = new Map<string, number>()
  for (const log of workoutLogs56Res.data ?? []) {
    logsPrev28Map.set(log.user_id, (logsPrev28Map.get(log.user_id) ?? 0) + 1)
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
    const logs28 = logsLast28Map.get(client.id) ?? []
    const logCount28 = logs28.length
    const logCountPrev28 = logsPrev28Map.get(client.id) ?? 0
    const checkins = checkinsByClient.get(client.id) ?? []
    const lastCheckinDate = checkins[0]?.week_start ?? null
    const lastWorkoutDate = logs28[0] ?? null
    const activeGoals = activeGoalsMap.get(client.id) ?? 0

    // Compliance assumes 4 sessions/week target (~16 per 28 days) as baseline
    const TARGET_SESSIONS_28 = 16
    const compliance =
      logCount28 > 0
        ? Math.min(Math.round((logCount28 / TARGET_SESSIONS_28) * 100), 100)
        : null

    // Streak: count consecutive days with at least one workout going back from today
    const workoutDateSet = new Set(logs28)
    let streak = 0
    const cursor = new Date(now)
    for (let i = 0; i < 28; i++) {
      const d = cursor.toISOString().slice(0, 10)
      if (workoutDateSet.has(d)) {
        streak++
      } else if (streak > 0) {
        break
      }
      cursor.setDate(cursor.getDate() - 1)
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
