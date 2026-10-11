import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireActiveClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(12)

  if (error) {
    return NextResponse.json({ error: 'Failed to load check-ins' }, { status: 500 })
  }

  return NextResponse.json({ checkins: data ?? [] })
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireActiveClient(authz.client)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json()

  const weekStart = String(body.week_start ?? '').trim()
  if (!weekStart.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return NextResponse.json({ error: 'week_start must be a date string (YYYY-MM-DD)' }, { status: 400 })
  }

  const optionalNumber = (value: unknown) => value == null || value === '' ? null : Number(value)
  const sleepQuality = optionalNumber(body.sleep_quality)
  const stressLevel = optionalNumber(body.stress_level)
  const sorenessLevel = optionalNumber(body.soreness_level)
  const energyLevel = optionalNumber(body.energy_level)
  const weightKg = optionalNumber(body.weight_kg)
  const waistCm = optionalNumber(body.waist_cm)
  const hipCm = optionalNumber(body.hip_cm)
  const neckCm = optionalNumber(body.neck_cm)
  const notes = body.notes == null ? null : String(body.notes).trim() || null

  if ([sleepQuality, stressLevel, sorenessLevel, energyLevel].some(value =>
    value !== null && (!Number.isInteger(value) || value < 1 || value > 5)
  )) {
    return NextResponse.json({ error: 'Ratings must be whole numbers from 1 to 5, or left blank' }, { status: 400 })
  }
  if ([weightKg, waistCm, hipCm, neckCm].some(value => value !== null && (!Number.isFinite(value) || value <= 0))) {
    return NextResponse.json({ error: 'Measurements must be positive numbers, or left blank' }, { status: 400 })
  }

  const payload = {
    user_id: userId,
    week_start: weekStart,
    sleep_quality: sleepQuality,
    stress_level: stressLevel,
    soreness_level: sorenessLevel,
    energy_level: energyLevel,
    weight_kg: weightKg,
    waist_cm: waistCm,
    hip_cm: hipCm,
    neck_cm: neckCm,
    notes,
    updated_at: new Date().toISOString(),
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('weekly_checkins')
    .upsert(payload, { onConflict: 'user_id,week_start' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  return NextResponse.json(data)
}
