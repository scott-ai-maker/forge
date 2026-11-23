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
    'Transparent, science-led online personal training memberships. Core ($49/mo with 7-day free trial), Plus ($99/mo), and 1-on-1 Coach Support ($299/mo) billed month-to-month with NASM OPT™ periodization and certified coach oversight.',
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
    'Evidence-based online personal training memberships featuring NASM OPT™ periodization, video form reviews, and direct certified coaching access.',
  image: 'https://forge-athletic.app/images/brand/logo-concept-1-kinetic-f.jpg',
  brand: {
    '@type': 'Brand',
    name: 'Forge Athletic',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '49.00',
    highPrice: '3500.00',
    offerCount: '5',
    offers: [
      {
        '@type': 'Offer',
        name: 'Core Lab Membership',
        price: '49.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Autonomous AI Foundation & Daily Posture Care: 5-Phase NASM OPT™ engine, 20m Express Mode, Coach Gordon’s real voice pacing, 33-point posture checks, and 1 complimentary onboarding Form Lab video diagnostic (first paid cycle; self-guided thereafter). $49/mo month-to-month with 7-day free trial.',
      },
      {
        '@type': 'Offer',
        name: 'Plus Membership',
        price: '99.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Guided Hybrid Coaching & Monthly Video Reviews: Form Lab slow-motion video reviews, unlimited Desk Ergonomics Audits, Multi-Day Travel Pass, phase-synced nutrition, and Priority Email access (24h). $99/mo month-to-month.',
      },
      {
        '@type': 'Offer',
        name: 'Coach Support Membership',
        price: '299.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: '1-on-1 Certified Personal Coaching & Direct Text Line: Direct SMS Text Line & Priority In-App Chat with Coach Gordon (24h SLA), 8 Form Lab reviews/month, bespoke OPT™ overrides, and quarterly mesh review.',
      },
      {
        '@type': 'Offer',
        name: 'Live 1-on-1 Studio Coaching Sessions',
        price: '180.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/LimitedAvailability',
        url: 'https://forge-athletic.app/packages#add-ons',
        description: 'Real-time 1-on-1 live video coaching with Coach Gordon in the high-definition Live Video Studio ($180 single, $660 4-pack, $1,240 8-pack). Strictly limited seat roster; availability dedicated exclusively to nights and weekends.',
      },
      {
        '@type': 'Offer',
        name: 'Team & Corporate Live Studio Retainer',
        price: '3500.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/LimitedAvailability',
        url: 'https://forge-athletic.app/corporate',
        description: 'Multi-athlete Team Live Video Studio coaching and personalized NASM OPT™ access for up to 10 team members ($3,500/mo or $35,000/yr).',
      },
    ],
  },
}

const COMPARISON_ROWS = [
  {
    feature: 'Personalized 5-Phase NASM OPT™ Plan',
    core: 'Included',
    plus: 'Included',
    support: 'Included (Coach-Certified)',
    note: 'Goal-matched periodization across stabilization, strength endurance, hypertrophy, max strength, and power.',
  },
  {
    feature: '33-Point MediaPipe Posture Check & Before/After Mesh',
    core: 'Unlimited (Local Browser)',
    plus: 'Unlimited (Local Browser)',
    support: 'Unlimited + Quarterly Coach Mesh Review',
    note: 'Runs 100% locally in your browser with zero cloud video uploads; tracks forward head tilt, shoulder symmetry, and pelvic balance.',
  },
  {
    feature: 'Desk Ergonomics Camera Audit & 5-Min Desk Reset',
    core: '1 Saved Profile + 5-Min Reset',
    plus: 'Unlimited Profiles + 5-Min Reset',
    support: 'Unlimited Profiles + Coach Review',
    note: '5-second seated camera angle audit (0–100 score) paired with targeted mobility resets between meetings.',
  },
  {
    feature: 'Coach Gordon Real Voice, 20m Express & Offline PWA',
    core: 'Included',
    plus: 'Included',
    support: 'Included',
    note: 'Coach Gordon’s real recorded voice briefings and tempo pacing, 20m Express Mode, and offline set/1RM logging.',
  },
  {
    feature: '30-Second Camera Readiness & 10s Joint Comfort',
    core: 'Single-Screen + Auto Warm-Up',
    plus: 'Full Dual-Screen + Trend Alerts',
    support: 'Full Dual-Screen + Coach Safety Queue',
    note: 'Overhead Squat & Scapular Wall Slide readiness checks with auto-injected warm-ups and daily Neck, Back & Hips comfort tracking.',
  },
  {
    feature: 'Phase-Synced Nutrition Blueprint',
    core: 'Add-on ($39 / 60 days)',
    plus: 'Included',
    support: 'Included (Coach-Calibrated)',
    note: 'General sports-conditioning TDEE, phase-synced macro splits, and workout meal-timing guidance (non-medical educational tool).',
  },
  {
    feature: 'Environment Swaps & Multi-Day Travel Pass',
    core: 'Single-Session Swaps · Multi-Day Add-on ($19)',
    plus: 'Single-Session + Multi-Day Travel Pass',
    support: 'Single-Session + Multi-Day Travel Pass',
    note: 'Adapt sessions across Home Dumbbells, Apartment Gym, Bodyweight Only, or Hotel Travel without losing OPT™ phase progression.',
  },
  {
    feature: 'Form Lab Technique Video Reviews',
    core: '1 onboarding clip (first paid cycle) · Add-on ($49 / 4 clips)',
    plus: '4 reviews / month',
    support: '8 reviews / month (24h Priority)',
    note: 'Guided 45° lift capture with biomechanical fault breakdown, corrective cues, and Coach Gordon coaching notes.',
  },
  {
    feature: 'Direct Access to Coach Gordon',
    core: 'Self-Guided (Automated Safety Alerts Only)',
    plus: 'Priority Email (1 Business Day)',
    support: 'Direct SMS + Priority In-App Chat (24h SLA)',
    note: 'Direct human access on Plus and Coach Support with your posture flags and readiness summary attached automatically.',
  },
  {
    feature: 'Biomechanical Movement Screen & Diagnostic',
    core: 'Add-on ($159) · Free Kickoff w/ HOLIDAY25',
    plus: 'Add-on ($159) · Free Kickoff w/ HOLIDAY25',
    support: 'Quarterly Coach Review + Free Kickoff w/ HOLIDAY25',
    note: '5-angle kinetic chain evaluation & corrective warm-up plan; HOLIDAY25 kickoff screen unlocks on first paid billing cycle.',
  },
  {
    feature: 'Coach Safety Gate & Program Oversight',
    core: 'Algorithmic OPT™ + Pinchy Joint Regression',
    plus: 'Algorithmic OPT™ + Monthly Async Review',
    support: 'Bespoke Coach Gordon Overrides & Sign-Off',
    note: 'Core and Plus use algorithmic NASM OPT™ guardrails with 1-tap joint regressions; Coach Support adds bespoke plan certification by Coach Gordon.',
  },
  {
    feature: 'Live 1-on-1 & Team Video Studio Sessions',
    core: 'Add-on ($180/ea · Packs Available)',
    plus: 'Add-on ($180/ea · Packs Available)',
    support: 'Quarterly + Add-on · Team Plans ($3,500/mo)',
    note: 'Real-time 60fps encrypted WebRTC coaching for 1:1 athletes and multi-athlete teams with live telestration & ERAP safety. Strictly limited seats; nights & weekends.',
  },
  {
    feature: 'Founding Cohort & Roster Limits',
    core: '50-Pass Founding Cohort',
    plus: '50-Pass Founding Cohort',
    support: 'Capped at 15 Active Seats',
    note: 'Founding Cohort 25% continuous-tier rate lock is limited to 50 passes across tiers; 1-on-1 Coach Support is strictly capped at 15 active seats.',
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
              Coach Scott Gordon · NASM-CPT® #1261890687 · Prior ACE-CPT (2008–2021) · ASTI CPR/AED
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
          <p className="forge-eyebrow">Remote &amp; Virtual Coaching Offerings</p>
          <h1 id="forge-membership-title">
            Train with a plan that fits your life.
          </h1>
          <p>
            Structured on the NASM Optimum Performance Training (OPT™) 5-phase methodology.
            Self-run training labs, guided hybrid coaching, and limited-seat coach-reviewed programs.
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

        {/* Live 1-on-1 & Team Video Studio Coaching Banner */}
        <section
          id="live-1-on-1"
          aria-labelledby="live-studio-banner-heading"
          style={{
            margin: '3rem auto 1.5rem',
            padding: '1.5rem 1.75rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(15, 23, 42, 0.96) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.38)',
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
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#7DD3FC',
                  background: 'rgba(56, 189, 248, 0.14)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '3px 9px',
                  borderRadius: '4px',
                }}
              >
                1:1 &amp; MULTI-ATHLETE TEAM STUDIO
              </span>
            </div>
            <h2 id="live-studio-banner-heading" style={{ margin: 0, color: '#FFF', fontSize: '1.3rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
              Live 1-on-1 &amp; Team Video Studio Coaching
            </h2>
            <p style={{ margin: '6px 0 0', color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.55 }}>
              Train live with Coach Gordon in the encrypted 60fps Forge Live Video Studio featuring real-time telestrator form markups, slow-motion replay analysis, ERAP safety verification, and instant NASM OPT™ updates. Book single 1:1 sessions ($180), discounted 4-pack ($660) or 8-pack ($1,240) blocks on nights &amp; weekends, or enroll up to 10 leaders in our multi-athlete Team Live Studio program ($3,500/mo · $35,000/yr).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
              View 1:1 Studio Packs ↓
            </a>
            <Link
              href="/corporate"
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'rgba(52, 211, 153, 0.14)',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                color: '#6EE7B7',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Team Live Training →
            </Link>
          </div>
        </section>

        {/* Optional Add-ons & Live Studio Sessions */}
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
              EVIDENCE-BASED OPT™ COACHING ARCHITECTURE
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
              A sustainable remote coaching relationship requires clear scope and progressive biological
              adaptation. Most fitness plateaus happen because trainees bounce between random workout apps
              without structured progressive overload or movement screening.
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
                <strong style={{ color: '#60A5FA', display: 'block', marginBottom: '0.35rem' }}>Flexible Tier Switching</strong>
                <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                  If work or budget tightens, step down to Core rather than quitting entirely. Maintain your strength baseline and training consistency without disruption.
                </p>
              </div>
              <div style={{ background: 'rgba(8, 14, 20, 0.6)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <strong style={{ color: '#34D399', display: 'block', marginBottom: '0.35rem' }}>Massachusetts Rate Value</strong>
                <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                  In Greater Boston, commercial in-person personal training often costs $120–$200/hour. Forge Athletic gives you a full month of structured remote coaching for a clear flat monthly rate.
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="forge-billing-note" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          Memberships bill month-to-month and renew automatically until cancelled ($0 cancellation fees; cancel anytime in 1 click inside Account Settings). Optional Performance Upgrades &amp; Diagnostics are one-time payments with no new subscription. Checkout is processed securely by Stripe with 256-bit SSL encryption.
        </p>
      </div>

      <SiteFooter />
    </main>
  )
}
