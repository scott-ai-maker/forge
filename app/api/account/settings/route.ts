import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

const PHONE_REGEX = /^[0-9+()\-\s.]{7,24}$/

type SettingsPayload = {
  fullName?: unknown
  phone?: unknown
  preferredUnits?: unknown
  sex?: unknown
}

function resolveRoleFromSources({
  dbRole,
}: {
  dbRole: unknown
}): AppRole {
  if (dbRole === 'coach') return 'coach'
  return 'client'
}

type AppRole = 'client' | 'coach'

function normalizeFullName(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length < 2 || trimmed.length > 100) return null
  return trimmed
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!PHONE_REGEX.test(trimmed)) return null
  return trimmed
}

function normalizePreferredUnits(value: unknown): 'imperial' | 'metric' | null {
  if (value === 'imperial' || value === 'metric') return value
  return null
}

function normalizeSex(value: unknown): 'male' | 'female' | 'other' | null {
  if (value === 'male' || value === 'female' || value === 'other') return value
  return null
}

function getAuthzErrorResponse(error: unknown) {
  const status = error instanceof AuthzError ? error.status : 500
  const message = error instanceof Error ? error.message : 'Unauthorized'
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: NextRequest) {
  let userId = ''

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    return getAuthzErrorResponse(error)
  }

  const admin = supabaseAdmin()
  const [{ data, error }, { data: fitnessProfile }] = await Promise.all([
    admin
      .from('clients')
      .select('email, full_name, phone, role')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('fitness_profiles')
      .select('preferred_units, sex')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    profile: {
      email: data?.email ?? '',
      fullName: data?.full_name ?? '',
      phone: data?.phone ?? '',
      role: resolveRoleFromSources({ dbRole: data?.role }),
      preferredUnits: fitnessProfile?.preferred_units === 'metric' ? 'metric' : 'imperial',
      sex: (fitnessProfile?.sex === 'female' ? 'female' : 'male') as 'male' | 'female',
    },
  })
}

export async function PATCH(req: NextRequest) {
  let userId = ''
  let currentMetadata: Record<string, unknown> = {}

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
    currentMetadata = (authz.user.user_metadata ?? {}) as Record<string, unknown>
  } catch (error) {
    return getAuthzErrorResponse(error)
  }

  const body = await req.json().catch(() => null)
  const payload = (body ?? {}) as SettingsPayload

  const fullName = normalizeFullName(payload.fullName)
  if (fullName === null) {
    return NextResponse.json(
      { error: 'Please enter a valid full name (2-100 characters).' },
      { status: 400 }
    )
  }

  const phone = normalizePhone(payload.phone)
  if (phone === null) {
    return NextResponse.json(
      { error: 'Please enter a valid phone number or leave it blank.' },
      { status: 400 }
    )
  }

  const preferredUnits = normalizePreferredUnits(payload.preferredUnits)
  const sex = normalizeSex(payload.sex)

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('clients')
    .update({
      full_name: fullName,
      phone: phone || null,
    })
    .eq('id', userId)
    .select('email, full_name, phone, role')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Unable to update settings.' },
      { status: 500 }
    )
  }

  const fitnessUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (preferredUnits) fitnessUpdates.preferred_units = preferredUnits
  if (sex) fitnessUpdates.sex = sex

  if (Object.keys(fitnessUpdates).length > 1) {
    await admin
      .from('fitness_profiles')
      .update(fitnessUpdates)
      .eq('user_id', userId)
  }

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...currentMetadata,
      full_name: fullName,
      name: fullName,
    },
  })

  return NextResponse.json({
    profile: {
      email: data.email ?? '',
      fullName: data.full_name ?? '',
      phone: data.phone ?? '',
      role: resolveRoleFromSources({ dbRole: data.role }),
      preferredUnits: preferredUnits || 'imperial',
      sex: (sex === 'female' ? 'female' : 'male') as 'male' | 'female',
    },
  })
}
