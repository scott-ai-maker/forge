import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectCSRF } from '@/lib/csrf'
import type { ClientStatus } from '@/lib/client-lifecycle'

export type AppRole = 'client' | 'coach'

export interface ClientRecord {
  id: string
  role: AppRole
  email: string | null
  status: ClientStatus
  designated_coach_id: string | null
}

export class AuthzError extends Error {
  status: number

  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

function normalizeRole(role: string | null | undefined): AppRole | null {
  if (role === 'client' || role === 'coach') return role
  return null
}

function getBearerToken(request?: NextRequest): string | null {
  if (!request) return null

  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!header) return null

  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer') return null

  const normalized = String(token ?? '').trim()
  return normalized.length > 0 ? normalized : null
}

function unauthorizedRedirect(expectedRole: AppRole, actualRole: AppRole | null): string {
  if (expectedRole === 'client') {
    return actualRole === 'coach' ? '/coach' : '/auth/login'
  }

  return actualRole === 'client' ? '/dashboard' : '/auth/login'
}

export async function requireSurfaceRole(
  expectedRole: AppRole,
  options?: { allowCoach?: boolean }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const client = await ensureClientRecord(user)
  const role = normalizeRole(client.role)

  if (role !== expectedRole) {
    if (options?.allowCoach && role === 'coach') {
      return { supabase, user, role, client }
    }
    redirect(unauthorizedRedirect(expectedRole, role))
  }

  return { supabase, user, role, client }
}

async function ensureClientRecord(user: User): Promise<ClientRecord> {
  const admin = supabaseAdmin()
  const metadataSurfaceRole = normalizeRole((user.user_metadata?.surface_role as string | undefined) ?? null)
  const isMasterCoach = (user.email ?? '').toLowerCase() === 'scott.gordon72@outlook.com'

  // Defensively fetch existing client without strict column fail
  const { data: existing, error: existingError } = await admin
    .from('clients')
    .select('id, role, email, designated_coach_id, status')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    const dbRole = normalizeRole(existing.role)
    const resolvedRole: AppRole = (isMasterCoach || dbRole === 'coach') ? 'coach' : 'client'
    const resolvedStatus: ClientStatus = (existing.status as ClientStatus) || 'active'

    // If master coach is set to client in DB, self-heal to coach
    if (isMasterCoach && dbRole !== 'coach') {
      await admin.from('clients').update({ role: 'coach' }).eq('id', user.id)
    }

    // Synchronize metadata from DB role (DB is authoritative).
    if (metadataSurfaceRole !== resolvedRole) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata ?? {}),
          surface_role: resolvedRole,
        },
      })
    }

    return {
      id: existing.id,
      role: resolvedRole,
      email: existing.email,
      status: resolvedStatus,
      designated_coach_id: existing.designated_coach_id,
    }
  }

  const displayName = (user.user_metadata?.full_name || user.user_metadata?.name || '').toString().trim() || null
  const initialRole: AppRole = isMasterCoach ? 'coach' : 'client'

  const { data: inserted, error } = await admin
    .from('clients')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: displayName,
        role: initialRole,
      },
      { onConflict: 'id' }
    )
    .select('id, role, email, designated_coach_id, status')
    .single()

  if (error || !inserted) {
    console.error('ensureClientRecord error:', error || existingError)
    throw new AuthzError('Failed to initialize client profile', 500)
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      surface_role: initialRole,
    },
  })

  return {
    id: inserted.id,
    role: (inserted.role === 'coach' ? 'coach' : 'client') as AppRole,
    email: inserted.email,
    status: (inserted.status as ClientStatus) || 'active',
    designated_coach_id: inserted.designated_coach_id,
  }
}

export async function getRequestAuthz(request?: NextRequest) {
  const bearerToken = getBearerToken(request)

  if (request) {
    // Native mobile clients authenticate via bearer token and are not cookie-based,
    // so CSRF checks are only required for browser session requests.
    if (!bearerToken) {
      const csrf = await protectCSRF(request)
      if (!csrf.valid) {
        throw new AuthzError('CSRF token validation failed', 403)
      }
    }
  }

  let user: User | null = null

  if (bearerToken) {
    const admin = supabaseAdmin()
    const { data, error } = await admin.auth.getUser(bearerToken)

    if (error) {
      throw new AuthzError('Unauthorized', 401)
    }

    user = data.user
  } else {
    const supabase = await createClient()
    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser()
    user = cookieUser
  }

  if (!user) {
    throw new AuthzError('Unauthorized', 401)
  }

  const client = await ensureClientRecord(user)

  return { user, client }
}

export function requireRole(clientRole: AppRole, allowed: AppRole[]) {
  if (!allowed.includes(clientRole)) {
    throw new AuthzError('Forbidden', 403)
  }
}

export function requireActiveClient(client: ClientRecord) {
  if (client.role === 'client' && client.status && client.status !== 'active') {
    const statusLabel = client.status === 'paused' ? 'on temporary hold' : client.status
    throw new AuthzError(
      `Your membership is currently ${statusLabel}. Please contact Coach Gordon to reactivate training features.`,
      403
    )
  }
}

export async function requireCoachAssignedClient(coachId: string, clientId: string) {
  const { data } = await supabaseAdmin()
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('designated_coach_id', coachId)
    .maybeSingle()

  if (!data) {
    throw new AuthzError('Client is not assigned to this coach', 403)
  }
}
