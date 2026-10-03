import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { generateClinicalSoapNotes, SoapNotesMode } from '@/lib/ai-soap-notes'

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

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { rawNotes, mode = 'clinical_soap', clientName: bodyClientName } = body

  if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
    return NextResponse.json({ error: 'Raw notes content is required.' }, { status: 400 })
  }

  const admin = supabaseAdmin()
  const { data: targetSession, error: sessionErr } = await admin
    .from('sessions')
    .select('id, client_id, scheduled_at, status, clients(full_name)')
    .eq('id', id)
    .maybeSingle()

  if (sessionErr || !targetSession) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  }

  try {
    await requireCoachAssignedClient(coachId, targetSession.client_id)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  const rawClient = (targetSession as unknown as { clients?: { full_name?: string; name?: string } | null })?.clients
  let clientName = bodyClientName || rawClient?.full_name || rawClient?.name
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
      rawNotes,
      clientName,
      sessionDate,
      mode: mode as SoapNotesMode,
    })

    return NextResponse.json({
      ok: true,
      data: soapResult,
    })
  } catch (err: unknown) {
    const errObj = err as { message?: string }
    return NextResponse.json(
      { error: errObj?.message || 'Failed to synthesize clinical SOAP notes.' },
      { status: 500 }
    )
  }
}
