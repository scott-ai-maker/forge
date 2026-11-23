import Image from 'next/image'
import Link from 'next/link'
import AppSneakPeekShowcase from '@/components/marketing/AppSneakPeekShowcase'
import EverydayMomentsStrip from '@/components/marketing/EverydayMomentsStrip'
import LandingFaqAccordion from '@/components/marketing/LandingFaqAccordion'
import FoundingRateLockPricingGrid from '@/components/packages/FoundingRateLockPricingGrid'
import { COACH_GORDON_TRUST_PROFILE } from '@/lib/landingSocialProof'
import { HOLIDAY_DEAL_PROMO } from '@/lib/launch-config'

const NAV_ANCHORS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#movement-lab', label: 'Movement Lab' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

/**
 * Streamlined 5-part live marketing homepage shared by `/` (post-launch / preview) and `/preview`.
 */
export default function LiveLandingHome({ isPreview = false }: { isPreview?: boolean }) {
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
          }}
        >
          <strong>Internal Preview:</strong> Viewing full live homepage. Public visitors currently
          see the Founding Cohort pre-launch pass until Monday, Jan 4, 2027 at 6:00 AM EST.
        </div>
      )}

      {/* 1. TOP NAV */}
      <header className="forge-home-header">
        <Link className="forge-home-brand" href="/" aria-label="Forge Athletic home">
          <Image src="/images/brand/forge-crest-mark.png" alt="" width={44} height={44} />
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
          <Link href="/auth/login">Member Sign In</Link>
          <Link className="forge-header-cta" href="/auth/signup">
            Claim Founding Pass
          </Link>
        </nav>
      </header>

      {/* Mobile Anchor Strip */}
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

      {/* 2. HERO + FOUNDING COHORT PASS */}
      <section className="forge-hero" aria-labelledby="forge-hero-title">
        <div className="forge-hero-copy">
          <p className="forge-eyebrow">
            <span />
            Founding Cohort (50 Spots) · Code {HOLIDAY_DEAL_PROMO.code} (25% Rate Lock)
          </p>
          <h1 id="forge-hero-title">
            Start 2027 with joint-first precision—not a 3-week resolution.
          </h1>
          <p className="forge-hero-description">
            NASM-certified human coaching paired with local in-browser 33-point phone camera posture
            screening, adaptive 5-Phase OPT™ workouts, and Coach Gordon’s real voice pacing every
            session.
          </p>
          <div className="forge-hero-actions">
            <Link className="forge-primary-link" href="/auth/signup">
              Claim Your Founding Member Pass →
            </Link>
            <a className="forge-secondary-link" href="#movement-lab">
              Try Movement Lab <span aria-hidden="true">→</span>
            </a>
          </div>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-400">
            Use code <strong>{HOLIDAY_DEAL_PROMO.code}</strong> for your 25% Founding Continuous
            Tier Rate Lock, a complimentary 60-minute 1-on-1 kickoff movement screening with Coach
            Gordon (unlocked on your first paid cycle), and 1 giftable 30-day Core Lab Partner Pass.
          </p>
          <p className="forge-hero-proof">
            {COACH_GORDON_TRUST_PROFILE.verificationBadge} <span>·</span> Prior ACE-CPT (2008–2021){' '}
            <span>·</span> ASTI CPR/AED ·{' '}
            <Link href="/credentials" className="text-amber-300 underline-offset-4 hover:underline">
              Verify Credentials
            </Link>
          </p>
        </div>

        <div className="forge-hero-showcase">
          <div className="forge-hero-image-wrapper">
            <Image
              src="/images/hero-personal-coaching.jpg"
              alt="Coach Gordon guiding controlled dumbbell goblet squat alignment during a personalized training session"
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

      {/* 3. SINGLE FOCUSED INTERACTIVE DEMO (#movement-lab) */}
      <div className="px-4 sm:px-6">
        <AppSneakPeekShowcase />
      </div>

      {/* 4. HOW IT FITS REAL LIFE (#how-it-works) */}
      <div className="px-4 sm:px-6">
        <EverydayMomentsStrip />
      </div>

      {/* 5. MEMBERSHIP TIERS SUMMARY (#pricing) + TIGHT FAQ (#faq) + FOOTER */}
      <section
        className="forge-pricing-section scroll-mt-24"
        id="pricing"
        aria-labelledby="forge-pricing-title"
      >
        <div className="forge-section-intro">
          <p className="forge-eyebrow">Founding Member Continuous Tier Rate Lock</p>
          <h2 id="forge-pricing-title">Three clear month-to-month tiers.</h2>
          <p>
            Lock in 25% off your selected monthly tier with code {HOLIDAY_DEAL_PROMO.code} for as
            long as continuous active enrollment on that tier is maintained.
          </p>
        </div>

        <FoundingRateLockPricingGrid mode="live" />

        <div className="mx-auto mt-7 flex max-w-[1160px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-400/30 bg-[#111318] p-5 text-left">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-wider">
              <span className="rounded bg-amber-400/15 px-2 py-0.5 text-amber-300">
                Live Video Studio · Single &amp; Team
              </span>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                Nights &amp; Weekends · Limited Seats
              </span>
            </div>
            <h3 className="mt-2 font-serif text-lg font-bold text-white">
              Live 1-on-1 Sessions ($180) &amp; Multi-Athlete Team Training ($3,500/mo)
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300">
              Train live in our encrypted 60fps WebRTC studio with real-time telestration &amp; ERAP safety—single 1:1 sessions ($180), 4-pack ($660), 8-pack ($1,240), or corporate Team Live Studio cohorts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/packages#live-1-on-1"
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/45 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 no-underline transition hover:bg-amber-500/25"
            >
              <span>Live 1:1 Pricing →</span>
            </Link>
            <Link
              href="/corporate"
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/12 px-4 py-2 text-xs font-bold text-emerald-200 no-underline transition hover:bg-emerald-500/22"
            >
              <span>Team Live Training →</span>
            </Link>
          </div>
        </div>

        <p className="forge-billing-note">
          Secure Stripe checkout. Includes 1 giftable 30-day Core Lab Partner Pass. Cancel recurring
          memberships anytime in 1 click ($0 cancellation fees).
        </p>
      </section>

      <div className="px-4 sm:px-6">
        <LandingFaqAccordion />
      </div>

      <footer className="forge-home-footer">
        <Link href="/" aria-label="Forge Athletic home">
          Forge Athletic
        </Link>
        <p>Built From The Ground Up. Precision Science For Real Lives.</p>
        <nav aria-label="Footer">
          <Link href="/packages">Pricing</Link>
          <Link href="/corporate">Team Training</Link>
          <Link href="/audit">Movement Screen</Link>
          <Link href="/apply">Apply</Link>
          <Link href="/credentials">Credentials</Link>
          <Link href="/apps">PWA Guide</Link>
          <Link href="/auth/login">Member Sign In</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/health-privacy">Health Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/accessibility">Accessibility</Link>
        </nav>
        <p className="mx-auto mt-3 max-w-2xl text-[11px] leading-relaxed text-zinc-500">
          <strong>Trademark &amp; Non-Affiliation Notice:</strong> NASM®, Optimum Performance
          Training™, OPT™, and Certified Personal Trainer (CPT®) are registered trademarks or
          service marks of the National Academy of Sports Medicine (NASM) and/or Ascend Learning,
          LLC. Forge Athletic Performance LLC is an independent private entity and is not affiliated
          with, sponsored by, or endorsed by NASM or Ascend Learning, LLC.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          © {new Date().getFullYear()} Forge Athletic Performance LLC (MA ID #002010312). All Rights
          Reserved.
        </p>
      </footer>
    </main>
  )
}
