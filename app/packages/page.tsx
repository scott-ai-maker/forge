import type { Metadata } from 'next'
import { PACKAGES, COACHING_ADDONS } from '@/lib/stripe'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import PackagesStudioClient from '@/components/packages/PackagesStudioClient'

export const metadata: Metadata = {
  title: 'Concierge Coaching Pathways & Retainers',
  description: 'Evidence-based NASM OPT™ sports science memberships, bespoke neuromuscular periodization, and clinical performance retainers.',
  openGraph: {
    title: 'Concierge Coaching Pathways & Retainers | Gordon Athletic Advisory',
    description: 'Evidence-based NASM OPT™ sports science memberships, bespoke neuromuscular periodization, and clinical performance retainers.',
  },
}

const PACKAGE_IMAGES: Record<string, string> = {
  lab: '/images/package-lab.jpg',
  alumni: '/images/package-alumni.jpg',
  starter: '/images/package-starter.jpg',
  momentum: '/images/package-momentum.jpg',
  transformation: '/images/package-transformation.jpg',
  corporate: '/images/package-corporate.jpg',
}

export default function PackagesPage() {
  return (
    <main id="main-content" className="packages-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        links={[
          { href: '/audit', label: '3D AI Audit' },
          { href: '/apply', label: 'Diagnostic Quiz' },
          { href: '/dashboard', label: 'Dashboard' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <div className="packages-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(18px, 3.5vw, 40px) clamp(10px, 2vw, 24px)', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 4vw, 48px)' }}>
          <div className="crest-badge" style={{ marginBottom: 14 }}>
            <span>Sports Science Memberships &amp; Private Retainers</span>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
              color: 'var(--white)',
              letterSpacing: '0.03em',
              margin: '0 0 12px',
              lineHeight: 1.1,
              fontWeight: 700,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            Sovereign Advisory Pathways
          </h1>
          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 300,
              fontSize: 16,
              color: 'var(--gray)',
              maxWidth: 720,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Individualized neuromuscular periodization, Tanaka heart rate stage cardio, 3D muscle recovery telemetry, and white-glove master accountability tailored to your schedule.
          </p>
        </div>

        <PackagesStudioClient
          packages={PACKAGES}
          addons={COACHING_ADDONS}
          packageImages={PACKAGE_IMAGES}
        />

        <p
          style={{
            marginTop: 48,
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            color: 'var(--gray)',
            lineHeight: 1.7,
            textAlign: 'center',
          }}
        >
          Checkout is processed securely by Stripe with 256-bit encryption. Concierge memberships auto-renew each 30-day billing cycle and can be managed or paused anytime.
        </p>
      </div>

      <SiteFooter />
    </main>
  )
}
