import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import PurchaseButton from '@/components/packages/PurchaseButton'
import { STANDALONE_PRODUCTS } from '@/lib/stripe'

export const metadata: Metadata = {
  title: 'Clinical 3D AI Kinetic Chain & Postural Distortion Screen | Gordon Athletic Advisory',
  description:
    'Self-guided computer-vision movement screening analyzing all 5 kinetic chain checkpoints. Detect silent injury risks, posture imbalances, and get an automated 4-phase corrective protocol.',
  openGraph: {
    title: 'Clinical 3D AI Kinetic Chain & Postural Distortion Screen | Gordon Athletic Advisory',
    description:
      'Computer-vision biomechanical screening. Detect silent kinetic chain compensations, muscle imbalances, and get an automated corrective exercise continuum.',
  },
}

const CHECKPOINTS = [
  {
    num: '01',
    title: 'Foot & Ankle Complex',
    subtitle: 'Ground Reaction Base',
    cues: 'Pronation Distortion · Medial Arch Flattening · Achilles Alignment',
    desc: 'Unaddressed foot pronation creates an immediate kinetic chain ripple effect, triggering internal tibial rotation and severe knee shear.',
    overactive: 'Peroneals, Gastrocnemius, Soleus',
    underactive: 'Anterior & Posterior Tibialis',
  },
  {
    num: '02',
    title: 'Knee & Patella Tracking',
    subtitle: 'Valgus / Varus Q-Angle',
    cues: 'Dynamic Knee Valgus · Femoral Adduction · Lateral Joint Strain',
    desc: 'Medial knee collapse during squats and stair descents is the primary predictor of meniscus wear and patellofemoral pain syndrome.',
    overactive: 'Adductor Complex, TFL, Biceps Femoris',
    underactive: 'Gluteus Medius, Gluteus Maximus, VMO',
  },
  {
    num: '03',
    title: 'Lumbo-Pelvic-Hip Complex',
    subtitle: 'Gravitational Core Axis',
    cues: 'Anterior Pelvic Tilt · Excessive Forward Lean · Asymmetric Weight Shift',
    desc: 'Prolonged sitting shortens psoas and rectus femoris, pulling the pelvis anteriorly and placing extreme shear load onto the L4-L5 lumbar spine.',
    overactive: 'Iliopsoas, Rectus Femoris, Erector Spinae',
    underactive: 'Gluteus Maximus, Transverse Abdominis, Hamstrings',
  },
  {
    num: '04',
    title: 'Shoulders & Thorax',
    subtitle: 'Upper Crossed Vector',
    cues: 'Scapular Elevation · Protraction · Medial Arm Rotation',
    desc: 'Rounded shoulders and elevated scapulae pinch the supraspinatus tendon, causing chronic shoulder impingement and power leaks in pressing lifts.',
    overactive: 'Upper Trapezius, Levator Scapulae, Pectoralis Minor',
    underactive: 'Middle & Lower Trapezius, Rhomboids, Serratus Anterior',
  },
  {
    num: '05',
    title: 'Cervical Spine & Head',
    subtitle: 'Plumb Line Alignment',
    cues: 'Forward Head Translation · Suboccipital Compression · Cervical Extension',
    desc: 'For every inch your head translates forward of the plumb line, your cervical spine absorbs an additional 10 lbs of static gravitational weight.',
    overactive: 'Sternocleidomastoid, Suboccipitals, Upper Cervical Extensors',
    underactive: 'Deep Cervical Flexors (Longus Colli, Longus Capitis)',
  },
]

const DELIVERABLES: {
  icon: GaaIconName
  title: string
  desc: string
}[] = [
  {
    icon: 'microscope',
    title: 'Multi-View Computer-Vision Mesh Tracking',
    desc: 'MediaPipe-driven landmark capture analyzing 33 anatomical joint coordinates across Anterior, Lateral, and Overhead Squat frames.',
  },
  {
    icon: 'lightning',
    title: 'Clinical Postural Syndrome Diagnostic',
    desc: 'Automated detection of Upper Crossed, Lower Crossed, and Pronation Distortion syndromes based on NASM CPT-7 sports science criteria.',
  },
  {
    icon: 'chart',
    title: 'Anatomical Muscle Balance Heatmap',
    desc: 'Exact breakdown of hyperactive/shortened muscles requiring inhibition vs. underactive/lengthened stabilizers requiring activation.',
  },
  {
    icon: 'shield',
    title: 'Bespoke 4-Phase Corrective Protocol (CEx)',
    desc: 'Step-by-step SMR foam rolling, static stretches, isolated activation drills, and integrated kinetic movements tailored to your scan.',
  },
]

const FAQS = [
  {
    q: 'How does the AI scan actually work?',
    a: 'You securely take 4 quick guided photos in the app (Anterior, Lateral, Posterior, and Overhead Squat). Our computer vision engine maps 33 anatomical landmarks, calculates joint deviations against optimal sports science ranges, and generates an instant diagnostic report.',
  },
  {
    q: 'Do I need any special equipment or cameras?',
    a: 'No. Any smartphone or laptop camera works. You just need a well-lit space where your entire body from head to bare feet is visible in frame (approx. 8–10 feet away).',
  },
  {
    q: 'How does the $97 coaching credit voucher work?',
    a: 'We believe diagnostics should lead directly to real physical results. When you complete your audit, 100% of your $97 investment is credited toward any Gordon Athletic 12-Week Transformation Block or Monthly Retainer.',
  },
  {
    q: 'Are my photos private and secure?',
    a: 'Yes. Your biometric data is encrypted end-to-end and is never shared, sold, or published. You have full control over your diagnostic telemetry at all times.',
  },
]

export default function AuditLandingPage() {
  const auditProduct = STANDALONE_PRODUCTS[0]

  return (
    <main id="main-content" style={{ minHeight: '100vh', background: 'var(--navy)', position: 'relative' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)' }} />

      <SiteHeader
        fixed
        links={[
          { href: '/packages', label: 'Memberships' },
          { href: '/apply', label: 'Diagnostic Quiz' },
          { href: '/dashboard', label: 'Client Lab' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(80px, 12vw, 120px) 24px 60px', boxSizing: 'border-box' }}>
        {/* ── 1. HERO SECTION ── */}
        <div style={{ textAlign: 'center', maxWidth: 920, margin: '0 auto 72px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 30,
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.35)',
              color: 'var(--gold-lt)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="microscope" size={13} tone="gold" />
              <span>Clinical Sports Science Biomechanics</span>
            </span>
            <span style={{ color: 'var(--white)', opacity: 0.4 }}>|</span>
            <span>NASM CPT-7 Engine</span>
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              lineHeight: 1.15,
              margin: '0 0 20px',
            }}
          >
            REVEAL THE SILENT POSTURAL IMBALANCES SABOTAGING YOUR STRENGTH &amp; LONGEVITY
          </h1>

          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: 'var(--gray)',
              lineHeight: 1.6,
              margin: '0 auto 36px',
              maxWidth: 780,
            }}
          >
            Stop guessing why your joints feel stiff or your squat hits a plateau. Get an instant, clinical-grade 3D computer-vision assessment of all 5 kinetic chain checkpoints with custom 4-phase corrective exercise protocols.
          </p>

          {/* High-Ticket Bridge Banner */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(13,27,42,0.6) 100%)',
              border: '1px solid var(--gold)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              marginBottom: 40,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 18 }}>✦</span>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13.5, color: '#FFFFFF', fontWeight: 600 }}>
              <strong style={{ color: 'var(--gold-lt)' }}>100% Credit Guarantee:</strong> Your entire $97 audit fee is credited toward any 12-Week Transformation Block or Retainer.
            </span>
          </div>

          {/* 3D Biomechanical Mesh Visual */}
          <div
            style={{
              maxWidth: 820,
              margin: '0 auto 36px',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1.5px solid rgba(212,160,23,0.4)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,160,23,0.15)',
              background: '#04070D',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/package-audit.jpg"
              alt="Gordon Athletic Advisory 3D AI Biomechanical & Postural Mesh Scanner"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* Primary Action Card */}
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: 12,
              padding: '24px 28px',
              boxShadow: '0 15px 45px rgba(0,0,0,0.6)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Self-Guided 3D Screen
                </span>
                <div className="font-serif" style={{ fontSize: 22, color: '#FFFFFF', margin: '4px 0 0', letterSpacing: '0.03em', fontWeight: 600 }}>
                  3D AI Postural Distortion Audit
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--gray)', textDecoration: 'line-through' }}>$250 Value</div>
                <div className="font-serif" style={{ fontSize: 34, color: 'var(--gold)', lineHeight: 1, letterSpacing: '0.02em', fontWeight: 700 }}>$97</div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Instant camera-guided upload. Complete 4-view landmark analysis and automated 4-phase corrective continuum returned in minutes.
            </p>

            <PurchaseButton
              productId={auditProduct.id}
              buttonLabel="Start 3D Postural Audit ($97)"
              redirectNext="/audit"
            />
          </div>
        </div>

        {/* ── 2. THE 5 KINETIC CHECKPOINTS BREAKDOWN ── */}
        <div style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ margin: '0 0 8px', color: 'var(--gold-lt)', fontFamily: 'Raleway, sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Kinetic Diagnostics
            </p>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
              THE 5 ANATOMICAL CHECKPOINTS
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 15, color: 'var(--gray)', maxWidth: 640, margin: '8px auto 0' }}>
              Human movement occurs through a closed kinetic chain. When one checkpoint distorts, the entire skeletal system compensates.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
            {CHECKPOINTS.map(cp => (
              <div
                key={cp.num}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="font-serif" style={{ fontSize: 24, color: 'rgba(212,160,23,0.45)', fontWeight: 700 }}>
                    {cp.num}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
                    {cp.subtitle}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif" style={{ fontSize: 20, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '0.03em', fontWeight: 600 }}>
                    {cp.title}
                  </h3>
                  <div style={{ fontSize: 11.5, color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>
                    {cp.cues}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.55, margin: 0 }}>
                    {cp.desc}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11.5, display: 'grid', gap: 6 }}>
                  <div>
                    <strong style={{ color: 'var(--gold-lt)' }}>Overactive / Short:</strong>{' '}
                    <span style={{ color: 'var(--gray)' }}>{cp.overactive}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--white)' }}>Underactive / Weak:</strong>{' '}
                    <span style={{ color: 'var(--gray)' }}>{cp.underactive}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. WHAT YOU RECEIVE ── */}
        <div style={{ marginBottom: 96, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 12, padding: 'clamp(28px, 5vw, 48px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
              WHAT YOUR 3D AUDIT INCLUDES
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14.5, color: 'var(--gray)', margin: '6px 0 0' }}>
              Comprehensive clinical biomechanics delivered straight to your secure portal.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 24 }}>
            {DELIVERABLES.map((del, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <GaaIcon name={del.icon} size={32} tone="gold" />
                <h4 className="font-serif" style={{ fontSize: 17, color: '#FFFFFF', margin: 0, letterSpacing: '0.03em', fontWeight: 600 }}>
                  {del.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                  {del.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. FAQ SECTION ── */}
        <div style={{ maxWidth: 840, margin: '0 auto 96px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.4rem)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '18px 22px',
                }}
              >
                <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--gold-lt)', marginBottom: 8 }}>
                  {faq.q}
                </div>
                <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. FINAL CONVERSION CTA ── */}
        <div
          style={{
            textAlign: 'center',
            background: 'linear-gradient(180deg, rgba(212,160,23,0.12) 0%, rgba(8,14,20,0.9) 100%)',
            border: '2px solid var(--gold)',
            borderRadius: 12,
            padding: 'clamp(32px, 6vw, 60px) 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            maxWidth: 820,
            margin: '0 auto',
          }}
        >
          <GaaMasterWatermarkSeal size={72} style={{ marginBottom: 16 }} />
          <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: '#FFFFFF', margin: '0 0 12px', letterSpacing: '0.04em' }}>
            START YOUR 3D BIOMECHANICAL AUDIT TODAY
          </h2>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 16, color: 'var(--gray)', maxWidth: 600, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Gain total visibility into your kinetic chain, eliminate compensation injuries, and claim your full $97 credit towards high-ticket transformation coaching.
          </p>

          <div style={{ maxWidth: 380, margin: '0 auto' }}>
            <PurchaseButton
              productId={auditProduct.id}
              buttonLabel="Claim 3D Audit Pass ($97)"
              redirectNext="/audit"
            />
          </div>

          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--gray)' }}>
            Instant Access · 33-Point MediaPipe Computer Vision · 100% Coaching Credit Guarantee
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
