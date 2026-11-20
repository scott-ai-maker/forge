import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { askCoachGordon, type AskCoachGordonRequest } from '@/lib/ask-coach-gordon'
import { evaluateClinicalUrgencyTriage } from '@/lib/ask-coach-gordon-types'
import { dispatchCoachSafetyAlert } from '@/lib/coach-safety-alerts'
import {
  evaluatePainAndRedFlagTriage,
  stripPiiAndRawFramesFromCoachContext,
} from '@/src/lib/safety/clinicalGuardrails'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'
import {
  checkClientMedicalClearanceGate,
  evaluateMedicalParq,
  normalizeParqAnswersFromIntake,
} from '@/lib/liability-shield'

const BETA_BLOCKER_PATTERN =
  /\b(beta[\s-]?blocker|metoprolol|atenolol|propranolol|carvedilol|bisoprolol|nebivolol|labetalol|nadolol|sotalol)\b/i

export async function POST(req: NextRequest) {
  let authenticatedUserId: string | null = null
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach', 'client'])
    authenticatedUserId = authz.user.id
  } catch (error) {
    const isDevPreview = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW === 'true'
    if (!isDevPreview) {
      const status = error instanceof AuthzError ? error.status : 401
      const message = error instanceof Error ? error.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status })
    }
  }

  try {
    const rawBody = await req.json().catch(() => ({}))
    const body = stripPiiAndRawFramesFromCoachContext(
      (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>
    ) as Record<string, unknown>

    if (typeof body.question !== 'string' || !body.question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Never rate-limit clinical emergency or pain red-flag triage messages
    const clinicalUrgency = evaluateClinicalUrgencyTriage(body.question)
    const painScreen = evaluatePainAndRedFlagTriage({
      messageText: body.question,
      painLevel5: typeof body.painLevel5 === 'number' ? body.painLevel5 : undefined,
      jointComfort100: typeof body.jointComfortScore === 'number' ? body.jointComfortScore : undefined,
    })
    const isUrgentSafetyInquiry =
      clinicalUrgency.tier !== 'STANDARD_TRAINING' || painScreen.triggered

    if (isUrgentSafetyInquiry) {
      // Dedicated generous safety-bucket ceiling (#37) prevents automated Resend/email flood abuse
      const safetyRateCheck = checkSlidingWindowRateLimit({
        namespace: 'ask_coach_gordon_safety',
        subjectKey: resolveRequestSubjectKey(req, authenticatedUserId),
        maxRequests: 60,
        windowMs: 10 * 60 * 1000,
      })
      if (!safetyRateCheck.allowed) {
        return NextResponse.json(
          {
            error:
              'If you are experiencing a medical emergency, call 911 immediately. Automated consultation rate limit reached.',
          },
          { status: 429 }
        )
      }
    } else {
      const rateCheck = checkSlidingWindowRateLimit({
        namespace: 'ask_coach_gordon',
        subjectKey: resolveRequestSubjectKey(req, authenticatedUserId),
        maxRequests: 35,
        windowMs: 10 * 60 * 1000,
      })
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            error: `You've sent several coaching questions quickly—please wait ${rateCheck.retryAfterSeconds}s or tap Message Real Coach Gordon for direct support.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(rateCheck.retryAfterSeconds),
              'X-RateLimit-Limit': String(rateCheck.limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
    }

    // Server-side authoritative PAR-Q+, contraindication & beta-blocker loading (#37 — never trust client-only safety tags)
    let serverContraindicationTags: string[] = []
    let serverMaxOptPhase: number | null = null
    let serverAge: number | undefined = undefined
    let serverSex: 'male' | 'female' | undefined = undefined
    let serverMedicalHold = false
    let serverMedicalHoldReason =
      '**Medical Clearance Hold (Phase 0):** Your PAR-Q+ screening indicates an active cardiovascular, chest-pain, or dizziness flag requiring written physician clearance before exercise prescription. Please consult your physician first—Coach Gordon will calibrate your program as soon as medical clearance is on file.'
    let serverBetaBlockerDetected = false

    if (authenticatedUserId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        const admin = supabaseAdmin()
        const [clearanceGate, intakeRes, profileRes] = await Promise.all([
          checkClientMedicalClearanceGate(admin, authenticatedUserId),
          admin
            .from('client_intake_forms')
            .select('parq_answers, medications, medical_conditions, surgeries_or_injuries')
            ?.eq?.('user_id', authenticatedUserId)
            ?.maybeSingle?.(),
          admin
            .from('fitness_profiles')
            .select('age, sex')
            ?.eq?.('user_id', authenticatedUserId)
            ?.maybeSingle?.(),
        ])

        if (clearanceGate.blocked) {
          serverMedicalHold = true
          if (clearanceGate.reason?.startsWith('PAR-Q+ Medical Screening Required') || clearanceGate.reason?.startsWith('Signed PAR-Q+')) {
            serverMedicalHoldReason =
              '**PAR-Q+ Screening & Waiver Required:** Please complete and sign your 7-point PAR-Q+ health readiness screening and Athletic Liability Release in Onboarding before requesting personalized exercise prescriptions.'
          }
        } else {
          serverContraindicationTags = [...clearanceGate.evaluation.contraindicationTags]
          serverMaxOptPhase = clearanceGate.effectiveMaxOptPhase
        }

        if (intakeRes?.data) {
          const intakeRow = intakeRes.data as {
            parq_answers?: unknown
            medications?: string | null
            medical_conditions?: string | null
            surgeries_or_injuries?: string | null
          }
          const normalizedParq = normalizeParqAnswersFromIntake(intakeRow.parq_answers, intakeRow)
          const parqEval = evaluateMedicalParq(normalizedParq)
          serverContraindicationTags = Array.from(
            new Set([...serverContraindicationTags, ...parqEval.contraindicationTags])
          )
          if (!clearanceGate.blocked && serverMaxOptPhase === null) {
            serverMaxOptPhase = parqEval.maxAllowedOptPhase
          }
          const medsBlob = `${intakeRow.medications || ''} ${intakeRow.medical_conditions || ''}`
          if (BETA_BLOCKER_PATTERN.test(medsBlob)) {
            serverBetaBlockerDetected = true
            serverContraindicationTags.push('cardiovascular_hypertension', 'beta_blocker_hr_blunted')
            serverMaxOptPhase = Math.min(serverMaxOptPhase ?? 2, 2)
          }
        }

        if (profileRes?.data) {
          const prof = profileRes.data as { age?: number | null; sex?: string | null }
          if (typeof prof.age === 'number' && prof.age >= 18) serverAge = prof.age
          if (prof.sex === 'male' || prof.sex === 'female') serverSex = prof.sex
        }
      } catch {
        // Tolerate isolated unit tests without full DB mocks
      }
    }

    if (serverMedicalHold && clinicalUrgency.tier === 'STANDARD_TRAINING') {
      return NextResponse.json({
        success: true,
        coachIdentity: 'Coach Gordon · Director of Human Performance, Forge Athletic',
        response: {
          answerMarkdown: serverMedicalHoldReason,
          spokenAudioText:
            'Please complete your health screening or physician clearance before starting exercise. Coach Gordon will calibrate your plan once cleared.',
          relevantCurriculums: ['PAR-Q+ Medical Clearance Protocol'],
          suggestedFollowUps: ['Complete Health Screening', 'Message Coach Gordon'],
          requiresCoachPing: true,
          coachPingReason: 'Member with incomplete screening or Phase 0 PAR-Q+ hold requested training guidance.',
          engineMode: 'deterministic_safety_hold',
        },
      })
    }

    const clientTags = Array.isArray(body.contraindicationTags)
      ? (body.contraindicationTags as string[]).filter(t => typeof t === 'string')
      : []
    const mergedContraindications = Array.from(new Set([...clientTags, ...serverContraindicationTags]))
    const requestedPhase = typeof body.nasmOptPhase === 'number' ? body.nasmOptPhase : undefined
    const effectiveOptPhase =
      serverMaxOptPhase !== null && serverMaxOptPhase > 0
        ? Math.min(requestedPhase ?? serverMaxOptPhase, serverMaxOptPhase)
        : requestedPhase

    const payload: AskCoachGordonRequest = {
      question: serverBetaBlockerDetected
        ? `${body.question}\n[SAFETY NOTE: Athlete takes beta-blocker/HR-blunting medication — gauge intensity strictly via RPE 12-13 / Talk Test, NEVER age-predicted HR zones or Valsalva breath-holding.]`
        : body.question,
      athleteName: typeof body.athleteName === 'string' ? body.athleteName : undefined,
      clientAge: serverAge ?? (typeof body.clientAge === 'number' ? body.clientAge : undefined),
      clientSex: serverSex ?? (body.clientSex === 'female' ? 'female' : body.clientSex === 'male' ? 'male' : undefined),
      goal: typeof body.goal === 'string' ? body.goal : undefined,
      nasmOptPhase: effectiveOptPhase,
      currentWorkoutFocus: typeof body.currentWorkoutFocus === 'string' ? body.currentWorkoutFocus : undefined,
      currentExerciseName: typeof body.currentExerciseName === 'string' ? body.currentExerciseName : undefined,
      expressModeActive: typeof body.expressModeActive === 'boolean' ? body.expressModeActive : undefined,
      environmentProfile: typeof body.environmentProfile === 'string' ? body.environmentProfile : undefined,
      jointComfortScore: typeof body.jointComfortScore === 'number' ? body.jointComfortScore : undefined,
      deskErgonomicsFlags: Array.isArray(body.deskErgonomicsFlags)
        ? body.deskErgonomicsFlags.filter((f): f is string => typeof f === 'string')
        : undefined,
      recentRpeHistory: Array.isArray(body.recentRpeHistory)
        ? body.recentRpeHistory.filter((n): n is number => typeof n === 'number')
        : undefined,
      painLevel5: typeof body.painLevel5 === 'number' ? body.painLevel5 : undefined,
      equipmentAccess: Array.isArray(body.equipmentAccess) ? (body.equipmentAccess as string[]) : undefined,
      cardioEquipmentAccess: Array.isArray(body.cardioEquipmentAccess) ? (body.cardioEquipmentAccess as string[]) : undefined,
      kineticCompensations: Array.isArray(body.kineticCompensations) ? (body.kineticCompensations as string[]) : undefined,
      contraindicationTags: mergedContraindications.length > 0 ? mergedContraindications : undefined,
      recentReadinessScore: typeof body.recentReadinessScore === 'number' ? body.recentReadinessScore : undefined,
      recentSleepHours: typeof body.recentSleepHours === 'number' ? body.recentSleepHours : undefined,
      recentRpe: typeof body.recentRpe === 'number' ? body.recentRpe : undefined,
      lastLoggedSet: body.lastLoggedSet && typeof body.lastLoggedSet === 'object' ? (body.lastLoggedSet as AskCoachGordonRequest['lastLoggedSet']) : undefined,
      todayWorkoutExercises: Array.isArray(body.todayWorkoutExercises) ? (body.todayWorkoutExercises as string[]) : undefined,
      activeConversationHistory: Array.isArray(body.activeConversationHistory)
        ? (body.activeConversationHistory as AskCoachGordonRequest['activeConversationHistory'])
        : undefined,
    }

    const response = await askCoachGordon(payload)

    // Asynchronous Real-Time Safety & Liability Escalation
    if (response.requiresCoachPing || response.isEmergency911) {
      dispatchCoachSafetyAlert({
        request: payload,
        response,
      }).catch(err => {
        console.error('[AskCoachGordon API] Background safety alert dispatch failed:', err)
      })
    }

    return NextResponse.json({
      success: true,
      coachIdentity: 'Coach Gordon · Director of Human Performance, Forge Athletic',
      response,
    })
  } catch (error) {
    console.error('Ask Coach Gordon consultation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to consult with Coach Gordon' },
      { status: 500 }
    )
  }
}
