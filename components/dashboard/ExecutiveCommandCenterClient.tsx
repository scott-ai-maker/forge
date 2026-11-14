'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Monitor,
  Plane,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Video,
  X,
  Zap,
} from 'lucide-react'
import GaaIcon from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import type { DashboardWorkspace } from '@/lib/validation'
import { getMembershipDisplayName } from '@/lib/forge-memberships'
import type { DossierMetrics } from '@/lib/sunday-dossier-engine'
import { generateIcsCalendar, downloadIcsFile } from '@/lib/calendar-sync'
import DeskErgonomicsAudit from '@/components/fitness/DeskErgonomicsAudit'
import DeskResetModal, { DeskResetSlotCard } from '@/components/fitness/DeskResetModal'
import JointComfortScoreStrip from '@/components/fitness/JointComfortScoreStrip'
import PostureComparisonCard from '@/components/fitness/PostureComparisonCard'
import OptPhaseRoadmap from '@/components/fitness/OptPhaseRoadmap'
import PartnerPassModal from '@/components/referrals/PartnerPassModal'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'
import TierPreviewSwitcher from '@/components/settings/TierPreviewSwitcher'
import { usePartnerPass } from '@/lib/partner-pass'
import {
  ENVIRONMENT_PROFILE_META,
  EnvironmentProfileId,
  ErgonomicFlag,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  recordEnvironmentSelection,
  setExpressModeActive,
} from '@/lib/posture-profile-state'
import {
  getUpgradeTriggerCopy,
  UpgradeTriggerId,
  useTierAccess,
} from '@/lib/tierEntitlements'

export interface ExecutiveCommandCenterClientProps {
  clientName: string
  activePackage: { package_name: string } | null
  currentPlanPhase: string
  currentGoal: string
  isWorkoutInProgress: boolean
  isWorkoutCompleted: boolean
  activeWorkout: {
    day: number
    focus: string
    scheduledDate?: string | null
    exercises?: Array<{ name: string; sets?: string | number; reps?: string | number }>
  } | null
  activeDayLoggedWorkingSets: number
  activeDayTotalTargetSets: number
  activeDayExerciseCount: number
  totalVolumeMovedLbs: number
  activeWorkoutDurationMins?: number
  latestPlan: { nasm_opt_phase?: number; phase_name?: string; estimated_duration_mins?: number } | null
  needsOnboarding?: boolean
  isOnboardingCompleted?: boolean
  isOnboardingStarted?: boolean
  dossier: DossierMetrics
  packages: Array<{
    id: string
    package_name: string
    purchased_at: string
    sessions_remaining: number
    sessions_total: number
    expires_at?: string | null
  }>
  sessions: Array<{
    id: string
    scheduled_at: string
    duration_mins?: number | null
    notes?: string | null
    status?: string | null
  }>
  totalRemaining: number
  initialWorkspace?: DashboardWorkspace
  activeLiveSessionHref?: string | null
}

export interface BaselineOnboardingBannerState {
  shouldShowBanner: boolean
  eyebrow: string
  title: string
  description: string
  buttonText: string
  href: string
}

export function getBaselineOnboardingBannerState(params: {
  isOnboardingCompleted?: boolean
  needsOnboarding?: boolean
  isOnboardingStarted?: boolean
  hasLocalDraft?: boolean
}): BaselineOnboardingBannerState | null {
  const isComplete = params.isOnboardingCompleted ?? !params.needsOnboarding
  if (isComplete) {
    return null
  }

  const isStarted = Boolean(params.isOnboardingStarted || params.hasLocalDraft)
  return {
    shouldShowBanner: true,
    eyebrow: isStarted ? 'In Progress · Setup Saved' : 'Action Required · Baseline Assessment',
    title: isStarted ? 'CONTINUE YOUR BASELINE FITNESS SETUP' : 'COMPLETE YOUR BASELINE FITNESS SETUP',
    description: isStarted
      ? 'Pick up where you left off to calibrate your NASM OPT periodization program.'
      : 'Provide your baseline vitals to calibrate your NASM OPT periodization program.',
    buttonText: isStarted ? 'Continue Setup →' : 'Start Setup →',
    href: '/dashboard/onboarding',
  }
}

const ENVIRONMENT_OPTIONS: EnvironmentProfileId[] = [
  'home_gym',
  'full_gym',
  'hotel_travel',
  'bodyweight_only',
]

export default function ExecutiveCommandCenterClient({
  clientName,
  activePackage,
  currentPlanPhase,
  currentGoal: _currentGoal,
  isWorkoutInProgress,
  isWorkoutCompleted,
  activeWorkout,
  activeDayLoggedWorkingSets,
  activeDayTotalTargetSets,
  activeDayExerciseCount,
  activeWorkoutDurationMins,
  totalVolumeMovedLbs,
  latestPlan,
  needsOnboarding = false,
  isOnboardingCompleted,
  isOnboardingStarted = false,
  dossier,
  packages: _packages,
  sessions,
  totalRemaining,
  activeLiveSessionHref,
}: ExecutiveCommandCenterClientProps) {
  const [hasLocalDraft, setHasLocalDraft] = useState(false)
  const [expressMode, setExpressMode] = useState(false)
  const [environmentProfile, setEnvironmentProfile] = useState<EnvironmentProfileId>('home_gym')

  // Modal states
  const [deskAuditOpen, setDeskAuditOpen] = useState(false)
  const [deskResetOpen, setDeskResetOpen] = useState(false)
  const [deskResetFlags, setDeskResetFlags] = useState<ErgonomicFlag[] | undefined>(undefined)
  const [postureCheckOpen, setPostureCheckOpen] = useState(false)
  const [partnerPassOpen, setPartnerPassOpen] = useState(false)
  const [upgradeTrigger, setUpgradeTrigger] = useState<UpgradeTriggerId | null>(null)

  const deskAuditDialogRef = useRef<HTMLDialogElement | null>(null)
  const deskAuditHeadingId = useId()

  const { tierId, entitlements, remainingFormLabCredits, shouldShowTrigger } = useTierAccess()
  const { tileStatusLabel: partnerPassStatusLabel } = usePartnerPass(clientName)

  useEffect(() => {
    try {
      const draft =
        typeof window !== 'undefined'
          ? localStorage.getItem('gaa_baseline_onboarding_draft')
          : null
      if (draft) setHasLocalDraft(true)
    } catch {
      // ignore
    }

    const sync = () => {
      const state = loadPostureProfileState()
      setExpressMode(state.expressModeActive)
      setEnvironmentProfile(state.environmentProfile)
    }
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [])

  useEffect(() => {
    const dialog = deskAuditDialogRef.current
    if (!dialog) return
    if (deskAuditOpen && !dialog.open) {
      dialog.showModal()
    } else if (!deskAuditOpen && dialog.open) {
      dialog.close()
    }
  }, [deskAuditOpen])

  const onboardingBannerState = getBaselineOnboardingBannerState({
    isOnboardingCompleted,
    needsOnboarding,
    isOnboardingStarted,
    hasLocalDraft,
  })

  const nextSession =
    sessions && sessions.length > 0
      ? sessions.find(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date()) ||
        sessions[0]
      : null

  const promoteDeskResetToHero = !activeWorkout || isWorkoutCompleted
  const estimatedMins = expressMode
    ? 20
    : activeWorkoutDurationMins || latestPlan?.estimated_duration_mins || 45

  const handleToggleExpress = () => {
    const next = !expressMode
    setExpressMode(next)
    setExpressModeActive(next)
    triggerHaptic('tap')
  }

  const handleEnvironmentChange = (nextEnv: EnvironmentProfileId) => {
    setEnvironmentProfile(nextEnv)
    const { triggeredConsecutiveTravel } = recordEnvironmentSelection(nextEnv)
    if (
      triggeredConsecutiveTravel &&
      !entitlements.multiDayTravelPass &&
      shouldShowTrigger('consecutive_travel_swaps')
    ) {
      setUpgradeTrigger('consecutive_travel_swaps')
    }
  }

  const handleScheduleMultiDayTrip = () => {
    if (!entitlements.multiDayTravelPass) {
      setUpgradeTrigger('consecutive_travel_swaps')
      return
    }
    setEnvironmentProfile('hotel_travel')
    recordEnvironmentSelection('hotel_travel')
  }

  const postScanCopy = getUpgradeTriggerCopy('post_scan_flag', tierId)

  const TodayWorkoutHeroCard = (
    <section
      aria-label="Today's Workout"
      className="rounded-2xl border border-white/[0.09] bg-[#111318] p-4 text-zinc-100 sm:p-6"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.08), transparent 65%), radial-gradient(ellipse at bottom right, rgba(245, 158, 11, 0.08), transparent 65%)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 18px 42px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Top Row: Eyebrow + 20m Express + Environment Profile Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          <GaaIcon name="barbell" size={14} tone="gold" />
          Today&apos;s Workout
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-pressed={expressMode}
            onClick={handleToggleExpress}
            className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 ${
              expressMode
                ? 'border border-amber-400/50 bg-amber-400 text-[#090A0D] shadow-[0_0_16px_rgba(251,191,36,0.25)]'
                : 'border border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
            }`}
          >
            <Zap size={12} strokeWidth={1.75} aria-hidden="true" /> 20m Express
          </button>

          <select
            value={environmentProfile}
            onChange={e => handleEnvironmentChange(e.target.value as EnvironmentProfileId)}
            aria-label="Training environment profile"
            style={{ fontSize: 16 }}
            className="min-h-[44px] rounded-full border border-white/10 bg-[#181B22] px-3 text-xs font-bold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A]"
          >
            {ENVIRONMENT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {ENVIRONMENT_PROFILE_META[opt].shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle Row: Focus Title & Compact Meta */}
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <h1 className="min-w-0 font-serif text-lg font-bold tracking-tight text-white sm:text-xl">
          {activeWorkout
            ? `Day ${activeWorkout.day}: ${activeWorkout.focus}`
            : 'Full-Body Joint-First Strength'}
        </h1>
        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-zinc-300">
          {activeDayExerciseCount || 5} lifts · ~{estimatedMins}m
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="min-w-0 truncate">
          {currentPlanPhase}
          {activePackage ? ` · ${getMembershipDisplayName(activePackage.package_name)}` : ''}
        </span>
        <button
          type="button"
          onClick={handleScheduleMultiDayTrip}
          className="forge-tactile-press inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-semibold text-sky-300 hover:bg-white/[0.04] hover:underline"
        >
          <Plane size={12} strokeWidth={1.75} aria-hidden="true" /> Schedule Multi-Day Trip
        </button>
      </div>

      {/* Primary Start Workout CTA -> Opens Pre-Workout Overview w/ Readiness Check */}
      <Link
        href="/dashboard/fitness?workspace=train&startWorkout=1"
        onClick={() => triggerHaptic('tap')}
        className="forge-tactile-press mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#090A0D] shadow-[0_8px_24px_rgba(52,211,153,0.22)] transition-colors duration-150 hover:bg-emerald-300"
      >
        <span className="tabular-nums">
          {isWorkoutInProgress
            ? `Resume Workout (${activeDayLoggedWorkingSets}/${activeDayTotalTargetSets || '-'})`
            : 'Start Workout'}
        </span>
        <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </section>
  )

  return (
    <div
      className="flex flex-col gap-3 pb-24"
      style={{
        containerType: 'inline-size',
        paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Active Live Studio Alert (only when coach is live) */}
      {activeLiveSessionHref ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400 bg-emerald-500/15 px-3 py-2 text-slate-100">
          <div className="min-w-0 text-xs font-bold text-emerald-200">
            Live Studio Active · Coach Gordon is ready
          </div>
          <Link
            href={activeLiveSessionHref}
            className="shrink-0 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-extrabold uppercase text-slate-950"
          >
            Join →
          </Link>
        </div>
      ) : null}

      {/* Tier 1: Above-the-Fold Hero (<=230px on 375px) + Dynamic Rest-Day Slot */}
      {promoteDeskResetToHero ? (
        <>
          <DeskResetSlotCard
            promotedHero
            onLaunchReset={() => {
              setDeskResetFlags(undefined)
              setDeskResetOpen(true)
            }}
          />
          <JointComfortScoreStrip />
          {activeWorkout && isWorkoutCompleted ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-slate-100">
              <span>
                <strong className="text-emerald-300">✓ Day {activeWorkout.day} Complete</strong>
                {totalVolumeMovedLbs > 0 ? ` · ${totalVolumeMovedLbs.toLocaleString()} lbs` : ''}
              </span>
              <Link
                href="/dashboard/fitness?workspace=train"
                className="font-bold text-emerald-300 hover:underline"
              >
                Summary →
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {TodayWorkoutHeroCard}
          {/* Immediately followed by Collapsible 1-Row Joint Comfort Score Strip */}
          <JointComfortScoreStrip />
          {/* Compact Horizontal Desk Reset Banner on Active Pre-Workout Days */}
          <DeskResetSlotCard
            promotedHero={false}
            onLaunchReset={() => {
              setDeskResetFlags(undefined)
              setDeskResetOpen(true)
            }}
          />
        </>
      )}

      {/* Optional Baseline Setup Banner */}
      {onboardingBannerState ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3.5 py-2.5 text-slate-100">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
              {onboardingBannerState.eyebrow}
            </div>
            <div className="truncate text-xs font-bold text-white">
              {onboardingBannerState.title}
            </div>
          </div>
          <Link
            href={onboardingBannerState.href}
            className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-slate-950"
          >
            {onboardingBannerState.buttonText}
          </Link>
        </div>
      ) : null}

      {/* Tier 2: Static Posture Delta Summary Card (Tapping opens Full-Screen Touch Modal) */}
      <PostureComparisonCard
        externalModalOpen={postureCheckOpen}
        onExternalModalClose={() => setPostureCheckOpen(false)}
      />

      {/* Tier 3: Horizontal Snap-Scroll 5-Phase OPT Roadmap (min-w-[132px] per node) */}
      <OptPhaseRoadmap
        activePhaseNumber={latestPlan?.nasm_opt_phase || 2}
        unlockedThroughPhase={Math.max(2, latestPlan?.nasm_opt_phase || 2)}
      />

      {/* Tier 4: Quick Utility Tiles in grid-cols-2 gap-3 */}
      <section aria-label="Quick Diagnostic & Partner Tools">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Quick Tools &amp; Diagnostics
          </span>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            {entitlements.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tile 1: Desk Ergonomics Audit */}
          <button
            type="button"
            onClick={() => setDeskAuditOpen(true)}
            className="forge-tactile-press flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 hover:border-white/15 hover:bg-[#181B22]"
          >
            <Monitor size={19} strokeWidth={1.75} className="text-emerald-300" aria-hidden="true" />
            <div className="mt-2.5 min-w-0 w-full">
              <div className="truncate text-xs font-bold text-white">Desk Ergonomics Audit</div>
              <div className="truncate text-[11px] text-zinc-400">
                Seated angle scan &amp; 3 fixes
              </div>
            </div>
          </button>

          {/* Tile 2: 2-Min Posture Check */}
          <button
            type="button"
            onClick={() => setPostureCheckOpen(true)}
            className="forge-tactile-press flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 hover:border-white/15 hover:bg-[#181B22]"
          >
            <ScanLine size={19} strokeWidth={1.75} className="text-amber-300" aria-hidden="true" />
            <div className="mt-2.5 min-w-0 w-full">
              <div className="truncate text-xs font-bold text-white">2-Min Posture Check</div>
              <div className="truncate text-[11px] text-zinc-400">
                33-point AI delta overlay
              </div>
            </div>
          </button>

          {/* Tile 3: Founding Partner Pass (Live Status + Metallic Credential Sheen) */}
          <button
            type="button"
            onClick={() => setPartnerPassOpen(true)}
            className="forge-metallic-pass forge-tactile-press flex min-h-[88px] flex-col items-start justify-between rounded-2xl p-4 text-left transition-colors duration-150 hover:border-amber-400/60"
          >
            <ShieldCheck size={19} strokeWidth={1.75} className="text-amber-300" aria-hidden="true" />
            <div className="mt-2.5 min-w-0 w-full">
              <div className="truncate text-xs font-bold text-white">Founding Partner Pass</div>
              <div className="truncate text-[11px] font-semibold text-amber-200">
                {partnerPassStatusLabel}
              </div>
            </div>
          </button>

          {/* Tile 4: Form Lab Video Critique */}
          <Link
            href="/dashboard/fitness?workspace=video"
            className="forge-tactile-press flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 hover:border-white/15 hover:bg-[#181B22]"
          >
            <Video size={19} strokeWidth={1.75} className="text-sky-300" aria-hidden="true" />
            <div className="mt-2.5 min-w-0 w-full">
              <div className="truncate text-xs font-bold text-white">Form Lab Critique</div>
              <div className="truncate text-[11px] tabular-nums text-zinc-400">
                {remainingFormLabCredits} monthly {remainingFormLabCredits === 1 ? 'credit' : 'credits'} left
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Compact Weekly Telemetry & 1:1 Coaching Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            <span>7-Day Volume &amp; Readiness</span>
            <Link href="/dashboard/fitness?workspace=progress" className="text-emerald-300 hover:underline">
              Progress →
            </Link>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-400">Volume</span>
              <span className="font-mono font-bold tabular-nums text-amber-300">
                {dossier.totalTonnageLbs.toLocaleString()} lb
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-400">ACWR</span>
              <span className="font-mono font-bold tabular-nums text-emerald-300">
                {dossier.acwrRatio !== null && dossier.acwrRatio !== undefined
                  ? dossier.acwrRatio.toFixed(2)
                  : '—'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-400">PRs</span>
              <span className="font-mono font-bold tabular-nums text-sky-300">
                {dossier.topPrsThisWeek.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-emerald-500/25 bg-[#111318] p-4 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            <span>{nextSession ? 'Upcoming 1:1 Session' : 'Live Studio Coaching'}</span>
            <span className="tabular-nums">{totalRemaining > 0 ? `${totalRemaining} Credits` : 'Studio Ready'}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-300" suppressHydrationWarning>
            <span className="truncate">
              {nextSession
                ? new Date(nextSession.scheduled_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : '1-on-1 Coach Gordon Studio ($180/session)'}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href="/dashboard/live"
                className="forge-tactile-press inline-flex min-h-[38px] items-center rounded-xl bg-emerald-400 px-3 py-1.5 text-[11px] font-extrabold text-[#090A0D] transition-colors hover:bg-emerald-300"
              >
                Studio →
              </Link>
              {nextSession ? (
                <button
                  type="button"
                  onClick={() => {
                    const ics = generateIcsCalendar({
                      title: 'Forge Athletic: Live 1-on-1 Studio Session w/ Coach Gordon',
                      startTime: nextSession.scheduled_at,
                      durationMins: nextSession.duration_mins || 60,
                      location: 'https://forge-athletic.app/dashboard/live',
                    })
                    downloadIcsFile('forge-live-session', ics)
                  }}
                  className="forge-tactile-press inline-flex min-h-[38px] items-center rounded-xl border border-white/15 bg-[#181B22] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1D212A]"
                >
                  +ICS
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Compact QA Tier Switcher */}
      <TierPreviewSwitcher compact />

      {/* Desk Ergonomics Audit Modal (with Trigger 1 Post-Scan & Trigger 2 Second Workstation Gate) */}
      <dialog
        ref={deskAuditDialogRef}
        aria-labelledby={deskAuditHeadingId}
        onClose={() => setDeskAuditOpen(false)}
        onClick={e => {
          if (e.target === e.currentTarget) setDeskAuditOpen(false)
        }}
        className="forge-glass-modal m-0 h-dvh max-h-dvh w-screen max-w-none overscroll-contain p-0 text-zinc-100 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(95vw,760px)] sm:rounded-2xl"
      >
        <div className="max-h-dvh overflow-y-auto overscroll-contain p-4 sm:max-h-[90dvh] sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                33-Point Workstation Diagnostics
              </div>
              <h2 id={deskAuditHeadingId} className="font-serif text-lg font-bold tracking-tight text-white">
                Desk Ergonomics Camera Audit
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setDeskAuditOpen(false)}
              aria-label="Close Desk Ergonomics Audit"
              className="forge-tactile-press inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A]"
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <DeskErgonomicsAudit
            maxSavedProfiles={entitlements.maxWorkstationProfiles}
            onUpgradeWorkstationLimit={() => {
              setDeskAuditOpen(false)
              setUpgradeTrigger('second_workstation_audit')
            }}
            onLaunchDeskReset={flags => {
              setDeskAuditOpen(false)
              setDeskResetFlags(flags)
              setDeskResetOpen(true)
            }}
            renderPostScanBanner={result => {
              if (
                result.overallStrain === 'optimal' ||
                !shouldShowTrigger('post_scan_flag')
              ) {
                return null
              }
              return (
                <div className="mt-3 flex flex-col justify-between gap-2.5 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-slate-100 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-2 text-xs text-amber-100">
                    <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-300" />
                    <span>{postScanCopy.bannerCopy}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeskAuditOpen(false)
                      setUpgradeTrigger('post_scan_flag')
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-950"
                  >
                    Upgrade to Plus <ArrowUpRight size={13} />
                  </button>
                </div>
              )
            }}
          />
        </div>
      </dialog>

      {/* Targeted 5-Min Desk Reset Modal */}
      <DeskResetModal
        open={deskResetOpen}
        onClose={() => setDeskResetOpen(false)}
        overrideFlags={deskResetFlags}
      />

      {/* Founding Partner Pass Share Modal */}
      <PartnerPassModal
        open={partnerPassOpen}
        onClose={() => setPartnerPassOpen(false)}
        memberName={clientName}
      />

      {/* Contextual Tier Upgrade Modal */}
      <TierUpgradeModal
        open={upgradeTrigger !== null}
        triggerContext={upgradeTrigger}
        currentTier={tierId}
        onClose={() => setUpgradeTrigger(null)}
      />
    </div>
  )
}
