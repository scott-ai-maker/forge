import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { consumeFeatureUse, refundFeatureUse } from '@/lib/addon-entitlements'
import { analyzeLiftForm, LiftType, generateQuickBiomechanicalSpokenSummary } from '@/lib/video-form-analysis'

export async function POST(req: NextRequest) {
  let userId = ''
  let isCoach = false
  let consumed = false
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
    isCoach = authz.client.role === 'coach'
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  try {
    if (!isCoach) {
      consumed = await consumeFeatureUse(userId, 'video-review')
      if (!consumed) {
        return NextResponse.json(
          { error: 'Technique video reviews need the Technique Video Review Pack add-on.', code: 'ADDON_REQUIRED', addonId: 'addon-video-review-pack' },
          { status: 402 }
        )
      }
    }

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
    if (consumed) await refundFeatureUse(userId, 'video-review').catch(() => undefined)
    const message = error instanceof Error ? error.message : 'Failed to analyze lift video'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

