import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'
import { LEGAL_DOCUMENTS } from '@/lib/legal-compliance'

export const metadata: Metadata = {
  title: 'Consumer Health Data & Biometric Privacy Policy | Forge Athletic',
  description:
    'Standalone Consumer Health Data Privacy Policy and Biometric Retention & Destruction Schedule pursuant to WA MHMDA, NV SB 370, IL BIPA, TX CUBI, and CO Biometric Rules.',
}

export default function ConsumerHealthBiometricPrivacyPage() {
  return (
    <>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Memberships' },
          { href: '/privacy', label: 'Privacy Policy' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <main
        id="main-content"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(5rem, 8vw, 7rem) clamp(16px, 3vw, 24px) 4rem',
          fontFamily: 'Raleway, sans-serif',
          color: '#F5F0E8',
          lineHeight: 1.65,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
            Standalone Health &amp; Biometric Disclosure
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '2.35rem', letterSpacing: '0.04em', margin: '0.5rem 0 0', color: '#FFFFFF' }}>
            Consumer Health Data &amp; Biometric Privacy Policy
          </h1>
          <p style={{ color: '#94A3B8', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Effective &amp; Last Updated: November 11, 2026 · Version {LEGAL_DOCUMENTS.consumer_health_biometric_policy.version} · Forge Athletic Performance LLC (MA ID #002010312)
          </p>
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.35rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            1. Purpose &amp; Statutory Scope
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            This standalone Consumer Health Data &amp; Biometric Privacy Policy supplements the Forge Athletic{' '}
            <Link href="/privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>Privacy Policy</Link>{' '}
            and is published pursuant to the <strong>Washington My Health My Data Act (RCW 19.373)</strong>, <strong>Nevada Consumer Health Data Privacy Law (SB 370)</strong>, <strong>Illinois Biometric Information Privacy Act (740 ILCS 14/ — &quot;BIPA&quot;)</strong>, <strong>Texas Capture or Use of Biometric Identifier Act (Tex. Bus. &amp; Com. Code § 503.001 — &quot;CUBI&quot;)</strong>, and the <strong>Colorado Privacy Act Biometric Amendments</strong>. Forge Athletic is a direct-to-consumer personal training and wellness platform—not a licensed healthcare provider, health plan, or HIPAA &quot;covered entity&quot;—and protects consumer health information with HIPAA-inspired encryption (TLS 1.3 / AES-256), PostgreSQL Row-Level Security (RLS), and state/FTC consumer health privacy controls.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.35rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            2. Categories of Consumer Health Data Collected &amp; Sources
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            Solely with your affirmative consent and directly from you (or wearable integrations you explicitly connect), Forge Athletic collects the following categories of consumer health data:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Physical Readiness &amp; Orthopedic Screening Indicators:</strong> PAR-Q+ cardiovascular/musculoskeletal readiness responses, prior surgery or injury notes, and movement contraindications necessary to prevent unsafe exercise prescription.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Physiological, Biometric &amp; Recovery Telemetry:</strong> Resting heart rate, heart-rate variability (HRV), sleep duration, active expenditure, body weight, estimated body-fat percentage, and resistance-training workload metrics.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Postural, Movement &amp; Visual Assessment Data:</strong> Joint-angle kinematics (e.g., Overhead Squat Assessment ankle, knee, hip, and shoulder alignment), optional athlete-uploaded form-check videos, progress photos, and live studio telestrator recordings.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.35rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            3. Computer Vision, Pose Landmarks &amp; Biometric Written Release Policy
          </h2>
          <div style={{ background: 'rgba(14, 23, 38, 0.75)', border: '1px solid rgba(197, 160, 89, 0.35)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="shield-check" size={14} tone="gold" />
              <span>No Facial Recognition Identification · Local Segmentation &amp; Opt-In Cloud Photo Analysis</span>
            </p>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#CBD5E1' }}>
              Forge Athletic does <strong>not</strong> use facial recognition to biometrically identify individuals across databases, and does <strong>not</strong> generate AI image-to-image physique simulations from athlete photographs. Live studio virtual background segmentation masks and real-time MediaPipe 33-point skeletal joint overlays execute locally in your browser/device memory. When you or your assigned coach explicitly execute a standalone biometric release to run a still-image <strong>Posture Mesh Scan</strong> or <strong>Body-Composition Scan</strong>, de-identified photographs (without your name or email) are transmitted over TLS 1.3 to our bound AI vision processor (Google Gemini Paid Commercial API—excluded from model training, with standard up-to-55-day provider abuse-monitoring log retention) solely to estimate anatomical alignment checkpoints and anthropometric ratios, and any saved reference image is stored exclusively in a private RLS-protected Supabase Storage bucket.
            </p>
          </div>
          <p style={{ fontSize: '0.95rem' }}>
            To the extent any skeletal pose coordinates, posture scan images, or body-composition photos could be construed as a &quot;biometric identifier&quot; or &quot;biometric information&quot; under 740 ILCS 14/10, Tex. Bus. &amp; Com. Code § 503.001, or Colorado law:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Purpose of Collection:</strong> Collected strictly to compute biomechanical joint-alignment checkpoints, estimate educational body-composition trends, and track athletic training adaptations.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Zero Sale, Lease, or Profiting (740 ILCS 14/15(c)):</strong> Forge Athletic <strong>never</strong> sells, leases, trades, or otherwise profits from any athlete&apos;s biometric identifiers, biometric information, or consumer health data.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Zero Geofencing:</strong> Forge Athletic never deploys geofencing around any in-person health care facility, clinic, or wellness center.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.35rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            4. Statutory Biometric Retention &amp; Permanent Destruction Schedule (740 ILCS 14/15(a))
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            Forge Athletic permanently destroys any stored posture scan geometry, assessment media, progress photos, and associated biometric or consumer health records upon the <strong>earliest</strong> of the following events:
          </p>
          <ol style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Immediate User-Initiated Deletion:</strong> Immediately (and across encrypted backups within 30 days) when you delete a specific assessment/photo or execute <em>Delete Account</em> in Account Settings;
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Satisfaction of Initial Purpose:</strong> Immediately once the initial biomechanical assessment or coaching purpose for collecting the scan has been satisfied and your active coaching relationship ends upon request; or
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Three-Year Statutory Maximum:</strong> Within <strong>three (3) years</strong> of your last interaction with Forge Athletic (or within one (1) year under Tex. Bus. &amp; Com. Code § 503.001(c)(3) where applicable), whichever occurs first.
            </li>
          </ol>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.35rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            5. Sharing &amp; Bound Service-Provider Disclosures (RCW 19.373.040)
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            Forge Athletic does <strong>not</strong> share or sell consumer health data to third-party advertisers, data brokers, or corporate employers, and has no corporate affiliates with whom consumer health data is shared. Consumer health data is processed strictly on our instructions by the following bound infrastructure and AI service providers (also detailed in our{' '}
            <Link href="/privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>Privacy Policy</Link>):
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>Supabase Inc. &amp; Vercel Inc.:</strong> Encrypted PostgreSQL database, private object storage (AES-256 at rest, TLS 1.3 in transit, Row-Level Security), and application hosting.
            </li>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>Google LLC (Gemini API) &amp; OpenAI OpCo, LLC:</strong> Opt-in posture/body-composition visual landmark estimation, de-identified coaching session note structuring, and individualized periodization synthesis.
            </li>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>ElevenLabs Inc. &amp; LiveKit:</strong> Synthesized audio coaching cues and encrypted WebRTC 1:1 live video/audio coaching transport.
            </li>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>Vital (TRYVITAL, Inc.):</strong> Athlete-authorized wearable and Apple HealthKit / Google Health Connect telemetry synchronization.
            </li>
            <li style={{ marginBottom: '0.35rem' }}>
              <strong>Stripe, Inc., Resend, Inc. &amp; Twilio Inc.:</strong> PCI-DSS payment processing and transactional/escalation coaching notifications (containing no diagnostic media).
            </li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.3rem', color: 'var(--gold-lt)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            6. Exercising Your Consumer Health Rights &amp; Appeals Process
          </h2>
          <p style={{ fontSize: '0.92rem', margin: '0 0 0.75rem' }}>
            You have the right at any time to confirm whether we collect or process your consumer health data, access a copy of that data, withdraw your consent to collection/processing, or demand permanent deletion across our systems and processors. Submit requests via <em>Account Settings</em> or email <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a>. We authenticate and fulfill requests free of charge within 30 days (and no later than 45 days).
          </p>
          <p style={{ fontSize: '0.9rem', color: '#CBD5E1', margin: 0 }}>
            <strong>Right to Appeal:</strong> If we decline to act on a consumer health data request, you may appeal by emailing <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> with the subject line <code>&quot;Health Privacy Appeal&quot;</code>. We will respond in writing within 45 days with our decision and rationale. If your appeal is denied, you may contact your State Attorney General (including the Washington State Attorney General at <code>atg.wa.gov/file-complaint</code>, the Nevada Attorney General at <code>ag.nv.gov</code>, or the Massachusetts Attorney General at <code>mass.gov/ago</code>).
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

