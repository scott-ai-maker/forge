import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  evaluateClientOnboardingProgression,
  parseParqAnswers,
  type ClientProgressionTelemetry,
  type ProgressionStageId,
} from '@/lib/coach-onboarding-progression'
import { evaluateMedicalParq } from '@/lib/liability-shield'
import {
  loadClientOnboardingGates,
  recordGateAuthorization,
  recordGateReopening,
} from '@/lib/coach-onboarding-gates-storage'

export const dynamic = 'force-dynamic'

const STAGE_ID_MAP: Record<number, ProgressionStageId> = {
  1: 'intake_claim',
  2: 'liability_shield',
  3: 'baseline_biometrics',
  4: 'movement_testing',
  5: 'periodization',
  6: 'program_design',
  7: 'delivery_kickoff',
}

const PROTECTED_CLIENT_FIELDS = new Set([
  'consent_signature_name',
  'consent_signed_at',
  'consent_liability_waiver',
  'consent_informed_consent',
  'consent_privacy_practices',
  'consent_coaching_agreement',
  'consent_emergency_care',
  'parq_answers',
  'parq_any_yes',
])

function getAuthzErrorResponse(error: unknown) {
  if (error instanceof AuthzError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  const message = error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json({ error: message }, { status: 500 })
}

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

    const [
      { data: client },
      { data: intakeForm },
      { data: fitnessProfile },
      { data: latestAssessment },
      { data: latestPlan },
      { data: sessions },
      { data: packages },
      gateMap,
    ] = await Promise.all([
      admin.from('clients').select('id, full_name, email, phone, designated_coach_id, status, created_at').eq('id', clientId).maybeSingle(),
      admin.from('client_intake_forms').select('*').eq('user_id', clientId).maybeSingle(),
      admin.from('fitness_profiles').select('*').eq('user_id', clientId).maybeSingle(),
      admin.from('nasm_assessments').select('*').eq('client_id', clientId).order('assessment_date', { ascending: false }).limit(1).maybeSingle(),
      admin.from('workout_plans').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('sessions').select('id, scheduled_at, status, notes').eq('client_id', clientId).order('scheduled_at', { ascending: false }),
      admin.from('client_packages').select('*').eq('client_id', clientId).order('purchased_at', { ascending: false }),
      loadClientOnboardingGates(admin, clientId),
    ])

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const telemetry: ClientProgressionTelemetry = {
      clientId,
      clientName: client.full_name || 'Athlete',
      email: client.email,
      designatedCoachId: client.designated_coach_id,
      currentStatus: client.status,
      packages: packages || [],
      intakeForm,
      fitnessProfile,
      assessments: latestAssessment ? [latestAssessment] : [],
      latestPlan,
      sessions: sessions || [],
      gates: gateMap,
      enforceGates: true,
    }

    const profile = evaluateClientOnboardingProgression(telemetry)

    return NextResponse.json({
      clientId,
      progressionProfile: profile,
      gates: profile.gates,
      rawClient: client,
      rawIntake: intakeForm,
      rawProfile: fitnessProfile,
      rawAssessment: latestAssessment,
      rawPlan: latestPlan,
      rawSessions: sessions || [],
      rawPackages: packages || [],
    })
  } catch (error) {
    return getAuthzErrorResponse(error)
  }
}

export async function POST(
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

    const body = await req.json().catch(() => ({}))
    const { stageNumber, action = 'authorize', notes = '', data = {} } = body

    if (typeof stageNumber !== 'number' || stageNumber < 1 || stageNumber > 7) {
      return NextResponse.json({ error: 'Valid stageNumber between 1 and 7 is required.' }, { status: 400 })
    }

    const stageId = STAGE_ID_MAP[stageNumber]

    // ── Action: UPDATE DATA (Coach Parameter Modifications) ───
    if (action === 'update_data') {
      // Security check: verify no protected client legal affirmation fields are in the payload
      const payloadKeys = Object.keys(data)
      const hasProtectedField = payloadKeys.some(key => PROTECTED_CLIENT_FIELDS.has(key))

      if (hasProtectedField) {
        return NextResponse.json(
          {
            error: 'Client legal consent, digital waiver signature, and self-reported PAR-Q answers are immutable athlete affirmations and cannot be modified by a coach.',
          },
          { status: 400 }
        )
      }

      const now = new Date().toISOString()

      // Stage 1: Update client coach assignment, phone, or goal
      if (stageNumber === 1) {
        const clientUpdates: Record<string, unknown> = {}
        if (data.designatedCoachId) clientUpdates.designated_coach_id = data.designatedCoachId
        if (data.phone !== undefined) clientUpdates.phone = data.phone
        if (Object.keys(clientUpdates).length > 0) {
          await admin.from('clients').update(clientUpdates).eq('id', clientId)
        }
        const profileUpdates: Record<string, unknown> = { updated_at: now }
        if (data.fitnessGoal !== undefined) profileUpdates.fitness_goal = data.fitnessGoal
        if (data.trainingDaysPerWeek !== undefined) profileUpdates.training_days_per_week = data.trainingDaysPerWeek
        if (data.preferredTrainingDays !== undefined) profileUpdates.preferred_training_days = data.preferredTrainingDays
        if (Object.keys(profileUpdates).length > 1) {
          await admin.from('fitness_profiles').update(profileUpdates).eq('user_id', clientId)
        }
      }

      // Stage 2: Update intake physician clearance notes or emergency phone
      if (stageNumber === 2) {
        const allowedIntakeUpdates: Record<string, unknown> = { updated_at: now }
        if (data.medicalConditions !== undefined) allowedIntakeUpdates.medical_conditions = data.medicalConditions
        if (data.medications !== undefined) allowedIntakeUpdates.medications = data.medications
        if (data.surgeriesOrInjuries !== undefined) allowedIntakeUpdates.surgeries_or_injuries = data.surgeriesOrInjuries
        if (data.allergies !== undefined) allowedIntakeUpdates.allergies = data.allergies
        if (data.emergencyContactPhone !== undefined) allowedIntakeUpdates.emergency_contact_phone = data.emergencyContactPhone
        if (data.primaryPhysicianPhone !== undefined) allowedIntakeUpdates.primary_physician_phone = data.primaryPhysicianPhone

        await admin.from('client_intake_forms').update(allowedIntakeUpdates).eq('user_id', clientId)
      }

      // Stage 3: Update baseline fitness vitals and parameters
      if (stageNumber === 3) {
        const allowedProfileUpdates: Record<string, unknown> = { updated_at: now }
        const profileFields = [
          'height_cm', 'weight_kg', 'waist_cm', 'neck_cm', 'hip_cm', 'age', 'sex',
          'activity_level', 'training_days_per_week', 'preferred_training_days',
          'fitness_goal', 'target_weight_kg', 'target_bodyfat_percent', 'injuries_limitations',
          'experience_level', 'workout_location', 'equipment_access', 'cardio_equipment_access',
          'preferred_units',
        ]
        for (const field of profileFields) {
          const camelKey = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
          if (data[camelKey] !== undefined) allowedProfileUpdates[field] = data[camelKey]
          else if (data[field] !== undefined) allowedProfileUpdates[field] = data[field]
        }

        await admin.from('fitness_profiles').update(allowedProfileUpdates).eq('user_id', clientId)
      }

      // Stage 4: Update movement testing / assessment findings
      if (stageNumber === 4) {
        const { data: latestAsm } = await admin
          .from('nasm_assessments')
          .select('id')
          .eq('client_id', clientId)
          .order('assessment_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestAsm?.id) {
          const allowedAsmUpdates: Record<string, unknown> = {}
          if (data.ohsaFindings !== undefined) allowedAsmUpdates.ohsa_findings = data.ohsaFindings
          if (data.staticPosture !== undefined) allowedAsmUpdates.static_posture = data.staticPosture
          if (data.coachSummaryNotes !== undefined) allowedAsmUpdates.coach_summary_notes = data.coachSummaryNotes

          if (Object.keys(allowedAsmUpdates).length > 0) {
            await admin.from('nasm_assessments').update(allowedAsmUpdates).eq('id', latestAsm.id)
          }
        }
      }

      // Stage 5 & 6: Update workout plan
      if (stageNumber === 5 || stageNumber === 6) {
        const { data: latestPlan } = await admin
          .from('workout_plans')
          .select('id, plan_json')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestPlan?.id) {
          const planUpdates: Record<string, unknown> = { updated_at: now }
          if (data.name !== undefined) planUpdates.name = data.name
          if (data.nasmOptPhase !== undefined) planUpdates.nasm_opt_phase = data.nasmOptPhase
          if (data.phaseName !== undefined) planUpdates.phase_name = data.phaseName
          if (data.sessionsPerWeek !== undefined) planUpdates.sessions_per_week = data.sessionsPerWeek
          if (data.planJson !== undefined) planUpdates.plan_json = data.planJson

          await admin.from('workout_plans').update(planUpdates).eq('id', latestPlan.id)
        }
      }

      // Stage 7: Update sessions or SOAP notes
      if (stageNumber === 7) {
        const { data: latestSession } = await admin
          .from('sessions')
          .select('id')
          .eq('client_id', clientId)
          .order('scheduled_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestSession?.id && data.notes !== undefined) {
          await admin.from('sessions').update({ notes: data.notes }).eq('id', latestSession.id)
        }
      }

      return NextResponse.json({ success: true, updatedStage: stageNumber })
    }

    // ── Action: REOPEN GATE ───────────────────────────────────
    if (action === 'reopen') {
      await recordGateReopening(admin, {
        clientId,
        coachId,
        stageNumber,
        stageId,
        notes: notes ? String(notes).trim() : null,
      })

      // If Stage 7 is reopened, remove onboarding completion timestamp
      if (stageNumber <= 7) {
        await admin
          .from('fitness_profiles')
          .update({ onboarding_completed_at: null, updated_at: new Date().toISOString() })
          .eq('user_id', clientId)
      }

      return NextResponse.json({ success: true, reopenedStage: stageNumber })
    }

    // ── Action: AUTHORIZE GATE ────────────────────────────────
    if (action === 'authorize') {
      // 1. Check sequential progression: previous stage must be authorized
      if (stageNumber > 1) {
        const existingGates = await loadClientOnboardingGates(admin, clientId)
        if (existingGates[stageNumber - 1]?.status !== 'authorized') {
          return NextResponse.json(
            {
              error: `Stage ${stageNumber - 1} must be accepted and authorized by a coach before progressing to Stage ${stageNumber}.`,
            },
            { status: 400 }
          )
        }
      }

      // 2. Check Stage 2 Clinical Blocker (Medical Clearance)
      if (stageNumber === 2) {
        const { data: intake } = await admin
          .from('client_intake_forms')
          .select('parq_answers, medical_conditions, consent_signature_name, consent_signed_at')
          .eq('user_id', clientId)
          .maybeSingle()

        if (intake?.parq_answers) {
          const answers = parseParqAnswers(intake.parq_answers, intake)
          const evaluation = evaluateMedicalParq(answers)
          const requiresClearance = evaluation.clearanceStatus === 'physician_clearance_required'

          if (requiresClearance && !body.clinicalClearanceVerified) {
            return NextResponse.json(
              {
                error: 'Athlete flagged cardiovascular or clinical risk criteria in PAR-Q+. Physician clearance verification is required before authorizing Stage 2.',
                riskTier: evaluation.riskTier,
              },
              { status: 400 }
            )
          }
        }
      }

      // 3. Record gate authorization with dual-write resilience
      const now = new Date().toISOString()
      await recordGateAuthorization(admin, {
        clientId,
        coachId,
        stageNumber,
        stageId,
        notes: String(notes || '').trim() || null,
        metadata: {
          clinicalClearanceVerified: Boolean(body.clinicalClearanceVerified),
        },
      })

      // 4. If Stage 7 is authorized, mark onboarding complete on fitness profile
      if (stageNumber === 7) {
        await admin
          .from('fitness_profiles')
          .update({ onboarding_completed_at: now, updated_at: now })
          .eq('user_id', clientId)
      }

      return NextResponse.json({
        success: true,
        authorizedStage: stageNumber,
        nextStage: stageNumber < 7 ? stageNumber + 1 : null,
        isOnboardingComplete: stageNumber === 7,
      })
    }

    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 })
  } catch (error) {
    return getAuthzErrorResponse(error)
  }
}
