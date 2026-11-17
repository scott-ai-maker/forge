import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { notifyUser } from '@/lib/notifications'
import { getBaseUrl } from '@/lib/marketing-email'
import { enforceRateLimit } from '@/lib/rate-limit'
import { checkClientMedicalClearanceGate } from '@/lib/liability-shield'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let authz
  try {
    authz = await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  if (authz.client.role !== 'coach') {
    return NextResponse.json(
      { error: 'Only assigned coaches can initiate live session alerts.' },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  const { id: clientId } = await context.params

  try {
    await requireCoachAssignedClient(authz.user.id, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `live-session-start:${authz.user.id}:${clientId}`,
    limit: 10,
    windowSeconds: 300,
    route: '/api/coach/clients/[id]/live-session-start',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many live session alerts sent recently. Please wait a few minutes.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const admin = supabaseAdmin()

  // Enforce Phase 0 Medical Clearance Hold prior to initiating any live exercise session
  const medicalGate = await checkClientMedicalClearanceGate(admin, clientId)
  if (medicalGate.blocked) {
    return NextResponse.json(
      {
        error:
          medicalGate.reason ||
          'Medical Clearance Hold (Phase 0): Written physician clearance must be verified before starting a Live Studio exercise session.',
        code: 'MEDICAL_CLEARANCE_HOLD',
      },
      { status: 409, headers: NO_STORE_HEADERS }
    )
  }

  // 1. Get client name & intake ERAP status
  const [{ data: clientRow }, { data: intakeRow }] = await Promise.all([
    admin.from('clients').select('full_name, email').eq('id', clientId).maybeSingle(),
    admin
      .from('client_intake_forms')
      .select('emergency_contact_name, emergency_contact_phone')
      .eq('user_id', clientId)
      .maybeSingle(),
  ])

  const hasEmergencyContact = Boolean(
    intakeRow?.emergency_contact_name?.trim() && intakeRow?.emergency_contact_phone?.trim()
  )
  const erapComplete = Boolean(medicalGate.evaluation.erapRecord?.isErapComplete && hasEmergencyContact)
  const erapWarning = erapComplete
    ? null
    : 'Athlete does not yet have a complete 10-digit local dispatch & workout address on file; they will be required to complete ERAP check-in before their live camera connects.'

  const athleteName = clientRow?.full_name || 'Athlete'
  const baseUrl = typeof getBaseUrl === 'function' ? getBaseUrl() : 'https://forge-athletic.app'
  const livePath = '/dashboard/live'
  const liveUrl = `${baseUrl}${livePath}`

  // 2. Insert invitation message into Concierge line
  const inviteMessage = `**1:1 LIVE VIDEO CONSULTATION IN PROGRESS**\n\nCoach Gordon is waiting in your 1:1 Live Movement Studio. Before your camera connects, you will be prompted to confirm your current physical training address and local emergency dispatch details (ERAP):\n\n[**Join 1:1 Live Studio**](${livePath})\n\nDirect Link: ${liveUrl}`

  await admin
    .from('coach_client_messages')
    .insert({
      client_id: clientId,
      coach_id: authz.user.id,
      sender_id: authz.user.id,
      message_body: inviteMessage,
    })

  // 3. Dispatch high-priority Push, Email & SMS Notification to athlete with direct link
  let pushSent = false
  try {
    const res = await notifyUser({
      userId: clientId,
      type: 'live_session_started',
      title: 'Coach Gordon is Live!',
      body: `Your 1:1 Live Movement & Advisory Consultation is starting now. Confirm your training location & join: ${liveUrl}`,
      url: livePath,
      data: {
        clientId,
        coachId: authz.user.id,
        url: livePath,
        link: liveUrl,
      },
    })
    pushSent = res.channels.length > 0
  } catch {
    pushSent = false
  }

  return NextResponse.json(
    {
      success: true,
      athleteName,
      pushSent,
      erapComplete,
      erapWarning,
      message: 'Live session alert and notification dispatched to athlete.',
    },
    { headers: NO_STORE_HEADERS }
  )
}
