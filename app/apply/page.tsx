import type { Metadata } from 'next'
import Link from 'next/link'
import ApplyQuiz from '@/components/marketing/ApplyQuiz'
import SiteHeader from '@/components/ui/SiteHeader'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'

export const metadata: Metadata = {
  title: 'Find a Training Plan That Fits',
  description: 'Share your goals, schedule, and preferred coaching support to find a training plan that works for you.',
  openGraph: {
    title: 'Find a Training Plan That Fits | Gordon Athletic Advisory',
    description: 'Share your goals, schedule, and preferred coaching support to find a training plan that works for you.',
  },
}

export default function ApplyPage() {
  return (
    <main id="main-content" className="apply-page" style={{ minHeight: '100vh', background: 'var(--navy)', padding: '2rem 1rem 4rem' }}>
      <SiteHeader
        links={[
          { href: '/packages', label: 'Memberships' },
          { href: '/audit', label: 'Movement Assessment' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="apply-top-links" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/"
            className="sgf-button sgf-button-secondary tactile-btn"
            style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}
          >
            Back to Home
          </Link>
          <Link
            href="/packages"
            className="sgf-button sgf-button-secondary tactile-btn"
            style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}
          >
            Explore Memberships
          </Link>
        </div>

        <p style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 8 }}>
          Forge Athletic · Training Intake
        </p>
        <h1 className="font-serif" style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', lineHeight: 1.1, marginBottom: 14, color: '#FFFFFF', fontWeight: 700 }}>
          Training goals &amp;
          <br />
          <span className="gold-gradient-text">membership fit</span>
        </h1>
        <p style={{ color: '#CBD5E1', fontSize: 16, lineHeight: 1.75, marginBottom: 28, maxWidth: 720 }}>
          Tell us about your goals, schedule, and the support you are looking for. We will help you find a Forge Athletic membership that fits.
        </p>

        <div
          style={{
            marginBottom: 32,
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            position: 'relative',
            maxHeight: 280,
          }}
        >
          <img
            src="/images/apply-diagnostic-hero.jpg"
            alt="A movement assessment to help understand how you move"
            style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(8,14,20,0.2) 0%, rgba(8,14,20,0.85) 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '16px 20px',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="microscope" size={15} tone="gold" />
              <span>Movement and fitness assessment</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              Training plan recommendations
            </span>
          </div>
        </div>

        <ApplyQuiz />
      </div>
    </main>
  )
}
