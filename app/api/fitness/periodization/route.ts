import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  generate12WeekMacrocycle,
  MacrocyclePlan,
  syncMacrocycleWithCompletedWorkouts,
} from '@/lib/periodization-roadmap'

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  try {
    // 1. Check for stored periodization plan in workout_plans
    const { data: latestPlan } = await admin
      .from('workout_plans')
      .select('id, name, goal, plan_json, sessions_per_week, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 2. Fetch completed workout logs count for this user
    let completedCount = 0
    try {
      const logsQuery = admin.from('workout_logs')
      if (typeof logsQuery?.select === 'function') {
        if (latestPlan?.id) {
          const { count: planLogsCount } = await admin
            .from('workout_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('workout_plan_id', latestPlan.id)
            .eq('completed', true)

          if (typeof planLogsCount === 'number' && planLogsCount > 0) {
            completedCount = planLogsCount
          } else {
            const { count: allLogsCount } = await admin
              .from('workout_logs')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('completed', true)
            completedCount = allLogsCount ?? 0
          }
        } else {
          const { count } = await logsQuery
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
          completedCount = count ?? 0
        }
      }
    } catch {
      // Safe non-blocking fallback if logs table is unreachable
    }

    const sessionsPerWeek = Number(latestPlan?.sessions_per_week) || 4

    if (latestPlan?.plan_json?.periodizationPlan) {
      const storedPlan = latestPlan.plan_json.periodizationPlan as MacrocyclePlan
      const syncedPlan = syncMacrocycleWithCompletedWorkouts(storedPlan, completedCount, sessionsPerWeek)
      return NextResponse.json({
        ok: true,
        plan: syncedPlan,
        source: 'coach_calibrated',
        completedWorkoutsCount: completedCount,
      })
    }

    // 3. Otherwise fetch profile and generate baseline synced with completed microcycle volume
    const { data: profile } = await admin
      .from('fitness_profiles')
      .select('fitness_goal')
      .eq('user_id', userId)
      .maybeSingle()

    const clientGoal = profile?.fitness_goal || latestPlan?.goal || 'Body Recomposition & Maximal Power Output'
    const generatedPlan = generate12WeekMacrocycle(1, clientGoal)
    const syncedPlan = syncMacrocycleWithCompletedWorkouts(generatedPlan, completedCount, sessionsPerWeek)

    return NextResponse.json({
      ok: true,
      plan: syncedPlan,
      source: 'baseline_generated',
      completedWorkoutsCount: completedCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve periodization plan'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

