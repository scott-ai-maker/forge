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
    <main className="dashboard-book-page" style={{ minHeight: '100dvh', background: 'var(--navy)' }} suppressHydrationWarning>
      <SiteHeader
        badgeText="Book a session"
        links={[
          { href: '/dashboard', label: 'Today' },
          { href: '/dashboard/fitness', label: 'Training & progress' },
          { href: '/dashboard/dossier', label: 'Progress summary' },
          { href: '/dashboard/book', label: 'Book a session' },
          { href: '/dashboard/messages', label: 'Messages' },
          { href: '/dashboard/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div className="dashboard-book-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)', display: 'flex', flexDirection: 'column', gap: 24 }} suppressHydrationWarning>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a
            href="/dashboard"
            className="sgf-shell-back"
            style={{ color: 'var(--gold-lt)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
          >
            ← Back to today
          </a>
        </div>

        {/* ── Session booking header ── */}
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
              Diagnostic &amp; Benchmark Testing
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
              Diagnostic Assessment Booking
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
              Comprehensive kinetic chain movement screen and baseline performance evaluation with Coach Gordon.
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
              Available Diagnostic Credits
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 28, fontWeight: 700, color: '#FFFFFF', lineHeight: 1, margin: '2px 0' }}>
              {totalSessionsRemaining} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif', color: 'var(--gold-lt)' }}>credits</span>
            </div>
          </div>
        </div>

        {/* ── Consultation Track Selection Pills ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { icon: 'microscope' as const, title: 'Movement Screen', desc: '5-angle OHSA & kinetic chain compensation check' },
            { icon: 'video-studio' as const, title: 'Diagnostic Benchmark', desc: 'Baseline endurance, power & movement audit' },
            { icon: 'lightning' as const, title: 'Corrective Strategy', desc: 'Targeted mobility & activation warm-up plan' },
            { icon: 'travel' as const, title: 'Periodization Review', desc: 'Align NASM OPT™ phases with your goals' },
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
          {(!activePackages || activePackages.length === 0) && (
            <div
              style={{
                marginBottom: 20,
                padding: '14px 18px',
                background: 'rgba(212,160,23,0.08)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GaaIcon name="ticket" size={20} tone="gold" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    0 Diagnostic Credits Active
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                    Browsing live open slots with Coach Gordon. To book a 1-on-1 kinetic assessment, acquire a diagnostic package.
                  </div>
                </div>
              </div>
              <a
                href="/packages"
                className="tactile-btn"
                style={{
                  padding: '8px 16px',
                  background: 'rgba(212, 160, 23, 0.15)',
                  border: '1px solid rgba(212, 160, 23, 0.5)',
                  color: 'var(--gold-lt)',
                  borderRadius: 5,
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>View Packages →</span>
              </a>
            </div>
          )}

          <SlotPicker packages={activePackages ?? []} />
        </div>
      </div>
    </main>
  )
}
