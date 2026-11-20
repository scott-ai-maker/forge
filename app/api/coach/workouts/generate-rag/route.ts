import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { checkClientMedicalClearanceGate } from '@/lib/liability-shield'
import { generateRagNasmProgram } from '@/lib/rag-nasm-program-generator'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])

    const body = await req.json()
    const {
      clientId,
      clientName,
      clientAge,
      clientSex,
      goal = 'fat_loss',
      targetNasmPhase,
      trainingDaysPerWeek = 4,
      experienceLevel = 'intermediate',
      equipmentAccess,
      cardioEquipmentAccess,
      knownBenchmarks,
      kineticCompensations,
    } = body

    let maxPhase = 5
    if (typeof clientId === 'string' && clientId.trim()) {
      await requireCoachAssignedClient(authz.user.id, clientId.trim())
      const clearanceGate = await checkClientMedicalClearanceGate(supabaseAdmin(), clientId.trim())
      if (clearanceGate.blocked) {
        return NextResponse.json(
          { error: clearanceGate.reason, code: 'MEDICAL_CLEARANCE_REQUIRED' },
          { status: 409 }
        )
      }
      maxPhase = clearanceGate.effectiveMaxOptPhase
    }

    const parsedAge = Number(clientAge) || 35
    if (parsedAge < 18) {
      return NextResponse.json(
        { error: 'Forge Athletic programs are strictly restricted to adults aged 18 and older.' },
        { status: 403 }
      )
    }

    const requestedPhase = targetNasmPhase ? Number(targetNasmPhase) : undefined
    const clampedPhase =
      requestedPhase !== undefined ? Math.max(1, Math.min(maxPhase, requestedPhase)) : undefined

    const program = generateRagNasmProgram({
      clientName,
      clientAge: parsedAge,
      clientSex: clientSex === 'female' ? 'female' : 'male',
      goal,
      targetNasmPhase: clampedPhase,
      trainingDaysPerWeek: Number(trainingDaysPerWeek) || 4,
      experienceLevel,
      equipmentAccess,
      cardioEquipmentAccess,
      knownBenchmarks,
      kineticCompensations,
    })

    return NextResponse.json({
      success: true,
      program,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('RAG Program Generation Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
