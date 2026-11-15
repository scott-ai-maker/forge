'use client'

import React, { useId, useMemo, useRef, useState } from 'react'
import { Activity, Clock, Dumbbell, Layers, Monitor, Plane, Route } from 'lucide-react'
import PostureComparisonCard from '@/components/fitness/PostureComparisonCard'
import DeskErgonomicsAudit from '@/components/fitness/DeskErgonomicsAudit'
import OptPhaseRoadmap from '@/components/fitness/OptPhaseRoadmap'
import { DeskResetGuidedPlayer } from '@/components/fitness/DeskResetModal'
import {
  evaluateCameraReadiness,
  READINESS_PRESET_LABELS,
  type ReadinessPresetId,
} from '@/lib/camera-readiness-engine'
import type { EnvironmentProfileId } from '@/lib/posture-profile-state'

interface SneakPeekTabSpec {
  id: 'posture-mesh' | 'desk-ergonomics' | 'opt-roadmap' | 'express-travel'
  step: string
  label: string
  shortLabel: string
  subtitle: string
}

const SNEAK_TABS: ReadonlyArray<SneakPeekTabSpec> = [
  {
    id: 'posture-mesh',
    step: '01',
    label: '33-Point Posture Mesh',
    shortLabel: 'Posture Mesh',
    subtitle:
      'Interactive Before/After comparison slider (-4.2° Forward Head Tilt) showing measurable alignment progress using only a phone camera.',
  },
  {
    id: 'desk-ergonomics',
    step: '02',
    label: 'Desk Ergonomics Audit',
    shortLabel: 'Desk Audit',
    subtitle:
      '5-second seated side-profile angle scan (0–100 Workstation Score) with 3 instant desk adjustments and 1-tap 5-Min Desk Reset launch.',
  },
  {
    id: 'opt-roadmap',
    step: '03',
    label: '5-Phase NASM OPT™',
    shortLabel: '5-Phase OPT™',
    subtitle:
      'Interactive phase progression track (01 Stabilization → 05 Power) with live workout unlock progress.',
  },
  {
    id: 'express-travel',
    step: '04',
    label: 'Express & Travel Engine',
    shortLabel: 'Express & Travel',
    subtitle:
      'Live toggle preview of 20m Express Mode, Environment Switcher (Home Dumbbells / Hotel Travel), and 30-Second Camera Readiness warm-up injection.',
  },
]

const ENVIRONMENT_PREVIEW_BLOCKS: Record<
  'home_gym' | 'hotel_travel',
  {
    label: string
    equipmentNote: string
    primaryPair: string
    tempoAndCredit: string
  }
> = {
  home_gym: {
    label: 'Home Dumbbells',
    equipmentNote: 'Adjustable or fixed dumbbells + flat floor space',
    primaryPair: 'A1. Heels-Elevated Goblet Squat × A2. Single-Leg Romanian Balance Reach',
    tempoAndCredit: '3-1-1 Lowering Tempo · Full Phase 02 Strength Endurance Credit',
  },
  hotel_travel: {
    label: 'Hotel Travel',
    equipmentNote: 'Light hotel rack dumbbells (up to 35 lb) · Missing bench/barbell adapted',
    primaryPair: 'A1. Rear-Foot-Elevated Split Squat × A2. Kickstand DB Hip Hinge',
    tempoAndCredit: '3-1-1 Unilateral Load Match · Zero Lost Phase 02 Progression',
  },
}

export default function AppSneakPeekShowcase() {
  const baseId = useId()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sandboxExpress, setSandboxExpress] = useState(true)
  const [sandboxEnv, setSandboxEnv] = useState<EnvironmentProfileId>('hotel_travel')
  const [readinessPreset, setReadinessPreset] = useState<ReadinessPresetId>('tight_hips_ankles')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const readinessPreview = useMemo(
    () =>
      evaluateCameraReadiness({
        screenMode: 'overhead_squat',
        preset: readinessPreset,
        expressModeActive: sandboxExpress,
      }),
    [readinessPreset, sandboxExpress]
  )

  const selectTab = (index: number, focus = false) => {
    setSelectedIndex(index)
    const btn = tabRefs.current[index]
    if (btn) {
      if (focus) btn.focus()
      try {
        btn.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      } catch {
        // Ignore in non-DOM test environments
      }
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
  const activeEnvKey: 'home_gym' | 'hotel_travel' =
    sandboxEnv === 'hotel_travel' ? 'hotel_travel' : 'home_gym'
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
          Explore live, launch-ready modules—from 33-point phone camera posture deltas and seated
          desk audits to 5-Phase NASM OPT™ progression and 20-minute travel adaptation—with zero
          login required.
        </p>
      </div>

      {/* Single-Row Accessible 4-Tab Bar (Horizontal scroll on narrow mobile, 4-col grid on sm+) */}
      <div
        role="tablist"
        aria-label="Interactive Forge Athletic product previews"
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
              className={`forge-sneak-tab forge-tactile-press relative flex min-h-[46px] flex-none items-center justify-center gap-2 rounded-xl border px-3.5 py-3 text-xs font-bold tracking-wide sm:flex-initial focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                selected
                  ? 'border-emerald-500/35 bg-[#181B22] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_26px_rgba(0,0,0,0.45)]'
                  : 'border-white/[0.07] bg-[#111318] text-zinc-400 hover:border-white/15 hover:bg-[#181B22] hover:text-zinc-200'
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
                  selected
                    ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : 'bg-white/[0.05] text-zinc-400'
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
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            LOCAL CAMERA SANDBOX · ZERO CLOUD UPLOAD
          </span>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-zinc-300 sm:text-sm">{activeTab.subtitle}</p>

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
                      onLaunchDeskReset={() => selectTab(3, false)}
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
                            Forge Readiness Index: {readinessPreview.readinessScore}/100
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
                                onClick={() => setSandboxExpress(true)}
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
                                onClick={() => setSandboxExpress(false)}
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
                            <div className="grid grid-cols-2 gap-2">
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
                            </div>
                          </div>
                        </div>

                        {/* Adapted Compound Superset Readout */}
                        <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#090A0D] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                            <span>{envSpec.equipmentNote}</span>
                            <span className="font-mono font-semibold text-emerald-300">
                              {envSpec.tempoAndCredit}
                            </span>
                          </div>
                          <div className="mt-1.5 text-xs font-semibold text-white sm:text-sm">
                            {envSpec.primaryPair}
                          </div>
                        </div>

                        {/* 30-Second Camera Readiness Warm-Up Injection */}
                        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-[#090A0D] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                              <Activity size={14} className="text-emerald-400" aria-hidden="true" />
                              <span>30-Second Camera Readiness · Auto Warm-Up Injection</span>
                            </div>
                            <span className="font-mono text-[11px] tabular-nums text-zinc-400">
                              {readinessPreview.injectedDrills.length === 0
                                ? '0s added · Cleared for Set 1'
                                : `${readinessPreview.injectedDrills.length} drills · ${readinessPreview.totalInjectedDurationSec}s total${
                                    sandboxExpress ? ' (90s Express cap)' : ''
                                  }`}
                            </span>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {(Object.keys(READINESS_PRESET_LABELS) as ReadinessPresetId[]).map(
                              presetKey => {
                                const active = readinessPreset === presetKey
                                return (
                                  <button
                                    key={presetKey}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setReadinessPreset(presetKey)}
                                    className={`forge-tactile-press min-h-[38px] rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
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

                          {readinessPreview.injectedDrills.length > 0 ? (
                            <ul className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {readinessPreview.injectedDrills.map(drill => (
                                <li
                                  key={drill.id}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#181B22] px-3 py-2 text-xs"
                                >
                                  <div>
                                    <div className="font-semibold text-white">{drill.name}</div>
                                    <div className="text-[11px] text-zinc-400">{drill.targetArea}</div>
                                  </div>
                                  <span className="shrink-0 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-emerald-300">
                                    {drill.durationSec}s
                                  </span>
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

                      {/* Guided 5-Min Mobility Reset Player */}
                      <DeskResetGuidedPlayer
                        sandboxMode
                        activeFlags={['forward_head', 'rounded_shoulders']}
                        expressMode={sandboxExpress}
                        onToggleExpress={setSandboxExpress}
                        environmentProfile={sandboxEnv}
                        onChangeEnvironment={setSandboxEnv}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
