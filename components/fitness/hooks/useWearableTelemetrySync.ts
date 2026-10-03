'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  computeWearableCnsScore,
  type DailyBiometricSummary,
  type WearableProvider,
} from '@/lib/wearables-telemetry'
import {
  isNativeMobile,
  autoInitializeNativeHealthKit,
  resolveSyncEndpoint,
} from '@/lib/native-healthkit-bridge'
import {
  normalizeAppleHealthIngestPayload,
  formatAppleHealthTelemetryToBiometricSummary,
  type RawAppleHealthIngestPayload,
} from '@/lib/apple-health-bridge'

export interface UseWearableTelemetrySyncResult {
  wearableTelemetry: DailyBiometricSummary | null
  liveReadinessScore: number | null
  refreshTelemetry: () => Promise<void>
  setWearableTelemetry: React.Dispatch<React.SetStateAction<DailyBiometricSummary | null>>
}

/**
 * Manages continuous inbound wearable telemetry synchronization from Apple Health,
 * Health Connect, Vital, or Whoop/Oura backends.
 */
export function useWearableTelemetrySync(): UseWearableTelemetrySyncResult {
  const [wearableTelemetry, setWearableTelemetry] = useState<DailyBiometricSummary | null>(null)

  const liveReadinessScore = useMemo(() => {
    return computeWearableCnsScore(
      wearableTelemetry?.hrvRmssdMs,
      wearableTelemetry?.restingHeartRate
    )
  }, [wearableTelemetry])

  const syncWearableTelemetry = useCallback(async () => {
    try {
      // 1. If running inside native iOS/Android mobile app, query Apple Health / Health Connect directly
      if (isNativeMobile()) {
        const initRes = await autoInitializeNativeHealthKit()
        if (initRes.telemetry) {
          const raw = initRes.telemetry
          const normalized = normalizeAppleHealthIngestPayload(raw as RawAppleHealthIngestPayload)
          const cns = computeWearableCnsScore(normalized.hrvRmssdMs, normalized.restingHeartRateBpm)
          const liveHr = normalized.currentHeartRateBpm ?? (raw as Record<string, unknown>)?.heart_rate as number | undefined ?? (raw as Record<string, unknown>)?.heartRate as number | undefined ?? null
          const summary: DailyBiometricSummary = {
            date: normalized.date,
            provider: 'apple_health',
            currentHeartRate: liveHr,
            restingHeartRate: normalized.restingHeartRateBpm,
            hrvRmssdMs: normalized.hrvRmssdMs,
            cnsStressScore: cns,
            sleepHours: normalized.sleep.totalHours,
            deepSleepHours: normalized.sleep.deepHours,
            bedtime: normalized.sleep.bedtime || null,
            wakeTime: normalized.sleep.wakeTime || null,
            stepsCount: normalized.stepCount,
            activeCaloriesKcal: normalized.activeEnergyBurnedKcal,
            nutrition: normalized.nutrition,
            updatedAt: new Date().toISOString(),
          }
          setWearableTelemetry(summary)

          // Persist to backend with Authorization header
          void (async () => {
            try {
              const { createClient } = await import('@/lib/supabase-browser')
              const supabase = createClient()
              const { data: { session } } = await supabase.auth.getSession()

              const headers: Record<string, string> = { 'Content-Type': 'application/json' }
              if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`
              }

              const syncEndpoint = resolveSyncEndpoint('/api/wearables/sync')
              await fetch(syncEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  provider: 'apple_health',
                  resting_heart_rate: normalized.restingHeartRateBpm,
                  hrv_rmssd: normalized.hrvRmssdMs,
                  sleep: normalized.sleep,
                  active_calories: normalized.activeEnergyBurnedKcal,
                  steps: normalized.stepCount,
                  nutrition: normalized.nutrition,
                  water_oz: normalized.nutrition.waterOz,
                  date: normalized.date,
                  synced_at: new Date().toISOString(),
                }),
              })
            } catch {}
          })()
        }
        return
      }

      // 2. Otherwise on Web/PWA, query backend status endpoint for Apple Health / Health Connect / Whoop / Oura synced telemetry
      const res = await fetch('/api/wearables/status')
      if (!res.ok) return
      const data = await res.json()

      const telemetryPayload = data.telemetry || data.connections?.[0]?.latestBiometrics || data.latestBiometrics
      if (telemetryPayload) {
        const rhr = telemetryPayload.restingHeartRate ?? telemetryPayload.resting_heart_rate
        const hrv = telemetryPayload.hrvRmssdMs ?? telemetryPayload.hrv_rmssd
        const cns = telemetryPayload.cnsStressScore ?? computeWearableCnsScore(hrv, rhr) ?? null
        const liveHr = telemetryPayload.currentHeartRate ?? telemetryPayload.current_heart_rate ?? telemetryPayload.heart_rate ?? null
        const summary: DailyBiometricSummary = {
          date: telemetryPayload.date || new Date().toISOString().slice(0, 10),
          provider: (telemetryPayload.provider || telemetryPayload.source_provider || data.primarySource || 'apple_health') as WearableProvider,
          currentHeartRate: typeof liveHr === 'number' ? liveHr : null,
          restingHeartRate: rhr ?? null,
          hrvRmssdMs: hrv ?? null,
          cnsStressScore: cns,
          sleepHours: telemetryPayload.sleepHours ?? telemetryPayload.sleep_hours ?? null,
          deepSleepHours: telemetryPayload.deepSleepHours ?? telemetryPayload.deep_sleep_hours ?? null,
          bedtime: telemetryPayload.bedtime ?? telemetryPayload.sleep?.bedtime ?? null,
          wakeTime: telemetryPayload.wakeTime ?? telemetryPayload.sleep?.wakeTime ?? null,
          stepsCount: telemetryPayload.stepsCount ?? telemetryPayload.steps ?? telemetryPayload.steps_count ?? null,
          activeCaloriesKcal: telemetryPayload.activeCaloriesKcal ?? telemetryPayload.active_calories ?? null,
          nutrition: telemetryPayload.nutrition ?? null,
          updatedAt: telemetryPayload.updatedAt || telemetryPayload.synced_at || new Date().toISOString(),
        }
        setWearableTelemetry(summary)
      }
    } catch {
      // Wearables auto-sync silent fallback
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const runSync = async () => {
      if (isMounted) {
        await syncWearableTelemetry()
      }
    }

    void runSync()

    // Query on window focus or visibility change
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void runSync()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', runSync)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // Periodic 5-minute background refresh
    const interval = setInterval(() => {
      void runSync()
    }, 5 * 60 * 1000)

    return () => {
      isMounted = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', runSync)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      clearInterval(interval)
    }
  }, [syncWearableTelemetry])

  return {
    wearableTelemetry,
    liveReadinessScore,
    refreshTelemetry: syncWearableTelemetry,
    setWearableTelemetry,
  }
}
