import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function sanitizeNotes(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .slice(0, 8000)
}

function parseOptionalIsoTimestamp(val: unknown): { ok: true; value: string | null } | { ok: false } {
  if (val === null) return { ok: true, value: null }
  if (typeof val !== 'string' || !val.trim()) return { ok: false }
  const ts = Date.parse(val)
  if (Number.isNaN(ts)) return { ok: false }
  return { ok: true, value: new Date(ts).toISOString() }
}

export async function PATCH(
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

  const admin = supabaseAdmin()

  const { id } = await params
  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const patch: { status?: string; notes?: string | null; checked_in_at?: string | null; checked_out_at?: string | null } = {}

  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show']
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    patch.status = body.status
  }

  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') {
      return NextResponse.json({ error: 'Invalid notes value' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    patch.notes = body.notes === null ? null : sanitizeNotes(body.notes)
  }

  if (body.checked_in_at !== undefined) {
    const parsedIn = parseOptionalIsoTimestamp(body.checked_in_at)
    if (!parsedIn.ok) {
      return NextResponse.json({ error: 'Invalid checked_in_at timestamp' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    patch.checked_in_at = parsedIn.value
  }

  if (body.checked_out_at !== undefined) {
    const parsedOut = parseOptionalIsoTimestamp(body.checked_out_at)
    if (!parsedOut.ok) {
      return NextResponse.json({ error: 'Invalid checked_out_at timestamp' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    patch.checked_out_at = parsedOut.value
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const { data: targetSession } = await admin
    .from('sessions')
    .select('id, client_id, status, package_id')
    .eq('id', id)
    .maybeSingle()

  if (!targetSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404, headers: NO_STORE_HEADERS })
  }

  try {
    await requireCoachAssignedClient(coachId, targetSession.client_id)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  // Pre-verify package credit availability BEFORE restoring a cancelled session to active
  let precheckedRestorePkg: { sessions_remaining?: number | null } | null = null
  if (
    patch.status &&
    targetSession.status === 'cancelled' &&
    (patch.status === 'scheduled' || patch.status === 'completed') &&
    targetSession.package_id
  ) {
    const { data: pkg } = await admin
      .from('client_packages')
      .select('sessions_remaining')
      .eq('id', targetSession.package_id)
      .maybeSingle()

    precheckedRestorePkg = pkg
    if (pkg && typeof pkg.sessions_remaining === 'number' && pkg.sessions_remaining <= 0) {
      return NextResponse.json(
        { error: 'No sessions remaining in this package' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
  }

  const { data, error } = await admin
    .from('sessions')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  // Handle session credit bookkeeping on status transitions:
  // Note: book_client_session already decrements sessions_remaining when a session is scheduled.
  if (patch.status && patch.status !== targetSession.status) {
    const pkgId = targetSession.package_id
    if (pkgId) {
      // 1. If cancelling a non-cancelled session, refund 1 credit back to client_packages
      if (patch.status === 'cancelled' && targetSession.status !== 'cancelled') {
        const { data: pkg } = await admin
          .from('client_packages')
          .select('sessions_remaining, sessions_total')
          .eq('id', pkgId)
          .maybeSingle()

        if (pkg && typeof pkg.sessions_remaining === 'number') {
          const maxLimit = typeof pkg.sessions_total === 'number' ? pkg.sessions_total : pkg.sessions_remaining + 1
          const newRemaining = Math.min(pkg.sessions_remaining + 1, maxLimit)
          await admin
            .from('client_packages')
            .update({ sessions_remaining: newRemaining })
            .eq('id', pkgId)
        }
      }
      // 2. If restoring a cancelled session back to scheduled or completed, re-deduct 1 credit
      else if (targetSession.status === 'cancelled' && (patch.status === 'scheduled' || patch.status === 'completed')) {
        const pkg = precheckedRestorePkg
        if (pkg && typeof pkg.sessions_remaining === 'number' && pkg.sessions_remaining > 0) {
          await admin
            .from('client_packages')
            .update({ sessions_remaining: pkg.sessions_remaining - 1 })
            .eq('id', pkgId)
        }
      }
    }
  }

  return NextResponse.json(data, { headers: NO_STORE_HEADERS })
}
