import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { normalizeFitnessWorkspace } from '@/lib/validation'
import FitnessTrackerClient from '@/components/fitness/FitnessTrackerClient'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import ClientMembershipStatusBanner from '@/components/dashboard/ClientMembershipStatusBanner'
import {
  createSignedFitnessPhotoUrl,
  createSignedFitnessPhotoUrlsBatch,
  extractPhotoPathFromLegacyUrl,
  normalizePhotoPath,
} from '@/lib/fitness-photos'

export const dynamic = 'force-dynamic'

interface FitnessTrackerPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FitnessTrackerPage({ searchParams }: FitnessTrackerPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [
    { data: profile },
    { data: plans },
    { data: logs },
    { data: setLogs },
    { data: analyses },
    { data: cardioLogs },
    { data: progressPhotos },
    { data: assessments },
    { data: clientRow },
    { data: intake },
  ] = await Promise.all([
    supabase.from('fitness_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('workout_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
    supabase.from('workout_logs').select('*').eq('user_id', user.id).order('session_date', { ascending: false }).limit(60),
    supabase.from('workout_set_logs').select('*').eq('user_id', user.id).order('session_date', { ascending: false }).limit(240),
    supabase
      .from('body_composition_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('cardio_logs')
      .select('id, session_date, activity_type, duration_mins, distance_km, avg_heart_rate, perceived_effort')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(20),
    supabase
      .from('progress_photos')
      .select('id, photo_url, taken_at, notes, created_at')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false })
      .limit(24),
    supabase
      .from('nasm_assessments')
      .select('*')
      .eq('client_id', user.id)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('clients')
      .select('id, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('client_intake_forms')
      .select('parq_answers, parq_any_yes, medical_conditions, surgeries_or_injuries, medications, allergies')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const safeProfile = profile || {
    preferred_units: 'imperial' as const,
    age: 35,
    sex: 'male' as const,
    fitness_goal: 'Strength & Power',
    onboarding_completed_at: null,
  }

  const params = await searchParams
  const rawParam = params.workspace || params.hub || params.view || params.tab
  const normalizedParam = rawParam === 'advisory' ? 'coach' : rawParam
  const workspace = normalizeFitnessWorkspace(normalizedParam)

  const beforePhotoPath = normalizePhotoPath(
    safeProfile.before_photo_path ?? extractPhotoPathFromLegacyUrl(safeProfile.before_photo_url)
  )

  const rawPhotoPaths = (progressPhotos ?? []).map(photo =>
    /^https?:\/\//i.test(String(photo.photo_url ?? '').trim())
      ? extractPhotoPathFromLegacyUrl(photo.photo_url)
      : normalizePhotoPath(photo.photo_url)
  )

  const [signedBeforePhotoUrl, batchSignedProgressUrls] = await Promise.all([
    beforePhotoPath ? createSignedFitnessPhotoUrl(supabase, beforePhotoPath) : Promise.resolve(null),
    rawPhotoPaths.length > 0 ? createSignedFitnessPhotoUrlsBatch(supabase, rawPhotoPaths) : Promise.resolve([]),
  ])

  const profileWithSignedPhoto = {
    ...safeProfile,
    before_photo_path: beforePhotoPath || null,
    before_photo_url: signedBeforePhotoUrl ?? null,
  }

  const signedProgressPhotos = (progressPhotos ?? []).map((photo, idx) => ({
    ...photo,
    photo_url: batchSignedProgressUrls[idx] ?? photo.photo_url,
  }))

  return (
    <main className="dashboard-fitness-page" style={{ minHeight: '100vh', background: 'var(--navy)', padding: 'clamp(8px, 1.5vw, 18px) clamp(6px, 1.5vw, 16px) 36px', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <SiteHeader
        links={[
          { href: '/dashboard', label: 'Today' },
          { href: '/dashboard/fitness', label: 'Training & progress' },
          { href: '/dashboard/dossier', label: 'Progress summary' },
          { href: '/dashboard/book', label: 'Book a session' },
          { href: '/dashboard/messages', label: 'Messages' },
          { href: '/dashboard/settings', label: 'Settings' },
        ]}
        badgeText="Training & progress"
        actions={<LogoutButton />}
      />
      <div className="dashboard-fitness-content" style={{ maxWidth: 1440, margin: '0 auto', width: '100%', minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', letterSpacing: '0.04em', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>Training &amp; progress</h1>
            <p style={{ color: 'var(--gray)', margin: '6px 0 0' }}>Follow your training plan, track sessions, and visualize your progress.</p>
          </div>
          <a href="/dashboard" className="sgf-shell-back" style={{ marginBottom: 0 }}>← Back to today</a>
        </div>

        <ClientMembershipStatusBanner
          status={((clientRow as { status?: 'active' | 'paused' | 'archived' } | null)?.status || 'active')}
          statusReason={(clientRow as { status_reason?: string } | null)?.status_reason}
        />

        <FitnessTrackerClient
          profile={profileWithSignedPhoto}
          intake={intake ?? null}
          latestPlan={plans?.[0] ?? null}
          allPlans={plans ?? []}
          latestAssessment={assessments ?? null}
          logs={logs ?? []}
          setLogs={setLogs ?? []}
          latestAnalysis={analyses?.[0] ?? null}
          cardioLogs={cardioLogs ?? []}
          progressPhotos={signedProgressPhotos}
          initialWorkspace={workspace}
          initialTab={typeof params.tab === 'string' ? (params.tab as 'heatmap' | 'gate' | 'acwr' | 'deload' | '3d') : undefined}
        />
      </div>
    </main>
  )
}
