'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  BookOpen,
  Mail,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Square,
  Volume2,
  X,
  Zap,
} from 'lucide-react'
import AudioModeSelector from '@/components/audio/AudioModeSelector'
import CoachEscalationModal from '@/components/coach-gordon/CoachEscalationModal'
import {
  ENVIRONMENT_PROFILE_META,
  getTodayIsoDate,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  setExpressModeActive,
  type EnvironmentProfileId,
} from '@/lib/posture-profile-state'
import { useTierAccess } from '@/lib/tierEntitlements'
import type {
  AskCoachGordonRagCitation,
  AskCoachGordonResponse,
  AskCoachGordonSafetyCard,
  CoachActionRecommendation,
} from '@/lib/ask-coach-gordon-types'
import {
  buildPreWorkoutPersonalBriefing,
  playCoachStaticCue,
  useCoachVoiceEngine,
} from '@/src/lib/audio/coachVoiceEngine'
import {
  dispatchSafetyFlagTelemetry,
  evaluatePainAndRedFlagTriage,
  evaluateProgressionAndIntensityCaps,
  stripPiiAndRawFramesFromCoachContext,
} from '@/src/lib/safety/clinicalGuardrails'

export interface CoachGordonAssistantProps {
  isOpen: boolean
  onClose: () => void
  athleteName?: string
  goal?: string
  nasmOptPhase?: number
  currentWorkoutFocus?: string
  currentExerciseName?: string
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
  kineticCompensations?: string[]
  contraindicationTags?: string[]
  recentReadinessScore?: number
  recentSleepHours?: number
  recentRpe?: number
  recentRpeHistory?: number[]
  lastLoggedSet?: {
    weightLbs?: number
    reps?: number
    rpe?: number
    exerciseName?: string
  }
  todayWorkoutExercises?: string[]
  initialPrompt?: string
  initialSafetyCard?: AskCoachGordonSafetyCard | null
  onApplyExerciseSwap?: (newExerciseName: string, targetExerciseName?: string) => void
  onStartRestTimer?: (seconds: number) => void
  onAutoRegulateLoad?: (reductionPercent: number) => void
}

interface AssistantChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  spokenText?: string
  relevantCurriculums?: string[]
  ragRetrievalMode?: 'hybrid_pgvector_rrf' | 'bm25_tfidf_lexical'
  ragCitations?: AskCoachGordonRagCitation[]
  recommendedAction?: CoachActionRecommendation
  suggestedFollowUps?: string[]
  safetyCard?: AskCoachGordonSafetyCard
}

const DEFAULT_QUICK_PROMPTS = [
  'How low should I squat with tight hips?',
  'Wrist-friendly neutral-grip options for this lift',
  'Shorten today to 15 minutes',
]

function renderFormattedCoachText(markdown: string): React.ReactNode {
  const paragraphs = markdown.split(/\n{2,}/).filter(Boolean)
  return paragraphs.map((para, idx) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-white">
                {part.slice(2, -2)}
              </strong>
            )
          }
          return <React.Fragment key={pIdx}>{part}</React.Fragment>
        })}
      </p>
    )
  })
}

export default function CoachGordonAssistant({
  isOpen,
  onClose,
  athleteName = 'Member',
  goal = 'general_fitness',
  nasmOptPhase = 2,
  currentWorkoutFocus = 'Scheduled Workout',
  currentExerciseName,
  equipmentAccess,
  cardioEquipmentAccess,
  kineticCompensations,
  contraindicationTags,
  recentReadinessScore,
  recentSleepHours,
  recentRpe,
  recentRpeHistory = [],
  lastLoggedSet,
  todayWorkoutExercises = [],
  initialPrompt,
  initialSafetyCard = null,
  onApplyExerciseSwap,
  onStartRestTimer,
  onAutoRegulateLoad,
}: CoachGordonAssistantProps) {
  const { tierId } = useTierAccess()
  const { isSpeaking, activeSpeakingId, speakDynamicText, stopVoicePlayback } =
    useCoachVoiceEngine()

  const drawerHeadingId = useId()
  const chatInputId = useId()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const scrollEndRef = useRef<HTMLDivElement | null>(null)
  const autoSubmittedPromptRef = useRef<string | null>(null)

  const [postureState, setPostureState] = useState(() => loadPostureProfileState())
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<AssistantChatMessage[]>([])
  const [appliedActions, setAppliedActions] = useState<Record<string, string>>({})
  const [safetySwapApplied, setSafetySwapApplied] = useState<string | null>(null)
  const [activeSafetyBanner, setActiveSafetyBanner] =
    useState<AskCoachGordonSafetyCard | null>(initialSafetyCard)
  const [escalationOpen, setEscalationOpen] = useState(false)
  const [escalationPrefill, setEscalationPrefill] = useState('')
  const [escalationSource, setEscalationSource] = useState<
    'assistant_drawer' | 'safety_override'
  >('assistant_drawer')

  useEffect(() => {
    const sync = () => setPostureState(loadPostureProfileState())
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [])

  useEffect(() => {
    if (initialSafetyCard) {
      setActiveSafetyBanner(initialSafetyCard)
    }
  }, [initialSafetyCard])

  useEffect(() => {
    if (!isOpen) return
    const raf = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus({ preventScroll: true })
    })
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !escalationOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, escalationOpen, onClose])

  const todayIso = getTodayIsoDate()
  const todayDailyLog = postureState.dailyLogs[todayIso]
  const effectiveComfort = todayDailyLog?.jointComfortScore ?? null
  const effectiveReadiness =
    todayDailyLog?.readinessScore ?? recentReadinessScore ?? 82
  const envId = (postureState.environmentProfile || 'home_gym') as EnvironmentProfileId
  const envLabel = ENVIRONMENT_PROFILE_META[envId]?.label || 'Home Gym'
  const deskFlags = useMemo(
    () => postureState.ergonomicFlags || [],
    [postureState.ergonomicFlags]
  )
  const expressActive = Boolean(postureState.expressModeActive)

  const capStatus = useMemo(
    () =>
      evaluateProgressionAndIntensityCaps({
        currentOptPhase: nasmOptPhase,
        readinessIndex: effectiveReadiness,
        jointComfortScore100: effectiveComfort,
      }),
    [nasmOptPhase, effectiveReadiness, effectiveComfort]
  )

  const preWorkoutBriefingText = useMemo(
    () =>
      buildPreWorkoutPersonalBriefing({
        memberFirstName: athleteName,
        optPhase: nasmOptPhase,
        jointComfortScore100: effectiveComfort,
        readinessScore: effectiveReadiness,
        environmentLabel: envLabel,
        expressModeActive: expressActive,
      }),
    [athleteName, nasmOptPhase, effectiveComfort, effectiveReadiness, envLabel, expressActive]
  )

  const submitQuestion = useCallback(
    async (rawQuestion: string) => {
      const trimmed = rawQuestion.trim()
      if (!trimmed || loading) return

      const userMsgId = `u-${Date.now()}`
      setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: trimmed }])
      setInputValue('')
      setLoading(true)

      // 1. Immediate Client-Side Clinical Red-Flag Pre-Screen (Zero Latency Safety Pause)
      const localSafety = evaluatePainAndRedFlagTriage({
        messageText: trimmed,
        jointComfort100: effectiveComfort,
        exerciseName: currentExerciseName,
        optPhase: nasmOptPhase,
      })

      if (
        localSafety.triggered &&
        (localSafety.severity === 'emergency_911' || localSafety.severity === 'clinical_stop')
      ) {
        window.dispatchEvent(
          new CustomEvent('forge-safety-pause-workout', {
            detail: {
              reason: localSafety.headline,
              exerciseName: currentExerciseName,
            },
          })
        )
        playCoachStaticCue('safety_pause_check')
        void dispatchSafetyFlagTelemetry({
          decision: localSafety,
          triggerSource: 'ai_chat_red_flag',
          exerciseName: currentExerciseName,
          swappedToExercise: localSafety.regression?.replacementExercise ?? null,
          comfortScore100: effectiveComfort,
          optPhase: nasmOptPhase,
          clientNote: trimmed,
        })
        setActiveSafetyBanner({
          triggered: true,
          severity: localSafety.severity,
          headline: localSafety.headline,
          calmCoachMessage: localSafety.calmCoachMessage,
          clinicalDisclaimer: localSafety.clinicalDisclaimer,
          detectedJointArea: localSafety.detectedJointArea,
          replacementExercise: localSafety.regression?.replacementExercise,
        })
      }

      // 2. Strip PII & raw camera frames before sending structured telemetry to Coach Gordon AI
      const sanitizedPayload = stripPiiAndRawFramesFromCoachContext({
        question: trimmed,
        athleteName,
        goal,
        nasmOptPhase,
        currentWorkoutFocus,
        currentExerciseName,
        expressModeActive: expressActive,
        environmentProfile: envId,
        jointComfortScore: effectiveComfort ?? undefined,
        deskErgonomicsFlags: deskFlags,
        recentRpeHistory:
          recentRpeHistory.length > 0
            ? recentRpeHistory
            : recentRpe !== undefined
              ? [recentRpe]
              : [],
        equipmentAccess,
        cardioEquipmentAccess,
        kineticCompensations,
        contraindicationTags,
        recentReadinessScore: effectiveReadiness,
        recentSleepHours,
        recentRpe,
        lastLoggedSet,
        todayWorkoutExercises,
        activeConversationHistory: messages.slice(-6).map(m => ({
          role: m.role,
          text: m.text,
        })),
      })

      try {
        const res = await fetch('/api/coach/ask-gordon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedPayload),
        })
        const data = await res.json().catch(() => null)
        const coachRes = data?.response as AskCoachGordonResponse | undefined

        if (res.ok && coachRes?.answerMarkdown) {
          if (coachRes.safetyOverride?.triggered) {
            setActiveSafetyBanner(coachRes.safetyOverride)
          }
          setMessages(prev => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              text: coachRes.answerMarkdown,
              spokenText: coachRes.spokenAudioText || coachRes.answerMarkdown,
              relevantCurriculums: coachRes.relevantCurriculums,
              ragRetrievalMode: coachRes.ragRetrievalMode,
              ragCitations: coachRes.ragCitations,
              recommendedAction: coachRes.recommendedAction,
              suggestedFollowUps: coachRes.suggestedFollowUps,
              safetyCard: coachRes.safetyOverride,
            },
          ])
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              text: "I'm right here in your corner—keep your spine neutral, own a smooth 3-1-1-0 tempo, and tap **Message Real Coach Gordon** below if you want me to review this personally.",
              spokenText:
                "I'm right here in your corner. Keep your spine neutral, own a smooth tempo, and tap Message Real Coach Gordon if you want me to review this personally.",
            },
          ])
        }
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: "Connection looks momentarily offline—stick with controlled pain-free reps at **RPE 7**, or tap **Message Real Coach Gordon** below to send a direct note.",
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [
      loading,
      effectiveComfort,
      currentExerciseName,
      nasmOptPhase,
      athleteName,
      goal,
      currentWorkoutFocus,
      expressActive,
      envId,
      deskFlags,
      recentRpeHistory,
      recentRpe,
      equipmentAccess,
      cardioEquipmentAccess,
      kineticCompensations,
      contraindicationTags,
      effectiveReadiness,
      recentSleepHours,
      lastLoggedSet,
      todayWorkoutExercises,
      messages,
    ]
  )

  useEffect(() => {
    if (isOpen && initialPrompt && autoSubmittedPromptRef.current !== initialPrompt) {
      autoSubmittedPromptRef.current = initialPrompt
      void submitQuestion(initialPrompt)
    }
  }, [isOpen, initialPrompt, submitQuestion])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleActionClick = (msgId: string, action: CoachActionRecommendation) => {
    let feedbackLabel = 'Applied to active session'
    if (action.type === 'swap_exercise' && action.targetExerciseName) {
      onApplyExerciseSwap?.(action.targetExerciseName, action.currentExerciseName)
      feedbackLabel = `Swapped to ${action.targetExerciseName}`
    } else if (action.type === 'start_timer' && action.restSeconds) {
      onStartRestTimer?.(action.restSeconds)
      feedbackLabel = `Started ${action.restSeconds}s rest timer`
    } else if (action.type === 'auto_regulate_load') {
      const pct = action.loadReductionPercent || 15
      onAutoRegulateLoad?.(pct)
      feedbackLabel = `Working load reduced ${pct}%`
    } else if (action.type === 'enable_express_mode') {
      setExpressModeActive(true)
      feedbackLabel = '20m Express Mode active'
    }
    setAppliedActions(prev => ({ ...prev, [msgId]: feedbackLabel }))
  }

  const openHumanEscalation = (
    source: 'assistant_drawer' | 'safety_override',
    prefill = ''
  ) => {
    setEscalationSource(source)
    setEscalationPrefill(prefill)
    setEscalationOpen(true)
  }

  if (!isOpen) return null

  const isCoachSupport = tierId === 'coach_support'
  const briefingId = 'dyn:pre_workout_briefing:card'
  const isBriefingSpeaking = isSpeaking && activeSpeakingId?.includes('pre_workout_briefing')

  return (
    <>
      {/* Mobile Backdrop (click-to-dismiss on < 640px while remaining non-blocking on larger screens) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[940] bg-black/55 backdrop-blur-[2px] sm:hidden"
      />

      <aside
        aria-labelledby={drawerHeadingId}
        data-testid="coach-gordon-assistant-drawer"
        className="fixed inset-y-0 right-0 z-[950] flex h-dvh w-screen max-w-full flex-col border-l border-white/10 bg-[#090A0D]/98 text-zinc-100 shadow-[-16px_0_48px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:w-[410px]"
      >
        {/* Top Bar: Coach Gordon Identity + Audio Mode + Close */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#111318] px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-amber-400/45">
              <Image
                src="/images/coach-gordon-shield-logo.jpg"
                alt="Coach Gordon"
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2
                id={drawerHeadingId}
                className="truncate text-sm font-extrabold tracking-tight text-white"
              >
                Coach Gordon AI
              </h2>
              <div className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                NASM-CPT® · Personal Trainer at Your Side
              </div>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => {
              stopVoicePlayback()
              onClose()
            }}
            aria-label="Close Coach Gordon drawer"
            className="forge-tactile-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-200 transition-colors hover:border-white/20 hover:bg-[#1D212A]"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        {/* 3-State Audio Mode Bar (`Voice + Chimes`, `Chimes Only`, `Muted`) */}
        <div className="border-b border-white/[0.07] bg-[#0D1016] px-3.5 py-2">
          <AudioModeSelector />
        </div>

        {/* Scrollable Coaching Body */}
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3.5 py-3">
          {/* Structured Context Pills (Zero Raw Camera Frames) */}
          <div
            aria-label="Active training context"
            className="flex flex-wrap gap-1.5"
          >
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              OPT™ Phase 0{nasmOptPhase}
            </span>
            <span className="rounded-full border border-white/10 bg-[#181B22] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-300">
              {envLabel}
            </span>
            {expressActive ? (
              <span className="rounded-full border border-amber-400/35 bg-amber-400/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                ⚡ 20m Express
              </span>
            ) : null}
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-sky-300">
              Readiness {effectiveReadiness}/100
            </span>
            {effectiveComfort !== null ? (
              <span className="rounded-full border border-white/10 bg-[#181B22] px-2.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-zinc-200">
                Comfort {effectiveComfort}/100
              </span>
            ) : null}
            {recentRpe !== undefined ? (
              <span className="rounded-full border border-white/10 bg-[#181B22] px-2.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-zinc-300">
                Last RPE {recentRpe}
              </span>
            ) : null}
          </div>

          {/* Deterministic Intensity / Progression Cap Notice (when active) */}
          {capStatus.intensityAutoCapped && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11.5px] leading-relaxed text-amber-100">
              <strong className="text-amber-300">Auto-Regulated Cap Active:</strong>{' '}
              {capStatus.coachExplanation}
            </div>
          )}

          {/* Safety Override & Clinical Boundary Card (when triggered) */}
          {activeSafetyBanner?.triggered && (
            <div
              role="alert"
              aria-live="assertive"
              data-testid="clinical-safety-override-card"
              className="space-y-2.5 rounded-2xl border border-rose-500/45 bg-rose-500/12 p-3.5 text-rose-50"
            >
              <div className="flex items-start gap-2">
                <ShieldAlert
                  size={18}
                  strokeWidth={1.9}
                  className="mt-0.5 shrink-0 text-rose-300"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-rose-200">
                    {activeSafetyBanner.headline}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-100">
                    {activeSafetyBanner.calmCoachMessage}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-400/25 bg-[#090A0D]/80 px-3 py-2 text-[11px] leading-relaxed text-zinc-300">
                <strong className="text-rose-200">Clinical Boundary:</strong>{' '}
                {activeSafetyBanner.clinicalDisclaimer}
              </div>

              <div className="flex flex-wrap gap-2">
                {activeSafetyBanner.replacementExercise && onApplyExerciseSwap ? (
                  <button
                    type="button"
                    onClick={() => {
                      const targetSwap = activeSafetyBanner.replacementExercise!
                      onApplyExerciseSwap(targetSwap, currentExerciseName)
                      setSafetySwapApplied(`Swapped to ${targetSwap}`)
                    }}
                    className="forge-tactile-press inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-emerald-400 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-zinc-950"
                  >
                    Switch to {activeSafetyBanner.replacementExercise}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    openHumanEscalation(
                      'safety_override',
                      `Safety check-in on ${currentExerciseName || activeSafetyBanner.detectedJointArea}: ${activeSafetyBanner.headline}`
                    )
                  }
                  className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-300/40 bg-[#181B22] px-3 py-2 text-xs font-bold text-white hover:bg-[#1D212A]"
                >
                  <AlertTriangle size={13} className="text-amber-300" aria-hidden="true" />
                  <span>Message Real Coach Gordon</span>
                </button>
              </div>
              {safetySwapApplied ? (
                <div
                  data-testid="safety-swap-applied-badge"
                  className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10.5px] font-bold text-emerald-200"
                >
                  ✓ {safetySwapApplied}
                </div>
              ) : null}
            </div>
          )}

          {/* Pre-Workout Personal Briefing Card (Moment #1) */}
          <div
            data-testid="pre-workout-briefing-card"
            className="rounded-2xl border border-emerald-500/25 bg-[#111318] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                <Sparkles size={12} strokeWidth={1.8} aria-hidden="true" />
                Today’s Personal Briefing
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isBriefingSpeaking) {
                    stopVoicePlayback()
                  } else {
                    void speakDynamicText(preWorkoutBriefingText, {
                      id: briefingId,
                      moment: 'pre_workout_briefing',
                      forceUnlockVoiceOnTap: true,
                    })
                  }
                }}
                data-testid="listen-preworkout-briefing-btn"
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-3 py-1.5 text-[11px] font-bold text-emerald-200 transition-colors hover:bg-emerald-500/20"
              >
                {isBriefingSpeaking ? (
                  <>
                    <Square size={12} strokeWidth={2} aria-hidden="true" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={13} strokeWidth={1.85} aria-hidden="true" />
                    <span>Listen to Coach Gordon</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-200">
              {preWorkoutBriefingText}
            </p>
          </div>

          {/* Quick Prompts */}
          <div>
            <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              1-Tap Coaching Prompts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(currentExerciseName
                ? [`Swap ${currentExerciseName} (equipment taken)`, ...DEFAULT_QUICK_PROMPTS]
                : DEFAULT_QUICK_PROMPTS
              ).map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  disabled={loading}
                  onClick={() => void submitQuestion(prompt)}
                  className="forge-tactile-press min-h-[44px] rounded-xl border border-white/10 bg-[#181B22] px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:border-emerald-400/40 hover:bg-[#1D212A] hover:text-white disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Thread */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={loading}
            className="space-y-3 pt-1"
          >
            {messages.map(msg => {
              const speakJobId = `dyn:on_demand_chat:${msg.id}`
              const isMsgSpeaking = isSpeaking && activeSpeakingId === speakJobId
              const appliedLabel = appliedActions[msg.id]
              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-6 border border-emerald-500/30 bg-emerald-500/12 text-white'
                      : 'mr-2 border border-white/10 bg-[#141821] text-zinc-200'
                  }`}
                >
                  <div>{renderFormattedCoachText(msg.text)}</div>

                  {msg.role === 'assistant' &&
                    ((msg.ragCitations && msg.ragCitations.length > 0) ||
                      (msg.relevantCurriculums && msg.relevantCurriculums.length > 0)) && (
                      <div
                        data-testid="coach-rag-citations"
                        className="mt-2.5 rounded-xl border border-white/[0.06] bg-[#0B0D12]/90 px-2.5 py-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <BookOpen
                            size={11}
                            strokeWidth={1.85}
                            className="shrink-0 text-emerald-400"
                            aria-hidden="true"
                          />
                          <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.11em] text-zinc-400">
                            Coaching Focus
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(msg.ragCitations && msg.ragCitations.length > 0
                            ? msg.ragCitations.slice(0, 3).map(c => ({
                                key: c.id,
                                label: c.title.replace(/^NASM\s+/i, ''),
                              }))
                            : (msg.relevantCurriculums || []).slice(0, 3).map(title => ({
                                key: title,
                                label: title.replace(/^NASM\s+/i, ''),
                              }))
                          ).map(pill => (
                            <span
                              key={pill.key}
                              className="inline-flex max-w-full items-center truncate rounded-lg border border-white/[0.08] bg-[#141821] px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-300"
                            >
                              {pill.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {msg.role === 'assistant' && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-2.5">
                      {/* On-Demand Chat Playback ("Listen to Coach Gordon" — Moment #4) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isMsgSpeaking) {
                            stopVoicePlayback()
                          } else {
                            void speakDynamicText(msg.spokenText || msg.text, {
                              id: speakJobId,
                              moment: 'on_demand_chat',
                              forceUnlockVoiceOnTap: true,
                            })
                          }
                        }}
                        data-testid="listen-to-coach-gordon-btn"
                        className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition-colors hover:border-emerald-400/40 hover:bg-[#1D212A]"
                      >
                        {isMsgSpeaking ? (
                          <>
                            <Square size={12} strokeWidth={2} aria-hidden="true" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={13} strokeWidth={1.85} aria-hidden="true" />
                            <span>Listen to Coach Gordon</span>
                          </>
                        )}
                      </button>

                      {msg.recommendedAction ? (
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.id, msg.recommendedAction!)}
                          data-testid="coach-recommended-action-btn"
                          className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-1.5 text-[11px] font-extrabold text-zinc-950 transition-colors hover:bg-emerald-300"
                        >
                          <Zap size={12} strokeWidth={2} aria-hidden="true" />
                          <span>{msg.recommendedAction.buttonText}</span>
                        </button>
                      ) : null}

                      {appliedLabel ? (
                        <span
                          data-testid="coach-action-applied-badge"
                          className="inline-flex items-center rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10.5px] font-bold text-emerald-200"
                        >
                          ✓ {appliedLabel}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.slice(0, 2).map(follow => (
                        <button
                          key={follow}
                          type="button"
                          onClick={() => {
                            if (follow.toLowerCase().includes('message') && follow.toLowerCase().includes('coach')) {
                              openHumanEscalation('assistant_drawer', msg.text.slice(0, 120))
                            } else {
                              void submitQuestion(follow)
                            }
                          }}
                          className="min-h-[44px] rounded-xl border border-white/10 bg-[#090A0D] px-3 py-2 text-left text-[11px] font-medium text-zinc-300 hover:border-white/20 hover:text-white"
                        >
                          {follow}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {loading ? (
              <div
                aria-hidden="true"
                className="rounded-2xl border border-white/10 bg-[#141821] px-3.5 py-3 text-xs text-zinc-400"
              >
                Coach Gordon is reviewing your Phase 0{nasmOptPhase} metrics…
              </div>
            ) : null}

            <div ref={scrollEndRef} />
          </div>
        </div>

        {/* Bottom Composer + Persistent Tier-Aware "Message Real Coach Gordon" Action */}
        <div
          className="border-t border-white/10 bg-[#111318] p-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <form
            onSubmit={e => {
              e.preventDefault()
              void submitQuestion(inputValue)
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor={chatInputId} className="sr-only">
              Ask Coach Gordon a training question
            </label>
            <input
              id={chatInputId}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about form, comfort swaps, equipment, or tempo…"
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/12 bg-[#181B22] px-3.5 py-2 text-base text-white placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              aria-label="Send question to Coach Gordon AI"
              className="forge-tactile-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-zinc-950 transition-colors hover:bg-emerald-300 disabled:opacity-45"
            >
              <Send size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => openHumanEscalation('assistant_drawer', inputValue)}
            data-testid="drawer-message-real-coach-btn"
            className="forge-tactile-press mt-2 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-[#181B22] px-3.5 py-2 text-left text-xs font-bold text-zinc-100 transition-colors hover:border-emerald-400/50 hover:bg-[#1D212A]"
          >
            <span className="inline-flex items-center gap-2">
              {isCoachSupport ? (
                <Smartphone size={14} strokeWidth={1.85} className="text-amber-300" aria-hidden="true" />
              ) : (
                <Mail size={14} strokeWidth={1.85} className="text-emerald-300" aria-hidden="true" />
              )}
              <span>Message Real Coach Gordon</span>
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              {isCoachSupport
                ? 'SMS + 24h SLA'
                : tierId === 'plus'
                  ? '1d Email'
                  : '24–48h Email'}
            </span>
          </button>
        </div>
      </aside>

      <CoachEscalationModal
        open={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        sourceContext={escalationSource}
        initialQuestion={escalationPrefill}
        telemetryOverride={{
          optPhase: nasmOptPhase,
          jointComfortScore: effectiveComfort,
          readinessIndex: effectiveReadiness,
          postureFlags: deskFlags.map(f => f.replace(/_/g, ' ')),
          environmentProfile: envId,
          expressModeActive: expressActive,
          activeExercise: currentExerciseName ?? null,
          safetyFlagActive: Boolean(activeSafetyBanner?.triggered),
        }}
      />
    </>
  )
}
