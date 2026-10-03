import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { generateMasterNasmOptProgram, type GeminiCoachGenerationRequest } from '@/lib/gemini-nasm-master-coach'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach', 'client'])
  } catch (error) {
    const isDevPreview = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW === 'true'
    if (!isDevPreview) {
      const status = error instanceof AuthzError ? error.status : 401
      const message = error instanceof Error ? error.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status })
    }
  }

  try {
    const body = await req.json().catch(() => ({}))
    const requestPayload: GeminiCoachGenerationRequest = {
      clientName: body.clientName,
      clientAge: typeof body.clientAge === 'number' ? body.clientAge : undefined,
      clientSex: body.clientSex,
      goal: body.goal || 'fat_loss',
      targetNasmPhase: typeof body.targetNasmPhase === 'number' ? body.targetNasmPhase : undefined,
      trainingDaysPerWeek: typeof body.trainingDaysPerWeek === 'number' ? body.trainingDaysPerWeek : 4,
      experienceLevel: body.experienceLevel || 'intermediate',
      equipmentAccess: Array.isArray(body.equipmentAccess) ? body.equipmentAccess : undefined,
      knownBenchmarks: body.knownBenchmarks,
      kineticCompensations: Array.isArray(body.kineticCompensations) ? body.kineticCompensations : undefined,
      cardioBlendStyle: body.cardioBlendStyle || 'integrated_finishers',
      coachGuidanceNotes: body.coachGuidanceNotes,
      contraindicationTags: Array.isArray(body.contraindicationTags) ? body.contraindicationTags : undefined,
      injuriesLimitations: typeof body.injuriesLimitations === 'string' ? body.injuriesLimitations : undefined,
    }

    const plan = await generateMasterNasmOptProgram(requestPayload)

    return NextResponse.json({
      success: true,
      coachIdentity: 'Coach Gordon · Master NASM Head Coach & Periodization Architect (20+ Yrs Exp)',
      plan,
    })
  } catch (error) {
    console.error('Master NASM AI Coach Architect generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate program with Master NASM Coach' },
      { status: 500 }
    )
  }
}

