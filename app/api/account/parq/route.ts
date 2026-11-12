import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { evaluateMedicalParq, ParqAnswers } from '@/lib/liability-shield'
import {
  extractRequestIp,
  isValidLegalSignature,
  recordLegalConsentAudit,
} from '@/lib/legal-compliance'

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const { data: intake, error } = await admin
    .from('client_intake_forms')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const parqAnswers: ParqAnswers = intake?.parq_answers ?? {
    hasHeartCondition: false,
    experiencesChestPain: false,
    experiencesDizzinessOrSyncope: false,
    hasBoneOrJointProblem: false,
    takesBloodPressureOrHeartMedication: false,
    hasChronicSpinalOrDiscCondition: false,
    hasRecentSurgeryOrInjury: false,
    reportedConditionsNotes: intake?.medical_conditions || '',
    signedWaiverName: intake?.consent_signature_name || '',
    signedAt: intake?.consent_signed_at || null,
  }

  const evaluation = evaluateMedicalParq(parqAnswers)

  return NextResponse.json({
    answers: parqAnswers,
    evaluation,
    intake,
  })
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const rawSignature = typeof body.signedWaiverName === 'string' ? body.signedWaiverName.trim() : ''

  if (!isValidLegalSignature(rawSignature)) {
    return NextResponse.json(
      {
        error:
          'A valid typed full legal name signature is required to execute the PAR-Q+ Medical Readiness & Liability Waiver under ESIGN / M.G.L. c. 110G.',
      },
      { status: 400 }
    )
  }

  const explicitConsentFields = [
    body.consentLiabilityWaiver,
    body.consentInformedConsent,
    body.consentPrivacyPractices,
    body.consentCoachingAgreement,
    body.consentEmergencyCare,
  ]
  if (explicitConsentFields.some(flag => flag === false)) {
    return NextResponse.json(
      {
        error:
          'All informed consent, assumption of risk, and liability release acknowledgments must be affirmatively accepted.',
      },
      { status: 400 }
    )
  }

  const signedAtIso =
    typeof body.signedAt === 'string' && !Number.isNaN(Date.parse(body.signedAt))
      ? new Date(body.signedAt).toISOString()
      : new Date().toISOString()

  const answers: ParqAnswers = {
    hasHeartCondition: Boolean(body.hasHeartCondition),
    experiencesChestPain: Boolean(body.experiencesChestPain),
    experiencesDizzinessOrSyncope: Boolean(body.experiencesDizzinessOrSyncope),
    hasBoneOrJointProblem: Boolean(body.hasBoneOrJointProblem),
    takesBloodPressureOrHeartMedication: Boolean(body.takesBloodPressureOrHeartMedication),
    hasChronicSpinalOrDiscCondition: Boolean(body.hasChronicSpinalOrDiscCondition),
    hasRecentSurgeryOrInjury: Boolean(body.hasRecentSurgeryOrInjury),
    reportedConditionsNotes: String(body.reportedConditionsNotes ?? '').trim(),
    signedWaiverName: rawSignature,
    signedAt: signedAtIso,
  }

  const evaluation = evaluateMedicalParq(answers)
  const admin = supabaseAdmin()

  // 1. Fetch client & profile record
  const [{ data: clientRow }, { data: existingIntake }] = await Promise.all([
    admin.from('clients').select('id, full_name, designated_coach_id').eq('id', userId).maybeSingle(),
    admin.from('client_intake_forms').select('emergency_contact_name, emergency_contact_phone').eq('user_id', userId).maybeSingle(),
  ])

  const emergencyName =
    (typeof body.emergencyContactName === 'string' && body.emergencyContactName.trim()) ||
    existingIntake?.emergency_contact_name ||
    null
  const emergencyPhone =
    (typeof body.emergencyContactPhone === 'string' && body.emergencyContactPhone.trim()) ||
    existingIntake?.emergency_contact_phone ||
    null

  const resolvedLiabilityWaiver = body.consentLiabilityWaiver !== false
  const resolvedInformedConsent = body.consentInformedConsent !== false
  const resolvedPrivacyPractices = body.consentPrivacyPractices !== false
  const resolvedCoachingAgreement = body.consentCoachingAgreement !== false
  const resolvedEmergencyCare = body.consentEmergencyCare !== false

  // 2. Upsert client_intake_forms
  const intakePayload = {
    user_id: userId,
    parq_answers: answers,
    parq_any_yes: evaluation.flaggedQuestionsCount > 0,
    medical_conditions: answers.reportedConditionsNotes || null,
    surgeries_or_injuries: answers.hasRecentSurgeryOrInjury
      ? (answers.reportedConditionsNotes || 'Recent surgical procedure or orthopedic injury reported')
      : null,
    consent_signature_name: answers.signedWaiverName,
    consent_signed_at: answers.signedAt,
    consent_liability_waiver: resolvedLiabilityWaiver,
    consent_informed_consent: resolvedInformedConsent,
    consent_privacy_practices: resolvedPrivacyPractices,
    consent_coaching_agreement: resolvedCoachingAgreement,
    consent_emergency_care: resolvedEmergencyCare,
    emergency_contact_name: emergencyName,
    emergency_contact_phone: emergencyPhone,
    updated_at: new Date().toISOString(),
  }

  const { error: intakeError } = await admin
    .from('client_intake_forms')
    .upsert(intakePayload, { onConflict: 'user_id' })

  if (intakeError) {
    return NextResponse.json({ error: intakeError.message }, { status: 500 })
  }

  await recordLegalConsentAudit({
    adminClient: admin,
    userId,
    documentTypes: ['athletic_liability_waiver'],
    typedSignature: rawSignature,
    ipAddress: extractRequestIp(req.headers),
    userAgent: req.headers.get('user-agent'),
    consentedAt: signedAtIso,
    metadata: {
      flow: 'parq_medical_screening',
      clearanceStatus: evaluation.clearanceStatus,
      riskTier: evaluation.riskTier,
      flaggedQuestionsCount: evaluation.flaggedQuestionsCount,
    },
  })

  // 3. Update fitness_profiles with formatted injuries/limitations
  const limitationParts: string[] = []
  if (evaluation.flaggedItems.length > 0) {
    limitationParts.push(`Flagged: ${evaluation.flaggedItems.join('; ')}`)
  }
  if (answers.reportedConditionsNotes) {
    limitationParts.push(`Notes: ${answers.reportedConditionsNotes}`)
  }

  const limitationSummary = limitationParts.join(' | ') || null

  await admin
    .from('fitness_profiles')
    .update({
      injuries_limitations: limitationSummary,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // 4. Alert coach via message thread if client has assigned coach
  const clientName = clientRow?.full_name || 'Athlete'
  const coachId = clientRow?.designated_coach_id

  if (coachId) {
    const alertPrefix = evaluation.flaggedQuestionsCount > 0
      ? `PAR-Q Health Update: ${clientName} updated their medical screening with limitations (${evaluation.riskTier}).`
      : `PAR-Q Health Update: ${clientName} updated their medical screening (${evaluation.riskTier}).`

    const details = evaluation.flaggedItems.length > 0
      ? ` Flagged: ${evaluation.flaggedItems.join(', ')}.`
      : ''
    const notesDetail = answers.reportedConditionsNotes ? ` Notes: "${answers.reportedConditionsNotes}".` : ''

    const messageBody = `${alertPrefix}${details}${notesDetail} Please review and calibrate training programming accordingly.`

    await admin.from('coach_client_messages').insert({
      client_id: userId,
      coach_id: coachId,
      sender_id: userId,
      message_body: messageBody,
    })
  }

  return NextResponse.json({
    success: true,
    evaluation,
    answers,
  })
}

