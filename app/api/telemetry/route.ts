import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { toValidUuidOrNull } from '@/lib/uuid-utils'
import {
  loadClientTelemetrySnapshot,
  recordTelemetryBatch,
  verifyTelemetryEventReceipt,
  type ValidatedTelemetryEnvelope,
} from '@/lib/telemetry-storage'
import { sanitizeTelemetryPayload } from '@/src/lib/telemetry/telemetryClient'

const ALLOWED_PLATFORMS = [
  'ios_app',
  'android_app',
  'pwa_standalone',
  'mobile_web',
  'desktop_web',
] as const

const ALLOWED_EVENT_TYPES = [
  'posture_scan_completed',
  'desk_ergonomics_completed',
  'readiness_check_completed',
  'workout_completed',
  'set_logged',
  'joint_comfort_logged',
  'desk_reset_completed',
  'form_lab_uploaded',
  'live_studio_telemetry',
  'client_runtime_diagnostic',
] as const

const TelemetryEnvelopeSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.enum(ALLOWED_EVENT_TYPES),
  user_id: z.string().nullable().optional(),
  session_id: z.string().min(1).max(128),
  client_timestamp: z.string().min(10).max(64),
  timezone_offset_mins: z.number().int().min(-840).max(840).default(0),
  platform: z.enum(ALLOWED_PLATFORMS),
  app_version: z.string().min(1).max(40),
  network_type: z.string().max(40).nullable().optional(),
  cv_capability: z
    .object({
      webgl2: z.boolean().optional(),
      avg_camera_fps: z.number().nullable().optional(),
    })
    .optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
})

const TelemetryBatchRequestSchema = z.object({
  events: z.array(TelemetryEnvelopeSchema).min(1).max(100),
})

/**
 * GET /api/telemetry
 *
 * 1. Round-trip diagnostic ping verification (`?verifyEventId=<uuid>`)
 * 2. Launch-time state rehydration for iOS Safari / WKWebView 7-day script-writable
 *    storage eviction mitigation (returns latest telemetry snapshot, active OPT™ phase,
 *    and baseline posture metrics strictly scoped to `authz.user.id`).
 */
export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json(
      { error: message },
      { status, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  const admin = supabaseAdmin()
  const verifyEventId = req.nextUrl.searchParams.get('verifyEventId')

  if (verifyEventId) {
    const validUuid = toValidUuidOrNull(verifyEventId)
    if (!validUuid) {
      return NextResponse.json(
        { verified: false, error: 'Invalid verifyEventId UUID' },
        { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    const verification = await verifyTelemetryEventReceipt(admin, userId, validUuid)
    return NextResponse.json(
      {
        ok: true,
        eventId: validUuid,
        verified: verification.verified,
        receivedAt: verification.receivedAt,
        eventType: verification.eventType,
        storageMode: verification.storageMode,
        serverTimestamp: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  // Full server rehydration payload to protect iOS / PWA clients against 7-day storage eviction
  const [snapshot, planRes, assessmentRes] = await Promise.all([
    loadClientTelemetrySnapshot(admin, userId),
    admin
      .from('workout_plans')
      .select('id, name, nasm_opt_phase, phase_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('nasm_assessments')
      .select('assessment_date, overall_posture_score')
      .eq('client_id', userId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return NextResponse.json(
    {
      ok: true,
      rehydration: {
        snapshot,
        activeOptPhase:
          snapshot?.optPhase ??
          (typeof planRes.data?.nasm_opt_phase === 'number' ? planRes.data.nasm_opt_phase : null),
        activePhaseName: planRes.data?.phase_name ?? null,
        baselineAssessment: assessmentRes.data
          ? {
              assessmentDate: assessmentRes.data.assessment_date,
              overallPostureScore: assessmentRes.data.overall_posture_score,
            }
          : null,
      },
      serverTimestamp: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}

/**
 * POST /api/telemetry
 *
 * Authenticates via Bearer token (iOS WKWebView / Android / PWA) or session cookies,
 * sanitizes incoming landmarks/metrics, enforces `user_id = authz.user.id` (HIPAA 1996),
 * performs idempotent `ON CONFLICT (event_id) DO NOTHING` persistence, and updates the
 * member's real-time Coach Portal snapshot.
 */
export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json(
      { error: message },
      { status, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  const rawBody = await req.json().catch(() => null)
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json(
      { error: 'Invalid JSON request body' },
      { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  const sanitizedBody = sanitizeTelemetryPayload(rawBody)
  const parsed = TelemetryBatchRequestSchema.safeParse(sanitizedBody)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid telemetry envelope batch',
        issues: parsed.error.issues.slice(0, 5).map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  const validatedEvents: ValidatedTelemetryEnvelope[] = parsed.data.events.map(ev => ({
    event_id: ev.event_id,
    event_type: ev.event_type,
    session_id: ev.session_id,
    client_timestamp: ev.client_timestamp,
    timezone_offset_mins: ev.timezone_offset_mins,
    platform: ev.platform,
    app_version: ev.app_version,
    network_type: ev.network_type ?? null,
    cv_capability: ev.cv_capability,
    payload: ev.payload,
  }))

  const admin = supabaseAdmin()
  const result = await recordTelemetryBatch(admin, userId, validatedEvents)

  return NextResponse.json(
    {
      ok: true,
      accepted: result.acceptedCount,
      inserted: result.insertedCount,
      deduplicatedCount: result.deduplicatedCount,
      storageMode: result.storageMode,
      lastSyncedAt: result.snapshot.lastSyncedAt,
      serverTimestamp: new Date().toISOString(),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
