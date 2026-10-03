'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import type { DashboardWorkspace } from '@/lib/validation'
import PrescribedToolboxBanner from '@/components/fitness/PrescribedToolboxBanner'
import type { DossierMetrics } from '@/lib/sunday-dossier-engine'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'

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
  packages: Array<{ id: string; package_name: string; purchased_at: string; sessions_remaining: number; sessions_total: number; expires_at?: string | null }>
  sessions: Array<{ id: string; scheduled_at: string; duration_mins?: number | null; notes?: string | null; status?: string | null }>
  totalRemaining: number
  initialWorkspace?: DashboardWorkspace
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
}: ExecutiveCommandCenterClientProps) {
  const [hasLocalDraft, setHasLocalDraft] = useState(false)

  useEffect(() => {
    try {
      const draft = typeof window !== 'undefined' ? localStorage.getItem('gaa_baseline_onboarding_draft') : null
      if (draft) {
        setHasLocalDraft(true)
      }
    } catch {
      // ignore storage check errors
    }
  }, [])

  const onboardingBannerState = getBaselineOnboardingBannerState({
    isOnboardingCompleted,
    needsOnboarding,
    isOnboardingStarted,
    hasLocalDraft,
  })

  const nextSession = sessions && sessions.length > 0
    ? sessions.find(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date()) || sessions[0]
    : null

  const initials = clientName
    .split(/\s+/)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('') || 'SG'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── 0. Baseline Onboarding Banner ── */}
      {onboardingBannerState && (
        <div
          style={{
            background: onboardingBannerState.title.startsWith('CONTINUE')
              ? 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(14,23,36,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(14,23,36,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.5)',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              {onboardingBannerState.eyebrow}
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 17, color: '#FFFFFF', margin: '2px 0 0', letterSpacing: '0.04em' }}>
              {onboardingBannerState.title}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--gray)' }}>
              {onboardingBannerState.description}
            </p>
          </div>
          <Link
            href={onboardingBannerState.href}
            className="sgf-button sgf-button-primary"
            style={{ padding: '8px 16px', fontSize: 12, textDecoration: 'none' }}
          >
            {onboardingBannerState.buttonText}
          </Link>
        </div>
      )}

      {/* ── 1. Executive Athlete Hero Telemetry Ribbon ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16,22,38,0.95) 0%, rgba(9,13,24,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12,
          padding: 'clamp(14px, 2.2vw, 20px) clamp(16px, 2.8vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 19,
              color: '#0A0E18',
              fontWeight: 800,
              boxShadow: '0 0 15px rgba(212,160,23,0.4)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 'clamp(20px, 3.2vw, 26px)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em', lineHeight: 1.1 }}>
                {clientName}
              </h1>
              <span
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 800,
                  background: 'rgba(212,160,23,0.15)',
                  color: 'var(--gold-lt)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: '1px solid rgba(212,160,23,0.4)',
                }}
              >
                VIP Athlete
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activePackage ? activePackage.package_name : 'Executive Performance Member'} · {currentPlanPhase}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/fitness?workspace=train"
            className="sgf-button sgf-button-primary"
            style={{ padding: '8px 18px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            onClick={() => triggerHaptic('tap')}
          >
            <GaaIcon name="barbell" size={14} tone="inherit" />
            <span>
              {isWorkoutInProgress
                ? `Resume Day ${activeWorkout?.day || 1} Lifts`
                : isWorkoutCompleted
                  ? `Day ${activeWorkout?.day || 1} Complete · View Lab`
                  : activeWorkout
                    ? `Start Day ${activeWorkout.day} Lifts`
                    : 'Open Fitness Lab'}
            </span>
          </Link>
          <Link
            href="/dashboard/messages"
            className="tactile-btn"
            style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 6,
              color: 'var(--white)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => triggerHaptic('tap')}
          >
            <GaaIcon name="message" size={13} tone="gold" />
            <span>Concierge Line</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Today's Primary Training Mission (Hero Action Card) ── */}
      <Link
        href="/dashboard/fitness?workspace=train"
        className="tactile-btn luxury-card-interactive"
        style={{
          background: isWorkoutCompleted
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(8, 14, 24, 0.95) 100%)'
            : isWorkoutInProgress
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(8, 14, 24, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(212, 160, 23, 0.12) 0%, rgba(8, 14, 24, 0.95) 100%)',
          border: isWorkoutCompleted
            ? '1.5px solid rgba(52, 211, 153, 0.55)'
            : isWorkoutInProgress
              ? '1.5px solid rgba(245, 158, 11, 0.65)'
              : '1.5px solid rgba(197, 160, 89, 0.45)',
          borderRadius: 12,
          padding: '18px 20px',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: isWorkoutCompleted
            ? '0 0 20px rgba(16, 185, 129, 0.2)'
            : isWorkoutInProgress
              ? '0 0 20px rgba(245, 158, 11, 0.25)'
              : '0 0 20px rgba(197, 160, 89, 0.2)',
        }}
        onClick={() => triggerHaptic('tap')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="barbell" size={20} tone={isWorkoutCompleted ? 'emerald' : isWorkoutInProgress ? 'amber' : 'gold'} />
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isWorkoutCompleted ? '#34D399' : 'var(--gold-lt)' }}>
              Primary Training Target
            </span>
          </div>
          {isWorkoutCompleted ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#10B981', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '2px 8px', borderRadius: 4 }}>
              ✓ DAY {activeWorkout?.day || 1} COMPLETED
            </span>
          ) : isWorkoutInProgress ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: 4 }}>
              IN PROGRESS ({activeDayLoggedWorkingSets}/{activeDayTotalTargetSets || '-'} SETS)
            </span>
          ) : activeWorkout ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#080E14', background: 'var(--gold-lt)', padding: '2px 8px', borderRadius: 4 }}>
              TODAY&apos;S TARGET · DAY {activeWorkout.day}
            </span>
          ) : (
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gray)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
              TRAIN
            </span>
          )}
        </div>

        {(() => {
          const leadExerciseName = activeWorkout?.exercises?.[0]?.name
          const leadExerciseImg = leadExerciseName ? resolveGaaExerciseImage(leadExerciseName, true) || BRAND_LOGO_FALLBACK_IMAGE : null
          return (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {leadExerciseImg && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'relative',
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#070B14',
                    border: '1px solid rgba(212,160,23,0.35)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <img
                    src={leadExerciseImg}
                    alt={leadExerciseName || 'Exercise'}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 19, color: '#FFFFFF', letterSpacing: '0.04em', lineHeight: 1.25, fontWeight: 700 }}>
                  {activeWorkout ? `DAY ${activeWorkout.day}: ${activeWorkout.focus.toUpperCase()}` : 'PERIODIZED WORKOUT COMMAND'}
                </div>
                <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4, marginTop: 4 }}>
                  {activeWorkout ? (
                    isWorkoutCompleted ? (
                      totalVolumeMovedLbs > 0
                        ? `Session recorded · Moved ${totalVolumeMovedLbs.toLocaleString()} lbs total volume across ${activeDayLoggedWorkingSets} working sets.`
                        : `Session recorded · ${activeDayExerciseCount} exercises completed.`
                    ) : (
                      `${activeDayExerciseCount} prescribed exercises · ~${activeWorkoutDurationMins || latestPlan?.estimated_duration_mins || 75}m duration.`
                    )
                  ) : (
                    'Personalized 5-Phase NASM OPT™ lifts, verified technique guides, and auto-rest timers.'
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        <div style={{ fontSize: 12, color: isWorkoutCompleted ? '#34D399' : 'var(--gold-lt)', fontWeight: 800, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
          {isWorkoutCompleted
            ? `Review Day ${activeWorkout?.day || 1} Summary →`
            : isWorkoutInProgress
              ? `Resume Day ${activeWorkout?.day || 1} Lifts (${activeDayLoggedWorkingSets}/${activeDayTotalTargetSets} Sets) →`
              : activeWorkout
                ? `Start Day ${activeWorkout.day} Lifts (${activeDayExerciseCount} Exercises) →`
                : 'Open Workout Command →'
          }
        </div>
      </Link>

      {/* ── 3. Executive Intelligence Grid (Dossier & Consultations) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 14 }}>
        {/* Card A: Sunday Intelligence Dossier Briefing */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(13,27,42,0.95) 0%, rgba(9,15,26,0.98) 100%)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="shield" size={12} tone="gold" />
                <span>Executive Dossier</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--gray)' }}>Sovereign Record</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 17, color: '#FFFFFF', margin: 0, fontWeight: 700, letterSpacing: '0.03em' }}>
              Weekly Performance Intelligence
            </h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', lineHeight: 1.4 }}>
              ACWR acute:chronic workload protection, kinetic volume balance, and resting biometric telemetry.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Weekly Vol</div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
                {dossier.totalTonnageLbs.toLocaleString()} <span style={{ fontSize: 10 }}>lbs</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>ACWR Load</div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 15, fontWeight: 700, color: dossier.acwrRatio !== null ? '#34D399' : 'var(--gray)', marginTop: 2 }}>
                {dossier.acwrRatio !== null && dossier.acwrRatio !== undefined ? dossier.acwrRatio.toFixed(2) : '—'} <span style={{ fontSize: 10 }}>{dossier.acwrZone}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Recent PRs</div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 15, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>
                {dossier.topPrsThisWeek.length}
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/dossier"
            style={{
              fontSize: 11.5,
              color: 'var(--gold-lt)',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Read Sovereign Sunday Dossier →
          </Link>
        </div>

        {/* Card B: Concierge Consultations & 1:1 Live Studio */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(13,27,42,0.95) 0%, rgba(9,15,26,0.98) 100%)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6EE7B7', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                <span>1:1 Live Studio</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 700 }}>
                {totalRemaining} {totalRemaining === 1 ? 'Credit' : 'Credits'} Available
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 17, color: '#FFFFFF', margin: 0, fontWeight: 700, letterSpacing: '0.03em' }}>
              {nextSession ? 'Upcoming Private Consultation' : 'Concierge Telehealth & Strategy'}
            </h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', lineHeight: 1.4 }}>
              {nextSession
                ? `${new Date(nextSession.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${new Date(nextSession.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : '1:1 biomechanics audit, lift technique verification, and periodization strategy with Coach Scott Gordon.'
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {nextSession ? (
              <Link
                href="/dashboard/live"
                className="tactile-btn"
                style={{
                  padding: '7px 14px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  textTransform: 'uppercase',
                  fontSize: 11.5,
                  letterSpacing: '0.06em',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Enter Live Studio →
              </Link>
            ) : totalRemaining > 0 ? (
              <Link
                href="/dashboard/book"
                className="sgf-button sgf-button-primary"
                style={{ padding: '7px 14px', fontSize: 11.5, textDecoration: 'none' }}
              >
                Book 1:1 Consultation ({totalRemaining} Left)
              </Link>
            ) : (
              <Link
                href="/dashboard/book"
                className="tactile-btn"
                style={{
                  padding: '7px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--navy-lt)',
                  borderRadius: 6,
                  color: 'var(--white)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                View Booking Calendar
              </Link>
            )}

            <Link
              href="/dashboard/messages"
              style={{
                fontSize: 11.5,
                color: 'var(--gold-lt)',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 'auto',
              }}
            >
              Message Coach →
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Prescribed Protocol Banner (If applicable) ── */}
      <PrescribedToolboxBanner toolboxId="desk_worker_posture" />

      {/* ── 5. Flagship Sports Science Diagnostics Launchpad ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
            Sports Science &amp; Diagnostics Launchpad
          </span>
          <Link
            href="/dashboard/fitness?workspace=lab"
            style={{ fontSize: 11, color: 'var(--gold-lt)', textDecoration: 'none', fontWeight: 700 }}
          >
            Open Full Lab Studio →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {/* Diagnostic 1: 3D Muscle Recovery Matrix */}
          <Link
            href="/dashboard/fitness?workspace=readiness&tab=3d"
            className="tactile-btn luxury-card-interactive"
            style={{
              background: 'rgba(8, 14, 24, 0.85)',
              border: '1.5px solid var(--gold)',
              borderRadius: 8,
              padding: '14px 16px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 0 14px rgba(197, 160, 89, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <GaaIcon name="dna" size={20} tone="gold" />
              <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080E14', background: 'var(--gold-lt)', padding: '1px 6px', borderRadius: 3 }}>
                FLAGSHIP 3D
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 15, color: 'var(--gold-lt)', letterSpacing: '0.04em', fontWeight: 700 }}>
              3D MUSCLE RECOVERY MATRIX
            </div>
            <div style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.35 }}>
              Interactive 3D anatomical heatmaps, fatigue distribution &amp; 72-hour recovery time-lapse modeling.
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, marginTop: 'auto', paddingTop: 4 }}>
              Launch 3D Matrix →
            </div>
          </Link>

          {/* Diagnostic 2: AI Video Biomechanics */}
          <Link
            href="/dashboard/fitness?workspace=video"
            className="tactile-btn luxury-card-interactive"
            style={{
              background: 'rgba(8, 14, 24, 0.85)',
              border: '1.5px solid rgba(56, 189, 248, 0.5)',
              borderRadius: 8,
              padding: '14px 16px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <GaaIcon name="camera" size={20} tone="cyan" />
              <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080E14', background: '#38BDF8', padding: '1px 6px', borderRadius: 3 }}>
                AI VISION
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 15, color: '#38BDF8', letterSpacing: '0.04em', fontWeight: 700 }}>
              AI BIOMECHANICS &amp; FORM
            </div>
            <div style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.35 }}>
              MediaPipe computer vision bar-path, kinetic joint tracking, and knee valgus screen.
            </div>
            <div style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, marginTop: 'auto', paddingTop: 4 }}>
              Start Form Check →
            </div>
          </Link>

          {/* Diagnostic 3: 12-Week Periodization Roadmap */}
          <Link
            href="/dashboard/fitness?workspace=lab&tool=roadmap"
            className="tactile-btn luxury-card-interactive"
            style={{
              background: 'rgba(8, 14, 24, 0.75)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              borderRadius: 8,
              padding: '14px 16px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <GaaIcon name="periodization" size={20} tone="gold" />
              <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 3 }}>
                PERIODIZATION
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 15, color: '#FFFFFF', letterSpacing: '0.04em', fontWeight: 700 }}>
              12-WEEK OPT™ ROADMAP
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.35 }}>
              Interactive progression across stabilization, strength development, and power cycles.
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, marginTop: 'auto', paddingTop: 4 }}>
              View Macrocycle Plan →
            </div>
          </Link>

          {/* Diagnostic 4: Weekly Coach Check-In */}
          <Link
            href="/dashboard/fitness?workspace=coach"
            className="tactile-btn luxury-card-interactive"
            style={{
              background: 'rgba(8, 14, 24, 0.85)',
              border: '1.5px solid rgba(212, 160, 23, 0.45)',
              borderRadius: 8,
              padding: '14px 16px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 0 14px rgba(212, 160, 23, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <GaaIcon name="clipboard" size={20} tone="gold" />
              <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080E14', background: 'var(--gold)', padding: '1px 6px', borderRadius: 3 }}>
                WEEKLY TRIAGE
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 15, color: 'var(--gold-lt)', letterSpacing: '0.04em', fontWeight: 700 }}>
              COACH ADVISORY CHECK-IN
            </div>
            <div style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.35 }}>
              Weekly biofeedback check-in, bodyweight, sleep, and physique photo updates.
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, marginTop: 'auto', paddingTop: 4 }}>
              Open Weekly Check-In →
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
