import { NextRequest, NextResponse } from 'next/server'
import { normalizeVitalDailyPayload } from '@/lib/vital-health-bridge'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Gordon Athletic Advisory Vital Health Ingestion Webhook',
    status: 'listening',
  })
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text()
    let payload: Record<string, unknown>

    try {
      payload = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    const { userId, provider, summary, date } = normalizeVitalDailyPayload(payload, '')

    if (!userId) {
      return NextResponse.json({ error: 'Missing client user_id in payload' }, { status: 400 })
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
        raw_payload: payload,
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

    return NextResponse.json({
      success: true,
      action: 'vital_telemetry_ingested',
      provider,
      userId,
      date,
      summary,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vital webhook error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

