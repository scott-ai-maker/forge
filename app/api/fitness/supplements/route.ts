import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit } from '@/lib/rate-limit'
import {
  generateSupplementStack,
  normalizeSupplementGoal,
  normalizeClientSex,
  normalizeFitnessLevel,
  VALID_TIMING_WINDOWS,
  TimingWindow,
} from '@/lib/supplement-prescriptions'
import { parseParqMedicationsAndConditions } from '@/lib/muscle-recovery-telemetry'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/

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
  const [{ data: profile }, { data: intake }] = await Promise.all([
    admin
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('client_intake_forms')
      .select('parq_answers, medications, medical_conditions')
      .eq('client_id', userId)
      .maybeSingle(),
  ])

  const parsedMeds = parseParqMedicationsAndConditions(
    (intake?.parq_answers as Record<string, unknown> | null) ?? null,
    typeof intake?.medications === 'string' ? intake.medications : null,
    typeof intake?.medical_conditions === 'string' ? intake.medical_conditions : null
  )

  const rawAge = Number(profile?.age)
  const safeAge = Number.isFinite(rawAge) && rawAge >= 18 && rawAge <= 100 ? Math.round(rawAge) : 35

  const stack = generateSupplementStack({
    goal: normalizeSupplementGoal(profile?.primary_goal ?? profile?.fitness_goal),
    age: safeAge,
    sex: normalizeClientSex(profile?.sex),
    fitnessLevel: normalizeFitnessLevel(profile?.training_experience ?? profile?.fitness_level),
    healthConditions: parsedMeds,
  })

  return NextResponse.json(
    {
      ok: true,
      stack,
    },
    { headers: NO_STORE_HEADERS }
  )
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `fitness-supplements-adherence:${userId}`,
    limit: 60,
    windowSeconds: 60,
    route: '/api/fitness/supplements',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many adherence log requests. Please slow down.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Invalid JSON payload.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: 'Malformed JSON body.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const timingWindow = body.timingWindow
  if (
    typeof timingWindow !== 'string' ||
    !(VALID_TIMING_WINDOWS as readonly string[]).includes(timingWindow)
  ) {
    return NextResponse.json(
      { error: 'Invalid or missing timingWindow.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const rawDate =
    typeof body.date === 'string' && body.date.trim()
      ? body.date.trim()
      : new Date().toISOString().slice(0, 10)
  if (!ISO_DATE_RE.test(rawDate)) {
    return NextResponse.json(
      { error: 'Invalid date format (expected YYYY-MM-DD).' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const itemId = body.itemId
  if (itemId !== undefined && (typeof itemId !== 'string' || !SAFE_ID_RE.test(itemId))) {
    return NextResponse.json(
      { error: 'Invalid supplement itemId.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const completed = body.completed === undefined ? true : Boolean(body.completed)

  return NextResponse.json(
    {
      ok: true,
      timingWindow: timingWindow as TimingWindow,
      itemId: itemId ?? null,
      date: rawDate,
      completed,
      loggedAt: new Date().toISOString(),
    },
    { headers: NO_STORE_HEADERS }
  )
}
