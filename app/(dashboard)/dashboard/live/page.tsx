import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import SiteHeader from '@/components/ui/SiteHeader'
import LogoutButton from '@/components/auth/LogoutButton'
import LiveVideoCameraHud from '@/components/coach/LiveVideoCameraHud'
import LivePreSessionErapGate from '@/components/fitness/LivePreSessionErapGate'
import MandatoryLegalClickwrapGate from '@/components/legal/MandatoryLegalClickwrapGate'
import { checkClientLegalConsentGate } from '@/lib/legal-compliance'
import {
  checkClientMedicalClearanceGate,
  evaluateMedicalParq,
  normalizeParqAnswersFromIntake,
} from '@/lib/liability-shield'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams?: Promise<{ teamId?: string }>
}

export default async function AthleteLiveSessionPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Team Live Studio is permanently disabled; strip legacy ?teamId=... links to 1:1 Live Studio
  const resolvedParams = searchParams ? await searchParams : {}
  if (resolvedParams.teamId) {
    redirect('/dashboard/live')
  }

  const admin = supabaseAdmin()

  // Fetch plan, client profile, intake ERAP details, medical gate, and legal waiver gate in parallel
  const [{ data: plan }, { data: client }, { data: intake }, medicalGate, legalConsentGate] = await Promise.all([
    admin
      .from('workout_plans')
      .select('id, name, plan_json, nasm_opt_phase, phase_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('clients')
      .select('full_name, email, designated_coach_id, role')
      .eq('id', user.id)
      .maybeSingle(),
    admin
      .from('client_intake_forms')
      .select(
        'parq_answers, medical_conditions, surgeries_or_injuries, emergency_contact_name, emergency_contact_phone, consent_signature_name, consent_signed_at'
      )
      .eq('user_id', user.id)
      .maybeSingle(),
    checkClientMedicalClearanceGate(admin, user.id),
    checkClientLegalConsentGate(admin, user.id, {
      requireTermsOfService: true,
      requireLiabilityWaiver: true,
    }),
  ])

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

  const sessionId = `live-${user.id}`
  const athleteName = client?.full_name || user.email?.split('@')[0] || 'Athlete'

  const normalizedParq = normalizeParqAnswersFromIntake(intake?.parq_answers, intake)
  const parqEval = evaluateMedicalParq(normalizedParq)

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
        badgeText="1:1 Live Studio"
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
                  Forge Athletic · 1:1 Live Telehealth Studio
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
                1:1 LIVE COACHING &amp; MOVEMENT HUD
              </h1>
              <p style={{ margin: '2px 0 0', color: 'var(--gray)', fontSize: 12, lineHeight: 1.35 }}>
                Direct 1:1 interactive video feed with {coachName}. Follow live pacing, joint alignment guides, and prescribed set cadences.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Waiver Gate, Phase 0 Medical Clearance Hold, or Pre-Session ERAP Gate + Live Video Camera HUD */}
        <div style={{ marginBottom: 16 }}>
          {!legalConsentGate.verified ? (
            <MandatoryLegalClickwrapGate defaultFullName={client?.full_name} />
          ) : medicalGate.blocked ? (
            <section
              role="alert"
              className="rounded-2xl border border-red-500/50 bg-red-950/35 p-6 text-zinc-100 shadow-2xl"
            >
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-red-400">
                ACSM / PAR-Q+ Phase 0 Medical Clearance Hold
              </div>
              <h2 className="mt-2 font-serif text-xl font-bold text-white">
                Physician Clearance Required Before Live Exercise Sessions
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                Your PAR-Q+ medical screening indicates cardiovascular, chest-pain, or dizziness/syncope criteria that require written clearance from a licensed physician before participating in live exercise sessions. Please provide your physician clearance note to {coachName} via secure messages.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/dashboard/messages"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 hover:bg-amber-300"
                >
                  Message {coachName} →
                </a>
                <a
                  href="/dashboard/settings"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-white/10"
                >
                  Review Medical Screening
                </a>
              </div>
            </section>
          ) : (
            <LivePreSessionErapGate
              athleteName={athleteName}
              coachName={coachName}
              hasExistingIntake={Boolean(intake)}
              initialErap={parqEval.erapRecord}
              initialEmergencyContactName={intake?.emergency_contact_name ?? ''}
              initialEmergencyContactPhone={intake?.emergency_contact_phone ?? ''}
            >
              <LiveVideoCameraHud
                coachName={coachName}
                clientName={athleteName}
                exerciseName={
                  (plan?.plan_json as { workouts?: Array<{ exercises?: Array<{ name?: string }> }> } | null)?.workouts?.[0]?.exercises?.[0]?.name ||
                  'Overhead Squat Assessment'
                }
                optPhase={plan?.phase_name ? `Phase ${plan.nasm_opt_phase}: ${plan.phase_name}` : 'Phase 2: Strength Endurance'}
                currentTempo={
                  (plan?.plan_json as { workouts?: Array<{ exercises?: Array<{ tempo?: string }> }> } | null)?.workouts?.[0]?.exercises?.[0]?.tempo ||
                  '2-0-2'
                }
                sessionId={sessionId}
                currentUserId={user.id}
                isCoach={false}
                isTeamSession={false}
              />
            </LivePreSessionErapGate>
          )}
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
