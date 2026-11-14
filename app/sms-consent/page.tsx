import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'

export const metadata: Metadata = {
  title: 'SMS Notification Opt-In | Forge Athletic',
  description:
    'Opt in to receive optional transactional account and coaching SMS notifications from Forge Athletic (Forge Athletic Performance LLC).',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: '#0B1120',
  color: '#FFFFFF',
  fontSize: 14,
  boxSizing: 'border-box',
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

        <form
          action="/auth/login"
          method="get"
          style={{
            background: 'rgba(14, 23, 38, 0.94)',
            border: '1px solid rgba(197, 160, 89, 0.4)',
            borderRadius: 12,
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          <input type="hidden" name="next" value="/dashboard/settings" />

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="sms-full-name" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Full Name
            </label>
            <input id="sms-full-name" name="name" type="text" autoComplete="name" placeholder="Jordan Taylor" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="sms-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Account Email Address
            </label>
            <input id="sms-email" name="email" type="email" autoComplete="email" placeholder="jordan@example.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label htmlFor="sms-phone" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Mobile Phone Number (Optional)
            </label>
            <input id="sms-phone" name="phone" type="tel" autoComplete="tel" placeholder="(413) 555-0199" style={inputStyle} />
          </div>

          <label
            htmlFor="sms-consent-checkbox"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px',
              borderRadius: 8,
              background: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              fontSize: 13,
              color: '#E2E8F0',
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            <input
              id="sms-consent-checkbox"
              name="sms_consent"
              type="checkbox"
              defaultChecked={false}
              style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
            />
            <span>
              By checking this box, I agree to receive transactional account and coaching text messages from{' '}
              <strong>Forge Athletic</strong> (Forge Athletic Performance LLC) at the mobile phone number provided, including live
              coaching session alerts, priority coach replies, weekly check-in reminders, and billing notifications. Message
              frequency varies (up to 6 messages per month). <strong>Message and data rates may apply.</strong> Reply{' '}
              <strong>STOP</strong> to opt out or <strong>HELP</strong> for help at any time. Consent is optional and is not a
              condition of purchase. View our{' '}
              <Link href="/privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline', fontWeight: 600 }}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" style={{ color: 'var(--gold-lt)', textDecoration: 'underline', fontWeight: 600 }}>
                Terms and Conditions
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            className="btn-gold"
            style={{
              width: '100%',
              cursor: 'pointer',
              padding: '12px 20px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
            }}
          >
            Save SMS Notification Preferences
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  )
}
