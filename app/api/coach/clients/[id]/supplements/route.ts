import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  generateSupplementStack,
  SupplementGoal,
  ClientSex,
  FitnessLevel,
  MedicalHealthConditions,
} from '@/lib/supplement-prescriptions'

export async function GET(
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

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  const admin = supabaseAdmin()
  const { data: profile } = await admin
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', clientId)
    .maybeSingle()

  const { data: clientRecord } = await admin
    .from('clients')
    .select('full_name, email')
    .eq('id', clientId)
    .maybeSingle()

  // Generate default stack based on athlete profile
  const stack = generateSupplementStack({
    goal: 'hypertrophy',
    age: 35,
    sex: 'male',
    fitnessLevel: 'intermediate',
  })

  return NextResponse.json({
    ok: true,
    athlete: clientRecord,
    profile,
    stack,
  })
}

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
  const {
    goal = 'hypertrophy',
    age = 35,
    sex = 'male',
    fitnessLevel = 'intermediate',
    healthConditions = {},
    customCoachNote = '',
  } = body as {
    goal?: SupplementGoal
    age?: number
    sex?: ClientSex
    fitnessLevel?: FitnessLevel
    healthConditions?: MedicalHealthConditions
    customCoachNote?: string
  }

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  const admin = supabaseAdmin()
  const stack = generateSupplementStack({
    goal,
    age,
    sex,
    fitnessLevel,
    healthConditions,
  })

  // Format concierge message
  const morningList = stack.chronoSchedule.morning.map(s => `• **${s.name}**: ${s.optimalDosage}`).join('\n')
  const preWorkoutList = stack.chronoSchedule.preWorkout.map(s => `• **${s.name}**: ${s.optimalDosage}`).join('\n')
  const postWorkoutList = stack.chronoSchedule.postWorkout.map(s => `• **${s.name}**: ${s.optimalDosage}`).join('\n')
  const nightList = stack.chronoSchedule.night.map(s => `• **${s.name}**: ${s.optimalDosage}`).join('\n')

  const conciergeMessage = `**NEW EXECUTIVE SUPPLEMENT PROTOCOL DEPLOYED**

Coach Scott Gordon has calibrated your personalized Chrono-Dosing Supplement Stack:

**Morning Ignition (With Breakfast):**
${morningList || '• Standard hydration & electrolytes'}

**Pre-Workout Drive (45m Prior):**
${preWorkoutList || '• Adequate hydration'}

**Post-Workout Recovery (Anabolic Window):**
${postWorkoutList || '• High-protein whole meal'}

**Night Sleep Architecture (Pre-Bed):**
${nightList || '• Relaxation & dim lighting'}

${customCoachNote ? `**Coach Gordon's Directives:**\n"${customCoachNote}"\n` : ''}
Open your **Fitness Hub** to track your daily chrono-dosing adherence.`

  // Dispatch message to athlete
  await admin.from('coach_client_messages').insert({
    coach_id: coachId,
    client_id: clientId,
    sender_id: coachId,
    sender_role: 'coach',
    body: conciergeMessage,
  })

  return NextResponse.json({
    ok: true,
    stack,
    conciergeNotified: true,
  })
}

