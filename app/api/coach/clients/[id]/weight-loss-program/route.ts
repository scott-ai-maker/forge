import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { generateMasterNasmOptProgram } from '@/lib/gemini-nasm-master-coach'
import { parseInjuriesFromText } from '@/lib/sports-injuries'
import { enforceRateLimit } from '@/lib/rate-limit'
import {
  buildWeightLossGenerationRequest,
  calculateWeightLossTargets,
  type WeightLossClientStats,
} from '@/lib/weight-loss-program'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

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
    const message = error instanceof AuthzError ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `coach_weight_loss:${coachId}:${clientId}`,
    limit: 15,
    windowSeconds: 300,
    route: '/api/coach/clients/[id]/weight-loss-program',
    dimension: 'user',
  })
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil((new Date(rl.resetAt).getTime() - Date.now()) / 1000))
    return NextResponse.json(
      { error: 'Too many weight-loss program requests. Please wait before retrying.' },
      { status: 429, headers: { ...NO_STORE_HEADERS, 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    if (body.targetNasmPhase !== undefined) {
      const p = Number(body.targetNasmPhase)
      if (!Number.isInteger(p) || p < 1 || p > 5) {
        return NextResponse.json({ error: 'targetNasmPhase must be an integer between 1 and 5.' }, { status: 400, headers: NO_STORE_HEADERS })
      }
    }
    if (body.trainingDaysPerWeek !== undefined) {
      const d = Number(body.trainingDaysPerWeek)
      if (!Number.isInteger(d) || d < 1 || d > 7) {
        return NextResponse.json({ error: 'trainingDaysPerWeek must be an integer between 1 and 7.' }, { status: 400, headers: NO_STORE_HEADERS })
      }
    }

    const admin = supabaseAdmin()

    const { checkClientMedicalClearanceGate } = await import('@/lib/liability-shield')
    const clearanceGate = await checkClientMedicalClearanceGate(admin, clientId)
    if (clearanceGate.blocked) {
      return NextResponse.json(
        { error: clearanceGate.reason, code: 'MEDICAL_CLEARANCE_REQUIRED' },
        { status: 409, headers: NO_STORE_HEADERS }
      )
    }
    if (body.targetNasmPhase !== undefined) {
      body.targetNasmPhase = Math.min(Number(body.targetNasmPhase), clearanceGate.effectiveMaxOptPhase)
    }

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
    const num = (v: unknown) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

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
    const notes = typeof body.coachGuidanceNotes === 'string'
      ? body.coachGuidanceNotes.replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, 1000) || undefined
      : undefined
    const request = buildWeightLossGenerationRequest(stats, targets, notes)
    if (body.targetNasmPhase !== undefined) request.targetNasmPhase = Number(body.targetNasmPhase)
    if (body.trainingDaysPerWeek !== undefined) request.trainingDaysPerWeek = Number(body.trainingDaysPerWeek)

    const plan = await generateMasterNasmOptProgram(request)

    return NextResponse.json(
      {
        success: true,
        coachIdentity: 'Coach Gordon · NASM-CPT® (#1261890687) Head Coach & Periodization Architect',
        plan,
        targets,
        missingStats: targets ? [] : ['weight_kg'],
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('Weight loss program generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate weight loss program.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
