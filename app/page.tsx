import Image from 'next/image'
import Link from 'next/link'
import ForgeMembershipPlans from '@/components/packages/ForgeMembershipPlans'

const FEATURE_PILLARS = [
  {
    number: '01',
    title: 'Train with a plan',
    description: 'Adaptive NASM OPT™ periodization, progressive overload, and clear 1RM trends.',
  },
  {
    number: '02',
    title: 'Understand your movement',
    description: 'Computer-vision posture and kinetic-chain screening to make movement easier to understand.',
  },
  {
    number: '03',
    title: 'Connect the signals',
    description: 'Bring workouts and wearable telemetry together to guide training and recovery.',
  },
]

export default function Home() {
  return (
    <main className="foundation-home forge-marketing" id="main-content">
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
          <Link href="/auth/login">Log in</Link>
          <Link className="forge-header-cta" href="/auth/signup">Get started</Link>
        </nav>
      </header>

      <section className="forge-hero" aria-labelledby="forge-hero-title">
        <div className="forge-hero-copy">
          <p className="forge-eyebrow"><span />Performance built on science</p>
          <h1 id="forge-hero-title">Built From The Ground Up.</h1>
          <p className="forge-hero-tagline">Precision Science For Real Lives.</p>
          <p className="forge-hero-description">
            Training that meets you where you are—with a plan, useful feedback, and progress
            you can measure. Built for real schedules, real bodies, and the long game.
          </p>
          <div className="forge-hero-actions">
            <Link className="forge-primary-link" href="/packages">Explore memberships</Link>
            <Link className="forge-secondary-link" href="/auth/login">Member sign in <span aria-hidden="true">→</span></Link>
          </div>
          <p className="forge-hero-proof">Evidence-led training <span>·</span> Human coaching <span>·</span> No one-size-fits-all plans</p>
        </div>
        <div className="forge-hero-mark">
          <Image
            src="/images/brand/logo-concept-1-kinetic-f.jpg"
            alt="Forge Athletic kinetic F, grounded anvil, and upward flame-shard logo"
            width={560}
            height={560}
            priority
            sizes="(max-width: 760px) 78vw, 42vw"
          />
        </div>
      </section>

      <section className="forge-feature-section" aria-labelledby="forge-features-title">
        <div className="forge-section-intro">
          <p className="forge-eyebrow">The Forge system</p>
          <h2 id="forge-features-title">A stronger foundation for every rep.</h2>
          <p>Training, movement, and recovery—connected in one practical performance system.</p>
        </div>
        <div className="forge-feature-grid">
          {FEATURE_PILLARS.map(feature => (
            <article className="forge-feature-card" key={feature.number}>
              <span className="forge-feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
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
        <div className="forge-founder-mark" aria-hidden="true">SG</div>
        <div>
          <p className="forge-eyebrow">A coach who gets the climb</p>
          <h2 id="forge-founder-title">Built from lived experience.</h2>
          <p>
            Coach Scott Gordon started with humble beginnings and overcame poverty. After
            transforming his own body by more than 50 pounds, he immersed himself in NASM
            sports science—with a clear purpose: make thoughtful, high-level training
            accessible to everyday people doing the work.
          </p>
          <p className="forge-founder-signoff">The work is personal. The plan is yours.</p>
        </div>
      </section>

      <footer className="forge-home-footer">
        <Link href="/" aria-label="Forge Athletic home">Forge Athletic</Link>
        <p>Built From The Ground Up. Precision Science For Real Lives.</p>
        <nav aria-label="Footer">
          <Link href="/packages">Memberships</Link>
          <Link href="/auth/login">Log in</Link>
          <Link href="/auth/signup">Create account</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  )
}
