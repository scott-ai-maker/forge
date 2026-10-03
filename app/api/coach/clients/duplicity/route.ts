import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { validateClientUniqueness } from '@/lib/client-lifecycle'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const { email, phone, excludeClientId } = body ?? {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  try {
    const uniqueness = await validateClientUniqueness(admin, email.trim(), phone, excludeClientId)
    return NextResponse.json(uniqueness)
  } catch (err: unknown) {
    const errObj = err as { message?: string }
    return NextResponse.json({ error: errObj?.message || 'Validation failed' }, { status: 500 })
  }
}

