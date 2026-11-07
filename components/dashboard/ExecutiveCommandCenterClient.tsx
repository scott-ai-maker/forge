'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import type { DashboardWorkspace } from '@/lib/validation'
import { getMembershipDisplayName } from '@/lib/forge-memberships'
import PrescribedToolboxBanner from '@/components/fitness/PrescribedToolboxBanner'
import ReferralDashboardWidget from '@/components/referrals/ReferralDashboardWidget'
import type { DossierMetrics } from '@/lib/sunday-dossier-engine'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import { generateIcsCalendar, downloadIcsFile } from '@/lib/calendar-sync'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, containerType: 'inline-size' }}>
      {/* ── 0a. Active Live Session Alert Banner ── */}
      {activeLiveSessionHref && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(8,14,24,0.96) 100%)',
            border: '1.5px solid #10B981',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#34D399', fontWeight: 800 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              <span>Live Studio Active</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 15, color: '#FFFFFF', marginTop: 2, fontWeight: 700 }}>
              Coach Gordon is in your live studio
            </div>
          </div>
          <Link
            href={activeLiveSessionHref}
            className="tactile-btn"
            style={{
              padding: '9px 14px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              borderRadius: 6,
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              textTransform: 'uppercase',
              fontSize: 11.5,
              letterSpacing: '0.06em',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => triggerHaptic('tap')}
          >
            <GaaIcon name="camera" size={14} tone="inherit" />
            <span>Join Now →</span>
          </Link>
        </div>
      )}

      {/* ── 0. Baseline Onboarding Banner ── */}
      {onboardingBannerState && (
        <div
          style={{
            background: onboardingBannerState.title.startsWith('CONTINUE')
              ? 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(14,23,36,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(14,23,36,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.5)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              {onboardingBannerState.eyebrow}
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 15, color: '#FFFFFF', margin: '2px 0 0', letterSpacing: '0.03em' }}>
              {onboardingBannerState.title}
            </h4>
          </div>
          <Link
            href={onboardingBannerState.href}
            className="sgf-button sgf-button-primary"
            style={{ padding: '8px 14px', fontSize: 11.5, textDecoration: 'none' }}
          >
            {onboardingBannerState.buttonText}
          </Link>
        </div>
      )}

      {/* ── 1. Compact Athlete Identity Bar ── */}
      <div
        style={{
          background: 'rgba(13, 22, 36, 0.9)',
          border: '1px solid rgba(212,160,23,0.25)',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 15,
              color: '#0A0E18',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 'clamp(17px, 2.8vw, 22px)', color: '#FFFFFF', margin: 0, letterSpacing: '0.03em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {clientName}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentPlanPhase}{activePackage ? ` · ${getMembershipDisplayName(activePackage.package_name)}` : ''}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/messages"
          className="tactile-btn"
          style={{
            padding: '7px 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 6,
            color: 'var(--white)',
            fontSize: 11.5,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
          onClick={() => triggerHaptic('tap')}
        >
          <GaaIcon name="message" size={13} tone="gold" />
          <span>Coach</span>
        </Link>
      </div>

      {/* ── 2. Today's Primary Training Mission (Hero Action Card) ── */}
      <Link
        href="/dashboard/fitness?workspace=train"
        className="tactile-btn luxury-card-interactive"
        style={{
          background: isWorkoutCompleted
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(8, 14, 24, 0.96) 100%)'
            : isWorkoutInProgress
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(8, 14, 24, 0.96) 100%)'
              : 'linear-gradient(135deg, rgba(212, 160, 23, 0.14) 0%, rgba(8, 14, 24, 0.96) 100%)',
          border: isWorkoutCompleted
            ? '1.5px solid rgba(52, 211, 153, 0.55)'
            : isWorkoutInProgress
              ? '1.5px solid rgba(245, 158, 11, 0.65)'
              : '1.5px solid rgba(197, 160, 89, 0.5)',
          borderRadius: 12,
          padding: '14px 16px',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
        onClick={() => triggerHaptic('tap')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="barbell" size={17} tone={isWorkoutCompleted ? 'emerald' : isWorkoutInProgress ? 'amber' : 'gold'} />
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isWorkoutCompleted ? '#34D399' : 'var(--gold-lt)' }}>
              Today&apos;s Workout
            </span>
          </div>
          {isWorkoutCompleted ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10B981', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '2px 8px', borderRadius: 4 }}>
              ✓ Day {activeWorkout?.day || 1} Done
            </span>
          ) : isWorkoutInProgress ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: 4 }}>
              {activeDayLoggedWorkingSets}/{activeDayTotalTargetSets || '-'} Sets
            </span>
          ) : activeWorkout ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#080E14', background: 'var(--gold-lt)', padding: '2px 8px', borderRadius: 4 }}>
              Day {activeWorkout.day}
            </span>
          ) : null}
        </div>

        {(() => {
          const leadExerciseName = activeWorkout?.exercises?.[0]?.name
          const leadCard = leadExerciseName ? getNasmClinicalMovementCard(leadExerciseName) : null
          const leadExerciseImg = leadCard?.imageUrl || (leadExerciseName ? resolveGaaExerciseImage(leadExerciseName, false) : null) || (leadExerciseName ? BRAND_LOGO_FALLBACK_IMAGE : null)
          return (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {leadExerciseImg && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'relative',
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#070B14',
                    border: '1px solid rgba(212,160,23,0.35)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 'clamp(16px, 2.8vw, 19px)', color: '#FFFFFF', letterSpacing: '0.03em', lineHeight: 1.2, fontWeight: 700 }}>
                  {activeWorkout ? `DAY ${activeWorkout.day}: ${activeWorkout.focus.toUpperCase()}` : 'OPEN WORKOUT LOGGER'}
                </div>
                <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.35, marginTop: 2 }}>
                  {activeWorkout ? (
                    isWorkoutCompleted ? (
                      totalVolumeMovedLbs > 0
                        ? `${totalVolumeMovedLbs.toLocaleString()} lbs moved · ${activeDayLoggedWorkingSets} working sets`
                        : `${activeDayExerciseCount} exercises completed`
                    ) : (
                      `${activeDayExerciseCount} exercises · ~${activeWorkoutDurationMins || latestPlan?.estimated_duration_mins || 60}m`
                    )
                  ) : (
                    'Log sets, track rest timers, and follow your phase plan.'
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        <div
          style={{
            background: isWorkoutCompleted ? 'rgba(16, 185, 129, 0.16)' : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
            color: isWorkoutCompleted ? '#34D399' : '#080E14',
            borderRadius: 7,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          {isWorkoutCompleted
            ? `Review Day ${activeWorkout?.day || 1} Summary →`
            : isWorkoutInProgress
              ? `Resume Day ${activeWorkout?.day || 1} Lifts (${activeDayLoggedWorkingSets}/${activeDayTotalTargetSets}) →`
              : activeWorkout
                ? `Start Day ${activeWorkout.day} Workout →`
                : 'Open Workout Logger →'
          }
        </div>
      </Link>

      {/* ── 3. Compact Weekly Telemetry & Live Session Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 10 }}>
        {/* Card A: Weekly Progress Strip */}
        <div
          style={{
            background: 'rgba(13, 24, 38, 0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              7-Day Telemetry
            </span>
            <Link
              href="/dashboard/fitness?workspace=progress"
              style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, textDecoration: 'none' }}
            >
              Progress →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Volume</div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginTop: 1 }}>
                {dossier.totalTonnageLbs.toLocaleString()} <span style={{ fontSize: 9.5 }}>lb</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>ACWR</div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 14, fontWeight: 700, color: dossier.acwrRatio !== null ? '#34D399' : 'var(--gray)', marginTop: 1 }}>
                {dossier.acwrRatio !== null && dossier.acwrRatio !== undefined ? dossier.acwrRatio.toFixed(2) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>PRs</div>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 14, fontWeight: 700, color: '#38BDF8', marginTop: 1 }}>
                {dossier.topPrsThisWeek.length}
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Compact Live Session & Booking Bar */}
        <div
          style={{
            background: 'rgba(13, 24, 38, 0.92)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6EE7B7', fontWeight: 800 }}>
              {nextSession ? 'Upcoming Session' : '1:1 Live Coaching'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 700 }}>
              {totalRemaining > 0 ? `${totalRemaining} ${totalRemaining === 1 ? 'Credit' : 'Credits'}` : 'Studio Ready'}
            </span>
          </div>

          <div style={{ fontSize: 12, color: '#E2E8F0' }} suppressHydrationWarning>
            {nextSession
              ? `${new Date(nextSession.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' })} · ${new Date(nextSession.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET`
              : 'Join a live 1:1 video session or schedule your next check-in.'}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/dashboard/live"
              className="tactile-btn"
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              Live Studio →
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
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Calendar
              </button>
            ) : (
              <Link
                href="/dashboard/book"
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Book Session
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Compact 2x2 Quick Tools Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 155px), 1fr))', gap: 8 }}>
        {[
          { href: '/dashboard/fitness?workspace=readiness&tab=3d', icon: 'dna' as const, tone: 'gold' as const, label: '3D Recovery', sub: 'Muscle heatmap' },
          { href: '/dashboard/fitness?workspace=video', icon: 'camera' as const, tone: 'cyan' as const, label: 'AI Form Check', sub: 'Video critique' },
          { href: '/dashboard/fitness?workspace=lab&tool=roadmap', icon: 'periodization' as const, tone: 'gold' as const, label: 'OPT™ Roadmap', sub: '12-wk phases' },
          { href: '/dashboard/fitness?workspace=coach', icon: 'clipboard' as const, tone: 'gold' as const, label: 'Weekly Check-In', sub: 'Biofeedback' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="tactile-btn"
            style={{
              background: 'rgba(10, 16, 28, 0.88)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
            }}
          >
            <GaaIcon name={item.icon} size={18} tone={item.tone} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── 5. Secondary Toolkits & Referrals (Collapsed by Default) ── */}
      <details
        className="fitness-card-disclosure"
        style={{
          background: 'rgba(10, 16, 28, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '0 12px',
        }}
      >
        <summary style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gray)' }}>
          Mobility Toolkits &amp; Member Referrals
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
          <PrescribedToolboxBanner toolboxId="desk_worker_posture" />
          <ReferralDashboardWidget />
        </div>
      </details>
    </div>
  )
}
