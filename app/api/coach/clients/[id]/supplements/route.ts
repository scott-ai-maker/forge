import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit } from '@/lib/rate-limit'
import {
  generateSupplementStack,
  normalizeSupplementGoal,
  normalizeClientSex,
  normalizeFitnessLevel,
  VALID_SUPPLEMENT_GOALS,
  VALID_CLIENT_SEXES,
  VALID_FITNESS_LEVELS,
  SupplementGoal,
  ClientSex,
  FitnessLevel,
  MedicalHealthConditions,
} from '@/lib/supplement-prescriptions'
import { parseParqMedicationsAndConditions } from '@/lib/muscle-recovery-telemetry'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
}

function sanitizeCoachDirective(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/[\u0000-\u001F\u007F<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeHealthConditions(raw: unknown): MedicalHealthConditions {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const obj = raw as Record<string, unknown>
  return {
    takingAnticoagulants: Boolean(obj.takingAnticoagulants),
    takingAntihypertensives: Boolean(obj.takingAntihypertensives),
    takingThyroidHormone: Boolean(obj.takingThyroidHormone),
    takingStatins: Boolean(obj.takingStatins),
    takingAntidepressants: Boolean(obj.takingAntidepressants),
    takingDiabetesMedications: Boolean(obj.takingDiabetesMedications),
    takingOralAntibiotics: Boolean(obj.takingOralAntibiotics),
    takingImmunosuppressantsOrSteroids: Boolean(obj.takingImmunosuppressantsOrSteroids),
    hasHypertension: Boolean(obj.hasHypertension),
    hasKidneyCondition: Boolean(obj.hasKidneyCondition),
    takingBloodThinners: Boolean(obj.takingBloodThinners),
    isPregnantOrNursing: Boolean(obj.isPregnantOrNursing),
    hasCaffeineSensitivity: Boolean(obj.hasCaffeineSensitivity),
  }
}

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
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id: clientId } = await params
  if (!clientId || clientId.length > 128) {
    return NextResponse.json(
      { error: 'Invalid athlete identifier.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json(
      { error: 'Not authorized for this athlete.' },
      { status, headers: NO_STORE_HEADERS }
    )
  }

  const admin = supabaseAdmin()
  const [{ data: profile }, { data: clientRecord }, { data: intake }] = await Promise.all([
    admin
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', clientId)
      .maybeSingle(),
    admin
      .from('clients')
      .select('full_name, email')
      .eq('id', clientId)
      .maybeSingle(),
    admin
      .from('client_intake_forms')
      .select('parq_answers, medications, medical_conditions')
      .eq('client_id', clientId)
      .maybeSingle(),
  ])

  const parsedMeds = parseParqMedicationsAndConditions(
    (intake?.parq_answers as Record<string, unknown> | null) ?? null,
    typeof intake?.medications === 'string' ? intake.medications : null,
    typeof intake?.medical_conditions === 'string' ? intake.medical_conditions : null
  )

  const rawAge = Number(profile?.age)
  const safeAge = Number.isFinite(rawAge) && rawAge >= 18 && rawAge <= 100 ? Math.round(rawAge) : 35

  const stack = generateSupplementStack({
    goal: normalizeSupplementGoal(profile?.primary_goal ?? profile?.fitness_goal),
    age: safeAge,
    sex: normalizeClientSex(profile?.sex),
    fitnessLevel: normalizeFitnessLevel(profile?.training_experience ?? profile?.fitness_level),
    healthConditions: parsedMeds,
  })

  return NextResponse.json(
    {
      ok: true,
      athlete: clientRecord,
      profile,
      intake: intake ?? null,
      stack,
    },
    { headers: NO_STORE_HEADERS }
  )
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
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id: clientId } = await params
  if (!clientId || clientId.length > 128) {
    return NextResponse.json(
      { error: 'Invalid athlete identifier.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Invalid JSON payload.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: 'Malformed JSON body.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (
    body.goal !== undefined &&
    (typeof body.goal !== 'string' ||
      !(VALID_SUPPLEMENT_GOALS as readonly string[]).includes(body.goal))
  ) {
    return NextResponse.json(
      { error: 'Invalid supplement goal.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (
    body.sex !== undefined &&
    (typeof body.sex !== 'string' ||
      !(VALID_CLIENT_SEXES as readonly string[]).includes(body.sex))
  ) {
    return NextResponse.json(
      { error: 'Invalid biological sex parameter.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (
    body.fitnessLevel !== undefined &&
    (typeof body.fitnessLevel !== 'string' ||
      !(VALID_FITNESS_LEVELS as readonly string[]).includes(body.fitnessLevel))
  ) {
    return NextResponse.json(
      { error: 'Invalid fitnessLevel parameter.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  let safeAge = 35
  if (body.age !== undefined && body.age !== '') {
    const parsedAge = Number(body.age)
    if (!Number.isFinite(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      return NextResponse.json(
        { error: 'Age must be between 18 and 100 years.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    safeAge = Math.round(parsedAge)
  }

  if (body.customCoachNote !== undefined && typeof body.customCoachNote !== 'string') {
    return NextResponse.json(
      { error: 'customCoachNote must be a string.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (typeof body.customCoachNote === 'string' && body.customCoachNote.length > 600) {
    return NextResponse.json(
      { error: 'customCoachNote must not exceed 600 characters.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json(
      { error: 'Not authorized for this athlete.' },
      { status, headers: NO_STORE_HEADERS }
    )
  }

  const rl = await enforceRateLimit({
    key: `coach-supplement-prescribe:${coachId}:${clientId}`,
    limit: 20,
    windowSeconds: 60,
    route: '/api/coach/clients/[id]/supplements',
    dimension: 'coach-client',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many supplement publications. Please wait a moment.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const goal: SupplementGoal = (body.goal as SupplementGoal | undefined) ?? 'hypertrophy'
  const sex: ClientSex = (body.sex as ClientSex | undefined) ?? 'male'
  const fitnessLevel: FitnessLevel =
    (body.fitnessLevel as FitnessLevel | undefined) ?? 'intermediate'
  const healthConditions = sanitizeHealthConditions(body.healthConditions)
  const customCoachNote = sanitizeCoachDirective(body.customCoachNote)

  const admin = supabaseAdmin()
  const stack = generateSupplementStack({
    goal,
    age: safeAge,
    sex,
    fitnessLevel,
    healthConditions,
  })

  // Format concierge message
  const morningList = stack.chronoSchedule.morning
    .map(s => `• **${s.name}**: ${s.optimalDosage}`)
    .join('\n')
  const preWorkoutList = stack.chronoSchedule.preWorkout
    .map(s => `• **${s.name}**: ${s.optimalDosage}`)
    .join('\n')
  const postWorkoutList = stack.chronoSchedule.postWorkout
    .map(s => `• **${s.name}**: ${s.optimalDosage}`)
    .join('\n')
  const nightList = stack.chronoSchedule.night
    .map(s => `• **${s.name}**: ${s.optimalDosage}`)
    .join('\n')

  const conciergeMessage = `**NEW PERFORMANCE SUPPLEMENT & NUTRIENT TIMING GUIDE**

Coach Gordon has published an evidence-based Chrono-Dosing Supplement Guide tailored to your athletic goals:

**Morning Ignition (With Breakfast):**
${morningList || '• Standard hydration & electrolytes'}

**Pre-Workout Drive (45m Prior):**
${preWorkoutList || '• Adequate hydration'}

**Post-Workout Recovery (Anabolic Window):**
${postWorkoutList || '• High-protein whole meal'}

**Night Sleep Architecture (Pre-Bed):**
${nightList || '• Relaxation & dim lighting'}

${customCoachNote ? `**Coach Gordon's Directives & Notes:**\n"${customCoachNote}"\n\n` : ''}**Forge Athletic × Thorne Practitioner Dispensary (Optional 15% Member Discount):**
${stack.dispensaryInfo.defaultThorneUrl}
*Partner Notice: Purchasing through the Forge Athletic × Thorne dispensary is 100% voluntary and unlocks a 15% courtesy discount on NSF Certified for Sport® formulations (Forge Athletic may receive an affiliate commission).*

*Educational & Scope Notice: Formulated for athletic performance support based on published ISSN & IOC sports science consensus data. Coach Gordon is a Certified Personal Trainer (NASM-CPT) and does not provide medical diagnoses, prescriptions, or medical nutrition therapy. Always review all dietary supplements with your prescribing healthcare provider before starting, especially if taking prescription medications.*

Open your **Fitness Hub** to track your daily chrono-dosing adherence.`

  const { error: insertError } = await admin.from('coach_client_messages').insert({
    coach_id: coachId,
    client_id: clientId,
    sender_id: coachId,
    sender_role: 'coach',
    body: conciergeMessage,
  })

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to dispatch supplement guide to athlete concierge.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      stack,
      conciergeNotified: true,
    },
    { headers: NO_STORE_HEADERS }
  )
}
