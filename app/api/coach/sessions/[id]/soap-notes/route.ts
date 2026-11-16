import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { generateClinicalSoapNotes, SoapNotesMode } from '@/lib/ai-soap-notes'
import { enforceRateLimit } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }
const MAX_RAW_NOTES_CHARS = 12_000
const ALLOWED_MODES = new Set<SoapNotesMode>(['clinical_soap', 'executive_summary', 'action_directives'])

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

  const rl = await enforceRateLimit({
    key: `soap-notes:${coachId}`,
    limit: 20,
    windowSeconds: 300,
    route: '/api/coach/sessions/[id]/soap-notes',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many SOAP synthesis requests. Please wait a moment and try again.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { rawNotes, mode = 'clinical_soap', clientName: bodyClientName } = body

  if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
    return NextResponse.json(
      { error: 'Raw notes content is required.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (rawNotes.length > MAX_RAW_NOTES_CHARS) {
    return NextResponse.json(
      { error: `Raw notes exceed maximum length (${MAX_RAW_NOTES_CHARS} characters).` },
      { status: 413, headers: NO_STORE_HEADERS }
    )
  }

  if (typeof mode !== 'string' || !ALLOWED_MODES.has(mode as SoapNotesMode)) {
    return NextResponse.json(
      { error: 'Invalid SOAP synthesis mode.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const sanitizedRawNotes = rawNotes
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()

  const admin = supabaseAdmin()
  const { data: targetSession, error: sessionErr } = await admin
    .from('sessions')
    .select('id, client_id, scheduled_at, status, clients(full_name)')
    .eq('id', id)
    .maybeSingle()

  if (sessionErr || !targetSession) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404, headers: NO_STORE_HEADERS })
  }

  try {
    await requireCoachAssignedClient(coachId, targetSession.client_id)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json(
      { error: 'Not authorized for this athlete.' },
      { status, headers: NO_STORE_HEADERS }
    )
  }

  const rawClient = (targetSession as unknown as { clients?: { full_name?: string; name?: string } | null })?.clients
  const cleanBodyClientName =
    typeof bodyClientName === 'string'
      ? bodyClientName.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 120)
      : ''
  let clientName = cleanBodyClientName || rawClient?.full_name || rawClient?.name
  if (!clientName && targetSession.client_id) {
    const { data: clientData } = await admin
      .from('clients')
      .select('full_name')
      .eq('id', targetSession.client_id)
      .maybeSingle()
    clientName = clientData?.full_name || 'Athlete'
  }
  if (!clientName) clientName = 'Athlete'

  const sessionDate = targetSession.scheduled_at
    ? new Date(targetSession.scheduled_at).toLocaleDateString()
    : new Date().toLocaleDateString()

  try {
    const soapResult = await generateClinicalSoapNotes({
      rawNotes: sanitizedRawNotes,
      clientName,
      sessionDate,
      mode: mode as SoapNotesMode,
    })

    return NextResponse.json(
      {
        ok: true,
        data: soapResult,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (err: unknown) {
    const errObj = err as { message?: string }
    return NextResponse.json(
      { error: errObj?.message || 'Failed to synthesize clinical SOAP notes.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
