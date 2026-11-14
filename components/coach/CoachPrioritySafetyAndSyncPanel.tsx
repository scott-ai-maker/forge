'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, CheckCircle2, Mail, RefreshCw, ShieldAlert, Smartphone } from 'lucide-react'
import type { CoachSafetyQueueItem } from '@/app/api/coach/safety-queue/route'

interface LibraryIndexSummary {
  totalPassages: number
  indexedCount: number
  vectorIndexReady: boolean
}

function formatShortTimestamp(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'Just now'
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function CoachPrioritySafetyAndSyncPanel() {
  const [items, setItems] = useState<CoachSafetyQueueItem[]>([])
  const [libraryIndex, setLibraryIndex] = useState<LibraryIndexSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncingIndex, setSyncingIndex] = useState(false)
  const [syncNotice, setSyncNotice] = useState('')

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/coach/safety-queue', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setItems(Array.isArray(data.items) ? data.items : [])
        setLibraryIndex(data.libraryIndex ?? null)
      }
    } catch {
      // Non-fatal in preview environments
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchQueue()
  }, [fetchQueue])

  const handleSyncCoachingLibrary = async () => {
    if (syncingIndex) return
    setSyncingIndex(true)
    setSyncNotice('')
    try {
      const res = await fetch('/api/coach/rag/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setSyncNotice(
          `Coaching Library synced: ${data.embeddedAndUpserted} updated, ${data.skippedUnchanged} already up to date (${data.totalChunks} total protocols).`
        )
        await fetchQueue()
      } else {
        setSyncNotice(
          data?.error ||
            'Built-in Sports Science Library is active; configure Gemini & Supabase keys to enable cloud vector indexing.'
        )
      }
    } catch {
      setSyncNotice('Unable to reach sync endpoint right now.')
    } finally {
      setSyncingIndex(false)
    }
  }

  return (
    <div
      data-testid="coach-priority-safety-and-sync-panel"
      className="mb-5 grid grid-cols-1 gap-3.5 lg:grid-cols-3"
    >
      {/* Left 2 Columns: Global Safety Flags & Tier-Aware 24h SLA Escalation Queue */}
      <article className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#0D131F]/95 p-4 lg:col-span-2">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="shrink-0 text-amber-400" aria-hidden="true" />
            <h2 className="m-0 text-sm font-extrabold uppercase tracking-wider text-white">
              Priority Safety &amp; Member Escalation Queue
            </h2>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-emerald-300">
              {items.length} Recent
            </span>
          </div>

          <button
            type="button"
            onClick={() => void fetchQueue()}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/12 bg-[#151D2E] px-3 py-1.5 text-xs font-bold text-zinc-200 transition-colors hover:border-white/25 hover:text-white disabled:opacity-60"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refresh Queue</span>
          </button>
        </header>

        <div>
          {items.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-3 text-xs text-emerald-100">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
              <span>
                Zero unresolved acute joint safety flags or pending tier escalations across assigned members.
              </span>
            </div>
          ) : (
            <ul role="list" className="m-0 grid list-none gap-2 p-0">
              {items.slice(0, 5).map(item => {
                const isCritical =
                  item.severity === 'emergency_911' || item.severity === 'clinical_stop'
                const isPrioritySms = item.eventType === 'escalation_sms'
                return (
                  <li
                    key={item.eventId}
                    className={`flex flex-wrap items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${
                      isCritical
                        ? 'border-rose-500/45 bg-rose-500/10 text-rose-50'
                        : isPrioritySms
                          ? 'border-amber-400/45 bg-amber-400/10 text-amber-50'
                          : 'border-white/10 bg-[#131A29] text-zinc-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.eventType === 'safety_flag' ? (
                          <AlertTriangle
                            size={13}
                            className={isCritical ? 'text-rose-300' : 'text-amber-300'}
                            aria-hidden="true"
                          />
                        ) : isPrioritySms ? (
                          <Smartphone size={13} className="text-amber-300" aria-hidden="true" />
                        ) : (
                          <Mail size={13} className="text-sky-300" aria-hidden="true" />
                        )}
                        <strong className="font-bold text-white">{item.clientName}</strong>
                        <span className="rounded bg-black/35 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                          {item.eventType === 'safety_flag'
                            ? isCritical
                              ? 'Clinical Stop'
                              : 'Joint Regression'
                            : isPrioritySms
                              ? '24h Priority SMS'
                              : 'Direct Email'}
                        </span>
                        <span className="font-mono text-[10.5px] text-zinc-400">
                          {formatShortTimestamp(item.occurredAt)}
                        </span>
                      </div>
                      <div className="mt-1 font-semibold text-zinc-100">{item.headline}</div>
                      <div className="mt-0.5 line-clamp-2 text-[11.5px] text-zinc-300">
                        {item.detail}
                      </div>
                    </div>

                    <a
                      href={`/coach/clients/${encodeURIComponent(item.clientId)}`}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#0A0F1A] px-3 py-1.5 text-xs font-bold text-amber-300 no-underline hover:border-amber-400/50 hover:text-amber-200"
                    >
                      Review {item.clientName}
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </article>

      {/* Right Column: Coaching Library Index Health & 1-Click Sync */}
      <article className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#0D131F]/95 p-4">
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen size={17} className="shrink-0 text-emerald-400" aria-hidden="true" />
            <h2 className="m-0 text-sm font-extrabold uppercase tracking-wider text-white">
              Coaching Library Index
            </h2>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            {libraryIndex?.vectorIndexReady && (libraryIndex?.indexedCount ?? 0) > 0
              ? 'Cloud + Local Synced'
              : 'Instant Local Active'}
          </span>
        </header>

        <div className="space-y-1.5 text-xs leading-relaxed text-zinc-300">
          <p className="m-0">
            Powers Coach Gordon AI with{' '}
            <strong className="text-white">
              {libraryIndex?.totalPassages ?? 100}+ clean-room sports science, movement, and joint-protection protocols
            </strong>
            .
          </p>
          {libraryIndex ? (
            <p className="m-0 font-mono text-[11px] text-zinc-400">
              Indexed Vectors: {libraryIndex.indexedCount} / {libraryIndex.totalPassages}
            </p>
          ) : null}
          {syncNotice ? (
            <p
              role="status"
              aria-live="polite"
              className="m-0 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-emerald-200"
            >
              {syncNotice}
            </p>
          ) : null}
        </div>

        <footer>
          <button
            type="button"
            onClick={() => void handleSyncCoachingLibrary()}
            disabled={syncingIndex}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-amber-400/45 bg-amber-400/15 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-400/25 disabled:opacity-60"
          >
            <RefreshCw size={13} className={syncingIndex ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{syncingIndex ? 'Syncing Coaching Library...' : 'Sync Coaching Library Index'}</span>
          </button>
        </footer>
      </article>
    </div>
  )
}
