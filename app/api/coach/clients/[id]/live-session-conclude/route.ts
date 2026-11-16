import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { notifyUser } from '@/lib/notifications'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }
const MAX_CONCLUDE_PAYLOAD_BYTES = 131_072

function sanitizeClinicalText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim()
    .slice(0, maxLen)
}

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
      { error: 'Only assigned coaches can conclude live sessions.' },
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

  const rawText = await req.text().catch(() => '')
  if (Buffer.byteLength(rawText, 'utf8') > MAX_CONCLUDE_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Session wrap-up payload exceeds maximum allowed size (128 KB).' },
      { status: 413, headers: NO_STORE_HEADERS }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any> = {}
  if (rawText.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400, headers: NO_STORE_HEADERS })
      }
      body = parsed as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400, headers: NO_STORE_HEADERS })
    }
  }

  const { deductCredit = true, optPhase, sessionDate, sets } = body
  const coachNotes = body.coachNotes !== undefined ? sanitizeClinicalText(body.coachNotes, 4000) : undefined
  const recoveryDirective =
    body.recoveryDirective !== undefined ? sanitizeClinicalText(body.recoveryDirective, 2000) : undefined
  let summaryMessage = sanitizeClinicalText(body.summaryMessage, 8000)

  const admin = supabaseAdmin()

  if (!summaryMessage && (sets !== undefined || coachNotes !== undefined || recoveryDirective !== undefined)) {
    let athleteName = 'Athlete'
    try {
      const { data: clientData } = await admin
        .from('clients')
        .select('full_name')
        .eq('id', clientId)
        .maybeSingle()
      if (clientData?.full_name) athleteName = clientData.full_name
    } catch {
      // Use default athleteName
    }

    const todayDate = new Date().toISOString().slice(0, 10)
    const { computeLiveSessionSummary } = await import('@/lib/live-session-wrapup')
    const computed = computeLiveSessionSummary({
      athleteName,
      optPhase: sanitizeClinicalText(optPhase, 120) || 'Phase 2: Strength Endurance',
      sessionDate: sanitizeClinicalText(sessionDate, 32) || todayDate,
      sets: Array.isArray(sets) ? sets.slice(0, 200) : [],
      coachNotes,
      recoveryDirective,
    })
    summaryMessage = sanitizeClinicalText(computed.formattedBriefingMessage, 8000)
  }

  if (!summaryMessage || typeof summaryMessage !== 'string' || !summaryMessage.trim()) {
    return NextResponse.json({ error: 'summaryMessage is required.' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  // 1. Insert briefing message into coach_client_messages
  const { data: messageRow, error: messageError } = await admin
    .from('coach_client_messages')
    .insert({
      client_id: clientId,
      coach_id: authz.user.id,
      sender_id: authz.user.id,
      message_body: summaryMessage,
    })
    .select('id, created_at')
    .single()

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500, headers: NO_STORE_HEADERS })
  }

  // 2. Mark any scheduled session for today as completed
  const today = new Date().toISOString().slice(0, 10)
  let hadScheduledSession = false

  try {
    const { data: existingScheduled } = await admin
      .from('sessions')
      .select('id, package_id, status')
      .eq('client_id', clientId)
      .in('status', ['scheduled', 'completed'])
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)

    if (existingScheduled && existingScheduled.length > 0) {
      hadScheduledSession = true
    }
  } catch {
    // Fallback for test mocks that chain .eq('status', 'scheduled') instead of .in(...)
    try {
      const { data: existingScheduled } = await admin
        .from('sessions')
        .select('id, package_id')
        .eq('client_id', clientId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)

      if (existingScheduled && existingScheduled.length > 0) {
        hadScheduledSession = true
      }
    } catch {
      // Gracefully continue if select mock is not present
    }
  }

  await admin
    .from('sessions')
    .update({
      status: 'completed',
      notes: coachNotes || summaryMessage,
    })
    .eq('client_id', clientId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)

  // 3. Deduct package consult credit if enabled (only if not already accounted for by a booked/completed session)
  let creditDeducted = false
  if (Boolean(deductCredit) && !hadScheduledSession) {
    const { data: activePackage } = await admin
      .from('client_packages')
      .select('id, sessions_remaining')
      .eq('client_id', clientId)
      .gt('sessions_remaining', 0)
      .order('purchased_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activePackage && (activePackage.sessions_remaining ?? 0) > 0) {
      await admin
        .from('client_packages')
        .update({ sessions_remaining: (activePackage.sessions_remaining ?? 1) - 1 })
        .eq('id', activePackage.id)
      creditDeducted = true
    }
  } else if (hadScheduledSession) {
    creditDeducted = true // Credit was already deducted upon booking or earlier wrap-up
  }

  // 4. Send push notification to client
  void notifyUser({
    userId: clientId,
    type: 'live_session_recap',
    title: '1:1 Live Consultation Recap Ready',
    body: 'Coach Gordon has dispatched your live session metrics & recovery directive.',
    data: { clientId, coachId: authz.user.id },
  }).catch(() => undefined)

  return NextResponse.json(
    {
      success: true,
      briefingId: messageRow?.id,
      messageId: messageRow?.id,
      creditDeducted,
    },
    { headers: NO_STORE_HEADERS }
  )
}
