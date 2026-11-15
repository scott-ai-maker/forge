'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock, Pause, Play, Sparkles, Timer, Trash2, X, Zap } from 'lucide-react'
import CameraReadinessCheck from '@/components/fitness/CameraReadinessCheck'
import ExerciseVideoModal, { type ExerciseModalData } from '@/components/fitness/ExerciseVideoModal'
import { applyExpressCapToInjectedDrills } from '@/lib/camera-readiness-engine'
import {
  BRAND_LOGO_FALLBACK_IMAGE,
  resolveGaaExerciseImage,
} from '@/lib/nasm-generated-images'
import {
  InjectedReadinessDrill,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  removeInjectedWarmupForToday,
  setExpressModeActive,
} from '@/lib/posture-profile-state'
import { useSfxMuted } from '@/lib/sfx-audio'
import { useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'

export interface PreWorkoutReadinessBridgeProps {
  openSignal?: number
  workoutTitle?: string
  onProceedToWorkout?: () => void
}

function formatDrillCountdown(sec: number): string {
  const clamped = Math.max(0, Math.ceil(sec))
  const mins = Math.floor(clamped / 60)
  const rem = clamped % 60
  return mins > 0 ? `${mins}:${String(rem).padStart(2, '0')}` : `${rem}s`
}

export default function PreWorkoutReadinessBridge({
  openSignal = 0,
  workoutTitle = "Today's Strength Session",
  onProceedToWorkout,
}: PreWorkoutReadinessBridgeProps) {
  const { tierId, entitlements } = useTierAccess()
  const { playTone } = useSfxMuted()
  const [modalOpen, setModalOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [expressMode, setExpressMode] = useState(false)
  const [rawDrills, setRawDrills] = useState<InjectedReadinessDrill[]>([])
  const [completedDrillIds, setCompletedDrillIds] = useState<string[]>([])
  const [activeTimerDrillId, setActiveTimerDrillId] = useState<string | null>(null)
  const [timerRemainingSec, setTimerRemainingSec] = useState<number>(0)
  const [guidedQueueActive, setGuidedQueueActive] = useState<boolean>(false)
  const [activeVideoModal, setActiveVideoModal] = useState<ExerciseModalData | null>(null)

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
    const handleNativeClose = () => {
      dialog.returnValue = ''
      setModalOpen(false)
    }
    dialog.addEventListener('close', handleNativeClose)
    return () => {
      dialog.removeEventListener('close', handleNativeClose)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (modalOpen && !dialog.open) {
      dialog.showModal()
    } else if (!modalOpen && dialog.open) {
      dialog.close()
    }
  }, [modalOpen])

  // Progressive-enhancement backdrop light-dismiss for browsers lacking HTMLDialogElement.prototype.closedBy
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || typeof HTMLDialogElement === 'undefined') return
    if ('closedBy' in HTMLDialogElement.prototype) return

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
    }

    let pressedOutside = false
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = dialog.open && isOutside(e)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && dialog.open && isOutside(e)) {
        dialog.close()
      }
      pressedOutside = false
    }

    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  const cappedDrills = useMemo(
    () => applyExpressCapToInjectedDrills(rawDrills, expressMode),
    [rawDrills, expressMode]
  )

  const totalInjectedSec = useMemo(
    () => cappedDrills.reduce((sum, d) => sum + d.durationSec, 0),
    [cappedDrills]
  )

  // Clamp active timer if 20m Express reduces drill duration mid-run or removes a drill
  useEffect(() => {
    if (!activeTimerDrillId) return
    const activeDrill = cappedDrills.find(d => d.id === activeTimerDrillId)
    if (!activeDrill) {
      setActiveTimerDrillId(null)
      setTimerRemainingSec(0)
      setGuidedQueueActive(false)
      return
    }
    setTimerRemainingSec(prev => Math.min(prev, activeDrill.durationSec))
  }, [activeTimerDrillId, cappedDrills])

  // Live 1-second drill countdown loop right before Set 1
  useEffect(() => {
    if (!activeTimerDrillId) return
    const interval = setInterval(() => {
      setTimerRemainingSec(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimerDrillId])

  // Advance or finish when active drill timer reaches 0s
  useEffect(() => {
    if (!activeTimerDrillId || timerRemainingSec > 0) return

    const finishedId = activeTimerDrillId
    playTone('rep_complete')
    const nextCompleted = completedDrillIds.includes(finishedId)
      ? completedDrillIds
      : [...completedDrillIds, finishedId]
    setCompletedDrillIds(nextCompleted)

    if (guidedQueueActive) {
      const nextDrill = cappedDrills.find(d => !nextCompleted.includes(d.id))
      if (nextDrill) {
        setActiveTimerDrillId(nextDrill.id)
        setTimerRemainingSec(nextDrill.durationSec)
        return
      }
    }

    setActiveTimerDrillId(null)
    setGuidedQueueActive(false)
  }, [activeTimerDrillId, cappedDrills, completedDrillIds, guidedQueueActive, playTone, timerRemainingSec])

  const handleToggleDrillTimer = useCallback(
    (drill: InjectedReadinessDrill) => {
      if (activeTimerDrillId === drill.id) {
        setActiveTimerDrillId(null)
        setGuidedQueueActive(false)
        return
      }
      setGuidedQueueActive(false)
      setActiveTimerDrillId(drill.id)
      setTimerRemainingSec(drill.durationSec)
    },
    [activeTimerDrillId]
  )

  const handleToggleGuidedWarmup = useCallback(() => {
    if (activeTimerDrillId) {
      setActiveTimerDrillId(null)
      setGuidedQueueActive(false)
      return
    }
    const firstPending =
      cappedDrills.find(d => !completedDrillIds.includes(d.id)) ?? cappedDrills[0]
    if (!firstPending) return
    if (completedDrillIds.length === cappedDrills.length) {
      setCompletedDrillIds([])
    }
    setGuidedQueueActive(true)
    setActiveTimerDrillId(firstPending.id)
    setTimerRemainingSec(firstPending.durationSec)
  }, [activeTimerDrillId, cappedDrills, completedDrillIds])

  const handleToggleExpress = () => {
    const next = !expressMode
    setExpressMode(next)
    setExpressModeActive(next)
  }

  const allDrillsDone =
    cappedDrills.length > 0 && cappedDrills.every(d => completedDrillIds.includes(d.id))

  return (
    <>
      {/* Pre-Workout Overview Trigger Bar + Express Mode Toggle */}
      <div
        data-testid="pre-workout-readiness-bar"
        className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-[#111318] px-4 py-3 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="open-readiness-check-btn"
            onClick={() => setModalOpen(true)}
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors duration-150 hover:border-emerald-400/40 hover:bg-emerald-500/18"
          >
            <Sparkles size={14} strokeWidth={1.75} aria-hidden="true" /> 30s Pre-Workout Readiness
            Check
          </button>

          <button
            type="button"
            data-testid="readiness-bridge-express-toggle"
            aria-pressed={expressMode}
            onClick={handleToggleExpress}
            className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors duration-150 ${
              expressMode
                ? 'border border-amber-400/50 bg-amber-400 text-[#090A0D]'
                : 'border border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
            }`}
          >
            <Zap size={13} strokeWidth={1.75} aria-hidden="true" /> 20m Express{' '}
            {expressMode ? 'Active' : 'Off'}
          </button>
        </div>

        <span
          data-testid="readiness-bridge-summary-text"
          className="text-[11px] tabular-nums text-zinc-400"
        >
          {cappedDrills.length > 0
            ? `${cappedDrills.length} targeted drills ready (${totalInjectedSec}s)`
            : 'Auto-adapts warm-up before Set 1'}
        </span>
      </div>

      {/* Prepended Targeted Corrective Warm-Up Block right before Set 1 */}
      {cappedDrills.length > 0 ? (
        <div
          data-testid="injected-warmup-block"
          className="mb-3 rounded-2xl border border-emerald-500/25 bg-[#111318] p-4 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Injected from Readiness Check
              </span>
              <span
                data-testid="injected-warmup-duration-badge"
                className="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-zinc-300"
              >
                <Clock size={12} strokeWidth={1.75} className="text-emerald-300" aria-hidden="true" />{' '}
                {totalInjectedSec}s{expressMode ? ' (90s Express Cap)' : ''}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="warmup-guided-timer-btn"
                onClick={handleToggleGuidedWarmup}
                className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
                  activeTimerDrillId
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
                    : 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                }`}
              >
                {activeTimerDrillId ? (
                  <>
                    <Pause size={13} strokeWidth={2} aria-hidden="true" /> Pause Timer (
                    {formatDrillCountdown(timerRemainingSec)})
                  </>
                ) : (
                  <>
                    <Timer size={13} strokeWidth={2} aria-hidden="true" />{' '}
                    {allDrillsDone ? 'Replay Warm-Up' : 'Start Guided Warm-Up'}
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="warmup-remove-btn"
                onClick={() => {
                  setActiveTimerDrillId(null)
                  setGuidedQueueActive(false)
                  removeInjectedWarmupForToday()
                  setRawDrills([])
                }}
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors duration-150 hover:border-rose-500/35 hover:bg-rose-500/15 hover:text-rose-200"
              >
                <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" /> Remove
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {cappedDrills.map(drill => {
              const done = completedDrillIds.includes(drill.id)
              const isRunning = activeTimerDrillId === drill.id
              const thumb =
                drill.imageUrl ||
                resolveGaaExerciseImage(drill.name, false) ||
                BRAND_LOGO_FALLBACK_IMAGE
              const elapsedForDrill = isRunning
                ? Math.max(0, drill.durationSec - timerRemainingSec)
                : done
                  ? drill.durationSec
                  : 0

              return (
                <div
                  key={drill.id}
                  data-testid={`warmup-drill-card-${drill.id}`}
                  className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3 transition-colors ${
                    done
                      ? 'border-emerald-500/35 bg-emerald-500/10'
                      : isRunning
                        ? 'border-amber-400/50 bg-[#181B22]'
                        : 'border-white/[0.07] bg-[#181B22]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveVideoModal({
                          name: drill.name,
                          imageUrl: thumb,
                          coachingCues: [drill.cue],
                          target: drill.targetArea,
                          protocol: `${drill.durationSec}s (${drill.targetArea})`,
                        })
                      }
                      aria-label={`Watch ${drill.name} demonstration`}
                      className="group relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#090A0D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                    >
                      <img
                        src={thumb}
                        alt={drill.name}
                        loading="lazy"
                        onError={e => {
                          e.currentTarget.src = BRAND_LOGO_FALLBACK_IMAGE
                        }}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-90 transition-opacity group-hover:bg-black/20">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/90 text-[#090A0D]">
                          <Play size={11} fill="currentColor" aria-hidden="true" />
                        </span>
                      </span>
                    </button>

                    <div className="min-w-0 flex-1">
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
                      onClick={() => {
                        if (isRunning) {
                          setActiveTimerDrillId(null)
                          setGuidedQueueActive(false)
                        }
                        setCompletedDrillIds(prev =>
                          prev.includes(drill.id)
                            ? prev.filter(id => id !== drill.id)
                            : [...prev, drill.id]
                        )
                      }}
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

                  {/* Per-Drill Live Countdown Control + Native Progress Bar */}
                  <div className="flex items-center justify-between gap-2.5 border-t border-white/[0.06] pt-2">
                    <button
                      type="button"
                      data-testid={`warmup-drill-timer-${drill.id}`}
                      onClick={() => handleToggleDrillTimer(drill)}
                      aria-label={
                        isRunning
                          ? `Pause ${drill.name} timer`
                          : `Start ${drill.durationSec} second timer for ${drill.name}`
                      }
                      className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums transition-colors ${
                        isRunning
                          ? 'border-amber-400/50 bg-amber-400/15 text-amber-200'
                          : 'border-white/10 bg-[#090A0D] text-emerald-300 hover:border-emerald-400/40'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause size={12} aria-hidden="true" />{' '}
                          <span>{formatDrillCountdown(timerRemainingSec)}</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} aria-hidden="true" />{' '}
                          <span>{done ? 'Done · Replay' : `Start ${drill.durationSec}s`}</span>
                        </>
                      )}
                    </button>

                    <progress
                      max={drill.durationSec}
                      value={elapsedForDrill}
                      aria-label={`${drill.name} timer progress`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full accent-emerald-400 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-emerald-400"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Pre-Workout Overview Modal Dialog with Nested CameraReadinessCheck */}
      <dialog
        ref={dialogRef}
        data-testid="pre-workout-readiness-dialog"
        {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby={headingId}
        onClose={() => setModalOpen(false)}
        className="forge-glass-modal m-auto w-[min(95vw,660px)] overscroll-contain rounded-2xl p-0 text-zinc-100"
      >
        <div className="max-h-[90dvh] overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Pre-Workout Overview · {workoutTitle}
              </span>
              <h2
                id={headingId}
                className="mt-0.5 font-serif text-lg font-bold tracking-tight text-white sm:text-xl"
              >
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
            isOpen={modalOpen}
            expressModeActive={expressMode}
            allowDualScreen={entitlements.dualScreenReadiness}
            onRequestUpgradeDualScreen={() => {
              setModalOpen(false)
              setUpgradeOpen(true)
            }}
            onComplete={result => {
              const persisted = loadPostureProfileState().injectedWarmupDrills
              setRawDrills(persisted.length > 0 ? persisted : result.injectedDrills)
              setCompletedDrillIds([])
              setActiveTimerDrillId(null)
              setGuidedQueueActive(false)
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

      {activeVideoModal && (
        <ExerciseVideoModal
          exercise={activeVideoModal}
          onClose={() => setActiveVideoModal(null)}
        />
      )}
    </>
  )
}
