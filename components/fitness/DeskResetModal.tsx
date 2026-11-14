'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react'
import {
  DeskErgonomicFlag,
  EnvironmentProfileId,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
} from '@/lib/posture-profile-state'
import { playForgeTactileTone, useSfxMuted } from '@/lib/sfx-audio'

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
  onCompleted?: () => void
}

export function DeskResetGuidedPlayer({
  activeFlags = [],
  sandboxMode = false,
  expressMode = false,
  onToggleExpress,
  environmentProfile = 'home_gym',
  onChangeEnvironment,
  onCompleted,
}: DeskResetPlayerContentProps) {
  const { sfxMuted, toggleSfxMuted } = useSfxMuted()
  const drills = useMemo(() => buildOrderedDeskResetDrills(activeFlags), [activeFlags])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(drills[0]?.durationSec ?? 75)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
    setSecondsLeft(drills[0]?.durationSec ?? 75)
    setRunning(false)
    setCompleted(false)
  }, [drills])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1
        const nextIdx = currentIndex + 1
        if (nextIdx < drills.length) {
          setCurrentIndex(nextIdx)
          playForgeTactileTone('cue')
          return drills[nextIdx].durationSec
        }
        setRunning(false)
        setCompleted(true)
        playForgeTactileTone('success')
        onCompleted?.()
        return 0
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, currentIndex, drills, onCompleted])

  const currentDrill = drills[currentIndex] ?? drills[0]

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
          onClick={toggleSfxMuted}
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

      {/* Sandbox Express & Hotel Travel Toggles (used in Landing Sneak Peek Tab 4) */}
      {sandboxMode ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#111318] p-2.5">
          <button
            type="button"
            aria-pressed={expressMode}
            onClick={() => onToggleExpress?.(!expressMode)}
            className={`forge-tactile-press min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
              expressMode
                ? 'border border-amber-400/40 bg-amber-400 text-zinc-950'
                : 'border border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
            }`}
          >
            ⚡ 20m Express {expressMode ? 'ON (18m Total)' : 'OFF (45m Standard)'}
          </button>

          <button
            type="button"
            aria-pressed={environmentProfile === 'hotel_travel'}
            onClick={() =>
              onChangeEnvironment?.(environmentProfile === 'hotel_travel' ? 'home_gym' : 'hotel_travel')
            }
            className={`forge-tactile-press min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
              environmentProfile === 'hotel_travel'
                ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                : 'border border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
            }`}
          >
            ✈️ {environmentProfile === 'hotel_travel' ? 'Hotel Travel Active' : 'Switch to Hotel Travel'}
          </button>
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
          <div className="font-mono text-2xl font-extrabold tabular-nums text-emerald-300 sm:text-3xl">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">{currentDrill.cue}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (completed) {
                setCurrentIndex(0)
                setSecondsLeft(drills[0].durationSec)
                setCompleted(false)
              }
              setRunning(prev => !prev)
            }}
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            {running ? (
              <>
                <Pause size={14} strokeWidth={1.75} /> Pause Drill
              </>
            ) : (
              <>
                <Play size={14} strokeWidth={1.75} /> {completed ? 'Restart 5-Min Reset' : 'Start Guided Timer'}
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
            }}
            aria-label="Reset timer"
            className="forge-tactile-press inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-300 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            <RotateCcw size={15} strokeWidth={1.75} />
          </button>
        </div>

        {completed ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-200">
            <CheckCircle2 size={15} strokeWidth={1.75} /> 5-Min Desk Reset complete — thoracic &amp; hip posture refreshed!
          </div>
        ) : null}
      </div>

      {/* Ordered Drill Queue */}
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {drills.map((d, idx) => {
          const active = idx === currentIndex
          return (
            <li key={d.id}>
              <button
                type="button"
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
    if (open) {
      setPersistedFlags(loadPostureProfileState().ergonomicFlags)
    }
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

  const activeFlags = overrideFlags && overrideFlags.length > 0 ? overrideFlags : persistedFlags

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="forge-glass-modal m-auto w-[min(94vw,560px)] rounded-2xl p-0 text-zinc-100 backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="p-4 sm:p-6">
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
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <DeskResetGuidedPlayer activeFlags={activeFlags} />
      </div>
    </dialog>
  )
}
