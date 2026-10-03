import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import LiveSessionClient from '@/components/coach/LiveSessionClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CoachLiveSessionPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id: clientId } = await params
  const admin = supabaseAdmin()

  const { data: client } = await admin
    .from('clients')
    .select('id, full_name, email, designated_coach_id')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) {
    notFound()
  }

  // If unassigned, automatically assign to current coach so sessions can proceed
  if (!client.designated_coach_id) {
    await admin
      .from('clients')
      .update({ designated_coach_id: user.id })
      .eq('id', clientId)
    client.designated_coach_id = user.id
  } else if (client.designated_coach_id !== user.id) {
    // Only block if assigned to a different coach and current user is not Master Coach
    const isMasterCoach =
      user.email?.toLowerCase() === 'scott.gordon72@outlook.com' ||
      user.user_metadata?.surface_role === 'coach'
    if (!isMasterCoach) {
      notFound()
    }
  }

  // Get active plan
  const { data: plan } = await admin
    .from('workout_plans')
    .select('id, name, nasm_opt_phase, plan_json')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get today's set logs
  const today = new Date().toISOString().slice(0, 10)
  const { data: todaySets } = await admin
    .from('workout_set_logs')
    .select('*')
    .eq('user_id', clientId)
    .eq('session_date', today)
    .order('created_at', { ascending: true })

  return (
    <main style={{ minHeight: '100vh', background: '#04070E' }}>
      <SiteHeader
        badgeText="1:1 Live Studio"
        links={[
          { href: '/coach', label: 'Triage' },
          { href: '/coach#assigned-clients', label: 'Athletes' },
          { href: `/coach/clients/${clientId}`, label: 'Athlete Profile' },
          { href: `/coach/clients/${clientId}/messages`, label: 'Concierge' },
          { href: '/coach/settings', label: 'Operations' },
        ]}
        actions={<LogoutButton />}
      />

      <div className="w-full max-w-[1440px] mx-auto p-0 md:px-5 md:py-4 pb-[calc(76px+env(safe-area-inset-bottom,16px))] md:pb-8">
        <LiveSessionClient
          clientId={clientId}
          coachUserId={user.id}
          athleteName={client.full_name ?? client.email ?? 'Athlete'}
          plan={plan ?? null}
          initialSets={todaySets ?? []}
          today={today}
        />
      </div>
    </main>
  )
}
