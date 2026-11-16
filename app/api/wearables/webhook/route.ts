import { NextRequest, NextResponse } from 'next/server'
import type { WearableProvider } from '@/lib/wearables-telemetry'
import {
  verifyAppleHealthWebhookToken,
  verifyGoogleHealthWebhookToken,
  normalizeAppleHealthDailyMetrics,
  normalizeGoogleHealthDailyMetrics,
  sanitizeWearableRawPayload,
} from '@/lib/wearable-webhook-adapters'
import { normalizeWearableWorkout } from '@/lib/wearables-telemetry'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }
const MAX_WEBHOOK_PAYLOAD_BYTES = 262_144

/**
 * GET: Webhook verification and healthcheck
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: 'Forge Athletic Single Source of Truth Webhook Engine Active (Apple Health & Google Health Connect)',
      supportedProviders: ['apple_health', 'google_fit'],
    },
    { headers: NO_STORE_HEADERS }
  )
}

/**
 * POST: Multi-Provider Webhook Ingestion (Apple Health & Google Health Connect)
 */
export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text()
    if (Buffer.byteLength(rawText, 'utf8') > MAX_WEBHOOK_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Webhook payload exceeds maximum allowed size (256 KB)' },
        { status: 413, headers: NO_STORE_HEADERS }
      )
    }

    let parsed: unknown = null

    try {
      parsed = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Missing or invalid webhook JSON object' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    const body = parsed as Record<string, unknown>

    const provider: WearableProvider =
      body.provider === 'google_fit' || body.provider === 'google_health' || body.platform === 'android'
        ? 'google_fit'
        : 'apple_health'

    const searchParams = req.nextUrl?.searchParams
    const queryUserId = searchParams?.get('client_id') || searchParams?.get('user_id')

    const userId = String(
      body.user_id ||
      body.client_id ||
      body.userId ||
      body.clientId ||
      (body.user as { reference_id?: string })?.reference_id ||
      queryUserId ||
      ''
    ).trim()

    if (!userId) {
      return NextResponse.json({ error: 'Missing client_id/user_id in webhook payload' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    // ── Token Verification ──
    const isProd = process.env.NODE_ENV === 'production'
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const secretHeader = req.headers.get('x-webhook-secret')

    if (provider === 'apple_health') {
      if (process.env.APPLE_HEALTH_WEBHOOK_SECRET) {
        if (!verifyAppleHealthWebhookToken(authHeader || secretHeader, process.env.APPLE_HEALTH_WEBHOOK_SECRET)) {
          return NextResponse.json({ error: 'Unauthorized: Invalid Apple Health secret' }, { status: 401, headers: NO_STORE_HEADERS })
        }
      } else if (isProd) {
        return NextResponse.json({ error: 'Unauthorized: Apple Health webhook secret not configured' }, { status: 401, headers: NO_STORE_HEADERS })
      }
    } else if (provider === 'google_fit') {
      if (process.env.GOOGLE_HEALTH_WEBHOOK_SECRET) {
        if (!verifyGoogleHealthWebhookToken(authHeader || secretHeader, process.env.GOOGLE_HEALTH_WEBHOOK_SECRET)) {
          return NextResponse.json({ error: 'Unauthorized: Invalid Google Health secret' }, { status: 401, headers: NO_STORE_HEADERS })
        }
      } else if (isProd) {
        return NextResponse.json({ error: 'Unauthorized: Google Health webhook secret not configured' }, { status: 401, headers: NO_STORE_HEADERS })
      }
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    const eventName = String(body.event || body.type || '')

    // 1. Process Workout Events
    if (
      eventName.includes('workout') ||
      body.workout ||
      body.activity_type ||
      body.activity ||
      body.sport_name
    ) {
      const workoutData = (body.workout as Record<string, unknown>) || body
      const normalized = normalizeWearableWorkout(workoutData, provider)
      const workoutEvent = {
        provider,
        userId,
        externalId: normalized.externalId,
        activityType: normalized.activityType,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        durationMins: normalized.durationMins,
        distanceKm: normalized.distanceKm,
        avgHeartRate: normalized.avgHeartRate,
        maxHeartRate: normalized.maxHeartRate,
        caloriesKcal: normalized.caloriesKcal,
        tanakaZone: normalized.tanakaZone,
        notes: `Auto-synced from ${provider === 'apple_health' ? 'Apple Health' : 'Google Health Connect'}. Peak HR: ${normalized.maxHeartRate || '--'} BPM.`,
        rawPayload: sanitizeWearableRawPayload(body),
      }

      const sessionDate = workoutEvent.startTime.split('T')[0]

      const { data, error } = await admin
        .from('cardio_logs')
        .insert({
          user_id: userId,
          session_date: sessionDate,
          activity_type: `${workoutEvent.activityType} (${provider === 'apple_health' ? 'Apple Health' : 'Google Health Connect'})`,
          duration_mins: workoutEvent.durationMins,
          distance_km: workoutEvent.distanceKm,
          avg_heart_rate: workoutEvent.avgHeartRate,
          calories: workoutEvent.caloriesKcal,
          perceived_effort: 6,
          notes: workoutEvent.notes,
        })
        .select()
        .single()

      if (error) {
        console.error('[wearables/webhook] Workout insert error:', error.message)
        return NextResponse.json({ error: 'Failed inserting workout' }, { status: 500, headers: NO_STORE_HEADERS })
      }

      return NextResponse.json(
        {
          success: true,
          action: 'workout_logged',
          provider,
          workoutId: data?.id,
          workout: workoutEvent,
        },
        { headers: NO_STORE_HEADERS }
      )
    }

    // 2. Process Daily Biometrics / Recovery / Sleep Events
    const dailyMetrics =
      provider === 'google_fit'
        ? normalizeGoogleHealthDailyMetrics(body, userId)
        : normalizeAppleHealthDailyMetrics(body, userId)

    const now = new Date().toISOString()

    await admin.from('athlete_wearable_metrics').upsert(
      {
        client_id: userId,
        sample_date: dailyMetrics.date,
        provider,
        resting_heart_rate: dailyMetrics.restingHeartRateBpm,
        hrv_rmssd: dailyMetrics.hrvRmssdMs,
        cns_stress_score: dailyMetrics.cnsReadinessScore,
        readiness_score: dailyMetrics.cnsReadinessScore,
        sleep_hours: dailyMetrics.sleep.totalHours,
        deep_sleep_hours: dailyMetrics.sleep.deepHours,
        rem_sleep_hours: dailyMetrics.sleep.remHours,
        core_sleep_hours: dailyMetrics.sleep.coreHours,
        awake_sleep_hours: dailyMetrics.sleep.awakeHours,
        sleep_efficiency_percent: dailyMetrics.sleep.sleepEfficiencyPercent,
        steps_count: dailyMetrics.activity?.stepsCount || 0,
        active_calories_kcal: dailyMetrics.activity?.activeEnergyBurnedKcal || 0,
        calories_consumed_kcal: dailyMetrics.nutrition?.caloriesConsumedKcal || 0,
        protein_grams: dailyMetrics.nutrition?.proteinGrams || 0,
        carbs_grams: dailyMetrics.nutrition?.carbsGrams || 0,
        fat_grams: dailyMetrics.nutrition?.fatGrams || 0,
        fiber_grams: dailyMetrics.nutrition?.fiberGrams || 0,
        water_oz: dailyMetrics.nutrition?.waterOz || 0,
        raw_payload: sanitizeWearableRawPayload(dailyMetrics.rawPayload),
        synced_at: now,
      },
      { onConflict: 'client_id,sample_date,provider' }
    )

    // 3. Update fitness_profiles primary telemetry source & resting HR
    try {
      await admin
        .from('fitness_profiles')
        .update({
          primary_telemetry_source: provider,
          resting_heart_rate: dailyMetrics.restingHeartRateBpm,
          updated_at: now,
        })
        .eq('user_id', userId)
    } catch (profileErr) {
      console.warn('[wearables/webhook] Profile update notice:', profileErr)
    }

    return NextResponse.json(
      {
        success: true,
        action: 'daily_biometrics_synced',
        provider,
        metrics: dailyMetrics,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch {
    return NextResponse.json({ error: 'Unexpected webhook error' }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
