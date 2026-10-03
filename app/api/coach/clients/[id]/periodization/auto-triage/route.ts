import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  generate12WeekMacrocycle,
  insertDeloadWeek,
  applySetbackCorrection,
  acceleratePhaseTransition,
  extendCurrentPhase,
  MacrocyclePlan,
} from '@/lib/periodization-roadmap'
import { PeriodizationAutoTriageAction } from '@/lib/coach-triage'

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
    const action: PeriodizationAutoTriageAction = body.action
    const reason = body.reason || 'Biometric workload & recovery triage'
    const targetPhase = Number(body.targetPhase) || 2

    if (!action) {
      return NextResponse.json({ error: 'Missing auto-triage action' }, { status: 400 })
    }

    // 1. Fetch current macrocycle from workout_plans or generate baseline
    const { data: existingPlanRecord } = await admin
      .from('workout_plans')
      .select('id, goal, plan_json')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let macrocycle: MacrocyclePlan = existingPlanRecord?.plan_json?.periodizationPlan
    if (!macrocycle) {
      const { data: profile } = await admin
        .from('fitness_profiles')
        .select('fitness_goal')
        .eq('user_id', clientId)
        .maybeSingle()
      const clientGoal = profile?.fitness_goal || existingPlanRecord?.goal || 'Body Recomposition & Maximal Power Output'
      macrocycle = generate12WeekMacrocycle(1, clientGoal)
    }

    const currentWeekNum = macrocycle.currentWeek || 1
    let modulatedPlan: MacrocyclePlan = macrocycle
    let actionSummary = ''

    // 2. Execute the requested periodization modulation
    if (action === 'insert_deload') {
      const memo = `Coach Gordon inserted an active restorative deload microcycle at Week ${currentWeekNum} due to elevated ACWR workload accumulation.`
      modulatedPlan = insertDeloadWeek(macrocycle, currentWeekNum, memo)
      actionSummary = `1-Click Restorative Deload Week inserted at Week ${currentWeekNum}.`
    } else if (action === 'setback_protocol') {
      const memo = `Coach Gordon applied a joint protection & decompression protocol: 4/2/1 tempo, reduced shearing load, and active SMR.`
      modulatedPlan = applySetbackCorrection(macrocycle, currentWeekNum, reason, memo)
      actionSummary = `Setback & Joint Decompression Protocol applied to Week ${currentWeekNum}.`
    } else if (action === 'accelerate_phase') {
      const memo = `Coach Gordon fast-tracked your progression into Phase ${targetPhase} following early movement mastery and progressive overload breakthroughs.`
      modulatedPlan = acceleratePhaseTransition(macrocycle, currentWeekNum, targetPhase, memo)
      actionSummary = `Accelerated to Phase ${targetPhase} starting from Week ${currentWeekNum}.`
    } else if (action === 'extend_phase') {
      const activePhase = macrocycle.weeks.find(w => w.weekNumber === currentWeekNum)?.phaseNumber || 1
      const memo = `Coach Gordon extended Phase ${activePhase} by 1 microcycle to reinforce kinetic chain stability before advancing load.`
      modulatedPlan = extendCurrentPhase(macrocycle, activePhase, 1, memo)
      actionSummary = `Extended Phase ${activePhase} by 1 reinforcement microcycle.`
    }

    // 3. Persist to database
    if (existingPlanRecord) {
      const updatedPlanJson = {
        ...(typeof existingPlanRecord.plan_json === 'object' && existingPlanRecord.plan_json ? existingPlanRecord.plan_json : {}),
        periodizationPlan: modulatedPlan,
      }
      await admin
        .from('workout_plans')
        .update({ plan_json: updatedPlanJson })
        .eq('id', existingPlanRecord.id)
    } else {
      await admin.from('workout_plans').insert({
        user_id: clientId,
        name: `12-Week OPT Periodization Macrocycle (${modulatedPlan.clientGoal})`,
        goal: modulatedPlan.clientGoal,
        nasm_opt_phase: modulatedPlan.weeks[0]?.phaseNumber ?? 1,
        phase_name: modulatedPlan.weeks[0]?.phase ?? 'Phase 1: Stabilization',
        sessions_per_week: 4,
        estimated_duration_mins: 60,
        plan_json: {
          periodizationPlan: modulatedPlan,
        },
      })
    }

    // 4. Dispatch concierge notification to client (non-blocking)
    const activeWeekObj = modulatedPlan.weeks.find(w => w.weekNumber === modulatedPlan.currentWeek) || modulatedPlan.weeks[0]
    const notificationContent = `### Periodization Auto-Triage: Plan Calibrated\n\nCoach Gordon has calibrated your **12-Week OPT™ Macrocycle Architecture** based on your latest workload & recovery telemetry.\n\n- **Action Taken**: ${actionSummary}\n- **Active Phase**: ${activeWeekObj.phase}\n- **Microcycle Theme**: ${activeWeekObj.theme}\n- **Target Variables**: ${activeWeekObj.volumeIntensity} (${activeWeekObj.tempo ?? '4/2/1 tempo'})\n- **Directive**: ${activeWeekObj.coachWeeklyMemo ?? 'Execute with strict tempo and joint control.'}\n\nYour updated timeline is live inside your **Fitness Lab**.`

    try {
      await admin.from('coach_client_messages').insert({
        client_id: clientId,
        coach_id: userId,
        sender_id: userId,
        message_body: notificationContent,
      })
    } catch {
      // Non-blocking: ensure calibration response succeeds even if notification logging has an issue
    }

    return NextResponse.json({
      ok: true,
      plan: modulatedPlan,
      actionExecuted: action,
      message: actionSummary,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute auto-triage periodization action'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
