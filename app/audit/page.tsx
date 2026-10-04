import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import PurchaseButton from '@/components/packages/PurchaseButton'
import { STANDALONE_PRODUCTS } from '@/lib/stripe'

export const metadata: Metadata = {
  title: '3D Movement and Posture Assessment | Forge Athletic',
  description:
    'Use your phone camera for a guided movement check, then get a clear summary and personalized exercises to support your training.',
  openGraph: {
    title: '3D Movement and Posture Assessment | Forge Athletic',
    description:
      'A guided movement check with a clear summary and practical exercises for your training.',
  },
}

const CHECKPOINTS = [
  {
    num: '01',
    title: 'Feet and ankles',
    subtitle: 'Balance and support',
    cues: 'Foot position · Arch movement · Ankle alignment',
    desc: 'The way your feet and ankles move can affect how you balance and move through exercises.',
    overactive: 'Peroneals, Gastrocnemius, Soleus',
    underactive: 'Anterior & Posterior Tibialis',
  },
  {
    num: '02',
    title: 'Knees',
    subtitle: 'Knee movement',
    cues: 'Knee position · Leg alignment · Side-to-side movement',
    desc: 'A movement check can show how your knees track during activities such as squats and step-downs.',
    overactive: 'Adductor Complex, TFL, Biceps Femoris',
    underactive: 'Gluteus Medius, Gluteus Maximus, VMO',
  },
  {
    num: '03',
    title: 'Hips and lower back',
    subtitle: 'Hip and trunk movement',
    cues: 'Hip position · Forward lean · Weight shifting',
    desc: 'How your hips and trunk move can affect your balance and comfort during everyday activities and exercise.',
    overactive: 'Iliopsoas, Rectus Femoris, Erector Spinae',
    underactive: 'Gluteus Maximus, Transverse Abdominis, Hamstrings',
  },
  {
    num: '04',
    title: 'Shoulders and upper back',
    subtitle: 'Shoulder movement',
    cues: 'Shoulder position · Arm movement · Upper-back posture',
    desc: 'A movement check can show how your shoulders and upper back move when you reach or lift.',
    overactive: 'Upper Trapezius, Levator Scapulae, Pectoralis Minor',
    underactive: 'Middle & Lower Trapezius, Rhomboids, Serratus Anterior',
  },
  {
    num: '05',
    title: 'Neck and head',
    subtitle: 'Head and neck position',
    cues: 'Head position · Neck movement · Posture',
    desc: 'The assessment also looks at head and neck position as part of your overall movement.',
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
    title: 'Guided movement photos',
    desc: 'Take a few guided photos so the app can review key points in your posture and movement.',
  },
  {
    icon: 'lightning',
    title: 'Movement pattern overview',
    desc: 'See a summary of movement patterns that may be useful to discuss with your coach.',
  },
  {
    icon: 'chart',
    title: 'Muscle movement guide',
    desc: 'Review areas that may benefit from mobility or strengthening exercises.',
  },
  {
    icon: 'shield',
    title: 'Personalized exercise plan',
    desc: 'Get step-by-step mobility, warm-up, and strengthening exercises based on your movement check.',
  },
]

const FAQS = [
  {
    q: 'How does the movement check work?',
    a: 'The app guides you through four photos from different angles, including a squat. It reviews key movement points and creates a summary with exercises you can discuss with your coach.',
  },
  {
    q: 'Do I need any special equipment or cameras?',
    a: 'No. Any smartphone or laptop camera works. You just need a well-lit space where your entire body from head to bare feet is visible in frame (approx. 8–10 feet away).',
  },
  {
    q: 'Can I use the $97 fee toward coaching?',
    a: 'Yes. The full $97 fee can be applied toward a 12-week coaching plan or membership.',
  },
  {
    q: 'Are my photos private and secure?',
    a: 'Your assessment is stored securely and is not sold or published. You can review our privacy policy for details about your information.',
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
          { href: '/apply', label: 'Find your starting point' },
          { href: '/dashboard', label: 'Log in' },
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
              <span>Guided movement check</span>
            </span>
            <span style={{ color: 'var(--white)', opacity: 0.4 }}>|</span>
            <span>Science-based training</span>
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
            UNDERSTAND HOW YOU MOVE AND FIND EXERCISES THAT FIT YOUR GOALS
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
            Get a clearer picture of how you move, then explore practical exercises that support your goals. Get an instant, clinical-grade 3D computer-vision assessment of all 5 kinetic chain checkpoints with custom 4-phase corrective exercise protocols.
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
              <strong style={{ color: 'var(--gold-lt)' }}>Full $97 credit:</strong> Apply the cost of this assessment toward a 12-week coaching plan or membership.
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
              alt="Forge Athletic guided movement and posture check"
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
                  Guided 3D movement check
                </span>
                <div className="font-serif" style={{ fontSize: 22, color: '#FFFFFF', margin: '4px 0 0', letterSpacing: '0.03em', fontWeight: 600 }}>
                  3D Movement and Posture Assessment
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--gray)', textDecoration: 'line-through' }}>$250 Value</div>
                <div className="font-serif" style={{ fontSize: 34, color: 'var(--gold)', lineHeight: 1, letterSpacing: '0.02em', fontWeight: 700 }}>$97</div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Follow the camera prompts to take four photos. Get a movement summary and personalized exercises in minutes.
            </p>

            <PurchaseButton
              productId={auditProduct.id}
              buttonLabel="Start movement assessment ($97)"
              redirectNext="/audit"
            />
          </div>
        </div>

        {/* ── 2. Five areas covered ── */}
        <div style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ margin: '0 0 8px', color: 'var(--gold-lt)', fontFamily: 'Raleway, sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Your movement
            </p>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
              FIVE AREAS WE LOOK AT
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 15, color: 'var(--gray)', maxWidth: 640, margin: '8px auto 0' }}>
              We look at how different parts of your body work together during movement.
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
                    <strong style={{ color: 'var(--gold-lt)' }}>May benefit from mobility:</strong>{' '}
                    <span style={{ color: 'var(--gray)' }}>{cp.overactive}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--white)' }}>May benefit from strengthening:</strong>{' '}
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
              A clear summary and practical exercises, available in your account.
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
            See how you move and get practical exercises to support your goals. Your $97 fee can be applied toward a coaching plan or membership.
          </p>

          <div style={{ maxWidth: 380, margin: '0 auto' }}>
            <PurchaseButton
              productId={auditProduct.id}
              buttonLabel="Start movement assessment ($97)"
              redirectNext="/audit"
            />
          </div>

          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--gray)' }}>
            Instant access · Guided camera check · Full coaching credit
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
