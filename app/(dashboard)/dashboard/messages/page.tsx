import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import MessageThreadClient from '@/components/messages/MessageThreadClient'
import SiteHeader from '@/components/ui/SiteHeader'
import GaaIcon from '@/components/ui/GaaIcon'
import { CoachGordonHeaderButton, CoachGordonDualConciergeCard } from '@/components/messages/CoachGordonQuickPrompt'
import { requireSurfaceRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function ClientMessagesPage() {
  const { user } = await requireSurfaceRole('client')

  const { data: clientRow, error: clientError } = await supabaseAdmin()
    .from('clients')
    .select('designated_coach_id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (clientError) {
    console.error(`Messages page: failed to load client record for user ${user.id}: ${clientError.message}`)
  }

  return (
    <main className="dashboard-messages-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Concierge Line"
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

      <div className="dashboard-messages-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Executive Header Banner ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,22,38,0.98) 0%, rgba(9,13,24,0.98) 100%)',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 12,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 18,
            boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 800,
                  background: 'rgba(16,185,129,0.15)',
                  color: '#34D399',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(16,185,129,0.35)',
                }}
              >
                ● Coach Gordon Active
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>Priority Concierge Response &lt; 12h</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 26,
                color: 'var(--white)',
                letterSpacing: '0.04em',
                margin: '6px 0 4px',
                lineHeight: 1.2,
              }}
            >
              PRIVATE CONCIERGE LINE
            </h1>
            <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--gray)', margin: 0, fontSize: 13, lineHeight: 1.4 }}>
              Direct private advisory with Master Coach Gordon for program calibration, video critiques, and nutrition adjustments.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <CoachGordonHeaderButton />
            <Link
              href="/dashboard/fitness?workspace=video"
              style={{
                padding: '11px 18px',
                fontSize: 13,
                fontWeight: 800,
                fontFamily: 'Raleway, sans-serif',
                border: '1px solid #D4AF37',
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: '#F5F0E8',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
            >
              <GaaIcon name="video-studio" size={16} tone="gold" />
              <span>Video Critique Studio</span>
            </Link>
            <Link
              href="/dashboard/book"
              style={{
                padding: '11px 20px',
                fontSize: 13,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                letterSpacing: '0.08em',
                fontWeight: 700,
                textTransform: 'uppercase',
                border: '1px solid #D4AF37',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#080E14',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(212,160,23,0.35)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
            >
              <GaaIcon name="calendar" size={16} tone="inherit" />
              <span>Book Live Session</span>
            </Link>
          </div>
        </div>

        {/* ── 24/7 AI Concierge Banner ── */}
        <CoachGordonDualConciergeCard />

        {/* ── Message Thread Container ── */}
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          {!clientRow?.designated_coach_id ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <GaaIcon name="hourglass" size={32} tone="gold" />
              <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
                ASSIGNING YOUR MASTER COACH
              </h3>
              <p style={{ color: 'var(--gray)', fontFamily: 'Raleway, sans-serif', fontSize: 14, maxWidth: 500, margin: 0 }}>
                Your private human messaging line is being calibrated. In the meantime, Coach Gordon AI is active 24/7 above for immediate training, nutrition, and exercise questions.
              </p>
            </div>
          ) : (
            <MessageThreadClient
              currentUserId={user.id}
              role="client"
              recipientName="Master Coach Scott Gordon"
              recipientRoleTitle="CSCS · Olympic Specialist · Lead Concierge"
              recipientAvatar="/images/coach-gordon-shield-logo.jpg"
            />
          )}
        </div>
      </div>
    </main>
  )
}

