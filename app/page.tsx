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

const COACH_PORTRAIT_IMAGE = '/images/coach-portrait.jpg?v=0.9.9'

const PILLARS = [
  {
    image: '/images/pillar-training-crest.jpg',
    pillarNum: 'Pillar I',
    title: '5-Phase Periodization Engine',
    subtitle: 'NASM OPT™ Macrocycle Architecture',
    desc: 'Kinetic chain progression across all 5 NASM phases: Stabilization Endurance, Strength Endurance, Muscular Development, Maximal Strength, and Power. Automated 1RM overload telemetry and smart progression logic.',
    tags: ['5-Phase OPT™', '1RM Telemetry', 'Cadence Pulse HUD'],
  },
  {
    image: '/images/pillar-movement-crest.jpg',
    pillarNum: 'Pillar II',
    title: '3D AI Biomechanics & Posture',
    subtitle: 'Computer-Vision Movement Diagnostics',
    desc: 'Computer-vision landmark tracking across 33 joint coordinates, 5 kinetic chain checkpoints, and automated 4-Phase Corrective Exercise Continuums (Inhibit, Lengthen, Activate, Integrate).',
    tags: ['3D Postural Mesh', 'OHSA 5 Checkpoints', 'CEx Continuums'],
  },
  {
    image: '/images/pillar-safety-crest.jpg',
    pillarNum: 'Pillar III',
    title: 'In-Gym HUD & Barbell Math',
    subtitle: 'Automated Overload & Tempo Guidance',
    desc: 'Instant barbell plate calculations, visual silent tempo cadences, live RPE/RIR tracking, and 1-click travel program adaptations so you never stall or guess in the gym.',
    tags: ['Plate Math', 'Visual Cadence HUD', 'Travel Adapter'],
  },
  {
    image: '/images/pillar-concierge-crest.jpg',
    pillarNum: 'Pillar IV',
    title: 'Metabolic & Recovery Intelligence',
    subtitle: 'Tanaka Stage Cardio & Sleep Telemetry',
    desc: 'Tanaka 3-stage heart rate zone cardio conditioning, Apple HealthKit & Health Connect background telemetry sync, and automated Sunday Intelligence Dossiers that track your progress.',
    tags: ['Tanaka Cardio', 'Sunday Dossier', 'Apple Health Sync'],
  },
]

const HOME_STATS = [
  { num: '100%', label: 'Automated Science', desc: '0 coach friction · Instant progression algorithms' },
  { num: '17+', label: 'Years Experience', desc: 'Master NASM CPT, CES, PES & FNS framework' },
  { num: '$19.99', label: 'Starting Access', desc: 'Elite sports science tools for everyday people' },
]

const FORGE_MEMBERSHIPS = [
  {
    id: 'core',
    name: 'Core Membership',
    subtitle: 'Autonomous Precision Training',
    price: '$19.99',
    billing: 'month',
    annualNote: 'or $149/yr (Save 38%)',
    trial: '100% Free 7-Day Trial',
    popular: false,
    description: 'The automated training foundation for everyday people. Complete 5-phase OPT™ periodization with 0 marginal coach friction.',
    highlights: [
      '5-Phase NASM OPT™ Automated Periodization',
      'Real-Time 1RM Progressive Overload Telemetry',
      '3D AI Computer-Vision Posture & Movement Audit',
      'Automated Barbell Plate Math & Set Logging',
      'In-Gym Visual Cadence & Rest Interval HUD',
      'Apple HealthKit & Health Connect Sync',
    ],
    ctaText: 'Start 7-Day Free Trial',
    ctaHref: '/auth/signup?plan=core',
  },
  {
    id: 'pro',
    name: 'Pro Athlete',
    subtitle: 'Voice AI & Biomechanical Mesh',
    price: '$49',
    billing: 'month',
    annualNote: 'Most Popular Choice',
    trial: 'Includes 7-Day Trial',
    popular: true,
    description: 'Advanced sports science intelligence. Real-time audio coaching cadences and weekly automated biomechanical intelligence dossiers.',
    highlights: [
      'Everything in Core Membership',
      'Voice AI Real-Time Tempo & Cadence Coaching',
      '33-Point 3D Biomechanical Mesh Diagnostics',
      'Weekly Automated Sunday Intelligence Dossier',
      'Tanaka Stage Cardiorespiratory Optimization',
      'Chrono-Dosed Ergogenic Supplement Protocols',
    ],
    ctaText: 'Start Pro 7-Day Trial',
    ctaHref: '/auth/signup?plan=pro',
  },
  {
    id: 'direct',
    name: 'Transformation Direct',
    subtitle: 'Quarterly Video Critiques',
    price: '$199',
    billing: 'month',
    annualNote: 'Strictly Capped Intake',
    trial: 'Selective Roster',
    popular: false,
    description: 'Quarterly asynchronous video critiques with Coach Scott Gordon, combined with full Pro Athlete telemetry.',
    highlights: [
      'Everything in Pro Athlete',
      'Quarterly Asynchronous Video Form Analysis',
      'Voice S.O.A.P. Biomechanical Adaptation Notes',
      'Direct Priority Coach Q&A Channel',
      'Orthopedic Accommodation Protocol Tweaks',
      'Strictly Limited Roster Capacity',
    ],
    ctaText: 'Apply for Transformation',
    ctaHref: '/apply?plan=direct',
  },
]

const TRANSFORMATION_STORIES = [
  {
    metric: '-50 lbs',
    timeframe: 'Founder Journey',
    title: 'Coach Scott Gordon Transformation',
    summary: 'Lost 50+ lbs of fat and built an elite, pain-free physique through scientific 5-phase periodization, inspiring the creation of Forge Athletic.',
  },
  {
    metric: '-42 lbs',
    timeframe: '5 months',
    title: 'Everyday Athlete Recomposition',
    summary: 'Shed 42 lbs while increasing compound lift strength by 32% using automated 1RM overload telemetry and structured Tanaka cardio stages.',
  },
  {
    metric: '+14 lbs',
    timeframe: '4 months',
    title: 'Lean Muscle & Kinetic Power',
    summary: 'Added 14 lbs of functional lean mass with zero joint pain by following the 3D computer-vision corrective exercise continuums.',
  },
]

export default function Home() {
  const prelaunchWaitlistMode = process.env.NEXT_PUBLIC_PRELAUNCH_WAITLIST_MODE !== '0'

  return (
    <>
      <HelperAppRootGuard />
      <div style={{ height: 3, background: 'linear-gradient(90deg, #F59E0B 0%, #38BDF8 50%, #F59E0B 100%)' }} />

      {/* ── Founding Cohort Free Trial Announcement Banner ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #070A0F 0%, #0F172A 50%, #070A0F 100%)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '8px 16px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 60,
        }}
      >
        <Link
          href="/auth/signup"
          style={{
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '11.5px',
            fontFamily: 'var(--font-heading), sans-serif',
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
          <span style={{ color: 'var(--gold-lt)' }}>Founding Cohort Open:</span>
          <span>Precision Sports Science For Real Lives · 100% Free 7-Day Trial</span>
          <span style={{ color: 'var(--gold)', textDecoration: 'underline', marginLeft: 4, fontWeight: 800 }}>Start Free Trial →</span>
        </Link>
      </div>

      <SiteHeader
        links={[
          { href: '#pillars', label: 'Sports Science' },
          { href: '#memberships', label: 'Memberships' },
          { href: '/audit', label: '3D AI Audit' },
          { href: '#founder', label: 'Founder Story' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <main id="main-content" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* ── 1. Hero Section ── */}
        <section className="home-hero" style={{ position: 'relative', padding: 'clamp(3rem, 7vw, 6rem) 1.5rem clamp(2.5rem, 5vw, 4.5rem)' }}>
          {/* Ambient Forge Glow */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '-15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '85vw',
              maxWidth: 1000,
              height: 500,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.18) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div className="home-shell home-hero-grid" style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(1.5rem, 4vw, 3rem)', alignItems: 'center', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>
            <div className="home-hero-copy fade-in-up">
              <div className="crest-badge" style={{ marginBottom: 18 }}>
                <ForgeBrandMark size={18} withGlow={false} />
                <span>★ Precision Sports Science · Built From The Ground Up ★</span>
              </div>

              <h1
                className="home-hero-title font-serif"
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 'clamp(2.6rem, 5.8vw, 4.6rem)',
                  lineHeight: 1.05,
                  letterSpacing: '0.02em',
                  color: '#FFFFFF',
                  margin: '0 0 1.25rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                Built From The Ground Up.<br />
                <strong style={{ fontWeight: 900, color: 'var(--gold)' }}>Precision Sports Science.</strong><br />
                For Real Lives.
              </h1>

              <p className="home-hero-description" style={{ fontSize: 'clamp(1.05rem, 1.8vw, 1.22rem)', color: '#CBD5E1', lineHeight: 1.65, maxWidth: 620, margin: '0 0 2rem' }}>
                We didn&apos;t build Forge for private country club aristocrats. We engineered it for everyday, hardworking people who want elite 5-phase NASM OPT™ periodization, automated 1RM telemetry, and 3D computer-vision movement diagnostics directly on their smartphones.
              </p>

              <div className="home-hero-actions" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                {prelaunchWaitlistMode ? (
                  <TrackedCtaLink
                    href="#home-waitlist"
                    className="sgf-button sgf-button-primary tactile-btn"
                    eventName="hero_primary_cta_click"
                    eventPayload={{ mode: 'prelaunch', target: 'waitlist' }}
                    style={{ padding: '15px 32px', fontSize: 15, fontWeight: 800, letterSpacing: '0.08em' }}
                  >
                    Start 7-Day Free Trial
                  </TrackedCtaLink>
                ) : (
                  <TrackedCtaLink
                    href="/auth/signup"
                    className="sgf-button sgf-button-primary tactile-btn"
                    eventName="hero_primary_cta_click"
                    eventPayload={{ mode: 'live', target: 'signup' }}
                    style={{ padding: '15px 32px', fontSize: 15, fontWeight: 800, letterSpacing: '0.08em' }}
                  >
                    Start 7-Day Free Trial
                  </TrackedCtaLink>
                )}

                <TrackedCtaLink
                  href="#memberships"
                  className="sgf-button sgf-button-secondary tactile-btn"
                  eventName="hero_secondary_link_click"
                  eventPayload={{ destination: 'memberships' }}
                  style={{ padding: '15px 26px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  Explore Memberships ($19.99/mo)
                </TrackedCtaLink>
              </div>

              {prelaunchWaitlistMode && (
                <div id="home-waitlist" className="home-hero-waitlist" style={{ marginTop: 24, maxWidth: 440 }}>
                  <WaitlistForm id="hero" />
                </div>
              )}

              <div className="home-hero-apps" style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="smartphone" size={13} tone="gold" />
                  <span>Forge Athletic Mobile App · Native Telemetry &amp; In-Gym HUD</span>
                </div>
                <AppStoreBadges variant="glass" size="sm" sourceEventPrefix="hero" />
              </div>

              <p className="home-hero-footnote" style={{ marginTop: 18, fontSize: 12, color: 'var(--gray)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="shield" size={12} tone="gold" />
                <span>100% Free 7-Day Trial · Automated periodization, 1RM telemetry, and 3D computer-vision biomechanics. Cancel anytime.</span>
              </p>
            </div>

            {/* Proof Panel */}
            <aside className="glass-card-gold fade-in-up" style={{ padding: '32px 28px', display: 'grid', gap: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -15, right: -15, zIndex: 0 }}>
                <GaaMasterWatermarkSeal size={150} opacity={0.06} />
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--cyan)', fontWeight: 800 }}>
                  Precision Sports Science
                </span>
                <h3 className="font-serif" style={{ fontSize: 24, margin: '4px 0 0', color: '#FFFFFF', letterSpacing: '0.04em', fontWeight: 700 }}>
                  The Forge Athletic Architecture
                </h3>
              </div>

              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 11, fontSize: 13.5, color: '#CBD5E1', position: 'relative', zIndex: 1 }}>
                <li><strong>Automated 5-Phase Periodization</strong>: Calibrated to your biomechanics without coach bottlenecks</li>
                <li><strong>33-Point 3D Postural Mesh</strong>: Instant computer-vision kinetic chain scanning</li>
                <li><strong>Live 1RM Overload Telemetry</strong>: Autoregulated weight suggestions and barbell plate math</li>
                <li><strong>Tanaka Stage Cardio Engine</strong>: Precision cardiorespiratory conditioning</li>
                <li><strong>Visual Cadence HUD</strong>: Silent tempo pulsing for exact time-under-tension control</li>
                <li><strong>Apple Health &amp; Health Connect</strong>: Continuous background telemetry integration</li>
              </ul>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, borderTop: '1px solid rgba(245,158,11,0.25)', paddingTop: 18, position: 'relative', zIndex: 1 }}>
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

        {/* ── 2. The 4 Pillars of Forge Athletic ── */}
        <section id="pillars" className="home-shell fade-in-up" style={{ maxWidth: 1320, margin: '0 auto', padding: '4.5rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 3.5rem' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-heading), sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--cyan)' }}>
              Precision Sports Science
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 12px', fontWeight: 700 }}>
              The Four Pillars of the Forge Engine
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
              A closed-loop human performance ecosystem integrating structural movement analysis, periodized load management, clinical supplementation, and high-frequency in-gym telemetry.
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
                      boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
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
                  <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700, marginTop: 2 }}>
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
                        border: '1px solid rgba(56,189,248,0.2)',
                        borderRadius: 4,
                        color: 'var(--cyan-lt)',
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

        {/* ── 3. Performance Outcomes & Real Results ── */}
        <section className="home-shell fade-in-up" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 1.5rem 4.5rem' }}>
          <div className="glass-card-gold" style={{ padding: 'clamp(24px, 4vw, 40px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, zIndex: 0 }}>
              <GaaMasterWatermarkSeal size={200} opacity={0.06} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 680, margin: '0 auto 2.5rem' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
                Proven Transformations
              </span>
              <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 3.8vw, 2.8rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 8px', fontWeight: 700 }}>
                Measurable Results. Zero Guesswork.
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
                    background: 'rgba(7, 10, 15, 0.85)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
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
                    <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
          </div>
        </section>

        {/* ── Mobile Apps Spotlight & Biometric Telemetry ── */}
        <MobileAppPromoSection />

        {/* ── 4. Forge SaaS Memberships & Transparent Pricing ── */}
        <section id="memberships" className="home-shell fade-in-up" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 3rem' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-heading), sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
              Transparent SaaS Pricing
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 10px', fontWeight: 700 }}>
              Built For Real Lives. Priced For Everyone.
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
              Start with our 100% Free 7-Day Trial on Core Membership. Zero marginal coach friction, fully automated periodization, and instant movement diagnostics.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24, alignItems: 'stretch' }}>
            {FORGE_MEMBERSHIPS.map((tier) => (
              <article
                key={tier.id}
                className={`glass-card luxury-card-interactive ${tier.popular ? 'glass-card-gold' : ''}`}
                style={{
                  padding: '32px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  position: 'relative',
                  border: tier.popular
                    ? '2px solid var(--gold)'
                    : '1px solid rgba(245, 158, 11, 0.25)',
                  boxShadow: tier.popular
                    ? '0 12px 45px rgba(0,0,0,0.7), 0 0 30px rgba(245,158,11,0.22)'
                    : undefined,
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                {tier.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#070A0F',
                      padding: '4px 12px',
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
                    <GaaIcon name="star" size={10} style={{ color: '#070A0F', stroke: '#070A0F' }} />
                    <span>{tier.annualNote}</span>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: tier.popular ? 'var(--gold-lt)' : 'var(--cyan)' }}>
                    {tier.subtitle}
                  </span>
                  <h3 className="font-serif" style={{ fontSize: 24, color: '#FFFFFF', margin: '4px 0 0', letterSpacing: '0.02em', fontWeight: 700 }}>
                    {tier.name}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 40, color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 800 }}>
                    {tier.price}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    /{tier.billing}
                  </span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: 'var(--gold-lt)',
                    fontWeight: 700,
                    width: 'fit-content',
                  }}
                >
                  <span>★</span>
                  <span>{tier.trial}</span>
                </div>

                <p style={{ margin: 0, fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.5, minHeight: 42 }}>
                  {tier.description}
                </p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'grid', gap: 10, flexGrow: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)' }}>
                    Included Features:
                  </div>
                  {tier.highlights.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#E2E8F0' }}>
                      <GaaIcon name="check" size={13} tone="gold" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <TrackedCtaLink
                    href={tier.ctaHref}
                    className={`sgf-button ${tier.popular ? 'sgf-button-primary' : 'sgf-button-secondary'} tactile-btn`}
                    eventName="tier_card_cta_click"
                    eventPayload={{ tier: tier.id }}
                    style={{ width: '100%', textAlign: 'center', padding: '14px 18px', fontSize: 13.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  >
                    {tier.ctaText}
                  </TrackedCtaLink>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link
              href="/packages"
              className="tactile-btn"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--cyan)',
                textDecoration: 'underline',
                letterSpacing: '0.04em',
              }}
            >
              Need enterprise coaching or B2B group plans? View corporate packages →
            </Link>
          </div>
        </section>

        {/* ── 5. Coach Scott Gordon — Authentic Story ── */}
        <section id="founder" className="home-coach-section fade-in-up" style={{ borderTop: '1px solid rgba(245,158,11,0.25)', borderBottom: '1px solid rgba(245,158,11,0.25)', padding: '5rem 1.5rem', background: 'rgba(11, 17, 30, 0.65)' }}>
          <div className="home-shell home-coach-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div
              className="home-coach-photo"
              style={{
                width: '100%',
                aspectRatio: '4/5',
                borderRadius: 14,
                backgroundImage: `linear-gradient(180deg, rgba(7,10,15,0.1), rgba(7,10,15,0.7)), url('${COACH_PORTRAIT_IMAGE}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                border: '2px solid var(--gold)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(245,158,11,0.25)',
              }}
            />

            <div className="home-coach-copy" style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--gold-lt)' }}>
                  From Humble Beginnings To Precision Science
                </span>
              </div>

              <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: 0, lineHeight: 1.1, fontWeight: 700 }}>
                Scott Gordon <span style={{ fontSize: '1.2rem', color: 'var(--gold)', fontFamily: 'var(--font-heading), sans-serif', fontWeight: 600, verticalAlign: 'middle' }}>· Founder &amp; Head Coach</span>
              </h2>

              <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
                Coach Scott Gordon grew up with humble beginnings; his parents were poor and had nothing. He didn&apos;t come from money, private wealth, or country clubs. After dropping <strong>50+ lbs</strong> and completely transforming his own body and health, he committed his life to mastering NASM Sports Science (CPT, CES, PES, FNS) with over <strong>17 years</strong> of coaching experience.
              </p>

              <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
                He built <strong>Forge Athletic</strong> with a single mission: give real, hardworking people the exact precision training tools, 5-phase OPT™ periodization, and computer-vision biomechanics previously locked behind luxury paywalls.
              </p>

              <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
                Whether you train in a garage gym, a home basement, or a commercial gym, Forge delivers elite periodization, automated 1RM overload, and instant movement diagnostics directly to your phone.
              </p>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <TrackedCtaLink
                  href="/auth/signup"
                  className="sgf-button sgf-button-primary tactile-btn"
                  eventName="coach_section_cta_click"
                  eventPayload={{ target: 'signup' }}
                  style={{ padding: '13px 28px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  Start 7-Day Free Trial
                </TrackedCtaLink>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Final Call to Action ── */}
        <section className="sgf-cta-bg home-cta-modern" style={{ padding: '5.5rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="home-shell home-cta-inner" style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.45)', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>
                Built For Real Lives
              </span>
            </div>

            <h2 className="font-serif" style={{ fontSize: 'clamp(2.4rem, 4.8vw, 3.8rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '0 0 16px', lineHeight: 1.15, fontWeight: 800 }}>
              Ready to Command Your <span className="gold-gradient-text">Physical Potential?</span>
            </h2>

            <p style={{ fontSize: 15.5, color: '#CBD5E1', lineHeight: 1.6, maxWidth: 580, margin: '0 auto 2.2rem' }}>
              Experience automated 5-phase periodization, real-time 1RM progression, and 3D computer-vision movement diagnostics. Start your 100% free 7-day trial today.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <TrackedCtaLink
                href="/auth/signup"
                className="sgf-button sgf-button-primary tactile-btn"
                eventName="bottom_cta_click"
                eventPayload={{ mode: 'live', destination: 'signup' }}
                style={{ padding: '15px 36px', fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                Start 7-Day Free Trial
              </TrackedCtaLink>

              <TrackedCtaLink
                href="#memberships"
                className="sgf-button sgf-button-secondary tactile-btn"
                eventName="bottom_cta_click"
                eventPayload={{ mode: 'live', destination: 'memberships' }}
                style={{ padding: '15px 28px', fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                Explore Memberships
              </TrackedCtaLink>
            </div>

            <div style={{ marginTop: 36, paddingTop: 26, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <p style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: 12 }}>
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
