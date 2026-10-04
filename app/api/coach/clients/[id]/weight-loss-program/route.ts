import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { generateMasterNasmOptProgram } from '@/lib/gemini-nasm-master-coach'
import { parseInjuriesFromText } from '@/lib/sports-injuries'
import {
  buildWeightLossGenerationRequest,
  calculateWeightLossTargets,
  type WeightLossClientStats,
} from '@/lib/weight-loss-program'

// Generates (does not save) a weight-loss program from the client's stored stats and goals
// using Coach Gordon AI backed by the NASM RAG library.
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status })
  }

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const admin = supabaseAdmin()

    const [{ data: client }, { data: profile }, { data: intake }, { data: bodyComp }] = await Promise.all([
      admin.from('clients').select('id, full_name').eq('id', clientId).maybeSingle(),
      admin.from('fitness_profiles').select('*').eq('user_id', clientId).maybeSingle(),
      admin.from('client_intake_forms').select('medical_conditions, surgeries_or_injuries').eq('user_id', clientId).maybeSingle(),
      admin
        .from('body_composition_analyses')
        .select('estimated_bodyfat_percent')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const injuries = (profile?.injuries_limitations || intake?.surgeries_or_injuries || intake?.medical_conditions || undefined) as string | undefined
    const num = (v: unknown) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v))

    const stats: WeightLossClientStats = {
      clientName: client?.full_name,
      age: num(profile?.age),
      sex: profile?.sex,
      heightCm: num(profile?.height_cm),
      weightKg: num(profile?.weight_kg),
      targetWeightKg: num(profile?.target_weight_kg),
      bodyFatPercent: num(bodyComp?.estimated_bodyfat_percent),
      targetBodyFatPercent: num(profile?.target_bodyfat_percent),
      activityLevel: profile?.activity_level,
      trainingDaysPerWeek: num(profile?.training_days_per_week),
      experienceLevel: profile?.experience_level,
      equipmentAccess: Array.isArray(profile?.equipment_access) ? profile.equipment_access : null,
      injuriesLimitations: injuries,
      contraindicationTags: parseInjuriesFromText(injuries).selectedInjuryIds,
    }

    const targets = calculateWeightLossTargets(stats)
    const notes = typeof body.coachGuidanceNotes === 'string' ? body.coachGuidanceNotes : undefined
    const request = buildWeightLossGenerationRequest(stats, targets, notes)
    if (typeof body.targetNasmPhase === 'number') request.targetNasmPhase = body.targetNasmPhase
    if (typeof body.trainingDaysPerWeek === 'number') request.trainingDaysPerWeek = body.trainingDaysPerWeek

    const plan = await generateMasterNasmOptProgram(request)

    return NextResponse.json({
      success: true,
      coachIdentity: 'Coach Gordon · Master NASM Head Coach & Periodization Architect',
      plan,
      targets,
      missingStats: targets ? [] : ['weight_kg'],
    })
  } catch (error) {
    console.error('Weight loss program generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate weight loss program' },
      { status: 500 }
    )
  }
}
