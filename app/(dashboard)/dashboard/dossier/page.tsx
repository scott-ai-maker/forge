import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import GaaIcon from '@/components/ui/GaaIcon'
import ExecutiveSundayDossier from '@/components/dashboard/ExecutiveSundayDossier'
import { generateSundayDossier } from '@/lib/sunday-dossier-engine'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Weekly Progress Summary | Forge Athletic',
  description: 'A clear weekly view of training, recovery, movement, and coaching notes.',
}

type DossierPageSearchParams = Promise<{
  client_id?: string | string[] | undefined
}>

export default async function ExecutiveSundayDossierPage({
  searchParams,
}: {
  searchParams?: DossierPageSearchParams
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const rawClientId = Array.isArray(resolvedSearchParams?.client_id)
    ? resolvedSearchParams?.client_id[0]
    : resolvedSearchParams?.client_id

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = supabaseAdmin()
  let targetUserId = user.id
  let isCoachPreview = false

  if (rawClientId && rawClientId !== user.id) {
    const { data: coachCheck } = await admin
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .eq('role', 'coach')
      .maybeSingle()

    const isMasterCoach =
      user.email?.toLowerCase() === 'scott.gordon72@outlook.com' ||
      user.user_metadata?.surface_role === 'coach'

    if (coachCheck || isMasterCoach) {
      targetUserId = rawClientId
      isCoachPreview = true
    }
  }

  const queryClient = isCoachPreview ? admin : supabase

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
  const twentyEightDaysAgoStr = twentyEightDaysAgo.toISOString().split('T')[0]

  const [
    { data: clientRow },
    { data: profile },
    { data: latestPlan },
    { data: allSetLogs },
    { data: weeklyCardioLogs },
    { data: recentPrs },
    { data: wearableMetric },
  ] = await Promise.all([
    queryClient
      .from('clients')
      .select('full_name, email')
      .eq('id', targetUserId)
      .maybeSingle(),
    queryClient
      .from('fitness_profiles')
      .select('fitness_goal, onboarding_completed_at')
      .eq('user_id', targetUserId)
      .maybeSingle(),
    queryClient
      .from('workout_plans')
      .select('nasm_opt_phase, phase_name, goal')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    queryClient
      .from('workout_set_logs')
      .select('session_date, weight_lbs, reps, is_warmup, rpe, exercise_name, notes')
      .eq('user_id', targetUserId)
      .gte('session_date', twentyEightDaysAgoStr)
      .order('session_date', { ascending: false }),
    queryClient
      .from('cardio_logs')
      .select('session_date, activity_type, duration_mins, avg_heart_rate')
      .eq('user_id', targetUserId)
      .gte('session_date', sevenDaysAgoStr)
      .order('session_date', { ascending: false }),
    queryClient
      .from('personal_records')
      .select('exercise_name, weight_lbs, reps, achieved_at')
      .eq('user_id', targetUserId)
      .gte('achieved_at', sevenDaysAgo.toISOString())
      .order('achieved_at', { ascending: false }),
    queryClient
      .from('athlete_wearable_metrics')
      .select('resting_heart_rate, hrv_rmssd_ms')
      .eq('client_id', targetUserId)
      .order('sample_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const clientName = clientRow?.full_name || user.email?.split('@')[0] || 'Member'
  const currentPlanPhase = latestPlan?.phase_name
    ? `Phase ${latestPlan.nasm_opt_phase}: ${latestPlan.phase_name}`
    : (profile?.fitness_goal || 'Phase 1: Stabilization Endurance')

  const restingHeartRate = wearableMetric?.resting_heart_rate ?? 54
  const hrvBaseline = wearableMetric?.hrv_rmssd_ms ?? 68

  // Split sets into 7-day acute and calculate 28-day chronic weekly average tonnage
  const acuteSetLogs = (allSetLogs ?? []).filter(s => (s.session_date ?? '') >= sevenDaysAgoStr)
  const chronicTonnageSum = (allSetLogs ?? []).reduce(
    (acc, s) => acc + (s.is_warmup ? 0 : (s.weight_lbs ?? 0) * (s.reps ?? 0)),
    0
  )
  const chronicWorkloadTonnage = Math.round(chronicTonnageSum / 4)

  const dossier = generateSundayDossier(
    clientName,
    currentPlanPhase,
    acuteSetLogs,
    weeklyCardioLogs ?? [],
    recentPrs ?? [],
    4,
    restingHeartRate,
    hrvBaseline,
    chronicWorkloadTonnage
  )

  const weekEndingDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText={isCoachPreview ? 'Coach view' : 'Progress summary'}
        links={
          isCoachPreview
            ? [
                { href: '/coach', label: 'Triage' },
                { href: `/coach/clients/${targetUserId}`, label: 'Athlete Hub' },
                { href: `/coach/clients/${targetUserId}?tab=checkins`, label: 'Check-Ins' },
                { href: '/corporate/proposal', label: 'Corporate B2B' },
                { href: '/coach/settings', label: 'Operations' },
              ]
            : [
                { href: '/dashboard', label: 'Today' },
                { href: '/dashboard/fitness', label: 'Training & progress' },
                { href: '/dashboard/dossier', label: 'Progress summary' },
                { href: '/dashboard/book', label: 'Book a session' },
                { href: '/dashboard/messages', label: 'Messages' },
                { href: '/dashboard/settings', label: 'Settings' },
              ]
        }
        actions={<LogoutButton />}
      />

      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: 'clamp(14px, 2.5vw, 28px) clamp(12px, 2vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Coach Preview Banner */}
        {isCoachPreview && (
          <div
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 18px',
              background: 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(13,27,42,0.98) 100%)',
              border: '1px solid rgba(212,160,23,0.5)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GaaIcon name="crown" size={20} tone="gold" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
                  COACH PREVIEW · MEMBER: <span style={{ color: '#FFFFFF' }}>{clientName.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                  Reviewing recent training load, your 28-day baseline, and coaching notes.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link
                href={`/coach/clients/${targetUserId}?tab=checkins`}
                className="tactile-btn"
                style={{
                  padding: '7px 14px',
                  borderRadius: 4,
                  background: 'var(--navy-mid)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>← Back to member check-ins</span>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation breadcrumbs */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '10px 16px',
            background: 'rgba(10, 16, 29, 0.75)',
            border: '1px solid rgba(212, 160, 23, 0.25)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Link
              href="/dashboard"
              style={{
                color: 'var(--gold, #D4A017)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                letterSpacing: '0.04em',
              }}
            >
              <span>←</span>
              <span>Today</span>
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: '#E2E8F0', fontWeight: 500 }}>Weekly progress summary</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 4,
                background: 'rgba(212, 160, 23, 0.12)',
                color: '#D4A017',
                border: '1px solid rgba(212, 160, 23, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <GaaIcon name="shield" size={10} tone="gold" />
              Your training record
            </span>
          </div>
        </div>

        {/* Weekly training and progress summary */}
        <ExecutiveSundayDossier
          athleteName={clientName}
          optPhase={currentPlanPhase}
          dossier={dossier}
          weekEndingDate={weekEndingDate}
          isModal={false}
        />
      </div>
    </main>
  )
}
