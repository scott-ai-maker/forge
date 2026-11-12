import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'
import { LEGAL_DOCUMENTS } from '@/lib/legal-compliance'

export const metadata: Metadata = {
  title: 'Privacy Policy | Forge Athletic',
  description:
    'How Forge Athletic protects your account, health, biometric, wearable, and payment information with zero third-party ad tracking.',
}

const SUBPROCESSORS = [
  {
    vendor: 'Supabase, Inc.',
    purpose: 'Encrypted PostgreSQL database (AES-256 at rest), Row-Level Security (RLS), authentication, and private media storage buckets.',
    dataScope: 'Account profile, training logs, intake records, private signed-URL media.',
  },
  {
    vendor: 'Stripe, Inc.',
    purpose: 'PCI-DSS Level 1 subscription checkout, billing portal, and automated sales tax calculation.',
    dataScope: 'Billing identifiers and payment tokens (card numbers never touch Forge Athletic servers).',
  },
  {
    vendor: 'Google Cloud / Gemini API (Paid Enterprise ZDR Tier)',
    purpose: 'Periodization synthesis, biomechanical movement summaries, and coach S.O.A.P. note drafting.',
    dataScope: 'De-identified or scoped training context over TLS 1.3 with Zero Data Retention for public model training.',
  },
  {
    vendor: 'OpenAI, L.L.C. (API Platform)',
    purpose: 'Optional fallback workout enrichment and speech synthesis.',
    dataScope: 'API prompts not used to train OpenAI consumer models.',
  },
  {
    vendor: 'ElevenLabs, Inc.',
    purpose: 'Synthesized audio workout cues and coaching briefings.',
    dataScope: 'Workout cue script text converted to audio.',
  },
  {
    vendor: 'Leonardo Interactive Pty Ltd (Opt-In Only)',
    purpose: 'Optional 18+ AI physique concept visualization (/api/fitness/predict-look) only when explicitly initiated by the athlete.',
    dataScope: 'Target fitness prompt and optional athlete-selected reference image.',
  },
  {
    vendor: 'LiveKit / WebRTC Media Relay',
    purpose: 'Real-time encrypted peer-to-peer / SFU audio-video streaming for 1:1 live coaching sessions.',
    dataScope: 'Ephemeral encrypted audio/video streams (recorded only upon explicit all-party consent).',
  },
  {
    vendor: 'Vital (Thryve / Junction API — Opt-In Only)',
    purpose: 'Optional athlete-authorized wearable telemetry synchronization (Garmin, Oura, Whoop, Polar).',
    dataScope: 'Recovery, sleep, heart-rate, and workout metrics authorized by the athlete.',
  },
  {
    vendor: 'Resend, Inc. & Twilio, Inc.',
    purpose: 'Transactional account emails, renewal reminders, and optional athlete-authorized SMS notifications (STOP/HELP supported).',
    dataScope: 'Email address, phone number (if provided), and notification payloads.',
  },
  {
    vendor: 'Vercel Inc.',
    purpose: 'TLS 1.3 edge/application hosting and DDoS/WAF protection.',
    dataScope: 'HTTP request routing metadata and IP rate-limiting headers.',
  },
]

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
            Your privacy and data security
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '2.5rem', letterSpacing: '0.04em', margin: '0.5rem 0 0', color: '#FFFFFF' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#94A3B8', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Effective &amp; Last Updated: November 11, 2026 · Version {LEGAL_DOCUMENTS.privacy_policy.version} · Forge Athletic Performance LLC (MA ID #002010312)
          </p>
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            1. Scope, Regulatory Alignment &amp; Consumer Health Notice
          </h2>
          <p>
            Forge Athletic Performance LLC d/b/a Forge Athletic (&quot;Forge Athletic&quot;, &quot;we&quot;, &quot;us&quot;) protects your account, readiness screening, biomechanical movement assessments, progress media, and wearable telemetry with strict engineering and administrative safeguards aligned with the Massachusetts Data Security Regulations (<strong>201 CMR 17.00 Written Information Security Program</strong>), the <strong>FTC Health Breach Notification Rule (16 CFR Part 318)</strong>, CCPA/CPRA, and GDPR.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            For specific disclosures regarding consumer health data and computer-vision posture/biometric processing under the Washington My Health My Data Act (RCW 19.373), Nevada SB 370, and Illinois BIPA (740 ILCS 14/), please also review our standalone{' '}
            <Link href="/health-privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline', fontWeight: 700 }}>
              Consumer Health &amp; Biometric Data Privacy Policy
            </Link>.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            2. Zero Third-Party Ad Pixels, Zero Analytics Tracking &amp; AI Isolation
          </h2>
          <div style={{ background: 'rgba(14, 23, 38, 0.7)', border: '1px solid rgba(197, 160, 89, 0.35)', borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="shield-check" size={14} tone="gold" />
              <span>Zero Ad-Broker Commercialization &amp; Zero Behavioral Analytics Pixels</span>
            </p>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#CBD5E1' }}>
              Forge Athletic does <strong>not</strong> run Google Analytics, Meta Pixels, TikTok Pixels, or third-party behavioral ad trackers anywhere on our platform. Your PAR-Q+ responses, resting heart rates, wearable telemetry, posture assessments, live studio recordings, and progress photos are <strong>never sold, rented, or shared</strong> for cross-context behavioral advertising or public AI foundation model training.
            </p>
          </div>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Paid Enterprise AI API Isolation:</strong> When Forge Athletic transmits structured training context to AI inference providers (listed in Section 5) to draft periodization blocks, movement summaries, or S.O.A.P. coaching notes, requests are transmitted over TLS 1.3 using paid commercial API tiers configured so customer inputs and outputs are not used to train public foundation models.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            3. Categories of Information We Collect
          </h2>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Account, Eligibility &amp; Legal Audit Records:</strong> Full name, verified email, optional telephone number, authentication session cookies, Emergency Response Action Plan (ERAP) training address/contact, and immutable ESIGN consent audit logs (document hash, timestamp, IP address, and typed signature).
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Readiness &amp; Training Telemetry:</strong> PAR-Q+ health readiness answers, orthopedic limitation flags, workout sets, tonnage, RPE, 1RM estimates, and optional nutrition/body-composition logs.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Private Assessment Media:</strong> Athlete-submitted form-check videos, posture photos, and consented live telestrator clips stored strictly in private Supabase Storage buckets with Row-Level Security (RLS) and accessed solely via time-limited signed URLs.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Billing Metadata:</strong> Processed directly by Stripe; Forge Athletic stores only subscription status, plan tier, and Stripe customer/invoice identifiers.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            4. Apple HealthKit &amp; Google Play Health Connect Limited Use Disclosures
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Apple HealthKit (App Store Review Guideline 5.1.3):</strong> If you explicitly grant permission on iOS to connect Apple HealthKit, Forge Athletic reads and/or writes only the workout, heart-rate, sleep, and active-energy metrics you authorize solely to calibrate your athletic training readiness and recovery workload. HealthKit data is <strong>never</strong> used for advertising, marketing, or use-based data mining, is never sold to data brokers or information resellers, and is never disclosed to third parties without your explicit authorization for providing your coaching service.
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Google Health Connect Limited Use Policy:</strong> The use of information received from Google Health Connect adheres strictly to the <em>Health Connect Permissions Policy</em>, including the Limited Use requirements. Health Connect data is used exclusively to provide or improve user-facing athletic readiness, workload autoregulation, and coaching features that are prominent in the Forge Athletic interface, and is never transferred for advertising, creditworthiness, or data-brokerage purposes.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            5. Authorized Cloud &amp; AI Subprocessors
          </h2>
          <p style={{ fontSize: '0.95rem', marginBottom: '0.85rem' }}>
            Forge Athletic engages the following vetted infrastructure and service subprocessors strictly as necessary to deliver platform functionality (note: direct-to-consumer memberships are governed by FTC and state privacy standards rather than HIPAA insurance-billing rules; in B2B corporate wellness programs, employers receive only aggregated, de-identified cohort participation statistics and never individual employee health records):
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <caption className="sr-only">Forge Athletic Authorized Cloud and AI Subprocessors</caption>
              <thead>
                <tr style={{ background: 'rgba(14, 23, 38, 0.9)', borderBottom: '1px solid rgba(197, 160, 89, 0.3)', textAlign: 'left' }}>
                  <th scope="col" style={{ padding: '10px 12px', color: 'var(--gold-lt)' }}>Subprocessor</th>
                  <th scope="col" style={{ padding: '10px 12px', color: 'var(--gold-lt)' }}>Operational Purpose</th>
                  <th scope="col" style={{ padding: '10px 12px', color: 'var(--gold-lt)' }}>Data Scope</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map(item => (
                  <tr key={item.vendor} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                    <th scope="row" style={{ padding: '10px 12px', fontWeight: 700, color: '#FFFFFF', textAlign: 'left', verticalAlign: 'top' }}>
                      {item.vendor}
                    </th>
                    <td style={{ padding: '10px 12px', color: '#CBD5E1', verticalAlign: 'top' }}>{item.purpose}</td>
                    <td style={{ padding: '10px 12px', color: '#94A3B8', verticalAlign: 'top' }}>{item.dataScope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            6. Cryptographic Safeguards, Access Controls &amp; Breach Response
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            All network traffic is encrypted in transit via <strong>TLS 1.3</strong>, and persistent databases and private storage buckets are encrypted at rest via <strong>AES-256</strong>. PostgreSQL Row-Level Security (RLS) restricts client records to the authenticated athlete (`auth.uid() = user_id`) and their explicitly assigned coach verified server-side. In the event of any unauthorized acquisition of unsecured personal or health information, Forge Athletic executes notifications in strict compliance with M.G.L. c. 93H, 201 CMR 17.00, and the FTC Health Breach Notification Rule (16 CFR Part 318).
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            7. Data Retention, Cascade Deletion &amp; Privacy Rights
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            You retain full access, correction, portability, consent-withdrawal, and deletion rights over your personal data. You may trigger permanent cascade deletion of your account, workout telemetry, wearable tokens, and private storage media at any time in <em>Account Settings</em> or by emailing <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> (retaining only legally mandated tax/accounting invoice records and append-only legal waiver defense logs as permitted by law).
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            8. Strict Adult Platform (No Minors Under 18) &amp; COPPA Compliance
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            Forge Athletic is restricted strictly to adults aged <strong>18 and older</strong> (or the age of legal majority in the user&apos;s jurisdiction). We do not knowingly solicit, collect, or process personal information, photos, videos, or biometric telemetry from anyone under 18 years of age (including children under 13 under the Children&apos;s Online Privacy Protection Act, 15 U.S.C. § 6501 et seq.). If we learn that an individual under 18 has created an account, we immediately terminate the account and permanently purge all associated media and personal records.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.3rem', color: 'var(--gold-lt)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            9. Privacy Inquiries &amp; Data Protection Coordinator
          </h2>
          <p style={{ margin: 0, fontSize: '0.92rem' }}>
            To exercise your privacy rights, appeal a privacy request decision, or contact our Data Security Coordinator:
          </p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', color: 'var(--gold-lt)' }}>
            <strong>Forge Athletic Performance LLC</strong><br />
            Attn: Data Protection &amp; Privacy Coordinator<br />
            82 Wendell Ave., Ste 100<br />
            Pittsfield, MA 01201<br />
            Email: <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
