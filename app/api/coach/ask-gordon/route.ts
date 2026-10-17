import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { askCoachGordon, type AskCoachGordonRequest } from '@/lib/ask-coach-gordon'
import { dispatchCoachSafetyAlert } from '@/lib/coach-safety-alerts'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach', 'client'])
  } catch (error) {
    const isDevPreview = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW === 'true'
    if (!isDevPreview) {
      const status = error instanceof AuthzError ? error.status : 401
      const message = error instanceof Error ? error.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status })
    }
  }

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.question || !body.question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const payload: AskCoachGordonRequest = {
      question: body.question,
      athleteName: body.athleteName,
      clientAge: typeof body.clientAge === 'number' ? body.clientAge : undefined,
      clientSex: body.clientSex,
      goal: body.goal,
      nasmOptPhase: typeof body.nasmOptPhase === 'number' ? body.nasmOptPhase : undefined,
      currentWorkoutFocus: body.currentWorkoutFocus,
      currentExerciseName: body.currentExerciseName,
      equipmentAccess: Array.isArray(body.equipmentAccess) ? body.equipmentAccess : undefined,
      cardioEquipmentAccess: Array.isArray(body.cardioEquipmentAccess) ? body.cardioEquipmentAccess : undefined,
      kineticCompensations: Array.isArray(body.kineticCompensations) ? body.kineticCompensations : undefined,
      contraindicationTags: Array.isArray(body.contraindicationTags) ? body.contraindicationTags : undefined,
      recentReadinessScore: typeof body.recentReadinessScore === 'number' ? body.recentReadinessScore : undefined,
      recentSleepHours: typeof body.recentSleepHours === 'number' ? body.recentSleepHours : undefined,
      recentRpe: typeof body.recentRpe === 'number' ? body.recentRpe : undefined,
      lastLoggedSet: body.lastLoggedSet && typeof body.lastLoggedSet === 'object' ? body.lastLoggedSet : undefined,
      todayWorkoutExercises: Array.isArray(body.todayWorkoutExercises) ? body.todayWorkoutExercises : undefined,
      attachedImage: body.attachedImage && typeof body.attachedImage.data === 'string' ? body.attachedImage : undefined,
      activeConversationHistory: Array.isArray(body.activeConversationHistory) ? body.activeConversationHistory : undefined,
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
