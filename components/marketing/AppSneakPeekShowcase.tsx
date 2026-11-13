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
      className="relative mx-auto my-14 max-w-5xl scroll-mt-24 text-slate-100"
    >
      {/* Ambient Radial Stage Spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '88%',
          maxWidth: 880,
          height: 360,
          background:
            'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.14) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 72%)',
          filter: 'blur(48px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 mb-6 text-center">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 9999,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FDE68A',
            fontFamily: 'var(--font-telemetry)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#34D399',
              boxShadow: '0 0 8px #34D399',
            }}
          />
          Interactive Sandbox · Try Inside Your Browser
        </span>
        <h2
          id={`${baseId}-heading`}
          style={{
            margin: '0.85rem 0 0.5rem',
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.85rem, 3.6vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: '#FFFFFF',
          }}
        >
          Test-Drive the Forge Lab Before Launch Day
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300">
          Explore real interactive modules—from 33-point posture deltas and seated desk audits to
          20-minute express workouts—with zero login required.
        </p>
      </div>

      {/* Accessible 4-Tab Bar (Underline Border Indicator for WCAG 1.4.1 & Forced-Colors) */}
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
              className="forge-sneak-tab relative flex items-center justify-center gap-2 rounded-xl px-3 py-3.5 text-xs font-extrabold tracking-wide transition"
              style={{
                background: selected
                  ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  : 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(8, 14, 20, 0.95) 100%)',
                border: selected
                  ? '1px solid rgba(251, 191, 36, 0.65)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                color: selected ? '#FEF3C7' : '#CBD5E1',
                boxShadow: selected
                  ? '0 10px 26px rgba(245, 158, 11, 0.16), inset 0 1px 0 rgba(251, 191, 36, 0.28)'
                  : '0 6px 16px rgba(0, 0, 0, 0.35)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 10,
                  padding: '2px 5px',
                  borderRadius: 4,
                  background: selected ? 'rgba(245, 158, 11, 0.28)' : 'rgba(255, 255, 255, 0.06)',
                  color: selected ? '#FBBF24' : '#94A3B8',
                }}
              >
                {tab.step}
              </span>
              {index === 0 ? <Layers size={14} className="shrink-0" /> : null}
              {index === 1 ? <Monitor size={14} className="shrink-0" /> : null}
              {index === 2 ? <Route size={14} className="shrink-0" /> : null}
              {index === 3 ? <Clock size={14} className="shrink-0" /> : null}
              <span className="hidden lg:inline">{tab.label}</span>
              <span className="lg:hidden">{tab.shortLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Machined Anodized Carbon Hardware Bezel */}
      <div
        className="relative z-10 p-3 sm:p-6"
        style={{
          borderRadius: 28,
          background: 'linear-gradient(180deg, #0D1524 0%, #050911 100%)',
          border: '1px solid rgba(245, 158, 11, 0.34)',
          boxShadow:
            '0 32px 84px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
        }}
      >
        {/* Top Hardware Sensor Pill */}
        <div className="mb-3 flex justify-center" aria-hidden="true">
          <div
            style={{
              width: 108,
              height: 20,
              borderRadius: 9999,
              background: '#020409',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #38BDF8 0%, #0F172A 75%)',
              }}
            />
          </div>
        </div>

        {/* Bezel Telemetry Status Bar */}
        <div
          className="mb-3 flex flex-wrap items-center justify-between gap-2 pb-3 text-[11px]"
          style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.16)' }}
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#34D399',
                boxShadow: '0 0 8px #34D399',
              }}
            />
            <span className="font-mono font-bold uppercase tracking-wider text-amber-300">
              FORGE LAB // {activeTab.label}
            </span>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-400">
            SANDBOX ACTIVE · ZERO CLOUD UPLOAD
          </span>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-slate-300">{activeTab.subtitle}</p>

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
              className="rounded-2xl p-2.5 sm:p-4"
              style={{
                background: 'linear-gradient(180deg, rgba(8, 13, 22, 0.95) 0%, rgba(5, 8, 15, 0.98) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.14)',
              }}
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
