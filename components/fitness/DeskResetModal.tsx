'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react'
import {
  DeskErgonomicFlag,
  EnvironmentProfileId,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  recordDeskResetCompletedOnDate,
} from '@/lib/posture-profile-state'
import { playForgeTactileTone, useSfxMuted } from '@/lib/sfx-audio'
import { playCoachStaticCue } from '@/src/lib/audio/coachVoiceEngine'
import { trackEvent } from '@/src/lib/telemetry/telemetryClient'

export interface DeskResetDrill {
  id: string
  name: string
  durationSec: number
  targetFlag?: DeskErgonomicFlag
  cue: string
}

const ALL_DESK_RESET_DRILLS: DeskResetDrill[] = [
  {
    id: 'cervical_chin_tuck',
    name: 'Seated Deep Cervical Chin Tucks',
    durationSec: 75,
    targetFlag: 'forward_head',
    cue: 'Glide your chin straight back to stack ears over shoulders; hold 3 seconds per rep.',
  },
  {
    id: 'thoracic_pec_opener',
    name: 'Chair Thoracic Extension & Pec Release',
    durationSec: 75,
    targetFlag: 'rounded_shoulders',
    cue: 'Clasp hands behind head, open elbows wide, and exhale over the upper chair back.',
  },
  {
    id: 'hip_flexor_decompression',
    name: 'Split-Stance Hip Flexor & Psoas Opener',
    durationSec: 75,
    targetFlag: 'hip_flexor_tightness',
    cue: 'Step one foot back beside your desk, tuck your tailbone, and reach tall overhead.',
  },
  {
    id: 'scapular_chair_angels',
    name: 'Seated Scapular Wall Slides & Wrist Reset',
    durationSec: 75,
    cue: 'Draw shoulder blades down into back pockets while sweeping forearms overhead.',
  },
]

export function buildOrderedDeskResetDrills(flags: DeskErgonomicFlag[]): DeskResetDrill[] {
  const flagSet = new Set(flags)
  const prioritized = ALL_DESK_RESET_DRILLS.filter(d => d.targetFlag && flagSet.has(d.targetFlag))
  const remaining = ALL_DESK_RESET_DRILLS.filter(d => !d.targetFlag || !flagSet.has(d.targetFlag))
  return [...prioritized, ...remaining]
}

export interface DeskResetPlayerContentProps {
  activeFlags?: DeskErgonomicFlag[]
  sandboxMode?: boolean
  expressMode?: boolean
  onToggleExpress?: (next: boolean) => void
  environmentProfile?: EnvironmentProfileId
  onChangeEnvironment?: (env: EnvironmentProfileId) => void
  activeModalOpen?: boolean
  onCompleted?: () => void
}

export function DeskResetGuidedPlayer({
  activeFlags = [],
  sandboxMode = false,
  expressMode = false,
  onToggleExpress,
  environmentProfile = 'home_gym',
  onChangeEnvironment,
  activeModalOpen = true,
  onCompleted,
}: DeskResetPlayerContentProps) {
  const { sfxMuted, toggleSfxMuted } = useSfxMuted()
  const drills = useMemo(() => buildOrderedDeskResetDrills(activeFlags), [activeFlags])
  const progressId = useId()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(drills[0]?.durationSec ?? 75)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const completionFiredRef = useRef(false)

  useEffect(() => {
    setCurrentIndex(0)
    setSecondsLeft(drills[0]?.durationSec ?? 75)
    setRunning(false)
    setCompleted(false)
    completionFiredRef.current = false
  }, [drills])

  // Pause active timer immediately if parent modal closes so audio/telemetry never fire from a closed dialog
  useEffect(() => {
    if (!activeModalOpen && running) {
      setRunning(false)
    }
  }, [activeModalOpen, running])

  // Pure 1-second decrement (keeps React state updater side-effect-free under StrictMode)
  useEffect(() => {
    if (!running || !activeModalOpen) return
    const timer = window.setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, activeModalOpen])

  // Handle drill transition or 5-minute completion side effects cleanly outside state updaters
  useEffect(() => {
    if (!running || secondsLeft > 0) return

    const nextIdx = currentIndex + 1
    if (nextIdx < drills.length) {
      setCurrentIndex(nextIdx)
      setSecondsLeft(drills[nextIdx].durationSec)
      playCoachStaticCue('desk_reset_transition')
      return
    }

    setRunning(false)
    setCompleted(true)
    if (!completionFiredRef.current) {
      completionFiredRef.current = true
      playForgeTactileTone('success')
      if (!sandboxMode) {
        recordDeskResetCompletedOnDate()
        const totalDurationSec = drills.reduce((acc, d) => acc + d.durationSec, 0)
        void trackEvent('desk_reset_completed', {
          duration_sec: totalDurationSec,
          drills_completed: drills.length,
          strain_flags_targeted: activeFlags,
          environment_profile: environmentProfile,
        })
      }
      onCompleted?.()
    }
  }, [
    secondsLeft,
    running,
    currentIndex,
    drills,
    onCompleted,
    sandboxMode,
    activeFlags,
    environmentProfile,
  ])

  const currentDrill = drills[currentIndex] ?? drills[0]
  const totalSessionSec = useMemo(
    () => drills.reduce((sum, d) => sum + d.durationSec, 0),
    [drills]
  )
  const elapsedSessionSec = useMemo(() => {
    if (completed) return totalSessionSec
    const priorSec = drills.slice(0, currentIndex).reduce((sum, d) => sum + d.durationSec, 0)
    const currentElapsed = Math.max(0, (currentDrill?.durationSec ?? 75) - secondsLeft)
    return Math.min(totalSessionSec, priorSec + currentElapsed)
  }, [completed, currentDrill?.durationSec, currentIndex, drills, secondsLeft, totalSessionSec])

  return (
    <div className="space-y-3.5 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            <Clock size={12} strokeWidth={1.75} /> 5-Min Desk Reset
          </span>
          {activeFlags.length > 0 ? (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10.5px] font-semibold text-amber-300">
              Targeted for {activeFlags.map(f => f.replace(/_/g, ' ')).join(', ')}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            const wasMuted = sfxMuted
            toggleSfxMuted()
            if (wasMuted) {
              playCoachStaticCue('desk_reset_transition', { forceUnlockVoiceOnTap: true })
            }
          }}
          aria-label="Desk reset audio cues"
          aria-pressed={!sfxMuted}
          className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
            sfxMuted
              ? 'border-white/10 bg-[#181B22] text-zinc-400 hover:border-white/15 hover:bg-[#1D212A] hover:text-zinc-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
          }`}
        >
          {sfxMuted ? (
            <VolumeX size={13} strokeWidth={1.75} />
          ) : (
            <Volume2 size={13} strokeWidth={1.75} className="text-emerald-300" />
          )}
          {sfxMuted ? 'SFX MUTED' : 'SFX LIVE'}
        </button>
      </div>

      {/* Optional standalone Sandbox Express & Hotel Travel Toggles when parent does not provide its own bar */}
      {sandboxMode && (onToggleExpress || onChangeEnvironment) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#111318] p-2.5">
          {onToggleExpress ? (
            <button
              type="button"
              aria-pressed={expressMode}
              onClick={() => onToggleExpress(!expressMode)}
              className={`forge-tactile-press min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                expressMode
                  ? 'border border-amber-400/40 bg-amber-400 text-zinc-950'
                  : 'border border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              ⚡ 20m Express {expressMode ? 'ON (18m Total)' : 'OFF (45m Standard)'}
            </button>
          ) : null}

          {onChangeEnvironment ? (
            <button
              type="button"
              aria-pressed={environmentProfile === 'hotel_travel'}
              onClick={() =>
                onChangeEnvironment(environmentProfile === 'hotel_travel' ? 'home_gym' : 'hotel_travel')
              }
              className={`forge-tactile-press min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                environmentProfile === 'hotel_travel'
                  ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                  : 'border border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              ✈️ {environmentProfile === 'hotel_travel' ? 'Hotel Travel Active' : 'Switch to Hotel Travel'}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Active Guided Drill Stage */}
      <div className="rounded-2xl border border-emerald-500/25 bg-[#111318] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-emerald-300">
              Drill {currentIndex + 1} of {drills.length}
              {currentDrill.targetFlag ? ' · Priority Desk Fix' : ''}
            </div>
            <div className="mt-1 text-sm font-bold tracking-tight text-white sm:text-base">
              {currentDrill.name}
            </div>
          </div>
          <div className="shrink-0 whitespace-nowrap font-mono text-2xl font-extrabold tabular-nums text-emerald-300 sm:text-3xl">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">{currentDrill.cue}</p>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10.5px] font-semibold text-zinc-400">
            <label htmlFor={progressId}>5-Min Session Progress</label>
            <span className="font-mono tabular-nums text-emerald-300">
              {Math.round((elapsedSessionSec / Math.max(1, totalSessionSec)) * 100)}%
            </span>
          </div>
          <progress
            id={progressId}
            className="forge-progress-bar"
            value={elapsedSessionSec}
            max={totalSessionSec}
          />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (completed) {
                setCurrentIndex(0)
                setSecondsLeft(drills[0].durationSec)
                setCompleted(false)
                completionFiredRef.current = false
              }
              setRunning(prev => !prev)
            }}
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            {running ? (
              <>
                <Pause size={14} strokeWidth={1.75} aria-hidden="true" /> Pause Drill
              </>
            ) : (
              <>
                <Play size={14} strokeWidth={1.75} aria-hidden="true" />{' '}
                {completed ? 'Restart 5-Min Reset' : 'Start Guided Timer'}
              </>
            )}
          </button>

          {currentIndex < drills.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                const next = currentIndex + 1
                setCurrentIndex(next)
                setSecondsLeft(drills[next].durationSec)
              }}
              className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Next Drill →
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setRunning(false)
              setCurrentIndex(0)
              setSecondsLeft(drills[0].durationSec)
              setCompleted(false)
              completionFiredRef.current = false
            }}
            aria-label="Reset timer"
            className="forge-tactile-press inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-300 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            <RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {completed ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-200"
          >
            <CheckCircle2 size={15} strokeWidth={1.75} aria-hidden="true" /> 5-Min Desk Reset complete — thoracic &amp; hip posture refreshed!
          </div>
        ) : null}
      </div>

      {/* Ordered Drill Queue */}
      <ol className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
        {drills.map((d, idx) => {
          const active = idx === currentIndex
          return (
            <li key={d.id}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => {
                  setCurrentIndex(idx)
                  setSecondsLeft(d.durationSec)
                }}
                className={`forge-tactile-press flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                  active
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/15 hover:bg-[#1D212A]'
                }`}
              >
                <span className="truncate font-semibold tabular-nums">
                  {idx + 1}. {d.name}
                </span>
                <span className="ml-2 shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
                  {d.durationSec}s
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export interface DeskResetSlotCardProps {
  promotedHero?: boolean
  onLaunchReset: () => void
}

export function DeskResetSlotCard({ promotedHero = false, onLaunchReset }: DeskResetSlotCardProps) {
  const [flags, setFlags] = useState<DeskErgonomicFlag[]>([])

  useEffect(() => {
    const sync = () => setFlags(loadPostureProfileState().ergonomicFlags)
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [])

  if (promotedHero) {
    return (
      <section
        className="forge-surface-card rounded-2xl border border-emerald-500/30 p-4 text-zinc-100 sm:p-6"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.12), transparent 60%), #111318',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            <Sparkles size={13} strokeWidth={1.75} /> Active Recovery Hero · 5-Min Desk Reset
          </span>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-300">
            No Sweat · At Your Desk
          </span>
        </div>
        <h2 className="mt-2 font-serif text-lg font-bold tracking-tight text-white sm:text-xl">
          Unwind Neck, Shoulder &amp; Hip Tightness in 5 Minutes
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300 sm:text-sm">
          {flags.length > 0
            ? `Pre-loaded for your latest audit: ${flags.map(f => f.replace(/_/g, ' ')).join(', ')}.`
            : '4 calm, guided posture mobility drills between meetings or on recovery days.'}
        </p>
        <button
          type="button"
          onClick={onLaunchReset}
          className="forge-tactile-press mt-3.5 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
        >
          Start 5-Min Desk Reset <ArrowRight size={14} strokeWidth={1.75} />
        </button>
      </section>
    )
  }

  return (
    <div className="forge-surface-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-zinc-100">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
          <Clock size={13} strokeWidth={1.75} /> 5-Min Desk Reset
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-400">
          {flags.length > 0
            ? `Targeted drills ready (${flags.length} desk strain flags)`
            : 'Stiff between calls? Run a 5-min seated mobility reset'}
        </p>
      </div>
      <button
        type="button"
        onClick={onLaunchReset}
        className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors duration-150 hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
      >
        Start 5m <ArrowRight size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}

export interface DeskResetModalProps {
  open: boolean
  onClose: () => void
  overrideFlags?: DeskErgonomicFlag[]
}

export default function DeskResetModal({ open, onClose, overrideFlags }: DeskResetModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const [persistedFlags, setPersistedFlags] = useState<DeskErgonomicFlag[]>([])

  useEffect(() => {
    const sync = () => setPersistedFlags(loadPostureProfileState().ergonomicFlags)
    if (open) sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || typeof HTMLDialogElement === 'undefined') return
    if ('closedBy' in HTMLDialogElement.prototype) return

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }

    let pressedOutside = false
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
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

  const activeFlags = overrideFlags !== undefined ? overrideFlags : persistedFlags

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby={headingId}
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = ''
        onClose()
      }}
      style={{ zIndex: 100060 }}
      className="forge-glass-modal m-auto w-[min(94vw,560px)] overscroll-contain rounded-2xl p-0 text-zinc-100 backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[92dvh] overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div>
            <div className="forge-eyebrow-micro text-emerald-300">Active Posture Recovery</div>
            <h2 id={headingId} className="mt-0.5 font-serif text-lg font-bold tracking-tight text-white sm:text-xl">
              Targeted 5-Minute Desk Reset
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close 5-Min Desk Reset"
            className="forge-tactile-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-300 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <DeskResetGuidedPlayer activeFlags={activeFlags} activeModalOpen={open} />
      </div>
    </dialog>
  )
}
