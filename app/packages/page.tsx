import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import ForgeMembershipPlans from '@/components/packages/ForgeMembershipPlans'

export const metadata: Metadata = {
  title: 'Forge Athletic Memberships',
  description: 'Choose Forge Athletic Core, Pro Athlete, or Transformation Direct sports-science coaching.',
  openGraph: {
    title: 'Forge Athletic Memberships',
    description: 'Practical, science-led training memberships with clear monthly and annual pricing.',
  },
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
        <div className="forge-packages-intro">
          <p className="forge-eyebrow">Forge Athletic memberships</p>
          <h1
            id="forge-membership-title"
          >
            Train with a plan that fits your life.
          </h1>
          <p>Clear pricing. Practical sports science. Coaching support when you need it.</p>
        </div>

        <ForgeMembershipPlans />
        <p className="forge-billing-note">Recurring plans renew automatically until cancelled. Checkout is processed securely by Stripe.</p>
      </div>

      <SiteFooter />
    </main>
  )
}
