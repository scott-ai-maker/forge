import { NextRequest, NextResponse } from 'next/server'
import {
  getRequestAuthz,
  requireRole,
  requireActiveClient,
  requireCoachAssignedClient,
  AuthzError,
} from '@/lib/authz'
import { generateMasterNasmOptProgram, type GeminiCoachGenerationRequest } from '@/lib/gemini-nasm-master-coach'
import { checkClientLegalConsentGate } from '@/lib/legal-compliance'
import { checkClientMedicalClearanceGate } from '@/lib/liability-shield'
import { enforceRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let callerId = ''
  let callerRole: 'coach' | 'client' = 'client'
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach', 'client'])
    requireActiveClient(authz.client)
    callerId = authz.user.id
    callerRole = authz.client.role === 'coach' ? 'coach' : 'client'
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  if (process.env.NODE_ENV !== 'test') {
    const rl = await enforceRateLimit({
      key: `ai_architect:user:${callerId}`,
      limit: callerRole === 'coach' ? 40 : 8,
      windowSeconds: 600,
      route: '/api/coach/ai-architect',
      dimension: 'user',
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Program generation rate limit reached. Please wait a few minutes.' },
        { status: 429 }
      )
    }
  }

  try {
    const body = await req.json().catch(() => ({}))
    const targetClientId =
      callerRole === 'client'
        ? callerId
        : typeof body.clientId === 'string' && body.clientId.trim()
          ? body.clientId.trim()
          : null

    let serverMaxPhase = 5
    let serverTags: string[] = []

    if (targetClientId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = supabaseAdmin()
      if (callerRole === 'coach') {
        try {
          await requireCoachAssignedClient(callerId, targetClientId)
        } catch (error) {
          const status = error instanceof AuthzError ? error.status : 403
          return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
        }
      } else {
        const legalGate = await checkClientLegalConsentGate(admin, targetClientId, {
          requireTermsOfService: true,
          requireLiabilityWaiver: true,
        })
        if (!legalGate.verified) {
          return NextResponse.json(
            { error: legalGate.reason, code: 'LEGAL_WAIVER_REQUIRED' },
            { status: 403 }
          )
        }
      }

      const clearanceGate = await checkClientMedicalClearanceGate(admin, targetClientId)
      if (clearanceGate.blocked) {
        return NextResponse.json(
          { error: clearanceGate.reason, code: 'MEDICAL_CLEARANCE_REQUIRED' },
          { status: 409 }
        )
      }
      serverMaxPhase = clearanceGate.effectiveMaxOptPhase
      serverTags = clearanceGate.evaluation.contraindicationTags
    }

    const rawRequestedPhase = typeof body.targetNasmPhase === 'number' ? body.targetNasmPhase : undefined
    const clampedPhase =
      rawRequestedPhase !== undefined
        ? Math.max(1, Math.min(serverMaxPhase, rawRequestedPhase))
        : Math.min(2, serverMaxPhase)
    const clientTags = Array.isArray(body.contraindicationTags)
      ? body.contraindicationTags.filter((t: unknown): t is string => typeof t === 'string')
      : []

    const requestPayload: GeminiCoachGenerationRequest = {
      clientName: body.clientName,
      clientAge: typeof body.clientAge === 'number' ? body.clientAge : undefined,
      clientSex: body.clientSex,
      goal: body.goal || 'fat_loss',
      targetNasmPhase: clampedPhase,
      trainingDaysPerWeek: typeof body.trainingDaysPerWeek === 'number' ? body.trainingDaysPerWeek : 4,
      experienceLevel: body.experienceLevel || 'intermediate',
      equipmentAccess: Array.isArray(body.equipmentAccess) ? body.equipmentAccess : undefined,
      knownBenchmarks: body.knownBenchmarks,
      kineticCompensations: Array.isArray(body.kineticCompensations) ? body.kineticCompensations : undefined,
      cardioBlendStyle: body.cardioBlendStyle || 'integrated_finishers',
      coachGuidanceNotes: body.coachGuidanceNotes,
      contraindicationTags: Array.from(new Set([...clientTags, ...serverTags])),
      injuriesLimitations: typeof body.injuriesLimitations === 'string' ? body.injuriesLimitations : undefined,
    }

    const plan = await generateMasterNasmOptProgram(requestPayload)

    return NextResponse.json({
      success: true,
      coachIdentity: 'Coach Gordon · NASM-CPT® (#1261890687) Head Coach & Periodization Architect',
      plan,
      clinicalRationale: plan.clinicalRationale,
    })
  } catch (error) {
    console.error('Forge Athletic AI Coach Architect generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate program with Forge AI Coach' },
      { status: 500 }
    )
  }
}

