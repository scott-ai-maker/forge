import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'

export const metadata: Metadata = {
  title: 'Health Connect & Apple HealthKit Permissions Rationale | Forge Athletic',
  description:
    'Standalone Limited Use permissions disclosure explaining exact Apple HealthKit and Google Health Connect read/write scopes used by Forge Athletic.',
}

export default function HealthConnectRationalePage() {
  return (
    <>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/privacy', label: 'Privacy Policy' },
          { href: '/health-privacy', label: 'Health Privacy' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <main
        id="main-content"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '6.5rem 1.5rem 4rem',
          color: '#E2E8F0',
          lineHeight: 1.7,
        }}
      >
        <p
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold-lt)',
            margin: '0 0 0.5rem',
          }}
        >
          Google Health Connect &amp; Apple HealthKit Limited Use Rationale
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.6vw, 2.4rem)',
            color: '#FFFFFF',
            margin: '0 0 1.25rem',
            letterSpacing: '0.03em',
          }}
        >
          Wearable &amp; Health Permissions Rationale
        </h1>
        <p style={{ fontSize: '0.96rem', color: '#CBD5E1', marginBottom: '1.5rem' }}>
          Connecting Apple HealthKit or Android Health Connect is completely optional. When you grant permission, Forge Athletic accesses only the specific metrics below solely to calculate recovery readiness and log workouts you complete inside Forge Athletic. Forge Athletic does <strong>not</strong> collect background GPS location routes from your mobile device.
        </p>

        <section
          style={{
            background: 'rgba(14, 23, 38, 0.78)',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            borderRadius: 10,
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', color: 'var(--gold-lt)', marginTop: 0 }}>
            1. Authorized Read Scopes
          </h2>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.92rem' }}>
            <li><strong>Heart Rate, Resting Heart Rate &amp; Heart Rate Variability (HRV):</strong> Computes daily autonomic recovery readiness so training volume and intensity adapt to fatigue.</li>
            <li><strong>Sleep Duration &amp; Stages:</strong> Evaluates overnight recovery sufficiency prior to high-intensity sessions.</li>
            <li><strong>Steps, Walking/Running Distance &amp; Active/Total Energy Burned:</strong> Tracks daily non-exercise expenditure and cardio workload.</li>
            <li><strong>Workouts / Exercise Sessions:</strong> Prevents duplicate training load prescriptions on days you already trained.</li>
          </ul>
        </section>

        <section
          style={{
            background: 'rgba(14, 23, 38, 0.78)',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            borderRadius: 10,
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', color: 'var(--gold-lt)', marginTop: 0 }}>
            2. Authorized Write Scopes
          </h2>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.92rem' }}>
            <li><strong>Completed Workouts / Exercise, Active/Total Calories Burned &amp; Distance:</strong> Writes strength and conditioning sessions completed in Forge Athletic back to Apple Health or Android Health Connect at your direction.</li>
          </ul>
        </section>

        <section style={{ fontSize: '0.93rem', color: '#CBD5E1' }}>
          <p>
            <strong>Strict Limited Use Compliance:</strong> Use of information received from Google Health Connect adheres to the <em>Health Connect Permissions Policy</em>, including the Limited Use requirements, and Apple App Store Review Guideline 5.1.3. Synchronized health metrics are encrypted in transit (TLS 1.3) and at rest (AES-256), are never sold to data brokers, and are never used for advertising, marketing, or creditworthiness.
          </p>
          <p>
            Review our full{' '}
            <Link href="/health-privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
              Consumer Health Data Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
