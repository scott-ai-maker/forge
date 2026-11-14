/**
 * Forge Athletic — Durable Offline-First Telemetry Queue
 *
 * Persists unsent telemetry envelopes in IndexedDB (`forge_telemetry_db_v1` / `pending_events`)
 * with automatic seamless fallback to `localStorage` (`forge_telemetry_queue_v1`) when IndexedDB
 * is unavailable, blocked, or restricted (e.g. iOS Safari Private Browsing or test sandboxes).
 *
 * Also maintains an in-memory mirror synchronized with durable storage so synchronous
 * `visibilitychange === 'hidden'` and `pagehide` background flushes (`fetch(..., { keepalive: true })`
 * / `navigator.sendBeacon`) have 0ms synchronous access to pending envelopes without risking
 * iOS WKWebView / Safari async IndexedDB transaction suspension.
 */

export type TelemetryStorageEngine = 'indexeddb' | 'localstorage' | 'memory'

export interface QueuedTelemetryEnvelope<TPayload = Record<string, unknown>> {
  event_id: string
  event_type: string
  user_id: string | null
  session_id: string
  client_timestamp: string
  timezone_offset_mins: number
  platform: 'ios_app' | 'android_app' | 'pwa_standalone' | 'mobile_web' | 'desktop_web'
  app_version: string
  network_type: string
  cv_capability: {
    webgl2: boolean
    avg_camera_fps: number | null
  }
  payload: TPayload
  queued_at_ms: number
  retry_count: number
}

const IDB_NAME = 'forge_telemetry_db_v1'
const IDB_VERSION = 1
const IDB_STORE = 'pending_events'
const LS_FALLBACK_KEY = 'forge_telemetry_queue_v1'
export const MAX_TELEMETRY_QUEUE_DEPTH = 500

let memoryMirror: QueuedTelemetryEnvelope[] = []
let hydrated = false
let hydrationPromise: Promise<void> | null = null
let activeEngine: TelemetryStorageEngine = 'memory'
let idbDisabledForSession = false
let cachedDbPromise: Promise<IDBDatabase> | null = null

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

function hasIndexedDb(): boolean {
  if (idbDisabledForSession) return false
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined' &&
      window.indexedDB !== null
    )
  } catch {
    return false
  }
}

function openTelemetryIdb(): Promise<IDBDatabase> {
  if (cachedDbPromise) return cachedDbPromise

  cachedDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          const store = db.createObjectStore(IDB_STORE, { keyPath: 'event_id' })
          store.createIndex('queued_at_ms', 'queued_at_ms', { unique: false })
        }
      }
      req.onsuccess = () => {
        const db = req.result
        db.onversionchange = () => {
          db.close()
          cachedDbPromise = null
        }
        resolve(db)
      }
      req.onerror = () => {
        cachedDbPromise = null
        reject(req.error ?? new Error('Failed opening IndexedDB'))
      }
      req.onblocked = () => {
        cachedDbPromise = null
        reject(new Error('IndexedDB open blocked'))
      }
    } catch (err) {
      cachedDbPromise = null
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })

  return cachedDbPromise
}

function readLocalStorageFallback(): QueuedTelemetryEnvelope[] {
  if (!hasLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(LS_FALLBACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is QueuedTelemetryEnvelope =>
        Boolean(item && typeof item === 'object' && typeof item.event_id === 'string')
    )
  } catch {
    return []
  }
}

function writeLocalStorageFallback(items: QueuedTelemetryEnvelope[]): boolean {
  if (!hasLocalStorage()) return false
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(LS_FALLBACK_KEY)
    } else {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(items))
    }
    return true
  } catch {
    return false
  }
}

async function readAllFromIdb(): Promise<QueuedTelemetryEnvelope[]> {
  const db = await openTelemetryIdb()
  return new Promise<QueuedTelemetryEnvelope[]>((resolve, reject) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const store = tx.objectStore(IDB_STORE)
      const req = store.getAll()
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? (req.result as QueuedTelemetryEnvelope[]) : []
        rows.sort((a, b) => (a.queued_at_ms || 0) - (b.queued_at_ms || 0))
        resolve(rows)
      }
      req.onerror = () => reject(req.error ?? new Error('IndexedDB getAll failed'))
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

async function putInIdb(envelopes: QueuedTelemetryEnvelope[]): Promise<void> {
  if (envelopes.length === 0) return
  const db = await openTelemetryIdb()
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const store = tx.objectStore(IDB_STORE)
      for (const env of envelopes) {
        store.put(env)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB put transaction failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB put transaction aborted'))
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

async function deleteFromIdb(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return
  const db = await openTelemetryIdb()
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const store = tx.objectStore(IDB_STORE)
      for (const id of eventIds) {
        store.delete(id)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete transaction failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB delete transaction aborted'))
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

async function clearIdbStore(): Promise<void> {
  const db = await openTelemetryIdb()
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const store = tx.objectStore(IDB_STORE)
      store.clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB clear transaction failed'))
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

function mergeUniqueEnvelopes(
  existing: QueuedTelemetryEnvelope[],
  incoming: QueuedTelemetryEnvelope[]
): QueuedTelemetryEnvelope[] {
  const byId = new Map<string, QueuedTelemetryEnvelope>()
  for (const item of existing) {
    byId.set(item.event_id, item)
  }
  for (const item of incoming) {
    byId.set(item.event_id, item)
  }
  const merged = Array.from(byId.values()).sort((a, b) => (a.queued_at_ms || 0) - (b.queued_at_ms || 0))
  if (merged.length > MAX_TELEMETRY_QUEUE_DEPTH) {
    return merged.slice(merged.length - MAX_TELEMETRY_QUEUE_DEPTH)
  }
  return merged
}

/**
 * Hydrates in-memory mirror from IndexedDB (primary) + localStorage fallback.
 * If localStorage contains items saved during an earlier fallback/pagehide write,
 * promotes them into IndexedDB when IndexedDB is healthy.
 */
export async function hydrateTelemetryQueue(): Promise<QueuedTelemetryEnvelope[]> {
  if (hydrated) return [...memoryMirror]
  if (hydrationPromise) {
    await hydrationPromise
    return [...memoryMirror]
  }

  hydrationPromise = (async () => {
    const lsItems = readLocalStorageFallback()

    if (hasIndexedDb()) {
      try {
        const idbItems = await readAllFromIdb()
        activeEngine = 'indexeddb'
        memoryMirror = mergeUniqueEnvelopes(memoryMirror, [...idbItems, ...lsItems])
        if (lsItems.length > 0) {
          await putInIdb(lsItems)
          writeLocalStorageFallback([])
        }
        hydrated = true
        return
      } catch {
        idbDisabledForSession = true
        cachedDbPromise = null
      }
    }

    if (hasLocalStorage()) {
      activeEngine = 'localstorage'
      memoryMirror = mergeUniqueEnvelopes(memoryMirror, lsItems)
      writeLocalStorageFallback(memoryMirror)
    } else {
      activeEngine = 'memory'
    }
    hydrated = true
  })()

  try {
    await hydrationPromise
  } finally {
    hydrationPromise = null
  }

  return [...memoryMirror]
}

/**
 * Synchronously primes memory from localStorage if not yet hydrated,
 * returning an immediate snapshot of pending envelopes (used by synchronous
 * `visibilitychange`/`pagehide` handlers and `getTelemetryHealth()`).
 */
export function getQueuedEnvelopesSync(): QueuedTelemetryEnvelope[] {
  if (!hydrated && memoryMirror.length === 0 && hasLocalStorage()) {
    const lsItems = readLocalStorageFallback()
    if (lsItems.length > 0) {
      memoryMirror = mergeUniqueEnvelopes(memoryMirror, lsItems)
      if (activeEngine === 'memory') activeEngine = 'localstorage'
    }
  }
  return [...memoryMirror]
}

export function getTelemetryQueueDepthSync(): number {
  return getQueuedEnvelopesSync().length
}

export function getActiveStorageEngine(): TelemetryStorageEngine {
  if (activeEngine === 'memory') {
    if (hasIndexedDb()) return 'indexeddb'
    if (hasLocalStorage()) return 'localstorage'
  }
  return activeEngine
}

/**
 * Synchronously stages an envelope in the in-memory mirror (and localStorage fallback
 * if IndexedDB has not completed hydration yet) in 0ms so `getTelemetryHealth()` and
 * sudden `visibilitychange === 'hidden'` / `pagehide` events never miss an envelope
 * created on the same tick.
 */
export function stageTelemetryEnvelopeSync(envelope: QueuedTelemetryEnvelope): void {
  const existingIdx = memoryMirror.findIndex(e => e.event_id === envelope.event_id)
  if (existingIdx >= 0) {
    memoryMirror[existingIdx] = envelope
  } else {
    memoryMirror.push(envelope)
  }

  if (memoryMirror.length > MAX_TELEMETRY_QUEUE_DEPTH) {
    const excess = memoryMirror.length - MAX_TELEMETRY_QUEUE_DEPTH
    memoryMirror.splice(0, excess)
  }

  if (!hydrated || activeEngine !== 'indexeddb') {
    writeLocalStorageFallback(memoryMirror)
  }
}

/**
 * Enqueues an envelope immediately in memory (0ms) and persists to IndexedDB
 * (falling back to localStorage automatically if IndexedDB fails or is restricted).
 */
export async function enqueueTelemetryEnvelope(
  envelope: QueuedTelemetryEnvelope
): Promise<void> {
  stageTelemetryEnvelopeSync(envelope)

  if (!hydrated) {
    await hydrateTelemetryQueue()
  }

  const droppedOverflowIds: string[] = []
  const existingIdx = memoryMirror.findIndex(e => e.event_id === envelope.event_id)
  if (existingIdx >= 0) {
    memoryMirror[existingIdx] = envelope
  } else {
    memoryMirror.push(envelope)
  }

  if (memoryMirror.length > MAX_TELEMETRY_QUEUE_DEPTH) {
    const excess = memoryMirror.length - MAX_TELEMETRY_QUEUE_DEPTH
    const dropped = memoryMirror.splice(0, excess)
    for (const d of dropped) droppedOverflowIds.push(d.event_id)
  }

  if (hasIndexedDb()) {
    try {
      if (droppedOverflowIds.length > 0) {
        await deleteFromIdb(droppedOverflowIds)
      }
      await putInIdb([envelope])
      activeEngine = 'indexeddb'
      return
    } catch {
      idbDisabledForSession = true
      cachedDbPromise = null
    }
  }

  if (writeLocalStorageFallback(memoryMirror)) {
    activeEngine = 'localstorage'
  } else {
    activeEngine = 'memory'
  }
}

/**
 * Removes successfully acknowledged event IDs from both memory and durable storage.
 */
export async function acknowledgeTelemetryEvents(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return
  const ackSet = new Set(eventIds)
  memoryMirror = memoryMirror.filter(item => !ackSet.has(item.event_id))

  if (hasIndexedDb()) {
    try {
      await deleteFromIdb(eventIds)
      activeEngine = 'indexeddb'
      if (hasLocalStorage()) writeLocalStorageFallback([])
      return
    } catch {
      idbDisabledForSession = true
      cachedDbPromise = null
    }
  }

  writeLocalStorageFallback(memoryMirror)
}

/**
 * Increments retry counts for failed envelopes and persists updated state.
 */
export async function incrementEnvelopeRetryCounts(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return
  const targetSet = new Set(eventIds)
  const updated: QueuedTelemetryEnvelope[] = []

  memoryMirror = memoryMirror.map(item => {
    if (!targetSet.has(item.event_id)) return item
    const next = { ...item, retry_count: (item.retry_count || 0) + 1 }
    updated.push(next)
    return next
  })

  if (hasIndexedDb() && updated.length > 0) {
    try {
      await putInIdb(updated)
      return
    } catch {
      idbDisabledForSession = true
      cachedDbPromise = null
    }
  }

  writeLocalStorageFallback(memoryMirror)
}

/**
 * Purges all queued telemetry events from memory, IndexedDB, and localStorage.
 * Must be invoked on user sign-out to enforce HIPAA (1996) shared-device privacy.
 */
export async function purgeTelemetryQueue(): Promise<void> {
  memoryMirror = []
  writeLocalStorageFallback([])
  if (hasIndexedDb()) {
    try {
      await clearIdbStore()
    } catch {
      // Ignore IndexedDB clear error if database is restricted
    }
  }
}

/**
 * Test-only reset helper for deterministic unit test isolation.
 */
export function __resetTelemetryQueueForTests(options?: { disableIndexedDb?: boolean }): void {
  memoryMirror = []
  hydrated = false
  hydrationPromise = null
  cachedDbPromise = null
  idbDisabledForSession = Boolean(options?.disableIndexedDb)
  activeEngine = 'memory'
  writeLocalStorageFallback([])
}
