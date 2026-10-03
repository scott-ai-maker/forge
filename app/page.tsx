import Link from 'next/link'

const FOUNDATION_FEATURES = [
  'NASM 5-phase OPT periodization engines',
  '3D AI postural and kinetic-chain screening',
  'WebRTC coaching studio and training tools',
  'Athlete dashboard, coach cockpit, and telemetry integrations',
  'Supabase authentication and Stripe billing infrastructure',
]

const MEMBERSHIP_TIERS = ['Core Membership', 'Pro Athlete', 'Transformation Direct']

export default function Home() {
  return (
    <main className="foundation-home" id="main-content">
      <header className="foundation-home-header">
        <Link className="foundation-home-wordmark" href="/" aria-label="Forge Athletic home">
          Forge Athletic
        </Link>
        <nav aria-label="Account">
          <Link href="/auth/login">Log in</Link>
          <Link className="foundation-home-signup" href="/auth/signup">Create account</Link>
        </nav>
      </header>

      <div className="foundation-home-content">
        <section className="foundation-home-hero" aria-labelledby="foundation-title">
          <p className="foundation-home-eyebrow">Sports science platform</p>
          <h1 id="foundation-title">A new foundation for athletic performance.</h1>
          <p>
            The training, movement, and coaching systems are being brought together here.
            Forge Athletic is preparing for its next phase.
          </p>
          <div className="foundation-home-actions">
            <Link className="foundation-home-primary" href="/auth/signup">Get started</Link>
            <Link href="/auth/login">Sign in</Link>
          </div>
        </section>

        <section className="foundation-home-section" aria-labelledby="foundation-status-title">
          <div className="foundation-home-section-heading">
            <div>
              <p className="foundation-home-eyebrow">Phase 1</p>
              <h2 id="foundation-status-title">Foundation status</h2>
            </div>
            <span className="foundation-home-status">Included in the source port</span>
          </div>
          <ul className="foundation-home-feature-list">
            {FOUNDATION_FEATURES.map(feature => (
              <li key={feature}>
                <span aria-hidden="true">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section className="foundation-home-section" aria-labelledby="membership-title">
          <div className="foundation-home-section-heading">
            <div>
              <p className="foundation-home-eyebrow">Membership</p>
              <h2 id="membership-title">Plans in development</h2>
            </div>
          </div>
          <div className="foundation-home-tier-list">
            {MEMBERSHIP_TIERS.map(tier => (
              <article className="foundation-home-tier" key={tier}>
                <h3>{tier}</h3>
                <p>Details will be announced in Phase 2.</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="foundation-home-footer">
        Forge Athletic <span>·</span> Foundation migration in progress
      </footer>
    </main>
  )
}
