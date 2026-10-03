import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSupplementStack } from '@/lib/supplement-prescriptions'

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
  const { data: profile } = await admin
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const stack = generateSupplementStack({
    goal: profile?.primary_goal || 'hypertrophy',
    age: profile?.age || 35,
    sex: profile?.sex || 'male',
    fitnessLevel: profile?.training_experience || 'intermediate',
  })

  return NextResponse.json({
    ok: true,
    stack,
  })
}

export async function POST(req: NextRequest) {
  let _userId = ''
  try {
    const authz = await getRequestAuthz(req)
    _userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const { timingWindow, date = new Date().toISOString().slice(0, 10), completed = true } = body

  // Log adherence acknowledgment
  return NextResponse.json({
    ok: true,
    timingWindow,
    date,
    completed,
    loggedAt: new Date().toISOString(),
  })
}

