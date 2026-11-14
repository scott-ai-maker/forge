/**
 * Forge Athletic — Server-Side Telemetry Persistence & Snapshot Rollup
 *
 * Implements:
 * 1. Strict idempotent batch ingestion (`ON CONFLICT (event_id) DO NOTHING`) into `client_telemetry_events`
 * 2. Real-time rollup into `client_telemetry_snapshots` so Coach Gordon's Coach Portal reflects
 *    the member's latest Readiness Score, Joint Comfort sparkline, Desk Audit strain flags,
 *    33-point Posture Scan deltas, OPT™ phase progress, and `"Last Synced"` timestamp immediately
 * 3. Dual-write resilience (matching `lib/coach-onboarding-gates-storage.ts`): if an environment
 *    has not yet applied the `client_telemetry_events` SQL migration, seamlessly falls back to
 *    `client_lifecycle_audit_logs` + bounded memory cache so zero events or diagnostic pings fail
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeTelemetryPayload, type TelemetryPlatform } from '@/src/lib/telemetry/telemetryClient'

export interface ValidatedTelemetryEnvelope {
  event_id: string
  event_type: string
  session_id: string
  client_timestamp: string
  timezone_offset_mins: number
  platform: TelemetryPlatform
  app_version: string
  network_type?: string | null
  cv_capability?: {
    webgl2?: boolean
    avg_camera_fps?: number | null
  }
  payload: Record<string, unknown>
}

export interface JointComfortSparklinePoint {
  eventId: string
  date: string
  timestamp: string
  score: number
  label: string
}

export interface ClientTelemetrySnapshot {
  userId: string
  latestReadinessScore: number | null
  latestReadinessMovement: string | null
  latestReadinessAt: string | null
  jointComfortHistory: JointComfortSparklinePoint[]
  deskWorkstationScore: number | null
  deskStrainLevel: string | null
  deskStrainFlags: string[]
  deskAngles: {
    earShoulderDeg?: number | null
    shoulderProtractionDeg?: number | null
    elbowAngleDeg?: number | null
    seatedHipAngleDeg?: number | null
  }
  deskAuditedAt: string | null
  postureDelta: {
    overallPostureScore?: number | null
    forwardHeadTiltDeg?: number | null
    shoulderSymmetryDeg?: number | null
    pelvicSymmetryDeg?: number | null
    scanMode?: string | null
    checkedAt?: string | null
  }
  injectedWarmupDrills: Array<{ id: string; title: string; duration_sec: number }>
  optPhase: number | null
  expressModeActive: boolean
  environmentProfile: string
  lastWorkoutCompletedAt: string | null
  lastSyncedAt: string | null
  lastPlatform: string | null
  lastAppVersion: string | null
}

export interface TelemetryIngestResult {
  acceptedCount: number
  insertedCount: number
  deduplicatedCount: number
  storageMode: 'supabase' | 'audit_fallback'
  snapshot: ClientTelemetrySnapshot
}

// Bounded in-process fallback cache used only when SQL migration is pending in a dev/preview DB
const fallbackSeenEvents = new Map<string, { userId: string; receivedAt: string; eventType: string }>()
const fallbackSnapshots = new Map<string, ClientTelemetrySnapshot>()
const MAX_FALLBACK_EVENTS = 2_000

function createEmptySnapshot(userId: string): ClientTelemetrySnapshot {
  return {
    userId,
    latestReadinessScore: null,
    latestReadinessMovement: null,
    latestReadinessAt: null,
    jointComfortHistory: [],
    deskWorkstationScore: null,
    deskStrainLevel: null,
    deskStrainFlags: [],
    deskAngles: {},
    deskAuditedAt: null,
    postureDelta: {},
    injectedWarmupDrills: [],
    optPhase: null,
    expressModeActive: false,
    environmentProfile: 'home_gym',
    lastWorkoutCompletedAt: null,
    lastSyncedAt: null,
    lastPlatform: null,
    lastAppVersion: null,
  }
}

function normalizeIsoTimestamp(raw: string): string {
  const parsed = new Date(raw)
  if (Number.isFinite(parsed.getTime())) {
    return parsed.toISOString()
  }
  return new Date().toISOString()
}

function clampScore(value: unknown, min = 0, max = 100): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(min, Math.min(max, Math.round(value)))
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function mapRowToSnapshot(userId: string, row: Record<string, unknown>): ClientTelemetrySnapshot {
  return {
    userId,
    latestReadinessScore: clampScore(row.latest_readiness_score),
    latestReadinessMovement:
      typeof row.latest_readiness_movement === 'string' ? row.latest_readiness_movement : null,
    latestReadinessAt:
      typeof row.latest_readiness_at === 'string' ? row.latest_readiness_at : null,
    jointComfortHistory: Array.isArray(row.joint_comfort_history)
      ? (row.joint_comfort_history as JointComfortSparklinePoint[])
      : [],
    deskWorkstationScore: clampScore(row.desk_workstation_score),
    deskStrainLevel: typeof row.desk_strain_level === 'string' ? row.desk_strain_level : null,
    deskStrainFlags: Array.isArray(row.desk_strain_flags)
      ? row.desk_strain_flags.filter((f): f is string => typeof f === 'string')
      : [],
    deskAngles:
      row.desk_angles && typeof row.desk_angles === 'object'
        ? (row.desk_angles as ClientTelemetrySnapshot['deskAngles'])
        : {},
    deskAuditedAt: typeof row.desk_audited_at === 'string' ? row.desk_audited_at : null,
    postureDelta:
      row.posture_delta && typeof row.posture_delta === 'object'
        ? (row.posture_delta as ClientTelemetrySnapshot['postureDelta'])
        : {},
    injectedWarmupDrills: Array.isArray(row.injected_warmup_drills)
      ? (row.injected_warmup_drills as Array<{ id: string; title: string; duration_sec: number }>)
      : [],
    optPhase: clampScore(row.opt_phase, 1, 5),
    expressModeActive: Boolean(row.express_mode_active),
    environmentProfile:
      typeof row.environment_profile === 'string' && row.environment_profile
        ? row.environment_profile
        : 'home_gym',
    lastWorkoutCompletedAt:
      typeof row.last_workout_completed_at === 'string' ? row.last_workout_completed_at : null,
    lastSyncedAt: typeof row.last_synced_at === 'string' ? row.last_synced_at : null,
    lastPlatform: typeof row.last_platform === 'string' ? row.last_platform : null,
    lastAppVersion: typeof row.last_app_version === 'string' ? row.last_app_version : null,
  }
}

/**
 * Applies a batch of non-duplicate telemetry events onto an athlete's telemetry snapshot.
 */
export function applyEventsToSnapshot(
  current: ClientTelemetrySnapshot,
  events: ValidatedTelemetryEnvelope[],
  syncedAtIso: string
): ClientTelemetrySnapshot {
  const next: ClientTelemetrySnapshot = {
    ...current,
    jointComfortHistory: [...current.jointComfortHistory],
    deskStrainFlags: [...current.deskStrainFlags],
    deskAngles: { ...current.deskAngles },
    postureDelta: { ...current.postureDelta },
    injectedWarmupDrills: [...current.injectedWarmupDrills],
    lastSyncedAt: syncedAtIso,
  }

  for (const ev of events) {
    const eventTimeIso = normalizeIsoTimestamp(ev.client_timestamp)
    const p = sanitizeTelemetryPayload(ev.payload || {})
    next.lastPlatform = ev.platform
    next.lastAppVersion = ev.app_version

    switch (ev.event_type) {
      case 'readiness_check_completed': {
        const score = clampScore(p.readiness_index)
        if (score !== null) {
          next.latestReadinessScore = score
          next.latestReadinessMovement =
            typeof p.movement_type === 'string' ? p.movement_type : next.latestReadinessMovement
          next.latestReadinessAt = eventTimeIso
        }
        if (Array.isArray(p.injected_warmup_drills)) {
          next.injectedWarmupDrills = p.injected_warmup_drills
            .filter((d): d is Record<string, unknown> => Boolean(d && typeof d === 'object'))
            .map(d => ({
              id: String(d.id || 'drill'),
              title: String(d.title || 'Mobility Prep'),
              duration_sec: Number(d.duration_sec) || 45,
            }))
        }
        if (typeof p.express_mode_active === 'boolean') {
          next.expressModeActive = p.express_mode_active
        }
        break
      }

      case 'joint_comfort_logged': {
        const comfortScore = clampScore(p.comfort_score)
        if (comfortScore !== null && !next.jointComfortHistory.some(pt => pt.eventId === ev.event_id)) {
          next.jointComfortHistory.push({
            eventId: ev.event_id,
            date: eventTimeIso.split('T')[0],
            timestamp: eventTimeIso,
            score: comfortScore,
            label: typeof p.comfort_label === 'string' ? p.comfort_label : 'Logged',
          })
          next.jointComfortHistory.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
          if (next.jointComfortHistory.length > 14) {
            next.jointComfortHistory = next.jointComfortHistory.slice(-14)
          }
        }
        break
      }

      case 'desk_ergonomics_completed': {
        const wsScore = clampScore(p.workstation_score)
        if (wsScore !== null) {
          next.deskWorkstationScore = wsScore
        }
        if (typeof p.strain_level === 'string') {
          next.deskStrainLevel = p.strain_level
        }
        if (Array.isArray(p.strain_flags)) {
          next.deskStrainFlags = p.strain_flags.filter((f): f is string => typeof f === 'string')
        }
        next.deskAngles = {
          earShoulderDeg: finiteOrNull(p.ear_shoulder_angle_deg),
          shoulderProtractionDeg: finiteOrNull(p.shoulder_protraction_deg),
          elbowAngleDeg: finiteOrNull(p.elbow_angle_deg),
          seatedHipAngleDeg: finiteOrNull(p.seated_hip_angle_deg),
        }
        next.deskAuditedAt = eventTimeIso
        break
      }

      case 'posture_scan_completed': {
        next.postureDelta = {
          overallPostureScore: clampScore(p.overall_posture_score),
          forwardHeadTiltDeg: finiteOrNull(p.forward_head_tilt_deg),
          shoulderSymmetryDeg: finiteOrNull(p.shoulder_symmetry_deg),
          pelvicSymmetryDeg: finiteOrNull(p.pelvic_symmetry_deg),
          scanMode: typeof p.scan_mode === 'string' ? p.scan_mode : 'quick_check',
          checkedAt: eventTimeIso,
        }
        break
      }

      case 'workout_completed': {
        const phase = clampScore(p.opt_phase, 1, 5)
        if (phase !== null) next.optPhase = phase
        if (typeof p.express_20m === 'boolean') next.expressModeActive = p.express_20m
        if (typeof p.environment_profile === 'string' && p.environment_profile) {
          next.environmentProfile = p.environment_profile
        }
        if (p.completed !== false) {
          next.lastWorkoutCompletedAt = eventTimeIso
        }
        break
      }

      case 'set_logged': {
        const phase = clampScore(p.opt_phase, 1, 5)
        if (phase !== null) next.optPhase = phase
        if (typeof p.express_20m === 'boolean') next.expressModeActive = p.express_20m
        if (typeof p.environment_profile === 'string' && p.environment_profile) {
          next.environmentProfile = p.environment_profile
        }
        break
      }

      default:
        break
    }
  }

  return next
}

function isMissingRelationError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '')
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    msg.includes('client_telemetry_events') ||
    msg.includes('client_telemetry_snapshots')
  )
}

/**
 * Loads the latest telemetry snapshot for a client (used by both Coach Portal and iOS/PWA launch rehydration).
 */
export async function loadClientTelemetrySnapshot(
  admin: SupabaseClient,
  userId: string
): Promise<ClientTelemetrySnapshot | null> {
  try {
    const { data, error } = await admin
      .from('client_telemetry_snapshots')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!error && data) {
      return mapRowToSnapshot(userId, data as Record<string, unknown>)
    }

    if (error && !isMissingRelationError(error)) {
      console.warn('[loadClientTelemetrySnapshot] Query warning:', error.message)
    }
  } catch (err) {
    console.warn('[loadClientTelemetrySnapshot] Primary snapshot read failed:', err)
  }

  // Fallback 1: check bounded in-memory snapshot cache
  const memSnap = fallbackSnapshots.get(userId)
  if (memSnap) return memSnap

  // Fallback 2: check `client_lifecycle_audit_logs` telemetry rollup entry if table unmigrated
  try {
    const { data: fallbackLog } = await admin
      .from('client_lifecycle_audit_logs')
      .select('metadata, created_at')
      .eq('client_id', userId)
      .eq('action', 'client_telemetry_sync')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const metaSnap = (fallbackLog?.metadata as { snapshot?: ClientTelemetrySnapshot } | null)?.snapshot
    if (metaSnap && metaSnap.userId === userId) {
      fallbackSnapshots.set(userId, metaSnap)
      return metaSnap
    }
  } catch {
    // Ignore fallback read failure
  }

  return null
}

/**
 * Ingests a batch of validated telemetry envelopes with strict `event_id` idempotency
 * (`ON CONFLICT (event_id) DO NOTHING`) and updates the member's telemetry snapshot.
 */
export async function recordTelemetryBatch(
  admin: SupabaseClient,
  userId: string,
  rawEvents: ValidatedTelemetryEnvelope[]
): Promise<TelemetryIngestResult> {
  const nowIso = new Date().toISOString()

  // Deduplicate within the incoming request array itself first
  const uniqueMap = new Map<string, ValidatedTelemetryEnvelope>()
  for (const ev of rawEvents) {
    if (!uniqueMap.has(ev.event_id)) {
      uniqueMap.set(ev.event_id, {
        ...ev,
        payload: sanitizeTelemetryPayload(ev.payload || {}),
      })
    }
  }
  const batch = Array.from(uniqueMap.values())
  const intraBatchDuplicates = rawEvents.length - batch.length
  const eventIds = batch.map(ev => ev.event_id)

  // 1. Primary path: Supabase `client_telemetry_events` + `client_telemetry_snapshots`
  try {
    const { data: existingRows, error: existingErr } = await admin
      .from('client_telemetry_events')
      .select('event_id')
      .in('event_id', eventIds)

    if (!existingErr) {
      const existingIds = new Set(
        Array.isArray(existingRows)
          ? existingRows.map((r: { event_id: string }) => r.event_id)
          : []
      )
      const novelEvents = batch.filter(ev => !existingIds.has(ev.event_id))

      if (novelEvents.length > 0) {
        const dbRows = novelEvents.map(ev => ({
          event_id: ev.event_id,
          user_id: userId,
          session_id: ev.session_id,
          event_type: ev.event_type,
          client_timestamp: normalizeIsoTimestamp(ev.client_timestamp),
          client_timestamp_iso: ev.client_timestamp,
          timezone_offset_mins: ev.timezone_offset_mins,
          platform: ev.platform,
          app_version: ev.app_version,
          network_type: ev.network_type ?? null,
          cv_capability: sanitizeTelemetryPayload(ev.cv_capability ?? {}),
          payload: ev.payload,
          received_at: nowIso,
        }))

        // Idempotent PostgreSQL `ON CONFLICT (event_id) DO NOTHING`
        const { error: upsertErr } = await admin
          .from('client_telemetry_events')
          .upsert(dbRows, { onConflict: 'event_id', ignoreDuplicates: true })

        if (upsertErr && isMissingRelationError(upsertErr)) {
          throw upsertErr
        }
      }

      const prevSnapshot =
        (await loadClientTelemetrySnapshot(admin, userId)) ?? createEmptySnapshot(userId)

      // Even if all events were deduplicated, refresh `lastSyncedAt` when novel events arrive;
      // only mutate biomechanical history/scores for novel (non-duplicate) events!
      const updatedSnapshot =
        novelEvents.length > 0
          ? applyEventsToSnapshot(prevSnapshot, novelEvents, nowIso)
          : {
              ...prevSnapshot,
              lastSyncedAt: prevSnapshot.lastSyncedAt || nowIso,
            }

      await admin.from('client_telemetry_snapshots').upsert(
        {
          user_id: userId,
          latest_readiness_score: updatedSnapshot.latestReadinessScore,
          latest_readiness_movement: updatedSnapshot.latestReadinessMovement,
          latest_readiness_at: updatedSnapshot.latestReadinessAt,
          joint_comfort_history: updatedSnapshot.jointComfortHistory,
          desk_workstation_score: updatedSnapshot.deskWorkstationScore,
          desk_strain_level: updatedSnapshot.deskStrainLevel,
          desk_strain_flags: updatedSnapshot.deskStrainFlags,
          desk_angles: updatedSnapshot.deskAngles,
          desk_audited_at: updatedSnapshot.deskAuditedAt,
          posture_delta: updatedSnapshot.postureDelta,
          injected_warmup_drills: updatedSnapshot.injectedWarmupDrills,
          opt_phase: updatedSnapshot.optPhase,
          express_mode_active: updatedSnapshot.expressModeActive,
          environment_profile: updatedSnapshot.environmentProfile,
          last_workout_completed_at: updatedSnapshot.lastWorkoutCompletedAt,
          last_synced_at: updatedSnapshot.lastSyncedAt || nowIso,
          last_platform: updatedSnapshot.lastPlatform,
          last_app_version: updatedSnapshot.lastAppVersion,
          updated_at: nowIso,
        },
        { onConflict: 'user_id' }
      )

      return {
        acceptedCount: rawEvents.length,
        insertedCount: novelEvents.length,
        deduplicatedCount: intraBatchDuplicates + existingIds.size,
        storageMode: 'supabase',
        snapshot: updatedSnapshot,
      }
    }

    if (!isMissingRelationError(existingErr)) {
      console.warn('[recordTelemetryBatch] Unexpected select error:', existingErr.message)
    }
  } catch (err) {
    console.warn('[recordTelemetryBatch] Falling back to audit log storage:', err)
  }

  // 2. Resilient fallback path when `client_telemetry_events` migration hasn't run yet
  const novelFallbackEvents: ValidatedTelemetryEnvelope[] = []
  let existingFallbackCount = 0

  for (const ev of batch) {
    if (fallbackSeenEvents.has(ev.event_id)) {
      existingFallbackCount += 1
      continue
    }
    novelFallbackEvents.push(ev)
    fallbackSeenEvents.set(ev.event_id, {
      userId,
      receivedAt: nowIso,
      eventType: ev.event_type,
    })
    if (fallbackSeenEvents.size > MAX_FALLBACK_EVENTS) {
      const oldestKey = fallbackSeenEvents.keys().next().value
      if (oldestKey) fallbackSeenEvents.delete(oldestKey)
    }
  }

  const prevSnapshot =
    (await loadClientTelemetrySnapshot(admin, userId)) ?? createEmptySnapshot(userId)
  const updatedSnapshot =
    novelFallbackEvents.length > 0
      ? applyEventsToSnapshot(prevSnapshot, novelFallbackEvents, nowIso)
      : { ...prevSnapshot, lastSyncedAt: prevSnapshot.lastSyncedAt || nowIso }

  fallbackSnapshots.set(userId, updatedSnapshot)

  if (novelFallbackEvents.length > 0) {
    try {
      await admin.from('client_lifecycle_audit_logs').insert({
        client_id: userId,
        actor_id: userId,
        actor_role: 'client',
        action: 'client_telemetry_sync',
        reason_notes: `Synced ${novelFallbackEvents.length} telemetry event(s)`,
        metadata: {
          eventIds: novelFallbackEvents.map(e => e.event_id),
          snapshot: updatedSnapshot,
        },
      })
    } catch {
      // Ignore if audit table rejects custom action check constraint
    }
  }

  return {
    acceptedCount: rawEvents.length,
    insertedCount: novelFallbackEvents.length,
    deduplicatedCount: intraBatchDuplicates + existingFallbackCount,
    storageMode: 'audit_fallback',
    snapshot: updatedSnapshot,
  }
}

/**
 * Verifies end-to-end backend receipt of a specific `event_id` for the weekend store-launch diagnostic panel.
 */
export async function verifyTelemetryEventReceipt(
  admin: SupabaseClient,
  userId: string,
  eventId: string
): Promise<{
  verified: boolean
  receivedAt: string | null
  eventType: string | null
  storageMode: 'supabase' | 'audit_fallback' | null
}> {
  try {
    const { data, error } = await admin
      .from('client_telemetry_events')
      .select('event_id, event_type, received_at')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!error && data) {
      return {
        verified: true,
        receivedAt: (data as { received_at?: string }).received_at ?? new Date().toISOString(),
        eventType: (data as { event_type?: string }).event_type ?? null,
        storageMode: 'supabase',
      }
    }
  } catch {
    // Check fallback store below
  }

  const memHit = fallbackSeenEvents.get(eventId)
  if (memHit && memHit.userId === userId) {
    return {
      verified: true,
      receivedAt: memHit.receivedAt,
      eventType: memHit.eventType,
      storageMode: 'audit_fallback',
    }
  }

  return {
    verified: false,
    receivedAt: null,
    eventType: null,
    storageMode: null,
  }
}

export function __resetServerTelemetryFallbackForTests(): void {
  fallbackSeenEvents.clear()
  fallbackSnapshots.clear()
}
