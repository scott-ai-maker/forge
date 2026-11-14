/**
 * Forge Athletic — Unified Cross-Platform Client Telemetry Engine
 *
 * Covers PWA (Web), Apple iOS (Mobile Safari, Standalone PWA, WKWebView / Capacitor),
 * and Google Android (Mobile Chrome, Play Store TWA, Capacitor).
 *
 * Core guarantees:
 * - Standardized envelope with UUIDv4 `event_id` for strict backend idempotency (`ON CONFLICT DO NOTHING`)
 * - Recursive `NaN` / `Infinity` / `undefined` landmark sanitization prior to serialization
 * - Durable IndexedDB offline queue with automatic `localStorage` fallback
 * - Immediate flush for high-priority clinical/workout events; `10s` / `10 events` low-priority batching for high-frequency streams
 * - Jittered exponential backoff (`1s → 2s → 4s → 16s → 60s`)
 * - Explicit `Authorization: Bearer <token>` header caching so iOS ITP / WKWebView cookie policies never cause silent `401` drops
 * - `visibilitychange` (`hidden`) + `pagehide` + Capacitor `appStateChange` `keepalive` flushing (zero `beforeunload` usage)
 */

import { APP_VERSION } from '@/lib/app-version'
import { flushOfflineQueue, getPendingQueueCount } from '@/lib/offline-sync-queue'
import {
  acknowledgeTelemetryEvents,
  enqueueTelemetryEnvelope,
  getActiveStorageEngine,
  getQueuedEnvelopesSync,
  getTelemetryQueueDepthSync,
  hydrateTelemetryQueue,
  incrementEnvelopeRetryCounts,
  purgeTelemetryQueue,
  stageTelemetryEnvelopeSync,
  __resetTelemetryQueueForTests,
  type QueuedTelemetryEnvelope,
  type TelemetryStorageEngine,
} from './telemetryQueue'

export type TelemetryPlatform =
  | 'ios_app'
  | 'android_app'
  | 'pwa_standalone'
  | 'mobile_web'
  | 'desktop_web'

export interface TelemetryLandmarkDelta {
  index: number
  name?: string
  x: number | null
  y: number | null
  z?: number | null
  visibility?: number | null
  delta_deg?: number | null
}

export interface TelemetryEventMap {
  posture_scan_completed: {
    scan_mode: 'quick_check' | 'full_33_point_mesh' | 'baseline_intake'
    overall_posture_score: number | null
    forward_head_tilt_deg: number | null
    shoulder_symmetry_deg: number | null
    pelvic_symmetry_deg: number | null
    knee_alignment_deg?: number | null
    joint_deltas_33?: TelemetryLandmarkDelta[] | Record<string, number | null>
    improvement_summary?: string | null
  }
  desk_ergonomics_completed: {
    workstation_score: number
    strain_level: 'optimal' | 'moderate_strain' | 'high_strain'
    strain_flags: string[]
    ear_shoulder_angle_deg: number | null
    shoulder_protraction_deg: number | null
    elbow_angle_deg: number | null
    seated_hip_angle_deg: number | null
    workstation_label?: string
  }
  readiness_check_completed: {
    readiness_index: number
    movement_type: string
    peak_rom_deltas: Record<
      string,
      {
        measured_deg: number | null
        baseline_deg: number | null
        delta_deg: number | null
        severity: string
      }
    >
    restriction_flags: string[]
    injected_warmup_drills: Array<{
      id: string
      title: string
      duration_sec: number
    }>
    express_mode_active?: boolean
  }
  workout_completed: {
    workout_plan_id?: string | null
    session_date: string
    opt_phase: number
    express_20m: boolean
    environment_profile: string
    rpe: number | null
    duration_mins: number | null
    completed: boolean
    exercises_logged_count?: number
  }
  set_logged: {
    workout_plan_id?: string | null
    session_date: string
    exercise_name: string
    set_number: number
    reps: number | null
    weight_kg: number | null
    rpe: number | null
    duration_seconds?: number | null
    rest_seconds?: number | null
    opt_phase: number
    express_20m: boolean
    environment_profile: string
  }
  joint_comfort_logged: {
    comfort_score: number
    comfort_label: string
    joint_region?: string
    notes?: string | null
  }
  desk_reset_completed: {
    duration_sec: number
    drills_completed: number
    strain_flags_targeted: string[]
    environment_profile?: string
  }
  form_lab_uploaded: {
    lift_name: string
    camera_angle: string
    duration_sec?: number | null
    priority_sla: boolean
    has_notes: boolean
  }
  live_studio_telemetry: {
    session_id?: string
    bitrate_kbps: number | null
    resolution: string | null
    fps: number | null
    rtt_ms?: number | null
    packet_loss_ratio?: number | null
    quality_grade?: string
    studio_lut_preset: string
    background_mode: string
  }
  client_runtime_diagnostic: {
    diagnostic_kind:
      | 'camera_permission'
      | 'fps_drop'
      | 'webgl_fallback'
      | 'exception'
      | 'camera_lifecycle_release'
      | 'diagnostic_ping'
    camera_permission_state?: string | null
    fps?: number | null
    webgl_fallback_reason?: string | null
    error_name?: string | null
    error_message?: string | null
    error_digest?: string | null
    component_context?: string | null
    ping_tag?: string | null
  }
}

export type TelemetryEventType = keyof TelemetryEventMap

export const HIGH_PRIORITY_TELEMETRY_EVENTS: ReadonlySet<TelemetryEventType> = new Set([
  'workout_completed',
  'posture_scan_completed',
  'desk_ergonomics_completed',
  'readiness_check_completed',
  'form_lab_uploaded',
])

export const BACKOFF_SCHEDULE_MS = [1_000, 2_000, 4_000, 16_000, 60_000] as const
export const BATCH_FLUSH_THRESHOLD = 10
export const BATCH_FLUSH_INTERVAL_MS = 10_000
const KEEPALIVE_SAFE_BYTE_LIMIT = 56_000
const SESSION_STORAGE_ID_KEY = 'forge_telemetry_session_id_v1'
export const TELEMETRY_SW_SYNC_TAG = 'forge-telemetry-sync'
export const TELEMETRY_CAMERA_RELEASE_EVENT = 'forge:release-camera-hardware'

export interface TelemetryFlushStatus {
  httpStatus: number | null
  ok: boolean | null
  latencyMs: number | null
  timestamp: string | null
  acceptedCount: number
  error: string | null
}

export interface TelemetryHealthSnapshot {
  platform: TelemetryPlatform
  platformLabel: string
  appVersion: string
  sessionId: string
  userId: string | null
  hasAuthToken: boolean
  isOnline: boolean
  networkType: string
  serviceWorkerState: 'active' | 'installing' | 'waiting' | 'unregistered' | 'bypassed_native' | 'unsupported'
  storageEngine: TelemetryStorageEngine
  queueDepth: number
  telemetryQueueDepth: number
  offlineSetQueueDepth: number
  retryAttempt: number
  nextRetryAt: string | null
  lastFlushStatus: TelemetryFlushStatus
  lastSyncedAt: string | null
  cvCapability: {
    webgl2: boolean
    avg_camera_fps: number | null
  }
}

export interface TelemetryDiagnosticPingResult {
  verified: boolean
  eventId: string
  httpStatus: number | null
  roundTripMs: number
  serverReceivedAt: string | null
  storageMode: string | null
  error?: string
}

export interface TrackEventOptions {
  eventId?: string
  immediate?: boolean
}

export interface FlushTelemetryOptions {
  reason?: 'high_priority' | 'batch_threshold' | 'batch_timer' | 'manual' | 'online' | 'foreground' | 'retry' | 'diagnostic_ping'
  interactive?: boolean
}

// ── Internal Runtime State ──
let cachedUserId: string | null = null
let cachedAccessToken: string | null = null
let cachedSessionId: string | null = null
let cachedWebGl2Support: boolean | null = null
let cachedNativeNetworkType: string | null = null
let cachedServiceWorkerState: TelemetryHealthSnapshot['serviceWorkerState'] = 'unsupported'
const fpsSamples: number[] = []
const MAX_FPS_SAMPLES = 30

let batchTimerId: ReturnType<typeof setTimeout> | null = null
let retryTimerId: ReturnType<typeof setTimeout> | null = null
let currentRetryAttempt = 0
let nextRetryAtIso: string | null = null
let activeFlushPromise: Promise<TelemetryFlushStatus> | null = null
let lifecycleCleanup: (() => void) | null = null
let lastExceptionAtMs = 0

let lastFlushStatus: TelemetryFlushStatus = {
  httpStatus: null,
  ok: null,
  latencyMs: null,
  timestamp: null,
  acceptedCount: 0,
  error: null,
}
let lastSyncedAtIso: string | null = null

const healthListeners = new Set<(snapshot: TelemetryHealthSnapshot) => void>()

function notifyHealthListeners(): void {
  if (healthListeners.size === 0) return
  const snapshot = getTelemetryHealth()
  for (const listener of healthListeners) {
    try {
      listener(snapshot)
    } catch {
      // Isolate listener errors
    }
  }
}

/**
 * RFC 4122 UUIDv4 generator using `crypto.randomUUID()` with `crypto.getRandomValues` fallback.
 */
export function generateTelemetryUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Formats a Date as ISO-8601 including the local timezone offset (e.g. `2026-11-13T21:42:10.123-05:00`).
 */
export function formatIsoWithLocalOffset(date: Date = new Date()): {
  isoWithOffset: string
  timezoneOffsetMins: number
} {
  const rawOffset = date.getTimezoneOffset() // Minutes behind UTC (e.g. +300 for EST UTC-5)
  const localOffsetMins = -rawOffset === 0 ? 0 : -rawOffset
  const sign = localOffsetMins >= 0 ? '+' : '-'
  const absMins = Math.abs(localOffsetMins)
  const offsetHours = String(Math.floor(absMins / 60)).padStart(2, '0')
  const offsetRemMins = String(absMins % 60).padStart(2, '0')

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')

  return {
    isoWithOffset: `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${offsetHours}:${offsetRemMins}`,
    timezoneOffsetMins: localOffsetMins,
  }
}

/**
 * Auto-detects the client runtime platform across iOS wrapper, Android TWA/wrapper,
 * standalone PWA, mobile browser, and desktop browser.
 */
export function detectTelemetryPlatform(overrides?: {
  userAgent?: string
  referrer?: string
  isStandalone?: boolean
  capacitorPlatform?: string | null
  isNativeCapacitor?: boolean
  hasWebkitBridge?: boolean
}): TelemetryPlatform {
  if (typeof window === 'undefined' && !overrides) {
    return 'desktop_web'
  }

  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {}
  const cap = win.Capacitor as
    | { isNativePlatform?: () => boolean; getPlatform?: () => string }
    | undefined

  const isNativeCap =
    overrides?.isNativeCapacitor ??
    (typeof cap?.isNativePlatform === 'function' ? cap.isNativePlatform() : false)
  const capPlatform =
    overrides?.capacitorPlatform ??
    (typeof cap?.getPlatform === 'function' ? cap.getPlatform() : null)

  if (isNativeCap) {
    if (capPlatform === 'ios') return 'ios_app'
    if (capPlatform === 'android') return 'android_app'
  }

  const ua =
    overrides?.userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '')
  const referrer =
    overrides?.referrer ??
    (typeof document !== 'undefined' ? document.referrer || '' : '')

  // Google Play Store Trusted Web Activity (TWA) or Android WebView wrapper
  if (
    referrer.startsWith('android-app://') ||
    /ForgeAthletic-Android/i.test(ua) ||
    (/Android/i.test(ua) && /;\s*wv\)/i.test(ua))
  ) {
    return 'android_app'
  }

  // Apple App Store WKWebView wrapper detection
  const hasWebkitHandlers =
    overrides?.hasWebkitBridge ??
    Boolean(
      typeof window !== 'undefined' &&
        (window as unknown as { webkit?: { messageHandlers?: Record<string, unknown> } }).webkit
          ?.messageHandlers
    )
  if (/ForgeAthletic-iOS/i.test(ua) || (/iPhone|iPad|iPod/i.test(ua) && hasWebkitHandlers && !/Safari\//i.test(ua))) {
    return 'ios_app'
  }

  // Installed Standalone PWA (iOS Home Screen / Android WebAPK / Desktop PWA)
  const standalone =
    overrides?.isStandalone ??
    Boolean(
      typeof window !== 'undefined' &&
        ((typeof window.matchMedia === 'function' &&
          (window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches)) ||
          (typeof navigator !== 'undefined' &&
            (navigator as Navigator & { standalone?: boolean }).standalone === true))
    )

  if (standalone) {
    return 'pwa_standalone'
  }

  if (/iPhone|iPad|iPod|Android|Mobile|Silk|Kindle/i.test(ua)) {
    return 'mobile_web'
  }

  return 'desktop_web'
}

export function formatPlatformLabel(platform: TelemetryPlatform): string {
  switch (platform) {
    case 'ios_app':
      return 'iOS App'
    case 'android_app':
      return 'Android App'
    case 'pwa_standalone':
      return 'PWA Standalone'
    case 'mobile_web':
      return 'Mobile Web'
    case 'desktop_web':
      return 'Desktop Web'
  }
}

/**
 * Recursively strips `undefined` keys and normalizes `NaN` / `Infinity` / `-Infinity`
 * to `null` so occluded MediaPipe 33-point landmarks or divide-by-zero frame deltas
 * never cause JSON serialization corruption or backend Zod batch rejections.
 */
export function sanitizeTelemetryPayload<T>(input: T, depth = 0, seen = new WeakSet<object>()): T {
  if (depth > 12) return null as unknown as T

  if (input === null || input === undefined) {
    return null as unknown as T
  }

  if (typeof input === 'number') {
    return (Number.isFinite(input) ? input : null) as unknown as T
  }

  if (typeof input === 'string') {
    const trimmed = input.length > 4096 ? `${input.slice(0, 4093)}...` : input
    return trimmed as unknown as T
  }

  if (typeof input === 'boolean') {
    return input
  }

  if (typeof input === 'bigint') {
    const num = Number(input)
    return (Number.isFinite(num) ? num : null) as unknown as T
  }

  if (typeof input === 'function' || typeof input === 'symbol') {
    return null as unknown as T
  }

  if (input instanceof Date) {
    return (Number.isFinite(input.getTime()) ? input.toISOString() : null) as unknown as T
  }

  if (Array.isArray(input)) {
    return input.map(item =>
      item === undefined ? null : sanitizeTelemetryPayload(item, depth + 1, seen)
    ) as unknown as T
  }

  if (typeof input === 'object') {
    if (seen.has(input as object)) {
      return null as unknown as T
    }
    seen.add(input as object)

    const out: Record<string, unknown> = {}
    for (const [key, rawVal] of Object.entries(input as Record<string, unknown>)) {
      if (rawVal === undefined || typeof rawVal === 'function' || typeof rawVal === 'symbol') {
        continue
      }
      out[key] = sanitizeTelemetryPayload(rawVal, depth + 1, seen)
    }
    return out as unknown as T
  }

  return null as unknown as T
}

function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId
  try {
    if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
      const existing = window.sessionStorage.getItem(SESSION_STORAGE_ID_KEY)
      if (existing) {
        cachedSessionId = existing
        return existing
      }
      const created = generateTelemetryUuid()
      window.sessionStorage.setItem(SESSION_STORAGE_ID_KEY, created)
      cachedSessionId = created
      return created
    }
  } catch {
    // Private browsing or sandboxed iframe
  }
  cachedSessionId = generateTelemetryUuid()
  return cachedSessionId
}

function detectWebGl2Support(): boolean {
  if (cachedWebGl2Support !== null) return cachedWebGl2Support
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    const supported = Boolean(gl)
    if (gl && typeof gl.getExtension === 'function') {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
    cachedWebGl2Support = supported
    return supported
  } catch {
    cachedWebGl2Support = false
    return false
  }
}

export function recordCameraFpsSample(fps: number): void {
  if (!Number.isFinite(fps) || fps < 0 || fps > 240) return
  fpsSamples.push(Math.round(fps * 10) / 10)
  if (fpsSamples.length > MAX_FPS_SAMPLES) {
    fpsSamples.shift()
  }
}

function getAverageCameraFps(): number | null {
  if (fpsSamples.length === 0) return null
  const total = fpsSamples.reduce((acc, v) => acc + v, 0)
  return Math.round((total / fpsSamples.length) * 10) / 10
}

function detectNetworkType(): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'offline'
  }
  if (cachedNativeNetworkType) {
    return cachedNativeNetworkType
  }
  if (typeof navigator !== 'undefined') {
    const conn = (
      navigator as Navigator & {
        connection?: { effectiveType?: string; type?: string }
      }
    ).connection
    if (conn?.effectiveType) return conn.effectiveType
    if (conn?.type) return conn.type
  }
  return 'online'
}

/**
 * Updates cached authentication context so telemetry and background `keepalive` flushes
 * always carry an explicit `Authorization: Bearer <token>` header (immune to iOS ITP / WKWebView cookie blocking).
 */
export function setTelemetryAuthContext(ctx: {
  userId: string | null
  accessToken: string | null
}): void {
  cachedUserId = ctx.userId
  cachedAccessToken = ctx.accessToken
  notifyHealthListeners()
}

/**
 * Returns HTTP headers with explicit `Authorization` bearer token when available.
 * Safe to call synchronously in `keepalive` flush paths or workout API mutations.
 */
export function getTelemetryAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (cachedAccessToken) {
    headers.Authorization = `Bearer ${cachedAccessToken}`
  }
  return headers
}

/**
 * Computes jittered exponential backoff (`1s → 2s → 4s → 16s → 60s` ±15% jitter).
 */
export function computeRetryBackoffMs(attemptIndex: number, randomFn: () => number = Math.random): number {
  const clampedIdx = Math.max(0, Math.min(attemptIndex, BACKOFF_SCHEDULE_MS.length - 1))
  const baseMs = BACKOFF_SCHEDULE_MS[clampedIdx]
  const jitterFactor = 0.85 + Math.max(0, Math.min(1, randomFn())) * 0.3
  return Math.round(baseMs * jitterFactor)
}

function clearBatchTimer(): void {
  if (batchTimerId !== null) {
    clearTimeout(batchTimerId)
    batchTimerId = null
  }
}

function clearRetryTimer(): void {
  if (retryTimerId !== null) {
    clearTimeout(retryTimerId)
    retryTimerId = null
  }
  nextRetryAtIso = null
}

function scheduleRetryBackoff(): void {
  if (retryTimerId !== null) return
  const delayMs = computeRetryBackoffMs(currentRetryAttempt)
  currentRetryAttempt += 1
  nextRetryAtIso = new Date(Date.now() + delayMs).toISOString()
  notifyHealthListeners()

  retryTimerId = setTimeout(() => {
    retryTimerId = null
    nextRetryAtIso = null
    void flushTelemetry({ reason: 'retry' })
  }, delayMs)
}

async function registerPwaBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const syncReg = reg as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> }
    }
    if (syncReg?.sync && typeof syncReg.sync.register === 'function') {
      await syncReg.sync.register(TELEMETRY_SW_SYNC_TAG)
    }
  } catch {
    // Background Sync API unsupported on Safari/Firefox; handled via visibility/online hooks
  }
}

/**
 * Tracks a strongly typed Forge Athletic telemetry event.
 * Synchronously stages the sanitized envelope in memory (0ms) before persisting to IndexedDB
 * (or `localStorage` fallback), then flushes immediately for high-priority events or batches
 * every `10s` / `10 events` for high-frequency streams.
 */
export async function trackEvent<K extends TelemetryEventType>(
  eventType: K,
  payload: TelemetryEventMap[K],
  options?: TrackEventOptions
): Promise<QueuedTelemetryEnvelope<TelemetryEventMap[K]>> {
  const { isoWithOffset, timezoneOffsetMins } = formatIsoWithLocalOffset(new Date())
  const platform = detectTelemetryPlatform()
  const sanitizedPayload = sanitizeTelemetryPayload(payload)

  const envelope: QueuedTelemetryEnvelope<TelemetryEventMap[K]> = {
    event_id: options?.eventId || generateTelemetryUuid(),
    event_type: eventType,
    user_id: cachedUserId,
    session_id: getSessionId(),
    client_timestamp: isoWithOffset,
    timezone_offset_mins: timezoneOffsetMins,
    platform,
    app_version: APP_VERSION,
    network_type: detectNetworkType(),
    cv_capability: {
      webgl2: detectWebGl2Support(),
      avg_camera_fps: getAverageCameraFps(),
    },
    payload: sanitizedPayload,
    queued_at_ms: Date.now(),
    retry_count: 0,
  }

  // 0ms synchronous memory staging so sudden backgrounding never misses this event
  stageTelemetryEnvelopeSync(envelope as unknown as QueuedTelemetryEnvelope)
  notifyHealthListeners()

  await enqueueTelemetryEnvelope(envelope as unknown as QueuedTelemetryEnvelope)
  notifyHealthListeners()

  const isHighPriority = Boolean(options?.immediate) || HIGH_PRIORITY_TELEMETRY_EVENTS.has(eventType)
  const currentDepth = getTelemetryQueueDepthSync()

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    void registerPwaBackgroundSync()
    return envelope
  }

  if (isHighPriority) {
    clearBatchTimer()
    void flushTelemetry({ reason: 'high_priority' })
  } else if (currentDepth >= BATCH_FLUSH_THRESHOLD) {
    clearBatchTimer()
    void flushTelemetry({ reason: 'batch_threshold' })
  } else if (batchTimerId === null) {
    batchTimerId = setTimeout(() => {
      batchTimerId = null
      void flushTelemetry({ reason: 'batch_timer' })
    }, BATCH_FLUSH_INTERVAL_MS)
  }

  return envelope
}

/**
 * Flushes all queued telemetry envelopes to `/api/telemetry` in bounded batches,
 * deduplicating via `event_id` on the backend (`ON CONFLICT (event_id) DO NOTHING`).
 */
export async function flushTelemetry(
  options?: FlushTelemetryOptions
): Promise<TelemetryFlushStatus> {
  if (activeFlushPromise) {
    return activeFlushPromise
  }

  activeFlushPromise = (async (): Promise<TelemetryFlushStatus> => {
    clearBatchTimer()
    await hydrateTelemetryQueue()
    const pending = getQueuedEnvelopesSync()

    // Also opportunistically drain legacy workout set queue when online
    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
      if (getPendingQueueCount() > 0) {
        void flushOfflineQueue().catch(() => {
          // Handled by offline-sync-queue
        })
      }
    }

    if (pending.length === 0) {
      clearRetryTimer()
      currentRetryAttempt = 0
      notifyHealthListeners()
      return lastFlushStatus
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      void registerPwaBackgroundSync()
      lastFlushStatus = {
        httpStatus: null,
        ok: false,
        latencyMs: null,
        timestamp: new Date().toISOString(),
        acceptedCount: 0,
        error: 'Device offline — events safely queued in durable storage',
      }
      notifyHealthListeners()
      return lastFlushStatus
    }

    const batch = pending.slice(0, 50)
    const batchIds = batch.map(item => item.event_id)
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()

    try {
      const fetchInit: RequestInit & { priority?: 'low' | 'high' | 'auto' } = {
        method: 'POST',
        headers: getTelemetryAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ events: batch }),
      }

      // Deprioritize background batch flushes so interactive UI / camera streams stay smooth
      if (!options?.interactive && options?.reason !== 'diagnostic_ping') {
        fetchInit.priority = 'low'
      }

      const res = await fetch('/api/telemetry', fetchInit)
      const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const latencyMs = Math.max(1, Math.round(endedAt - startedAt))
      const nowIso = new Date().toISOString()

      if (res.ok) {
        await acknowledgeTelemetryEvents(batchIds)
        clearRetryTimer()
        currentRetryAttempt = 0
        lastSyncedAtIso = nowIso
        lastFlushStatus = {
          httpStatus: res.status,
          ok: true,
          latencyMs,
          timestamp: nowIso,
          acceptedCount: batch.length,
          error: null,
        }
        notifyHealthListeners()

        // If additional events remain beyond the 50-event batch window, continue draining
        if (getTelemetryQueueDepthSync() > 0) {
          setTimeout(() => {
            void flushTelemetry({ reason: options?.reason })
          }, 50)
        }

        return lastFlushStatus
      }

      // Non-retryable client schema error (400/422) vs retryable auth/network/5xx
      const errBody = await res.json().catch(() => ({}))
      const errMsg =
        typeof (errBody as { error?: string })?.error === 'string'
          ? (errBody as { error: string }).error
          : `HTTP ${res.status}`

      lastFlushStatus = {
        httpStatus: res.status,
        ok: false,
        latencyMs,
        timestamp: nowIso,
        acceptedCount: 0,
        error: errMsg,
      }

      if (res.status === 400 || res.status === 422) {
        // Prevent poison-pill batch loops while preserving diagnostic visibility
        await acknowledgeTelemetryEvents(batchIds)
      } else {
        await incrementEnvelopeRetryCounts(batchIds)
        void registerPwaBackgroundSync()
        scheduleRetryBackoff()
      }

      notifyHealthListeners()
      return lastFlushStatus
    } catch (err) {
      const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const latencyMs = Math.max(1, Math.round(endedAt - startedAt))
      await incrementEnvelopeRetryCounts(batchIds)
      void registerPwaBackgroundSync()

      lastFlushStatus = {
        httpStatus: null,
        ok: false,
        latencyMs,
        timestamp: new Date().toISOString(),
        acceptedCount: 0,
        error: err instanceof Error ? err.message : 'Network request failed',
      }
      scheduleRetryBackoff()
      notifyHealthListeners()
      return lastFlushStatus
    }
  })()

  try {
    return await activeFlushPromise
  } finally {
    activeFlushPromise = null
  }
}

/**
 * Synchronous background/unload-safe flush invoked on `visibilitychange === 'hidden'`,
 * `pagehide`, and Capacitor native `appStateChange` (`!isActive`).
 *
 * Respects the browser 64 KB `keepalive` payload quota by chunking envelopes under 56 KB,
 * attaches explicit `Authorization` headers for iOS WKWebView / ITP, and falls back to
 * `navigator.sendBeacon` if `fetch(..., { keepalive: true })` throws synchronously.
 */
export function flushTelemetryOnBackground(): void {
  clearBatchTimer()
  const pending = getQueuedEnvelopesSync()
  if (pending.length === 0) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    void registerPwaBackgroundSync()
    return
  }

  // Build a payload chunk safely under the 64 KB browser keepalive quota
  const chunk: QueuedTelemetryEnvelope[] = []
  let estimatedBytes = 16
  for (const item of pending) {
    const serialized = JSON.stringify(item)
    if (chunk.length > 0 && estimatedBytes + serialized.length + 2 > KEEPALIVE_SAFE_BYTE_LIMIT) {
      break
    }
    chunk.push(item)
    estimatedBytes += serialized.length + 2
    if (chunk.length >= 35) break
  }

  if (chunk.length === 0) return
  const body = JSON.stringify({ events: chunk })
  const chunkIds = chunk.map(item => item.event_id)

  try {
    const fetchPromise = fetch('/api/telemetry', {
      method: 'POST',
      headers: getTelemetryAuthHeaders(),
      credentials: 'same-origin',
      body,
      keepalive: true,
    })

    void fetchPromise
      .then(async res => {
        if (res.ok) {
          await acknowledgeTelemetryEvents(chunkIds)
          lastSyncedAtIso = new Date().toISOString()
          lastFlushStatus = {
            httpStatus: res.status,
            ok: true,
            latencyMs: 0,
            timestamp: lastSyncedAtIso,
            acceptedCount: chunk.length,
            error: null,
          }
          notifyHealthListeners()
        }
      })
      .catch(() => {
        // Durable IndexedDB / localStorage copy remains intact for next launch or Background Sync
        void registerPwaBackgroundSync()
      })
  } catch {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon('/api/telemetry', blob)
      } catch {
        // Remains in IndexedDB for next foreground flush
      }
    }
  }
}

async function refreshServiceWorkerState(): Promise<void> {
  const platform = detectTelemetryPlatform()
  if (platform === 'ios_app' || platform === 'android_app') {
    if (typeof window !== 'undefined' && (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
      cachedServiceWorkerState = 'bypassed_native'
      notifyHealthListeners()
      return
    }
  }

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    cachedServiceWorkerState = 'unsupported'
    notifyHealthListeners()
    return
  }

  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) {
      cachedServiceWorkerState = 'unregistered'
    } else if (reg.active) {
      cachedServiceWorkerState = 'active'
    } else if (reg.waiting) {
      cachedServiceWorkerState = 'waiting'
    } else if (reg.installing) {
      cachedServiceWorkerState = 'installing'
    } else {
      cachedServiceWorkerState = 'unregistered'
    }
  } catch {
    cachedServiceWorkerState = 'unregistered'
  }
  notifyHealthListeners()
}

/**
 * Returns the current unified telemetry health snapshot for Coach/System Diagnostics.
 */
export function getTelemetryHealth(): TelemetryHealthSnapshot {
  const platform = detectTelemetryPlatform()
  const telemetryQueueDepth = getTelemetryQueueDepthSync()
  const offlineSetQueueDepth = getPendingQueueCount()

  return {
    platform,
    platformLabel: formatPlatformLabel(platform),
    appVersion: APP_VERSION,
    sessionId: getSessionId(),
    userId: cachedUserId,
    hasAuthToken: Boolean(cachedAccessToken),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
    networkType: detectNetworkType(),
    serviceWorkerState: cachedServiceWorkerState,
    storageEngine: getActiveStorageEngine(),
    queueDepth: telemetryQueueDepth + offlineSetQueueDepth,
    telemetryQueueDepth,
    offlineSetQueueDepth,
    retryAttempt: currentRetryAttempt,
    nextRetryAt: nextRetryAtIso,
    lastFlushStatus: { ...lastFlushStatus },
    lastSyncedAt: lastSyncedAtIso,
    cvCapability: {
      webgl2: detectWebGl2Support(),
      avg_camera_fps: getAverageCameraFps(),
    },
  }
}

/**
 * Subscribes a UI component (e.g. OfflineTelemetryBadge or TelemetryDiagnosticsDrawer)
 * to live queue depth and HTTP flush status updates.
 */
export function subscribeTelemetryHealth(
  listener: (snapshot: TelemetryHealthSnapshot) => void
): () => void {
  healthListeners.add(listener)
  return () => {
    healthListeners.delete(listener)
  }
}

/**
 * Dispatches a tagged `client_runtime_diagnostic` test event, flushes immediately,
 * and queries `GET /api/telemetry?verifyEventId=<uuid>` to confirm end-to-end backend receipt
 * for PWA, TestFlight/App Store, and Google Play store-opening validation.
 */
export async function sendTelemetryDiagnosticPing(): Promise<TelemetryDiagnosticPingResult> {
  const pingEventId = generateTelemetryUuid()
  const pingTag = `store-check-${Date.now()}`
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()

  await trackEvent(
    'client_runtime_diagnostic',
    {
      diagnostic_kind: 'diagnostic_ping',
      ping_tag: pingTag,
      component_context: 'TelemetryDiagnosticsDrawer',
    },
    { eventId: pingEventId, immediate: false }
  )

  const flushRes = await flushTelemetry({ reason: 'diagnostic_ping', interactive: true })
  if (!flushRes.ok) {
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    return {
      verified: false,
      eventId: pingEventId,
      httpStatus: flushRes.httpStatus,
      roundTripMs: Math.max(1, Math.round(endedAt - startedAt)),
      serverReceivedAt: null,
      storageMode: null,
      error: flushRes.error || 'Telemetry flush failed',
    }
  }

  try {
    const verifyRes = await fetch(
      `/api/telemetry?verifyEventId=${encodeURIComponent(pingEventId)}`,
      {
        method: 'GET',
        headers: getTelemetryAuthHeaders(),
        credentials: 'same-origin',
        cache: 'no-store',
      }
    )
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const roundTripMs = Math.max(1, Math.round(endedAt - startedAt))
    const body = (await verifyRes.json().catch(() => ({}))) as {
      verified?: boolean
      receivedAt?: string | null
      storageMode?: string | null
      error?: string
    }

    if (verifyRes.ok && body.verified) {
      return {
        verified: true,
        eventId: pingEventId,
        httpStatus: verifyRes.status,
        roundTripMs,
        serverReceivedAt: body.receivedAt ?? new Date().toISOString(),
        storageMode: body.storageMode ?? 'supabase',
      }
    }

    return {
      verified: false,
      eventId: pingEventId,
      httpStatus: verifyRes.status,
      roundTripMs,
      serverReceivedAt: null,
      storageMode: body.storageMode ?? null,
      error: body.error || `Round-trip verification returned HTTP ${verifyRes.status}`,
    }
  } catch (err) {
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    return {
      verified: false,
      eventId: pingEventId,
      httpStatus: null,
      roundTripMs: Math.max(1, Math.round(endedAt - startedAt)),
      serverReceivedAt: null,
      storageMode: null,
      error: err instanceof Error ? err.message : 'Verification request failed',
    }
  }
}

/**
 * Initializes cross-platform lifecycle listeners across iOS, Android, and PWA:
 * - `document.visibilitychange` (`hidden` -> `keepalive` flush + camera release notice; `visible` -> foreground drain)
 * - `window.pagehide` -> `keepalive` flush (replaces unreliable `beforeunload`)
 * - `window.online` / `offline` -> Android Doze & Wi-Fi → 5G handoff drain
 * - Capacitor `App` (`appStateChange`, Android `backButton`) & `Network` (`networkStatusChange`)
 * - Service Worker `FORGE_SW_FLUSH_TELEMETRY` message channel
 * - Throttled uncaught runtime exception & unhandledrejection capture
 */
export function initTelemetryLifecycle(options?: {
  onForegroundResume?: () => void
}): () => void {
  if (typeof window === 'undefined') return () => {}
  if (lifecycleCleanup) return lifecycleCleanup

  void hydrateTelemetryQueue().then(() => {
    notifyHealthListeners()
    if (getTelemetryQueueDepthSync() > 0 && navigator.onLine !== false) {
      void flushTelemetry({ reason: 'foreground' })
    }
  })
  void refreshServiceWorkerState()

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushTelemetryOnBackground()
      window.dispatchEvent(
        new CustomEvent(TELEMETRY_CAMERA_RELEASE_EVENT, {
          detail: { reason: 'visibility_hidden' },
        })
      )
    } else if (document.visibilityState === 'visible') {
      void refreshServiceWorkerState()
      void flushTelemetry({ reason: 'foreground' })
      options?.onForegroundResume?.()
    }
  }

  const handlePageHide = () => {
    flushTelemetryOnBackground()
    window.dispatchEvent(
      new CustomEvent(TELEMETRY_CAMERA_RELEASE_EVENT, {
        detail: { reason: 'pagehide' },
      })
    )
  }

  const handleOnline = () => {
    notifyHealthListeners()
    void flushTelemetry({ reason: 'online' })
  }

  const handleOffline = () => {
    notifyHealthListeners()
    void registerPwaBackgroundSync()
  }

  const handleSwMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string } | null
    if (data?.type === 'FORGE_SW_FLUSH_TELEMETRY') {
      void flushTelemetry({ reason: 'online' })
    }
  }

  const handleWindowError = (event: ErrorEvent) => {
    const now = Date.now()
    if (now - lastExceptionAtMs < 5_000) return
    lastExceptionAtMs = now
    void trackEvent('client_runtime_diagnostic', {
      diagnostic_kind: 'exception',
      error_name: event.error?.name || 'WindowError',
      error_message: event.message || 'Unhandled runtime error',
      component_context: event.filename ? `${event.filename}:${event.lineno ?? 0}` : 'window.onerror',
    })
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const now = Date.now()
    if (now - lastExceptionAtMs < 5_000) return
    lastExceptionAtMs = now
    const reason = event.reason
    void trackEvent('client_runtime_diagnostic', {
      diagnostic_kind: 'exception',
      error_name: reason instanceof Error ? reason.name : 'UnhandledRejection',
      error_message: reason instanceof Error ? reason.message : String(reason ?? 'Promise rejected'),
      component_context: 'window.unhandledrejection',
    })
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('error', handleWindowError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSwMessage)
  }

  // Native Capacitor App & Network bridge listeners (iOS App Store & Google Play wrappers)
  let removeCapListeners: (() => void) | null = null
  const winCap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean }
    }
  ).Capacitor

  if (winCap?.isNativePlatform?.()) {
    void (async () => {
      try {
        const [{ App }, { Network }] = await Promise.all([
          import('@capacitor/app'),
          import('@capacitor/network'),
        ])
        const netStatus = await Network.getStatus()
        cachedNativeNetworkType = netStatus.connected ? netStatus.connectionType : 'offline'
        notifyHealthListeners()

        const appStateSub = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            flushTelemetryOnBackground()
            window.dispatchEvent(
              new CustomEvent(TELEMETRY_CAMERA_RELEASE_EVENT, {
                detail: { reason: 'native_background' },
              })
            )
          } else {
            void flushTelemetry({ reason: 'foreground' })
            options?.onForegroundResume?.()
          }
        })

        const backBtnSub = await App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            flushTelemetryOnBackground()
            window.dispatchEvent(
              new CustomEvent(TELEMETRY_CAMERA_RELEASE_EVENT, {
                detail: { reason: 'android_back_minimize' },
              })
            )
          }
        })

        const netSub = await Network.addListener('networkStatusChange', status => {
          cachedNativeNetworkType = status.connected ? status.connectionType : 'offline'
          notifyHealthListeners()
          if (status.connected) {
            void flushTelemetry({ reason: 'online' })
          }
        })

        removeCapListeners = () => {
          void appStateSub.remove()
          void backBtnSub.remove()
          void netSub.remove()
        }
      } catch {
        // Optional native plugin unavailable in web runtime
      }
    })()
  }

  lifecycleCleanup = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', handlePageHide)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    window.removeEventListener('error', handleWindowError)
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage)
    }
    removeCapListeners?.()
    lifecycleCleanup = null
  }

  return lifecycleCleanup
}

/**
 * Clears all locally persisted telemetry events and resets session auth context on logout.
 */
export async function clearTelemetryQueue(): Promise<void> {
  clearBatchTimer()
  clearRetryTimer()
  currentRetryAttempt = 0
  cachedUserId = null
  cachedAccessToken = null
  await purgeTelemetryQueue()
  notifyHealthListeners()
}

/**
 * Test-only state resetter for deterministic Vitest suites.
 */
export function __resetTelemetryClientForTests(options?: { disableIndexedDb?: boolean }): void {
  clearBatchTimer()
  clearRetryTimer()
  lifecycleCleanup?.()
  currentRetryAttempt = 0
  nextRetryAtIso = null
  cachedUserId = null
  cachedAccessToken = null
  cachedSessionId = null
  cachedWebGl2Support = null
  cachedNativeNetworkType = null
  cachedServiceWorkerState = 'unsupported'
  fpsSamples.length = 0
  lastExceptionAtMs = 0
  lastSyncedAtIso = null
  lastFlushStatus = {
    httpStatus: null,
    ok: null,
    latencyMs: null,
    timestamp: null,
    acceptedCount: 0,
    error: null,
  }
  __resetTelemetryQueueForTests(options)
}
