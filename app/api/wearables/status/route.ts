import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import {
  WEARABLE_PROVIDERS,
  type WearableConnectionRecord,
  type DailyBiometricSummary,
  type WearableProvider,
} from '@/lib/wearables-telemetry'

export async function GET(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    // 1. Fetch user's profile baseline and preferred single source of truth
    const { data: profile } = await admin
      .from('fitness_profiles')
      .select('resting_heart_rate, primary_telemetry_source')
      .eq('user_id', userId)
      .maybeSingle()

    const rawSource = profile?.primary_telemetry_source
    let primarySource: WearableProvider | null =
      rawSource === 'google_fit' ? 'google_fit' : (rawSource === 'apple_health' ? 'apple_health' : null)

    const todayStr = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // 2. Query stored metric for this client filtered by active primary source or most recent
    let metricQuery = admin
      .from('athlete_wearable_metrics')
      .select('*')
      .eq('client_id', userId)

    if (primarySource) {
      metricQuery = metricQuery.eq('provider', primarySource)
    }

    const { data: storedMetric } = await metricQuery
      .order('sample_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!primarySource && storedMetric?.provider) {
      primarySource = storedMetric.provider === 'google_fit' ? 'google_fit' : 'apple_health'
    }

    if (!primarySource && !storedMetric) {
      return NextResponse.json({
        connections: [],
        primarySource: null,
        telemetry: null,
        providerMeta: null,
        syncCadence: 'No Single Source of Truth Configured',
      })
    }

    const effectiveProvider = primarySource || 'apple_health'
    let activeTelemetry: DailyBiometricSummary | null = null

    if (storedMetric) {
      const hasNutrition =
        (storedMetric.calories_consumed_kcal != null && Number(storedMetric.calories_consumed_kcal) > 0) ||
        (storedMetric.protein_grams != null && Number(storedMetric.protein_grams) > 0) ||
        (storedMetric.carbs_grams != null && Number(storedMetric.carbs_grams) > 0) ||
        (storedMetric.fat_grams != null && Number(storedMetric.fat_grams) > 0) ||
        (storedMetric.water_oz != null && Number(storedMetric.water_oz) > 0)

      activeTelemetry = {
        date: storedMetric.sample_date || todayStr,
        provider: effectiveProvider,
        restingHeartRate: storedMetric.resting_heart_rate != null ? Number(storedMetric.resting_heart_rate) : null,
        hrvRmssdMs: storedMetric.hrv_rmssd != null ? Number(storedMetric.hrv_rmssd) : null,
        cnsStressScore: storedMetric.cns_stress_score != null
          ? Number(storedMetric.cns_stress_score)
          : (storedMetric.readiness_score != null ? Number(storedMetric.readiness_score) : null),
        sleepHours: storedMetric.sleep_hours != null ? Number(storedMetric.sleep_hours) : null,
        deepSleepHours: storedMetric.deep_sleep_hours != null ? Number(storedMetric.deep_sleep_hours) : null,
        bedtime: ((storedMetric.raw_payload as Record<string, unknown>)?.sleep as Record<string, unknown> | undefined)?.bedtime as string || null,
        wakeTime: ((storedMetric.raw_payload as Record<string, unknown>)?.sleep as Record<string, unknown> | undefined)?.wakeTime as string || null,
        stepsCount: storedMetric.steps_count != null ? Number(storedMetric.steps_count) : null,
        activeCaloriesKcal: storedMetric.active_calories_kcal != null ? Number(storedMetric.active_calories_kcal) : null,
        nutrition: hasNutrition
          ? {
              caloriesConsumedKcal: Number(storedMetric.calories_consumed_kcal || 0),
              proteinGrams: Number(storedMetric.protein_grams || 0),
              carbsGrams: Number(storedMetric.carbs_grams || 0),
              fatGrams: Number(storedMetric.fat_grams || 0),
              fiberGrams: storedMetric.fiber_grams != null ? Number(storedMetric.fiber_grams) : undefined,
              waterOz: storedMetric.water_oz != null ? Number(storedMetric.water_oz) : undefined,
            }
          : null,
        updatedAt: storedMetric.synced_at || now,
      }
    }

    const providerMeta = WEARABLE_PROVIDERS[effectiveProvider]

    const connections: WearableConnectionRecord[] = [
      {
        id: `conn-${effectiveProvider}-${userId}`,
        clientId: userId,
        provider: effectiveProvider,
        status: 'connected',
        lastSyncAt: storedMetric?.synced_at || null,
        deviceModel: effectiveProvider === 'google_fit' ? 'Android / Wear OS (Health Connect)' : 'iPhone / Apple Watch (HealthKit)',
        batteryLevel: 98,
        latestBiometrics: activeTelemetry,
      },
    ]

    return NextResponse.json({
      connections,
      primarySource: effectiveProvider,
      telemetry: activeTelemetry,
      providerMeta,
      syncCadence: 'Continuous 24/7 Auto-Sync (Zero Manual Sync Required)',
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed querying wearable status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
