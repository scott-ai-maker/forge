'use client'

import React, { useState } from 'react'
import { ArrowUpRight, CheckCircle2, Lock, Play, ShieldCheck, Volume2 } from 'lucide-react'
import { FORGE_TIER_ENTITLEMENTS, useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'
import ExerciseVideoModal, { type ExerciseModalData } from '@/components/fitness/ExerciseVideoModal'
import { playCoachStaticCue } from '@/src/lib/audio/coachVoiceEngine'

export interface OptPhaseSampleExercise {
  slot: string
  name: string
  prescription: string
  cue: string
  imageUrl: string
  videoUrl: string
}

export interface OptPhaseSpec {
  phase: 1 | 2 | 3 | 4 | 5
  code: string
  shortTitle: string
  trackLabel: string
  isOptionalGoalTrack: boolean
  outcomeHeadline: string
  tempo: string
  repsAndSets: string
  restInterval: string
  plainEnglishSummary: string
  whoItsFor: string
  clinicalNote: string
  sampleBlockTitle: string
  sampleExercises: [OptPhaseSampleExercise, OptPhaseSampleExercise]
}

export const OPT_PHASES: OptPhaseSpec[] = [
  {
    phase: 1,
    code: 'PHASE 01',
    shortTitle: 'Stabilization',
    trackLabel: 'Core Foundation',
    isOptionalGoalTrack: false,
    outcomeHeadline: 'Bulletproof Joints, Core Bracing & Alignment',
    tempo: '4-2-1 Controlled Tempo',
    repsAndSets: '1–3 Sets · 12–20 Reps',
    restInterval: '0–90s Rest',
    plainEnglishSummary:
      'Corrects desk stiffness and prepares tendons, rotator cuffs, and deep core stabilizers with light, joint-friendly loads and steady breathing.',
    whoItsFor:
      'Every member starts here—foundational for joint comfort, core stability, balance, and posture alignment.',
    clinicalNote:
      'Controlled tempos and steady rhythmic breathing calibrated to your health intake.',
    sampleBlockTitle: 'Phase 01 Joint-Stability & Proprioception Pairing',
    sampleExercises: [
      {
        slot: 'A1 · Balance & Core',
        name: 'Single Leg Balance Reach',
        prescription: '2 × 12 / side · 4-2-1 Tempo',
        cue: 'Anchor tripod foot, stack knee over 2nd toe, and hold 2s isometric balance.',
        imageUrl: '/images/exercises/single-leg-balance-reach-frontal-plane.jpg',
        videoUrl: '/videos/exercises/single-leg-balance-reach-frontal-plane.mp4',
      },
      {
        slot: 'A2 · Scapular Control',
        name: 'Standing Tubing Row',
        prescription: '2 × 15 · 4-2-1 Tempo',
        cue: 'Draw shoulder blades down and back without rib flare; 4-second controlled return.',
        imageUrl: '/images/exercises/standing-tubing-row.jpg',
        videoUrl: '/videos/exercises/standing-tubing-row.mp4',
      },
    ],
  },
  {
    phase: 2,
    code: 'PHASE 02',
    shortTitle: 'Strength Endurance',
    trackLabel: 'Primary Longevity',
    isOptionalGoalTrack: false,
    outcomeHeadline: 'Lean Muscle Work Capacity & Superset Stamina',
    tempo: '2-0-2 / 4-2-1 Superset',
    repsAndSets: '2–4 Sets · 8–12 Reps',
    restInterval: '60s Rest',
    plainEnglishSummary:
      'Pairs a moderate, controlled strength movement with a joint-stabilizing exercise to build durable everyday strength, bone density, and metabolic health.',
    whoItsFor:
      'The primary training zone for sustainable strength, lean muscle tone, fat loss, and everyday stamina.',
    clinicalNote:
      'Moderate loads and smooth pacing—effective stimulus without unnecessary joint or blood-pressure strain.',
    sampleBlockTitle: 'Phase 02 Biomechanical Contrast Superset (0s Intra-Pair Rest)',
    sampleExercises: [
      {
        slot: 'A1 · Prime Strength Lift',
        name: 'Goblet Squat',
        prescription: '3 × 10 · 2-0-2 Tempo',
        cue: 'Brace 360° core cylinder, descend smoothly with vertical torso, drive through midfoot.',
        imageUrl: '/images/exercises/goblet-squat.jpg',
        videoUrl: '/videos/exercises/goblet-squat.mp4',
      },
      {
        slot: 'A2 · Stabilization Match',
        name: 'Single Leg Balance Reach',
        prescription: '3 × 12 / side · 4-2-1 Tempo',
        cue: 'Immediately challenge hip & ankle stabilizers under controlled fatigue.',
        imageUrl: '/images/exercises/single-leg-balance-reach-frontal-plane.jpg',
        videoUrl: '/videos/exercises/single-leg-balance-reach-frontal-plane.mp4',
      },
    ],
  },
  {
    phase: 3,
    code: 'PHASE 03',
    shortTitle: 'Muscular Dev',
    trackLabel: 'Goal-Optional',
    isOptionalGoalTrack: true,
    outcomeHeadline: 'Targeted Hypertrophy & Balanced Physique',
    tempo: '2-0-2 Controlled Hypertrophy',
    repsAndSets: '3–5 Sets · 6–12 Reps',
    restInterval: '60–90s Rest',
    plainEnglishSummary:
      'Optional physique-focused volume blocks designed to add lean muscle mass without lower-back or shoulder wear.',
    whoItsFor:
      'Optional track used when adding extra muscle size and hypertrophy is one of your goals.',
    clinicalNote:
      'Included only when higher muscle-building volume aligns with your priorities and recovery.',
    sampleBlockTitle: 'Phase 03 Mechanical Tension Hypertrophy Block',
    sampleExercises: [
      {
        slot: 'A1 · Upper Push Volume',
        name: 'Two Arm Incline Dumbbell Chest Press',
        prescription: '4 × 8–10 · 2-0-2 Tempo',
        cue: '30° bench angle, 45° scapular plane elbow path to protect the anterior shoulder.',
        imageUrl: '/images/exercises/two-arm-incline-dumbbell-chest-press.jpg',
        videoUrl: '/videos/exercises/two-arm-incline-dumbbell-chest-press.mp4',
      },
      {
        slot: 'A2 · Posterior Hinge Volume',
        name: 'Dumbbell Romanian Deadlift',
        prescription: '4 × 10 · 3-1-1 Tempo',
        cue: 'Push hips straight back with neutral lumbar spine and pause 1s in peak hamstring stretch.',
        imageUrl: '/images/exercises/dumbbell-romanian-deadlift.jpg',
        videoUrl: '/videos/exercises/dumbbell-romanian-deadlift.mp4',
      },
    ],
  },
  {
    phase: 4,
    code: 'PHASE 04',
    shortTitle: 'Max Strength',
    trackLabel: 'Goal-Optional',
    isOptionalGoalTrack: true,
    outcomeHeadline: 'Peak Force Output & Dense Neural Strength',
    tempo: 'Explosive Concentric (X-0-X)',
    repsAndSets: '4–6 Sets · 1–5 Reps',
    restInterval: '3–5m Rest',
    plainEnglishSummary:
      'Optional low-rep strength cycles strictly for cleared lifters pursuing heavy barbell or unilateral force milestones.',
    whoItsFor:
      'Optional specialty track for members specifically pursuing heavy maximal strength milestones.',
    clinicalNote:
      'Used only when low-rep heavy loading matches your goals and health clearance (omitted for blood-pressure or joint restrictions).',
    sampleBlockTitle: 'Phase 04 Neural Recruitment & Force Block',
    sampleExercises: [
      {
        slot: 'A1 · Primary Force Lift',
        name: 'Barbell Deadlift',
        prescription: '5 × 4 · X-0-X Intent',
        cue: 'Pack lats, pull slack out of the bar, and drive the floor away with crisp bar speed.',
        imageUrl: '/images/exercises/barbell-deadlift.jpg',
        videoUrl: '/videos/exercises/barbell-deadlift.mp4',
      },
      {
        slot: 'B1 · Unilateral Load',
        name: 'Bulgarian Split Squat',
        prescription: '4 × 5 / side · 2-1-1 Tempo',
        cue: 'Symmetrical single-leg force production without axial spinal compression.',
        imageUrl: '/images/exercises/bulgarian-split-squat.jpg',
        videoUrl: '/videos/exercises/bulgarian-split-squat.mp4',
      },
    ],
  },
  {
    phase: 5,
    code: 'PHASE 05',
    shortTitle: 'Power',
    trackLabel: 'Sport-Optional',
    isOptionalGoalTrack: true,
    outcomeHeadline: 'Athletic Speed, Elasticity & Force-Velocity',
    tempo: 'Superset Heavy + Explosive',
    repsAndSets: '3–5 Sets · 1–5 + 8–10 Reps',
    restInterval: '1–2m / 3–5m Rest',
    plainEnglishSummary:
      'Optional sport-performance track pairing strength work with explosive speed drills for cleared court, field, and rotational athletes.',
    whoItsFor:
      'Optional sport-performance track for rotational, court, or field athletic speed and power.',
    clinicalNote:
      'Programmed only when explosive sport performance is your goal—never forced into general fitness or wellness plans.',
    sampleBlockTitle: 'Phase 05 Post-Activation Potentiation (PAP) Complex',
    sampleExercises: [
      {
        slot: 'A1 · Heavy Prime (85% 1RM)',
        name: 'Goblet Squat',
        prescription: '4 × 4 · Controlled Heavy',
        cue: 'Recruit high-threshold motor units cleanly before transitioning to elastic expression.',
        imageUrl: '/images/exercises/goblet-squat.jpg',
        videoUrl: '/videos/exercises/goblet-squat.mp4',
      },
      {
        slot: 'A2 · Rate of Force Expression',
        name: 'Squat Jump With Stabilization',
        prescription: '4 × 8 · X-0-X + 2s Stick',
        cue: 'Explode upward and absorb landing softly into a quiet 2-second athletic freeze.',
        imageUrl: '/images/exercises/squat-jump-with-stabilization.jpg',
        videoUrl: '/videos/exercises/squat-jump-with-stabilization.mp4',
      },
    ],
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
  const [activeExerciseModal, setActiveExerciseModal] = useState<ExerciseModalData | null>(null)
  const { tierId, shouldShowTrigger } = useTierAccess()

  const activeSpec = OPT_PHASES.find(p => p.phase === selectedPhase) ?? OPT_PHASES[0]
  const coachRosterCap = FORGE_TIER_ENTITLEMENTS.coach_support.rosterCap ?? 15

  // Trigger 5: Phase 02 / Load Milestone (Plus -> Coach Support)
  const showCoachMilestoneBanner =
    !sandboxMode &&
    normalizedUnlocked >= 2 &&
    shouldShowTrigger('phase_02_load_milestone')

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            5-Phase NASM OPT™ Progression Roadmap
          </div>
          <div className="mt-0.5 text-xs tabular-nums text-zinc-300">
            {sandboxMode
              ? `Click any phase to inspect its workout block · Viewing ${activeSpec.code}`
              : `Swipe phases · Currently in Phase 0${normalizedActive}`}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sandboxMode ? (
            <button
              type="button"
              onClick={() =>
                playCoachStaticCue('tempo_3_1_1_eccentric', { forceUnlockVoiceOnTap: true })
              }
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-[#181B22] px-3 py-1.5 text-xs font-bold text-emerald-200 transition-colors hover:border-emerald-400/50 hover:bg-[#1D212A]"
            >
              <Volume2 size={14} className="text-emerald-300" aria-hidden="true" />
              <span>Hear Coach Pace a Rep</span>
            </button>
          ) : null}
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            Joint-First Engine
          </span>
        </div>
      </div>

      {sandboxMode ? (
        <div className="mb-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3 text-xs leading-relaxed text-zinc-200">
          <div className="flex items-start gap-2">
            <ShieldCheck
              size={16}
              strokeWidth={1.85}
              className="mt-0.5 shrink-0 text-emerald-300"
              aria-hidden="true"
            />
            <div>
              <strong className="font-semibold text-white">
                Built Around Your Goals — Not a Mandatory 1-to-5 Ladder:
              </strong>{' '}
              Most members focused on posture, fat loss, joint comfort, and lasting strength do
              their best work in <strong className="text-emerald-300">Phases 01–02</strong>.{' '}
              <strong className="text-amber-200">Phases 03–05 are optional specialty tracks</strong>{' '}
              used only when your specific goals and health profile call for them—so you never do
              heavy max lifts or jump training unless they directly serve what you are working
              toward.
            </div>
          </div>
        </div>
      ) : null}

      {/* Horizontal Snap-Scroll on Mobile · Full Symmetrical 5-Column Grid on Desktop */}
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x_pan-y] lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
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
              className={`forge-tactile-press min-h-[88px] min-w-[148px] shrink-0 snap-start rounded-xl border p-3 text-left transition-colors duration-150 lg:min-w-0 ${
                isSelected
                  ? 'border-emerald-500/45 bg-[#181B22] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : isCurrent
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-zinc-100'
                    : 'border-white/[0.07] bg-[#090A0D] text-zinc-300 hover:border-white/15 hover:bg-[#181B22]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] tabular-nums ${
                    isSelected ? 'text-emerald-300' : 'text-zinc-400'
                  }`}
                >
                  {item.code}
                </span>
                {sandboxMode ? (
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                      item.isOptionalGoalTrack
                        ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                        : 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {item.isOptionalGoalTrack ? 'Optional' : 'Core'}
                  </span>
                ) : isUnlocked ? (
                  <CheckCircle2 size={13} strokeWidth={1.75} className="text-emerald-400" aria-hidden="true" />
                ) : (
                  <Lock size={12} strokeWidth={1.75} className="text-zinc-500" aria-hidden="true" />
                )}
              </div>
              <div className="mt-1 text-xs font-bold leading-snug text-white">{item.shortTitle}</div>
              <div className="mt-0.5 text-[10px] font-medium text-zinc-400">{item.trackLabel}</div>
              <div className="mt-0.5 font-mono text-[10px] tabular-nums text-zinc-500">
                {item.repsAndSets.split('·')[1]?.trim()}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Phase Detail Strip */}
      <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#181B22] p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white sm:text-sm">
              {activeSpec.code} · {activeSpec.outcomeHeadline}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider ${
                activeSpec.isOptionalGoalTrack
                  ? 'border-amber-500/35 bg-amber-500/12 text-amber-200'
                  : 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
              }`}
            >
              {activeSpec.trackLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-amber-200">
              {activeSpec.tempo}
            </span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-emerald-300">
              {activeSpec.repsAndSets} · {activeSpec.restInterval}
            </span>
          </div>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">{activeSpec.plainEnglishSummary}</p>

        {/* Plain-English Goal Fit & Clinical Safety Readout */}
        <div className="mt-2.5 grid grid-cols-1 gap-2 rounded-lg border border-white/[0.06] bg-[#111318] p-2.5 text-[11.5px] leading-relaxed md:grid-cols-2">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Who This Phase Is For:{' '}
            </span>
            <span className="text-zinc-200">{activeSpec.whoItsFor}</span>
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Health &amp; Safety Guardrail:{' '}
            </span>
            <span className="text-zinc-300">{activeSpec.clinicalNote}</span>
          </div>
        </div>

        {/* Interactive Sample Superset Cards + 120-Frame Studio Video Modal in Sandbox Mode */}
        {sandboxMode ? (
          <div className="mt-3.5 border-t border-white/[0.07] pt-3.5">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-amber-300">
                {activeSpec.sampleBlockTitle}
              </span>
              <span className="text-[11px] text-zinc-400">
                Tap either movement to watch the Studio Video &amp; NASM Cues
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {activeSpec.sampleExercises.map(ex => (
                <button
                  key={`${activeSpec.phase}-${ex.slot}`}
                  type="button"
                  onClick={() =>
                    setActiveExerciseModal({
                      name: ex.name,
                      imageUrl: ex.imageUrl,
                      videoUrl: ex.videoUrl,
                      protocol: ex.prescription,
                      phaseLabel: `${activeSpec.code} · ${activeSpec.shortTitle}`,
                      coachingCues: [ex.cue],
                    })
                  }
                  className="forge-tactile-press group flex min-h-[76px] flex-col gap-2.5 rounded-xl border border-white/[0.08] bg-[#090A0D] p-3 text-left transition-colors hover:border-emerald-400/45 hover:bg-[#111318] sm:flex-row sm:items-center sm:gap-3 sm:p-2.5"
                >
                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#181B22] sm:aspect-auto sm:h-16 sm:w-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ex.imageUrl}
                      alt={ex.name}
                      width={96}
                      height={64}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center bg-black/35 text-white transition-colors group-hover:bg-black/20"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/60 bg-[#090A0D]/85 text-emerald-300">
                        <Play size={12} fill="currentColor" />
                      </span>
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        {ex.slot}
                      </span>
                      <span className="font-mono text-[10.5px] font-semibold tabular-nums text-amber-200">
                        {ex.prescription}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs font-bold text-white sm:text-sm">
                      {ex.name}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">{ex.cue}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Trigger 5: Subtle Coach-Card Banner upon unlocking Phase 02 (Plus -> Coach Support) */}
      {showCoachMilestoneBanner ? (
        <div className="mt-3 flex flex-col justify-between gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 text-xs text-zinc-200">
            <ShieldCheck size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <div className="font-bold tabular-nums text-amber-200">
                Phase 02 Load Milestone Unlocked · Coach Support Capped at {coachRosterCap} Active Seats
              </div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-zinc-300">
                Add 1-on-1 Coach Gordon chat (24h SLA), bespoke load calibration &amp; 8 Form Lab reviews/mo.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#090A0D] transition-colors duration-150 hover:bg-amber-300"
          >
            <span className="tabular-nums">Upgrade to Coach Support</span>{' '}
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {activeExerciseModal ? (
        <ExerciseVideoModal
          exercise={activeExerciseModal}
          onClose={() => setActiveExerciseModal(null)}
        />
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
