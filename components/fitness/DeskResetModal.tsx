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
    <div className="space-y-3 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
            <Clock size={11} /> 5-Min Desk Reset
          </span>
          {activeFlags.length > 0 ? (
            <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
              Targeted for {activeFlags.map(f => f.replace(/_/g, ' ')).join(', ')}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={toggleSfxMuted}
          aria-label={sfxMuted ? 'Audio cues muted. Activate sound cues' : 'Mute audio cues'}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition hover:bg-white/10"
        >
          {sfxMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-emerald-300" />}
          {sfxMuted ? 'SFX MUTED' : 'SFX LIVE'}
        </button>
      </div>

      {/* Sandbox Express & Hotel Travel Toggles (used in Landing Sneak Peek Tab 4) */}
      {sandboxMode ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
          <button
            type="button"
            aria-pressed={expressMode}
            onClick={() => onToggleExpress?.(!expressMode)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
              expressMode
                ? 'bg-amber-400 text-slate-950'
                : 'border border-white/15 bg-slate-900 text-slate-300 hover:bg-white/10'
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
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
              environmentProfile === 'hotel_travel'
                ? 'bg-sky-400 text-slate-950'
                : 'border border-white/15 bg-slate-900 text-slate-300 hover:bg-white/10'
            }`}
          >
            ✈️ {environmentProfile === 'hotel_travel' ? 'Hotel Travel Active' : 'Switch to Hotel Travel'}
          </button>
        </div>
      ) : null}

      {/* Active Guided Drill Stage */}
      <div className="rounded-xl border border-emerald-400/30 bg-slate-950/90 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Drill {currentIndex + 1} of {drills.length}
              {currentDrill.targetFlag ? ' · Priority Desk Fix' : ''}
            </div>
            <div className="mt-0.5 text-sm font-bold text-white">{currentDrill.name}</div>
          </div>
          <div className="font-mono text-2xl font-extrabold text-emerald-300">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">{currentDrill.cue}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-300"
          >
            {running ? (
              <>
                <Pause size={13} /> Pause Drill
              </>
            ) : (
              <>
                <Play size={13} /> {completed ? 'Restart 5-Min Reset' : 'Start Guided Timer'}
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
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
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
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {completed ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200">
            <CheckCircle2 size={14} /> 5-Min Desk Reset complete — thoracic &amp; hip posture refreshed!
          </div>
        ) : null}
      </div>

      {/* Ordered Drill Queue */}
      <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-white'
                    : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                <span className="truncate font-semibold">
                  {idx + 1}. {d.name}
                </span>
                <span className="ml-2 shrink-0 font-mono text-[11px] text-slate-400">{d.durationSec}s</span>
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
        className="rounded-xl border border-emerald-400/45 p-3.5 text-slate-100 shadow-lg"
        style={{
          background:
            'radial-gradient(circle at 90% 10%, rgba(16,185,129,0.22), transparent 55%), linear-gradient(145deg, #0D1B1E 0%, #080E16 100%)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-300">
            <Sparkles size={12} /> Active Recovery Hero · 5-Min Desk Reset
          </span>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
            No Sweat · At Your Desk
          </span>
        </div>
        <h2 className="mt-1.5 font-serif text-base font-bold text-white sm:text-lg">
          Unwind Neck, Shoulder &amp; Hip Tightness in 5 Minutes
        </h2>
        <p className="mt-0.5 text-xs text-slate-300">
          {flags.length > 0
            ? `Pre-loaded for your latest audit: ${flags.map(f => f.replace(/_/g, ' ')).join(', ')}.`
            : '4 calm, guided posture mobility drills between meetings or on recovery days.'}
        </p>
        <button
          type="button"
          onClick={onLaunchReset}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-300"
        >
          Start 5-Min Desk Reset <ArrowRight size={14} />
        </button>
      </section>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-[#0A131F] px-3 py-2.5 text-slate-100">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
          <Clock size={12} /> 5-Min Desk Reset
        </div>
        <p className="truncate text-[11px] text-slate-400">
          {flags.length > 0
            ? `Targeted drills ready (${flags.length} desk strain flags)`
            : 'Stiff between calls? Run a 5-min seated mobility reset'}
        </p>
      </div>
      <button
        type="button"
        onClick={onLaunchReset}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25"
      >
        Start 5m <ArrowRight size={13} />
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
      className="m-auto w-[min(94vw,540px)] rounded-2xl border border-emerald-400/35 bg-[#090E16] p-0 text-slate-100 shadow-2xl"
    >
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id={headingId} className="font-serif text-lg font-bold text-white">
            Targeted 5-Minute Desk Reset
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close 5-Min Desk Reset"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10"
          >
            <X size={15} />
          </button>
        </div>

        <DeskResetGuidedPlayer activeFlags={activeFlags} />
      </div>
    </dialog>
  )
}
