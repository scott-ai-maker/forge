import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { generateRagNasmProgram } from '@/lib/rag-nasm-program-generator'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])

    const body = await req.json()
    const {
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

    const program = generateRagNasmProgram({
      clientName,
      clientAge: Number(clientAge) || 35,
      clientSex: clientSex === 'female' ? 'female' : 'male',
      goal,
      targetNasmPhase: targetNasmPhase ? Number(targetNasmPhase) : undefined,
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
