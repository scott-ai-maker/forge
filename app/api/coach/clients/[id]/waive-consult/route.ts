import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let coachId = ''
  let authz
  try {
    authz = await getRequestAuthz(req)
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
  const nowIso = new Date().toISOString()

  // Insert a completed waiver session to fast-track Stage 7 onboarding progression
  const { data: newSession, error: sessionErr } = await admin
    .from('sessions')
    .insert({
      client_id: clientId,
      scheduled_at: nowIso,
      duration_mins: 0,
      status: 'completed',
      notes: '1:1 Live consultation waived per client preference (proceeded directly to asynchronous program delivery).',
    })
    .select()
    .single()

  if (sessionErr) {
    return NextResponse.json({ error: sessionErr.message }, { status: 500 })
  }

  // Record concierge audit trail
  try {
    await admin
      .from('coach_client_messages')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        sender_id: coachId,
        message_body: 'ℹ️ **1:1 Live Consultation Waived**: You have chosen asynchronous coaching delivery. Your customized workout programming, AI tempo calibration, and weekly triage check-ins are active.',
      })
  } catch {
    // Non-blocking audit log
  }

  return NextResponse.json({
    success: true,
    sessionId: newSession?.id,
    message: 'Consultation waived. Client fast-tracked to Stage 8 Weekly Triage.',
  })
}
