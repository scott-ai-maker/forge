import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import CoachCredentialsShowcase from '@/components/credentials/CoachCredentialsShowcase'
import GaaIcon from '@/components/ui/GaaIcon'

export const metadata: Metadata = {
  title: 'Coach Scott Gordon, B.S., NASM-CPT | Verified Credentials & Accreditations | Forge Athletic',
  description:
    'Explore Coach Scott Gordon’s verified credentials: B.S. in Information Technology (University of Phoenix, 3.72 GPA), NCCA-accredited Certified Personal Trainer (NASM-CPT), ASTI CPR/AED, and 34 verified Credly badges in AWS Cloud Architecture, IBM AI Engineering & DevOps.',
  openGraph: {
    title: 'Coach Scott Gordon, B.S., NASM-CPT · Verified Credentials | Forge Athletic',
    description:
      'Official credentials, academic transcripts, verifiable digital badges, and sports science accreditations for Coach Scott Gordon.',
    url: 'https://forge-athletic.app/credentials',
    siteName: 'Forge Athletic',
    images: [
      {
        url: '/images/badges/nasm-cpt-badge.png',
        width: 400,
        height: 400,
        alt: 'NASM Certified Personal Trainer Digital Badge · Coach Scott Gordon',
      },
    ],
  },
}

export default function CredentialsPage() {
  const credentialsStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Scott Gordon',
    jobTitle: 'Head Coach & Performance Director',
    worksFor: {
      '@type': 'Organization',
      name: 'Forge Athletic',
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'University of Phoenix',
      sameAs: 'https://www.phoenix.edu',
    },
    sameAs: [
      'https://www.credly.com/users/scott-gordon.1dfe2f10/badges/credly',
      'https://www.credential.net/07f48168-fa30-4a54-bd43-ae0f8a66677b',
    ],
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'Bachelor of Science in Information Technology (BSIT)',
        credentialCategory: 'degree',
        educationalLevel: "Bachelor's Degree",
        recognizedBy: {
          '@type': 'Organization',
          name: 'Higher Learning Commission (HLC)',
        },
        issuedBy: {
          '@type': 'CollegeOrUniversity',
          name: 'University of Phoenix',
          sameAs: 'https://www.phoenix.edu',
        },
        validFrom: '2020-09-14',
      },
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'Certified Personal Trainer (NASM-CPT)',
        credentialCategory: 'certification',
        recognizedBy: {
          '@type': 'Organization',
          name: 'National Commission for Certifying Agencies (NCCA)',
        },
        issuedBy: {
          '@type': 'Organization',
          name: 'National Academy of Sports Medicine (NASM)',
        },
        validFrom: '2026-10-07',
        validUntil: '2028-10-07',
        url: 'https://www.credential.net/07f48168-fa30-4a54-bd43-ae0f8a66677b',
      },
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'Adult, Child & Infant CPR/AED',
        credentialCategory: 'certification',
        issuedBy: {
          '@type': 'Organization',
          name: 'American Safety Training Institute (ASTI)',
        },
        validFrom: '2026-10-07',
        validUntil: '2028-10-07',
        url: 'https://www.AmericanSTI.org',
      },
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'AWS Certified Solutions Architect – Associate',
        credentialCategory: 'certification',
        issuedBy: {
          '@type': 'Organization',
          name: 'Amazon Web Services Training and Certification',
        },
        validFrom: '2022-08-22',
        url: 'https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate',
      },
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'IBM AI Developer Professional Certificate',
        credentialCategory: 'certification',
        issuedBy: {
          '@type': 'Organization',
          name: 'IBM & Coursera',
        },
        validFrom: '2025-12-26',
        url: 'https://www.credly.com/org/coursera/badge/ibm-ai-developer-professional-certificate',
      },
    ],
  }

  return (
    <main className="foundation-home forge-marketing" id="main-content" style={{ minHeight: '100vh', background: '#080E14' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(credentialsStructuredData) }}
      />

      {/* Header */}
      <header className="forge-home-header">
        <Link className="forge-home-brand" href="/" aria-label="Forge Athletic home">
          <Image
            src="/images/brand/logo-concept-1-kinetic-f.jpg"
            alt=""
            width={48}
            height={48}
            priority
          />
          <span>Forge Athletic</span>
        </Link>
        <nav aria-label="Account">
          <Link href="/packages">Memberships</Link>
          <Link href="/auth/login">Log in</Link>
          <Link className="forge-header-cta" href="/auth/signup">Get started</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: 'clamp(2rem, 5vw, 4rem) 20px clamp(1.5rem, 3vw, 2.5rem)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 9999,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: 'var(--gold-lt)',
            fontSize: 12,
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          <GaaIcon name="shield-check" size={14} tone="gold" />
          <span>Verified Accreditations · Evidence-Led Coaching</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
            color: '#FFFFFF',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            margin: '0 auto 16px',
            maxWidth: 960,
          }}
        >
          Credentials Built on Precision Sports Science.
        </h1>

        <p
          style={{
            color: '#CBD5E1',
            fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
            lineHeight: 1.7,
            maxWidth: 780,
            margin: '0 auto 32px',
          }}
        >
          Every training microcycle, dynamic movement screen, and corrective protocol prescribed at Forge Athletic is guided by official, verified certifications from the National Academy of Sports Medicine (NASM) and emergency medical standards.
        </p>

        {/* Quick summary stats pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            { label: 'Primary Credential', val: 'NASM-CPT® #1261890687', tone: 'gold' },
            { label: 'Higher Education', val: 'B.S. Information Technology · 3.72 GPA', tone: 'blue' },
            { label: 'Cloud & AI Badges', val: '34 Verified Credly Badges (AWS, IBM, LF, MSFT)', tone: 'cyan' },
            { label: 'Accreditation', val: 'NCCA Accredited by ICE', tone: 'green' },
            { label: 'Emergency Safety', val: 'ASTI CPR/AED Certified #1261890193', tone: 'red' },
            { label: 'Pathway', val: 'NASM Master Trainer Candidate', tone: 'gold' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: 12,
              }}
            >
              <span style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>
                {item.label}:
              </span>
              <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
                {item.val}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Showcase */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '0 20px 60px' }}>
        <CoachCredentialsShowcase />
      </section>

      {/* Trust & Scientific Rigor Explainer Section */}
      <section
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '60px 20px',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
        }}
      >
        <div className="forge-section-intro" style={{ maxWidth: 760, margin: '0 auto 40px', textAlign: 'center' }}>
          <p className="forge-eyebrow">The NCCA Standard</p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>Why Verified Credentials Matter.</h2>
          <p style={{ color: '#CBD5E1', fontSize: '1.05rem', lineHeight: 1.7 }}>
            In an industry crowded with unvetted fitness influencers and uncredentialed advice, Forge Athletic anchors every rep to certified, peer-reviewed exercise science.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 20,
          }}
        >
          <article
            style={{
              background: 'rgba(14, 23, 36, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: 12,
              padding: '24px 26px',
            }}
          >
            <div style={{ color: 'var(--gold)', marginBottom: 12 }}>
              <GaaIcon name="award" size={24} tone="gold" />
            </div>
            <h3 style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: '0 0 8px' }}>
              NCCA Gold Standard Accreditation
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              The National Commission for Certifying Agencies (NCCA) is the gold standard for professional credentialing. NASM certifications require passing rigorous, independently audited psychometric examinations ensuring sound biomechanics and safety.
            </p>
          </article>

          <article
            style={{
              background: 'rgba(14, 23, 36, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: 12,
              padding: '24px 26px',
            }}
          >
            <div style={{ color: '#38BDF8', marginBottom: 12 }}>
              <GaaIcon name="periodization" size={24} tone="gold" />
            </div>
            <h3 style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: '0 0 8px' }}>
              The OPT™ 5-Phase Periodization
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              Developed by the National Academy of Sports Medicine, the Optimum Performance Training (OPT™) model systematically progresses through Stabilization Endurance, Strength Endurance, Muscular Development, Maximal Strength, and Power.
            </p>
          </article>

          <article
            style={{
              background: 'rgba(14, 23, 36, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: 12,
              padding: '24px 26px',
            }}
          >
            <div style={{ color: '#EF4444', marginBottom: 12 }}>
              <GaaIcon name="heart-rate" size={24} tone="ruby" />
            </div>
            <h3 style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: '0 0 8px' }}>
              Client Safety &amp; Emergency Readiness
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              Active dual certification with the American Safety Training Institute (ASTI) ensures current compliance in Adult, Child, and Infant CPR/AED protocols, sudden cardiac arrest emergency response, and cardiovascular risk screening.
            </p>
          </article>

          <article
            style={{
              background: 'rgba(14, 23, 36, 0.75)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 12,
              padding: '24px 26px',
            }}
          >
            <div style={{ color: '#60A5FA', marginBottom: 12 }}>
              <GaaIcon name="brain" size={24} tone="cyan" />
            </div>
            <h3 style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: '0 0 8px' }}>
              Academic Foundations &amp; Systems Rigor
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              With a Bachelor of Science in Information Technology (3.72 GPA), Coach Scott Gordon bridges human biomechanics with software engineering—translating sports science into algorithmic periodization, real-time biometrics, and low-latency computer vision.
            </p>
          </article>

          <article
            style={{
              background: 'rgba(14, 23, 36, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 12,
              padding: '24px 26px',
            }}
          >
            <div style={{ color: '#38BDF8', marginBottom: 12 }}>
              <GaaIcon name="shield-check" size={24} tone="cyan" />
            </div>
            <h3 style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: '0 0 8px' }}>
              Cryptographic Verification &amp; Credly Portfolio
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              Backed by 34 cryptographically signed digital credentials from AWS, IBM, The Linux Foundation, Microsoft, and O&apos;Reilly Media, Coach Gordon&apos;s cloud architecture and AI engineering competencies are publicly auditable and verifiable in real-time.
            </p>
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="forge-home-footer" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <Link href="/" aria-label="Forge Athletic home">Forge Athletic</Link>
        <p>Built From The Ground Up. Precision Science For Real Lives.</p>
        <nav aria-label="Footer">
          <Link href="/packages">Memberships</Link>
          <Link href="/credentials" style={{ color: 'var(--gold-lt)' }}>Credentials</Link>
          <Link href="/auth/login">Log in</Link>
          <Link href="/auth/signup">Create account</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  )
}
