import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  generateCorrectiveExercisePlan,
  type OhsaObservation,
  type StaticPosturalFinding,
  type SingleLegSquatObservation,
  type PushPullObservation,
  type CardioVitalsAssessment,
} from '@/lib/nasm-assessments'

// GET /api/coach/clients/[id]/assessments - List client's NASM assessments
export async function GET(
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
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('nasm_assessments')
    .select('*')
    .eq('client_id', clientId)
    .order('assessment_date', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Failed to load NASM assessments' }, { status: 500 })
  }

  return NextResponse.json({ assessments: data ?? [] })
}

// POST /api/coach/clients/[id]/assessments - Record a new NASM assessment
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
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))

  const assessmentDate = String(body.assessment_date ?? new Date().toISOString().slice(0, 10)).trim()
  const title = body.title ? String(body.title).trim() : 'NASM Comprehensive Movement Assessment'
  const staticPosture: StaticPosturalFinding[] = Array.isArray(body.static_posture) ? body.static_posture : []
  const ohsaFindings: OhsaObservation[] = Array.isArray(body.ohsa_findings) ? body.ohsa_findings : []
  const singleLegSquat: SingleLegSquatObservation[] = Array.isArray(body.single_leg_squat) ? body.single_leg_squat : []
  const pushPull: PushPullObservation[] = Array.isArray(body.push_pull) ? body.push_pull : []
  const cardioVitals: CardioVitalsAssessment = typeof body.cardio_vitals === 'object' && body.cardio_vitals !== null ? body.cardio_vitals : {}
  const coachSummaryNotes = body.coach_summary_notes ? String(body.coach_summary_notes).trim() : null

  // Auto-generate CEx (Corrective Exercise Continuum) from findings
  const { overactiveMuscles, underactiveMuscles, plan } = generateCorrectiveExercisePlan(ohsaFindings)

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('nasm_assessments')
    .insert({
      client_id: clientId,
      coach_id: coachId,
      assessment_date: assessmentDate,
      title,
      static_posture: staticPosture,
      ohsa_findings: ohsaFindings,
      single_leg_squat: singleLegSquat,
      push_pull: pushPull,
      cardio_vitals: cardioVitals,
      overactive_muscles: overactiveMuscles,
      underactive_muscles: underactiveMuscles,
      prescribed_correctives: plan,
      coach_summary_notes: coachSummaryNotes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to record NASM assessment' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/coach/clients/[id]/assessments - Delete an assessment
export async function DELETE(
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
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status })
  }

  const { searchParams } = new URL(req.url)
  const assessmentId = searchParams.get('assessmentId')

  if (!assessmentId) {
    return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('nasm_assessments')
    .delete()
    .eq('id', assessmentId)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

