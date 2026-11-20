import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { enforceRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function isValidIsoCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }
  const utc = new Date(Date.UTC(year, month - 1, day))
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  )
}

function sanitizeCardioText(raw: unknown, maxLength: number): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength)
}

function parseOptionalFiniteNumber(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null
  const num = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(num) ? num : Number.NaN
}

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('cardio_logs')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Failed to load cardio logs' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json({ logs: data ?? [] }, { headers: NO_STORE_HEADERS })
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    const { requireActiveClient } = await import('@/lib/authz')
    requireActiveClient(authz.client)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const adminGateClient = supabaseAdmin()
  const { checkClientLegalConsentGate } = await import('@/lib/legal-compliance')
  const legalGate = await checkClientLegalConsentGate(adminGateClient, userId, {
    requireTermsOfService: true,
    requireLiabilityWaiver: true,
  })
  if (!legalGate.verified) {
    return NextResponse.json(
      { error: legalGate.reason, code: 'LEGAL_WAIVER_REQUIRED' },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  const { checkClientMedicalClearanceGate } = await import('@/lib/liability-shield')
  const clearanceGate = await checkClientMedicalClearanceGate(adminGateClient, userId)
  if (clearanceGate.blocked) {
    return NextResponse.json(
      { error: clearanceGate.reason, code: 'MEDICAL_CLEARANCE_REQUIRED' },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  const rate = await enforceRateLimit({
    key: `cardio-log:${userId}`,
    limit: 30,
    windowSeconds: 60,
    route: '/api/fitness/cardio',
    dimension: 'user',
  })
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many cardio log requests. Please wait a moment and try again.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  let parsedBody: unknown
  try {
    parsedBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400, headers: NO_STORE_HEADERS })
  }
  const body = parsedBody as Record<string, unknown>

  const sessionDate = String(body.session_date ?? '').trim()
  if (!isValidIsoCalendarDate(sessionDate)) {
    return NextResponse.json({ error: 'session_date must be a valid YYYY-MM-DD calendar date' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const activityType = sanitizeCardioText(body.activity_type, 80)
  if (!activityType) {
    return NextResponse.json({ error: 'activity_type is required' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const durationMins = Number(body.duration_mins)
  if (!Number.isFinite(durationMins) || durationMins < 1 || durationMins > 720) {
    return NextResponse.json({ error: 'duration_mins must be a positive number between 1 and 720' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const perceivedEffort = parseOptionalFiniteNumber(body.perceived_effort)
  if (perceivedEffort !== null && (!Number.isFinite(perceivedEffort) || perceivedEffort < 1 || perceivedEffort > 10)) {
    return NextResponse.json({ error: 'perceived_effort must be 1-10' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const distanceKm = parseOptionalFiniteNumber(body.distance_km)
  if (distanceKm !== null && (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 500)) {
    return NextResponse.json({ error: 'distance_km must be between 0 and 500' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const avgHeartRate = parseOptionalFiniteNumber(body.avg_heart_rate)
  if (avgHeartRate !== null && (!Number.isFinite(avgHeartRate) || avgHeartRate < 30 || avgHeartRate > 250)) {
    return NextResponse.json({ error: 'avg_heart_rate must be between 30 and 250 BPM' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const calories = parseOptionalFiniteNumber(body.calories)
  if (calories !== null && (!Number.isFinite(calories) || calories < 0 || calories > 15000)) {
    return NextResponse.json({ error: 'calories must be between 0 and 15000' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const sanitizedNotes =
    body.notes !== undefined && body.notes !== null
      ? sanitizeCardioText(body.notes, 1000) || null
      : null

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('cardio_logs')
    .insert({
      user_id: userId,
      session_date: sessionDate,
      activity_type: activityType,
      duration_mins: Math.round(durationMins),
      distance_km: distanceKm !== null ? Math.round(distanceKm * 100) / 100 : null,
      avg_heart_rate: avgHeartRate !== null ? Math.round(avgHeartRate) : null,
      calories: calories !== null ? Math.round(calories) : null,
      perceived_effort: perceivedEffort !== null ? Math.round(perceivedEffort) : null,
      notes: sanitizedNotes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to log cardio session' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json(data, { status: 201, headers: NO_STORE_HEADERS })
}
