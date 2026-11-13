'use client'

import React, { useState } from 'react'
import { ArrowUpRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import { FORGE_TIER_ENTITLEMENTS, useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'

export interface OptPhaseSpec {
  phase: 1 | 2 | 3 | 4 | 5
  code: string
  shortTitle: string
  outcomeHeadline: string
  tempo: string
  repsAndSets: string
  restInterval: string
  plainEnglishSummary: string
}

export const OPT_PHASES: OptPhaseSpec[] = [
  {
    phase: 1,
    code: 'PHASE 01',
    shortTitle: 'Stabilization',
    outcomeHeadline: 'Bulletproof Joints, Core Bracing & Alignment',
    tempo: '4-2-1 Controlled Tempo',
    repsAndSets: '1–3 Sets · 12–20 Reps',
    restInterval: '0–90s Rest',
    plainEnglishSummary:
      'Corrects desk stiffness and prepares tendons, rotator cuffs, and deep core stabilizers before heavy loading.',
  },
  {
    phase: 2,
    code: 'PHASE 02',
    shortTitle: 'Strength Endurance',
    outcomeHeadline: 'Lean Muscle Work Capacity & Superset Stamina',
    tempo: '2-0-2 / 4-2-1 Superset',
    repsAndSets: '2–4 Sets · 8–12 Reps',
    restInterval: '60s Rest',
    plainEnglishSummary:
      'Pairs a primary compound strength lift immediately with a joint-stabilizing exercise to build durable lean muscle.',
  },
  {
    phase: 3,
    code: 'PHASE 03',
    shortTitle: 'Muscular Dev',
    outcomeHeadline: 'Targeted Hypertrophy & Balanced Physique',
    tempo: '2-0-2 Controlled Hypertrophy',
    repsAndSets: '3–5 Sets · 6–12 Reps',
    restInterval: '60–90s Rest',
    plainEnglishSummary:
      'Progressive volume blocks engineered to add functional lean mass without lower-back or shoulder wear.',
  },
  {
    phase: 4,
    code: 'PHASE 04',
    shortTitle: 'Max Strength',
    outcomeHeadline: 'Peak Force Output & Dense Neural Strength',
    tempo: 'Explosive Concentric (X-0-X)',
    repsAndSets: '4–6 Sets · 1–5 Reps',
    restInterval: '3–5m Rest',
    plainEnglishSummary:
      'High-recruitment compound strength cycles calibrated safely from your recorded rep-velocity and joint comfort.',
  },
  {
    phase: 5,
    code: 'PHASE 05',
    shortTitle: 'Power',
    outcomeHeadline: 'Athletic Speed, Elasticity & Force-Velocity',
    tempo: 'Superset Heavy + Explosive',
    repsAndSets: '3–5 Sets · 1–5 + 8–10 Reps',
    restInterval: '1–2m / 3–5m Rest',
    plainEnglishSummary:
      'Combines strength lifts with crisp, low-impact explosive movements so you move fast and pain-free at any age.',
  },
]

export interface OptPhaseRoadmapProps {
  activePhaseNumber?: number
  unlockedThroughPhase?: number
  sandboxMode?: boolean
}

export default function OptPhaseRoadmap({
  activePhaseNumber = 2,
  unlockedThroughPhase = 2,
  sandboxMode = false,
}: OptPhaseRoadmapProps) {
  const normalizedActive = Math.min(5, Math.max(1, activePhaseNumber)) as 1 | 2 | 3 | 4 | 5
  const normalizedUnlocked = sandboxMode
    ? 5
    : Math.max(normalizedActive, unlockedThroughPhase)

  const [selectedPhase, setSelectedPhase] = useState<1 | 2 | 3 | 4 | 5>(normalizedActive)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { tierId, shouldShowTrigger } = useTierAccess()

  const activeSpec = OPT_PHASES.find(p => p.phase === selectedPhase) ?? OPT_PHASES[0]
  const coachSpotsLeft = FORGE_TIER_ENTITLEMENTS.coach_support.remainingSpots ?? 6
  const coachRosterCap = FORGE_TIER_ENTITLEMENTS.coach_support.rosterCap ?? 25

  // Trigger 5: Phase 02 / Load Milestone (Plus -> Coach Support)
  const showCoachMilestoneBanner =
    !sandboxMode &&
    normalizedUnlocked >= 2 &&
    shouldShowTrigger('phase_02_load_milestone')

  return (
    <section className="rounded-xl border border-white/10 bg-[#0A121E] p-3.5 text-slate-100">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-300">
            5-Phase NASM OPT™ Progression Roadmap
          </div>
          <div className="text-xs text-slate-400">
            Swipe phases · Currently in Phase 0{normalizedActive}
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
          Joint-First Engine
        </span>
      </div>

      {/* Horizontal Snap-Scroll Nodes (min-w-[132px] per node) */}
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2">
        {OPT_PHASES.map(item => {
          const isCurrent = item.phase === normalizedActive
          const isSelected = item.phase === selectedPhase
          const isUnlocked = item.phase <= normalizedUnlocked

          return (
            <button
              key={item.phase}
              type="button"
              onClick={() => setSelectedPhase(item.phase)}
              aria-pressed={isSelected}
              className={`min-w-[132px] shrink-0 snap-start rounded-xl border p-2.5 text-left transition ${
                isSelected
                  ? 'border-amber-400 bg-amber-400/15 text-white'
                  : isCurrent
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-slate-100'
                    : 'border-white/10 bg-slate-950/75 text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-extrabold tracking-wider text-amber-300">
                  {item.code}
                </span>
                {isUnlocked ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <Lock size={11} className="text-slate-500" />
                )}
              </div>
              <div className="mt-1 text-xs font-bold leading-snug text-white">{item.shortTitle}</div>
              <div className="mt-1 text-[10px] text-slate-400">{item.repsAndSets.split('·')[1]?.trim()}</div>
            </button>
          )
        })}
      </div>

      {/* Selected Phase Detail Strip */}
      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 p-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-xs font-bold text-white">
            {activeSpec.code}: {activeSpec.outcomeHeadline}
          </span>
          <span className="font-mono text-[10px] text-amber-300">
            {activeSpec.repsAndSets} · {activeSpec.restInterval}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">{activeSpec.plainEnglishSummary}</p>
      </div>

      {/* Trigger 5: Subtle Coach-Card Banner upon unlocking Phase 02 (Plus -> Coach Support) */}
      {showCoachMilestoneBanner ? (
        <div className="mt-2.5 flex flex-col justify-between gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 text-xs text-slate-200">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-300" />
            <div>
              <div className="font-bold text-amber-200">
                Phase 02 Load Milestone Unlocked · {coachSpotsLeft} of {coachRosterCap} Coach Support Spots Open
              </div>
              <div className="text-[11px] text-slate-300">
                Add 1-on-1 Coach Gordon chat (24h SLA), bespoke load calibration &amp; 8 Form Lab reviews/mo.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-amber-300"
          >
            Claim Spot ({coachSpotsLeft}/{coachRosterCap}) <ArrowUpRight size={13} />
          </button>
        </div>
      ) : null}

      {!sandboxMode ? (
        <TierUpgradeModal
          open={upgradeOpen}
          triggerContext="phase_02_load_milestone"
          currentTier={tierId}
          onClose={() => setUpgradeOpen(false)}
        />
      ) : null}
    </section>
  )
}

