'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock, Sparkles, Trash2, X, Zap } from 'lucide-react'
import CameraReadinessCheck from '@/components/fitness/CameraReadinessCheck'
import { applyExpressCapToInjectedDrills } from '@/lib/camera-readiness-engine'
import {
  InjectedReadinessDrill,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  removeInjectedWarmupForToday,
  setExpressModeActive,
} from '@/lib/posture-profile-state'
import { useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'

export interface PreWorkoutReadinessBridgeProps {
  openSignal?: number
  workoutTitle?: string
  onProceedToWorkout?: () => void
}

export default function PreWorkoutReadinessBridge({
  openSignal = 0,
  workoutTitle = "Today's Strength Session",
  onProceedToWorkout,
}: PreWorkoutReadinessBridgeProps) {
  const { tierId, entitlements } = useTierAccess()
  const [modalOpen, setModalOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [expressMode, setExpressMode] = useState(false)
  const [rawDrills, setRawDrills] = useState<InjectedReadinessDrill[]>([])
  const [completedDrillIds, setCompletedDrillIds] = useState<string[]>([])

  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()

  useEffect(() => {
    const sync = () => {
      const state = loadPostureProfileState()
      setExpressMode(state.expressModeActive)
      setRawDrills(state.injectedWarmupDrills)
    }
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)

    // Auto-open Pre-Workout Overview when arriving from Dashboard "Start Workout" CTA (?startWorkout=1)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('startWorkout') === '1') {
        setModalOpen(true)
        params.delete('startWorkout')
        const cleanQuery = params.toString()
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`
        )
      }
    }

    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [])

  useEffect(() => {
    if (openSignal > 0) {
      setModalOpen(true)
    }
  }, [openSignal])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (modalOpen && !dialog.open) {
      dialog.showModal()
    } else if (!modalOpen && dialog.open) {
      dialog.close()
    }
  }, [modalOpen])

  const cappedDrills = useMemo(
    () => applyExpressCapToInjectedDrills(rawDrills, expressMode),
    [rawDrills, expressMode]
  )

  const totalInjectedSec = useMemo(
    () => cappedDrills.reduce((sum, d) => sum + d.durationSec, 0),
    [cappedDrills]
  )

  const handleToggleExpress = () => {
    const next = !expressMode
    setExpressMode(next)
    setExpressModeActive(next)
  }

  return (
    <>
      {/* Pre-Workout Overview Trigger Bar + Express Mode Toggle */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-[#111318] px-4 py-3 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors duration-150 hover:border-emerald-400/40 hover:bg-emerald-500/18"
          >
            <Sparkles size={14} strokeWidth={1.75} aria-hidden="true" /> 30s Pre-Workout Readiness Check
          </button>

          <button
            type="button"
            aria-pressed={expressMode}
            onClick={handleToggleExpress}
            className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors duration-150 ${
              expressMode
                ? 'border border-amber-400/50 bg-amber-400 text-[#090A0D]'
                : 'border border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
            }`}
          >
            <Zap size={13} strokeWidth={1.75} aria-hidden="true" /> 20m Express {expressMode ? 'Active' : 'Off'}
          </button>
        </div>

        <span className="text-[11px] tabular-nums text-zinc-400">
          {cappedDrills.length > 0
            ? `${cappedDrills.length} targeted drills ready (${totalInjectedSec}s)`
            : 'Auto-adapts warm-up before Set 1'}
        </span>
      </div>

      {/* Prepended Targeted Corrective Warm-Up Block right before Set 1 */}
      {cappedDrills.length > 0 ? (
        <section className="mb-3 rounded-2xl border border-emerald-500/25 bg-[#111318] p-4 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Injected from Readiness Check
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-zinc-300">
                <Clock size={12} strokeWidth={1.75} className="text-emerald-300" aria-hidden="true" /> {totalInjectedSec}s
                {expressMode ? ' (90s Express Cap)' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                removeInjectedWarmupForToday()
                setRawDrills([])
              }}
              className="forge-tactile-press inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors duration-150 hover:border-rose-500/35 hover:bg-rose-500/15 hover:text-rose-200"
            >
              <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" /> Remove
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {cappedDrills.map(drill => {
              const done = completedDrillIds.includes(drill.id)
              return (
                <div
                  key={drill.id}
                  className={`flex items-start justify-between gap-2.5 rounded-xl border p-3 ${
                    done
                      ? 'border-emerald-500/35 bg-emerald-500/10'
                      : 'border-white/[0.07] bg-[#181B22]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">
                      {drill.name}{' '}
                      <span className="font-mono text-[11px] tabular-nums text-emerald-300">
                        ({drill.durationSec}s)
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">{drill.cue}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCompletedDrillIds(prev =>
                        prev.includes(drill.id)
                          ? prev.filter(id => id !== drill.id)
                          : [...prev, drill.id]
                      )
                    }
                    aria-label={`Mark ${drill.name} completed`}
                    aria-pressed={done}
                    className={`forge-tactile-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150 ${
                      done
                        ? 'border-emerald-400 bg-emerald-400 text-[#090A0D]'
                        : 'border-white/15 bg-[#090A0D] text-zinc-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 size={17} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Pre-Workout Overview Dialog with Nested CameraReadinessCheck */}
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClose={() => setModalOpen(false)}
        onClick={e => {
          if (e.target === e.currentTarget) setModalOpen(false)
        }}
        className="forge-glass-modal m-auto w-[min(95vw,660px)] overscroll-contain rounded-2xl p-0 text-zinc-100"
      >
        <div className="max-h-[90dvh] overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Pre-Workout Overview · {workoutTitle}
              </span>
              <h2 id={headingId} className="mt-0.5 font-serif text-lg font-bold tracking-tight text-white sm:text-xl">
                30-Second Camera Readiness Check
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false)
                onProceedToWorkout?.()
              }}
              aria-label="Close Pre-Workout Overview"
              className="forge-tactile-press inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A]"
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <CameraReadinessCheck
            expressModeActive={expressMode}
            allowDualScreen={entitlements.dualScreenReadiness}
            onRequestUpgradeDualScreen={() => {
              setModalOpen(false)
              setUpgradeOpen(true)
            }}
            onComplete={result => {
              setRawDrills(result.injectedDrills)
              setModalOpen(false)
              onProceedToWorkout?.()
            }}
            onSkip={() => {
              setModalOpen(false)
              onProceedToWorkout?.()
            }}
          />
        </div>
      </dialog>

      <TierUpgradeModal
        open={upgradeOpen}
        triggerContext="post_scan_flag"
        currentTier={tierId}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  )
}

