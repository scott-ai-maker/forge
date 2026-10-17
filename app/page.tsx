import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ForgeMembershipPlans from '@/components/packages/ForgeMembershipPlans'
import MobileAppPromoSection from '@/components/marketing/MobileAppPromoSection'
import HolidayUnmaskingSplash from '@/components/marketing/HolidayUnmaskingSplash'
import { isSiteUnmasked } from '@/lib/launch-config'

export const metadata: Metadata = {
  title: 'Forge Athletic | Online Personal Training, NASM Periodization & 3D Movement Screening',
  description:
    'Evidence-led online personal training, 3D movement screening, and NASM OPT™ periodization tailored for real schedules. Don’t wait for January to repair what November broke.',
  openGraph: {
    title: 'Forge Athletic | Online Personal Training & 3D Movement Screening',
    description:
      'Evidence-led online personal training, 3D movement screening, and NASM OPT™ periodization tailored for real schedules.',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

const homeFaqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What makes Forge Athletic personal training methodology unique?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Forge Athletic pairs evidence-based NASM 5-phase Optimum Performance Training (OPT™) periodization with computer-vision 3D movement screening and wearable biometric telemetry. Built on the NASM Virtual Coaching Specialization (VCS) framework, every training plan adapts dynamically to your real schedule, joint health, and recovery data rather than rigid cookie-cutter routines.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Forge Athletic coaching remote, hybrid, or in-person?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Headquartered in Massachusetts, Forge Athletic operates as a 100% remote virtual performance coaching platform serving clients across the Commonwealth and nationwide across all 50 states. Athletes receive tailored training routines, asynchronous video form analysis in the Form Lab, live WebRTC virtual coaching sessions, and mobile workout tracking across Apple iOS, Android, and Progressive Web Apps—delivering master-level coaching directly to your home gym or private workout space with zero commute friction.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who is Forge Athletic designed for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Forge Athletic is engineered for busy executives and professionals seeking posture restoration and energy, longevity lifters (40s–60s+) protecting joint integrity and bone density, and everyday athletes wanting collegiate-grade strength and conditioning without wasting hours in the gym.',
      },
    },
    {
      '@type': 'Question',
      name: 'What credentials does Coach Gordon have?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Coach Gordon has been a personal trainer since 2008 (18+ years of dedicated coaching experience). He holds an accredited Bachelor of Science in Information Technology (3.72 GPA), an active NCCA-accredited NASM-CPT certification (#1261890687), ASTI CPR/AED credentials, and 34 verified Credly badges in AI and cloud architecture. He is an active candidate on the NASM Master Trainer track across Corrective Exercise (CES), Performance Enhancement (PES), Nutrition (CNC, CSNC), and Virtual Coaching Specialization (VCS).',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the 3D movement and posture screening work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Using standard smartphone video and computer vision algorithms, Forge Athletic evaluates 33 kinetic chain anatomical landmarks during an overhead squat assessment, identifying overactive and underactive muscle compensations to formulate targeted corrective exercises.',
      },
    },
  ],
}

const FEATURE_PILLARS = [
  {
    number: '01',
    title: 'A plan built around you',
    description: 'Personalized NASM OPT™ training that adapts to your goals and builds strength over time.',
    image: '/images/pillar-plan-personalized.jpg',
    imageAlt: 'Coach Gordon reviewing an individualized training plan on a tablet with an everyday client',
  },
  {
    number: '02',
    title: 'Move with confidence',
    description: 'Practical movement screening and coaching help you understand how to train well.',
    image: '/images/pillar-move-confidence.jpg',
    imageAlt: 'Coach Gordon observing squat depth and knee alignment during a tailored movement screen',
  },
  {
    number: '03',
    title: 'See progress that matters',
    description: 'Bring workouts, strength trends, and available recovery signals together in one clear view.',
    image: '/images/pillar-progress-telemetry.jpg',
    imageAlt: 'Active client smiling and checking workout progress telemetry on her smartwatch',
  },
]

const AUDIENCE_PERSONAS = [
  {
    tag: 'Posture & Energy',
    title: 'Busy Professionals & Desk Workers',
    description: 'Reverse the stiffness of long desk hours. Build core stability, open tight hips, and gain steady physical stamina that powers your workday.',
    image: '/images/personas/executive-strength.jpg',
    imageAlt: 'Professional woman performing controlled dumbbell Romanian deadlift with focused alignment',
  },
  {
    tag: 'Joint Health & Vitality',
    title: 'Longevity & Master Lifters (40s–60s+)',
    description: 'Protect knees, shoulders, and spine while preserving bone density. Progressive, safe strength training designed to keep you moving pain-free for decades.',
    image: '/images/personas/longevity-vitality-male.jpg',
    imageAlt: 'Active mature 58-year-old man performing controlled kettlebell deadlift with excellent posture',
  },
  {
    tag: 'Power & Stamina',
    title: 'Athletic Conditioning & Hybrid Strength',
    description: 'Train with collegiate-grade periodization across NASM’s 5 phases—building rotational power, speed, work capacity, and resilient athletic conditioning.',
    image: '/images/personas/athletic-conditioning.jpg',
    imageAlt: 'Athletic trainee holding front-rack kettlebell in a high-performance gym facility',
  },
  {
    tag: 'Train Anywhere',
    title: 'Hybrid & Remote Video Coaching',
    description: 'Train at home, apartment gyms, or on the road with clear video guidance, asynchronous form reviews, and direct coaching access whenever you need it.',
    image: '/images/remote-virtual-coaching.jpg',
    imageAlt: 'Client training in a home gym guided by Coach Gordon on a live tablet video consultation',
  },
]

/**
 * Full unmasked marketing experience. Rendered when site unmasking is active,
 * when in staff preview mode, or after the target go-live date is reached.
 */
function UnmaskedLandingMarkup({ isPreview = false }: { isPreview?: boolean }) {
  return (
    <main className="foundation-home forge-marketing" id="main-content">
      {isPreview && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FBBF24',
            padding: '10px 16px',
            fontSize: '13px',
            textAlign: 'center',
            fontFamily: 'var(--font-telemetry)',
          }}
        >
          <strong>INTERNAL PREVIEW:</strong> Viewing full unmasked site. Public visitors currently see the Holiday Pre-Launch Splash Page.
        </div>
      )}

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
          <Link href="/credentials">Credentials</Link>
          <Link href="/auth/login">Log in</Link>
          <Link className="forge-header-cta" href="/auth/signup">Get started</Link>
        </nav>
      </header>

      <section className="forge-hero" aria-labelledby="forge-hero-title">
        <div className="forge-hero-copy">
          <p className="forge-eyebrow"><span />Performance built on science</p>
          <h1 id="forge-hero-title">Personal Training, Built Around You.</h1>
          <p className="forge-hero-tagline">Personal trainer since 2008. NASM-CPT · NASM Master Trainer Candidate · Massachusetts &amp; Nationwide.</p>
          <p className="forge-hero-description">
            Whatever your goal, get a plan shaped around your starting point and schedule—with
            practical coaching, clinical sports science, and progress you can measure.
          </p>
          <div className="forge-hero-actions">
            <Link className="forge-primary-link" href="/packages">Explore memberships</Link>
            <Link className="forge-secondary-link" href="/auth/login">Member sign in <span aria-hidden="true">→</span></Link>
          </div>
          <p className="forge-hero-proof">Personal trainer since 2008 <span>·</span> NASM-CPT® Certified <span>·</span> NASM VCS Model <span>·</span> Massachusetts &amp; Remote</p>
        </div>
        <div className="forge-hero-showcase">
          <div className="forge-hero-image-wrapper">
            <Image
              src="/images/hero-personal-coaching.jpg"
              alt="Coach Gordon coaching an everyday client through dumbbell goblet squat form during a personalized training session"
              width={680}
              height={510}
              priority
              sizes="(max-width: 760px) 92vw, 45vw"
              className="forge-hero-main-img"
            />
            <div className="forge-hero-badge-overlay">
              <div className="forge-hero-badge-coach">
                <Image
                  src="/images/hero-personal-coaching-45wk-goal.jpg"
                  alt="Coach Gordon"
                  width={40}
                  height={40}
                  className="forge-hero-badge-avatar"
                />
                <div>
                  <strong>Coach Gordon</strong>
                  <span>NASM-CPT® · Since 2008</span>
                </div>
              </div>
              <div className="forge-hero-badge-tag">
                <span>✓ Form Checked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="forge-feature-section" aria-labelledby="forge-features-title">
        <div className="forge-section-intro">
          <p className="forge-eyebrow">The Forge system</p>
          <h2 id="forge-features-title">A stronger foundation for every rep.</h2>
          <p>One focused system for better training, better movement, and measurable progress.</p>
        </div>
        <div className="forge-feature-grid">
          {FEATURE_PILLARS.map(feature => (
            <article className="forge-feature-card" key={feature.number}>
              <div className="forge-feature-image-box">
                <Image
                  src={feature.image}
                  alt={feature.imageAlt}
                  width={640}
                  height={420}
                  loading="lazy"
                  sizes="(max-width: 768px) 94vw, 32vw"
                  className="forge-feature-img"
                />
                <span className="forge-feature-number">{feature.number}</span>
              </div>
              <div className="forge-feature-body">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Audience Showcase: Who We Train */}
      <section className="forge-personas-section" aria-labelledby="forge-personas-title">
        <div className="forge-section-intro">
          <p className="forge-eyebrow">Who We Train</p>
          <h2 id="forge-personas-title">Built for your starting point, age, and ambition.</h2>
          <p>Whether you are reversing desk strain, building long-term joint resilience, or elevating athletic performance, your training is calibrated specifically for you.</p>
        </div>
        <div className="forge-personas-grid">
          {AUDIENCE_PERSONAS.map((persona, index) => (
            <article className="forge-persona-card" key={index}>
              <div className="forge-persona-img-box">
                <Image
                  src={persona.image}
                  alt={persona.imageAlt}
                  width={600}
                  height={450}
                  loading="lazy"
                  sizes="(max-width: 640px) 94vw, (max-width: 1080px) 46vw, 23vw"
                  className="forge-persona-img"
                />
                <span className="forge-persona-tag">{persona.tag}</span>
              </div>
              <div className="forge-persona-body">
                <h3>{persona.title}</h3>
                <p>{persona.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Brand Manifesto: The Focus Sanctuary */}
      <section
        className="forge-manifesto-banner"
        style={{
          margin: '3.5rem auto',
          maxWidth: '1160px',
          padding: '2.75rem 2rem',
          borderRadius: '16px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 14, 24, 0.98) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontFamily: 'var(--font-telemetry)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <span>✕ NO SOCIAL MEDIA</span>
            <span>·</span>
            <span>ZERO DISTRACTIONS</span>
            <span>·</span>
            <span>100% COACHING</span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              color: '#FFFFFF',
              margin: '0 0 12px',
            }}
          >
            The Anti-Distraction Gym Sanctuary
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: '#CBD5E1',
              margin: '0 auto 2rem',
            }}
          >
            We don&apos;t spend your membership dues on social ads, endless feeds, or influencer clout.
            We pour 100% of our focus into <strong>the best tools</strong> and <strong>the best coaching</strong>—the perfect combination of computational AI and 18+ years of Master Coach stewardship.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  color: '#F87171',
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                PURE FOCUS
              </div>
              <h3 style={{ color: '#FFF', fontSize: '1.1rem', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                Zero Feeds. Pure Flow.
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                No doom-scrolling between sets. No dopamine traps. When you train, your attention belongs to mechanical tension, kinetic alignment, and real progress.
              </p>
            </div>
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.8)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  color: '#FBBF24',
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                THE GOLD STANDARD
              </div>
              <h3 style={{ color: '#FFF', fontSize: '1.1rem', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                Best Tools × Best Coaching
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                Sub-180ms computational AI handles bar velocity, posture mesh diagnostics, and dynamic load adaptation—steered by Master Coach Gordon&apos;s clinical guidance.
              </p>
            </div>
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.8)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  color: '#34D399',
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                UNDENIABLE PROOF
              </div>
              <h3 style={{ color: '#FFF', fontSize: '1.1rem', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                Results-Driven Flywheel
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                High-intent search discovery, peer recommendations, and a goal-achieving app that delivers measurable PRs with zero joint pain. Nothing but the best will do.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="forge-pricing-section" id="memberships" aria-labelledby="forge-pricing-title">
        <div className="forge-section-intro">
          <p className="forge-eyebrow">Simple membership options</p>
          <h2 id="forge-pricing-title">Choose your next step.</h2>
          <p>Start with the tools you need now. Upgrade when you are ready for more coaching.</p>
        </div>
        <ForgeMembershipPlans />
        <p className="forge-billing-note">Secure checkout. Cancel recurring memberships at any time.</p>
      </section>

      <section className="forge-founder-section" aria-labelledby="forge-founder-title">
        <div className="forge-founder-photo-wrap">
          <Image
            src="/images/hero-personal-coaching-45wk-goal.jpg"
            alt="Coach Gordon, NASM-CPT and Founder of Forge Athletic"
            width={440}
            height={550}
            loading="lazy"
            sizes="(max-width: 760px) 200px, 220px"
            className="forge-founder-photo"
          />
          <div className="forge-founder-experience-badge">
            <span className="forge-founder-badge-num">18+</span>
            <span className="forge-founder-badge-lbl">Years Coaching</span>
          </div>
        </div>
        <div>
          <p className="forge-eyebrow">A coach who gets the climb</p>
          <h2 id="forge-founder-title">Built from lived experience.</h2>
          <p>
            A personal trainer since 2008 and NASM Master Trainer candidate (active NASM-CPT), Coach Gordon was Fitness Director
            at Bally Total Fitness before launching his independent coaching practice in 2011. Having previously owned and operated a physical personal training studio, he deliberately evolved Forge Athletic into a 100% remote virtual performance model. Based in Massachusetts,
            he brings an AI engineer’s analytical mindset to training—and the empathy to meet
            every client where they are. Expect kindness and understanding, not drill-sergeant
            pressure; when your goals call for a firmer push, he can bring that too.
          </p>

          {/* Verified Credentials & Digital Badges Spotlight */}
          <div
            style={{
              margin: '1.5rem 0',
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.85) 0%, rgba(10, 18, 30, 0.95) 100%)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
              <Image
                src="/images/badges/nasm-cpt-badge.png"
                alt="Official NASM Certified Personal Trainer Digital Badge"
                width={56}
                height={56}
                style={{ objectFit: 'contain', flexShrink: 0 }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#34D399',
                      background: 'rgba(52, 211, 153, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                    }}
                  >
                    Verified NCCA Accredited
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontFamily: 'var(--font-telemetry)' }}>
                    Cert #1261890687
                  </span>
                </div>
                <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.05rem' }}>
                  NASM-CPT® &amp; ASTI CPR/AED Certified
                </div>
              </div>
            </div>

            <Link
              href="/credentials"
              style={{
                display: 'inline-flex',
                minHeight: 44,
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid var(--gold)',
                color: 'var(--gold-lt)',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <span>View Badges &amp; Credentials</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <p className="forge-founder-signoff">Whatever your goal, you can train for it here.</p>
        </div>
      </section>

      {/* Official Mobile Apps, iOS & PWA Companion Section */}
      <MobileAppPromoSection />

      <footer className="forge-home-footer">
        <Link href="/" aria-label="Forge Athletic home">Forge Athletic</Link>
        <p>Built From The Ground Up. Precision Science For Real Lives.</p>
        <nav aria-label="Footer">
          <Link href="/packages">Memberships</Link>
          <Link href="/credentials">Credentials</Link>
          <Link href="/apps">Mobile Apps &amp; PWA</Link>
          <Link href="/#mobile-apps">iOS &amp; Android</Link>
          <Link href="/auth/login">Log in</Link>
          <Link href="/auth/signup">Create account</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  )
}

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const rawPreview = resolvedParams.preview || resolvedParams.unmask || resolvedParams.unmasked
  const previewParam =
    typeof rawPreview === 'string'
      ? rawPreview
      : Array.isArray(rawPreview)
        ? rawPreview[0]
        : null

  const unmasked = isSiteUnmasked(previewParam)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqStructuredData) }}
      />
      {unmasked ? (
        <UnmaskedLandingMarkup isPreview={Boolean(previewParam)} />
      ) : (
        <main id="main-content">
          <HolidayUnmaskingSplash previewMode={Boolean(previewParam)} />
        </main>
      )}
    </>
  )
}
