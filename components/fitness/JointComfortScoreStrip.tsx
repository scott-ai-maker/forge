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

export default function JointComfortScoreStrip() {
  const [expanded, setExpanded] = useState(false)
  const [neckShoulders, setNeckShoulders] = useState(8)
  const [lowerBack, setLowerBack] = useState(8)
  const [hipsKnees, setHipsKnees] = useState(9)
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
    recordDailyReadinessAndComfort({ jointComfortScore: computedScore })
    setSavedScore(computedScore)
    setJustLogged(true)
    playForgeTactileTone('success')
    window.setTimeout(() => {
      setJustLogged(false)
      setExpanded(false)
    }, 900)
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0B1320] text-slate-100">
      {/* 1-Row Collapsible Summary Strip */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Activity size={15} className="shrink-0 text-emerald-400" />
          <span className="truncate text-xs font-bold text-white">Joint Comfort Score</span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-extrabold ${
              displayScore >= 80
                ? 'bg-emerald-500/15 text-emerald-300'
                : displayScore >= 60
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-rose-500/15 text-rose-300'
            }`}
          >
            {displayScore}/100
          </span>
          {todayReadiness !== null ? (
            <span className="hidden rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 sm:inline">
              Readiness {todayReadiness}/100
            </span>
          ) : null}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-400">
          {savedScore !== null ? 'Logged' : 'Log 10s'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-2.5 border-t border-white/10 px-3 pb-3 pt-2.5">
          {[
            { label: 'Neck & Shoulders', value: neckShoulders, onChange: setNeckShoulders },
            { label: 'Lower Back', value: lowerBack, onChange: setLowerBack },
            { label: 'Hips & Knees', value: hipsKnees, onChange: setHipsKnees },
          ].map(item => (
            <label key={item.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="w-32 shrink-0 text-slate-300">{item.label}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={item.value}
                onChange={e => item.onChange(Number(e.target.value))}
                className="h-1.5 flex-1 accent-emerald-400"
              />
              <span className="w-8 text-right font-mono font-bold text-white">{item.value}/10</span>
            </label>
          ))}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              10 = Pain-free &amp; fluid · Auto-adjusts warm-up intensity
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-300"
            >
              {justLogged ? (
                <>
                  <Check size={13} /> Saved
                </>
              ) : (
                'Save Score'
              )}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
