import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  transitionClientStatus,
  getClientLifecycleAuditTrail,
  ClientLifecycleError,
  type ClientStatus,
} from '@/lib/client-lifecycle'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function getAuthzErrorResponse(error: unknown) {
  if (error instanceof AuthzError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE_HEADERS })
  }
  if (error instanceof ClientLifecycleError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: NO_STORE_HEADERS })
  }
  const message = error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    const coachId = authz.user.id
    const { id: clientId } = await params

    await requireCoachAssignedClient(coachId, clientId)

    const admin = supabaseAdmin()

    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('id, email, full_name, status, status_reason, status_updated_at, status_updated_by')
      .eq('id', clientId)
      .maybeSingle()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404, headers: NO_STORE_HEADERS })
    }

    const auditLogs = await getClientLifecycleAuditTrail(admin, clientId)

    return NextResponse.json(
      {
        status: (client.status || 'active') as ClientStatus,
        status_reason: client.status_reason || null,
        status_updated_at: client.status_updated_at || null,
        auditLogs,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    return getAuthzErrorResponse(error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    const coachId = authz.user.id
    const { id: clientId } = await params

    await requireCoachAssignedClient(coachId, clientId)

    const body = await req.json().catch(() => ({}))
    const { newStatus, reasonCode, reasonNotes, effectiveDate } = body ?? {}

    if (!newStatus || !reasonCode) {
      return NextResponse.json(
        { error: 'newStatus and reasonCode are required' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const admin = supabaseAdmin()

    // Get coach full name snapshot
    const { data: coachData } = await admin
      .from('clients')
      .select('full_name')
      .eq('id', coachId)
      .maybeSingle()

    const coachName = coachData?.full_name || authz.user.email || 'Coach'

    const result = await transitionClientStatus(admin, {
      clientId,
      coachId,
      coachName,
      newStatus,
      reasonCode,
      reasonNotes,
      effectiveDate,
      metadata: {
        ip: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json(result, { headers: NO_STORE_HEADERS })
  } catch (error) {
    return getAuthzErrorResponse(error)
  }
}

