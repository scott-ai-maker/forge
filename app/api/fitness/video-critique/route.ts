import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { analyzeLiftForm, LiftType, generateQuickBiomechanicalSpokenSummary } from '@/lib/video-form-analysis'

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const body = await req.json()
    const liftType = (body.lift_type ?? 'barbell_back_squat') as LiftType
    const loadLbs = body.load_lbs ? Number(body.load_lbs) : undefined
    const repsCount = body.reps_count ? Number(body.reps_count) : 5
    const observedDeviations = Array.isArray(body.observed_deviations) ? body.observed_deviations : []
    const clientNotes = body.notes ? String(body.notes).trim() : undefined

    const analysis = analyzeLiftForm({
      liftType,
      loadLbs,
      repsCount,
      observedDeviations,
      clientNotes,
    })

    const spokenAudioSummary = generateQuickBiomechanicalSpokenSummary(analysis)

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        spokenAudioSummary,
        userId,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze lift video'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

