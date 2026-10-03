import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { adaptFullPlanForTravel, TravelLocationScenario, TRAVEL_SCENARIO_META } from '@/lib/travel-workout-adapter'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: clientId } = await params
  const body = await req.json().catch(() => ({}))
  const { scenario, customNotes } = body as {
    scenario: TravelLocationScenario
    customNotes?: string
  }

  if (!scenario || !TRAVEL_SCENARIO_META[scenario]) {
    return NextResponse.json({ error: 'Valid travel scenario is required.' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  // 1. Fetch current active plan
  const { data: latestPlan, error: planFetchErr } = await admin
    .from('workout_plans')
    .select('*')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (planFetchErr || !latestPlan || !latestPlan.plan_json) {
    return NextResponse.json(
      { error: 'No active workout plan found for this athlete to recalibrate.' },
      { status: 404 }
    )
  }

  // 2. Adapt the plan using sports science travel rules
  const adapted = adaptFullPlanForTravel(
    latestPlan.plan_json,
    scenario,
    latestPlan.name
  )

  const scenarioMeta = TRAVEL_SCENARIO_META[scenario]
  const isRestoring = scenario === 'commercial_full_gym'

  const newPlanRow = {
    user_id: clientId,
    name: adapted.planTitle,
    goal: latestPlan.goal || 'hypertrophy',
    nasm_opt_phase: latestPlan.nasm_opt_phase || 1,
    phase_name: latestPlan.phase_name || 'Stabilization Endurance',
    sessions_per_week: latestPlan.sessions_per_week || 4,
    estimated_duration_mins: latestPlan.estimated_duration_mins || 55,
    plan_json: {
      ...adapted.planJson,
      generatedByCoachId: coachId,
      recalibratedFromPlanId: latestPlan.id,
      coachTravelNotes: customNotes || null,
    },
  }

  const { data: insertedPlan, error: insertErr } = await admin
    .from('workout_plans')
    .insert(newPlanRow)
    .select('*')
    .single()

  if (insertErr || !insertedPlan) {
    return NextResponse.json(
      { error: insertErr?.message || 'Failed to save adapted workout plan.' },
      { status: 500 }
    )
  }

  // 3. Dispatch Concierge Notification
  const conciergeMessage = isRestoring
    ? `Welcome Back: I have restored your primary **${adapted.planTitle}** barbell protocol! Your Fitness Lab has been updated for standard gym access.`
    : `Travel Protocol Deployed: I've recalibrated your training split for **${scenarioMeta.label}**! All exercises, tempos, and coaching cues are now active in your Fitness Lab.${customNotes ? `\n\nCoach Note: "${customNotes}"` : ''}`

  await admin.from('coach_client_messages').insert({
    client_id: clientId,
    coach_id: coachId,
    sender_id: coachId,
    message_body: conciergeMessage,
  })

  // 4. Log lifecycle / audit event
  try {
    await admin.from('client_lifecycle_events').insert({
      client_id: clientId,
      event_type: 'travel_recalibration',
      actor_id: coachId,
      metadata: {
        scenario,
        planId: insertedPlan.id,
        planTitle: adapted.planTitle,
      },
    })
  } catch {
    // Non-critical if table doesn't have event_type constraint
  }

  return NextResponse.json({
    ok: true,
    plan: insertedPlan,
    message: isRestoring
      ? 'Standard commercial gym protocol restored.'
      : `Successfully deployed ${scenarioMeta.label} protocol to athlete.`,
  })
}

