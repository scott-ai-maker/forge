import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

const VALID_CATEGORIES = ['weight', 'strength', 'cardio', 'body_composition', 'custom'] as const
type GoalCategory = typeof VALID_CATEGORIES[number]

function isValidCategory(v: unknown): v is GoalCategory {
  return VALID_CATEGORIES.includes(v as GoalCategory)
}

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
    .from('client_goals')
    .select('*')
    .eq('user_id', userId)
    .order('is_achieved', { ascending: true })
    .order('target_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 })
  }

  return NextResponse.json({ goals: data ?? [] })
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  const title = typeof b.title === 'string' ? b.title.trim() : ''
  if (!title || title.length > 200) {
    return NextResponse.json({ error: 'title is required (max 200 chars)' }, { status: 400 })
  }

  const category = b.category
  if (!isValidCategory(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    )
  }

  const targetValue =
    b.target_value !== undefined && b.target_value !== '' ? Number(b.target_value) : null
  const baselineValue =
    b.baseline_value !== undefined && b.baseline_value !== '' ? Number(b.baseline_value) : null
  const currentValue =
    b.current_value !== undefined && b.current_value !== '' ? Number(b.current_value) : null
  const targetUnit = typeof b.target_unit === 'string' ? b.target_unit.trim().slice(0, 30) : null

  let targetDate: string | null = null
  if (typeof b.target_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.target_date)) {
    targetDate = b.target_date
  }

  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, 1000) : null

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('client_goals')
    .insert({
      user_id: userId,
      title,
      category,
      target_value: targetValue,
      target_unit: targetUnit,
      baseline_value: baselineValue,
      current_value: currentValue,
      target_date: targetDate,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }

  return NextResponse.json({ goal: data }, { status: 201 })
}
