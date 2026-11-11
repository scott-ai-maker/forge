import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  buildRagHomeGymBlueprint,
  mapProfileGoalToHomeGymGoal,
  type HomeGymBuilderNeedsInput,
} from '@/lib/rag-home-gym-builder'

export async function GET(req: NextRequest) {
  let userId = ''
  let athleteName = 'Athlete'
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
    athleteName = authz.client.full_name || 'Athlete'
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const [{ data: profile }, { data: assessment }, { data: plan }] = await Promise.all([
    admin.from('fitness_profiles').select('*').eq('user_id', userId).maybeSingle(),
    admin
      .from('nasm_assessments')
      .select('*')
      .eq('client_id', userId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('workout_plans')
      .select('nasm_opt_phase')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const blueprint = buildRagHomeGymBlueprint({
    athleteName,
    primaryGoal: mapProfileGoalToHomeGymGoal(profile?.primary_goal ?? profile?.goal ?? null),
    assessment: assessment ?? null,
    ownedEquipment: profile?.equipment_access ?? null,
    optPhase: plan?.nasm_opt_phase ?? null,
    injuriesLimitations: profile?.injuries_limitations ?? null,
  })

  return NextResponse.json({
    ok: true,
    blueprint,
  })
}

export async function POST(req: NextRequest) {
  let userId = ''
  let athleteName = 'Athlete'
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
    athleteName = authz.client.full_name || 'Athlete'
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = (await req.json().catch(() => ({}))) as Partial<HomeGymBuilderNeedsInput>
  const admin = supabaseAdmin()
  const [{ data: profile }, { data: assessment }, { data: plan }] = await Promise.all([
    admin.from('fitness_profiles').select('*').eq('user_id', userId).maybeSingle(),
    admin
      .from('nasm_assessments')
      .select('*')
      .eq('client_id', userId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('workout_plans')
      .select('nasm_opt_phase')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const blueprint = buildRagHomeGymBlueprint({
    athleteName,
    spaceType: body.spaceType,
    ceilingHeight: body.ceilingHeight,
    floorLevel: body.floorLevel,
    budgetTier: body.budgetTier,
    customMaxBudgetUsd: body.customMaxBudgetUsd,
    primaryGoal:
      body.primaryGoal ?? mapProfileGoalToHomeGymGoal(profile?.primary_goal ?? profile?.goal ?? null),
    householdUsers: body.householdUsers,
    preferredModalities: body.preferredModalities,
    concerns: body.concerns,
    assessment: assessment ?? null,
    ownedEquipment: profile?.equipment_access ?? null,
    optPhase: plan?.nasm_opt_phase ?? null,
    injuriesLimitations: profile?.injuries_limitations ?? null,
  })

  return NextResponse.json({
    ok: true,
    blueprint,
  })
}

