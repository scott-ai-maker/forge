'use client'

import React, { useCallback, useEffect, useState } from 'react'
import OfflineTelemetryBadge from '@/components/ui/OfflineTelemetryBadge'
import { useOfflineSyncManager } from '@/components/fitness/hooks/useOfflineSyncManager'
import { OPEN_TELEMETRY_DIAGNOSTICS_EVENT } from '@/components/telemetry/TelemetryBootstrap'
import {
  clearOfflineQueue,
  enqueueOfflineSet,
  getQueuedOfflineSets,
} from '@/lib/offline-sync-queue'
import {
  clearTelemetryQueue,
  getTelemetryHealth,
  setTelemetryAuthContext,
  subscribeTelemetryHealth,
  trackEvent,
  type TelemetryHealthSnapshot,
} from '@/src/lib/telemetry/telemetryClient'

export default function TelemetryOfflineHarnessClient() {
  const [hydrated, setHydrated] = useState(false)
  const [setCounter, setSetCounter] = useState(1)
  const [reconciledIds, setReconciledIds] = useState<string[]>([])
  const [health, setHealth] = useState<TelemetryHealthSnapshot>(() => getTelemetryHealth())

  const handleSetSynced = useCallback((tempId: string, serverRecord: { id: string }) => {
    setReconciledIds(prev => [...prev, `${tempId}->${serverRecord.id}`])
  }, [])

  const { pendingSyncCount } = useOfflineSyncManager(handleSetSynced)

  useEffect(() => {
    setHydrated(true)
    setTelemetryAuthContext({
      userId: 'harness-athlete-001',
      accessToken: 'harness-bearer-token-v1',
    })
    setHealth(getTelemetryHealth())
    return subscribeTelemetryHealth(next => {
      setHealth(next)
    })
  }, [])

  const handleQueueOfflineSet = () => {
    const nextNum = setCounter
    setSetCounter(c => c + 1)
    enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Trap Bar Deadlift',
      setNumber: nextNum,
      reps: 8,
      weightKg: 140,
      tempo: '3/1/1',
      restSeconds: 90,
      rpe: 8,
    })
    setHealth(getTelemetryHealth())
  }

  const handleTrackComfortEvent = async () => {
    await trackEvent('joint_comfort_logged', {
      comfort_score: 88,
      comfort_label: 'Fluid',
      joint_region: 'lumbar_spine',
    })
    setHealth(getTelemetryHealth())
  }

  const handleSignOutPurge = async () => {
    clearOfflineQueue()
    await clearTelemetryQueue()
    setReconciledIds([])
    setHealth(getTelemetryHealth())
  }

  const handleOpenDiagnostics = () => {
    window.dispatchEvent(new CustomEvent(OPEN_TELEMETRY_DIAGNOSTICS_EVENT))
  }

  return (
    <div
      data-testid="telemetry-offline-harness"
      data-hydrated={hydrated ? 'true' : 'false'}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 pt-12"
    >
      <OfflineTelemetryBadge />

      <header className="rounded-2xl border border-white/10 bg-[#0E1724] p-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300">
          Forge Athletic · Feature #10 Test Harness
        </div>
        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          Unified Telemetry Queue &amp; Offline Sync Engine
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Interactive gym-floor offline set queue, IndexedDB telemetry batching, and round-trip store verification harness.
        </p>
      </header>

      <section
        aria-label="Queue Controls"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#0E1724] p-5 sm:grid-cols-2"
      >
        <button
          type="button"
          data-testid="harness-enqueue-set-btn"
          onClick={handleQueueOfflineSet}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-zinc-950 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Log Offline Workout Set
        </button>

        <button
          type="button"
          data-testid="harness-track-telemetry-btn"
          onClick={() => void handleTrackComfortEvent()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Queue Joint Comfort Telemetry
        </button>

        <button
          type="button"
          data-testid="harness-open-diagnostics-btn"
          onClick={handleOpenDiagnostics}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-zinc-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Open Diagnostics Inspector
        </button>

        <button
          type="button"
          data-testid="harness-signout-purge-btn"
          onClick={() => void handleSignOutPurge()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-rose-400/35 bg-rose-500/15 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-rose-200 hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          Simulate Shared-Device Sign-Out Purge
        </button>
      </section>

      <section
        aria-label="Live Queue Telemetry Readout"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#0E1724] p-5 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-white/10 bg-[#080E14] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Combined Queue Depth
          </div>
          <div
            data-testid="harness-total-depth"
            className="mt-1 font-mono text-lg font-extrabold text-white"
          >
            {health.queueDepth}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#080E14] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Offline Sets Hook Count
          </div>
          <div
            data-testid="harness-hook-set-count"
            className="mt-1 font-mono text-lg font-extrabold text-amber-300"
          >
            {pendingSyncCount} ({getQueuedOfflineSets().length} stored)
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#080E14] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Reconciled Optimistic Sets
          </div>
          <div
            data-testid="harness-reconciled-sets"
            className="mt-1 break-all font-mono text-xs font-bold text-emerald-300"
          >
            {reconciledIds.length > 0 ? reconciledIds.join(', ') : 'None yet'}
          </div>
        </div>
      </section>
    </div>
  )
}
