import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/auth/LogoutButton'
import SlotPicker from '@/components/booking/SlotPicker'
import SiteHeader from '@/components/ui/SiteHeader'
import GaaIcon from '@/components/ui/GaaIcon'

export const dynamic = 'force-dynamic'

export default async function BookPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: packages } = await supabase
    .from('client_packages')
    .select('id, package_name, sessions_remaining, expires_at')
    .eq('client_id', user.id)
    .gt('sessions_remaining', 0)
    .order('purchased_at', { ascending: false })

  const now = new Date()
  const activePackages = (packages ?? []).filter(
    p => !p.expires_at || new Date(p.expires_at) > now
  )

  const totalSessionsRemaining = activePackages.reduce(
    (sum, p) => sum + (p.sessions_remaining ?? 0),
    0
  )

  return (
    <main className="dashboard-book-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Schedule Consultation"
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

      <div className="dashboard-book-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a
            href="/dashboard"
            className="sgf-shell-back"
            style={{ color: 'var(--gold-lt)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
          >
            ← Back to Command Center
          </a>
        </div>

        {/* ── Executive Consultation Header ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,22,38,0.95) 0%, rgba(9,13,24,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 12,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
                fontWeight: 800,
              }}
            >
              1:1 Virtual Diagnostics & Strategy
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 26,
                color: 'var(--white)',
                letterSpacing: '0.04em',
                margin: '4px 0 2px',
                lineHeight: 1.2,
              }}
            >
              SCHEDULE MASTER CONSULTATION
            </h1>
            <p
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 300,
                fontSize: 14,
                color: 'var(--gray)',
                margin: 0,
              }}
            >
              Direct 60-minute live video session with Coach Gordon for kinetic screens, bar-path audits, or nutrition periodization.
            </p>
          </div>

          <div
            style={{
              padding: '12px 18px',
              background: 'rgba(212,160,23,0.1)',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: 8,
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Available Session Credits
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 28, fontWeight: 700, color: '#FFFFFF', lineHeight: 1, margin: '2px 0' }}>
              {totalSessionsRemaining} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif', color: 'var(--gold-lt)' }}>Credits</span>
            </div>
          </div>
        </div>

        {/* ── Consultation Track Selection Pills ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { icon: 'microscope' as const, title: 'Kinetic Chain Screen', desc: '5-checkpoint postural & OHSA screen' },
            { icon: 'video-studio' as const, title: 'Biomechanical Audit', desc: 'Real-time barbell joint-angle telemetry' },
            { icon: 'lightning' as const, title: 'Metabolic Nutrition', desc: 'Phase-matched macro & peri-workout plan' },
            { icon: 'travel' as const, title: 'Road-Warrior Travel', desc: 'Hotel gym & travel workout architecture' },
          ].map((track, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <GaaIcon name={track.icon} size={20} tone="gold" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{track.title}</div>
                <div style={{ fontSize: 10.5, color: 'var(--gray)' }}>{track.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Slot Picker Container ── */}
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 12,
            padding: '24px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          {!activePackages || activePackages.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <GaaIcon name="calendar" size={36} tone="gold" />
              <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, color: '#FFFFFF', margin: '12px 0 6px', letterSpacing: '0.04em' }}>
                ZERO ACTIVE CONSULTATION CREDITS
              </h3>
              <p
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 300,
                  fontSize: 14,
                  color: 'var(--gray)',
                  maxWidth: 480,
                  margin: '0 auto 20px',
                  lineHeight: 1.6,
                }}
              >
                You have utilized all allocated consultation credits for your current coaching cycle. Consultation allocations and retainers are managed via our web portal.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <a
                  href="/dashboard/messages"
                  className="sgf-button sgf-button-primary"
                  style={{ padding: '12px 26px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <GaaIcon name="message" size={15} tone="dark" />
                  <span>Message Coach Gordon to Request Session</span>
                </a>
                <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                  Membership options can be adjusted at <strong style={{ color: 'var(--gold-lt)' }}>forge-athletic.app</strong>.
                </span>
              </div>
            </div>
          ) : (
            <SlotPicker packages={activePackages} />
          )}
        </div>
      </div>
    </main>
  )
}
