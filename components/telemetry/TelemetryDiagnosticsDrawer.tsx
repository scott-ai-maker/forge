'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  flushTelemetry,
  getTelemetryHealth,
  sendTelemetryDiagnosticPing,
  subscribeTelemetryHealth,
  type TelemetryDiagnosticPingResult,
  type TelemetryHealthSnapshot,
} from '@/src/lib/telemetry/telemetryClient'

export interface TelemetryDiagnosticsPanelProps {
  onClose?: () => void
  headingId?: string
}

function formatSwBadge(
  state: TelemetryHealthSnapshot['serviceWorkerState']
): { label: string; tone: 'emerald' | 'amber' | 'slate' } {
  switch (state) {
    case 'active':
      return { label: 'Active (NetworkOnly API + Sync)', tone: 'emerald' }
    case 'bypassed_native':
      return { label: 'Bypassed (Native Bridge)', tone: 'emerald' }
    case 'installing':
    case 'waiting':
      return { label: `Updating (${state})`, tone: 'amber' }
    case 'unregistered':
      return { label: 'Unregistered (Dev / Direct)', tone: 'slate' }
    default:
      return { label: 'Unsupported', tone: 'slate' }
  }
}

export function TelemetryDiagnosticsPanel({
  onClose,
  headingId,
}: TelemetryDiagnosticsPanelProps) {
  const fallbackId = useId()
  const resolvedHeadingId = headingId || fallbackId
  const [health, setHealth] = useState<TelemetryHealthSnapshot>(() => getTelemetryHealth())
  const [isFlushing, setIsFlushing] = useState(false)
  const [isPinging, setIsPinging] = useState(false)
  const [pingResult, setPingResult] = useState<TelemetryDiagnosticPingResult | null>(null)

  useEffect(() => {
    setHealth(getTelemetryHealth())
    return subscribeTelemetryHealth(next => {
      setHealth(next)
    })
  }, [])

  const handleManualFlush = async () => {
    setIsFlushing(true)
    try {
      await flushTelemetry({ reason: 'manual', interactive: true })
      setHealth(getTelemetryHealth())
    } finally {
      setIsFlushing(false)
    }
  }

  const handleDiagnosticPing = async () => {
    setIsPinging(true)
    setPingResult(null)
    try {
      const result = await sendTelemetryDiagnosticPing()
      setPingResult(result)
      setHealth(getTelemetryHealth())
    } finally {
      setIsPinging(false)
    }
  }

  const swBadge = formatSwBadge(health.serviceWorkerState)
  const flushStatus = health.lastFlushStatus

  return (
    <div className="flex flex-col gap-4 text-zinc-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300">
            Forge Athletic · Store-Launch Telemetry Inspector
          </div>
          <h2
            id={resolvedHeadingId}
            className="mt-1 text-lg font-extrabold tracking-tight text-white sm:text-xl"
          >
            System &amp; Telemetry Diagnostics
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Real-time queue depth, Service Worker pass-through, and end-to-end backend verification across PWA, Apple iOS, and Google Android.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close System Diagnostics"
            className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2.5 text-xs font-bold text-zinc-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            ✕
          </button>
        )}
      </div>

      {/* Primary Status Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Detected Platform */}
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            Detected Platform
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              data-testid="telemetry-platform-label"
              className="text-sm font-extrabold text-white"
            >
              {health.platformLabel}
            </span>
            <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              v{health.appVersion}
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-zinc-400">
            Key: {health.platform}
          </div>
        </div>

        {/* Network & Auth State */}
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            Connectivity &amp; Auth Header
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                health.isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`}
            />
            <span className="text-sm font-extrabold text-white">
              {health.isOnline ? 'Online' : 'Offline (Durable Queue Active)'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Link: <span className="font-mono text-zinc-200">{health.networkType}</span> · Auth:{' '}
            <span className={health.hasAuthToken ? 'text-emerald-300' : 'text-amber-300'}>
              {health.hasAuthToken ? 'Bearer Attached' : 'Session Cookie'}
            </span>
          </div>
        </div>

        {/* Service Worker State */}
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            PWA Service Worker
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                swBadge.tone === 'emerald'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : swBadge.tone === 'amber'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-white/10 text-zinc-300'
              }`}
            >
              {swBadge.label}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Storage:{' '}
            <span className="font-mono uppercase text-zinc-200">{health.storageEngine}</span>
          </div>
        </div>

        {/* Offline Queue Depth */}
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            Durable Offline Queue Depth
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span
              data-testid="telemetry-queue-depth"
              className="font-mono text-base font-extrabold text-white"
            >
              {health.queueDepth} pending {health.queueDepth === 1 ? 'event' : 'events'}
            </span>
            {health.queueDepth > 0 && (
              <button
                type="button"
                onClick={handleManualFlush}
                disabled={isFlushing || !health.isOnline}
                className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {isFlushing ? 'Flushing…' : 'Flush Now'}
              </button>
            )}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Events: {health.telemetryQueueDepth} · Sets: {health.offlineSetQueueDepth}
            {health.retryAttempt > 0 ? ` · Retry #${health.retryAttempt}` : ''}
          </div>
        </div>

        {/* Last HTTP Flush Status */}
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            Last HTTP Flush Status
          </div>
          <div className="mt-1 flex items-center gap-2">
            {flushStatus.httpStatus !== null ? (
              <>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-extrabold ${
                    flushStatus.ok
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {flushStatus.httpStatus} {flushStatus.ok ? 'OK' : 'ERR'}
                </span>
                {flushStatus.latencyMs !== null && (
                  <span className="font-mono text-xs text-zinc-300">
                    {flushStatus.latencyMs}ms
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-semibold text-zinc-400">
                {flushStatus.error ? flushStatus.error : 'Idle — awaiting next batch'}
              </span>
            )}
          </div>
          <div className="mt-1 truncate text-[11px] text-zinc-400">
            {health.lastSyncedAt
              ? `Synced ${new Date(health.lastSyncedAt).toLocaleTimeString()}`
              : 'No flush recorded this session yet'}
          </div>
        </div>

        {/* CV Hardware Capability */}
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            CV &amp; Camera Hardware
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold ${
                health.cvCapability.webgl2
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {health.cvCapability.webgl2 ? 'WebGL2 Accelerated' : 'CPU / 2D Fallback'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Avg Camera FPS:{' '}
            <span className="font-mono text-zinc-200">
              {health.cvCapability.avg_camera_fps !== null
                ? `${health.cvCapability.avg_camera_fps} fps`
                : 'Not sampled yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Round-Trip Store-Launch Verification Action */}
      <div className="rounded-xl border border-amber-400/25 bg-gradient-to-br from-[#121826] to-[#0B0F18] p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.08em] text-white">
              End-to-End Store Build Verification
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Dispatches a UUIDv4-tagged diagnostic event through the durable queue to{' '}
              <code className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-amber-200">
                /api/telemetry
              </code>{' '}
              and verifies database persistence.
            </p>
          </div>

          <button
            type="button"
            data-testid="send-telemetry-ping-btn"
            onClick={handleDiagnosticPing}
            disabled={isPinging}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.06em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-colors hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPinging
              ? 'Verifying Round-Trip…'
              : 'Send Test Telemetry Ping & Verify Round-Trip'}
          </button>
        </div>

        {pingResult && (
          <div
            role="status"
            aria-live="polite"
            data-testid="telemetry-ping-result"
            className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${
              pingResult.verified
                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-400/45 bg-rose-500/15 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                  pingResult.verified
                    ? 'bg-emerald-400 text-zinc-950'
                    : 'bg-rose-400 text-zinc-950'
                }`}
              >
                {pingResult.verified ? '✓' : '!'}
              </span>
              <span>
                {pingResult.verified
                  ? `Verified Round-Trip (${pingResult.httpStatus ?? 200} OK · ${pingResult.roundTripMs}ms)`
                  : `Verification Failed: ${pingResult.error || 'Unverified'}`}
              </span>
            </div>
            <div className="font-mono text-[11px] opacity-90">
              event_id: {pingResult.eventId.slice(0, 8)}… · mode:{' '}
              {pingResult.storageMode || 'n/a'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export interface TelemetryDiagnosticsDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal diagnostic drawer triggered via `?debug=telemetry` on any route.
 * Uses native `<dialog>` opened with `.showModal()` for top-layer focus management,
 * inert background, and native Escape dismissal.
 */
export default function TelemetryDiagnosticsDrawer({
  open,
  onClose,
}: TelemetryDiagnosticsDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={e => {
        if (e.target === e.currentTarget) {
          e.currentTarget.close()
        }
      }}
      className="forge-glass-modal forge-telemetry-drawer m-auto w-[min(94vw,760px)] max-h-[88dvh] overflow-y-auto rounded-2xl p-0 text-zinc-100"
    >
      <div className="p-4 sm:p-6">
        <TelemetryDiagnosticsPanel
          headingId={headingId}
          onClose={() => dialogRef.current?.close()}
        />
      </div>
    </dialog>
  )
}
