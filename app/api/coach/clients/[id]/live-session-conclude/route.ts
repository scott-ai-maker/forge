import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { notifyUser } from '@/lib/notifications'

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
    return NextResponse.json({ error: message }, { status })
  }

  if (authz.client.role !== 'coach') {
    return NextResponse.json({ error: 'Only assigned coaches can conclude live sessions.' }, { status: 403 })
  }

  const { id: clientId } = await context.params

  try {
    await requireCoachAssignedClient(authz.user.id, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const { deductCredit = true, optPhase, sessionDate, coachNotes, recoveryDirective, sets } = body
  let summaryMessage = typeof body.summaryMessage === 'string' ? body.summaryMessage.trim() : ''

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
      optPhase: optPhase || 'Phase 2: Strength Endurance',
      sessionDate: sessionDate || todayDate,
      sets: Array.isArray(sets) ? sets : [],
      coachNotes,
      recoveryDirective,
    })
    summaryMessage = computed.formattedBriefingMessage
  }

  if (!summaryMessage || typeof summaryMessage !== 'string' || !summaryMessage.trim()) {
    return NextResponse.json({ error: 'summaryMessage is required.' }, { status: 400 })
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
    return NextResponse.json({ error: messageError.message }, { status: 500 })
  }

  // 2. Mark any scheduled session for today as completed
  const today = new Date().toISOString().slice(0, 10)
  let hadScheduledSession = false

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

  // 3. Deduct package consult credit if enabled (only if not already accounted for by a booked session)
  let creditDeducted = false
  if (deductCredit && !hadScheduledSession) {
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
    creditDeducted = true // Credit was already deducted upon booking
  }

  // 4. Send push notification to client
  void notifyUser({
    userId: clientId,
    type: 'live_session_recap',
    title: '1:1 Live Consultation Recap Ready',
    body: 'Coach Scott Gordon has dispatched your live session metrics & recovery directive.',
    data: { clientId, coachId: authz.user.id },
  }).catch(() => undefined)

  return NextResponse.json({
    success: true,
    briefingId: messageRow?.id,
    messageId: messageRow?.id,
    creditDeducted,
  })
}
