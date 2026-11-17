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
import { enforceRateLimit } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function sanitizeText(value: unknown, maxLen = 160): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLen)
}

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const admin = supabaseAdmin()
  const { data: intake, error } = await admin
    .from('client_intake_forms')
    .select(
      'parq_answers, medical_conditions, surgeries_or_injuries, emergency_contact_name, emergency_contact_phone, consent_signature_name, consent_signed_at'
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS })
  }

  const answers = normalizeParqAnswersFromIntake(intake?.parq_answers, intake)
  const evaluation = evaluateMedicalParq(answers)
  const rawObj =
    intake?.parq_answers && typeof intake.parq_answers === 'object' && !Array.isArray(intake.parq_answers)
      ? (intake.parq_answers as Record<string, unknown>)
      : {}

  return NextResponse.json(
    {
      erap: evaluation.erapRecord,
      emergencyContactName: intake?.emergency_contact_name || '',
      emergencyContactPhone: intake?.emergency_contact_phone || '',
      hasExistingIntake: Boolean(intake),
      erapConfirmedAt: typeof rawObj.erapConfirmedAt === 'string' ? rawObj.erapConfirmedAt : null,
    },
    { headers: NO_STORE_HEADERS }
  )
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
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `erap-checkin:${userId}`,
    limit: 30,
    windowSeconds: 300,
    route: '/api/account/erap',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many location check-in updates. Please wait a moment and retry.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const body = await req.json().catch(() => ({}))

  const workoutStreetAddress = sanitizeText(body.workoutStreetAddress, 180)
  const workoutUnitOrGateCode = sanitizeText(body.workoutUnitOrGateCode, 100)
  const workoutCity = sanitizeText(body.workoutCity, 100)
  const workoutState = sanitizeText(body.workoutState, 60)
  const workoutPostalCode = sanitizeText(body.workoutPostalCode, 24)
  const localEmergencyDispatchPhone = sanitizeText(body.localEmergencyDispatchPhone, 40)
  const emergencyContactName = sanitizeText(body.emergencyContactName, 120)
  const emergencyContactPhone = sanitizeText(body.emergencyContactPhone, 40)
  const hasAcceptedVirtualTelehealthConsent = body.hasAcceptedVirtualTelehealthConsent === true
  const hasAcceptedAllPartyRecordingConsent = body.hasAcceptedAllPartyRecordingConsent === true
  const typedSignature = sanitizeText(body.typedSignature, 120)

  if (
    workoutStreetAddress.length < 4 ||
    workoutCity.length < 2 ||
    workoutState.length < 2 ||
    workoutPostalCode.length < 3
  ) {
    return NextResponse.json(
      {
        error:
          'Complete physical street address, city, state/province, and postal code are required so first responders can locate you during a live coaching session.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const dispatchDigits = localEmergencyDispatchPhone.replace(/\D/g, '')
  if (dispatchDigits.length < 10) {
    return NextResponse.json(
      {
        error:
          'Enter a 10-digit local municipal police/EMS dispatch number (or building security emergency desk number). Dialing 911 from a remote coach phone connects to the coach city rather than your training location.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const emergencyPhoneDigits = emergencyContactPhone.replace(/\D/g, '')
  if (emergencyContactName.length < 2 || emergencyPhoneDigits.length < 7) {
    return NextResponse.json(
      {
        error: 'A designated emergency contact name and phone number are required before joining Live Studio.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (!hasAcceptedVirtualTelehealthConsent) {
    return NextResponse.json(
      {
        error:
          'You must affirmatively accept the Virtual Coaching Emergency Dispatch & Immediate Rack-on-Disconnect safety acknowledgment before entering Live Studio.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (!hasAcceptedAllPartyRecordingConsent) {
    return NextResponse.json(
      {
        error:
          'You must affirmatively accept the separate All-Party Live Recording & Session S.O.A.P. Transcription Consent (M.G.L. c. 272, § 99 / Cal. Penal Code § 632) before entering Live Studio.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const admin = supabaseAdmin()
  const { data: existingIntake } = await admin
    .from('client_intake_forms')
    .select(
      'user_id, parq_answers, medical_conditions, surgeries_or_injuries, consent_signature_name, consent_signed_at, emergency_contact_name, emergency_contact_phone'
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (!existingIntake && !isValidLegalSignature(typedSignature)) {
    return NextResponse.json(
      {
        error:
          'Please enter your full legal name signature to execute your Emergency Response Action Plan (ERAP) before entering Live Studio.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const nowIso = new Date().toISOString()
  const existingRaw =
    existingIntake?.parq_answers &&
    typeof existingIntake.parq_answers === 'object' &&
    !Array.isArray(existingIntake.parq_answers)
      ? (existingIntake.parq_answers as Record<string, unknown>)
      : {}
  const existingErap =
    existingRaw.erap && typeof existingRaw.erap === 'object' && !Array.isArray(existingRaw.erap)
      ? (existingRaw.erap as Record<string, unknown>)
      : {}

  const updatedErapBlock = {
    ...existingErap,
    workoutStreetAddress,
    workoutUnitOrGateCode: workoutUnitOrGateCode || undefined,
    workoutCity,
    workoutState,
    workoutPostalCode,
    localEmergencyDispatchPhone,
    hasAcceptedVirtualTelehealthConsent: true,
    hasAcceptedAllPartyRecordingConsent: true,
    liveRecordingConsentConfirmedAt: nowIso,
    virtualTelehealthConsent: true,
  }

  const updatedParqJson: Record<string, unknown> = {
    ...existingRaw,
    workoutStreetAddress,
    workoutUnitOrGateCode: workoutUnitOrGateCode || undefined,
    workoutCity,
    workoutState,
    workoutPostalCode,
    localEmergencyDispatchPhone,
    hasAcceptedVirtualTelehealthConsent: true,
    hasAcceptedAllPartyRecordingConsent: true,
    liveRecordingConsentConfirmedAt: nowIso,
    erapConfirmedAt: nowIso,
    erap: updatedErapBlock,
  }

  if (existingIntake) {
    const { error: updateError } = await admin
      .from('client_intake_forms')
      .update({
        parq_answers: updatedParqJson,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        consent_emergency_care: true,
        updated_at: nowIso,
      })
      .eq('user_id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500, headers: NO_STORE_HEADERS })
    }
  } else {
    const { error: insertError } = await admin.from('client_intake_forms').insert({
      user_id: userId,
      parq_answers: {
        hasHeartCondition: false,
        experiencesChestPain: false,
        experiencesDizzinessOrSyncope: false,
        hasBoneOrJointProblem: false,
        takesBloodPressureOrHeartMedication: false,
        hasChronicSpinalOrDiscCondition: false,
        hasRecentSurgeryOrInjury: false,
        ...updatedParqJson,
      },
      parq_any_yes: false,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      consent_emergency_care: true,
      consent_signature_name: typedSignature,
      consent_signed_at: nowIso,
      updated_at: nowIso,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500, headers: NO_STORE_HEADERS })
    }
  }

  const effectiveSignature = existingIntake?.consent_signature_name || typedSignature
  await recordLegalConsentAudit({
    adminClient: admin,
    userId,
    documentTypes: isValidLegalSignature(effectiveSignature)
      ? ['athletic_liability_waiver', 'live_recording_soap_consent']
      : ['live_recording_soap_consent'],
    typedSignature: isValidLegalSignature(effectiveSignature) ? effectiveSignature : null,
    ipAddress: extractRequestIp(req.headers),
    userAgent: req.headers.get('user-agent'),
    consentedAt: nowIso,
    metadata: {
      flow: 'pre_session_erap_checkin',
      workoutCity,
      workoutState,
      workoutPostalCode,
      hasLocalDispatch10Digit: true,
      allPartyRecordingConsentAccepted: true,
    },
  })

  const normalized: ParqAnswers = normalizeParqAnswersFromIntake(updatedParqJson, {
    ...existingIntake,
    emergency_contact_name: emergencyContactName,
    emergency_contact_phone: emergencyContactPhone,
  })
  const evaluation = evaluateMedicalParq(normalized)

  return NextResponse.json(
    {
      success: true,
      erapConfirmedAt: nowIso,
      erap: evaluation.erapRecord,
      emergencyContactName,
      emergencyContactPhone,
    },
    { headers: NO_STORE_HEADERS }
  )
}
