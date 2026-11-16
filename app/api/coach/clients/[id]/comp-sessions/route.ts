import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireCoachAssignedClient, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

interface GrantCompSessionBody {
  sessions?: unknown
  note?: unknown
}

type ClientRouteContext = { params: Promise<{ id: string }> }

export async function POST(
  req: NextRequest,
  ctx: ClientRouteContext
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

  const { id: clientId } = await ctx.params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `comp-sessions:${coachId}`,
    limit: 20,
    windowSeconds: 300,
    route: '/api/coach/clients/[id]/comp-sessions',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many comp session grants issued recently. Please retry shortly.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const body = (await req.json().catch(() => ({}))) as GrantCompSessionBody
  const sessions = Number(body.sessions)
  const note =
    typeof body.note === 'string'
      ? body.note
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim()
          .slice(0, 500)
      : ''

  if (!Number.isInteger(sessions) || sessions < 1 || sessions > 50) {
    return NextResponse.json(
      { error: 'sessions must be an integer between 1 and 50' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const admin = supabaseAdmin()

  const { data: packageRow, error: packageError } = await admin
    .from('client_packages')
    .insert({
      client_id: clientId,
      package_name: `Comp Session Credit (${sessions})`,
      sessions_total: sessions,
      sessions_remaining: sessions,
      source: 'comp',
      granted_by_coach_id: coachId,
      grant_note: note || null,
      discount_amount_cents: 0,
    })
    .select('id, client_id, package_name, sessions_total, sessions_remaining, source, granted_by_coach_id, grant_note, purchased_at')
    .single()

  if (packageError || !packageRow) {
    return NextResponse.json(
      { error: 'Failed to create comp session credit' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  const { data: grantRow, error: grantError } = await admin
    .from('comp_session_grants')
    .insert({
      client_id: clientId,
      coach_id: coachId,
      sessions_granted: sessions,
      note: note || null,
      client_package_id: packageRow.id,
    })
    .select('id, client_id, coach_id, sessions_granted, note, created_at')
    .single()

  if (grantError || !grantRow) {
    return NextResponse.json(
      { error: 'Failed to record comp session grant' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      package: packageRow,
      grant: grantRow,
    },
    { headers: NO_STORE_HEADERS }
  )
}
