import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit } from '@/lib/rate-limit'
import {
  DISPENSARY_PARTNER_CONFIG,
  evaluateIntakePhysicianConsultFlag,
  FDA_DSHEA_DISCLAIMER,
  FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
  getThorneGoalCollection,
  MA_SAFE_HARBOR_SCOPE_NOTICE,
  normalizeSupplementGoal,
  SupplementGoal,
  VALID_SUPPLEMENT_GOALS,
  WADA_NSF_SPORT_NOTICE,
} from '@/lib/supplement-prescriptions'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
}

function sanitizeCoachNote(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/[\u0000-\u001F\u007F<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
      .select('fitness_goal')
      .eq('user_id', clientId)
      .maybeSingle(),
    admin
      .from('clients')
      .select('full_name, email')
      .eq('id', clientId)
      .maybeSingle(),
    admin
      .from('client_intake_forms')
      .select('parq_any_yes, parq_answers, medications, medical_conditions, allergies')
      .eq('user_id', clientId)
      .maybeSingle(),
  ])

  const goal = normalizeSupplementGoal(profile?.fitness_goal)
  const collection = getThorneGoalCollection(goal)
  const physicianConsultAlert = evaluateIntakePhysicianConsultFlag(intake)

  return NextResponse.json(
    {
      ok: true,
      supplementEngineDisabled: true,
      athlete: clientRecord,
      goal,
      collection,
      physicianConsultAlert,
      dispensaryInfo: DISPENSARY_PARTNER_CONFIG,
      disclosures: {
        ftcAffiliate: FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
        fdaDshea: FDA_DSHEA_DISCLAIMER,
        scopeOfPractice: MA_SAFE_HARBOR_SCOPE_NOTICE,
        wadaNsfSport: WADA_NSF_SPORT_NOTICE,
      },
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

  if (body.customCoachNote !== undefined && typeof body.customCoachNote !== 'string') {
    return NextResponse.json(
      { error: 'customCoachNote must be a string.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (typeof body.customCoachNote === 'string' && body.customCoachNote.length > 400) {
    return NextResponse.json(
      { error: 'customCoachNote must not exceed 400 characters.' },
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
    key: `coach-thorne-link-share:${coachId}:${clientId}`,
    limit: 20,
    windowSeconds: 60,
    route: '/api/coach/clients/[id]/supplements',
    dimension: 'coach-client',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many storefront shares. Please wait a moment.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const admin = supabaseAdmin()
  const { data: intake } = await admin
    .from('client_intake_forms')
    .select('parq_any_yes, parq_answers, medications, medical_conditions, allergies')
    .eq('user_id', clientId)
    .maybeSingle()

  const goal: SupplementGoal = (body.goal as SupplementGoal | undefined) ?? 'hypertrophy'
  const collection = getThorneGoalCollection(goal)
  const physicianConsultAlert = evaluateIntakePhysicianConsultFlag(intake)
  const customCoachNote = sanitizeCoachNote(body.customCoachNote)

  const productBulletList = collection.products
    .map(p => `• **${p.name}** (${p.certificationBadge}) — ${p.productUrl}`)
    .join('\n')

  const conciergeMessage = `**OPTIONAL THORNE PARTNER STOREFRONT — ${collection.title.toUpperCase()}**

${collection.subtitle}

${productBulletList}

${customCoachNote ? `**Coach Note:** "${customCoachNote}"\n\n` : ''}**Thorne Storefront (Optional 15% Member Discount):**
${collection.storefrontUrl}

*Important Medical Review:* ${physicianConsultAlert.message}

*${FTC_PROXIMATE_AFFILIATE_DISCLOSURE}*

*${FDA_DSHEA_DISCLAIMER} ${MA_SAFE_HARBOR_SCOPE_NOTICE}*`

  const { error: insertError } = await admin.from('coach_client_messages').insert({
    coach_id: coachId,
    client_id: clientId,
    sender_id: coachId,
    message_body: conciergeMessage,
  })

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to share Thorne storefront link to athlete messages.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      supplementEngineDisabled: true,
      goal,
      collection,
      physicianConsultAlert,
      conciergeNotified: true,
    },
    { headers: NO_STORE_HEADERS }
  )
}
