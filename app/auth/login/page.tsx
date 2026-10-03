import type { Metadata } from 'next'
import AuthForm from '@/components/auth/AuthForm'
import { Camera, CirclePlay, Users, BriefcaseBusiness } from 'lucide-react'
import ForgeBrandMark from '@/components/ui/ForgeBrandMark'

export const metadata: Metadata = {
  title: 'Client & Coach Authentication | Forge Athletic',
  description: 'Secure sign-in for Forge Athletic athletes, members, and coaches.',
}

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/scottgordonfitness', Icon: Camera },
  { name: 'YouTube', href: 'https://youtube.com/@scottgordonfitness', Icon: CirclePlay },
  { name: 'Facebook', href: 'https://facebook.com/scottgordonfitness', Icon: Users },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/scottgordonfitness', Icon: BriefcaseBusiness },
]

export const dynamic = 'force-dynamic'

type LoginPageProps = {
  searchParams: Promise<{
    next?: string
    error?: string | string[]
    error_description?: string | string[]
    mode?: string
    source?: string
  }>
}

function getLoginSurface(nextPath: string, isCompanion: boolean) {
  if (isCompanion) {
    return {
      eyebrow: 'Athlete In-Gym Companion',
      title: 'Forge Helper Access',
      description: 'Sign in to access your active training program, plate calculator, and wearable telemetry sync.',
    }
  }
  return nextPath.startsWith('/coach')
    ? {
        eyebrow: 'Coach Access',
        title: 'Coach Login',
        description: 'Sign in with 1-click Fast Pass or your coach credentials to access your console.',
      }
    : {
        eyebrow: 'Client Access',
        title: 'Client Login',
        description: 'Sign in with 1-click Fast Pass or your email to access your training studio.',
      }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams
  const isCompanionMode =
    resolvedSearchParams.mode === 'companion' ||
    resolvedSearchParams.mode === 'helper' ||
    resolvedSearchParams.source === 'pwa' ||
    resolvedSearchParams.source === 'native' ||
    resolvedSearchParams.source === 'helper'
  const nextPath = resolvedSearchParams.next?.startsWith('/')
    ? resolvedSearchParams.next
    : (isCompanionMode ? '/dashboard/fitness' : '/dashboard')
  const surface = getLoginSurface(nextPath, isCompanionMode)
  const rawError = resolvedSearchParams.error_description || resolvedSearchParams.error
  const initialError = Array.isArray(rawError) ? rawError[0] : rawError
  const isDemoEnabled = process.env.ENABLE_DEMO_LOGIN === 'true' || process.env.NODE_ENV === 'development'
  const isCoachSurface = nextPath.startsWith('/coach')

  return (
    <main
      className="sgf-auth-bg sgf-auth-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="sgf-auth-content" style={{ width: '100%', maxWidth: 420 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <ForgeBrandMark size={100} variant="raster" />
        </div>
        <h1
          className="font-serif gold-gradient-text"
          style={{
            fontSize: 26,
            letterSpacing: '0.08em',
            textAlign: 'center',
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          {surface.title}
        </h1>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {surface.eyebrow}
        </p>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 14,
            color: 'var(--gray)',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          {surface.description}
        </p>
        {/* Surface Switcher (Athlete vs Coach) */}
        <div
          className="sgf-auth-card"
          style={{
            display: 'flex',
            background: 'rgba(13, 27, 42, 0.75)',
            border: '1px solid var(--navy-lt)',
            padding: 4,
            marginBottom: 20,
            borderRadius: 4,
          }}
        >
          <a
            href={isCompanionMode ? "/auth/login?mode=companion&next=/dashboard/fitness" : "/auth/login"}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 12px',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              fontWeight: !isCoachSurface ? 700 : 500,
              textDecoration: 'none',
              color: !isCoachSurface ? 'var(--gold-lt)' : 'var(--gray)',
              background: !isCoachSurface ? 'rgba(197, 160, 89, 0.18)' : 'transparent',
              border: !isCoachSurface ? '1px solid rgba(197, 160, 89, 0.35)' : '1px solid transparent',
              borderRadius: 3,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Athlete Access
          </a>
          <a
            href={isCompanionMode ? "/auth/login?mode=companion&next=/coach" : "/auth/login?next=/coach"}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 12px',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              fontWeight: isCoachSurface ? 700 : 500,
              textDecoration: 'none',
              color: isCoachSurface ? 'var(--gold-lt)' : 'var(--gray)',
              background: isCoachSurface ? 'rgba(197, 160, 89, 0.18)' : 'transparent',
              border: isCoachSurface ? '1px solid rgba(197, 160, 89, 0.35)' : '1px solid transparent',
              borderRadius: 3,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Coach Console
          </a>
        </div>

        <div
          style={{
            background: 'rgba(18, 35, 54, 0.9)',
            padding: 32,
            border: '1px solid var(--navy-lt)',
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* ── 1-Click Coach Fast Pass (Always available for Coach Scott Gordon) ── */}
          <div className="sgf-auth-fast-pass" style={{ marginBottom: 20 }}>
            <a
              href="/api/auth/demo?role=coach"
              style={{
                width: '100%',
                padding: '13px 16px',
                background: 'linear-gradient(135deg, rgba(212,160,23,0.25) 0%, rgba(197,160,89,0.38) 100%)',
                border: '1.5px solid var(--gold)',
                borderRadius: 4,
                color: 'var(--gold-lt)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 13.5,
                letterSpacing: '0.04em',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
              }}
            >
              <span>⚡</span>
              <span>1-Click Coach Fast Pass (Scott Gordon)</span>
            </a>

            {/* Athlete Demo Pass when demo mode is enabled */}
            {isDemoEnabled && !isCoachSurface && (
              <div style={{ marginTop: 10 }}>
                <a
                  href="/api/auth/demo"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(13, 27, 42, 0.65)',
                    border: '1px solid rgba(197, 160, 89, 0.4)',
                    borderRadius: 4,
                    color: 'var(--gray)',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '0.03em',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxSizing: 'border-box',
                  }}
                >
                  <span>⚡ Athlete Demo Fast Pass (Alexander Vance)</span>
                </a>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '18px 0 6px',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {isCoachSurface ? 'or sign in with coach credentials' : 'or enter credentials'}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <AuthForm mode="login" redirectPath={nextPath} initialError={initialError} />
        </div>
        {isCompanionMode && (
          <div
            style={{
              marginTop: 20,
              padding: '14px 16px',
              background: 'rgba(197, 160, 89, 0.08)',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 4 }}>
              Gym Companion Notice
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.5 }}>
              Memberships, retainers, and billing are managed exclusively on our web portal. Visit{' '}
              <a
                href="https://gordonathleticadvisory.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--gold)', textDecoration: 'underline', fontWeight: 600 }}
              >
                gordonathleticadvisory.com
              </a>{' '}
              in your browser to apply or modify your retainer.
            </div>
          </div>
        )}
        {!isCompanionMode && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.55rem', marginTop: '1rem' }}>
            {SOCIAL_LINKS.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={name}
                style={{
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--navy-lt)',
                  color: 'var(--gray)',
                  background: 'rgba(13,27,42,0.55)',
                }}
              >
                <Icon size={15} strokeWidth={2} />
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
