import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import ForgeMembershipPlans from '@/components/packages/ForgeMembershipPlans'
import ForgeAddons from '@/components/packages/ForgeAddons'

export const metadata: Metadata = {
  title: 'Online Personal Training Memberships & Pricing | Forge Athletic',
  description:
    'Transparent, science-led online personal training memberships. Core ($49/mo or $399/yr with 7-day trial), Plus ($99/mo or $899/yr), and 1-on-1 Coach Support ($299/mo) with NASM periodization and master coach oversight.',
  openGraph: {
    title: 'Online Personal Training Memberships & Pricing | Forge Athletic',
    description:
      'Transparent, science-led online personal training memberships. Core ($49/mo), Plus ($99/mo), and Coach Support ($299/mo). Headquartered in Massachusetts, coaching nationwide.',
    url: 'https://forge-athletic.app/packages',
    siteName: 'Forge Athletic',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

const packagesStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Forge Athletic Personal Training Memberships',
  description:
    'Evidence-based online personal training memberships featuring NASM OPT™ periodization, video form reviews, and master coaching access.',
  image: 'https://forge-athletic.app/images/brand/logo-concept-1-kinetic-f.jpg',
  brand: {
    '@type': 'Brand',
    name: 'Forge Athletic',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '49.00',
    highPrice: '1240.00',
    offerCount: '4',
    offers: [
      {
        '@type': 'Offer',
        name: 'Core Membership',
        price: '49.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Complete autonomous training app, customized 5-phase NASM OPT™ program, 33-point posture screening, wearable sync, and telemetry logging with 7-day free trial.',
      },
      {
        '@type': 'Offer',
        name: 'Plus Membership',
        price: '99.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Guided hybrid coaching including full nutrition planning, travel training tools, weekly Proof-of-Work dossiers, and 4 video form reviews per month.',
      },
      {
        '@type': 'Offer',
        name: 'Coach Support Membership',
        price: '299.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Direct 1-on-1 messaging with Coach Gordon, quarterly video strategy reviews, 8 video reviews per month in Form Lab, and Master Coach Safety Gate. Strictly capped at 15 athletes.',
      },
      {
        '@type': 'Offer',
        name: 'Live 1-on-1 Studio Coaching Sessions',
        price: '180.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/LimitedAvailability',
        url: 'https://forge-athletic.app/packages#add-ons',
        description: 'Real-time 1-on-1 live video coaching with Coach Gordon in the high-definition Live Video Studio. Strictly limited seat roster; availability dedicated exclusively to nights and weekends.',
      },
    ],
  },
}

const COMPARISON_ROWS = [
  {
    feature: 'Personalized 5-Phase NASM OPT™ Plan',
    core: 'Included',
    plus: 'Included',
    support: 'Included (Master-Certified)',
    note: 'Periodized stabilization, strength endurance, hypertrophy, max strength, and power.',
  },
  {
    feature: '33-Point MediaPipe Movement & Posture Screen',
    core: 'Autonomous',
    plus: 'Autonomous + Guided',
    support: 'Full Coach Review & Correctives',
    note: 'Identifies kinetic chain compensations (knee valgus, forward lean, asymmetrical shift).',
  },
  {
    feature: 'In-Gym Audio Cadence & Rest Timers',
    core: 'Included',
    plus: 'Included',
    support: 'Included',
    note: 'Zero-distraction HUD with tabular numbers, tempo pulses, and screen wake lock.',
  },
  {
    feature: 'Wearable Telemetry & Recovery Sync',
    core: 'Self-Serve',
    plus: 'Active Sync',
    support: 'Continuous Autoregulation',
    note: 'Ingests Apple Watch, Garmin, Polar, and Health Connect signals.',
  },
  {
    feature: 'Nutrition & Macronutrient Blueprint',
    core: 'Add-on ($39)',
    plus: 'Included',
    support: 'Included (Bespoke Calibration)',
    note: 'TDEE, macro split, meal timing, and competition or fat loss periodization.',
  },
  {
    feature: 'Travel Training Pass & Hotel Swaps',
    core: 'Add-on ($19)',
    plus: 'Included',
    support: 'Included',
    note: 'One-tap workout adaptations for limited hotel dumbbells, bands, and bodyweight.',
  },
  {
    feature: 'Form Lab Technique Video Reviews',
    core: 'Add-on ($49 pack)',
    plus: '4 reviews / month',
    support: '8 reviews / month (Priority)',
    note: 'Frame-by-frame concentric velocity, bar path, and joint angle breakdown.',
  },
  {
    feature: 'Direct Coach Messaging Access',
    core: '—',
    plus: '—',
    support: 'Direct 1:1 (24h SLA)',
    note: 'Direct messaging with Coach Gordon during dedicated advisory windows.',
  },
  {
    feature: 'Biomechanical & Diagnostic Testing',
    core: 'Add-on ($159)',
    plus: 'Add-on ($159)',
    support: 'Quarterly Diagnostic Screen',
    note: 'Comprehensive 5-angle movement screen & kinetic chain evaluation with Coach Gordon.',
  },
  {
    feature: 'Master Coach Safety Gate Oversight',
    core: 'Algorithmic',
    plus: 'Algorithmic',
    support: 'Certified by Scott Gordon',
    note: 'Every training phase and deload cycle personally validated by Coach Gordon.',
  },
  {
    feature: 'Live 1-on-1 Studio Sessions',
    core: 'Add-on ($180/ea)',
    plus: 'Add-on ($180/ea)',
    support: 'Quarterly + Add-on',
    note: 'Real-time video coaching in Live Studio. Strictly limited seats; dedicated availability to nights & weekends.',
  },
  {
    feature: 'Athlete Roster Limit',
    core: 'Unlimited',
    plus: 'Open Roster',
    support: 'Strictly Capped at 15',
    note: 'Roster cap protects coach attention, response speed, and programming depth.',
  },
]

export default function PackagesPage() {
  return (
    <main id="main-content" className="packages-page" style={{ minHeight: '100dvh', background: 'var(--navy)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(packagesStructuredData) }}
      />
      <SiteHeader
        links={[
          { href: '/audit', label: 'Movement assessment' },
          { href: '/apply', label: 'Find your starting point' },
          { href: '/dashboard', label: 'Log in' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <div className="packages-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(18px, 3.5vw, 40px) clamp(10px, 2vw, 24px)', boxSizing: 'border-box' }}>
        
        {/* Experience & Massachusetts Regional Authority Banner */}
        <section
          style={{
            marginBottom: '2rem',
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(8, 14, 24, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#34D399',
                background: 'rgba(52, 211, 153, 0.12)',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
              }}
            >
              MASSACHUSETTS &amp; NATIONWIDE
            </span>
            <span style={{ color: '#E2E8F0', fontSize: '0.92rem', fontWeight: 600 }}>
              Master Coach Scott Gordon · 18+ Years Coaching Since 2008 · NASM-CPT® #1261890687
            </span>
          </div>
          <Link
            href="/credentials"
            style={{
              color: 'var(--gold-lt)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <span>Verify Credentials</span>
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        {/* Intro */}
        <div className="forge-packages-intro">
          <p className="forge-eyebrow">NASM VCS Certified Offerings</p>
          <h1 id="forge-membership-title">
            Train with a plan that fits your life.
          </h1>
          <p>
            Structured on the National Academy of Sports Medicine Virtual Coaching Specialization (NASM VCS) standards. 
            Self-run training labs, guided hybrid coaching, and limited-seat coach-certified programs.
          </p>
        </div>

        {/* Membership Plans Grid */}
        <ForgeMembershipPlans />

        {/* NASM VCS Feature Comparison Matrix */}
        <section
          style={{
            margin: '4rem auto 2rem',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            overflowX: 'auto',
          }}
          aria-labelledby="comparison-title"
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p className="forge-eyebrow" style={{ marginBottom: '0.5rem' }}>Full Transparency</p>
            <h2 id="comparison-title" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#FFF', margin: '0 0 0.5rem' }}>
              Compare Membership Features
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', margin: 0 }}>
              Every tier delivers evidence-based periodization. Choose the level of personal coach oversight you need.
            </p>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              minWidth: '680px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(245, 158, 11, 0.3)' }}>
                <th style={{ padding: '1rem', color: '#CBD5E1', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Core Feature
                </th>
                <th style={{ padding: '1rem', color: 'var(--gold-lt)', fontSize: '1rem', fontWeight: 700 }}>
                  Core ($49/mo)
                </th>
                <th style={{ padding: '1rem', color: '#60A5FA', fontSize: '1rem', fontWeight: 700 }}>
                  Plus ($99/mo)
                </th>
                <th style={{ padding: '1rem', color: '#34D399', fontSize: '1rem', fontWeight: 700 }}>
                  Coach Support ($299/mo)
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: idx % 2 === 0 ? 'rgba(8, 14, 20, 0.3)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '1rem', color: '#F1F5F9', fontWeight: 600, fontSize: '0.92rem' }}>
                    <div>{row.feature}</div>
                    <div style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '3px', fontWeight: 400 }}>{row.note}</div>
                  </td>
                  <td style={{ padding: '1rem', color: row.core === '—' ? '#475569' : '#CBD5E1', fontSize: '0.88rem' }}>
                    {row.core}
                  </td>
                  <td style={{ padding: '1rem', color: row.plus === '—' ? '#475569' : '#E2E8F0', fontSize: '0.88rem' }}>
                    {row.plus}
                  </td>
                  <td style={{ padding: '1rem', color: '#34D399', fontWeight: 600, fontSize: '0.88rem' }}>
                    {row.support}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Live 1-on-1 Studio Coaching Announcement Banner */}
        <div
          id="live-1-on-1"
          style={{
            margin: '3rem auto 1.5rem',
            padding: '1.5rem 1.75rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ maxWidth: '820px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#D4AF37',
                  background: 'rgba(212, 175, 55, 0.18)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  padding: '3px 9px',
                  borderRadius: '4px',
                }}
              >
                STRICTLY LIMITED SEATS
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#34D399',
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  padding: '3px 9px',
                  borderRadius: '4px',
                }}
              >
                NIGHTS &amp; WEEKENDS ONLY
              </span>
            </div>
            <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
              Live 1-on-1 Studio Coaching
            </h3>
            <p style={{ margin: '6px 0 0', color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.55 }}>
              Train in real time with Coach Gordon in the high-definition Live Video Studio featuring real-time telestrator form markups, slow-motion replay analysis, and instant NASM OPT™ program updates. To guarantee premier coaching quality and personal attention, active client seats are strictly capped with booking reserved exclusively for evening (night) and weekend training blocks.
            </p>
          </div>
          <a
            href="#add-ons"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'var(--gold)',
              color: '#080E14',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(212, 160, 23, 0.25)',
            }}
          >
            View 1:1 Packages ↓
          </a>
        </div>

        {/* Add-ons & Private Sessions */}
        <ForgeAddons />

        {/* Value Proposition & Massachusetts Coaching Philosophy */}
        <section
          style={{
            margin: '3.5rem auto 1rem',
            padding: '2.5rem 2rem',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(8, 14, 24, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--gold-lt)',
              }}
            >
              NASM VIRTUAL COACHING SPECIALIST (VCS) STANDARD
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
                color: '#FFF',
                margin: '0.6rem 0 1rem',
              }}
            >
              Why We Structure Coaching in 3 Dedicated Tiers
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Following Chapter 2 of the NASM Virtual Coaching curriculum, a sustainable coaching relationship requires 
              clear scope and progressive biological adaptation. Most fitness plateaus happen because trainees bounce 
              between random workout apps without structured progressive overload or movement screening.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                textAlign: 'left',
                marginTop: '1.5rem',
              }}
            >
              <div style={{ background: 'rgba(8, 14, 20, 0.6)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <strong style={{ color: 'var(--gold-lt)', display: 'block', marginBottom: '0.35rem' }}>3-Month Biological Runway</strong>
                <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                  Neuromuscular stabilization and kinetic adaptations require at least 8 to 12 weeks of continuous progression before advancing to maximal load.
                </p>
              </div>
              <div style={{ background: 'rgba(8, 14, 20, 0.6)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <strong style={{ color: '#60A5FA', display: 'block', marginBottom: '0.35rem' }}>Downsell Retention Safety</strong>
                <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                  If work or budget tightens, step down to Core rather than quitting entirely. Maintain your strength baseline and workout streak without disruption.
                </p>
              </div>
              <div style={{ background: 'rgba(8, 14, 20, 0.6)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <strong style={{ color: '#34D399', display: 'block', marginBottom: '0.35rem' }}>Massachusetts Senior Rates</strong>
                <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                  In Greater Boston, commercial personal training costs $120–$200/hour. Forge Athletic gives you an entire month of master coaching for less than the cost of one in-person session.
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="forge-billing-note" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          Memberships renew automatically until cancelled. Add-ons and one-to-one sessions are one-time payments. 
          Checkout is processed securely by Stripe with 256-bit SSL encryption.
        </p>
      </div>

      <SiteFooter />
    </main>
  )
}
