import Image from 'next/image'
import Link from 'next/link'
import MobileAppPromoSection from '@/components/marketing/MobileAppPromoSection'
import BlackFridayShowcaseSection from '@/components/marketing/BlackFridayShowcaseSection'
import AppSneakPeekShowcase from '@/components/marketing/AppSneakPeekShowcase'
import EverydayMomentsStrip from '@/components/marketing/EverydayMomentsStrip'
import CompleteFeatureEcosystem from '@/components/marketing/CompleteFeatureEcosystem'
import CoachAuthoritySection from '@/components/marketing/CoachAuthoritySection'
import LandingFaqAccordion from '@/components/marketing/LandingFaqAccordion'
import FoundingRateLockPricingGrid from '@/components/packages/FoundingRateLockPricingGrid'
import { COACH_GORDON_TRUST_PROFILE } from '@/lib/landingSocialProof'

const NAV_ANCHORS = [
  { href: '#sneak-peek', label: 'Sneak Peek' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#coach', label: 'Coach' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

export default function FullMarketingHome({ isPreview = false }: { isPreview?: boolean }) {
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
            priority
          />
          <span>Forge Athletic</span>
        </Link>
        <nav aria-label="Primary landing page sections and account" className="flex flex-wrap items-center gap-3">
          {NAV_ANCHORS.map(anchor => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="hidden text-xs font-semibold text-slate-300 transition hover:text-amber-300 lg:inline"
            >
              {anchor.label}
            </a>
          ))}
          <Link href="/auth/login">Log in</Link>
          <Link className="forge-header-cta" href="/auth/signup">
            Get started
          </Link>
        </nav>
      </header>

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

      <div className="px-4 sm:px-6">
        <AppSneakPeekShowcase />
      </div>

      <div className="px-4 sm:px-6">
        <EverydayMomentsStrip />
      </div>

      <div className="px-4 sm:px-6">
        <CompleteFeatureEcosystem />
      </div>

      <div className="px-4 sm:px-6">
        <CoachAuthoritySection />
      </div>

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
            locked for life while active.
          </p>
        </div>

        <FoundingRateLockPricingGrid mode="live" />

        <p className="forge-billing-note">
          Secure checkout. Includes 1 free 30-day Founding Partner Pass. Cancel recurring
          memberships at any time.
        </p>
      </section>

      <div className="px-4 sm:px-6">
        <LandingFaqAccordion />
      </div>

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
