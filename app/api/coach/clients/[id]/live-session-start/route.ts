import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { notifyUser } from '@/lib/notifications'
import { getBaseUrl } from '@/lib/marketing-email'
import { enforceRateLimit } from '@/lib/rate-limit'

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

  // 1. Get client name
  const { data: clientRow } = await admin
    .from('clients')
    .select('full_name, email')
    .eq('id', clientId)
    .maybeSingle()

  const athleteName = clientRow?.full_name || 'Athlete'
  const baseUrl = typeof getBaseUrl === 'function' ? getBaseUrl() : 'https://forge-athletic.app'
  const livePath = '/dashboard/live'
  const liveUrl = `${baseUrl}${livePath}`

  // 2. Insert invitation message into Concierge line
  const inviteMessage = `**1:1 LIVE VIDEO CONSULTATION IN PROGRESS**\n\nCoach Gordon is waiting in your Live Movement Studio. Tap below to join your live coaching stream:\n\n[**Join Live Consultation Room**](${livePath})\n\nDirect Link: ${liveUrl}`

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
      body: `Your 1:1 Live Movement & Advisory Consultation is starting now. Tap to join: ${liveUrl}`,
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
      message: 'Live session alert and notification dispatched to athlete.',
    },
    { headers: NO_STORE_HEADERS }
  )
}
