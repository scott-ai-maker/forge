import { redirect, notFound } from 'next/navigation'
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
  title: 'Athlete Sunday Dossier | Coach Console | GAA',
  description: 'Coach view of client weekly athletic intelligence briefing, ACWR workload telemetry, kinetic movement distribution, and clinical S.O.A.P. record.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CoachClientDossierPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { id } = await params
  const admin = supabaseAdmin()

  // Verify coach privileges
  const { data: coachUser } = await admin
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isMasterCoach =
    user.email?.toLowerCase() === 'scott.gordon72@outlook.com' ||
    user.user_metadata?.surface_role === 'coach'

  if (coachUser?.role !== 'coach' && !isMasterCoach) {
    redirect('/dashboard')
  }

  // Fetch client details
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, full_name, email, designated_coach_id')
    .eq('id', id)
    .maybeSingle()

  if (clientError || !client) notFound()

  // Verify coach assignment or master coach access
  if (client.designated_coach_id && client.designated_coach_id !== user.id && !isMasterCoach) {
    notFound()
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
  const twentyEightDaysAgoStr = twentyEightDaysAgo.toISOString().split('T')[0]

  const [
    { data: profile },
    { data: latestPlan },
    { data: allSetLogs },
    { data: weeklyCardioLogs },
    { data: recentPrs },
    { data: wearableMetric },
  ] = await Promise.all([
    admin
      .from('fitness_profiles')
      .select('fitness_goal, onboarding_completed_at')
      .eq('user_id', id)
      .maybeSingle(),
    admin
      .from('workout_plans')
      .select('nasm_opt_phase, phase_name, goal')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('workout_set_logs')
      .select('session_date, weight_lbs, reps, is_warmup, rpe, exercise_name, notes')
      .eq('user_id', id)
      .gte('session_date', twentyEightDaysAgoStr)
      .order('session_date', { ascending: false }),
    admin
      .from('cardio_logs')
      .select('session_date, activity_type, duration_mins, avg_heart_rate')
      .eq('user_id', id)
      .gte('session_date', sevenDaysAgoStr)
      .order('session_date', { ascending: false }),
    admin
      .from('personal_records')
      .select('exercise_name, weight_lbs, reps, achieved_at')
      .eq('user_id', id)
      .gte('achieved_at', sevenDaysAgo.toISOString())
      .order('achieved_at', { ascending: false }),
    admin
      .from('athlete_wearable_metrics')
      .select('resting_heart_rate, hrv_rmssd_ms')
      .eq('client_id', id)
      .order('sample_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const clientName = client.full_name || client.email?.split('@')[0] || 'Athlete'
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
        badgeText="Coach Intelligence"
        links={[
          { href: '/coach', label: 'Triage' },
          { href: `/coach/clients/${id}`, label: 'Athlete Hub' },
          { href: `/coach/clients/${id}?tab=checkins`, label: 'Check-Ins' },
          { href: '/corporate/proposal', label: 'Corporate B2B' },
          { href: '/coach/settings', label: 'Operations' },
        ]}
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
        {/* Coach Navigation Bar */}
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
                COACH DOSSIER VIEW · ATHLETE: <span style={{ color: '#FFFFFF' }}>{clientName.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                Live sports science ACWR workload telemetry, kinetic plane distribution &amp; clinical S.O.A.P. notes.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/coach/clients/${id}?tab=checkins`}
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
              <span>← Return to Athlete Check-Ins</span>
            </Link>
          </div>
        </div>

        {/* Executive Sunday Intelligence Dossier Component */}
        <ExecutiveSundayDossier
          athleteName={clientName}
          optPhase={currentPlanPhase}
          dossier={dossier}
          weekEndingDate={weekEndingDate}
        />
      </div>
    </main>
  )
}
