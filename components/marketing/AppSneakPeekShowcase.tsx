'use client'

import React, { useId, useRef, useState } from 'react'
import { Clock, Layers, Monitor, Route } from 'lucide-react'
import PostureComparisonCard from '@/components/fitness/PostureComparisonCard'
import DeskErgonomicsAudit from '@/components/fitness/DeskErgonomicsAudit'
import OptPhaseRoadmap from '@/components/fitness/OptPhaseRoadmap'
import { DeskResetGuidedPlayer } from '@/components/fitness/DeskResetModal'
import type { EnvironmentProfileId } from '@/lib/posture-profile-state'

interface SneakPeekTabSpec {
  id: 'posture-mesh' | 'desk-ergonomics' | 'opt-roadmap' | 'desk-reset-express'
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
    subtitle: 'Scrub the live overlay slider to compare baseline forward-head posture against current alignment.',
  },
  {
    id: 'desk-ergonomics',
    step: '02',
    label: 'Desk Ergonomics Audit',
    shortLabel: 'Desk Audit',
    subtitle: 'Inspect seated craniovertebral, shoulder, elbow, and hip angles plus 3 instant workstation adjustments.',
  },
  {
    id: 'opt-roadmap',
    step: '03',
    label: '5-Phase OPT™ Roadmap',
    shortLabel: '5-Phase OPT™',
    subtitle: 'Tap through Phases 01–05 to see how joint stabilization progresses safely into strength and power.',
  },
  {
    id: 'desk-reset-express',
    step: '04',
    label: '5-Min Desk Reset & Express Mode',
    shortLabel: '5m Reset & Express',
    subtitle: 'Test the guided 5-minute mobility player and toggle 20m Express or Hotel Travel workout modes.',
  },
]

export default function AppSneakPeekShowcase() {
  const baseId = useId()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sandboxExpress, setSandboxExpress] = useState(true)
  const [sandboxEnv, setSandboxEnv] = useState<EnvironmentProfileId>('hotel_travel')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

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
    setSelectedIndex(next)
    tabRefs.current[next]?.focus()
  }

  const activeTab = SNEAK_TABS[selectedIndex]

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
          className="mt-3.5 mb-2 font-serif text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          Test-Drive the Forge Lab Before Launch Day
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-300">
          Explore real interactive modules—from 33-point posture deltas and seated desk audits to
          20-minute express workouts—with zero login required.
        </p>
      </div>

      {/* Accessible 4-Tab Bar (Spring Underline Indicator for WCAG 1.4.1 & Forced-Colors) */}
      <div
        role="tablist"
        aria-label="Interactive Forge Athletic product previews"
        onKeyDown={handleKeyDown}
        className="relative z-10 mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
      >
        {SNEAK_TABS.map((tab, index) => {
          const selected = index === selectedIndex
          const tabId = `${baseId}-tab-${tab.id}`
          const panelId = `${baseId}-panel-${tab.id}`
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
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setSelectedIndex(index)}
              className={`forge-sneak-tab forge-tactile-press relative flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold tracking-wide focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
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
            SANDBOX ACTIVE · ZERO CLOUD UPLOAD
          </span>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-zinc-300">{activeTab.subtitle}</p>

        {/* Tab Panels */}
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
              className="rounded-xl border border-white/[0.06] bg-[#090A0D] p-3 sm:p-4"
            >
              {selected && tab.id === 'posture-mesh' ? (
                <PostureComparisonCard sandboxMode />
              ) : null}

              {selected && tab.id === 'desk-ergonomics' ? (
                <DeskErgonomicsAudit sandboxMode />
              ) : null}

              {selected && tab.id === 'opt-roadmap' ? (
                <OptPhaseRoadmap sandboxMode activePhaseNumber={2} unlockedThroughPhase={5} />
              ) : null}

              {selected && tab.id === 'desk-reset-express' ? (
                <DeskResetGuidedPlayer
                  sandboxMode
                  activeFlags={['forward_head', 'rounded_shoulders']}
                  expressMode={sandboxExpress}
                  onToggleExpress={setSandboxExpress}
                  environmentProfile={sandboxEnv}
                  onChangeEnvironment={setSandboxEnv}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
