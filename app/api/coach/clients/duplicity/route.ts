import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { validateClientUniqueness } from '@/lib/client-lifecycle'
import { checkSlidingWindowRateLimit, resolveRequestSubjectKey } from '@/src/lib/security/rateLimiter'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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

  // Rate-limit anti-duplicity lookups to block global member email/phone enumeration (#38)
  const rateCheck = checkSlidingWindowRateLimit({
    namespace: 'coach_client_duplicity',
    subjectKey: resolveRequestSubjectKey(req, coachId),
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
  })
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many uniqueness checks. Please wait before retrying.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
      }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { email, phone, excludeClientId } = body ?? {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  try {
    const uniqueness = await validateClientUniqueness(admin, email.trim(), phone, excludeClientId)

    // Cross-coach minimum-necessary isolation (#38): never leak PII of clients assigned to another coach
    if (
      !uniqueness.isUnique &&
      uniqueness.existingClient &&
      uniqueness.existingClient.designated_coach_id &&
      uniqueness.existingClient.designated_coach_id !== coachId
    ) {
      return NextResponse.json({
        isUnique: false,
        duplicateField: uniqueness.duplicateField,
        assignedToAnotherCoach: true,
      })
    }

    return NextResponse.json(uniqueness)
  } catch (err: unknown) {
    const errObj = err as { message?: string }
    return NextResponse.json({ error: errObj?.message || 'Validation failed' }, { status: 500 })
  }
}
