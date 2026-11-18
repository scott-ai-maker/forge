import { NextRequest, NextResponse } from 'next/server'
import { normalizeVitalDailyPayload } from '@/lib/vital-health-bridge'
import { sanitizeWearableRawPayload } from '@/lib/wearable-webhook-adapters'
import { verifySvixWebhookSignature } from '@/lib/webhook-security'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }
const MAX_VITAL_PAYLOAD_BYTES = 262_144

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: 'Forge Athletic Vital Health Ingestion Webhook',
      status: 'listening',
    },
    { headers: NO_STORE_HEADERS }
  )
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text()
    if (Buffer.byteLength(rawText, 'utf8') > MAX_VITAL_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Vital webhook payload exceeds maximum allowed size (256 KB)' },
        { status: 413, headers: NO_STORE_HEADERS }
      )
    }

    const authorized = verifySvixWebhookSignature({
      rawBody: rawText,
      headers: req.headers,
      secret: process.env.VITAL_WEBHOOK_SECRET,
      legacySecretHeaderNames: ['x-vital-webhook-secret'],
    })
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Vital webhook signature or secret' },
        { status: 401, headers: NO_STORE_HEADERS }
      )
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Webhook payload must be a JSON object' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    const payload = parsed as Record<string, unknown>

    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    const { userId, provider, summary, date } = normalizeVitalDailyPayload(payload, '')

    if (!userId) {
      return NextResponse.json({ error: 'Missing client user_id in payload' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const now = new Date().toISOString()

    // Upsert into athlete_wearable_metrics
    await admin.from('athlete_wearable_metrics').upsert(
      {
        client_id: userId,
        sample_date: date,
        provider,
        resting_heart_rate: summary.restingHeartRate,
        hrv_rmssd: summary.hrvRmssdMs,
        cns_stress_score: summary.cnsStressScore,
        readiness_score: summary.cnsStressScore,
        sleep_hours: summary.sleepHours,
        deep_sleep_hours: summary.deepSleepHours,
        steps_count: summary.stepsCount,
        active_calories_kcal: summary.activeCaloriesKcal,
        calories_consumed_kcal: summary.nutrition?.caloriesConsumedKcal,
        protein_grams: summary.nutrition?.proteinGrams,
        carbs_grams: summary.nutrition?.carbsGrams,
        fat_grams: summary.nutrition?.fatGrams,
        raw_payload: sanitizeWearableRawPayload(payload),
        synced_at: now,
      },
      { onConflict: 'client_id,sample_date,provider' }
    )

    // Update resting heart rate in profile
    if (summary.restingHeartRate) {
      await admin
        .from('fitness_profiles')
        .update({
          resting_heart_rate: summary.restingHeartRate,
          primary_telemetry_source: provider,
          updated_at: now,
        })
        .eq('user_id', userId)
    }

    return NextResponse.json(
      {
        success: true,
        action: 'vital_telemetry_ingested',
        provider,
        userId,
        date,
        summary,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch {
    return NextResponse.json({ error: 'Vital webhook error' }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

