import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import SiteHeader from '@/components/ui/SiteHeader'
import LogoutButton from '@/components/auth/LogoutButton'
import LiveVideoCameraHud from '@/components/coach/LiveVideoCameraHud'

export const dynamic = 'force-dynamic'

export default async function AthleteLiveSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = supabaseAdmin()

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
  let coachName = 'Coach Scott Gordon'
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

  const athleteName = client?.full_name || user.email?.split('@')[0] || 'Athlete'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Live Studio"
        links={[
          { href: '/dashboard', label: 'Command Center' },
          { href: '/dashboard/fitness', label: 'Fitness Lab' },
          { href: '/dashboard/dossier', label: 'Weekly Dossier' },
          { href: '/dashboard/book', label: 'Consultations' },
          { href: '/dashboard/messages', label: 'Messages' },
          { href: '/dashboard/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundImage: "url('/images/gaa-brand-crest.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '2px solid var(--gold)',
              boxShadow: '0 0 20px rgba(197,160,89,0.45)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Gordon Athletic Advisory · Live Telehealth Studio
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 26, letterSpacing: '0.04em', margin: '2px 0 0', color: 'var(--white)' }}>
              1:1 LIVE COACHING & MOVEMENT HUD
            </h1>
            <p style={{ margin: '2px 0 0', color: 'var(--gray)', fontSize: 13 }}>
              Direct interactive video feed with {coachName}. Follow live pacing, joint alignment guides, and prescribed set cadences.
            </p>
          </div>
        </div>

        {/* Live Video Camera HUD */}
        <div style={{ marginBottom: 24 }}>
          <LiveVideoCameraHud
            coachName={coachName}
            clientName={athleteName}
            exerciseName={
              (plan?.plan_json as any)?.workouts?.[0]?.exercises?.[0]?.name ||
              'Overhead Squat Assessment'
            }
            optPhase={plan?.phase_name ? `Phase ${plan.nasm_opt_phase}: ${plan.phase_name}` : 'Phase 2: Strength Endurance'}
            currentTempo={
              (plan?.plan_json as any)?.workouts?.[0]?.exercises?.[0]?.tempo ||
              '2-0-2'
            }
            sessionId={`live-${user.id}`}
            currentUserId={user.id}
            isCoach={false}
          />
        </div>

        {/* Live Diagnostic Telemetry Info */}
        <div
          style={{
            background: 'rgba(212,160,23,0.06)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 10,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Tactical Video Instructions · Still Camera Protocol
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#FFFFFF', lineHeight: 1.45 }}>
              Position your camera 6–8 feet away at hip height so full body extension (overhead to ankles) remains statically visible for kinetic chain diagnostics.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--gold-lt)', lineHeight: 1.4 }}>
              💡 <strong>Mobile Athletes (iPhone / Android):</strong> Ensure Apple Center Stage or Samsung Auto-framing is turned <strong>OFF</strong> so your camera stays completely still and does not zoom or follow your movement.
            </p>
          </div>

          <a
            href="/dashboard/fitness"
            className="tactile-btn"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
              color: '#0A0E18',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Open Fitness Lab →
          </a>
        </div>
      </div>
    </main>
  )
}
