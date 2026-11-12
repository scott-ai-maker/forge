import type { Metadata } from 'next'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'

export const metadata: Metadata = {
  title: 'Accessibility Statement (WCAG 2.2 AA) | Forge Athletic',
  description:
    'Forge Athletic web and mobile digital accessibility commitment under ADA Title III and WCAG 2.1 / 2.2 Level AA.',
}

export default function AccessibilityStatementPage() {
  return (
    <>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Memberships' },
          { href: '/apply', label: 'Get started' },
        ]}
        actions={<MarketingLoginActions />}
      />
      <main
        id="main-content"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(5rem, 8vw, 7rem) clamp(16px, 3vw, 24px) 4rem',
          fontFamily: 'Raleway, sans-serif',
          color: '#F5F0E8',
          lineHeight: 1.65,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)' }}>
            Inclusive Performance Engineering
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '2.35rem', letterSpacing: '0.04em', margin: '0.5rem 0 0', color: '#FFFFFF' }}>
            Digital Accessibility Statement
          </h1>
          <p style={{ color: '#94A3B8', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Last Reviewed: November 11, 2026 · Conformance Target: W3C WCAG 2.1 / 2.2 Level AA
          </p>
        </div>

        <section style={{ marginBottom: '2.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.35rem', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            1. Commitment to Digital &amp; Athletic Accessibility
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Forge Athletic Performance LLC</strong> is committed to ensuring digital accessibility for athletes of all physical, visual, auditory, and cognitive abilities across our web platform, Progressive Web App (PWA), and iOS/Android companion experiences, aligned with Title III of the Americans with Disabilities Act (ADA) and the Web Content Accessibility Guidelines (<strong>WCAG 2.1 and 2.2 Level AA</strong>).
          </p>
        </section>

        <section style={{ marginBottom: '2.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.35rem', color: 'var(--gold-lt)', marginBottom: '0.75rem' }}>
            2. Technical Accessibility Standards Implemented
          </h2>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem', fontSize: '0.92rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Keyboard &amp; Screen-Reader Navigation:</strong> Skip-to-main-content links, semantic HTML5 landmarks (<code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>), sequential heading outlines, programmatic <code>label</code> / <code>aria-describedby</code> form bindings, and high-contrast <code>:focus-visible</code> indicators (&ge; 3:1 contrast).
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Visual Contrast &amp; Tabular Telemetry:</strong> High-contrast ivory/gold typography on deep obsidian surfaces, minimum 24x24px (44px+ on touch) interactive tap targets, and tabular numerals without horizontal scroll lock at 200% browser zoom.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Multimodal Exercise Instruction &amp; Motion Respect:</strong> Written step-by-step setup/execution/breathing cues paired with every visual movement demonstration, plus respect for OS-level <code>prefers-reduced-motion</code> preferences.
            </li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid rgba(197, 160, 89, 0.3)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '1.3rem', color: 'var(--gold-lt)', marginBottom: '0.5rem' }}>
            3. Accommodation Support &amp; Accessibility Feedback
          </h2>
          <p style={{ fontSize: '0.95rem', margin: '0 0 0.5rem' }}>
            If you encounter any accessibility barrier, require alternative text/audio formats for any training dossier or movement video, or need an adaptive coaching accommodation, contact us directly and we will respond within two (2) business days:
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--gold-lt)' }}>
            Email: <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>scott@forge-athletic.app</a> (Subject: <code>Accessibility Support</code>)<br />
            Mail: Forge Athletic Performance LLC, 82 Wendell Ave., Ste 100, Pittsfield, MA 01201
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
