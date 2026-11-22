import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, hasIndefiniteAllFeaturesAccess } from '@/lib/authz'
import { consumeFeatureUse, refundFeatureUse } from '@/lib/addon-entitlements'
import {
  analyzeLiftForm,
  LiftType,
  LIFT_METADATA,
  generateQuickBiomechanicalSpokenSummary,
} from '@/lib/video-form-analysis'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
}

function sanitizeClinicalNote(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined
  const cleaned = String(raw)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 1000)
  return cleaned.length > 0 ? cleaned : undefined
}

export async function POST(req: NextRequest) {
  let userId = ''
  let isCoach = false
  let hasUnlimitedFeatureAccess = false
  let consumed = false

  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
    isCoach = authz.client.role === 'coach'
    hasUnlimitedFeatureAccess = hasIndefiniteAllFeaturesAccess(authz.user.email, authz.client.role)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: 'Malformed JSON request body.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const rawLift = body.lift_type === undefined || body.lift_type === null ? 'barbell_back_squat' : body.lift_type
  if (
    typeof rawLift !== 'string' ||
    !Object.prototype.hasOwnProperty.call(LIFT_METADATA, rawLift)
  ) {
    return NextResponse.json(
      { error: 'Unsupported lift_type.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }
  const liftType = rawLift as LiftType

  let loadLbs: number | undefined = undefined
  if (body.load_lbs !== undefined && body.load_lbs !== null && body.load_lbs !== '') {
    const parsedLoad = Number(body.load_lbs)
    if (!Number.isFinite(parsedLoad) || parsedLoad < 0 || parsedLoad > 2000) {
      return NextResponse.json(
        { error: 'load_lbs must be a valid number between 0 and 2000.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    loadLbs = parsedLoad
  }

  let repsCount = 5
  if (body.reps_count !== undefined && body.reps_count !== null && body.reps_count !== '') {
    const parsedReps = Number(body.reps_count)
    if (!Number.isFinite(parsedReps) || parsedReps < 1 || parsedReps > 100) {
      return NextResponse.json(
        { error: 'reps_count must be between 1 and 100.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    repsCount = Math.round(parsedReps)
  }

  if (body.observed_deviations !== undefined && !Array.isArray(body.observed_deviations)) {
    return NextResponse.json(
      { error: 'observed_deviations must be an array of fault identifiers.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }
  const observedDeviations = Array.isArray(body.observed_deviations)
    ? body.observed_deviations
        .filter((d): d is string => typeof d === 'string' && d.trim().length > 0 && d.length <= 64)
        .slice(0, 10)
    : []

  const clientNotes = sanitizeClinicalNote(body.notes)

  const rawVideoRef =
    (typeof body.video_url === 'string' && body.video_url.trim()) ||
    (typeof body.storage_path === 'string' && body.storage_path.trim()) ||
    (typeof body.video_file_name === 'string' && body.video_file_name.trim()) ||
    ''
  const videoReference = rawVideoRef
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .trim()
    .slice(0, 512)

  if (!isCoach && !videoReference) {
    return NextResponse.json(
      {
        error:
          'A recorded or uploaded lift video clip is required before consuming a Technique Video Review credit.',
        code: 'VIDEO_REQUIRED',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  try {
    if (!hasUnlimitedFeatureAccess) {
      consumed = await consumeFeatureUse(userId, 'video-review')
      if (!consumed) {
        return NextResponse.json(
          {
            error: 'Technique video reviews need the Technique Video Review Pack add-on.',
            code: 'ADDON_REQUIRED',
            addonId: 'addon-video-review-pack',
          },
          { status: 402, headers: NO_STORE_HEADERS }
        )
      }
    }

    const analysis = analyzeLiftForm({
      liftType,
      loadLbs,
      repsCount,
      observedDeviations,
      clientNotes,
    })

    const spokenAudioSummary = generateQuickBiomechanicalSpokenSummary(analysis)

    return NextResponse.json(
      {
        success: true,
        analysis: {
          ...analysis,
          spokenAudioSummary,
          userId,
        },
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    if (consumed) await refundFeatureUse(userId, 'video-review').catch(() => undefined)
    const message = error instanceof Error ? error.message : 'Failed to analyze lift video'
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
