'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Camera,
  Clock,
  Dumbbell,
  Layers,
  Monitor,
  Plane,
  Play,
  Route,
  User,
  Volume2,
  X,
} from 'lucide-react'
import PostureComparisonCard from '@/components/fitness/PostureComparisonCard'
import DeskErgonomicsAudit from '@/components/fitness/DeskErgonomicsAudit'
import OptPhaseRoadmap from '@/components/fitness/OptPhaseRoadmap'
import CameraReadinessCheck from '@/components/fitness/CameraReadinessCheck'
import ExerciseVideoModal, { type ExerciseModalData } from '@/components/fitness/ExerciseVideoModal'
import { DeskResetGuidedPlayer } from '@/components/fitness/DeskResetModal'
import {
  evaluateCameraReadiness,
  READINESS_PRESET_LABELS,
  type ReadinessPresetId,
} from '@/lib/camera-readiness-engine'
import type {
  DeskErgonomicFlag,
  EnvironmentProfileId,
  InjectedReadinessDrill,
} from '@/lib/posture-profile-state'
import {
  playCoachStaticCue,
  type StaticCoachCueKey,
} from '@/src/lib/audio/coachVoiceEngine'

interface SneakPeekTabSpec {
  id: 'posture-mesh' | 'desk-ergonomics' | 'opt-roadmap' | 'express-travel'
  step: string
  label: string
  shortLabel: string
  subtitle: string
  whatItMeansForYou: string
  telemetryBadge: string
  voiceCueKey: StaticCoachCueKey
}

const SNEAK_TABS: ReadonlyArray<SneakPeekTabSpec> = [
  {
    id: 'posture-mesh',
    step: '01',
    label: '33-Point Posture Mesh',
    shortLabel: 'Posture Mesh',
    subtitle:
      'Scrub Baseline vs. Current alignment, drop in your own side-profile photo locally in-browser, or compare Before & After side-by-side.',
    whatItMeansForYou:
      'What this means for you: Identifies neck, shoulder, or hip tightness in seconds so your exercises relieve tension first—never forcing restricted joints under load.',
    telemetryBadge: 'LOCAL BROWSER VISION · ZERO CLOUD UPLOAD',
    voiceCueKey: 'calibration_framing',
  },
  {
    id: 'desk-ergonomics',
    step: '02',
    label: 'Desk Ergonomics Audit',
    shortLabel: 'Desk Audit',
    subtitle:
      'Compare Before/Optimal workstation angles, run a 5-second local camera or photo audit, and launch a targeted 5-Min Desk Reset in 1 tap.',
    whatItMeansForYou:
      'What this means for you: Pinpoints the exact monitor height or chair angle straining your neck and low back, then gives you a calm 5-minute seated reset.',
    telemetryBadge: 'LOCAL BROWSER VISION · ZERO CLOUD UPLOAD',
    voiceCueKey: 'calibration_locked',
  },
  {
    id: 'opt-roadmap',
    step: '03',
    label: '5-Phase NASM OPT™',
    shortLabel: '5-Phase OPT™',
    subtitle:
      'Explore how NASM OPT™ matches your personal goals and health history—from foundational joint stability & everyday strength (Phases 01–02) to optional athletic tracks.',
    whatItMeansForYou:
      'What this means for you: You only train in the phases that match your goals and health profile—never pushed into heavy max lifts or jump training that do not fit your plan.',
    telemetryBadge: 'GOAL-MATCHED NASM OPT™ · ZERO LOGIN',
    voiceCueKey: 'tempo_3_1_1_eccentric',
  },
  {
    id: 'express-travel',
    step: '04',
    label: 'Express & Travel Engine',
    shortLabel: 'Express & Travel',
    subtitle:
      'Toggle 20m Express Mode, adapt workouts across Home / Hotel / Bodyweight environments, and test 30-Second Camera Readiness warm-up injection.',
    whatItMeansForYou:
      'What this means for you: Adjusts every session to your time window, available equipment, and daily joint comfort—swapping movements anytime something feels stiff.',
    telemetryBadge: 'ADAPTIVE SESSION ENGINE · ZERO LOGIN',
    voiceCueKey: 'readiness_rep_1_3',
  },
]

interface EnvironmentExerciseItem {
  slot: string
  name: string
  imageUrl: string
  videoUrl: string
  cue: string
}

const ENVIRONMENT_PREVIEW_BLOCKS: Record<
  'home_gym' | 'hotel_travel' | 'bodyweight_only',
  {
    label: string
    equipmentNote: string
    primaryPair: string
    tempoAndCredit: string
    exercises: [EnvironmentExerciseItem, EnvironmentExerciseItem]
  }
> = {
  home_gym: {
    label: 'Home Dumbbells',
    equipmentNote: 'Adjustable or fixed dumbbells + flat floor space',
    primaryPair: 'A1. Heels-Elevated Goblet Squat × A2. Single-Leg Romanian Balance Reach',
    tempoAndCredit: '3-1-1 Lowering Tempo · Full Phase 02 Strength Endurance Credit',
    exercises: [
      {
        slot: 'A1 · Compound Prime',
        name: 'Goblet Squat',
        imageUrl: '/images/exercises/goblet-squat.jpg',
        videoUrl: '/videos/exercises/goblet-squat.mp4',
        cue: 'Elevate heels slightly, brace 360° core, and descend on a 3-second count.',
      },
      {
        slot: 'A2 · Unilateral Stability',
        name: 'Single Leg Balance Reach',
        imageUrl: '/images/exercises/single-leg-balance-reach-frontal-plane.jpg',
        videoUrl: '/videos/exercises/single-leg-balance-reach-frontal-plane.mp4',
        cue: 'Anchor tripod foot and stabilize hip alignment immediately after A1.',
      },
    ],
  },
  hotel_travel: {
    label: 'Hotel Travel',
    equipmentNote: 'Light hotel rack dumbbells (up to 35 lb) · Missing bench/barbell adapted',
    primaryPair: 'A1. Rear-Foot-Elevated Split Squat × A2. Kickstand DB Hip Hinge',
    tempoAndCredit: '3-1-1 Unilateral Load Match · Zero Lost Phase 02 Progression',
    exercises: [
      {
        slot: 'A1 · Unilateral Force Match',
        name: 'Bulgarian Split Squat',
        imageUrl: '/images/exercises/bulgarian-split-squat.jpg',
        videoUrl: '/videos/exercises/bulgarian-split-squat.mp4',
        cue: 'Doubles per-leg mechanical tension so light hotel dumbbells match full gym stimulus.',
      },
      {
        slot: 'A2 · Posterior Hinge Match',
        name: 'Dumbbell Romanian Deadlift',
        imageUrl: '/images/exercises/dumbbell-romanian-deadlift.jpg',
        videoUrl: '/videos/exercises/dumbbell-romanian-deadlift.mp4',
        cue: '3-second eccentric hip hinge keeping dumbbells tight along thighs.',
      },
    ],
  },
  bodyweight_only: {
    label: 'Bodyweight Only',
    equipmentNote: 'Zero equipment required · Hotel room floor & elevated foot support',
    primaryPair: 'A1. Bodyweight Rear-Foot-Elevated Split Squat × A2. Tempo Deficit Push-Up',
    tempoAndCredit: '4-2-1 Isometric Pause Tempo · Full Phase 02 Progression Retained',
    exercises: [
      {
        slot: 'A1 · Zero-Gear Lower Block',
        name: 'Bulgarian Split Squat',
        imageUrl: '/images/exercises/bulgarian-split-squat.jpg',
        videoUrl: '/videos/exercises/bulgarian-split-squat.mp4',
        cue: 'Elevate rear foot on bed or chair; 4s lowering + 2s bottom isometric hold.',
      },
      {
        slot: 'A2 · Zero-Gear Upper Block',
        name: 'Push Up',
        imageUrl: '/images/exercises/push-up.jpg',
        videoUrl: '/videos/exercises/push-up.mp4',
        cue: 'Rigid plank line from ear to ankle with 2-second bottom hover.',
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
  const [readinessPreset, setReadinessPreset] = useState<ReadinessPresetId>('tight_hips_ankles')
  const [sandboxDeskFlags, setSandboxDeskFlags] = useState<DeskErgonomicFlag[]>([
    'forward_head',
    'rounded_shoulders',
  ])
  const [liveReadinessOpen, setLiveReadinessOpen] = useState(false)
  const [customReadinessResult, setCustomReadinessResult] = useState<{
    readinessScore: number
    injectedDrills: InjectedReadinessDrill[]
  } | null>(null)
  const [activeExerciseModal, setActiveExerciseModal] = useState<ExerciseModalData | null>(null)

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const deskResetCardRef = useRef<HTMLDivElement | null>(null)

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
    if (index !== 3) {
      setLiveReadinessOpen(false)
    }
    const btn = tabRefs.current[index]
    if (btn) {
      if (focus) btn.focus()
      try {
        btn.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          container: 'nearest',
        } as ScrollIntoViewOptions)
      } catch {
        try {
          btn.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        } catch {
          // Ignore in non-DOM test environments
        }
      }
    }
  }

  const handleLaunchTargetedDeskReset = (flags: DeskErgonomicFlag[]) => {
    setSandboxDeskFlags(flags)
    selectTab(3, false)
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        try {
          deskResetCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        } catch {
          // Ignore in non-DOM test environments
        }
      }, 80)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = selectedIndex
    if (e.key === 'ArrowRight') {
      next = (selectedIndex + 1) % SNEAK_TABS.length
    } else if (e.key === 'ArrowLeft') {
      next = (selectedIndex - 1 + SNEAK_TABS.length) % SNEAK_TABS.length
    } else if (e.key === 'Home') {
      next = 0
    } else if (e.key === 'End') {
      next = SNEAK_TABS.length - 1
    } else {
      return
    }
    e.preventDefault()
    selectTab(next, true)
  }

  const activeTab = SNEAK_TABS[selectedIndex]
  const activeEnvKey: 'home_gym' | 'hotel_travel' | 'bodyweight_only' =
    sandboxEnv === 'hotel_travel'
      ? 'hotel_travel'
      : sandboxEnv === 'bodyweight_only'
        ? 'bodyweight_only'
        : 'home_gym'
  const envSpec = ENVIRONMENT_PREVIEW_BLOCKS[activeEnvKey]

  return (
    <section
      id="sneak-peek"
      aria-labelledby={`${baseId}-heading`}
      className="relative mx-auto my-14 max-w-5xl scroll-mt-24 text-zinc-100"
    >
      {/* Ambient Radial Stage Spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '88%',
          maxWidth: 880,
          height: 340,
          background:
            'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.09) 0%, rgba(245, 158, 11, 0.06) 45%, transparent 70%)',
          filter: 'blur(48px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 mb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]"
          />
          Interactive Sandbox · Try Inside Your Browser
        </span>
        <h2
          id={`${baseId}-heading`}
          style={{ textWrap: 'balance' }}
          className="mt-3.5 mb-2 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          Test-Drive the Forge Athletic Ecosystem Right Now
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-300">
          Try the live tools below with zero login required—every diagnostic and NASM OPT™ workout
          adapts directly to your goals, joint comfort, and health profile rather than a
          one-size-fits-all routine.
        </p>
      </div>

      {/* Single-Row Accessible 4-Tab Bar (Horizontal scroll on narrow mobile, 4-col grid on sm+) */}
      <div
        role="tablist"
        aria-label="Interactive Forge Athletic product previews"
        data-hydrated={hydrated ? 'true' : undefined}
        onKeyDown={handleKeyDown}
        className="relative z-10 mb-5 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0"
        style={{ scrollSnapType: 'inline proximity' }}
      >
        {SNEAK_TABS.map((tab, index) => {
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
              style={{ scrollSnapAlign: 'start' }}
              className="forge-sneak-tab forge-sneak-tab-pill forge-tactile-press relative flex flex-none items-center justify-center gap-2 rounded-xl px-3.5 py-3 text-xs font-bold tracking-wide sm:flex-initial focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
                  selected
                    ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : 'border border-transparent bg-white/[0.05] text-zinc-400'
                }`}
              >
                {tab.step}
              </span>
              {index === 0 ? <Layers size={15} strokeWidth={1.75} className="shrink-0" aria-hidden="true" /> : null}
              {index === 1 ? <Monitor size={15} strokeWidth={1.75} className="shrink-0" aria-hidden="true" /> : null}
              {index === 2 ? <Route size={15} strokeWidth={1.75} className="shrink-0" aria-hidden="true" /> : null}
              {index === 3 ? <Clock size={15} strokeWidth={1.75} className="shrink-0" aria-hidden="true" /> : null}
              <span className="hidden lg:inline">{tab.label}</span>
              <span className="lg:hidden">{tab.shortLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Machined Anodized Obsidian & Brushed Steel Bezel */}
      <div
        className="relative z-10 rounded-2xl border border-white/[0.08] bg-[#111318] p-4 sm:p-6"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 32px 84px rgba(0, 0, 0, 0.78)',
        }}
      >
        {/* Top Hardware Sensor Pill */}
        <div className="mb-3 flex justify-center" aria-hidden="true">
          <div className="flex h-5 w-28 items-center justify-end rounded-full border border-white/10 bg-[#090A0D] pr-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, #34D399 0%, #090A0D 80%)',
              }}
            />
          </div>
        </div>

        {/* Bezel Telemetry Status Bar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]"
            />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-200">
              FORGE LAB // {activeTab.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                playCoachStaticCue(activeTab.voiceCueKey, { forceUnlockVoiceOnTap: true })
              }
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 bg-[#181B22] px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-200 transition-colors hover:border-emerald-400/45 hover:text-emerald-200"
            >
              <Volume2 size={12} className="text-emerald-400" aria-hidden="true" />
              <span>Voice Sample</span>
            </button>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
              {activeTab.telemetryBadge}
            </span>
          </div>
        </div>

        <p className="mb-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">{activeTab.subtitle}</p>
        <div className="mb-4 rounded-xl border border-white/[0.07] bg-[#181B22]/85 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-200/95">
          {activeTab.whatItMeansForYou}
        </div>

        {/* Tab Panels (Styles applied to inner child wrapper per WCAG / hidden-panel layout rules) */}
        {SNEAK_TABS.map(tab => {
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

                  {tab.id === 'desk-ergonomics' ? (
                    <DeskErgonomicsAudit
                      sandboxMode
                      onLaunchDeskReset={handleLaunchTargetedDeskReset}
                    />
                  ) : null}

                  {tab.id === 'opt-roadmap' ? (
                    <OptPhaseRoadmap sandboxMode activePhaseNumber={2} unlockedThroughPhase={5} />
                  ) : null}

                  {tab.id === 'express-travel' ? (
                    <div className="space-y-4">
                      {/* Express Mode + Environment Switcher + 30s Camera Readiness Preview */}
                      <div className="rounded-2xl border border-white/[0.08] bg-[#111318] p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.07] pb-3">
                          <div>
                            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                              Adaptive Session Rebuilder
                            </div>
                            <div className="mt-0.5 text-sm font-bold text-white">
                              20m Express Mode, Environment Switcher &amp; 30s Readiness Injection
                            </div>
                          </div>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-emerald-300">
                            Forge Readiness Index: {displayedReadinessScore}/100
                          </span>
                        </div>

                        {/* Interactive Toggles Row */}
                        <div className="mt-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                          {/* 20m Express Toggle */}
                          <div className="rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                                Session Duration Cap
                              </span>
                              <span className="font-mono text-[11px] font-bold tabular-nums text-amber-300">
                                {sandboxExpress ? '20m Express Active' : '45m Standard'}
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
                                20m Express Mode
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
                                45m Full Block
                              </button>
                            </div>
                          </div>

                          {/* Environment Switcher */}
                          <div className="rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                                Environment Switcher
                              </span>
                              <span className="font-mono text-[11px] font-bold text-emerald-300">
                                {envSpec.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <button
                                type="button"
                                aria-pressed={activeEnvKey === 'home_gym'}
                                onClick={() => setSandboxEnv('home_gym')}
                                className={`forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                  activeEnvKey === 'home_gym'
                                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                    : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20'
                                }`}
                              >
                                <Dumbbell size={13} aria-hidden="true" />
                                Home Dumbbells
                              </button>
                              <button
                                type="button"
                                aria-pressed={activeEnvKey === 'hotel_travel'}
                                onClick={() => setSandboxEnv('hotel_travel')}
                                className={`forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                  activeEnvKey === 'hotel_travel'
                                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                    : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20'
                                }`}
                              >
                                <Plane size={13} aria-hidden="true" />
                                Hotel Travel
                              </button>
                              <button
                                type="button"
                                aria-pressed={activeEnvKey === 'bodyweight_only'}
                                onClick={() => setSandboxEnv('bodyweight_only')}
                                className={`forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                  activeEnvKey === 'bodyweight_only'
                                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                    : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/20'
                                }`}
                              >
                                <User size={13} aria-hidden="true" />
                                Bodyweight
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Adapted Compound Superset Readout + Clickable Studio Demos */}
                        <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                            <span>{envSpec.equipmentNote}</span>
                            <span className="font-mono font-semibold text-emerald-300">
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
                            {envSpec.exercises.map(ex => (
                              <button
                                key={`${activeEnvKey}-${ex.slot}`}
                                type="button"
                                onClick={() =>
                                  setActiveExerciseModal({
                                    name: ex.name,
                                    imageUrl: ex.imageUrl,
                                    videoUrl: ex.videoUrl,
                                    protocol: sandboxExpress
                                      ? '2 × 10–12 · 45s Density Rest'
                                      : '4 × 8–10 · 90s Standard Rest',
                                    phaseLabel: `PHASE 02 · ${envSpec.label}`,
                                    coachingCues: [ex.cue],
                                  })
                                }
                                className="forge-tactile-press group flex min-h-[68px] flex-col gap-2 rounded-xl border border-white/[0.07] bg-[#181B22] p-2.5 text-left transition-colors hover:border-emerald-400/45 hover:bg-[#1D212A] sm:flex-row sm:items-center sm:gap-2.5 sm:p-2"
                              >
                                <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#090A0D] sm:aspect-auto sm:h-12 sm:w-20">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={ex.imageUrl}
                                    alt={ex.name}
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
                                  <div className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-emerald-300">
                                    {ex.slot} · Watch Demo
                                  </div>
                                  <div className="truncate text-xs font-bold text-white">{ex.name}</div>
                                  <div className="truncate text-[11px] text-zinc-400">{ex.cue}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 30-Second Camera Readiness Warm-Up Injection */}
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
                                  : `${displayedInjectedDrills.length} drills · ${displayedTotalDurationSec}s total${
                                      sandboxExpress ? ' (90s Express cap)' : ''
                                    }`}
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

                          {displayedInjectedDrills.length > 0 ? (
                            <ul className="m-0 mt-2.5 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                              {displayedInjectedDrills.map(drill => (
                                <li key={drill.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveExerciseModal({
                                        name: drill.name,
                                        imageUrl: drill.imageUrl,
                                        videoUrl: drill.videoUrl,
                                        protocol: `${drill.durationSec}s Pre-Session Warm-Up`,
                                        target: drill.targetArea,
                                        phaseLabel: '30-Second Camera Readiness Prep',
                                        coachingCues: [drill.cue],
                                      })
                                    }
                                    className="forge-tactile-press group flex min-h-[56px] w-full items-center justify-between gap-2.5 rounded-lg border border-white/[0.07] bg-[#181B22] px-3 py-2 text-left text-xs transition-colors hover:border-emerald-400/45 hover:bg-[#1D212A]"
                                  >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                      {drill.imageUrl ? (
                                        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded border border-white/10 bg-[#090A0D]">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={drill.imageUrl}
                                            alt={drill.name}
                                            width={64}
                                            height={40}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                          />
                                          <span
                                            aria-hidden="true"
                                            className="absolute inset-0 flex items-center justify-center bg-black/35 text-emerald-300"
                                          >
                                            <Play size={10} fill="currentColor" />
                                          </span>
                                        </div>
                                      ) : null}
                                      <div className="min-w-0">
                                        <div className="truncate font-semibold text-white">
                                          {drill.name}
                                        </div>
                                        <div className="truncate text-[11px] text-zinc-400">
                                          {drill.targetArea} · Tap for video
                                        </div>
                                      </div>
                                    </div>
                                    <span className="shrink-0 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-emerald-300">
                                      {drill.durationSec}s
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs text-emerald-300">
                              Symmetrical squat depth and overhead reach verified—Coach Gordon’s voice proceeds straight to Set 1.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Guided 5-Min Mobility Reset Player (Synced with Tab 02 Desk Audit Flags) */}
                      <div
                        ref={deskResetCardRef}
                        className="rounded-2xl border border-white/[0.08] bg-[#111318] p-3.5 sm:p-4"
                      >
                        <DeskResetGuidedPlayer
                          sandboxMode
                          activeFlags={sandboxDeskFlags}
                          expressMode={sandboxExpress}
                          environmentProfile={sandboxEnv}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
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
