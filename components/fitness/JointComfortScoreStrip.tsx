'use client'

import React, { useEffect, useState } from 'react'
import { Activity, Check, ChevronDown, ChevronUp } from 'lucide-react'
import {
  getTodayIsoDate,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  recordDailyReadinessAndComfort,
} from '@/lib/posture-profile-state'
import { playForgeTactileTone } from '@/lib/sfx-audio'
import { trackEvent } from '@/src/lib/telemetry/telemetryClient'

const RATING_STEPS = [
  { rating: 1, points: 2, label: 'Stiff' },
  { rating: 2, points: 4, label: 'Tight' },
  { rating: 3, points: 6, label: 'Moderate' },
  { rating: 4, points: 8, label: 'Good' },
  { rating: 5, points: 10, label: 'Fluid' },
] as const

export default function JointComfortScoreStrip() {
  const [expanded, setExpanded] = useState(false)
  const [neckShoulders, setNeckShoulders] = useState(8)
  const [lowerBack, setLowerBack] = useState(8)
  const [hipsKnees, setHipsKnees] = useState(10)
  const [savedScore, setSavedScore] = useState<number | null>(null)
  const [todayReadiness, setTodayReadiness] = useState<number | null>(null)
  const [justLogged, setJustLogged] = useState(false)

  useEffect(() => {
    const sync = () => {
      const state = loadPostureProfileState()
      const today = getTodayIsoDate()
      const entry = state.dailyLogs[today]
      if (entry) {
        if (typeof entry.jointComfortScore === 'number') setSavedScore(entry.jointComfortScore)
        if (typeof entry.readinessScore === 'number') setTodayReadiness(entry.readinessScore)
      }
    }
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [])

  const computedScore = Math.round(((neckShoulders + lowerBack + hipsKnees) / 30) * 100)
  const displayScore = savedScore ?? computedScore

  const handleSave = () => {
    const comfortLabel =
      computedScore >= 80 ? 'Fluid' : computedScore >= 60 ? 'Moderate' : 'Tight / Stiff'
    recordDailyReadinessAndComfort({
      jointComfortScore: computedScore,
      comfortLabel,
    })
    void trackEvent('joint_comfort_logged', {
      comfort_score: computedScore,
      comfort_label: comfortLabel,
      joint_region: `neck:${neckShoulders},lumbar:${lowerBack},hips_knees:${hipsKnees}`,
    })
    setSavedScore(computedScore)
    setJustLogged(true)
    playForgeTactileTone('success')
    window.setTimeout(() => {
      setJustLogged(false)
      setExpanded(false)
    }, 900)
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#111318] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      {/* 1-Row Collapsible Summary Strip */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        className="flex min-h-[50px] w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.02]"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Activity size={16} strokeWidth={1.75} className="shrink-0 text-emerald-400" aria-hidden="true" />
          <span className="truncate text-xs font-bold text-white">Joint Comfort Score</span>
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
              displayScore >= 80
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                : displayScore >= 60
                  ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-300'
            }`}
          >
            {displayScore}/100
          </span>
          {todayReadiness !== null ? (
            <span className="hidden rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-sky-300 sm:inline">
              Readiness {todayReadiness}/100
            </span>
          ) : null}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-zinc-400">
          {savedScore !== null ? 'Logged' : 'Log 10s'}
          {expanded ? (
            <ChevronUp size={15} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
          )}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-white/[0.07] px-4 pb-4 pt-3">
          {[
            { label: 'Neck & Shoulders', value: neckShoulders, onChange: setNeckShoulders },
            { label: 'Lower Back', value: lowerBack, onChange: setLowerBack },
            { label: 'Hips & Knees', value: hipsKnees, onChange: setHipsKnees },
          ].map(item => {
            const activeFiveStep = Math.max(1, Math.min(5, Math.round(item.value / 2)))
            return (
              <div key={item.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between sm:w-40 sm:shrink-0">
                  <span className="text-xs font-medium text-zinc-300">{item.label}</span>
                  <span className="font-mono text-xs font-bold tabular-nums text-zinc-200 sm:hidden">
                    {activeFiveStep}/5
                  </span>
                </div>

                {/* Tactile 1–5 Tap Rating Pills (44px touch targets) */}
                <div
                  role="group"
                  aria-label={`${item.label} comfort rating 1 to 5`}
                  className="grid flex-1 grid-cols-5 gap-1.5"
                >
                  {RATING_STEPS.map(step => {
                    const selected = activeFiveStep === step.rating
                    return (
                      <button
                        key={step.rating}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          item.onChange(step.points)
                          playForgeTactileTone('tick')
                        }}
                        className={`forge-tactile-press flex min-h-[44px] flex-col items-center justify-center rounded-xl border text-center transition-colors duration-150 ${
                          selected
                            ? step.rating >= 4
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                              : step.rating === 3
                                ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                                : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                            : 'border-white/[0.08] bg-[#181B22] text-zinc-400 hover:border-white/15 hover:bg-[#1D212A] hover:text-zinc-200'
                        }`}
                      >
                        <span className="font-mono text-xs font-bold tabular-nums">{step.rating}</span>
                        <span className="text-[9px] font-medium tracking-wide opacity-80">{step.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-zinc-400">
              5 = Pain-free &amp; fluid · Auto-adjusts warm-up intensity
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#090A0D] transition-colors duration-150 hover:bg-emerald-300"
            >
              {justLogged ? (
                <>
                  <Check size={14} strokeWidth={1.75} aria-hidden="true" /> Saved
                </>
              ) : (
                <span className="tabular-nums">Save Score ({computedScore}/100)</span>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
