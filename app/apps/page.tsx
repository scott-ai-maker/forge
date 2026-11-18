import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MobileAppPromoSection from '@/components/marketing/MobileAppPromoSection'
import GaaIcon from '@/components/ui/GaaIcon'
import { AppleLogoIcon, AndroidLogoIcon } from '@/components/marketing/AppStoreBadges'

export const metadata: Metadata = {
  title: 'Mobile Web App (PWA) & Training Companion | Forge Athletic',
  description:
    'Install the Forge Athletic Progressive Web App (PWA) on iPhone, Android, or desktop for local 33-point camera posture checks, Coach Gordon’s real voice pacing, and offline workout logging.',
  openGraph: {
    title: 'Forge Athletic Mobile Web App (PWA) & Companion',
    description:
      'Zero-download Progressive Web App with local 33-point camera posture screening, offline set logging, and NASM OPT™ training.',
    url: 'https://forge-athletic.app/apps',
    siteName: 'Forge Athletic',
    images: [
      {
        url: '/images/mobile-apps-telemetry.jpg',
        width: 1200,
        height: 630,
        alt: 'Forge Athletic Mobile Training Companion',
      },
    ],
  },
}

const appsStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Forge Athletic Training Companion',
  operatingSystem: 'Web, iOS Safari (PWA), Android Chrome (PWA)',
  applicationCategory: 'HealthApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'Progressive Web App training companion with local in-browser 33-point posture screening, offline set logging, NASM OPT™ environment switching, and Coach Gordon’s real voice pacing.',
  publisher: {
    '@type': 'Organization',
    name: 'Forge Athletic',
    url: 'https://forge-athletic.app',
  },
}

export default function AppsPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#080E14' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appsStructuredData) }}
      />
      <SiteHeader
        badgeText="Mobile Apps &amp; Companions"
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Memberships' },
          { href: '/credentials', label: 'Credentials' },
          { href: '/audit', label: 'Movement Screen' },
          { href: '/auth/login', label: 'Log In' },
        ]}
      />

      {/* Hero Overview */}
      <section
        style={{
          padding: 'clamp(3rem, 6vw, 4.5rem) 1.5rem 2rem',
          maxWidth: 1200,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            borderRadius: 20,
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--gold-lt)',
            }}
          >
            Tactical Training Companions
          </span>
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            color: '#FFFFFF',
            letterSpacing: '0.03em',
            margin: '0 auto 16px',
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          MOBILE TRAINING <span style={{ color: 'var(--gold-lt)' }}>WITHOUT HARDWARE FRICTION</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
            color: '#CBD5E1',
            lineHeight: 1.6,
            maxWidth: 720,
            margin: '0 auto 2rem',
          }}
        >
          Install Forge Athletic instantly to your iPhone or Android Home Screen as a Progressive Web App (PWA) for local 33-point camera posture checks, offline set logging, and Coach Gordon’s real voice pacing.
        </p>

        {/* Quick Platform Jump Anchors */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="#ios"
            className="tactile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <AppleLogoIcon size={16} />
            <span>iPhone &amp; iOS (PWA / Coming Soon)</span>
          </a>

          <a
            href="#pwa"
            className="tactile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: 'rgba(212, 160, 23, 0.12)',
              border: '1px solid var(--gold)',
              color: 'var(--gold-lt)',
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <span>⚡</span>
            <span>Progressive Web App (Live Today)</span>
          </a>

          <a
            href="#android"
            className="tactile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: 'rgba(61, 220, 132, 0.08)',
              border: '1px solid rgba(61, 220, 132, 0.3)',
              color: '#3DDC84',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <AndroidLogoIcon size={16} color="#3DDC84" />
            <span>Android (PWA / Coming Soon)</span>
          </a>
        </div>
      </section>

      {/* Embedded Full Interactive Mobile Showcase */}
      <div id="pwa">
        <MobileAppPromoSection />
      </div>

      {/* Compliance & Zero In-App Purchase Guarantee Card */}
      <section style={{ maxWidth: 1080, margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,22,38,0.9) 0%, rgba(9,13,24,0.9) 100%)',
            border: '1px solid rgba(197, 160, 89, 0.25)',
            borderRadius: 12,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div style={{ color: 'var(--gold-lt)', marginTop: 4 }}>
            <GaaIcon name="shield-check" size={24} tone="gold" />
          </div>
          <div>
            <h4
              className="font-serif"
              style={{ color: '#FFFFFF', fontSize: 16, margin: '0 0 6px', letterSpacing: '0.03em' }}
            >
              ZERO IN-APP PURCHASE ARCHITECTURE &amp; STORE COMPLIANCE
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
              In full accordance with <strong>Apple App Store Guideline 3.1.3 (Multiplatform / Reader Services)</strong> and <strong>Google Play store policies</strong>, Forge Athletic mobile apps are strictly dedicated gym telemetry and workout tracking companions. No memberships, retainers, or digital add-ons can be purchased within mobile helper apps; all subscription management occurs securely on our web portal at <strong>forge-athletic.app</strong>.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
