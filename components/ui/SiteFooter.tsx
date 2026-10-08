'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Camera, CirclePlay, Users, BriefcaseBusiness } from 'lucide-react'
import { APP_VERSION, APP_RELEASE_CODENAME } from '@/lib/app-version'
import { AppleLogoIcon, AndroidLogoIcon } from '@/components/marketing/AppStoreBadges'
import { isCompanionApp, useHelperAppMode } from '@/lib/native-companion'

const BRAND_LOGO = '/images/brand/logo-concept-1-kinetic-f.jpg'

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/scottgordonfitness', Icon: Camera },
  { name: 'YouTube', href: 'https://youtube.com/@scottgordonfitness', Icon: CirclePlay },
  { name: 'Facebook', href: 'https://facebook.com/scottgordonfitness', Icon: Users },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/scottgordonfitness', Icon: BriefcaseBusiness },
]

export default function SiteFooter() {
  const { isHelper } = useHelperAppMode()
  if (isHelper || isCompanionApp()) {
    return null
  }
  return (
    <footer className="site-footer" style={{ borderTop: '1px solid rgba(197, 160, 89, 0.25)', background: 'linear-gradient(180deg, #080E14 0%, #04070D 100%)', padding: '3rem 1.5rem 2rem' }}>
      <div className="site-footer-inner" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
        <div className="site-footer-column site-footer-brand-col" style={{ maxWidth: 380 }}>
          <Link href="/" className="site-footer-brand" aria-label="Forge Athletic home" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <Image
              aria-hidden
              className="site-footer-mark"
              src={BRAND_LOGO}
              alt=""
              width={52}
              height={52}
            />
            <span className="site-footer-text font-serif" style={{ fontSize: '1.35rem', color: '#FFFFFF', letterSpacing: '0.03em', fontWeight: 700 }}>
              Forge <span style={{ color: 'var(--gold)' }}>Athletic</span>
            </span>
          </Link>
          <p className="site-footer-tagline" style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Built From The Ground Up. Precision Science For Real Lives.
          </p>
        </div>

        <nav className="site-footer-nav" aria-label="Training and coaching" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>Training</span>
          <Link href="/packages" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Memberships</Link>
          <Link href="/audit" style={{ color: '#CBD5E1', textDecoration: 'none' }}>AI Posture Audit</Link>
          <Link href="/apply" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Find your starting point</Link>
          <Link href="/whats-new" style={{ color: 'var(--gold-lt)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
            <span>What&apos;s New</span>
            <span style={{ fontSize: 9, background: 'var(--gold)', color: '#080E14', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>v{APP_VERSION}</span>
          </Link>
        </nav>

        <nav className="site-footer-nav" aria-label="Mobile Apps" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>Mobile Apps</span>
          <Link href="/#mobile-apps" style={{ color: '#CBD5E1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <AppleLogoIcon size={14} color="#CBD5E1" />
            <span>Apple iOS (HealthKit)</span>
          </Link>
          <Link href="/#mobile-apps" style={{ color: '#CBD5E1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <AndroidLogoIcon size={14} color="#3DDC84" />
            <span>Android (Health Connect)</span>
          </Link>
          <Link href="/dashboard/settings?tab=wearables" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Biometric Telemetry</Link>
        </nav>

        <nav className="site-footer-nav" aria-label="Legal" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)' }}>Legal &amp; IP</span>
          <Link href="/terms" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Terms &amp; Proprietary Rights</Link>
          <Link href="/privacy" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Privacy Policy</Link>
        </nav>

        <div className="site-footer-column">
          <p className="site-footer-social-label" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', margin: '0 0 0.5rem' }}>Connect</p>
          <div className="site-footer-social" aria-label="Social links" style={{ display: 'flex', gap: '0.75rem' }}>
            {SOCIAL_LINKS.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={name}
                className="site-social-link tactile-btn"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--gold-lt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={15} strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'center', display: 'grid', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/whats-new"
            className="tactile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 4,
              background: 'rgba(197, 160, 89, 0.08)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              color: 'var(--gold-lt)',
              fontSize: 11,
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--gold)' }} />
            <span>Forge Athletic v{APP_VERSION} · {APP_RELEASE_CODENAME}</span>
            <span style={{ color: 'var(--gold)' }}>→ What&apos;s New</span>
          </Link>
        </div>

        <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0, lineHeight: 1.55, maxWidth: 960, marginInline: 'auto' }}>
          <strong>Trademark &amp; Certification Non-Affiliation Notice:</strong> NASM®, Optimum Performance Training™, OPT™, Corrective Exercise Specialist (CES®), Performance Enhancement Specialist (PES®), Certified Nutrition Coach (CNC™), and Certified Personal Trainer (CPT®) are registered trademarks or service marks of the National Academy of Sports Medicine (NASM) and/or Ascend Learning, LLC. Forge Athletic LLC and Scott Gordon Fitness are independent private entities and are not affiliated with, sponsored by, or endorsed by NASM or Ascend Learning, LLC. References to the Optimum Performance Training (OPT™) framework are made for educational, methodological compatibility, and scientific periodization reference purposes under the Nominative Fair Use doctrine.
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--gray)', margin: 0, letterSpacing: '0.04em' }}>
          © {new Date().getFullYear()} Forge Athletic LLC. All Rights Reserved. Protected under U.S. and International Intellectual Property and Copyright Laws. Patents Pending.
        </p>
      </div>
    </footer>
  )
}