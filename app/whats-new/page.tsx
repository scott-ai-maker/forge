import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  APP_VERSION,
  APP_RELEASE_DATE,
  APP_RELEASE_CODENAME,
  RELEASE_LOG,
} from '@/lib/app-version'

export const metadata: Metadata = {
  title: `What's New · v${APP_VERSION} | Forge Athletic`,
  description: `Latest updates, features, and sports science intelligence releases for Forge Athletic (v${APP_VERSION} - ${APP_RELEASE_CODENAME}).`,
}

export default function WhatsNewPage() {
  return (
    <main id="main-content" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        fixed
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Memberships' },
          { href: '/apply', label: 'Apply' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(5rem, 8vw, 7rem) clamp(12px, 3vw, 24px) 4rem', boxSizing: 'border-box' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 5vw, 56px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 20, background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.35)', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="crown" size={12} tone="gold" />
              <span>SEMANTIC RELEASE LOG · v{APP_VERSION}</span>
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              margin: '0 0 12px',
              lineHeight: 1.1,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            WHAT&apos;S NEW &amp; SYSTEM RELEASES
          </h1>

          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'var(--gray)',
              maxWidth: 720,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Track the continuous evolution of the Forge Athletic platform. Every release adheres strictly to <a href="https://semver.org/spec/v2.0.0.html" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>Semantic Versioning 2.0.0</a> (<code>MAJOR.MINOR.PATCH</code>).
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--gold-lt)', background: 'rgba(197, 160, 89, 0.1)', border: '1px solid rgba(197, 160, 89, 0.3)', padding: '6px 14px', borderRadius: 4, fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
              Current Production: <strong>v{APP_VERSION}</strong> ({APP_RELEASE_CODENAME})
            </span>
            <span style={{ fontSize: 12, color: 'var(--gray)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '6px 14px', borderRadius: 4, fontFamily: 'Raleway, sans-serif' }}>
              Release Date: {APP_RELEASE_DATE}
            </span>
          </div>
        </div>

        {/* Release Timeline Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {RELEASE_LOG.map((release, idx) => (
            <article
              key={release.version}
              id={`v${release.version}`}
              className={idx === 0 ? 'glass-card-gold' : 'glass-card'}
              style={{
                padding: 'clamp(20px, 4vw, 36px)',
                borderRadius: 10,
                border: idx === 0 ? '1.5px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: idx === 0 ? '0 10px 40px rgba(0,0,0,0.7), 0 0 25px rgba(197,160,89,0.2)' : '0 8px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxSizing: 'border-box',
              }}
            >
              {/* Release Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
                      v{release.version}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#080E14', background: 'var(--gold)', padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {release.badge}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
                      &ldquo;{release.codename}&rdquo;
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'Raleway, sans-serif', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 0', lineHeight: 1.3 }}>
                    {release.title}
                  </h2>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, color: 'var(--gray)', fontFamily: 'Raleway, sans-serif', fontWeight: 600 }}>
                    {release.date}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <p style={{ fontSize: 15, color: '#CBD5E1', margin: 0, lineHeight: 1.7 }}>
                {release.summary}
              </p>

              {/* Highlights Bullet List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.3)', padding: '16px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  Release Highlights
                </span>
                {release.highlights.map((item, hIdx) => (
                  <div key={hIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: '#F1F5F9', lineHeight: 1.6 }}>
                    <GaaIcon name="check" size={14} tone="gold" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Detailed Breakdown Sections (if any) */}
              {release.detailedSections && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
                  {release.detailedSections.map((sec, sIdx) => (
                    <div key={sIdx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '16px 18px' }}>
                      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', margin: '0 0 10px', fontWeight: 800 }}>
                        {sec.title}
                      </h3>
                      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sec.items.map((it, iIdx) => (
                          <li key={iIdx} style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Feature Quick Launch Buttons */}
              {release.relatedLinks && release.relatedLinks.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', fontWeight: 700 }}>
                    Quick Launch:
                  </span>
                  {release.relatedLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="tactile-btn"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        background: 'rgba(197, 160, 89, 0.12)',
                        border: '1px solid rgba(197, 160, 89, 0.4)',
                        color: 'var(--gold-lt)',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      {link.label} →
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
