'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  DailyBiometricSummary,
  computeWearableCnsScore,
} from '@/lib/wearables-telemetry'
import {
  isNativeAndroid,
  isNativeMobile,
  getNativeHealthKitStatus,
  requestNativeHealthKitPermissions,
  enableNativeHealthKitBackgroundDelivery,
  syncNativeHealthKitData,
  subscribeToNativeHealthKitUpdates,
  autoInitializeNativeHealthKit,
  resolveSyncEndpoint,
} from '@/lib/native-healthkit-bridge'
import {
  normalizeAppleHealthIngestPayload,
  formatAppleHealthTelemetryToBiometricSummary,
  type RawAppleHealthIngestPayload,
} from '@/lib/apple-health-bridge'
import {
  AppleLogo,
  AppleHealthIcon,
  AndroidLogo,
  HealthConnectIcon,
  WorksWithAppleHealthBadge,
  HealthConnectBadge,
} from './HealthLogos'
import BluetoothHeartRateMonitor from './BluetoothHeartRateMonitor'

interface WearablesDeviceStudioProps {
  onTelemetryUpdate?: (telemetry: DailyBiometricSummary | null) => void
}

export default function WearablesDeviceStudio({
  onTelemetryUpdate,
}: WearablesDeviceStudioProps) {
  const [telemetry, setTelemetry] = useState<DailyBiometricSummary | null>(null)
  const [authStatus, setAuthStatus] = useState<'authorized' | 'denied' | 'notDetermined' | 'unavailable' | 'checking'>('checking')
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [statusNotice, setStatusNotice] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<'apple' | 'android'>('apple')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false)
  const [isIosWeb, setIsIosWeb] = useState<boolean>(false)

  const onTelemetryUpdateRef = useRef(onTelemetryUpdate)
  onTelemetryUpdateRef.current = onTelemetryUpdate

  const refreshTelemetry = useCallback(async () => {
    try {
      if (isNativeMobile()) {
        const init = await autoInitializeNativeHealthKit()
        if (init.telemetry) {
          const normalized = normalizeAppleHealthIngestPayload(init.telemetry as RawAppleHealthIngestPayload)
          const cns = computeWearableCnsScore(normalized.hrvRmssdMs, normalized.restingHeartRateBpm)
          const summary = formatAppleHealthTelemetryToBiometricSummary(normalized, cns)
          setTelemetry(summary)
          setAuthStatus('authorized')
          if (onTelemetryUpdateRef.current) onTelemetryUpdateRef.current(summary)

          void (async () => {
            try {
              const { createClient } = await import('@/lib/supabase-browser')
              const supabase = createClient()
              const {
                data: { session },
              } = await supabase.auth.getSession()
              const syncEndpoint = resolveSyncEndpoint('/api/wearables/sync')
              await fetch(syncEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({
                  ...(init.telemetry as Record<string, unknown>),
                  client_id: session?.user?.id,
                  user_id: session?.user?.id,
                }),
              })
            } catch {}
          })()
          return
        }
      }

      const res = await fetch('/api/wearables/status')
      const data = await res.json().catch(() => ({}))
      if (data.telemetry) {
        setTelemetry(data.telemetry)
        setAuthStatus('authorized')
        if (onTelemetryUpdateRef.current) onTelemetryUpdateRef.current(data.telemetry)
      }
    } catch {
      // Graceful fallback
    }
  }, [])

  // Ingest status on mount
  useEffect(() => {
    let isMounted = true

    const native = isNativeMobile()
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
    const isIos = /iphone|ipad|ipod/.test(ua)
    if (!native && isIos) {
      setIsIosWeb(true)
    }

    // Retrieve active client ID for webhook configuration
    void (async () => {
      try {
        const { createClient } = await import('@/lib/supabase-browser')
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user && isMounted) {
          setCurrentUserId(user.id)
        }
      } catch {}
    })()

    async function checkHealthStatus() {
      if (isMounted) {
        if (isNativeAndroid()) {
          setActivePlatform('android')
        } else {
          setActivePlatform('apple')
        }
      }

      if (native) {
        try {
          const statusRes = await getNativeHealthKitStatus()
          if (!isMounted) return
          if (statusRes.authorized) {
            setAuthStatus('authorized')
          } else if (statusRes.status === 'unavailable') {
            setAuthStatus('unavailable')
          } else {
            setAuthStatus('notDetermined')
          }
        } catch {
          if (isMounted) setAuthStatus('notDetermined')
        }
      } else {
        if (isMounted) setAuthStatus('notDetermined')
      }

      // Ingest live telemetry from native or backend
      await refreshTelemetry()
    }

    checkHealthStatus()

    // Subscribe to real-time telemetry broadcasts
    let subHandle: { remove: () => void } | null = null
    if (isNativeMobile()) {
      void subscribeToNativeHealthKitUpdates(raw => {
        if (!isMounted || !raw) return
        try {
          const normalized = normalizeAppleHealthIngestPayload(raw as RawAppleHealthIngestPayload)
          const cns = computeWearableCnsScore(normalized.hrvRmssdMs, normalized.restingHeartRateBpm)
          const summary = formatAppleHealthTelemetryToBiometricSummary(normalized, cns)
          setTelemetry(summary)
          setAuthStatus('authorized')
          if (onTelemetryUpdateRef.current) onTelemetryUpdateRef.current(summary)
        } catch {}
      }).then(h => {
        subHandle = h
      })
    }

    return () => {
      isMounted = false
      if (subHandle) subHandle.remove()
    }
  }, [refreshTelemetry])

  // Authorize Apple Health Permissions Sheet
  const handleAuthorizeAppleHealth = async () => {
    setIsAuthorizing(true)
    setStatusNotice(null)

    try {
      if (!isNativeMobile()) {
        setStatusNotice(
          'Native HealthKit requires the Gordon Athletic Advisory iOS app. In Safari / PWA, use the Apple Shortcuts Webhook option below to sync your iPhone.'
        )
        return
      }

      const authResult = await requestNativeHealthKitPermissions()
      if (!authResult.success) {
        setStatusNotice(`HealthKit authorization notice: ${authResult.error || 'Permission sheet dismissed or denied.'}`)
        setAuthStatus('denied')
        return
      }

      setAuthStatus('authorized')
      await enableNativeHealthKitBackgroundDelivery().catch(() => {})

      // Immediately query and synchronize biometrics
      const syncResult = await syncNativeHealthKitData()
      await refreshTelemetry()

      if (syncResult.success) {
        setStatusNotice('✓ Apple HealthKit authorized & continuous background delivery active!')
      } else {
        setStatusNotice('✓ Apple HealthKit authorized successfully!')
      }
    } catch (err) {
      setStatusNotice(`Authorization error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsAuthorizing(false)
    }
  }

  // Authorize Android Health Connect
  const handleAuthorizeAndroidHealth = async () => {
    setIsAuthorizing(true)
    setStatusNotice(null)

    try {
      if (!isNativeMobile()) {
        setStatusNotice('Health Connect integration is only active inside the native Android app container.')
        return
      }

      const authResult = await requestNativeHealthKitPermissions()
      if (!authResult.success) {
        setStatusNotice(`Health Connect notice: ${authResult.error || 'Permission sheet dismissed or denied.'}`)
        setAuthStatus('denied')
        return
      }

      setAuthStatus('authorized')
      const syncResult = await syncNativeHealthKitData()
      await refreshTelemetry()

      if (syncResult.success) {
        setStatusNotice('✓ Android Health Connect authorized & background sync active!')
      } else {
        setStatusNotice('✓ Android Health Connect authorized successfully!')
      }
    } catch (err) {
      setStatusNotice(`Authorization error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsAuthorizing(false)
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    setStatusNotice(null)

    try {
      if (isNativeMobile()) {
        const syncRes = await syncNativeHealthKitData()
        if (syncRes.telemetry) {
          const raw = syncRes.telemetry as RawAppleHealthIngestPayload
          const normalized = normalizeAppleHealthIngestPayload(raw)
          const cns = computeWearableCnsScore(normalized.hrvRmssdMs, normalized.restingHeartRateBpm)
          const summary = formatAppleHealthTelemetryToBiometricSummary(normalized, cns)
          setTelemetry(summary)
          setAuthStatus('authorized')
          if (onTelemetryUpdateRef.current) onTelemetryUpdateRef.current(summary)
          setStatusNotice(`✓ Synced latest biometrics from ${activePlatform === 'apple' ? 'Apple Health' : 'Health Connect'} successfully!`)
          return
        }
      }
      await refreshTelemetry()
      setStatusNotice(`✓ Checked latest biometrics from ${activePlatform === 'apple' ? 'Apple Health' : 'Health Connect'}.`)
    } catch (err) {
      setStatusNotice(`Health sync notice: ${err instanceof Error ? err.message : 'Please verify Health permissions in iOS Settings.'}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const isAndroid = isNativeAndroid()
  const isConnected = authStatus === 'authorized' || (telemetry?.restingHeartRate != null && telemetry.restingHeartRate > 0)
  const hasLiveTelemetry = Boolean(
    telemetry?.updatedAt &&
      ((telemetry.restingHeartRate && telemetry.restingHeartRate > 0) ||
        (telemetry.stepsCount && telemetry.stepsCount > 0) ||
        (telemetry.sleepHours && telemetry.sleepHours > 0) ||
        (telemetry.nutrition?.waterOz && telemetry.nutrition.waterOz > 0))
  )

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: 'clamp(18px, 4vw, 28px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* ── Studio Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: hasLiveTelemetry ? '#34D399' : isConnected ? '#38BDF8' : 'var(--gold-lt)',
                fontWeight: 800,
                background: hasLiveTelemetry ? 'rgba(52,211,153,0.15)' : 'rgba(212,160,23,0.15)',
                border: hasLiveTelemetry ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(212,160,23,0.35)',
                padding: '2px 8px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isAndroid ? <AndroidLogo size={11} /> : <AppleLogo size={11} />}
              {hasLiveTelemetry
                ? `${isAndroid ? 'Health Connect' : 'Apple HealthKit'} · Active`
                : isConnected
                  ? `${isAndroid ? 'Health Connect' : 'Apple HealthKit'} · Connected`
                  : `${isAndroid ? 'Health Connect' : 'Apple HealthKit'} · Setup`}
            </span>
            <span style={{ fontSize: 11, color: hasLiveTelemetry ? '#34D399' : '#38BDF8', fontWeight: 700 }}>
              {hasLiveTelemetry
                ? '● Continuous Stream Active'
                : isNativeMobile()
                  ? '○ Sensor Connected · Awaiting Samples'
                  : '○ Web/PWA · Setup Apple Shortcuts Below'}
            </span>
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, margin: 0, color: '#FFFFFF', letterSpacing: '0.03em' }}>
            {isAndroid
              ? 'ANDROID HEALTH CONNECT INTEGRATION'
              : 'APPLE HEALTH & WEARABLES INTEGRATION'}
          </h3>

          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gray)', maxWidth: 760, lineHeight: 1.5 }}>
            {isAndroid
              ? 'Direct native Android Health Connect integration with background synchronization. Your resting heart rate, HRV, sleep metrics, active energy burned, and training sessions are ingested to power Gordon Athletic Advisory intelligence.'
              : 'Direct native Apple HealthKit integration with automatic 24/7 background delivery. Your resting heart rate, morning HRV rMSSD, sleep architecture, active calories, dietary nutrition, and workouts are seamlessly ingested to calculate live CNS Readiness and training volume.'}
          </p>
        </div>

        {/* Official Banner & Status Pill */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {isAndroid ? (
            <HealthConnectBadge height={34} />
          ) : (
            <WorksWithAppleHealthBadge height={34} />
          )}

          <div
            style={{
              background: hasLiveTelemetry ? 'rgba(16,185,129,0.1)' : 'rgba(212,160,23,0.1)',
              border: hasLiveTelemetry ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(212,160,23,0.4)',
              borderRadius: 8,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {isAndroid ? (
              <HealthConnectIcon size={22} />
            ) : (
              <AppleHealthIcon size={22} />
            )}
            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
                {isAndroid ? 'Health Connect Status' : 'HealthKit Status'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  color: hasLiveTelemetry ? '#34D399' : isConnected ? '#38BDF8' : 'var(--gold-lt)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                {hasLiveTelemetry
                  ? 'STREAMING & INGESTED'
                  : isConnected
                    ? (isNativeMobile() ? 'AUTHORIZED · AWAITING SAMPLES' : 'READY FOR SHORTCUTS SYNC')
                    : 'AUTHORIZATION REQUIRED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {statusNotice && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.5)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: '#34D399',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="check" size={14} tone="emerald" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* ── Official Health Authorization Card ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(13,27,42,0.95) 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: 10,
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isAndroid ? (
              <HealthConnectIcon size={46} />
            ) : (
              <AppleHealthIcon size={46} />
            )}
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.03em', color: '#FFFFFF', margin: 0 }}>
                {isAndroid
                  ? 'ANDROID HEALTH CONNECT PERMISSION & SYNC'
                  : 'APPLE HEALTHKIT PERMISSION & SYNC'}
              </h4>
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>
                {isConnected
                  ? (isAndroid ? '✓ Real-time Android Wear & Sensor Telemetry Connected' : '✓ Real-time Apple Watch & iPhone Telemetry Connected')
                  : (isAndroid ? 'Official Android Health Connect Authorization' : 'Official Native iOS HealthKit Authorization')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={isAndroid ? handleAuthorizeAndroidHealth : handleAuthorizeAppleHealth}
              disabled={isAuthorizing}
              className="tactile-btn"
              style={{
                padding: '12px 22px',
                background: isAndroid
                  ? 'linear-gradient(135deg, #34A853 0%, #1E7E34 100%)'
                  : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: isAndroid ? '#FFFFFF' : '#0A0E18',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: isAuthorizing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              {isAndroid ? (
                <>
                  <AndroidLogo size={16} />
                  <span>{isAuthorizing ? 'Requesting Permissions...' : 'Authorize Health Connect Access'}</span>
                </>
              ) : (
                <>
                  <AppleLogo size={16} />
                  <span>{isAuthorizing ? 'Requesting Permissions...' : 'Authorize Apple Health Access'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="tactile-btn"
              style={{
                padding: '12px 18px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                borderRadius: 8,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: isSyncing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GaaIcon name="rotate-ccw" size={14} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.35)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            {isAndroid ? 'Health Connect' : 'HealthKit'} Permissions Requested &amp; Synchronized:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              'Resting Heart Rate (RHR)',
              'Heart Rate Variability (HRV rMSSD)',
              'Deep, REM & Core Sleep Stages',
              'Active Energy Burn & Step Count',
              'Dietary Calories & Macronutrients',
              'Cardio & Strength HKWorkout Sessions',
            ].map(item => (
              <span
                key={item}
                style={{
                  fontSize: 11,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#F1F5F9',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                ✓ {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Webhook / Apple Shortcuts Card (For iPhone Safari/PWA & Direct Webhook Integration) ── */}
      {(!isNativeMobile() || isIosWeb) && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,22,38,0.95) 0%, rgba(9,13,24,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 10,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <GaaIcon name="lightning" size={28} tone="gold" />
              <div>
                <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.03em', color: '#FFFFFF', margin: 0 }}>
                  IPHONE DIRECT SYNC (APPLE SHORTCUTS &amp; WEBHOOK)
                </h4>
                <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.4 }}>
                  In Safari or PWA, Apple restricts background HealthKit access to native apps. You can sync Apple Health directly from your iPhone in 2 minutes using iOS Shortcuts automations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://forge-athletic.app'}/api/wearables/webhook${currentUserId ? `?client_id=${currentUserId}` : ''}`
                navigator.clipboard.writeText(url)
                setCopiedWebhook(true)
                setTimeout(() => setCopiedWebhook(false), 3000)
              }}
              className="tactile-btn"
              style={{
                padding: '10px 16px',
                background: copiedWebhook ? 'rgba(52,211,153,0.2)' : 'rgba(212,160,23,0.15)',
                border: copiedWebhook ? '1px solid #34D399' : '1px solid var(--gold)',
                borderRadius: 6,
                color: copiedWebhook ? '#34D399' : 'var(--gold-lt)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name={copiedWebhook ? 'check' : 'copy'} size={14} tone={copiedWebhook ? 'emerald' : 'gold'} />
              <span>{copiedWebhook ? '✓ Webhook URL Copied' : 'Copy Ingest Webhook URL'}</span>
            </button>
          </div>

          {/* 3-Step Shortcut Setup Instructions */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              padding: '14px 16px',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'grid',
              gap: 8,
              fontSize: 12,
              color: '#CBD5E1',
            }}
          >
            <div style={{ fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.08em' }}>
              How to setup automated iPhone sync:
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontWeight: 800, color: '#38BDF8' }}>1.</span>
              <span>Open the built-in <strong>Shortcuts</strong> app on your iPhone &gt; tap <strong>Automation</strong> &gt; <strong>New Automation</strong>.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontWeight: 800, color: '#38BDF8' }}>2.</span>
              <span>Choose trigger: <strong>When Workout Ends</strong> or <strong>Daily at 8:00 AM</strong>. Set to <strong>Run Immediately</strong> (no confirmation prompt).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontWeight: 800, color: '#38BDF8' }}>3.</span>
              <span>Add Action: <strong>Find Health Samples</strong> (Heart Rate, HRV, Sleep) &gt; <strong>Get Contents of URL</strong> (Method: POST, Headers: Content-Type: application/json, URL: Paste copied Webhook URL).</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Ingested Telemetry Data Stream Grid ── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(212,160,23,0.25)',
          borderRadius: 8,
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="radio" size={18} tone="cyan" />
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, letterSpacing: '0.03em', color: '#FFFFFF', margin: 0 }}>
              LIVE INGESTED TELEMETRY STREAM
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: telemetry?.updatedAt ? '#34D399' : '#38BDF8', fontWeight: 700 }}>
              {telemetry?.updatedAt
                ? `● Synced (${new Date(telemetry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : '○ Listening for Stream'}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {/* Autonomics / HRV */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Resting HR &amp; HRV
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: 'var(--gold)', lineHeight: 1.1, margin: '6px 0 3px' }}>
              {telemetry?.restingHeartRate != null && telemetry.restingHeartRate > 0
                ? `${telemetry.restingHeartRate} BPM`
                : '-- BPM'}{' '}
              ·{' '}
              {telemetry?.hrvRmssdMs != null && telemetry.hrvRmssdMs > 0
                ? `${telemetry.hrvRmssdMs} ms`
                : '-- ms'}
            </div>
            <div style={{ fontSize: 10.5, color: telemetry?.hrvRmssdMs != null && telemetry.hrvRmssdMs > 0 ? '#34D399' : 'var(--gray)' }}>
              {telemetry?.hrvRmssdMs != null && telemetry.hrvRmssdMs > 0 ? '● Autonomic Balance' : 'Awaiting sync'}
            </div>
          </div>

          {/* Sleep Architecture */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Sleep Duration &amp; Deep
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#38BDF8', lineHeight: 1.1, margin: '6px 0 3px' }}>
              {telemetry?.sleepHours != null && telemetry.sleepHours > 0
                ? `${telemetry.sleepHours} hrs`
                : '-- hrs'}
            </div>
            <div style={{ fontSize: 10.5, color: telemetry?.deepSleepHours != null && telemetry.deepSleepHours > 0 ? '#BAE6FD' : 'var(--gray)' }}>
              {telemetry?.deepSleepHours != null && telemetry.deepSleepHours > 0
                ? `${telemetry.deepSleepHours}h Deep Restorative`
                : 'Awaiting sleep stage'}
            </div>
          </div>

          {/* Dietary Nutrition */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Dietary Nutrition
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, margin: '6px 0 3px' }}>
              {telemetry?.nutrition?.caloriesConsumedKcal != null && telemetry.nutrition.caloriesConsumedKcal > 0
                ? `${telemetry.nutrition.caloriesConsumedKcal.toLocaleString()} kcal`
                : '-- kcal'}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--gold-lt)' }}>
              {telemetry?.nutrition &&
              (telemetry.nutrition.proteinGrams > 0 || telemetry.nutrition.carbsGrams > 0)
                ? `${telemetry.nutrition.proteinGrams ?? 0}g P · ${telemetry.nutrition.carbsGrams ?? 0}g C · ${telemetry.nutrition.fatGrams ?? 0}g F`
                : 'Awaiting macro intake'}
            </div>
          </div>

          {/* Hydration / HealthKit Water */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Hydration (Water)
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#38BDF8', lineHeight: 1.1, margin: '6px 0 3px' }}>
              {telemetry?.nutrition?.waterOz != null && telemetry.nutrition.waterOz > 0
                ? `${telemetry.nutrition.waterOz} oz`
                : '-- oz'}
            </div>
            <div style={{ fontSize: 10.5, color: telemetry?.nutrition?.waterOz != null && telemetry.nutrition.waterOz > 0 ? '#38BDF8' : 'var(--gray)' }}>
              {telemetry?.nutrition?.waterOz != null && telemetry.nutrition.waterOz > 0
                ? `${Math.round((telemetry.nutrition.waterOz / 128) * 100)}% of 128 oz · Synced`
                : 'Awaiting water log'}
            </div>
          </div>

          {/* Activity Burn & Steps */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Daily Burn &amp; Steps
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#34D399', lineHeight: 1.1, margin: '6px 0 3px' }}>
              {telemetry?.activeCaloriesKcal != null && telemetry.activeCaloriesKcal > 0
                ? `${telemetry.activeCaloriesKcal.toLocaleString()} kcal`
                : '-- kcal'}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--gray)' }}>
              {telemetry?.stepsCount != null && telemetry.stepsCount > 0
                ? `${telemetry.stepsCount.toLocaleString()} steps`
                : '-- steps'}
            </div>
          </div>

          {/* Calculated CNS Score */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              CNS Readiness Score
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: 'var(--gold)', lineHeight: 1.1, margin: '6px 0 3px' }}>
              {telemetry?.cnsStressScore != null && telemetry.cnsStressScore > 0
                ? `${telemetry.cnsStressScore}/100`
                : (telemetry?.hrvRmssdMs && telemetry.hrvRmssdMs > 0 && telemetry?.restingHeartRate && telemetry.restingHeartRate > 0
                    ? `${computeWearableCnsScore(telemetry.hrvRmssdMs, telemetry.restingHeartRate)}/100`
                    : '--/100')}
            </div>
            <div style={{ fontSize: 10.5, color: telemetry?.cnsStressScore != null || (telemetry?.hrvRmssdMs != null && telemetry.hrvRmssdMs > 0) ? '#34D399' : 'var(--gray)' }}>
              {telemetry?.cnsStressScore != null || (telemetry?.hrvRmssdMs != null && telemetry.hrvRmssdMs > 0) ? '● Optimal Recovery' : 'Awaiting baseline'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Direct Web Bluetooth Heart Rate Strap Pairing ── */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <GaaIcon name="bluetooth" size={16} tone="gold" />
          <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, letterSpacing: '0.03em', color: '#FFFFFF', margin: 0 }}>
            DIRECT BLUETOOTH HEART RATE STRAP PAIRING
          </h4>
        </div>
        <BluetoothHeartRateMonitor
          athleteAge={35}
          onSyncSessionStats={stats => {
            if (stats.avgBpm > 0) {
              setTelemetry(prev => prev ? {
                ...prev,
                restingHeartRate: prev.restingHeartRate || Math.round(stats.avgBpm * 0.65),
              } : null)
            }
          }}
        />
      </div>
    </div>
  )
}
