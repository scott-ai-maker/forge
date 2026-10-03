import Link from 'next/link'
import WaitlistForm from '@/components/WaitlistForm'
import FirstVisitLeadCapture from '@/components/marketing/FirstVisitLeadCapture'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import TrackedCtaLink from '@/components/marketing/TrackedCtaLink'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import AppStoreBadges from '@/components/marketing/AppStoreBadges'
import MobileAppPromoSection from '@/components/marketing/MobileAppPromoSection'
import HelperAppRootGuard from '@/components/ui/HelperAppRootGuard'
import ForgeBrandMark from '@/components/ui/ForgeBrandMark'
import { PACKAGES } from '@/lib/stripe'

const COACH_PORTRAIT_IMAGE = '/images/coach-portrait.jpg?v=0.9.9'

const PILLARS = [
  {
    image: '/images/pillar-training-crest.jpg',
    pillarNum: 'Pillar I',
    title: 'Training & Periodization',
    subtitle: '12-Week OPT™ Macrocycle Engine',
    desc: 'Kinetic chain progression across all 5 NASM phases. Real-time 1RM overload telemetry, automated barbell plate calculators, and silent visual tempo cadences.',
    tags: ['12-Week Macrocycle', '1RM Telemetry', 'Cadence Pulse HUD'],
  },
  {
    image: '/images/pillar-movement-crest.jpg',
    pillarNum: 'Pillar II',
    title: 'Movement & Biometrics',
    subtitle: '3D AI Postural Mesh & OHSA Suite',
    desc: 'Computer-vision landmark tracking across 33 joint coordinates, 5 kinetic checkpoints, and automated 4-Phase Corrective Exercise Continuums (Inhibit, Lengthen, Activate, Integrate).',
    tags: ['3D Postural Mesh', 'OHSA 5 Checkpoints', 'CEx Continuums'],
  },
  {
    image: '/images/pillar-safety-crest.jpg',
    pillarNum: 'Pillar III',
    title: 'Prescriptions & Safety',
    subtitle: 'Chrono-Dosing & Travel Recalibration',
    desc: 'Evidence-based ergogenic supplement stacks with automated drug interaction screening and 1-click hotel gym travel program adaptations for international schedules.',
    tags: ['Chrono-Dosing', 'Interaction Shield', 'Road-Warrior Adapter'],
  },
  {
    image: '/images/pillar-concierge-crest.jpg',
    pillarNum: 'Pillar IV',
    title: 'Operations & Concierge',
    subtitle: 'WebRTC Live Studio & Sunday Dossiers',
    desc: 'High-definition 1:1 WebRTC consultation studio with real-time video telestrator drawing, slow-mo replay, Voice S.O.A.P. notes, and executive weekly intelligence memos.',
    tags: ['Live Telestrator', 'Voice S.O.A.P.', 'Apple Health Sync'],
  },
]

const HOME_STATS = [
  { num: '1:1', label: 'Bespoke Prescription', desc: 'Zero generic templates · Calibrated to your physiology' },
  { num: '17+', label: 'Years Master Authority', desc: 'Thousands of high-performing sessions coached' },
  { num: '100%', label: 'Evidence-Based OPT™', desc: 'NASM Sports Science & ISSN Nutritional Rigor' },
]

const TRANSFORMATION_STORIES = [
  {
    metric: '-42 lbs',
    timeframe: '5 months',
    title: 'Executive Body Recomposition',
    summary: 'Shed 42 lbs of visceral fat while increasing lean mass and preserving strength through 5-phase OPT™ periodization and weekly Sunday Dossier accountability.',
  },
  {
    metric: '+11 lbs',
    timeframe: '4 months',
    title: 'Lean Hypertrophy & Kinetic Power',
    summary: 'Added 11 lbs of functional muscle and increased compound lift 1RM strength by 38% through progressive overload, Cadence HUD tempo control, and chrono-dosed nutrition.',
  },
  {
    metric: '100% Adherence',
    timeframe: '24 weeks',
    title: 'Global Travel & Orthopedic Resilience',
    summary: 'Maintained zero missed weeks across 14 international business flights using 1-click hotel gym adaptions while reversing chronic lower-back shear with targeted CEx continuums.',
  },
]

export default function Home() {
  const prelaunchWaitlistMode = process.env.NEXT_PUBLIC_PRELAUNCH_WAITLIST_MODE !== '0'

  return (
    <>
      <HelperAppRootGuard />
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)' }} />

      {/* ── Founding Principal Intake Announcement Banner ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #050910 0%, #111A29 50%, #050910 100%)',
          borderBottom: '1px solid rgba(197, 160, 89, 0.35)',
          padding: '8px 16px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 60,
        }}
      >
        <Link
          href="/intake"
          style={{
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '11.5px',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <ForgeBrandMark size={14} withGlow={false} />
          <span style={{ color: 'var(--gold-lt)' }}>Founding Cohort:</span>
          <span>Precision Sports Science · Free 7-Day Trial Open</span>
          <span style={{ color: 'var(--gold)', textDecoration: 'underline', marginLeft: 4 }}>Start Free Trial →</span>
        </Link>
      </div>

      <SiteHeader
        fixed
        links={[
          { href: '/intake', label: 'Founding Intake' },
          { href: '/async-coaching', label: 'Async Coaching' },
          { href: '/packages', label: 'Memberships' },
          { href: '/audit', label: '3D AI Audit' },
          { href: '/apply', label: 'Apply' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <main id="main-content" className="home-modern" style={{ background: 'var(--navy)' }}>
        {/* ── 1. Executive Hero Section ── */}
        <section className="sgf-hero-bg home-hero-modern" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem 4rem' }}>
          {/* Ambient Gold Radial Spotlight */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80vw',
              maxWidth: 900,
              height: 450,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(197, 160, 89, 0.14) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div className="home-shell home-hero-grid" style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(1.5rem, 4vw, 3rem)', alignItems: 'center', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>
            <div className="home-hero-copy fade-in-up">
              <div className="crest-badge" style={{ marginBottom: 18 }}>
                <ForgeBrandMark size={22} variant="raster" withGlow={false} />
                <span>Precision Sports Science · Built From The Ground Up</span>
              </div>

              <h1
                className="home-hero-title font-serif"
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 'clamp(2.4rem, 5.2vw, 4.4rem)',
                  lineHeight: 1.15,
                  letterSpacing: '0.02em',
                  color: '#FFFFFF',
                  margin: '0 0 1.25rem',
                  fontWeight: 700,
                }}
              >
                Precision Sports Science.<br />
                <strong style={{ fontWeight: 800, color: 'var(--gold-lt)' }}>Built From The Ground Up.</strong><br />
                For Real Lives.
              </h1>

              <p className="home-hero-description" style={{ fontSize: 'clamp(1.05rem, 1.8vw, 1.22rem)', color: '#CBD5E1', lineHeight: 1.65, maxWidth: 600, margin: '0 0 2rem' }}>
                Elite 5-phase NASM OPT™ periodization, 3D computer-vision posture diagnostics, real-time telemetry, and precision training tools engineered for everyday, hardworking people who want extraordinary results.
              </p>

              <div className="home-hero-actions" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                {prelaunchWaitlistMode ? (
                  <TrackedCtaLink
                    href="#home-waitlist"
                    className="sgf-button sgf-button-primary tactile-btn"
                    eventName="hero_primary_cta_click"
                    eventPayload={{ mode: 'prelaunch', target: 'waitlist' }}
                    style={{ padding: '14px 28px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', boxShadow: '0 4px 20px rgba(197,160,89,0.4)' }}
                  >
                    Start 7-Day Free Trial
                  </TrackedCtaLink>
                ) : (
                  <TrackedCtaLink
                    href="/apply"
                    className="sgf-button sgf-button-primary tactile-btn"
                    eventName="hero_primary_cta_click"
                    eventPayload={{ mode: 'live', target: 'apply' }}
                    style={{ padding: '14px 30px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', boxShadow: '0 4px 20px rgba(197,160,89,0.4)' }}
                  >
                    Start 7-Day Free Trial
                  </TrackedCtaLink>
                )}

                <TrackedCtaLink
                  href="/packages"
                  className="sgf-button sgf-button-secondary tactile-btn"
                  eventName="hero_secondary_link_click"
                  eventPayload={{ destination: 'packages' }}
                  style={{ padding: '14px 24px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(197,160,89,0.4)', color: 'var(--gold-lt)' }}
                >
                  Explore Memberships
                </TrackedCtaLink>
              </div>

              {prelaunchWaitlistMode && (
                <div id="home-waitlist" className="home-hero-waitlist" style={{ marginTop: 24, maxWidth: 440 }}>
                  <WaitlistForm id="hero" />
                </div>
              )}

              <div className="home-hero-apps" style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="smartphone" size={13} tone="gold" />
                  <span>Forge Athletic Mobile App · Native Telemetry &amp; In-Gym HUD</span>
                </div>
                <AppStoreBadges variant="glass" size="sm" sourceEventPrefix="hero" />
              </div>

              <p className="home-hero-footnote" style={{ marginTop: 18, fontSize: 12, color: 'var(--gray)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="shield" size={12} tone="gold" />
                <span>Engineered for real lives · Elite periodization, 1RM telemetry, and 3D computer-vision biomechanics.</span>
              </p>
            </div>

            {/* Proof Panel */}
            <aside className="glass-card-gold fade-in-up" style={{ padding: '28px 26px', display: 'grid', gap: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -15, right: -15, zIndex: 0 }}>
                <GaaMasterWatermarkSeal size={150} opacity={0.08} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                <ForgeBrandMark size={44} variant="raster" />
                <div>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--gold-lt)', fontWeight: 800, display: 'block' }}>
                    Clinical Sports Science Standards
                  </span>
                  <h3 className="font-serif" style={{ fontSize: 22, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Why Athletes Train With Forge
                  </h3>
                </div>
              </div>

              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 10, fontSize: 13.5, color: '#CBD5E1', position: 'relative', zIndex: 1 }}>
                <li>Individualized 5-phase OPT™ macrocycles calibrated to your biomechanics</li>
                <li>1:1 Live WebRTC consultation studio with real-time telestrator markups</li>
                <li>3D AI Postural Mesh scanner &amp; automated 4-phase corrective continuums</li>
                <li>Continuous Apple Health &amp; Health Connect background telemetry integration</li>
                <li>Chrono-dosed ergogenic supplementation with pharmacological interaction shielding</li>
                <li>Executive Sunday Intelligence Dossiers &amp; progressive overload telemetry</li>
              </ul>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, borderTop: '1px solid rgba(197,160,89,0.25)', paddingTop: 16, position: 'relative', zIndex: 1 }}>
                {HOME_STATS.map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 28, color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 700 }}>
                      {stat.num}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* ── 2. The 4 Pillars of Human Performance Advisory ── */}
        <section className="home-shell fade-in-up" style={{ maxWidth: 1320, margin: '0 auto', padding: '4.5rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 3.5rem' }}>
            <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
              Proprietary Architecture
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 12px', fontWeight: 700 }}>
              The Four Pillars of Sovereign Advisory
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
              A closed-loop human performance ecosystem integrating structural movement analysis, periodized load management, clinical supplementation, and high-touch concierge oversight.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {PILLARS.map((pillar) => (
              <article
                key={pillar.title}
                className="glass-card luxury-card-interactive"
                style={{
                  padding: '24px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      backgroundImage: `url('${pillar.image}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1.5px solid var(--gold)',
                      boxShadow: '0 0 16px rgba(197, 160, 89, 0.35)',
                    }}
                  />
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>
                    {pillar.pillarNum}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif" style={{ fontSize: 20, margin: 0, color: '#FFFFFF', letterSpacing: '0.02em', fontWeight: 700 }}>
                    {pillar.title}
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, marginTop: 2 }}>
                    {pillar.subtitle}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.55, flexGrow: 1 }}>
                  {pillar.desc}
                </p>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  {pillar.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        color: 'var(--gray)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── 3. Performance Outcomes & Transformations ── */}
        <section className="home-shell fade-in-up" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 1.5rem 4.5rem' }}>
          <div className="glass-card-gold" style={{ padding: 'clamp(24px, 4vw, 40px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, zIndex: 0 }}>
              <GaaMasterWatermarkSeal size={200} opacity={0.06} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 680, margin: '0 auto 2.5rem' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
                Documented Results
              </span>
              <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 3.8vw, 2.8rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 8px', fontWeight: 700 }}>
                Measurable Transformations. Zero Guesswork.
              </h2>
              <p style={{ fontSize: 14, color: '#CBD5E1', margin: 0 }}>
                Verifiable physiological adaptations engineered through calculated progressive overload, kinetic cadence control, and clinical biofeedback.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, position: 'relative', zIndex: 1 }}>
              {TRANSFORMATION_STORIES.map(story => (
                <div
                  key={story.title}
                  style={{
                    background: 'rgba(8, 14, 24, 0.8)',
                    border: '1px solid rgba(197, 160, 89, 0.25)',
                    borderRadius: 10,
                    padding: '20px 22px',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 26, color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 700 }}>
                      {story.metric}
                    </div>
                    <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {story.timeframe}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#FFFFFF', fontWeight: 700 }}>
                    {story.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                    {story.summary}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                *Disclaimers &amp; Transparency: Documented physical outcomes reflect individualized athlete dedication, progressive OPT™ overload adherence, and nutritional consistency. Individual results will vary based on biological baselines, orthopedic history, and execution fidelity.
              </p>
            </div>
          </div>
        </section>

        {/* ── Mobile Apps Spotlight & Biometric Telemetry ── */}
        <MobileAppPromoSection />

        {/* ── 4. Private Coaching Retainers (Live Stripe Packages) ── */}
        <section className="home-shell fade-in-up" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 1.5rem 4.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 3rem' }}>
            <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
              Advisory Retainers
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 10px', fontWeight: 700 }}>
              Individualized Coaching Architecture
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
              Three distinct pathways tailored to your required level of direction: autonomous protocol execution, high-touch hybrid guidance, and private 1:1 sports science retainers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
            {PACKAGES.filter(pkg => ['starter', 'momentum', 'transformation'].includes(pkg.id)).map(pkg => {
              const isMasterTier = pkg.id === 'transformation'
              return (
                <article
                  key={pkg.id}
                  className={`glass-card luxury-card-interactive ${pkg.popular ? 'glass-card-gold' : ''}`}
                  style={{
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    position: 'relative',
                    border: isMasterTier
                      ? '1.5px solid var(--gold)'
                      : pkg.popular
                      ? '1.5px solid rgba(212,160,23,0.6)'
                      : '1px solid rgba(197,160,89,0.25)',
                    boxShadow: isMasterTier
                      ? '0 10px 40px rgba(0,0,0,0.6), 0 0 25px rgba(197,160,89,0.18)'
                      : undefined,
                    overflow: 'hidden',
                  }}
                >
                  {/* Master Seal Background Watermark for Tier 3 */}
                  {isMasterTier && (
                    <div style={{ position: 'absolute', bottom: -15, right: -15, opacity: 0.04, pointerEvents: 'none' }}>
                      <GaaMasterWatermarkSeal size={180} opacity={1} />
                    </div>
                  )}

                  {isMasterTier ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        background: 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 50%, #937332 100%)',
                        color: '#080E14',
                        padding: '3px 10px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 2px 10px rgba(197,160,89,0.3)',
                      }}
                    >
                      <GaaIcon name="crown" size={11} tone="inherit" />
                      <span>Private Master Tier</span>
                    </div>
                  ) : pkg.popular ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        background: 'linear-gradient(90deg, var(--gold) 0%, var(--gold-lt) 100%)',
                        color: '#080E14',
                        padding: '3px 10px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <GaaIcon name="star" size={10} style={{ color: '#080E14', stroke: '#080E14' }} />
                      <span>Flagship Tier</span>
                    </div>
                  ) : null}

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)' }}>
                      {pkg.subtitle}
                    </span>
                    <h3 className="font-serif" style={{ fontSize: 22, color: '#FFFFFF', margin: '4px 0 0', letterSpacing: '0.02em', fontWeight: 700 }}>
                      {pkg.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 36, color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 700 }}>
                      ${pkg.price / 100}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      /{pkg.billingLabel.replace('per ', '')}
                    </span>
                  </div>

                  {isMasterTier && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        background: 'rgba(197,160,89,0.1)',
                        border: '1px solid rgba(197,160,89,0.3)',
                        borderRadius: 4,
                        fontSize: 11,
                        color: 'var(--gold-lt)',
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ color: 'var(--gold)' }}>✦</span>
                      <span>Strictly Capped at 8 Principals · 2 Remaining</span>
                    </div>
                  )}

                  <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, minHeight: 40 }}>
                    {pkg.description}
                  </p>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'grid', gap: 8, flexGrow: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)' }}>
                      Included Deliverables:
                    </div>
                    {pkg.deliverables.map(deliv => (
                      <div key={deliv} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#E2E8F0' }}>
                        <GaaIcon name="check" size={13} tone="gold" />
                        <span>{deliv}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    {isMasterTier ? (
                      <TrackedCtaLink
                        href="/packages?tier=transformation"
                        className="tactile-btn"
                        eventName="tier_card_cta_click"
                        eventPayload={{ tier: pkg.id }}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          padding: '13px 18px',
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          background: 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 50%, #937332 100%)',
                          color: '#080E14',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 4px 18px rgba(197,160,89,0.4)',
                        }}
                      >
                        <GaaIcon name="crown" size={14} tone="inherit" />
                        <span>Request Master Allocation</span>
                      </TrackedCtaLink>
                    ) : (
                      <TrackedCtaLink
                        href={`/packages?tier=${pkg.id}`}
                        className={`sgf-button ${pkg.popular ? 'sgf-button-primary' : 'sgf-button-secondary'} tactile-btn`}
                        eventName="tier_card_cta_click"
                        eventPayload={{ tier: pkg.id }}
                        style={{ width: '100%', textAlign: 'center', padding: '12px 16px', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                      >
                        Apply for {pkg.name}
                      </TrackedCtaLink>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link
              href="/packages"
              className="tactile-btn"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--gold-lt)',
                textDecoration: 'underline',
                letterSpacing: '0.04em',
              }}
            >
              View complete retainer catalog, B2B corporate licenses &amp; service level agreements (SLA) →
            </Link>
          </div>
        </section>

        {/* ── 5. Master Coach Authority Profile ── */}
        <section className="home-coach-section fade-in-up" style={{ borderTop: '1px solid rgba(197,160,89,0.2)', borderBottom: '1px solid rgba(197,160,89,0.2)', padding: '4.5rem 1.5rem', background: 'rgba(14, 23, 38, 0.45)' }}>
          <div className="home-shell home-coach-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div
              className="home-coach-photo"
              style={{
                width: '100%',
                aspectRatio: '4/5',
                borderRadius: 14,
                backgroundImage: `linear-gradient(180deg, rgba(8,14,20,0.1), rgba(8,14,20,0.6)), url('${COACH_PORTRAIT_IMAGE}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                border: '1.5px solid var(--gold)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(197,160,89,0.2)',
              }}
            />

            <div className="home-coach-copy" style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--gold-lt)' }}>
                  Lead Sports Scientist &amp; Founder
                </span>
              </div>

              <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: 0, lineHeight: 1.1, fontWeight: 700 }}>
                Scott Gordon <span style={{ fontSize: '1.2rem', color: 'var(--gold)', fontFamily: 'Raleway, sans-serif', fontWeight: 600, verticalAlign: 'middle' }}>· Founder &amp; Head Coach</span>
              </h2>

              <p style={{ fontSize: 14.5, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
                Coach Scott Gordon grew up with humble beginnings; his parents were poor and had nothing. He didn&apos;t come from money or country clubs. After transforming his own body and life by <strong>50+ lbs</strong>, he mastered NASM Sports Science (CPT, CES, PES, FNS) with over <strong>17 years</strong> of coaching experience.
              </p>

              <p style={{ fontSize: 14.5, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
                He engineered <strong>Forge Athletic</strong> to give real, hardworking people the exact precision training tools, 5-phase OPT™ periodization, and computer-vision biomechanics previously locked behind luxury paywalls.
              </p>

              <p style={{ fontSize: 14.5, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
                Whether you train in a garage gym or a commercial facility, Forge delivers elite periodization, automated 1RM progression, and instant form corrections directly to your smartphone.
              </p>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <TrackedCtaLink
                  href="/apply"
                  className="sgf-button sgf-button-primary tactile-btn"
                  eventName="coach_section_cta_click"
                  eventPayload={{ target: 'apply' }}
                  style={{ padding: '12px 24px', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  Start 7-Day Free Trial
                </TrackedCtaLink>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Final Call to Action ── */}
        <section className="sgf-cta-bg home-cta-modern" style={{ padding: '5rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="home-shell home-cta-inner" style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(197, 160, 89, 0.15)', border: '1px solid rgba(197, 160, 89, 0.4)', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>
                Built For Real Lives
              </span>
            </div>

            <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '0 0 14px', lineHeight: 1.15, fontWeight: 700 }}>
              Ready to Command Your <span className="gold-gradient-text">Physical Potential?</span>
            </h2>

            <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.6, maxWidth: 580, margin: '0 auto 2rem' }}>
              Experience automated periodization, real-time 1RM progression, and 3D computer-vision movement diagnostics. Start your 100% free 7-day trial today.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <TrackedCtaLink
                href="/apply"
                className="sgf-button sgf-button-primary tactile-btn"
                eventName="bottom_cta_click"
                eventPayload={{ mode: 'live', destination: 'apply' }}
                style={{ padding: '14px 32px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 20px rgba(197,160,89,0.4)' }}
              >
                Start 7-Day Free Trial
              </TrackedCtaLink>

              <TrackedCtaLink
                href="/packages"
                className="sgf-button sgf-button-secondary tactile-btn"
                eventName="bottom_cta_click"
                eventPayload={{ mode: 'live', destination: 'packages' }}
                style={{ padding: '14px 24px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(197,160,89,0.4)', color: 'var(--gold-lt)' }}
              >
                Explore Memberships
              </TrackedCtaLink>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <p style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 12 }}>
                Download the Forge Athletic Native App
              </p>
              <AppStoreBadges variant="glass" size="md" align="center" sourceEventPrefix="bottom_cta" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <FirstVisitLeadCapture />
    </>
  )
}
