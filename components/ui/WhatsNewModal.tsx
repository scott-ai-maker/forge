'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  APP_VERSION,
  APP_RELEASE_DATE,
  APP_RELEASE_CODENAME,
  ReleaseCategory,
  getAllReleases,
} from '@/lib/app-version'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import GaaIcon from '@/components/ui/GaaIcon'

interface WhatsNewModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const [activeCategory, setActiveCategory] = useState<ReleaseCategory | 'all'>('all')

  useEffect(() => {
    if (isOpen) {
      triggerHaptic('tap')
      try {
        localStorage.setItem('gaa_last_seen_version', APP_VERSION)
      } catch {}
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const releases = getAllReleases(activeCategory)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(4, 8, 14, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal Card Surface */}
      <div
        className="glass-card-gold"
        role="dialog"
        aria-label="What's New in Forge Athletic"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #101726 0%, #080E18 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(197, 160, 89, 0.25)',
          overflow: 'hidden',
          animation: 'slideInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--gold)',
                  color: '#080E14',
                }}
              >
                v{APP_VERSION}
              </span>
              <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {APP_RELEASE_CODENAME} · {APP_RELEASE_DATE}
              </span>
            </div>
            <h2
              className="font-serif"
              style={{
                fontSize: 20,
                color: '#FFFFFF',
                margin: '6px 0 0',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              WHAT&apos;S NEW &amp; RELEASE LOG
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="tactile-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <GaaIcon name="close" size={14} tone="slate" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.15)',
            overflowX: 'auto',
          }}
        >
          {(['all', 'major', 'feature', 'security'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="tactile-btn"
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'Raleway, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                background: activeCategory === cat ? 'var(--gold)' : 'rgba(255, 255, 255, 0.04)',
                color: activeCategory === cat ? '#080E14' : 'var(--gray)',
                border: activeCategory === cat ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              {cat === 'all' ? 'All Releases' : cat === 'major' ? 'Major Milestone' : cat === 'security' ? 'Safety Shield' : 'Features'}
            </button>
          ))}
        </div>

        {/* Scrollable Release Entries */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {releases.map((release, idx) => (
            <article
              key={release.version}
              style={{
                padding: '20px',
                background: idx === 0 ? 'rgba(197, 160, 89, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                border: idx === 0 ? '1.5px solid rgba(197, 160, 89, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--gold)', letterSpacing: '0.02em' }}>
                      v{release.version}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold-lt)', background: 'rgba(197, 160, 89, 0.15)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                      {release.badge}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'Raleway, sans-serif', fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
                    {release.title}
                  </h3>
                </div>
                <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'Raleway, sans-serif' }}>
                  {release.date}
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.6 }}>
                {release.summary}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
                {release.highlights.map((item, hIdx) => (
                  <div key={hIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {release.relatedLinks && release.relatedLinks.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  {release.relatedLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className="tactile-btn"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(197, 160, 89, 0.3)',
                        color: 'var(--gold-lt)',
                        fontSize: 11,
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

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/whats-new"
            onClick={onClose}
            className="tactile-btn"
            style={{
              fontSize: 12,
              color: 'var(--gold-lt)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            View Full Release Notes Portal (/whats-new) →
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="tactile-btn"
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              background: 'var(--gold)',
              color: '#080E14',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}
