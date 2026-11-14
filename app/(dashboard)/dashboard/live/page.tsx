import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import SiteHeader from '@/components/ui/SiteHeader'
import LogoutButton from '@/components/auth/LogoutButton'
import LiveVideoCameraHud from '@/components/coach/LiveVideoCameraHud'
import { getTeamById } from '@/lib/teams'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams?: Promise<{ teamId?: string }>
}

export default async function AthleteLiveSessionPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = supabaseAdmin()
  const resolvedParams = searchParams ? await searchParams : {}
  const targetTeamId = resolvedParams.teamId

  // Get active workout plan
  const { data: plan } = await admin
    .from('workout_plans')
    .select('id, name, plan_json, nasm_opt_phase, phase_name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get client details
  const { data: client } = await admin
    .from('clients')
    .select('full_name, email, designated_coach_id, role')
    .eq('id', user.id)
    .maybeSingle()

  // If coach lands on athlete live page, redirect to coach live studio
  if (client?.role === 'coach') {
    redirect('/coach#live-studio')
  }

  // Resolve assigned coach name dynamically
  let coachName = 'Coach Gordon'
  if (client?.designated_coach_id) {
    const { data: coachProfile } = await admin
      .from('clients')
      .select('full_name')
      .eq('id', client.designated_coach_id)
      .maybeSingle()
    if (coachProfile?.full_name) {
      coachName = coachProfile.full_name
    }
  }

  // Resolve Team if teamId query parameter is provided
  let team = null
  if (targetTeamId) {
    team = await getTeamById(targetTeamId, client?.designated_coach_id || undefined)
  }

  const isTeamSession = Boolean(team)
  const sessionId = team ? `team-${team.id}` : `live-${user.id}`
  const athleteName = client?.full_name || user.email?.split('@')[0] || 'Athlete'

  return (
    <main
      className="forge-obsidian-canvas"
      style={{
        minHeight: '100dvh',
        backgroundColor: '#090A0D',
        paddingBottom: 'calc(104px + env(safe-area-inset-bottom, 16px))',
      }}
    >
      <SiteHeader
        badgeText={isTeamSession ? `Team Live Studio · ${team?.name}` : 'Live Studio'}
        links={[
          { href: '/dashboard', label: 'Today' },
          { href: '/dashboard/fitness', label: 'Training & progress' },
          { href: '/dashboard/book', label: 'Book a session' },
          { href: '/dashboard/messages', label: 'Messages' },
          { href: '/dashboard/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div style={{ maxWidth: 1720, margin: '0 auto', padding: 'clamp(8px, 1.5vw, 16px) clamp(10px, 1.8vw, 20px)' }}>
        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundImage: "url('/images/brand/forge-crest-mark.png')",
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#060A14',
                border: '1.5px solid var(--gold)',
                boxShadow: '0 0 16px rgba(197,160,89,0.4)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  {isTeamSession ? `Forge Athletic · Team Telehealth Studio · ${team?.name}` : 'Forge Athletic · Live Telehealth Studio'}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 'clamp(1.05rem, 0.85rem + 1vw, 1.5rem)',
                  letterSpacing: '0.04em',
                  margin: '1px 0 0',
                  color: 'var(--white)',
                  lineHeight: 1.2,
                }}
              >
                {isTeamSession ? `${team?.name.toUpperCase()} · SQUAD LIVE COACHING` : '1:1 LIVE COACHING & MOVEMENT HUD'}
              </h1>
              <p style={{ margin: '2px 0 0', color: 'var(--gray)', fontSize: 12, lineHeight: 1.35 }}>
                {isTeamSession
                  ? `Direct interactive squad video feed with ${coachName} and fellow teammates. Follow synchronized interval pacing, tempo pulse, and tactical form cues.`
                  : `Direct interactive video feed with ${coachName}. Follow live pacing, joint alignment guides, and prescribed set cadences.`}
              </p>
            </div>
          </div>
        </div>

        {/* Live Video Camera HUD */}
        <div style={{ marginBottom: 16 }}>
          <LiveVideoCameraHud
            coachName={coachName}
            clientName={athleteName}
            exerciseName={
              (plan?.plan_json as { workouts?: Array<{ exercises?: Array<{ name?: string }> }> } | null)?.workouts?.[0]?.exercises?.[0]?.name ||
              (isTeamSession ? 'Team Dynamic Movement & Kinetic Assessment' : 'Overhead Squat Assessment')
            }
            optPhase={plan?.phase_name ? `Phase ${plan.nasm_opt_phase}: ${plan.phase_name}` : 'Phase 2: Strength Endurance'}
            currentTempo={
              (plan?.plan_json as { workouts?: Array<{ exercises?: Array<{ tempo?: string }> }> } | null)?.workouts?.[0]?.exercises?.[0]?.tempo ||
              '2-0-2'
            }
            sessionId={sessionId}
            currentUserId={user.id}
            isCoach={false}
            isTeamSession={isTeamSession}
            teamId={team?.id}
            teamName={team?.name}
            teamRoster={team?.members}
          />
        </div>

        {/* Live Diagnostic Telemetry Info */}
        <div className="forge-surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 sm:p-6">
          <div>
            <div className="forge-eyebrow-micro text-emerald-300">
              Tactical Video Instructions · Still Camera Protocol
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-200">
              Position your camera 6–8 feet away at hip height so full body extension (overhead to ankles) remains statically visible for kinetic chain diagnostics.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-amber-300">
              💡 <strong>Mobile Athletes (iPhone / Android):</strong> Ensure Apple Center Stage or Samsung Auto-framing is turned <strong>OFF</strong> so your camera stays completely still and does not zoom or follow your movement.
            </p>
          </div>

          <a
            href="/dashboard/fitness"
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            Open training →
          </a>
        </div>
      </div>
    </main>
  )
}
