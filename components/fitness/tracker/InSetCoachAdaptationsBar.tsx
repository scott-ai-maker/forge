'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Gauge,
  Mail,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Volume2,
  X,
} from 'lucide-react'
import {
  detectMovementPattern,
  getSmartSubstitutions,
  type ExerciseSubstitution,
} from '@/lib/nasm-exercise-substitution'
import {
  ENVIRONMENT_PROFILE_META,
  getTodayIsoDate,
  loadPostureProfileState,
  type EnvironmentProfileId,
} from '@/lib/posture-profile-state'
import {
  dispatchSafetyFlagTelemetry,
  evaluatePainAndRedFlagTriage,
  evaluateProgressionAndIntensityCaps,
  type SafetyOverrideDecision,
} from '@/src/lib/safety/clinicalGuardrails'
import {
  buildAutoRegressionBriefing,
  playCoachStaticCue,
  speakCoachDynamicText,
} from '@/src/lib/audio/coachVoiceEngine'
import { useTierAccess } from '@/lib/tierEntitlements'
import CoachEscalationModal from '@/components/coach-gordon/CoachEscalationModal'
import { openCoachGordon } from '@/components/fitness/GlobalCoachGordonHost'

const ENVIRONMENT_EQUIPMENT_MAP: Record<EnvironmentProfileId, string[]> = {
  full_gym: ['full_gym', 'barbell', 'dumbbells', 'cable', 'machine', 'bench', 'bands', 'kettlebell'],
  home_gym: ['dumbbells', 'bench', 'bands', 'kettlebell', 'stability ball', 'pull-up', 'box'],
  hotel_travel: ['dumbbells', 'bands', 'bench'],
  bodyweight_only: ['bodyweight'],
}

export interface InSetLoadTempoAdjustment {
  weightDeltaPct: number
  prescribedTempo: string
  maxAllowedRpe: number
  coachSummary: string
}

export interface InSetCoachAdaptationsBarProps {
  exerciseName: string
  optPhase: number
  currentTempo?: string | null
  currentWeightInput?: string
  units?: 'imperial' | 'metric'
  readinessScore?: number | null
  profileEquipment?: string[] | null
  onApplySubstitution: (substitution: ExerciseSubstitution) => void
  onAdjustLoadAndTempo: (adjustment: InSetLoadTempoAdjustment) => void
}

export default function InSetCoachAdaptationsBar({
  exerciseName,
  optPhase,
  currentTempo,
  currentWeightInput,
  units = 'imperial',
  readinessScore,
  profileEquipment,
  onApplySubstitution,
  onAdjustLoadAndTempo,
}: InSetCoachAdaptationsBarProps) {
  const { tierId } = useTierAccess()
  const isCoachSupport = tierId === 'coach_support'

  const [difficultyPickerOpen, setDifficultyPickerOpen] = useState(false)
  const [swapCursor, setSwapCursor] = useState(0)
  const [coachBanner, setCoachBanner] = useState<{
    tone: 'safety' | 'coach'
    headline: string
    body: string
    disclaimer?: string
    spokenText: string
    safetyDecision?: SafetyOverrideDecision
  } | null>(null)
  const [escalationOpen, setEscalationOpen] = useState(false)

  const readLiveTelemetry = () => {
    const state = loadPostureProfileState()
    const todayLog = state.dailyLogs[getTodayIsoDate()]
    return {
      envProfile: state.environmentProfile || 'home_gym',
      jointComfortScore: todayLog?.jointComfortScore ?? null,
      effectiveReadiness: readinessScore ?? todayLog?.readinessScore ?? null,
      expressModeActive: state.expressModeActive,
      ergonomicFlags: state.ergonomicFlags,
    }
  }

  // 1. "Joint Feels Pinchy / Uncomfortable" -> Safe Regression + Safety Triage + Coach Portal Alert
  const handleJointFeelsPinchy = () => {
    const telemetry = readLiveTelemetry()
    const decision = evaluatePainAndRedFlagTriage({
      pinchyButtonTriggered: true,
      exerciseName,
      optPhase,
      jointComfort100: telemetry.jointComfortScore,
    })

    const regression = decision.regression
    const replacementName =
      regression?.replacementExercise || 'Supported Bodyweight Box Squat / Glute Bridge'
    const prescribedTempo = regression?.prescribedTempo || '3-2-1-0'
    const rationale =
      regression?.rationale ||
      'Unloads joint shear immediately so you can move through a calm, pain-free range.'

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('forge-safety-pause-workout', {
          detail: {
            exerciseName,
            replacementExercise: replacementName,
            jointArea: decision.detectedJointArea,
          },
        })
      )
    }

    onApplySubstitution({
      name: replacementName,
      category: detectMovementPattern(replacementName),
      reasoning: rationale,
      benefitTag: 'Pain-Free Regression',
      prescribedTempo,
      equipmentRequired: 'Joint-Friendly Setup',
    })

    void dispatchSafetyFlagTelemetry({
      decision,
      triggerSource: 'in_set_pinchy_button',
      exerciseName,
      swappedToExercise: replacementName,
      comfortScore100: telemetry.jointComfortScore,
      optPhase,
      clientNote: `Member tapped "Joint Feels Pinchy / Uncomfortable" during ${exerciseName}.`,
    })

    const briefing = buildAutoRegressionBriefing({
      fromExercise: exerciseName,
      toExercise: replacementName,
      tempo: prescribedTempo,
      reason: rationale,
    })

    playCoachStaticCue('safety_pause_check')
    void speakCoachDynamicText(briefing, {
      moment: 'auto_regression_safety',
      priority: 'safety',
    })

    setDifficultyPickerOpen(false)
    setCoachBanner({
      tone: 'safety',
      headline: decision.headline,
      body: decision.calmCoachMessage,
      disclaimer: decision.clinicalDisclaimer,
      spokenText: briefing,
      safetyDecision: decision,
    })
  }

  // 2. "Too Easy / Too Hard" -> Real-time NASM OPT™ Load & Tempo Target Adjustment
  const handleDifficultyChoice = (direction: 'too_easy' | 'too_hard') => {
    const telemetry = readLiveTelemetry()
    const requestedDelta = direction === 'too_easy' ? 7.5 : -12.5

    const capEval = evaluateProgressionAndIntensityCaps({
      currentOptPhase: optPhase,
      targetOptPhase: optPhase,
      stabilizationCertified: optPhase >= 2,
      readinessIndex: telemetry.effectiveReadiness,
      jointComfortScore100: telemetry.jointComfortScore,
      requestedLoadIncreasePct: requestedDelta,
    })

    let finalDeltaPct: number
    let nextTempo: string
    let rationale: string

    if (direction === 'too_easy') {
      if (capEval.intensityAutoCapped) {
        finalDeltaPct = 0
        nextTempo = capEval.enforcedTempo || '4-2-1-0'
        rationale = `Your Readiness or Joint Comfort is flagged today, so instead of adding external load on ${exerciseName}, I slowed your eccentric tempo to ${nextTempo} (max RPE ${capEval.maxAllowedRpe}) to increase time-under-tension safely.`
        playCoachStaticCue('tempo_3_1_1_eccentric')
      } else if (optPhase === 1) {
        finalDeltaPct = 5
        nextTempo = '4-2-1-1'
        rationale = `Phase 01 Stabilization rule: nudged target load +5% and locked a strict ${nextTempo} eccentric + isometric tempo. Own every degree of balance before chasing heavier jumps.`
        playCoachStaticCue('tempo_3_1_1_eccentric')
      } else {
        finalDeltaPct = Math.max(2.5, Math.min(7.5, capEval.recommendedLoadDeltaPct || 5))
        nextTempo = currentTempo || (optPhase >= 4 ? '2-0-1-0' : '2-0-2-0')
        const currentNum = Number(currentWeightInput)
        const previewWeight =
          Number.isFinite(currentNum) && currentNum > 0
            ? ` (~${Math.max(5, Math.round((currentNum * (1 + finalDeltaPct / 100)) / 2.5) * 2.5)} ${units === 'imperial' ? 'lb' : 'kg'})`
            : ''
        rationale = `Phase 0${optPhase} progression unlocked: bumped working load +${finalDeltaPct}%${previewWeight} at ${nextTempo} tempo while keeping effort under RPE ${capEval.maxAllowedRpe}.`
      }
    } else {
      finalDeltaPct = -12.5
      nextTempo = optPhase === 1 ? '4-2-1-0' : '3-1-1-0'
      rationale = `Smart auto-regulation—dropped target load by 12.5% and set a smooth ${nextTempo} tempo on ${exerciseName} so you lock crisp joint mechanics with 2–3 clean reps in reserve.`
      playCoachStaticCue('tempo_3_1_1_eccentric')
    }

    onAdjustLoadAndTempo({
      weightDeltaPct: finalDeltaPct,
      prescribedTempo: nextTempo,
      maxAllowedRpe: capEval.maxAllowedRpe,
      coachSummary: rationale,
    })

    void speakCoachDynamicText(rationale, {
      moment: 'on_demand_chat',
    })

    setDifficultyPickerOpen(false)
    setCoachBanner({
      tone: 'coach',
      headline:
        direction === 'too_easy'
          ? `NASM OPT™ Progression (${finalDeltaPct > 0 ? `+${finalDeltaPct}% Load` : `Tempo ${nextTempo}`})`
          : `NASM OPT™ Auto-Regulation (${finalDeltaPct}% Load · ${nextTempo})`,
      body: rationale,
      spokenText: rationale,
    })
  }

  // 3. "Equipment Taken / Swap Exercise" -> Environment-Profile Matched Biomechanical Swap
  const handleEquipmentSwap = () => {
    const telemetry = readLiveTelemetry()
    const envMeta = ENVIRONMENT_PROFILE_META[telemetry.envProfile]
    const resolvedEquipment =
      telemetry.envProfile === 'full_gym' && Array.isArray(profileEquipment) && profileEquipment.length > 0
        ? profileEquipment
        : ENVIRONMENT_EQUIPMENT_MAP[telemetry.envProfile]

    const candidates = getSmartSubstitutions(
      exerciseName,
      `Phase ${optPhase}`,
      'equipment_busy',
      resolvedEquipment
    ).filter(c => c.name.toLowerCase() !== exerciseName.toLowerCase())

    const fallbackCandidate: ExerciseSubstitution =
      telemetry.envProfile === 'bodyweight_only'
        ? {
            name: 'Tempo Push-Up / Split Squat (3-2-1-0)',
            category: detectMovementPattern(exerciseName),
            reasoning: 'Zero-equipment biomechanical match preserving full Phase tempo density.',
            benefitTag: 'Hypertrophy Alternative',
            prescribedTempo: '3-2-1-0',
            equipmentRequired: 'Bodyweight',
          }
        : {
            name: 'Neutral-Grip Dumbbell Tempo Variation',
            category: detectMovementPattern(exerciseName),
            reasoning: `Matches your ${envMeta.label} profile while keeping identical prime-mover recruitment.`,
            benefitTag: 'Hypertrophy Alternative',
            prescribedTempo: optPhase === 1 ? '4-2-1-0' : '3-1-1-0',
            equipmentRequired: 'Dumbbells',
          }

    const picked =
      candidates.length > 0 ? candidates[swapCursor % candidates.length] : fallbackCandidate
    setSwapCursor(prev => prev + 1)

    const swapSummary = buildAutoRegressionBriefing({
      fromExercise: exerciseName,
      toExercise: picked.name,
      tempo: picked.prescribedTempo,
      reason: `Matched to your ${envMeta.label} setup (${picked.equipmentRequired}). ${picked.reasoning}`,
    })

    onApplySubstitution(picked)
    void speakCoachDynamicText(swapSummary, {
      moment: 'on_demand_chat',
    })

    setDifficultyPickerOpen(false)
    setCoachBanner({
      tone: 'coach',
      headline: `Swapped for ${envMeta.label} → ${picked.name}`,
      body: `${picked.reasoning} Prescribed tempo: ${picked.prescribedTempo} (${picked.equipmentRequired}).`,
      spokenText: swapSummary,
    })
  }

  const telemetrySnapshot = readLiveTelemetry()

  return (
    <div
      data-testid="in-set-coach-adaptations-bar"
      className="mb-2.5 rounded-xl border border-white/10 bg-[#10141D]/95 p-2.5 text-zinc-100"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-300">
          Coach Gordon Live In-Set Adaptations
        </span>
        <button
          type="button"
          onClick={() =>
            openCoachGordon({
              currentExerciseName: exerciseName,
              nasmOptPhase: optPhase,
            })
          }
          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-zinc-200 transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
        >
          <MessageSquare size={12} className="text-emerald-300" aria-hidden="true" />
          <span>Ask Coach</span>
        </button>
      </div>

      {/* 3 Quick-Tap Trainer Buttons (44px ergonomic touch targets, stacks cleanly at 375px) */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleJointFeelsPinchy}
          data-testid="in-set-joint-pinchy-btn"
          className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/12 px-2.5 py-2 text-left text-xs font-bold text-amber-100 transition-colors hover:bg-amber-500/20"
        >
          <AlertTriangle size={14} className="shrink-0 text-amber-300" aria-hidden="true" />
          <span className="leading-tight">Joint Feels Pinchy / Uncomfortable</span>
        </button>

        <button
          type="button"
          onClick={() => setDifficultyPickerOpen(prev => !prev)}
          aria-expanded={difficultyPickerOpen}
          data-testid="in-set-too-easy-hard-btn"
          className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-2 text-left text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-500/18"
        >
          <Gauge size={14} className="shrink-0 text-cyan-300" aria-hidden="true" />
          <span className="leading-tight">Too Easy / Too Hard</span>
        </button>

        <button
          type="button"
          onClick={handleEquipmentSwap}
          data-testid="in-set-equipment-swap-btn"
          className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-2 text-left text-xs font-bold text-emerald-100 transition-colors hover:bg-emerald-500/18"
        >
          <RefreshCw size={14} className="shrink-0 text-emerald-300" aria-hidden="true" />
          <span className="leading-tight">Equipment Taken / Swap Exercise</span>
        </button>
      </div>

      {/* Inline Too Easy / Too Hard Picker */}
      {difficultyPickerOpen ? (
        <div
          data-testid="in-set-difficulty-picker"
          className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl border border-cyan-400/25 bg-[#0B0F17] p-2"
        >
          <button
            type="button"
            onClick={() => handleDifficultyChoice('too_easy')}
            data-testid="in-set-choice-too-easy"
            className="forge-tactile-press min-h-[44px] rounded-lg border border-emerald-400/30 bg-emerald-500/12 px-2.5 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20"
          >
            Too Easy → Progress Load / Tempo
          </button>
          <button
            type="button"
            onClick={() => handleDifficultyChoice('too_hard')}
            data-testid="in-set-choice-too-hard"
            className="forge-tactile-press min-h-[44px] rounded-lg border border-amber-400/30 bg-amber-500/12 px-2.5 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/20"
          >
            Too Hard → Dial Back 12.5% + Tempo
          </button>
        </div>
      ) : null}

      {/* Coach Gordon Live Adaptation / Safety Override Feedback Card */}
      {coachBanner ? (
        <div
          role={coachBanner.tone === 'safety' ? 'alert' : 'status'}
          data-testid={
            coachBanner.tone === 'safety'
              ? 'in-set-safety-override-card'
              : 'in-set-adaptation-rationale-card'
          }
          className={`mt-2.5 rounded-xl border p-3 ${
            coachBanner.tone === 'safety'
              ? 'border-amber-400/45 bg-amber-500/12 text-amber-50'
              : 'border-emerald-400/30 bg-emerald-500/10 text-zinc-100'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              {coachBanner.tone === 'safety' ? (
                <ShieldAlert size={15} className="shrink-0 text-amber-300" aria-hidden="true" />
              ) : null}
              <span>{coachBanner.headline}</span>
            </div>
            <button
              type="button"
              onClick={() => setCoachBanner(null)}
              aria-label="Dismiss Coach Gordon note"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-zinc-200">{coachBanner.body}</p>

          {coachBanner.disclaimer ? (
            <p className="mt-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] leading-relaxed text-amber-100/90">
              {coachBanner.disclaimer}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void speakCoachDynamicText(coachBanner.spokenText, {
                  moment:
                    coachBanner.tone === 'safety'
                      ? 'auto_regression_safety'
                      : 'on_demand_chat',
                  forceUnlockVoiceOnTap: true,
                })
              }}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-zinc-100 hover:bg-white/12"
            >
              <Volume2 size={13} className="text-emerald-300" aria-hidden="true" />
              <span>Listen to Coach Gordon</span>
            </button>

            <button
              type="button"
              onClick={() => setEscalationOpen(true)}
              data-testid="in-set-message-real-coach-btn"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100 hover:bg-emerald-500/25"
            >
              {isCoachSupport ? (
                <Smartphone size={13} aria-hidden="true" />
              ) : (
                <Mail size={13} aria-hidden="true" />
              )}
              <span>
                {isCoachSupport
                  ? 'Text Real Coach Gordon (24h SLA)'
                  : 'Message Real Coach Gordon'}
              </span>
            </button>
          </div>
        </div>
      ) : null}

      <CoachEscalationModal
        open={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        sourceContext="safety_override"
        initialQuestion={
          coachBanner?.tone === 'safety'
            ? `Hi Coach Gordon — "${exerciseName}" felt pinchy/uncomfortable (${coachBanner.safetyDecision?.detectedJointArea || 'joint check'}), so I switched to the regression. Anything else you want me to modify this week?`
            : `Hi Coach Gordon — quick check on "${exerciseName}" in Phase 0${optPhase}: `
        }
        telemetryOverride={{
          optPhase,
          jointComfortScore: telemetrySnapshot.jointComfortScore,
          readinessIndex: telemetrySnapshot.effectiveReadiness,
          postureFlags: telemetrySnapshot.ergonomicFlags.map(f => f.replace(/_/g, ' ')),
          environmentProfile: telemetrySnapshot.envProfile,
          expressModeActive: telemetrySnapshot.expressModeActive,
          activeExercise: exerciseName,
          safetyFlagActive: coachBanner?.tone === 'safety',
        }}
      />
    </div>
  )
}
