import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'

export const metadata: Metadata = {
  title: 'Asynchronous & Hybrid Sports Science Advisory | Gordon Athletic Advisory',
  description:
    'Master sports science periodization, continuous wearable telemetry sync, and weekly Sunday Dossiers without calendar lock-in. Explore exact tiers, deliverables, and response-time SLAs.',
  openGraph: {
    title: 'Asynchronous & Hybrid Sports Science Advisory | Gordon Athletic Advisory',
    description:
      'Master sports science periodization, continuous wearable telemetry sync, and weekly Sunday Dossiers without calendar lock-in.',
  },
}

const TIERS = [
  {
    name: 'Autonomous Digital Lab',
    price: '$59/mo',
    billing: 'billed monthly · cancel anytime',
    bestFor: 'Self-driven lifters and athletes seeking elite sports science periodization, in-gym Cadence HUD, and 3D AI postural scans without coach overhead.',
    features: [
      'Autonomous 5-phase NASM OPT™ periodized programming tailored to your equipment setup',
      'Integrated Cadence Pulse HUD with auditory tempo tones and hardware Taptic Engine haptics',
      'Tanaka Heart Rate Stage Cardio (Stages 1–3) & EPOC anaerobic conditioning tracker',
      'Monthly 3D AI Postural Distortion & Visual Body Composition Scanners',
      'Offline in-gym workout logging with zero-connectivity queue and automatic cloud sync',
      'Official photorealistic Movement Library with biomechanical cues (Zero coach messaging or live calls)',
    ],
    sla: 'Autonomous instant software telemetry · Zero calendar friction',
    badge: 'Self-Guided Software',
    tierKey: 'lab',
  },
  {
    name: 'Performance Protocol',
    price: '$349/mo',
    billing: 'billed monthly or quarterly',
    bestFor: 'Self-driven executives and athletes who execute autonomously and demand clinical-grade periodization, wearable telemetry triage, and direct messaging without scheduling constraints.',
    features: [
      'Individualized 5-phase OPT™ periodized programming tailored to your biomechanics and equipment setup',
      'Continuous background telemetry sync with Apple HealthKit and Android Health Connect (Whoop, Garmin, Oura)',
      'Tanaka Heart Rate Stage Cardio & EPOC conditioning protocols',
      'Daily CNS Readiness Scoring & 3D Muscle Recovery heatmaps',
      'Weekly automated telemetry audit & progressive overload recalibration by Coach Gordon',
      'Direct concierge coach messaging channel (Mon–Fri)',
    ],
    sla: 'Coach messaging SLA: within 24 business hours. Recalibrations: within 48h of check-in.',
    badge: 'Async Concierge',
    tierKey: 'starter',
  },
  {
    name: 'Hybrid Concierge',
    price: '$649/mo',
    billing: 'billed monthly or quarterly',
    bestFor: 'High-performing executives and athletes who want continuous biofeedback, monthly live movement diagnostics, biomechanical form critiques, and metabolic nutrition.',
    features: [
      'Everything in Performance Protocol',
      'One 60-minute live 1:1 WebRTC consultation studio session per month with real-time telestrator drawing & frame capture',
      'Monthly 3D AI Postural Mesh Scan (OHSA 5 Kinetic Checkpoints) & automated CEx corrective continuum',
      'Priority Biomechanical Video Form Critiques on heavy compound lifts with coach voiceover overlays',
      'Metabolic Nutrition Protocol with goal-adjusted macro cycling & peri-workout carb timing',
      'Dedicated Coach Voice Notes and priority check-in feedback via private CDN audio stream',
    ],
    sla: 'Priority messaging SLA: within 12 business hours. Check-in review: within 24 business hours.',
    badge: 'Flagship Tier',
    featured: true,
    tierKey: 'momentum',
  },
  {
    name: 'Executive 1:1 Master',
    price: '$1,495/mo',
    billing: 'billed monthly or quarterly',
    bestFor: 'Founders, C-suite leaders, and elite athletes who demand master-level 1:1 direction, weekly live video consults, and clinical pharmacology.',
    features: [
      'Everything in Hybrid Concierge',
      'Four 60-minute live 1:1 WebRTC video studio sessions per month (weekly live coaching cadence) with live telestrator & slow-mo replay',
      'Clinical Voice S.O.A.P. notes dictation & AI medical synthesis archived to client dossier',
      'Clinical Supplement Prescription & Biomarker Stacking Protocol with contraindication audits',
      'Executive Road-Warrior Travel Transformer (instant dynamic workout adapting for hotel gyms)',
      'Bi-weekly periodization re-architecting and planned deload management',
      'VIP Direct Line with urgent training blocker resolution (within 4 business hours)',
    ],
    sla: 'Urgent training blocker response SLA: within 4 business hours (Mon–Fri). Same business day VIP queue.',
    badge: 'Private Master Tier',
    tierKey: 'transformation',
  },
]

const CLOSED_LOOP_STEPS = [
  {
    step: '01',
    title: 'Biometric Intake & 3D AI Kinetic Mesh Scan',
    desc: 'Complete your medical PAR-Q+, training history, and smartphone 4-view posture screen. Our computer-vision engine detects kinetic compensations before your first bar is loaded.',
  },
  {
    step: '02',
    title: 'Individualized 5-Phase OPT™ Macrocycle',
    desc: 'Coach Gordon architects your custom 12-week training macrocycle, Tanaka heart rate stage cardio, and corrective warmup continuums tailored to your available equipment.',
  },
  {
    step: '03',
    title: 'Autonomous In-Gym Execution with Cadence HUD',
    desc: 'Execute in the gym using our native mobile app with auditory tempo cadences, hardware Taptic haptics, barbell plate calculators, and seamless background HealthKit / Health Connect sync.',
  },
  {
    step: '04',
    title: 'Weekly Sunday Dossier & Progressive Overload Triage',
    desc: 'Every Sunday, your wearable telemetry, tonnage volume, and recovery scores are audited. Coach Gordon delivers a personalized Sunday Dossier with precise load modulations.',
  },
]

const FIT_SIGNALS = [
  {
    title: 'You demand executive calendar autonomy',
    body: 'Traditional personal training forces you into rigid appointment slots that get derailed by flight delays or boardroom meetings. Async advisory moves with you 24/7 across any time zone.',
  },
  {
    title: 'You value objective telemetry over subjective cheering',
    body: 'Progress is tracked through continuous HRV rMSSD, Tanaka stage heart rates, calculated 1RM tonnage, and 3D postural landmark coordinates—not guesswork.',
  },
  {
    title: 'You want master-level direction without geographic limits',
    body: 'Work directly with a 17+ year master sports scientist and NASM specialist regardless of whether you are training in Manhattan, London, Tokyo, or a private home gym.',
  },
]

const ADD_ONS = [
  {
    name: '3D Kinetic Movement & Postural Diagnostic',
    price: '$249 (One-Time)',
    desc: 'Comprehensive 5-checkpoint kinetic chain assessment (OHSA) analyzing feet, knees, LPHC, shoulders, and cervical spine with custom corrective CEx continuum.',
  },
  {
    name: 'Metabolic Nutrition & Nutrient Periodization Suite',
    price: '$149/mo',
    desc: 'Dynamic metabolic modeling with training vs rest day macro cycling, peri-workout carb timing, and metabolic adaptation adjustments.',
  },
  {
    name: 'Biomechanical Video Form Critique Pass',
    price: '$199/mo',
    desc: 'Direct video upload access for your heavy compound lifts with frame-by-frame joint angle analysis and master coach voiceover feedback.',
  },
  {
    name: 'Clinical Supplement Stacking & Interaction Audit',
    price: '$149 (One-Time)',
    desc: 'Evidence-based supplement protocol tailored to your biometric profile, training volume, and medical history with contraindication screening.',
  },
  {
    name: 'Executive Road-Warrior Travel Pass',
    price: '$129 (One-Time)',
    desc: '1-Click dynamic travel transformer that instantly adapts your periodized workouts to hotel gyms, minimal dumbbells, or travel bands.',
  },
]

const FAQS = [
  {
    q: 'How does asynchronous advisory compare to traditional 1:1 in-person training?',
    a: 'In-person training costs $150–$300 per single hour and only provides feedback while you are standing in front of the trainer. GAA asynchronous advisory provides a continuous, 24/7 closed-loop performance system: personalized 5-phase OPT™ macrocycles, background Apple HealthKit/Health Connect telemetry sync, weekly Sunday Dossiers, and direct messaging support without being handcuffed to a weekly calendar slot.',
  },
  {
    q: 'How does Coach Gordon review my lifting technique without being in the room?',
    a: 'Inside the GAA app, you can submit video clips of your priority compound lifts (Squat, Deadlift, Bench, Overhead Press, Rows). Coach Gordon reviews bar path, joint angles, and kinetic checkpoints, returning a frame-by-frame critique with voiceover feedback within 24 business hours. On Hybrid and Executive tiers, we also conduct live WebRTC consultation studios with real-time telestrator markups.',
  },
  {
    q: 'What are the guaranteed response-time service level agreements (SLAs)?',
    a: 'Every tier has a defined, contractual SLA. Performance Protocol messages are answered within 24 business hours. Hybrid Concierge receives priority responses within 12 business hours. Executive 1:1 Master clients receive same-business-day responses with a 4-hour SLA on urgent training blockers.',
  },
  {
    q: 'What devices and wearables are supported for background telemetry sync?',
    a: 'Our native mobile apps synchronize 24/7 with Apple HealthKit on iOS and Android Health Connect on Android. This automatically ingests heart rate, morning HRV rMSSD, deep/REM sleep architecture, active calories, and completed workouts from Apple Watch, Whoop, Garmin, Oura Ring, and Samsung Galaxy Watch.',
  },
  {
    q: 'What happens when I travel internationally or have limited equipment?',
    a: 'Every client has access to the Executive Road-Warrior Travel Adapter. With one click, your planned workout instantly adapts to whatever equipment is available in your hotel gym (dumbbells, cables, bands, or bodyweight) while strictly maintaining your current OPT™ periodization phase, volume, and metabolic intensity.',
  },
]

export default function AsyncCoachingPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Retainers' },
          { href: '/audit', label: '3D AI Audit' },
          { href: '/apply', label: 'Apply' },
        ]}
        actions={<MarketingLoginActions />}
      />

      {/* ── 1. Hero Section ── */}
      <section className="sgf-hero-bg" style={{ padding: 'clamp(5rem, 8vw, 8rem) clamp(14px, 3vw, 3rem) 4rem', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.35)', marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="crown" size={12} tone="gold" />
                <span>Closed-Loop Sports Science · Zero Calendar Friction</span>
              </span>
            </div>

            <h1 className="font-serif" style={{ margin: '0 0 16px', fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', letterSpacing: '0.02em', lineHeight: 1.05, overflowWrap: 'break-word', wordBreak: 'break-word', color: '#FFFFFF', fontWeight: 700 }}>
              Master Biomechanics.
              <br />
              <span className="gold-gradient-text">Zero Calendar Bottlenecks.</span>
            </h1>

            <p style={{ margin: '0 0 24px', maxWidth: 680, color: '#CBD5E1', fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', lineHeight: 1.75 }}>
              Gordon Athletic Advisory asynchronous and hybrid retainers are engineered for founders, executives, and high-performing lifters who demand clinical-grade periodization, continuous biometric telemetry, and weekly master coach triage without being tethered to recurring Zoom appointments.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <Link href="/packages" className="sgf-button sgf-button-primary tactile-btn" style={{ padding: '14px 28px', fontWeight: 800 }}>
                Explore Retainers &amp; Checkout
              </Link>
              <a href="#tiers" className="sgf-button sgf-button-secondary tactile-btn" style={{ padding: '14px 24px', fontWeight: 700, border: '1px solid rgba(197,160,89,0.4)', color: 'var(--gold-lt)' }}>
                Compare Advisory Tiers
              </a>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                'Apple Health & Health Connect Sync',
                '5-Phase NASM OPT™ Engine',
                'Sunday Intelligence Dossiers',
                'In-Gym Cadence Pulse HUD',
              ].map(item => (
                <span
                  key={item}
                  style={{
                    border: '1px solid rgba(197, 160, 89, 0.25)',
                    background: 'rgba(18, 35, 54, 0.82)',
                    color: '#CBD5E1',
                    padding: '8px 12px',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    borderRadius: 4,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <section className="glass-card-gold" style={{ padding: 24, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
            <div style={{ margin: '-24px -24px 20px -24px', position: 'relative', height: 220, overflow: 'hidden', borderBottom: '1px solid rgba(197, 160, 89, 0.3)' }}>
              <img
                src="/images/async-coaching-hero.jpg"
                alt="Executive Async Human Performance Advisory"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(8,14,20,0.1) 0%, rgba(8,14,20,0.85) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '12px 16px',
                }}
              >
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  Executive Autonomy · 1:1 Telemetry Review
                </span>
              </div>
            </div>

            <span style={{ color: 'var(--gold-lt)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>
              The Modern Coaching Continuum
            </span>
            <h2 className="font-serif" style={{ margin: '6px 0 10px', fontSize: 24, letterSpacing: '0.02em', lineHeight: 1.15, color: '#FFFFFF', fontWeight: 700 }}>
              High-Touch Direction. Zero Schedule Conflict.
            </h2>
            <p style={{ margin: '0 0 18px', color: '#CBD5E1', lineHeight: 1.65, fontSize: 14 }}>
              Every retainer operates under rigorous sports science protocols with transparent monthly pricing, contractual response SLAs, and continuous telemetry feedback.
            </p>
            <Link href="/packages" className="sgf-button sgf-button-primary tactile-btn" style={{ width: '100%', textAlign: 'center', padding: '12px 16px', fontWeight: 800 }}>
              Review Retainers &amp; Enroll Securely
            </Link>
            <p style={{ margin: '12px 0 0', color: 'var(--gray)', fontSize: 12, lineHeight: 1.5 }}>
              Includes native iOS/Android mobile apps, offline workout queue, Tanaka stage cardio, and weekly Sunday Dossiers.
            </p>
          </section>
        </div>
      </section>

      {/* ── 2. The 4-Step Closed-Loop Architecture ── */}
      <section style={{ background: 'var(--navy-mid)', borderTop: '1px solid rgba(197, 160, 89, 0.2)', borderBottom: '1px solid rgba(197, 160, 89, 0.2)', padding: '56px clamp(14px, 3vw, 28px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 36px' }}>
            <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
              Operating Architecture
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 10px', fontWeight: 700 }}>
              How Closed-Loop Async Advisory Works
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
              A continuous, scientific feedback loop that modulates your training, recovery, and nutrition in real time based on hard biological data.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {CLOSED_LOOP_STEPS.map(item => (
              <div
                key={item.step}
                className="glass-card"
                style={{
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderRadius: 10,
                  border: '1px solid rgba(197, 160, 89, 0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 24, color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 700 }}>
                    {item.step}
                  </span>
                  <GaaIcon name="sparkles" size={16} tone="gold" />
                </div>
                <h3 style={{ margin: 0, fontFamily: 'Raleway, sans-serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.55 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Retainer Tiers Showcase ── */}
      <section id="tiers" style={{ maxWidth: 1440, margin: '0 auto', padding: '64px clamp(14px, 3vw, 28px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 36px' }}>
          <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
            Advisory Retainers
          </span>
          <h2 className="font-serif" style={{ margin: '6px 0 12px', fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', letterSpacing: '0.02em', lineHeight: 1.1, color: '#FFFFFF', fontWeight: 700 }}>
            Three Sovereign Pathways. Uncompromising Sports Science.
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', lineHeight: 1.7, fontSize: 15 }}>
            Select the tier aligned with your required level of direction: autonomous software telemetry, async concierge oversight, hybrid video assessments, or weekly private 1:1 master direction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {TIERS.map(tier => {
            const isMasterTier = tier.tierKey === 'transformation'
            return (
              <section
                key={tier.name}
                className={`glass-card luxury-card-interactive ${tier.featured ? 'glass-card-gold' : ''}`}
                style={{
                  border: isMasterTier
                    ? '1.5px solid var(--gold)'
                    : tier.featured
                    ? '1.5px solid rgba(212,160,23,0.6)'
                    : '1px solid rgba(197, 160, 89, 0.25)',
                  boxShadow: isMasterTier
                    ? '0 10px 40px rgba(0,0,0,0.6), 0 0 25px rgba(197,160,89,0.18)'
                    : undefined,
                  padding: '28px 24px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {/* Background Watermark Seal for Tier 3 */}
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
                ) : tier.featured ? (
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
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>
                    {tier.badge}
                  </span>
                  <h3 className="font-serif" style={{ margin: '4px 0 0', fontSize: 22, letterSpacing: '0.02em', lineHeight: 1.1, color: '#FFFFFF', fontWeight: 700 }}>
                    {tier.name}
                  </h3>
                </div>

                <div>
                  <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 36, color: 'var(--gold-lt)', lineHeight: 1, fontWeight: 700 }}>
                    {tier.price}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                    {tier.billing}
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

                <p style={{ margin: 0, color: '#CBD5E1', lineHeight: 1.55, fontSize: 13 }}>
                  {tier.bestFor}
                </p>

                <div style={{ display: 'grid', gap: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, flexGrow: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)' }}>
                    Deliverables &amp; Telemetry:
                  </div>
                  {tier.features.map(feature => (
                    <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                      <GaaIcon name="check" size={13} tone="gold" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(197, 160, 89, 0.2)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, display: 'block', marginBottom: 12, lineHeight: 1.4 }}>
                    SLA: {tier.sla}
                  </span>
                  {isMasterTier ? (
                    <Link
                      href={`/packages?tier=${tier.tierKey}`}
                      className="tactile-btn"
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        padding: '13px 18px',
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
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
                    </Link>
                  ) : (
                    <Link
                      href={`/packages?tier=${tier.tierKey}`}
                      className={`sgf-button ${tier.featured ? 'sgf-button-primary' : 'sgf-button-secondary'} tactile-btn`}
                      style={{ width: '100%', textAlign: 'center', padding: '12px 16px', fontSize: 13, fontWeight: 800 }}
                    >
                      Select {tier.name}
                    </Link>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </section>

      {/* ── 4. Good Fit Signals ── */}
      <section style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(14px, 3vw, 28px) 64px' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 36px' }}>
          <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
            Client Alignment
          </span>
          <h2 className="font-serif" style={{ margin: '6px 0 12px', fontSize: 'clamp(2rem, 4.2vw, 3.2rem)', letterSpacing: '0.02em', lineHeight: 1.15, color: '#FFFFFF', fontWeight: 700 }}>
            Is Asynchronous Advisory Right for Your Demands?
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', lineHeight: 1.7, fontSize: 15 }}>
            Our model is intentionally selective. We engineer superior outcomes for self-driven individuals who execute with discipline.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          {FIT_SIGNALS.map(item => (
            <div
              key={item.title}
              className="glass-card"
              style={{
                border: '1px solid rgba(197, 160, 89, 0.2)',
                padding: '24px 22px',
                borderRadius: 10,
                display: 'grid',
                gap: 10,
              }}
            >
              <h3 className="font-serif" style={{ margin: 0, fontSize: 18, letterSpacing: '0.02em', lineHeight: 1.2, color: '#FFFFFF', fontWeight: 700 }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, color: '#CBD5E1', lineHeight: 1.65, fontSize: 13.5 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Clinical Add-Ons & Accelerators ── */}
      <section style={{ background: 'var(--navy-mid)', borderTop: '1px solid rgba(197, 160, 89, 0.2)', borderBottom: '1px solid rgba(197, 160, 89, 0.2)', padding: '56px clamp(14px, 3vw, 28px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 36px' }}>
            <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
              Modular Customization
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 10px', fontWeight: 700 }}>
              Performance Accelerators &amp; Clinical Add-Ons
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
              Tailor your advisory retainer with specialized clinical diagnostics, video critique passes, or nutritional periodization.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {ADD_ONS.map(addon => (
              <div
                key={addon.name}
                className="glass-card"
                style={{
                  padding: '20px 22px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                  <h4 style={{ margin: 0, fontFamily: 'Raleway, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    {addon.name}
                  </h4>
                  <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 17, color: 'var(--gold-lt)', fontWeight: 700 }}>
                    {addon.price}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                  {addon.desc}
                </p>
              </div>
            ))}
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
              Configure retainers and add-ons in the Packages Studio →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Client FAQ & Transparency ── */}
      <section style={{ maxWidth: 1440, margin: '0 auto', padding: '64px clamp(14px, 3vw, 28px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 36px' }}>
          <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
            Clear Expectations
          </span>
          <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: '#FFFFFF', letterSpacing: '0.02em', margin: '6px 0 10px', fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
            Everything you need to know before initiating your athletic advisory retainer.
          </p>
        </div>

        <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gap: 14 }}>
          {FAQS.map(item => (
            <details
              key={item.q}
              className="glass-card"
              style={{
                border: '1px solid rgba(197, 160, 89, 0.25)',
                borderRadius: 8,
                padding: '16px 20px',
              }}
            >
              <summary style={{ cursor: 'pointer', fontFamily: 'Raleway, sans-serif', fontWeight: 700, color: '#FFFFFF', fontSize: 15 }}>
                {item.q}
              </summary>
              <p style={{ margin: '12px 0 0', color: '#CBD5E1', lineHeight: 1.7, fontSize: 13.5 }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── 7. Final Call to Action ── */}
      <section className="sgf-cta-bg" style={{ padding: '64px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(197, 160, 89, 0.15)', border: '1px solid rgba(197, 160, 89, 0.4)', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>
              Cohort Availability
            </span>
          </div>

          <h2 className="font-serif" style={{ margin: '0 0 14px', fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', letterSpacing: '0.02em', lineHeight: 1.15, color: '#FFFFFF', fontWeight: 700 }}>
            Elevate Your Training With <span className="gold-gradient-text">Master Direction.</span>
          </h2>
          <p style={{ margin: '0 0 24px', color: '#CBD5E1', lineHeight: 1.75, fontSize: 15 }}>
            Every tier provides defined deliverables, continuous biometric telemetry, and contractual response SLAs. Choose your starting path or take the 2-minute diagnostic audit.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/packages" className="sgf-button sgf-button-primary tactile-btn" style={{ padding: '14px 28px', fontWeight: 800 }}>
              Go to Retainers &amp; Checkout
            </Link>
            <Link href="/apply" className="sgf-button sgf-button-secondary tactile-btn" style={{ padding: '14px 24px', fontWeight: 700, border: '1px solid rgba(197,160,89,0.4)', color: 'var(--gold-lt)' }}>
              Take 2-Minute Diagnostic Audit
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}