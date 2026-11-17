import { notFound } from 'next/navigation'
import { isMasterCoachEmail, requireSurfaceRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import LiveSessionClient from '@/components/coach/LiveSessionClient'
import { checkClientMedicalClearanceGate } from '@/lib/liability-shield'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CoachLiveSessionPage({ params }: PageProps) {
  const { user } = await requireSurfaceRole('coach')

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

  // Only master coach may auto-claim an unassigned client; non-master coaches require explicit assignment
  if (!client.designated_coach_id) {
    if (!isMasterCoachEmail(user.email)) {
      notFound()
    }
    await admin
      .from('clients')
      .update({ designated_coach_id: user.id })
      .eq('id', clientId)
    client.designated_coach_id = user.id
  } else if (client.designated_coach_id !== user.id) {
    if (!isMasterCoachEmail(user.email)) {
      notFound()
    }
  }

  const athleteName = client.full_name ?? client.email ?? 'Member'
  const medicalGate = await checkClientMedicalClearanceGate(admin, clientId)

  if (medicalGate.blocked) {
    return (
      <main style={{ minHeight: '100dvh', background: '#04070E' }}>
        <SiteHeader
          badgeText="Live Coaching · Phase 0 Hold"
          links={[
            { href: '/coach', label: 'Overview' },
            { href: '/coach#assigned-clients', label: 'Members' },
            { href: `/coach/clients/${clientId}`, label: 'Member Profile' },
            { href: `/coach/clients/${clientId}/messages`, label: 'Messages' },
            { href: '/coach/settings', label: 'Settings' },
          ]}
          actions={<LogoutButton />}
        />

        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <div
            role="alert"
            className="rounded-2xl border border-red-500/50 bg-red-950/35 p-6 text-zinc-100 shadow-2xl"
          >
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-red-400">
              ACSM / PAR-Q+ Phase 0 Medical Clearance Hold
            </div>
            <h1 className="mt-2 font-serif text-xl font-bold text-white">
              Live Exercise Screening Paused for {athleteName}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              {medicalGate.reason}
            </p>
            {medicalGate.evaluation.flaggedItems.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-red-200">
                {medicalGate.evaluation.flaggedItems.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/coach/clients/${clientId}?tab=overview`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 hover:bg-amber-300"
              >
                Verify Physician Clearance on Stage 2 Gate →
              </a>
              <a
                href={`/coach/clients/${clientId}/messages`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-white/10"
              >
                Message {athleteName}
              </a>
            </div>
          </div>
        </div>
      </main>
    )
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
    <main style={{ minHeight: '100dvh', background: '#04070E' }}>
      <SiteHeader
        badgeText="Live Coaching"
        links={[
          { href: '/coach', label: 'Overview' },
          { href: '/coach#assigned-clients', label: 'Members' },
          { href: `/coach/clients/${clientId}`, label: 'Member Profile' },
          { href: `/coach/clients/${clientId}/messages`, label: 'Messages' },
          { href: '/coach/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div className="w-full max-w-[1760px] mx-auto p-0 md:px-3 md:py-2.5 pb-[calc(76px+env(safe-area-inset-bottom,16px))] md:pb-5">
        <LiveSessionClient
          clientId={clientId}
          coachUserId={user.id}
          athleteName={athleteName}
          plan={plan ?? null}
          initialSets={todaySets ?? []}
          today={today}
        />
      </div>
    </main>
  )
}
