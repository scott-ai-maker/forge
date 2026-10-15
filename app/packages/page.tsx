import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import ForgeMembershipPlans from '@/components/packages/ForgeMembershipPlans'
import ForgeAddons from '@/components/packages/ForgeAddons'

export const metadata: Metadata = {
  title: 'Online Personal Training Memberships & Pricing | Forge Athletic',
  description:
    'Transparent, science-led online personal training memberships. Core ($49/mo), Plus ($99/mo), and 1-on-1 Coach Support ($199/mo) with NASM periodization and video coaching.',
  openGraph: {
    title: 'Online Personal Training Memberships & Pricing | Forge Athletic',
    description:
      'Transparent, science-led online personal training memberships. Core ($49/mo), Plus ($99/mo), and Coach Support ($199/mo).',
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
    'Evidence-based online personal training memberships featuring NASM OPT™ periodization, video form reviews, and coaching access.',
  image: 'https://forge-athletic.app/images/brand/logo-concept-1-kinetic-f.jpg',
  brand: {
    '@type': 'Brand',
    name: 'Forge Athletic',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '49.00',
    highPrice: '199.00',
    offerCount: '3',
    offers: [
      {
        '@type': 'Offer',
        name: 'Core Membership',
        price: '49.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Complete training app, customized 5-phase NASM OPT™ program, wearable sync, and telemetry logging.',
      },
      {
        '@type': 'Offer',
        name: 'Plus Membership',
        price: '99.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Core access plus 2 video form reviews per month and monthly program progressions.',
      },
      {
        '@type': 'Offer',
        name: 'Coach Support Membership',
        price: '199.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://forge-athletic.app/packages',
        description: 'Direct messaging with Coach Gordon, weekly form reviews, and monthly 1-on-1 strategy call.',
      },
    ],
  },
}

export default function PackagesPage() {
  return (
    <main id="main-content" className="packages-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
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
        <div className="forge-packages-intro">
          <p className="forge-eyebrow">Forge Athletic memberships</p>
          <h1
            id="forge-membership-title"
          >
            Train with a plan that fits your life.
          </h1>
          <p>Clear pricing. Practical sports science. Self-run training labs and limited-seat coach-certified programs.</p>
        </div>

        <ForgeMembershipPlans />
        <ForgeAddons />
        <p className="forge-billing-note">Memberships renew automatically until cancelled. Add-ons and one-to-one sessions are one-time payments. Checkout is processed securely by Stripe.</p>
      </div>

      <SiteFooter />
    </main>
  )
}
