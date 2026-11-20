import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  DISPENSARY_PARTNER_CONFIG,
  evaluateIntakePhysicianConsultFlag,
  FDA_DSHEA_DISCLAIMER,
  FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
  getThorneGoalCollection,
  MA_SAFE_HARBOR_SCOPE_NOTICE,
  normalizeSupplementGoal,
  WADA_NSF_SPORT_NOTICE,
} from '@/lib/supplement-prescriptions'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
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
  const [{ data: profile }, { data: intake }] = await Promise.all([
    admin
      .from('fitness_profiles')
      .select('fitness_goal')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('client_intake_forms')
      .select('parq_any_yes, parq_answers, medications, medical_conditions, allergies')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const requestedGoal = req.nextUrl.searchParams.get('goal')
  const goal = normalizeSupplementGoal(requestedGoal || profile?.fitness_goal)
  const collection = getThorneGoalCollection(goal, intake)
  const physicianConsultAlert = evaluateIntakePhysicianConsultFlag(intake)

  return NextResponse.json(
    {
      ok: true,
      supplementEngineDisabled: true,
      goal,
      collection,
      physicianConsultAlert,
      dispensaryInfo: DISPENSARY_PARTNER_CONFIG,
      disclosures: {
        ftcAffiliate: FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
        fdaDshea: FDA_DSHEA_DISCLAIMER,
        scopeOfPractice: MA_SAFE_HARBOR_SCOPE_NOTICE,
        wadaNsfSport: WADA_NSF_SPORT_NOTICE,
      },
    },
    { headers: NO_STORE_HEADERS }
  )
}

export async function POST(req: NextRequest) {
  try {
    await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json(
    {
      error:
        'Individualized supplement dosing and adherence tracking are disabled. Browse optional goal-based Thorne storefront collections instead.',
      supplementEngineDisabled: true,
    },
    { status: 410, headers: NO_STORE_HEADERS }
  )
}
