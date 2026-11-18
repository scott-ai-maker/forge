import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  evaluateMedicalParq,
  normalizeParqAnswersFromIntake,
  ParqAnswers,
} from '@/lib/liability-shield'
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

  const parqAnswers: ParqAnswers = normalizeParqAnswersFromIntake(intake?.parq_answers, intake)

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

  // Require explicit affirmative `true` on every consent flag (#32 — never default omitted flags to true)
  const explicitConsentFields = [
    body.consentLiabilityWaiver,
    body.consentInformedConsent,
    body.consentPrivacyPractices,
    body.consentCoachingAgreement,
    body.consentEmergencyCare,
  ]
  if (explicitConsentFields.some(flag => flag !== true)) {
    return NextResponse.json(
      {
        error:
          'All informed consent, assumption of risk, privacy, coaching, and emergency care acknowledgments must be explicitly accepted.',
      },
      { status: 400 }
    )
  }

  const signedAtIso =
    typeof body.signedAt === 'string' && !Number.isNaN(Date.parse(body.signedAt))
      ? new Date(body.signedAt).toISOString()
      : new Date().toISOString()

  const admin = supabaseAdmin()

  // 1. Fetch client & existing intake record (preserving ERAP fields across PAR-Q updates)
  const [{ data: clientRow }, { data: existingIntake }] = await Promise.all([
    admin.from('clients').select('id, full_name, designated_coach_id').eq('id', userId).maybeSingle(),
    admin
      .from('client_intake_forms')
      .select('parq_answers, emergency_contact_name, emergency_contact_phone')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const existingNormalized = normalizeParqAnswersFromIntake(existingIntake?.parq_answers, existingIntake)

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
    workoutStreetAddress:
      (typeof body.workoutStreetAddress === 'string' && body.workoutStreetAddress.trim()) ||
      existingNormalized.workoutStreetAddress,
    workoutUnitOrGateCode:
      typeof body.workoutUnitOrGateCode === 'string'
        ? body.workoutUnitOrGateCode.trim() || undefined
        : existingNormalized.workoutUnitOrGateCode,
    workoutCity:
      (typeof body.workoutCity === 'string' && body.workoutCity.trim()) ||
      existingNormalized.workoutCity,
    workoutState:
      (typeof body.workoutState === 'string' && body.workoutState.trim()) ||
      existingNormalized.workoutState,
    workoutPostalCode:
      (typeof body.workoutPostalCode === 'string' && body.workoutPostalCode.trim()) ||
      existingNormalized.workoutPostalCode,
    localEmergencyDispatchPhone:
      (typeof body.localEmergencyDispatchPhone === 'string' && body.localEmergencyDispatchPhone.trim()) ||
      existingNormalized.localEmergencyDispatchPhone,
    hasAcceptedVirtualTelehealthConsent:
      typeof body.hasAcceptedVirtualTelehealthConsent === 'boolean'
        ? body.hasAcceptedVirtualTelehealthConsent
        : existingNormalized.hasAcceptedVirtualTelehealthConsent,
  }

  const evaluation = evaluateMedicalParq(answers)

  const emergencyName =
    (typeof body.emergencyContactName === 'string' && body.emergencyContactName.trim()) ||
    existingIntake?.emergency_contact_name ||
    null
  const emergencyPhone =
    (typeof body.emergencyContactPhone === 'string' && body.emergencyContactPhone.trim()) ||
    existingIntake?.emergency_contact_phone ||
    null

  if (!emergencyName || !emergencyPhone) {
    return NextResponse.json(
      {
        error:
          'Emergency contact name and phone number are required before saving your PAR-Q+ medical screening.',
      },
      { status: 400 }
    )
  }

  const resolvedLiabilityWaiver = body.consentLiabilityWaiver === true
  const resolvedInformedConsent = body.consentInformedConsent === true
  const resolvedPrivacyPractices = body.consentPrivacyPractices === true
  const resolvedCoachingAgreement = body.consentCoachingAgreement === true
  const resolvedEmergencyCare = body.consentEmergencyCare === true

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

  const auditRes = await recordLegalConsentAudit({
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

  if (auditRes.error) {
    return NextResponse.json(
      { error: 'Unable to record evidentiary legal consent audit log right now. Please retry.' },
      { status: 500 }
    )
  }

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

