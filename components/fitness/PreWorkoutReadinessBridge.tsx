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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0A1320] px-3 py-2 text-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-2.5 py-1.5 text-xs font-extrabold text-amber-200 transition hover:bg-amber-400/25"
          >
            <Sparkles size={13} /> 30s Pre-Workout Readiness Check
          </button>

          <button
            type="button"
            aria-pressed={expressMode}
            onClick={handleToggleExpress}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition ${
              expressMode
                ? 'bg-amber-400 text-slate-950'
                : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Zap size={12} /> 20m Express {expressMode ? 'Active' : 'Off'}
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          {cappedDrills.length > 0
            ? `${cappedDrills.length} targeted drills ready (${totalInjectedSec}s)`
            : 'Auto-adapts warm-up before Set 1'}
        </span>
      </div>

      {/* Prepended Targeted Corrective Warm-Up Block right before Set 1 */}
      {cappedDrills.length > 0 ? (
        <section className="mb-3 rounded-xl border border-emerald-400/40 bg-[#09161B] p-3.5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
                Injected from Readiness Check
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-300">
                <Clock size={12} className="text-emerald-300" /> {totalInjectedSec}s
                {expressMode ? ' (90s Express Cap)' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                removeInjectedWarmupForToday()
                setRawDrills([])
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-200"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {cappedDrills.map(drill => {
              const done = completedDrillIds.includes(drill.id)
              return (
                <div
                  key={drill.id}
                  className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 ${
                    done
                      ? 'border-emerald-400/40 bg-emerald-500/10'
                      : 'border-white/10 bg-slate-950/75'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">
                      {drill.name}{' '}
                      <span className="font-mono text-[11px] text-emerald-300">
                        ({drill.durationSec}s)
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-300">{drill.cue}</p>
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
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                      done
                        ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                        : 'border-white/20 bg-white/5 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 size={14} />
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
        className="m-auto w-[min(95vw,640px)] overscroll-contain rounded-2xl border border-amber-400/35 bg-[#070B12] p-0 text-slate-100 shadow-2xl"
      >
        <div className="max-h-[90dvh] overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
                Pre-Workout Overview · {workoutTitle}
              </span>
              <h2 id={headingId} className="mt-0.5 font-serif text-lg font-bold text-white sm:text-xl">
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10"
            >
              <X size={15} />
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

