import { notFound } from 'next/navigation'
import { requireSurfaceRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import UnifiedLiveStudioHud from '@/components/coach/UnifiedLiveStudioHud'
import { DEFAULT_LIVE_ASSESSMENT_PLAN } from '@/components/coach/LiveSessionClient'
import { getTeamById } from '@/lib/teams'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CoachTeamLiveSessionPage({ params }: PageProps) {
  const { user } = await requireSurfaceRole('coach')
  const { id: teamId } = await params
  const admin = supabaseAdmin()

  // Fetch assigned clients to support dynamic squad rosters
  const { data: assignedClients } = await admin
    .from('clients')
    .select('id, full_name, email')
    .eq('designated_coach_id', user.id)

  const clientsFallback = (assignedClients || []).map(c => ({
    id: c.id,
    fullName: c.full_name || 'Athlete',
    email: c.email || '',
  }))

  const team = await getTeamById(teamId, user.id, clientsFallback)
  if (!team) {
    notFound()
  }

  const today = new Date().toISOString().slice(0, 10)
  const defaultMemberId = team.members[0]?.clientId || team.id

  const { data: plan } = await admin
    .from('workout_plans')
    .select('id, name, nasm_opt_phase, plan_json')
    .eq('user_id', defaultMemberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const teamMemberIds = Array.from(
    new Set(team.members.map(m => m.clientId).filter(Boolean))
  )
  const { data: todaySets } =
    teamMemberIds.length > 0
      ? await admin
          .from('workout_set_logs')
          .select('*')
          .in('user_id', teamMemberIds)
          .eq('session_date', today)
          .order('created_at', { ascending: true })
      : { data: [] }

  return (
    <main style={{ minHeight: '100dvh', background: '#04070E' }}>
      <SiteHeader
        badgeText={`Team Live Studio · ${team.name}`}
        links={[
          { href: '/coach', label: 'Overview' },
          { href: '/coach#assigned-clients', label: 'Members' },
          { href: '/coach#live-studio', label: 'Studio Launcher' },
          { href: '/coach/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div className="w-full max-w-[1560px] mx-auto p-0 md:px-5 md:py-4 pb-[calc(76px+env(safe-area-inset-bottom,16px))] md:pb-8">
        <UnifiedLiveStudioHud
          teamId={team.id}
          teamName={team.name}
          teamRoster={team.members}
          isTeamSession={true}
          clientId={defaultMemberId}
          athleteName={team.name}
          coachName="Coach Gordon"
          coachUserId={user.id}
          plan={plan ?? DEFAULT_LIVE_ASSESSMENT_PLAN}
          initialSets={todaySets ?? []}
          today={today}
        />
      </div>
    </main>
  )
}
