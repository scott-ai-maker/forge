import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { parseParqAnswers } from '@/lib/coach-onboarding-progression'
import { evaluateMedicalParq } from '@/lib/liability-shield'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    const coachId = authz.user.id
    const { id: clientId } = await params

    await requireCoachAssignedClient(coachId, clientId)
    const admin = supabaseAdmin()

    const [{ data: client }, { data: intake }] = await Promise.all([
      admin
        .from('clients')
        .select('id, full_name, email, phone')
        .eq('id', clientId)
        .maybeSingle(),
      admin
        .from('client_intake_forms')
        .select('parq_answers, medical_conditions, emergency_contact_name, emergency_contact_phone, consent_signature_name, consent_signed_at')
        .eq('user_id', clientId)
        .maybeSingle(),
    ])

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const parqAnswers = parseParqAnswers(intake?.parq_answers, intake)
    const evaluation = evaluateMedicalParq(parqAnswers)

    return NextResponse.json({
      clientId,
      athleteName: client.full_name || 'Athlete',
      athleteEmail: client.email || null,
      athletePhone: client.phone || null,
      emergencyContactName: intake?.emergency_contact_name || null,
      emergencyContactPhone: intake?.emergency_contact_phone || null,
      medicalConditions: intake?.medical_conditions || null,
      riskTier: evaluation.riskTier,
      clearanceStatus: evaluation.clearanceStatus,
      erap: evaluation.erapRecord,
      virtualTelehealthDisclaimer: evaluation.virtualTelehealthDisclaimer,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
