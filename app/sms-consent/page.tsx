import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import { NOTIFICATION_CATEGORIES } from '@/lib/notification-catalog'

export const metadata: Metadata = {
  title: 'SMS Notification Opt-In & Consent Workflow | Forge Athletic',
  description:
    'Public verification preview of the Forge Athletic authenticated Account Settings SMS opt-in consent workflow, disclosures, and opt-out controls.',
  robots: { index: false, follow: false },
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
  color: '#FFFFFF',
  fontSize: 14,
}

export default function SmsConsentVerificationPage() {
  return (
    <>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/terms#sms-terms', label: 'SMS Terms' },
          { href: '/privacy#sms-privacy', label: 'SMS Privacy' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <main
        id="main-content"
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: 'clamp(5rem, 8vw, 7rem) clamp(16px, 3vw, 24px) 4rem',
          fontFamily: 'Raleway, sans-serif',
          color: '#F5F0E8',
          lineHeight: 1.65,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--gold-lt)',
            }}
          >
            Carrier Compliance &amp; Member Transparency
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: '2.1rem',
              letterSpacing: '0.04em',
              margin: '0.5rem 0 0',
              color: '#FFFFFF',
            }}
          >
            SMS Notification Opt-In Workflow
          </h1>
          <p style={{ color: '#94A3B8', margin: '0.5rem 0 0', fontSize: '0.92rem' }}>
            Forge Athletic Performance LLC · Program: Forge Athletic Account &amp; Coaching Alerts
          </p>
        </div>

        <p style={{ fontSize: '0.95rem', color: '#CBD5E1', marginBottom: '1.5rem' }}>
          Forge Athletic sends transactional text messages strictly to authenticated adult members who explicitly opt in inside{' '}
          <strong>Account Settings &gt; Notification Preferences</strong>. Below is the exact unauthenticated verification preview of
          the member opt-in form (rendered inside the authenticated portal at <code>/dashboard/settings</code>), showing the optional
          phone input and the unchecked affirmative SMS consent checkbox.
        </p>

        <form
          action="/auth/login"
          method="get"
          aria-label="Member Account Settings SMS Opt-In Form"
          style={{
            background: 'rgba(14, 23, 38, 0.92)',
            border: '1px solid rgba(197, 160, 89, 0.4)',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          <input type="hidden" name="next" value="/dashboard/settings" />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
              paddingBottom: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: 'var(--gold-lt)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            <span>Account Settings · Notification Preferences</span>
            <span>forge-athletic.app</span>
          </div>

          <h2 style={{ margin: '0 0 6px', color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>How should we reach you?</h2>

          <label style={rowStyle}>
            <input type="checkbox" name="pushEnabled" defaultChecked />
            <span>Push notifications</span>
          </label>

          <label style={rowStyle}>
            <input type="checkbox" name="emailEnabled" defaultChecked />
            <span>Email</span>
          </label>

          <label style={rowStyle}>
            <input type="checkbox" name="smsEnabled" defaultChecked />
            <span>
              Text messages (Optional)
              <small style={{ display: 'block', color: '#94A3B8' }}>
                Only for time-sensitive items: live coaching sessions, priority coach replies, check-in reminders, and urgent billing alerts.
              </small>
            </span>
          </label>

          <div style={{ padding: '12px 0 8px 28px' }}>
            <label htmlFor="sms-preview-phone" style={{ display: 'block', fontSize: 12, color: '#CBD5E1', marginBottom: 6 }}>
              Mobile phone number (optional)
            </label>
            <input
              id="sms-preview-phone"
              name="phone"
              type="tel"
              placeholder="(413) 555-0199"
              style={{
                width: '100%',
                maxWidth: 280,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: '#0B1120',
                color: '#FFFFFF',
              }}
            />

            <label style={{ ...rowStyle, borderBottom: 'none', fontSize: 12.5, color: '#E2E8F0', marginTop: 6 }}>
              <input type="checkbox" name="smsConsent" defaultChecked={false} />
              <span>
                I agree to receive account text messages from <strong>Forge Athletic</strong> at this number. Message frequency
                varies. Msg &amp; data rates may apply. Reply <strong>STOP</strong> to opt out, <strong>HELP</strong> for help.
                Consent is not a condition of purchase. See our{' '}
                <Link href="/terms#sms-terms" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
                  Terms of Service
                </Link>{' '}
                &amp;{' '}
                <Link href="/privacy#sms-privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <h3 style={{ margin: '18px 0 4px', color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>What should we tell you about?</h3>
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <label key={cat.id} style={rowStyle}>
              <input type="checkbox" name={`cat_${cat.id}`} defaultChecked disabled={!cat.mutable} />
              <span>
                {cat.label}
                <small style={{ display: 'block', color: '#94A3B8' }}>{cat.description}</small>
              </span>
            </label>
          ))}

          <div style={{ marginTop: 16 }}>
            <button
              type="submit"
              className="btn-gold"
              style={{ cursor: 'pointer', padding: '10px 18px', borderRadius: 8, fontWeight: 700, border: 'none' }}
            >
              Save notification settings
            </button>
          </div>
        </form>

        <section style={{ fontSize: '0.9rem', color: '#CBD5E1' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: '1.2rem',
              color: 'var(--gold-lt)',
              marginBottom: '0.5rem',
            }}
          >
            Summary of SMS Compliance Safeguards
          </h2>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>Double-Gated Affirmative Consent:</strong> Both <code>sms_enabled = true</code> and an explicit timestamped{' '}
              <code>sms_consent_at</code> checkbox attestation are required before any text is dispatched; the consent box is
              unchecked by default and is never bundled with Terms of Service acceptance or required for purchase.
            </li>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>Instant Webhook Keyword Handling:</strong> Inbound <code>STOP</code>, <code>UNSUBSCRIBE</code>,{' '}
              <code>CANCEL</code>, <code>END</code>, <code>QUIT</code>, <code>START</code>, and <code>HELP</code> replies are
              processed immediately at <code>POST /api/webhooks/twilio</code>.
            </li>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>Strict Non-Sharing Policy:</strong> Mobile phone numbers and SMS opt-in consent records are never sold or
              shared with third parties or affiliates for marketing or promotional purposes (
              <Link href="/privacy#sms-privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
                Privacy Policy § 5
              </Link>{' '}
              ·{' '}
              <Link href="/terms#sms-terms" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
                Terms of Service § 4.1
              </Link>
              ).
            </li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
