'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Building2,
  Camera,
  Clock,
  Dumbbell,
  Layers,
  Plane,
  Play,
  ShieldCheck,
  User,
  Volume2,
  X,
} from 'lucide-react'
import PostureComparisonCard from '@/components/fitness/PostureComparisonCard'
import CameraReadinessCheck from '@/components/fitness/CameraReadinessCheck'
import ExerciseVideoModal, { type ExerciseModalData } from '@/components/fitness/ExerciseVideoModal'
import { DeskResetGuidedPlayer } from '@/components/fitness/DeskResetModal'
import {
  evaluateCameraReadiness,
  READINESS_PRESET_LABELS,
  type ReadinessPresetId,
} from '@/lib/camera-readiness-engine'
import type {
  EnvironmentProfileId,
  InjectedReadinessDrill,
} from '@/lib/posture-profile-state'
import {
  playCoachStaticCue,
  type StaticCoachCueKey,
} from '@/src/lib/audio/coachVoiceEngine'

interface MovementLabTabSpec {
  id: 'posture-mesh' | 'opt-switcher'
  label: string
  subtitle: string
  privacyNote: string
  voiceCueKey: StaticCoachCueKey
  voiceLabel: string
}

const LAB_TABS: ReadonlyArray<MovementLabTabSpec> = [
  {
    id: 'posture-mesh',
    label: '33-Point Posture Check',
    subtitle:
      'Compare baseline vs. current alignment or test a side-profile photo locally in your browser—zero cloud video uploads.',
    privacyNote: 'Runs 100% locally in your browser · Zero cloud upload',
    voiceCueKey: 'calibration_framing',
    voiceLabel: 'Hear Coach Gordon Framing Cue',
  },
  {
    id: 'opt-switcher',
    label: '5-Phase OPT™ Environment Switcher',
    subtitle:
      'Adapt your workout across Bodyweight Only, Home Dumbbells, Apartment Gym, or Hotel Travel—plus 20m Express, 30s Readiness, and 5-Min Desk Reset.',
    privacyNote: 'Goal-matched NASM OPT™ progression · Joint-safe regressions',
    voiceCueKey: 'tempo_3_1_1_eccentric',
    voiceLabel: 'Hear Coach Gordon Tempo Cue',
  },
]

interface EnvironmentExerciseItem {
  slot: string
  name: string
  imageUrl: string
  videoUrl: string
  cue: string
  regressionName: string
  regressionCue: string
}

const ENVIRONMENT_PREVIEW_BLOCKS: Record<
  EnvironmentProfileId,
  {
    label: string
    equipmentNote: string
    primaryPair: string
    tempoAndCredit: string
    exercises: [EnvironmentExerciseItem, EnvironmentExerciseItem]
  }
> = {
  bodyweight_only: {
    label: 'Bodyweight Only',
    equipmentNote: 'Zero equipment required · Living room or hotel room floor',
    primaryPair: 'A1. Rear-Foot-Elevated Split Squat × A2. Tempo Deficit Push-Up',
    tempoAndCredit: '4-2-1 Isometric Pause Tempo · Full Phase 02 Credit',
    exercises: [
      {
        slot: 'A1 · Zero-Gear Lower',
        name: 'Bulgarian Split Squat',
        imageUrl: '/images/exercises/bulgarian-split-squat.jpg',
        videoUrl: '/videos/exercises/bulgarian-split-squat.mp4',
        cue: 'Elevate rear foot on a chair or bed; 4s lowering with a 2s controlled pause.',
        regressionName: 'Supported Box Split Squat',
        regressionCue: 'Shorten stance and hold a wall or chair for knee-friendly balance.',
      },
      {
        slot: 'A2 · Zero-Gear Upper',
        name: 'Push Up',
        imageUrl: '/images/exercises/push-up.jpg',
        videoUrl: '/videos/exercises/push-up.mp4',
        cue: 'Maintain a crisp ear-to-ankle line with a 2-second bottom hover.',
        regressionName: 'Incline Hands-Elevated Push-Up',
        regressionCue: 'Elevate hands on a sturdy counter to unload anterior shoulder stress.',
      },
    ],
  },
  home_gym: {
    label: 'Home Dumbbells',
    equipmentNote: 'Adjustable or fixed dumbbells + flat floor space',
    primaryPair: 'A1. Heels-Elevated Goblet Squat × A2. Single-Leg Balance Reach',
    tempoAndCredit: '3-1-1 Lowering Tempo · Full Phase 02 Strength Endurance Credit',
    exercises: [
      {
        slot: 'A1 · Compound Prime',
        name: 'Goblet Squat',
        imageUrl: '/images/exercises/goblet-squat.jpg',
        videoUrl: '/videos/exercises/goblet-squat.mp4',
        cue: 'Elevate heels slightly, brace 360° core, and descend on a 3-second count.',
        regressionName: 'Box-Target Bodyweight Squat',
        regressionCue: 'Tap a chair at pain-free depth to protect knees while reinforcing hip hinge.',
      },
      {
        slot: 'A2 · Unilateral Stability',
        name: 'Single Leg Balance Reach',
        imageUrl: '/images/exercises/single-leg-balance-reach-frontal-plane.jpg',
        videoUrl: '/videos/exercises/single-leg-balance-reach-frontal-plane.mp4',
        cue: 'Anchor tripod foot and stabilize hip alignment immediately after A1.',
        regressionName: 'Kickstand Hip Hinge',
        regressionCue: 'Keep back toes lightly grounded for low-back stability.',
      },
    ],
  },
  full_gym: {
    label: 'Apartment Gym',
    equipmentNote: 'Dumbbells + cable stack or adjustable bench',
    primaryPair: 'A1. Dumbbell Romanian Deadlift × A2. Standing Cable Row',
    tempoAndCredit: '3-1-1 Controlled Eccentric · Balanced Posterior Chain Credit',
    exercises: [
      {
        slot: 'A1 · Posterior Hinge',
        name: 'Dumbbell Romanian Deadlift',
        imageUrl: '/images/exercises/dumbbell-romanian-deadlift.jpg',
        videoUrl: '/videos/exercises/dumbbell-romanian-deadlift.mp4',
        cue: 'Hinge hips back with dumbbells close to thighs and ribs stacked over pelvis.',
        regressionName: 'Glute Bridge Iso Hold',
        regressionCue: 'Decompresses lumbar spine while maintaining glute-hamstring activation.',
      },
      {
        slot: 'A2 · Posture Pull',
        name: 'Standing Tubing Row',
        imageUrl: '/images/exercises/standing-tubing-row.jpg',
        videoUrl: '/videos/exercises/standing-tubing-row.mp4',
        cue: 'Draw shoulder blades down and back without shrugging upper traps.',
        regressionName: 'Chest-Supported Dumbbell Row',
        regressionCue: 'Supports torso on an incline bench to remove lower-back fatigue.',
      },
    ],
  },
  hotel_travel: {
    label: 'Hotel Travel',
    equipmentNote: 'Light hotel rack dumbbells (up to 35 lb) · Missing bench/barbell adapted',
    primaryPair: 'A1. Rear-Foot-Elevated Split Squat × A2. Kickstand DB Hip Hinge',
    tempoAndCredit: '3-1-1 Unilateral Load Match · Zero Lost Phase 02 Momentum',
    exercises: [
      {
        slot: 'A1 · Unilateral Force Match',
        name: 'Bulgarian Split Squat',
        imageUrl: '/images/exercises/bulgarian-split-squat.jpg',
        videoUrl: '/videos/exercises/bulgarian-split-squat.mp4',
        cue: 'Doubles per-leg tension so light hotel dumbbells match your home stimulus.',
        regressionName: 'Supported Reverse Lunge',
        regressionCue: 'Step back smoothly with light hand support to keep knees calm.',
      },
      {
        slot: 'A2 · Posterior Hinge Match',
        name: 'Dumbbell Romanian Deadlift',
        imageUrl: '/images/exercises/dumbbell-romanian-deadlift.jpg',
        videoUrl: '/videos/exercises/dumbbell-romanian-deadlift.mp4',
        cue: '3-second eccentric hip hinge keeping dumbbells tight along thighs.',
        regressionName: 'Single-Leg Glute Bridge',
        regressionCue: 'Zero axial spine load while preserving posterior-chain progression.',
      },
    ],
  },
}

export default function AppSneakPeekShowcase() {
  const baseId = useId()
  const [hydrated, setHydrated] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sandboxExpress, setSandboxExpress] = useState(true)
  const [sandboxEnv, setSandboxEnv] = useState<EnvironmentProfileId>('hotel_travel')
  const [jointSafeSwapped, setJointSafeSwapped] = useState(false)
  const [showDeskReset, setShowDeskReset] = useState(false)
  const [readinessPreset, setReadinessPreset] = useState<ReadinessPresetId>('tight_hips_ankles')
  const [liveReadinessOpen, setLiveReadinessOpen] = useState(false)
  const [customReadinessResult, setCustomReadinessResult] = useState<{
    readinessScore: number
    injectedDrills: InjectedReadinessDrill[]
  } | null>(null)
  const [activeExerciseModal, setActiveExerciseModal] = useState<ExerciseModalData | null>(null)

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    setHydrated(true)
  }, [])

  const presetReadiness = useMemo(
    () =>
      evaluateCameraReadiness({
        screenMode: 'overhead_squat',
        preset: readinessPreset,
        expressModeActive: sandboxExpress,
      }),
    [readinessPreset, sandboxExpress]
  )

  const displayedReadinessScore =
    customReadinessResult?.readinessScore ?? presetReadiness.readinessScore
  const displayedInjectedDrills =
    customReadinessResult?.injectedDrills ?? presetReadiness.injectedDrills
  const displayedTotalDurationSec = displayedInjectedDrills.reduce(
    (sum, d) => sum + d.durationSec,
    0
  )

  const selectTab = (index: number, focus = false) => {
    setSelectedIndex(index)
    if (index !== 1) {
      setLiveReadinessOpen(false)
    }
    const btn = tabRefs.current[index]
    if (btn && focus) btn.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = selectedIndex
    if (e.key === 'ArrowRight') next = (selectedIndex + 1) % LAB_TABS.length
    else if (e.key === 'ArrowLeft') next = (selectedIndex - 1 + LAB_TABS.length) % LAB_TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = LAB_TABS.length - 1
    else return
    e.preventDefault()
    selectTab(next, true)
  }

  const activeTab = LAB_TABS[selectedIndex]
  const envSpec = ENVIRONMENT_PREVIEW_BLOCKS[sandboxEnv]

  return (
    <section
      id="movement-lab"
      aria-labelledby={`${baseId}-heading`}
      className="relative mx-auto my-14 max-w-5xl scroll-mt-24 text-zinc-100"
    >
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-300">
          Interactive Movement Lab · Zero Login Required
        </span>
        <h2
          id={`${baseId}-heading`}
          style={{ textWrap: 'balance' }}
          className="mt-3.5 mb-2 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          Preview the Posture Check &amp; Adaptive Workout Engine
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-300">
          Try the two core tools members use every week—all camera processing runs privately inside
          your browser with zero video uploads.
        </p>
      </div>

      {/* Clean 2-Tab Selector */}
      <div
        role="tablist"
        aria-label="Forge Athletic interactive preview tabs"
        data-hydrated={hydrated ? 'true' : undefined}
        onKeyDown={handleKeyDown}
        className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {LAB_TABS.map((tab, index) => {
          const selected = index === selectedIndex
          const tabId = `${baseId}-tab-${tab.id}`
          return (
            <button
              key={tab.id}
              ref={el => {
                tabRefs.current[index] = el
              }}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(index, false)}
              className={`forge-tactile-press flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                selected
                  ? 'border-emerald-500/45 bg-emerald-500/12 text-white'
                  : 'border-white/10 bg-[#111318] text-zinc-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {index === 0 ? (
                <Layers size={16} strokeWidth={1.8} className="shrink-0 text-emerald-300" aria-hidden="true" />
              ) : (
                <Clock size={16} strokeWidth={1.8} className="shrink-0 text-amber-300" aria-hidden="true" />
              )}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Clean Clinical Preview Frame */}
      <div
        className="rounded-2xl border border-white/[0.08] bg-[#111318] p-4 sm:p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 64px rgba(0, 0, 0, 0.65)',
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
          <div>
            <h3 className="text-base font-bold text-white sm:text-lg">{activeTab.label}</h3>
            <p className="mt-0.5 text-xs text-zinc-400">{activeTab.privacyNote}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              playCoachStaticCue(activeTab.voiceCueKey, { forceUnlockVoiceOnTap: true })
            }
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
          >
            <Volume2 size={14} className="text-emerald-300" aria-hidden="true" />
            <span>{activeTab.voiceLabel}</span>
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-zinc-300 sm:text-sm">{activeTab.subtitle}</p>

        {LAB_TABS.map(tab => {
          const selected = tab.id === activeTab.id
          const tabId = `${baseId}-tab-${tab.id}`
          const panelId = `${baseId}-panel-${tab.id}`
          return (
            <div
              key={tab.id}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={!selected}
            >
              {selected ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#090A0D] p-3 sm:p-4">
                  {tab.id === 'posture-mesh' ? <PostureComparisonCard sandboxMode /> : null}

                  {tab.id === 'opt-switcher' ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/[0.08] bg-[#111318] p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.07] pb-3">
                          <div>
                            <div className="text-xs font-semibold text-amber-300">
                              Adaptive 5-Phase NASM OPT™ Session
                            </div>
                            <div className="mt-0.5 text-sm font-bold text-white">
                              Switch Environment, Session Length, or Joint Comfort in 1 Tap
                            </div>
                          </div>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-emerald-300">
                            Readiness: {displayedReadinessScore}/100
                          </span>
                        </div>

                        {/* Environment Profile Switcher (All 4 Environments) */}
                        <div className="mt-3.5 rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-zinc-400">
                              Training Environment
                            </span>
                            <span className="text-xs font-bold text-emerald-300">
                              {envSpec.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(
                              [
                                { id: 'bodyweight_only', label: 'Bodyweight Only', Icon: User },
                                { id: 'home_gym', label: 'Home Dumbbells', Icon: Dumbbell },
                                { id: 'full_gym', label: 'Apartment Gym', Icon: Building2 },
                                { id: 'hotel_travel', label: 'Hotel Travel', Icon: Plane },
                              ] as const
                            ).map(({ id, label, Icon }) => {
                              const active = sandboxEnv === id
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() => {
                                    setSandboxEnv(id)
                                    setJointSafeSwapped(false)
                                  }}
                                  className={`forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                    active
                                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                      : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20'
                                  }`}
                                >
                                  <Icon size={13} aria-hidden="true" />
                                  <span>{label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Time Window + 10-Second Joint Comfort Swapper */}
                        <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                          <div className="rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-zinc-400">
                                Time Window
                              </span>
                              <span className="text-xs font-bold text-amber-300">
                                {sandboxExpress ? '20m Express Active' : '45m Full Block'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                aria-pressed={sandboxExpress}
                                onClick={() => {
                                  setSandboxExpress(true)
                                  setCustomReadinessResult(null)
                                }}
                                className={`forge-tactile-press min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                  sandboxExpress
                                    ? 'border-amber-400/50 bg-amber-400 text-zinc-950'
                                    : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20'
                                }`}
                              >
                                20m Express
                              </button>
                              <button
                                type="button"
                                aria-pressed={!sandboxExpress}
                                onClick={() => {
                                  setSandboxExpress(false)
                                  setCustomReadinessResult(null)
                                }}
                                className={`forge-tactile-press min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                  !sandboxExpress
                                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                    : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20'
                                }`}
                              >
                                45m Standard
                              </button>
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-zinc-400">
                                10-Second Joint Comfort Swapper
                              </span>
                              <span className="text-xs font-bold text-emerald-300">
                                {jointSafeSwapped ? 'Regression Active' : 'Standard Load'}
                              </span>
                            </div>
                            <button
                              type="button"
                              aria-pressed={jointSafeSwapped}
                              onClick={() => setJointSafeSwapped(prev => !prev)}
                              className={`forge-tactile-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                                jointSafeSwapped
                                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                                  : 'border-white/10 bg-[#181B22] text-zinc-200 hover:border-amber-400/40'
                              }`}
                            >
                              <ShieldCheck size={14} aria-hidden="true" />
                              <span>
                                {jointSafeSwapped
                                  ? 'Joint-Safe NASM Regression Active (Reset)'
                                  : 'Tap "Joint Feels Pinchy" to Preview NASM Swap'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Adapted Compound Superset Readout */}
                        <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                            <span>{envSpec.equipmentNote}</span>
                            <span className="font-semibold text-emerald-300">
                              {envSpec.tempoAndCredit}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white sm:text-sm">
                              {envSpec.primaryPair}
                            </span>
                            <span
                              data-testid="sneak-peek-express-prescription-pill"
                              className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-amber-200"
                            >
                              {sandboxExpress
                                ? '2 × 10–12 · 45s Density Rest (~18m Total)'
                                : '4 × 8–10 · 90s Rest (~45m Standard)'}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {envSpec.exercises.map(ex => {
                              const displayName = jointSafeSwapped ? ex.regressionName : ex.name
                              const displayCue = jointSafeSwapped ? ex.regressionCue : ex.cue
                              return (
                                <button
                                  key={`${sandboxEnv}-${ex.slot}`}
                                  type="button"
                                  onClick={() =>
                                    setActiveExerciseModal({
                                      name: displayName,
                                      imageUrl: ex.imageUrl,
                                      videoUrl: ex.videoUrl,
                                      protocol: sandboxExpress
                                        ? '2 × 10–12 · 45s Density Rest'
                                        : '4 × 8–10 · 90s Standard Rest',
                                      phaseLabel: `PHASE 02 · ${envSpec.label}`,
                                      coachingCues: [displayCue],
                                    })
                                  }
                                  className="forge-tactile-press group flex min-h-[68px] flex-col gap-2 rounded-xl border border-white/[0.07] bg-[#181B22] p-2.5 text-left transition-colors hover:border-emerald-400/45 hover:bg-[#1D212A] sm:flex-row sm:items-center sm:gap-2.5 sm:p-2"
                                >
                                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#090A0D] sm:aspect-auto sm:h-12 sm:w-20">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={ex.imageUrl}
                                      alt={displayName}
                                      width={80}
                                      height={48}
                                      loading="lazy"
                                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <span
                                      aria-hidden="true"
                                      className="absolute inset-0 flex items-center justify-center bg-black/35 text-emerald-300"
                                    >
                                      <Play size={12} fill="currentColor" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-semibold text-emerald-300">
                                      {jointSafeSwapped ? 'Joint-Safe Regression' : ex.slot} · Watch Demo
                                    </div>
                                    <div className="truncate text-xs font-bold text-white">
                                      {displayName}
                                    </div>
                                    <div className="truncate text-[11px] text-zinc-400">
                                      {displayCue}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* 30-Second Camera Readiness + Optional 5-Min Desk Reset */}
                        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-[#090A0D] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                              <Activity size={14} className="text-emerald-400" aria-hidden="true" />
                              <span>30-Second Camera Readiness · Auto Warm-Up Injection</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] tabular-nums text-zinc-400">
                                {displayedInjectedDrills.length === 0
                                  ? '0s added · Cleared for Set 1'
                                  : `${displayedInjectedDrills.length} drills · ${displayedTotalDurationSec}s total`}
                              </span>
                              <button
                                type="button"
                                aria-expanded={liveReadinessOpen}
                                onClick={() => setLiveReadinessOpen(prev => !prev)}
                                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200 transition-colors hover:bg-emerald-500/25"
                              >
                                {liveReadinessOpen ? (
                                  <>
                                    <X size={13} aria-hidden="true" />
                                    <span>Close Camera Check</span>
                                  </>
                                ) : (
                                  <>
                                    <Camera size={13} aria-hidden="true" />
                                    <span>Try 30s Camera Check</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {liveReadinessOpen ? (
                            <div className="mt-3">
                              <CameraReadinessCheck
                                expressModeActive={sandboxExpress}
                                isOpen={liveReadinessOpen}
                                onComplete={res => {
                                  setCustomReadinessResult({
                                    readinessScore: res.readinessScore,
                                    injectedDrills: res.injectedDrills,
                                  })
                                  setLiveReadinessOpen(false)
                                }}
                                onSkip={() => setLiveReadinessOpen(false)}
                              />
                            </div>
                          ) : null}

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {(Object.keys(READINESS_PRESET_LABELS) as ReadinessPresetId[]).map(
                              presetKey => {
                                const active =
                                  customReadinessResult === null && readinessPreset === presetKey
                                return (
                                  <button
                                    key={presetKey}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => {
                                      setCustomReadinessResult(null)
                                      setReadinessPreset(presetKey)
                                    }}
                                    className={`forge-tactile-press min-h-[44px] rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                                      active
                                        ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                                        : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20'
                                    }`}
                                  >
                                    {READINESS_PRESET_LABELS[presetKey]}
                                  </button>
                                )
                              }
                            )}
                          </div>
                        </div>

                        {/* Collapsible 5-Min Desk Reset Preview */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-[#090A0D] px-3.5 py-2.5">
                          <span className="text-xs text-zinc-300">
                            Need a midday mobility break? Preview the guided{' '}
                            <strong className="text-white">5-Min Desk Reset</strong>.
                          </span>
                          <button
                            type="button"
                            aria-expanded={showDeskReset}
                            onClick={() => setShowDeskReset(prev => !prev)}
                            className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-lg border border-white/15 bg-[#181B22] px-3 py-1.5 text-xs font-semibold text-amber-200 hover:border-amber-400/40"
                          >
                            {showDeskReset ? 'Hide 5-Min Desk Reset' : 'Open 5-Min Desk Reset'}
                          </button>
                        </div>

                        {showDeskReset ? (
                          <div className="mt-3">
                            <DeskResetGuidedPlayer
                              sandboxMode
                              activeFlags={['forward_head', 'rounded_shoulders']}
                              expressMode={sandboxExpress}
                              environmentProfile={sandboxEnv}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5 text-xs text-zinc-400">
          <span>Want a deeper breakdown of our 33-point movement screen or installable PWA?</span>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/audit"
              className="font-semibold text-amber-300 underline-offset-4 hover:underline"
            >
              Full 33-Point Movement Screen →
            </Link>
            <Link
              href="/apps"
              className="font-semibold text-emerald-300 underline-offset-4 hover:underline"
            >
              PWA Install Guide →
            </Link>
          </div>
        </div>
      </div>

      {activeExerciseModal ? (
        <ExerciseVideoModal
          exercise={activeExerciseModal}
          onClose={() => setActiveExerciseModal(null)}
        />
      ) : null}
    </section>
  )
}
