import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import MobileAppPromoSection from '@/components/marketing/MobileAppPromoSection'
import HolidayUnmaskingSplash from '@/components/marketing/HolidayUnmaskingSplash'
import BlackFridayShowcaseSection from '@/components/marketing/BlackFridayShowcaseSection'
import AppSneakPeekShowcase from '@/components/marketing/AppSneakPeekShowcase'
import EverydayMomentsStrip from '@/components/marketing/EverydayMomentsStrip'
import CompleteFeatureEcosystem from '@/components/marketing/CompleteFeatureEcosystem'
import CoachAuthoritySection from '@/components/marketing/CoachAuthoritySection'
import LandingFaqAccordion from '@/components/marketing/LandingFaqAccordion'
import FoundingRateLockPricingGrid from '@/components/packages/FoundingRateLockPricingGrid'
import LandingHeaderSfxToggle from '@/components/marketing/LandingHeaderSfxToggle'
import { COACH_GORDON_TRUST_PROFILE, LANDING_FAQ_ITEMS } from '@/lib/landingSocialProof'
import { isSiteUnmasked } from '@/lib/launch-config'

export const metadata: Metadata = {
  title: 'Forge Athletic | Online Personal Training, 33-Point Posture Diagnostics & NASM OPT™',
  description:
    'Don’t wait for January to repair what November broke. A real NASM-certified personal trainer at your side—combining 33-point phone camera posture diagnostics, Coach Gordon’s real voice pacing every rep, and direct email or text access.',
  openGraph: {
    title: 'Forge Athletic | Online Personal Training & 33-Point Camera Posture Diagnostics',
    description:
      'A real NASM-certified personal trainer at your side—33-point phone camera posture diagnostics, Coach Gordon’s real voice pacing every rep, and direct coaching access.',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

const homeFaqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LANDING_FAQ_ITEMS.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

const AUDIENCE_PERSONAS = [
  {
    tag: 'Posture & Energy',
    title: 'Busy Professionals & Desk Workers',
    description:
      'Reverse the stiffness of long desk hours with 5-second Desk Ergonomics Audits, 5-Minute Desk Resets, and steady 20-minute strength sessions.',
    image: '/images/personas/executive-strength.jpg',
    imageAlt:
      'Professional woman performing controlled dumbbell Romanian deadlift with focused alignment',
  },
  {
    tag: 'Joint Health & Vitality',
    title: 'Longevity & Joint-Conscious Lifters (40s–60s+)',
    description:
      'Protect knees, shoulders, and spine while preserving bone density with Phase 01 Stabilization screening and 1-tap joint-safe regressions.',
    image: '/images/personas/longevity-vitality-male.jpg',
    imageAlt:
      'Active mature man performing controlled kettlebell deadlift in athletic t-shirt with clean posture',
  },
  {
    tag: 'Hotel & Travel',
    title: 'Frequent Travelers & Busy Parents',
    description:
      'Switch seamlessly between Bodyweight Only, Home Dumbbells, Apartment Gym, and Hotel Travel without losing 5-Phase NASM OPT™ momentum.',
    image: '/images/remote-virtual-coaching.jpg',
    imageAlt:
      'Focused home and travel dumbbell workout guided by structured NASM progression',
  },
]

const NAV_ANCHORS = [
  { href: '#sneak-peek', label: 'Sneak Peek' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#coach', label: 'Coach' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

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
          <strong>INTERNAL PREVIEW:</strong> Viewing full unmasked site. Public visitors currently
          see the Founding Cohort Pre-Launch experience until Friday, Nov 20 at 6:00 AM EST.
        </div>
      )}

      <header className="forge-home-header">
        <Link className="forge-home-brand" href="/" aria-label="Forge Athletic home">
          <Image
            src="/images/brand/forge-crest-mark.png"
            alt=""
            width={48}
            height={48}
          />
          <span>Forge Athletic</span>
        </Link>
        <nav
          aria-label="Primary landing page sections and account"
          className="flex flex-wrap items-center gap-3"
        >
          {NAV_ANCHORS.map(anchor => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="hidden text-xs font-semibold text-slate-300 transition hover:text-amber-300 lg:inline"
            >
              {anchor.label}
            </a>
          ))}
          <LandingHeaderSfxToggle />
          <Link href="/auth/login">Log in</Link>
          <Link className="forge-header-cta" href="/auth/signup">
            Get started
          </Link>
        </nav>
      </header>

      {/* Mobile / Tablet Anchor Navigation Strip */}
      <nav
        aria-label="Mobile section navigation"
        className="mx-auto mb-4 flex max-w-[1160px] items-center gap-2 overflow-x-auto px-4 py-1 text-xs font-semibold text-zinc-300 lg:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {NAV_ANCHORS.map(anchor => (
          <a
            key={anchor.href}
            href={anchor.href}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg border border-white/[0.08] bg-[#111318] px-3 text-zinc-300 no-underline transition hover:border-amber-400/40 hover:text-amber-300"
          >
            {anchor.label}
          </a>
        ))}
      </nav>

      {/* 1. HERO SECTION (Outcome-First & Grounded) */}
      <section className="forge-hero" aria-labelledby="forge-hero-title">
        <div className="forge-hero-copy">
          <p className="forge-eyebrow">
            <span />
            FOUNDING COHORT (50 SPOTS) · OPENS FRIDAY, NOV 20 AT 6:00 AM EST
          </p>
          <h1 id="forge-hero-title">
            Don’t wait for January to repair what November broke.
          </h1>
          <p className="forge-hero-description">
            A real NASM-certified personal trainer at your side—combining 33-point phone camera
            posture diagnostics, Coach Gordon’s real voice pacing every rep, and direct email or
            text access whenever you want human eyes on your training.
          </p>
          <div className="forge-hero-actions">
            <Link className="forge-primary-link" href="/auth/signup">
              Claim Your Founding Member Pass →
            </Link>
            <a className="forge-secondary-link" href="#sneak-peek">
              Explore Sneak Peek <span aria-hidden="true">→</span>
            </a>
          </div>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-400">
            Includes your permanent Founding Member Lifetime Rate Lock, a complimentary 1-on-1
            movement screening with Coach Gordon before Thanksgiving, and 1 free 30-day Founding
            Partner Pass to gift a spouse or friend.
          </p>
          <p className="forge-hero-proof">
            {COACH_GORDON_TRUST_PROFILE.verificationBadge} <span>·</span> NASM Master Trainer
            Candidate <span>·</span> 18+ Years Personal Coaching
          </p>
        </div>

        <div className="forge-hero-showcase">
          <div className="forge-hero-image-wrapper">
            <Image
              src="/images/hero-personal-coaching.jpg"
              alt="Coach Gordon coaching an everyday client through dumbbell goblet squat alignment during a personalized training session"
              width={680}
              height={510}
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 760px) 92vw, 45vw"
              className="forge-hero-main-img"
            />
            <div className="forge-hero-badge-overlay">
              <div className="forge-hero-badge-coach">
                <Image
                  src={COACH_GORDON_TRUST_PROFILE.portraitSrc}
                  alt="Coach Gordon"
                  width={40}
                  height={40}
                  className="forge-hero-badge-avatar"
                />
                <div>
                  <strong>{COACH_GORDON_TRUST_PROFILE.name}</strong>
                  <span>{COACH_GORDON_TRUST_PROFILE.verificationBadge}</span>
                </div>
              </div>
              <div className="forge-hero-badge-tag">
                <span>✓ 33-Point Checked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BlackFridayShowcaseSection />

      {/* 2. INTERACTIVE 4-TAB SNEAK PEEK SHOWCASE (#sneak-peek) */}
      <div className="px-4 sm:px-6">
        <AppSneakPeekShowcase />
      </div>

      {/* 3. "A REAL TRAINER AT YOUR SIDE" — EVERYDAY MOMENTS STRIP (#how-it-works) */}
      <div className="px-4 sm:px-6">
        <EverydayMomentsStrip />
      </div>

      {/* 4. COMPLETE FEATURE ECOSYSTEM (#features) */}
      <div className="px-4 sm:px-6">
        <CompleteFeatureEcosystem />
      </div>

      {/* 5. HUMAN AUTHORITY & EVERYDAY SOCIAL PROOF (#coach) */}
      <div className="px-4 sm:px-6">
        <CoachAuthoritySection />
      </div>

      {/* Audience Showcase: Who We Train */}
      <section className="forge-personas-section" aria-labelledby="forge-personas-title">
        <div className="forge-section-intro">
          <p className="forge-eyebrow">Who We Train</p>
          <h2 id="forge-personas-title">Built for your starting point, schedule, and joints.</h2>
          <p>
            Whether you are undoing desk stiffness, protecting knees and shoulders for the long run,
            or staying consistent on work travel, every phase adapts to your day.
          </p>
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
                  sizes="(max-width: 640px) 94vw, (max-width: 1080px) 46vw, 31vw"
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

      {/* Brand Manifesto: The Precision Training Sanctuary */}
      <section
        className="forge-manifesto-banner"
        style={{
          margin: '3.5rem auto',
          maxWidth: '1160px',
          padding: '2.75rem 2rem',
          borderRadius: '16px',
          background:
            'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 14, 24, 0.98) 100%)',
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
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#FDE68A',
              fontFamily: 'var(--font-telemetry)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <span>CLINICAL SPORTS SCIENCE</span>
            <span>·</span>
            <span>CALM CONSISTENCY</span>
            <span>·</span>
            <span>HUMAN STEWARDSHIP</span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 1.3rem + 2vw, 2.5rem)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              color: '#FFFFFF',
              margin: '0 0 12px',
            }}
          >
            The Precision Training Sanctuary
          </h2>
          <p
            style={{
              fontSize: '1.02rem',
              lineHeight: 1.6,
              color: '#CBD5E1',
              margin: '0 auto 2rem',
            }}
          >
            Built around NASM Virtual Coaching standards, Forge Athletic focuses on practical
            biomechanics tools and attentive human coaching—combining on-device camera diagnostics
            with 18+ years of personal coaching experience and zero social-feed noise.
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
                  color: '#FBBF24',
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                CALM FOCUS
              </div>
              <h3
                style={{
                  color: '#FFF',
                  fontSize: '1.1rem',
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Uninterrupted Flow State
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                Hands-free voice tempo cues and quiet rest pacing keep your phone propped across the
                room so you can focus on clean reps and steady breathing.
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
                HYBRID CRAFT
              </div>
              <h3
                style={{
                  color: '#FFF',
                  fontSize: '1.1rem',
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Best Tools × Best Coaching
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                On-device computer vision handles 33-point posture angles and daily readiness checks
                while Coach Gordon oversees form reviews, safety alerts, and progression.
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
                MEASURED PROGRESS
              </div>
              <h3
                style={{
                  color: '#FFF',
                  fontSize: '1.1rem',
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Results-Driven Flywheel
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                Degree-by-degree posture improvements, comfortable joints, and steady 5-Phase OPT™
                milestones compound week after week—at home or on the road.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. STREAMLINED 3-TIER PRICING MATRIX (#pricing) */}
      <section
        className="forge-pricing-section scroll-mt-24"
        id="pricing"
        aria-labelledby="forge-pricing-title"
      >
        <div className="forge-section-intro">
          <p className="forge-eyebrow">Founding Member Lifetime Rate Lock</p>
          <h2 id="forge-pricing-title">Lock in your Founding Member rate permanently.</h2>
          <p>
            Post-launch rates apply after our 50-spot Founding Cohort fills. Your monthly rate stays
            locked for life while active, and carries over if you upgrade tiers later.
          </p>
        </div>

        <FoundingRateLockPricingGrid mode="live" />

        <p className="forge-billing-note">
          Secure checkout. Includes 1 free 30-day Founding Partner Pass. Cancel recurring
          memberships at any time.
        </p>
      </section>

      {/* 7. UPDATED FAQ ACCORDION (#faq) */}
      <div className="px-4 sm:px-6">
        <LandingFaqAccordion />
      </div>

      {/* Official Mobile Apps, iOS & PWA Companion Section */}
      <MobileAppPromoSection />

      <footer className="forge-home-footer">
        <Link href="/" aria-label="Forge Athletic home">
          Forge Athletic
        </Link>
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

  const forceSplash = resolvedParams.splash === '1' || resolvedParams.splash === 'true'
  const unmasked = forceSplash ? false : isSiteUnmasked(previewParam)

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
