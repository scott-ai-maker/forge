import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Forge Athletic protects your account, health, training, and payment information.',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Memberships' },
          { href: '/apply', label: 'Get started' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <main id="main-content" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(5rem, 8vw, 7rem) clamp(16px, 3vw, 24px) 4rem', fontFamily: 'Raleway, sans-serif', color: '#F5F0E8', lineHeight: 1.65, boxSizing: 'border-box' }}>
        <div style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
          Your privacy and data security
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '2.5rem', letterSpacing: '0.04em', margin: '0.5rem 0 0', color: '#FFFFFF' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#8A99AA', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          Effective &amp; Last Updated: October 8, 2026 · Forge Athletic LLC
        </p>
      </div>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          1. Scope &amp; Commitment to Confidentiality
        </h2>
        <p>
          Forge Athletic LLC (&quot;Forge Athletic&quot;, &quot;we&quot;, &quot;us&quot;) understands that health and fitness information is personal. We protect your account details, health information, movement assessments, progress photos, and wearable data with strong security safeguards.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          2. Biometric, Health &amp; Computer Vision Telemetry
        </h2>
        <div style={{ background: 'rgba(14, 23, 38, 0.7)', border: '1px solid rgba(197, 160, 89, 0.35)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="shield-check" size={14} tone="gold" />
            <span>Zero Public AI Training &amp; Zero Data Commercialization Guarantee</span>
          </p>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#CBD5E1' }}>
            We strictly guarantee that your personal health questionnaires (PAR-Q), resting heart rates, Apple Health / Whoop telemetry, posture mesh scans, video telestrator recordings, and progress photos are <strong>never sold, rented, or commercialized</strong> to third-party data brokers, advertisers, or public artificial intelligence models.
          </p>
        </div>
        <p style={{ fontSize: '0.95rem' }}>
          <strong>AI Inference Isolation:</strong> When our platform utilizes Google Gemini models for generating S.O.A.P. session notes, periodization macrocycles, or posture mesh analysis, all API requests are transmitted over encrypted enterprise channels with zero persistent data retention for public model training.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          3. Information We Collect &amp; Store
        </h2>
        <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
          <li style={{ marginBottom: '0.4rem' }}>
            <strong>Account &amp; Identity Data:</strong> Full name, verified email, telephone number, and authentication tokens.
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            <strong>Biometric &amp; Training Telemetry:</strong> Workout sets, poundage, repetition cadences, RPE exertion, 1RM milestones, and body composition measurements.
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            <strong>Media &amp; Video Streams:</strong> Form check videos, live session telestrator recordings, posture screen images, and check-in photos stored securely in private Supabase Storage buckets with Row-Level Security (RLS) enforcement.
          </li>
          <li style={{ marginBottom: '0.4rem' }}>
            <strong>Payment Data:</strong> Payment details are processed directly via Stripe; GAA never stores your credit card numbers or raw billing credentials on our servers.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          4. Cryptographic Security &amp; Database Architecture
        </h2>
        <p style={{ fontSize: '0.95rem' }}>
          We employ military-grade AES-256 encryption at rest and TLS 1.3 encryption in transit. Our database architecture utilizes PostgreSQL Row-Level Security (RLS) policies, ensuring that your biometric records and private messages are accessible only by you and your designated lead sports scientist (Coach Scott Gordon).
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
          5. Data Deletion &amp; Right to Be Forgotten
        </h2>
        <p style={{ fontSize: '0.95rem' }}>
          In accordance with global privacy regulations (including GDPR and CCPA), you retain complete ownership of your personal data. You may request permanent deletion of your profile, workout logs, and uploaded media at any time through your Account Settings or by contacting us in writing.
        </p>
      </section>

      <section style={{ borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.3rem', color: 'var(--gold-lt)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
          6. Privacy Inquiries &amp; Data Protection Officer
        </h2>
        <p style={{ margin: 0, fontSize: '0.92rem' }}>
          For inquiries regarding your biometric data or privacy protections, contact:
        </p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', color: 'var(--gold-lt)' }}>
          <strong>Forge Athletic LLC</strong><br />
          Data Protection &amp; Privacy Office<br />
          Email: <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a>
        </p>
      </section>
    </main>
    <SiteFooter />
    </>
  )
}
