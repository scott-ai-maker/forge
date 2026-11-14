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

    if (!isUrgentSafetyInquiry) {
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

    const payload: AskCoachGordonRequest = {
      question: body.question,
      athleteName: typeof body.athleteName === 'string' ? body.athleteName : undefined,
      clientAge: typeof body.clientAge === 'number' ? body.clientAge : undefined,
      clientSex: body.clientSex === 'female' ? 'female' : body.clientSex === 'male' ? 'male' : undefined,
      goal: typeof body.goal === 'string' ? body.goal : undefined,
      nasmOptPhase: typeof body.nasmOptPhase === 'number' ? body.nasmOptPhase : undefined,
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
      contraindicationTags: Array.isArray(body.contraindicationTags) ? (body.contraindicationTags as string[]) : undefined,
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
