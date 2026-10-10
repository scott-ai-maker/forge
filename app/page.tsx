import Image from 'next/image'
import Link from 'next/link'
import ForgeMembershipPlans from '@/components/packages/ForgeMembershipPlans'

const FEATURE_PILLARS = [
  {
    number: '01',
    title: 'A plan built around you',
    description: 'Personalized NASM OPT™ training that adapts to your goals and builds strength over time.',
  },
  {
    number: '02',
    title: 'Move with confidence',
    description: 'Practical movement screening and coaching help you understand how to train well.',
  },
  {
    number: '03',
    title: 'See progress that matters',
    description: 'Bring workouts, strength trends, and available recovery signals together in one clear view.',
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
          <Link href="/credentials">Credentials</Link>
          <Link href="/auth/login">Log in</Link>
          <Link className="forge-header-cta" href="/auth/signup">Get started</Link>
        </nav>
      </header>

      <section className="forge-hero" aria-labelledby="forge-hero-title">
        <div className="forge-hero-copy">
          <p className="forge-eyebrow"><span />Performance built on science</p>
          <h1 id="forge-hero-title">Personal Training, Built Around You.</h1>
          <p className="forge-hero-tagline">Personal trainer since 2008. NASM Master Trainer.</p>
          <p className="forge-hero-description">
            Whatever your goal, get a plan shaped around your starting point and schedule—with
            practical coaching and progress you can measure.
          </p>
          <div className="forge-hero-actions">
            <Link className="forge-primary-link" href="/packages">Explore memberships</Link>
            <Link className="forge-secondary-link" href="/auth/login">Member sign in <span aria-hidden="true">→</span></Link>
          </div>
          <p className="forge-hero-proof">Personal trainer since 2008 <span>·</span> NASM Master Trainer <span>·</span> No one-size-fits-all plans</p>
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
          <p>One focused system for better training, better movement, and measurable progress.</p>
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
            A personal trainer since 2008 and NASM Master Trainer, Scott was Fitness Director
            at Bally Total Fitness before opening his local training business in 2011. Today,
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

      <footer className="forge-home-footer">
        <Link href="/" aria-label="Forge Athletic home">Forge Athletic</Link>
        <p>Built From The Ground Up. Precision Science For Real Lives.</p>
        <nav aria-label="Footer">
          <Link href="/packages">Memberships</Link>
          <Link href="/credentials">Credentials</Link>
          <Link href="/auth/login">Log in</Link>
          <Link href="/auth/signup">Create account</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  )
}
