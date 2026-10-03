import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  generate12WeekMacrocycle,
  MacrocyclePlan,
  syncMacrocycleWithCompletedWorkouts,
} from '@/lib/periodization-roadmap'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params
  const admin = supabaseAdmin()

  // Verify coach assignment
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, full_name, designated_coach_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client || client.designated_coach_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized coach access' }, { status: 403 })
  }

  try {
    // 1. Check for stored periodization in latest workout plan
    const { data: latestPlan } = await admin
      .from('workout_plans')
      .select('id, name, goal, plan_json, sessions_per_week, created_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 2. Fetch completed workout logs count for this client
    let completedCount = 0
    try {
      const logsQuery = admin.from('workout_logs')
      if (typeof logsQuery?.select === 'function') {
        if (latestPlan?.id) {
          const { count: planLogsCount } = await admin
            .from('workout_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', clientId)
            .eq('workout_plan_id', latestPlan.id)
            .eq('completed', true)

          if (typeof planLogsCount === 'number' && planLogsCount > 0) {
            completedCount = planLogsCount
          } else {
            const { count: allLogsCount } = await admin
              .from('workout_logs')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', clientId)
              .eq('completed', true)
            completedCount = allLogsCount ?? 0
          }
        } else {
          const { count } = await logsQuery
            .select('*', { count: 'exact', head: true })
            .eq('user_id', clientId)
            .eq('completed', true)
          completedCount = count ?? 0
        }
      }
    } catch {
      // Safe non-blocking fallback
    }

    const sessionsPerWeek = Number(latestPlan?.sessions_per_week) || 4

    if (latestPlan?.plan_json?.periodizationPlan) {
      const storedPlan = latestPlan.plan_json.periodizationPlan as MacrocyclePlan
      const syncedPlan = syncMacrocycleWithCompletedWorkouts(storedPlan, completedCount, sessionsPerWeek)
      return NextResponse.json({
        ok: true,
        plan: syncedPlan,
        source: 'stored',
        completedWorkoutsCount: completedCount,
      })
    }

    // 3. Otherwise fetch profile goal and generate baseline synced with microcycle progress
    const { data: profile } = await admin
      .from('fitness_profiles')
      .select('fitness_goal')
      .eq('user_id', clientId)
      .single()

    const clientGoal = profile?.fitness_goal || latestPlan?.goal || 'Body Recomposition & Maximal Power Output'
    const generatedPlan = generate12WeekMacrocycle(1, clientGoal)
    const syncedPlan = syncMacrocycleWithCompletedWorkouts(generatedPlan, completedCount, sessionsPerWeek)

    return NextResponse.json({
      ok: true,
      plan: syncedPlan,
      source: 'generated',
      completedWorkoutsCount: completedCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load periodization plan'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params
  const admin = supabaseAdmin()

  // Verify coach assignment
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, full_name, designated_coach_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client || client.designated_coach_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized coach access' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const plan: MacrocyclePlan = body.plan

    if (!plan || !Array.isArray(plan.weeks)) {
      return NextResponse.json({ error: 'Invalid periodization plan payload' }, { status: 400 })
    }

    // Attach calibration timestamp
    const calibratedPlan: MacrocyclePlan = {
      ...plan,
      coachCalibratedAt: new Date().toISOString(),
    }

    // Check if client has a workout plan to attach to
    const { data: existingPlan } = await admin
      .from('workout_plans')
      .select('id, plan_json')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingPlan) {
      const updatedPlanJson = {
        ...(typeof existingPlan.plan_json === 'object' && existingPlan.plan_json ? existingPlan.plan_json : {}),
        periodizationPlan: calibratedPlan,
      }

      await admin
        .from('workout_plans')
        .update({ plan_json: updatedPlanJson })
        .eq('id', existingPlan.id)
    } else {
      // Create new plan container
      await admin.from('workout_plans').insert({
        user_id: clientId,
        name: `12-Week OPT Periodization Macrocycle (${calibratedPlan.clientGoal})`,
        goal: calibratedPlan.clientGoal,
        nasm_opt_phase: calibratedPlan.weeks[0]?.phaseNumber ?? 1,
        phase_name: calibratedPlan.weeks[0]?.phase ?? 'Phase 1: Stabilization',
        sessions_per_week: 4,
        estimated_duration_mins: 60,
        plan_json: {
          periodizationPlan: calibratedPlan,
        },
      })
    }

    // If coach requested automatic message dispatch to notify athlete
    if (body.dispatchMessage) {
      const activeWeek = calibratedPlan.weeks.find(w => w.weekNumber === calibratedPlan.currentWeek) || calibratedPlan.weeks[0]
      const memoText = `### Periodization Roadmap Calibrated by Coach Gordon\n\nI have updated your **12-Week OPT™ Macrocycle Architecture**.\n\n- **Active Phase**: ${activeWeek.phase}\n- **Adaptation Velocity**: **${calibratedPlan.adaptationVelocity.toUpperCase()}**\n- **Microcycle Theme**: ${activeWeek.theme}\n- **Target Intensity**: ${activeWeek.volumeIntensity} (${activeWeek.tempo ?? '4/2/1 tempo'})\n- **Coach Memo**: ${activeWeek.coachWeeklyMemo ?? calibratedPlan.coachNotes ?? 'Stay disciplined on tempo and execution.'}\n\nYou can view your full updated 12-week roadmap inside your **Fitness Lab**.`

      try {
        await admin.from('coach_client_messages').insert({
          client_id: clientId,
          coach_id: userId,
          sender_id: userId,
          message_body: memoText,
        })
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({
      ok: true,
      plan: calibratedPlan,
      message: 'Macrocycle periodization calibrated and synchronized successfully.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save periodization plan'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
