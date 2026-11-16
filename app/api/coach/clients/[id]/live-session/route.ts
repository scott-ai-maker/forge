import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function isValidIsoCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  )
}

function sanitizeText(raw: string, maxLen: number): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .trim()
    .slice(0, maxLen)
}

function parseOptionalBoundedNumber(
  val: unknown,
  min: number,
  max: number,
  requireInteger = false
): { ok: true; value: number | null } | { ok: false } {
  if (val === undefined || val === null || val === '') {
    return { ok: true, value: null }
  }
  const num = typeof val === 'number' ? val : Number(val)
  if (!Number.isFinite(num) || num < min || num > max) {
    return { ok: false }
  }
  if (requireInteger && !Number.isInteger(num)) {
    return { ok: false }
  }
  return { ok: true, value: num }
}

// POST - log a set on behalf of a client during a live session
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

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `live-session-set:${coachId}`,
    limit: 120,
    windowSeconds: 60,
    route: '/api/coach/clients/[id]/live-session',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many live set log requests. Please slow down.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

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

  const exerciseName = sanitizeText(String(body.exercise_name ?? ''), 160)
  if (!exerciseName) {
    return NextResponse.json({ error: 'exercise_name is required' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const reps = Number(body.reps)
  if (!Number.isFinite(reps) || !Number.isInteger(reps) || reps < 1 || reps > 1000) {
    return NextResponse.json({ error: 'reps must be a positive integer (1–1000)' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const sessionDate = String(body.session_date ?? new Date().toISOString().slice(0, 10)).trim()
  if (!isValidIsoCalendarDate(sessionDate)) {
    return NextResponse.json({ error: 'session_date must be YYYY-MM-DD' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const setNumParsed = parseOptionalBoundedNumber(body.set_number, 1, 50, true)
  if (!setNumParsed.ok) {
    return NextResponse.json({ error: 'set_number must be an integer between 1 and 50' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const weightParsed = parseOptionalBoundedNumber(body.weight_kg, 0, 1000, false)
  if (!weightParsed.ok) {
    return NextResponse.json({ error: 'weight_kg must be between 0 and 1000' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const restParsed = parseOptionalBoundedNumber(body.rest_seconds, 0, 3600, true)
  if (!restParsed.ok) {
    return NextResponse.json({ error: 'rest_seconds must be an integer between 0 and 3600' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const rpeParsed = parseOptionalBoundedNumber(body.rpe, 1, 10, false)
  if (!rpeParsed.ok) {
    return NextResponse.json({ error: 'rpe must be between 1 and 10' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const rirParsed = parseOptionalBoundedNumber(body.rir, 0, 10, false)
  if (!rirParsed.ok) {
    return NextResponse.json({ error: 'rir must be between 0 and 10' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const cleanNotes =
    body.notes !== undefined && body.notes !== null
      ? sanitizeText(String(body.notes), 1000) || null
      : null

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('workout_set_logs')
    .insert({
      user_id: clientId,
      session_date: sessionDate,
      exercise_name: exerciseName,
      set_number: setNumParsed.value,
      reps,
      weight_kg: weightParsed.value,
      rest_seconds: restParsed.value,
      rpe: rpeParsed.value,
      rir: rirParsed.value,
      is_warmup: Boolean(body.is_warmup),
      notes: cleanNotes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to log set' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json(data, { status: 201, headers: NO_STORE_HEADERS })
}

// GET - fetch recent set logs for a client (for live session display)
export async function GET(
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

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const admin = supabaseAdmin()

  // Get today's set logs for this client
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await admin
    .from('workout_set_logs')
    .select('*')
    .eq('user_id', clientId)
    .eq('session_date', today)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load sets' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  // Also get the client's active workout plan
  const { data: plan } = await admin
    .from('workout_plans')
    .select('id, name, plan_json')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ sets: data ?? [], plan }, { headers: NO_STORE_HEADERS })
}
