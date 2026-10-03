import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireActiveClient, AuthzError } from '@/lib/authz'

function parseScheduledAt(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function statusForBookingError(error: { message?: string | null; code?: string | null; details?: string | null }) {
  const message = error.message ?? ''
  const details = error.details ?? ''

  if (
    error.code === '23505'
    || message.includes('sessions_unique_scheduled_slot_idx')
    || details.includes('sessions_unique_scheduled_slot_idx')
  ) {
    return { status: 409, error: 'This slot is already booked' }
  }

  switch (message) {
    case 'PACKAGE_NOT_FOUND':
      return { status: 404, error: 'Package not found' }
    case 'NO_SESSIONS_REMAINING':
      return { status: 400, error: 'No sessions remaining in this package' }
    case 'SLOT_ALREADY_BOOKED':
      return { status: 409, error: 'This slot is already booked' }
    case 'SLOT_MUST_BE_IN_FUTURE':
      return { status: 400, error: 'scheduledAt must be in the future' }
    case 'CLIENT_ID_REQUIRED':
    case 'PACKAGE_ID_REQUIRED':
    case 'SCHEDULED_AT_REQUIRED':
      return { status: 400, error: 'packageId and scheduledAt are required' }
    default:
      return null
  }
}

export async function POST(req: NextRequest) {
  let callerRole: 'client' | 'coach' = 'client'
  let callerId = ''
  let clientTargetId = ''

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    callerRole = authz.client.role
    callerId = authz.user.id
    if (callerRole === 'client') {
      requireActiveClient(authz.client)
      clientTargetId = authz.user.id
    }
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const { scheduledAt, clientId } = body ?? {}
  let { packageId } = body ?? {}

  if (callerRole === 'coach') {
    if (!clientId && !packageId) {
      return NextResponse.json({ error: 'clientId or packageId is required' }, { status: 400 })
    }
    const { requireCoachAssignedClient } = await import('@/lib/authz')
    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    if (clientId) {
      try {
        await requireCoachAssignedClient(callerId, clientId)
      } catch (error) {
        const status = error instanceof AuthzError ? error.status : 403
        const message = error instanceof Error ? error.message : 'Forbidden'
        return NextResponse.json({ error: message }, { status })
      }
      clientTargetId = clientId
    } else if (packageId) {
      const { data: pkg } = await admin
        .from('client_packages')
        .select('client_id')
        .eq('id', packageId)
        .maybeSingle()
      if (!pkg) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 })
      }
      try {
        await requireCoachAssignedClient(callerId, pkg.client_id)
      } catch (error) {
        const status = error instanceof AuthzError ? error.status : 403
        const message = error instanceof Error ? error.message : 'Forbidden'
        return NextResponse.json({ error: message }, { status })
      }
      clientTargetId = pkg.client_id
    }

    if (!packageId) {
      const { data: availablePkg } = await admin
        .from('client_packages')
        .select('id, sessions_remaining')
        .eq('client_id', clientTargetId)
        .gt('sessions_remaining', 0)
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (availablePkg) {
        packageId = availablePkg.id
      } else {
        const { data: compPkg, error: compErr } = await admin
          .from('client_packages')
          .insert({
            client_id: clientTargetId,
            package_name: 'Coach Scheduled Session Credit',
            sessions_total: 1,
            sessions_remaining: 1,
            source: 'comp',
            granted_by_coach_id: callerId,
            grant_note: 'Auto-granted for coach-scheduled session',
            discount_amount_cents: 0,
          })
          .select('id')
          .single()

        if (compErr || !compPkg) {
          return NextResponse.json({ error: 'Failed to allocate session credit' }, { status: 500 })
        }
        packageId = compPkg.id
      }
    }
  }

  if (!packageId || !scheduledAt) {
    return NextResponse.json({ error: 'packageId and scheduledAt are required' }, { status: 400 })
  }

  const slotStart = parseScheduledAt(scheduledAt)
  if (!slotStart) {
    return NextResponse.json({ error: 'scheduledAt must be a valid ISO datetime' }, { status: 400 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const admin = supabaseAdmin()

  const { data, error } = await admin.rpc('book_client_session', {
    p_client_id: clientTargetId,
    p_package_id: packageId,
    p_scheduled_at: slotStart.toISOString(),
  })

  if (error) {
    const mapped = statusForBookingError(error)
    if (mapped) {
      return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    }

    console.error('Session booking rpc error:', error)
    return NextResponse.json({ error: 'Failed to book session' }, { status: 500 })
  }

  const session = Array.isArray(data) ? data[0] : data
  if (!session) {
    return NextResponse.json({ error: 'Failed to book session' }, { status: 500 })
  }

  return NextResponse.json({ success: true, session })
}
