import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import GaaIcon from '@/components/ui/GaaIcon'
import PurchaseButton from '@/components/packages/PurchaseButton'
import CorporateInquiryForm from '@/components/corporate/CorporateInquiryForm'
import CorporateProposalStudio from '@/components/corporate/CorporateProposalStudio'

export const metadata: Metadata = {
  title: 'Workplace Wellness Plans | Forge Athletic',
  description:
    'Practical fitness and wellness support for teams, with training plans, coaching, and progress reviews.',
  openGraph: {
    title: 'Workplace Wellness Plans | Forge Athletic',
    description:
      'Bring practical fitness and wellness support to your team.',
  },
}

const CORPORATE_PILLARS = [
  {
    num: '01',
    title: 'App access for up to 10 team members',
    desc: 'Each person gets a personalized five-phase NASM OPT™ training plan, audio pacing tools, heart-rate-guided cardio, and monthly movement scans.',
  },
  {
    num: '02',
    title: 'Monthly live coaching session',
    desc: 'Coach Gordon leads a 60-minute online or on-site session about movement, strength, mobility, and managing everyday stress.',
  },
  {
    num: '03',
    title: 'Quarterly team progress review',
    desc: 'Review team participation, training progress, movement, and recovery.',
  },
  {
    num: '04',
    title: 'Workouts that travel with you',
    desc: 'Adapt training plans for travel days, hotel gyms, limited equipment, and changing schedules.',
  },
]

const CHALLENGES = [
  {
    title: 'Long hours sitting',
    desc: 'Desk work and long meetings can make it harder to move comfortably and stay active.',
  },
  {
    title: 'Changing schedules',
    desc: 'Travel, shift work, and busy schedules can disrupt sleep and make regular exercise difficult.',
  },
  {
    title: 'Stress and low energy',
    desc: 'Movement breaks, realistic workouts, and recovery habits can help people feel better throughout the day.',
  },
]

export default function CorporateRetainersPage() {
  return (
    <main id="main-content" style={{ minHeight: '100vh', background: 'var(--navy)', position: 'relative' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)' }} />

      <SiteHeader
        fixed
        links={[
          { href: '/packages', label: 'Memberships' },
          { href: '/audit', label: 'Movement assessment' },
          { href: '/apply', label: 'Find your starting point' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(80px, 12vw, 120px) 24px 60px', boxSizing: 'border-box' }}>
        {/* ── 1. HERO SECTION ── */}
        <div style={{ textAlign: 'center', maxWidth: 960, margin: '0 auto 72px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 30,
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.35)',
              color: 'var(--gold-lt)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="building" size={13} tone="gold" />
              <span>Wellness for teams</span>
            </span>
            <span style={{ color: 'var(--white)', opacity: 0.4 }}>|</span>
            <span>Team memberships</span>
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              lineHeight: 1.15,
              margin: '0 0 20px',
            }}
          >
            PRACTICAL TRAINING AND WELLNESS SUPPORT FOR TEAMS
          </h1>

          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: 'var(--gray)',
              lineHeight: 1.65,
              margin: '0 auto 36px',
              maxWidth: 820,
            }}
          >
            Help your team build healthy movement and exercise habits with personalized training plans, coaching, and progress reviews for up to 10 people.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="#proposal-studio"
              className="tactile-btn"
              style={{
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '14px 28px',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 800,
                boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GaaIcon name="printer" size={15} tone="inherit" />
              <span>Build a team proposal (PDF) ↓</span>
            </a>
            <Link
              href="/corporate/proposal"
              className="tactile-btn"
              style={{
                border: '1px solid rgba(197, 160, 89, 0.5)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--gold-lt)',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                padding: '14px 24px',
                borderRadius: 6,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>View team plan builder ↗</span>
            </Link>
            <a
              href="#pricing"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: 'var(--gray)',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                padding: '14px 20px',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              Team plan pricing
            </a>
          </div>

          {/* Corporate Leadership Team Hero Visual */}
          <div
            style={{
              maxWidth: 960,
              margin: '44px auto 0',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1.5px solid rgba(212,160,23,0.4)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,160,23,0.15)',
              background: '#04070D',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/package-corporate.jpg"
              alt="Forge Athletic workplace wellness coaching"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* ── 2. Common workplace challenges ── */}
        <div style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ margin: '0 0 8px', color: 'var(--gold-lt)', fontFamily: 'Raleway, sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              The Cost of Inaction
            </p>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
              Support movement and wellbeing at work
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
            {CHALLENGES.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <GaaIcon name="alert-triangle" size={24} tone="amber" />
                <h3 className="font-serif" style={{ fontSize: 18, color: '#FFFFFF', margin: 0, letterSpacing: '0.03em', fontWeight: 600 }}>
                  {ch.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.6, margin: 0 }}>
                  {ch.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. DELIVERABLES ── */}
        <div style={{ marginBottom: 96, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 12, padding: 'clamp(28px, 5vw, 48px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
              WHAT&apos;S INCLUDED IN A TEAM PLAN
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14.5, color: 'var(--gray)', margin: '6px 0 0' }}>
              Practical training and coaching support for up to 10 team members.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 24 }}>
            {CORPORATE_PILLARS.map((col, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 24, color: 'rgba(212,160,23,0.45)', fontWeight: 700 }}>{col.num}</span>
                <h4 className="font-serif" style={{ fontSize: 17, color: '#FFFFFF', margin: 0, letterSpacing: '0.03em', fontWeight: 600 }}>
                  {col.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.55 }}>
                  {col.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. PRICING SECTION ── */}
        <div id="pricing" style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
              TEAM PLAN OPTIONS
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14.5, color: 'var(--gray)', margin: '6px 0 0' }}>
              Consolidated corporate invoicing with single credit card or ACH settlement.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 24, maxWidth: 960, margin: '0 auto' }}>
            {/* Monthly plan */}
            <div
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 12,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Flexible Monthly Agreement
                </span>
                <h3 className="font-serif" style={{ fontSize: 24, color: '#FFFFFF', margin: '6px 0 0', letterSpacing: '0.03em', fontWeight: 600 }}>
                  Monthly team plan
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 38, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.02em' }}>$3,500</span>
                <span style={{ color: 'var(--gray)', fontSize: 14 }}>/ 30-day billing cycle</span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, margin: 0 }}>
                Covers up to 10 team members (about $350 per person/month). Includes 10 app accounts, a monthly live session, and quarterly progress reviews. Cancel with 30 days&apos; notice.
              </p>

              <div style={{ marginTop: 'auto' }}>
                <PurchaseButton
                  packageId="corporate"
                  cadence="monthly"
                  buttonLabel="Choose monthly team plan ($3,500/month)"
                  redirectNext="/corporate#pricing"
                />
              </div>
            </div>

            {/* Annual plan */}
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(212,160,23,0.1) 0%, rgba(8,14,20,0.9) 100%)',
                border: '2px solid var(--gold)',
                borderRadius: 12,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  background: 'var(--gold)',
                  color: '#080E14',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                SAVE $7,000 (2 MONTHS FREE)
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Annual plan
                </span>
                <h3 className="font-serif" style={{ fontSize: 24, color: '#FFFFFF', margin: '6px 0 0', letterSpacing: '0.03em', fontWeight: 600 }}>
                  Annual team plan
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 38, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.02em' }}>$35,000</span>
                <span style={{ color: 'var(--gray)', fontSize: 14 }}>/ year (paid upfront)</span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, margin: 0 }}>
                Full 12-month access for 10 team members (about $292 per person/month). Includes 12 live coaching sessions and an on-site workspace assessment.
              </p>

              <div style={{ marginTop: 'auto' }}>
                <PurchaseButton
                  packageId="corporate"
                  cadence="twelve_week"
                  buttonLabel="Choose annual team plan ($35,000/year)"
                  redirectNext="/corporate#pricing"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4.5. Team plan and cost estimator ── */}
        <div id="proposal-studio" style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              For workplaces
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#FFFFFF', margin: '6px 0 0', letterSpacing: '0.04em' }}>
              BUILD A TEAM PLAN
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14.5, color: 'var(--gray)', margin: '8px auto 0', maxWidth: 720 }}>
              Estimate costs for different team sizes and create a plan to share with your organization.
            </p>
          </div>

          <CorporateProposalStudio />
        </div>

        {/* ── 5. PROPOSAL REQUEST FORM ── */}
        <div
          id="proposal-form"
          style={{
            maxWidth: 780,
            margin: '0 auto',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 12,
            padding: 'clamp(28px, 5vw, 44px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <GaaMasterWatermarkSeal size={60} style={{ marginBottom: 12 }} />
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)', color: '#FFFFFF', margin: '0 0 8px', letterSpacing: '0.04em' }}>
              REQUEST A TEAM PLAN
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14, color: 'var(--gray)', margin: 0 }}>
              Need more than 10 memberships or on-site support? Tell us what your team needs and we&apos;ll follow up.
            </p>
          </div>

          <CorporateInquiryForm />
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
