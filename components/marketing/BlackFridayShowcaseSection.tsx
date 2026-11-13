'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { HOLIDAY_DEAL_PROMO, LAUNCH_CAMPAIGN_INFO } from '@/lib/launch-config'

const SHOWCASE_CHAPTERS = [
  { id: 'desk', code: '01', label: 'Desk Posture & Ergonomics', timeSec: 0 },
  { id: 'home', code: '02', label: 'Joint-First Home Strength', timeSec: 2.5 },
  { id: 'travel', code: '03', label: '20-Min Travel & Recovery', timeSec: 5.0 },
  { id: 'coach', code: '04', label: '1-on-1 Live Coaching', timeSec: 8.2 },
  { id: 'crest', code: '05', label: 'The Forge Sanctuary', timeSec: 10.7 },
] as const

export default function BlackFridayShowcaseSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoMuted, setVideoMuted] = useState(true)
  const [activeChapter, setActiveChapter] = useState<string>('desk')

  const jumpToChapter = (id: string, timeSec: number) => {
    setActiveChapter(id)
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec
      videoRef.current.play().catch(() => {})
    }
  }

  return (
    <section
      aria-labelledby="bf-showcase-heading"
      style={{
        maxWidth: '1160px',
        margin: '2.5rem auto 3.5rem',
        padding: '0 1.25rem',
      }}
    >
      <div
        style={{
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0B121E 0%, #06090F 100%)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 40px rgba(245, 158, 11, 0.14)',
        }}
      >
        {/* Top Black Friday Event Marquee Strip */}
        <div
          style={{
            background: 'linear-gradient(90deg, #92400E 0%, #D97706 50%, #92400E 100%)',
            color: '#080E14',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            fontFamily: 'var(--font-telemetry)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          <span>🔥 BLACK FRIDAY FOUNDING EVENT · {LAUNCH_CAMPAIGN_INFO.dateFormatted}</span>
          <span>•</span>
          <span>JOIN ON BLACK FRIDAY FOR 25% OFF FOR LIFE + $279 IN FREE BONUSES (CODE: {HOLIDAY_DEAL_PROMO.code})</span>
        </div>

        {/* Header Copy */}
        <div
          style={{
            padding: '28px 24px 20px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FBBF24',
              fontFamily: 'var(--font-telemetry)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <span>OFFICIAL BRAND FILM · 1080P CINEMA</span>
          </div>
          <h2
            id="bf-showcase-heading"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 3.8vw, 2.65rem)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              color: '#FFFFFF',
              margin: '0 0 10px',
            }}
          >
            Built For Real Life, Pain-Free Strength &amp; Longevity
          </h2>
          <p
            style={{
              maxWidth: '720px',
              margin: '0 auto',
              color: '#94A3B8',
              fontSize: '0.98rem',
              lineHeight: 1.6,
            }}
          >
            From 5-minute desk ergonomics resets and joint-friendly 20-minute home or hotel workouts to personalized NASM OPT™ progression, nutrition periodization, and 1-on-1 live coaching with Coach Gordon.
          </p>
        </div>

        {/* 16:9 Cinema Video Stage */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#05080D',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={videoMuted}
            playsInline
            preload="auto"
            poster="/images/forge-black-friday-showcase-poster.jpg?v=7"
            aria-label="Forge Athletic Holistic Coaching Showcase Film"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          >
            <source src="/videos/forge-black-friday-showcase.mp4?v=7" type="video/mp4" />
            <source src="/videos/gaa-founding-manifesto.mp4" type="video/mp4" />
          </video>

          {/* Top-right Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = !videoMuted
              setVideoMuted(nextMuted)
              if (videoRef.current) {
                videoRef.current.muted = nextMuted
                if (!nextMuted) {
                  videoRef.current.play().catch(() => {})
                }
              }
            }}
            aria-label={videoMuted ? 'Unmute showcase video audio' : 'Mute showcase video audio'}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: videoMuted
                ? 'rgba(8, 14, 24, 0.85)'
                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              border: '1px solid rgba(245, 158, 11, 0.55)',
              color: videoMuted ? '#FBBF24' : '#080E14',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '11px',
              fontFamily: 'var(--font-telemetry)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {videoMuted ? '🔇 UNMUTE FILM AUDIO' : '🔊 FILM AUDIO ON'}
          </button>
        </div>

        {/* Interactive 5-Act Telemetry Chapter Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '8px',
            padding: '14px 16px',
            background: 'rgba(8, 14, 24, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {SHOWCASE_CHAPTERS.map(chapter => {
            const isActive = activeChapter === chapter.id
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => jumpToChapter(chapter.id, chapter.timeSec)}
                style={{
                  background: isActive ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive
                    ? '1px solid rgba(245, 158, 11, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: isActive ? '#080E14' : '#FBBF24',
                    background: isActive ? '#F59E0B' : 'rgba(245, 158, 11, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {chapter.code}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isActive ? '#F8FAFC' : '#94A3B8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {chapter.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Black Friday Promo Branding Package Footer */}
        <div
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.96) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#34D399',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              ★ BLACK FRIDAY DOORBUSTER PACKAGE · DEEPEST DISCOUNT OF THE YEAR
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '4px',
              }}
            >
              Join on Black Friday (Nov 27) for 25% Off For Life + $279 in Free Founding Bonuses
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5 }}>
              Lock in <strong>25% off any tier for life</strong> (save up to $900/yr), a <strong>Free 60-Min 1-on-1 Live Movement Screen ($180 value)</strong>, and a <strong>Free 30-Day Partner Guest Pass ($99 value)</strong> with code <strong>{HOLIDAY_DEAL_PROMO.code}</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/packages"
              style={{
                textDecoration: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#080E14',
                fontFamily: 'var(--font-heading)',
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
              }}
            >
              Claim Black Friday Deal ({HOLIDAY_DEAL_PROMO.code}) &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

