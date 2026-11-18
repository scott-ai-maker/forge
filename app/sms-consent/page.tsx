import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import SmsConsentFormClient from '@/components/settings/SmsConsentFormClient'

export const metadata: Metadata = {
  title: 'SMS Notification Opt-In | Forge Athletic',
  description:
    'Opt in to receive optional transactional account and coaching SMS notifications from Forge Athletic (Forge Athletic Performance LLC).',
}

export default function SmsConsentPage() {
  return (
    <>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/terms', label: 'Terms and Conditions' },
          { href: '/privacy', label: 'Privacy Policy' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <main
        id="main-content"
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: 'clamp(5rem, 8vw, 7rem) clamp(16px, 3vw, 24px) 4rem',
          fontFamily: 'Raleway, sans-serif',
          color: '#F5F0E8',
          lineHeight: 1.65,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--gold-lt)',
            }}
          >
            Forge Athletic Account Notifications
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: '2rem',
              letterSpacing: '0.04em',
              margin: '0.5rem 0 0',
              color: '#FFFFFF',
            }}
          >
            SMS Text Alert Opt-In Form
          </h1>
          <p style={{ color: '#94A3B8', margin: '0.5rem 0 0', fontSize: '0.92rem' }}>
            Forge Athletic Performance LLC · Optional Account &amp; Coaching SMS Notifications
          </p>
        </div>

        <SmsConsentFormClient />

        <p style={{ fontSize: 12.5, color: '#94A3B8', textAlign: 'center', margin: 0 }}>
          Questions? Contact{' '}
          <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
            scott@forge-athletic.app
          </a>{' '}
          · Forge Athletic Performance LLC · 82 Wendell Ave., Ste 100, Pittsfield, MA 01201
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
