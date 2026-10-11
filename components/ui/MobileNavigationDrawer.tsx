'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import { APP_VERSION } from '@/lib/app-version'
import { openCoachGordon } from '@/components/fitness/GlobalCoachGordonHost'
import { openWhatsNew } from '@/components/ui/GlobalWhatsNewHost'

interface MobileNavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
  role?: 'client' | 'coach'
  actions?: React.ReactNode
  currentUser?: { id: string; email?: string } | null
  onOpenTutorial?: () => void
}

export interface DrawerLinkItem {
  href: string
  label: string
  icon: GaaIconName
  desc: string
  badge?: string
}

export interface DrawerSection {
  title: string
  items: DrawerLinkItem[]
}

export const CLIENT_DRAWER_SECTIONS: DrawerSection[] = [
  {
    title: 'Your Training',
    items: [
      { href: '/dashboard', label: 'Today', icon: 'overview', desc: 'Your plan, next session, and weekly snapshot' },
      { href: '/dashboard/fitness?workspace=train', label: 'Training', icon: 'barbell', desc: 'Personalized plan and workout tracking' },
      { href: '/dashboard/fitness?workspace=progress', label: 'Progress', icon: 'chart', desc: 'Strength trends, personal records, and history' },
      { href: '/dashboard/fitness?workspace=lab', label: 'Fitness Lab', icon: 'compass', desc: 'Movement, recovery, and specialist tools' },
    ],
  },
  {
    title: 'Coaching',
    items: [
      { href: '#coach-gordon', label: 'Ask Coach Gordon', icon: 'message', desc: 'On-demand training and movement guidance', badge: 'Live AI' },
      { href: '/dashboard/fitness?workspace=coach', label: 'Coach Hub', icon: 'clipboard', desc: 'Check-ins, advice, and session options' },
      { href: '/dashboard/messages', label: 'Message Coach', icon: 'message', desc: 'Private communication with your coach' },
      { href: '/dashboard/live', label: 'Live Coaching', icon: 'video-studio', desc: '1:1 video coaching and form feedback' },
      { href: '/dashboard/book', label: 'Book a Session', icon: 'calendar', desc: 'Schedule a consultation or movement screen' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/settings', label: 'Account Settings', icon: 'gear', desc: 'Profile, connected devices, billing, and security' },
    ],
  },
]

export const COACH_DRAWER_SECTIONS: DrawerSection[] = [
  {
    title: 'Coach Tools',
    items: [
      { href: '#coach-gordon', label: 'Ask Coach Gordon', icon: 'message', desc: 'Training and movement guidance', badge: 'Live AI' },
      { href: '/coach', label: 'Review Queue', icon: 'alert-triangle', desc: 'Check-ins, concerns, and plan adjustments' },
      { href: '/coach?tab=roster#assigned-clients', label: 'Members', icon: 'users', desc: 'Member list and training plans' },
      { href: '/coach#live-studio', label: 'Live Video Studio', icon: 'video-studio', desc: 'Coach HUD, telestrator & voice copilot' },
      { href: '/coach?tab=architect', label: 'Program Builder', icon: 'clipboard', desc: 'OPT plans for members or reusable templates' },
      { href: '/coach?tab=analytics', label: 'Progress Analytics', icon: 'chart', desc: 'Training, attendance, and progress trends' },
    ],
  },
  {
    title: 'Administration & Settings',
    items: [
      { href: '/coach/settings?tab=promotions', label: 'Discount Codes', icon: 'ticket', desc: 'Create & manage promo codes' },
      { href: '/coach/settings?tab=profile', label: 'Coach Settings', icon: 'gear', desc: 'Profile, availability & credentials' },
      { href: '/coach/settings?tab=security', label: 'Security & Password', icon: 'lock', desc: 'Credentials & authorization' },
    ],
  },
]

const DEFAULT_QUERY_BY_PATH: Record<string, Record<string, string>> = {
  '/dashboard/fitness': { workspace: 'train' },
  '/coach': { tab: 'overview' },
}

/**
 * A menu row is active when its path matches and its `workspace`/`tab` view matches the
 * current one (missing values fall back to the page default). Pure section anchors such as
 * `/coach#live-studio` never claim the active state from the page they live on.
 */
export function isDrawerItemActive(href: string, pathname: string, currentSearch: string): boolean {
  if (href.startsWith('#')) return false
  const target = new URL(href, 'http://menu.local')
  if (target.pathname !== pathname) return false
  if (target.hash && !target.search) return false
  const current = new URLSearchParams(currentSearch)
  const defaults = DEFAULT_QUERY_BY_PATH[pathname] ?? {}
  return ['workspace', 'tab'].every(key => {
    const fallback = defaults[key] ?? ''
    return (target.searchParams.get(key) ?? fallback) === (current.get(key) ?? fallback)
  })
}

export default function MobileNavigationDrawer({
  isOpen,
  onClose,
  role = 'client',
  actions,
  currentUser,
  onOpenTutorial,
}: MobileNavigationDrawerProps) {
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)

  // Close only when the user actually navigates to a different route
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  // Prevent background body scrolling when open on iOS
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      const originalTouchAction = document.body.style.touchAction
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.touchAction = originalTouchAction
      }
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const isCoach = role === 'coach'
  const sections = isCoach ? COACH_DRAWER_SECTIONS : CLIENT_DRAWER_SECTIONS

  if (!isOpen) return null

  // The drawer only renders after a client-side tap, so reading the live query string is hydration-safe.
  const currentSearch = typeof window !== 'undefined' ? window.location.search : ''

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* iOS Backdrop with Blur */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 10, 18, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* iOS Slide-Over Sheet Surface */}
      <aside
        aria-label="Navigation Menu"
        style={{
          position: 'relative',
          width: 'min(380px, 88vw)',
          height: '100dvh',
          maxHeight: '100%',
          background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
          borderLeft: '1px solid rgba(212,160,23,0.35)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.85)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              {isCoach ? 'Coach' : 'Member Portal'}
            </span>
            <h3 className="font-serif" style={{ fontSize: 18, margin: '4px 0 0', color: '#FFFFFF', letterSpacing: '0.04em', fontWeight: 600 }}>
              MENU
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="close" size={16} tone="gold" />
          </button>
        </div>

        {/* Auth Status & Fast Login Hub */}
        {currentUser ? (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(197, 160, 89, 0.08)',
              borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: 'var(--gold)',
                  color: '#080E14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'V'}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="status-dot-pulse" />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isCoach ? 'Signed in as coach' : 'Signed in'}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>
            {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
          </div>
        ) : (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(13, 27, 42, 0.9)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gray)', fontWeight: 800 }}>
                Account Access
              </span>
              <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <GaaIcon name="lock" size={11} tone="gold" />
                <span>Guest</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Link
                href="/auth/login?next=/dashboard"
                onClick={onClose}
                className="tactile-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                  color: '#080E14',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Member Login
              </Link>
              <Link
                href="/auth/login?next=/coach"
                onClick={onClose}
                className="tactile-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Coach Login
              </Link>
            </div>
          </div>
        )}

        {/* Scrollable Navigation Sections */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {sections.map((section) => (
            <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 800,
                  color: 'var(--gold-lt)',
                  padding: '0 8px 4px',
                  fontFamily: 'Raleway, sans-serif',
                }}
              >
                {section.title}
              </div>

              {section.items.map(link => {
                const isActive = isDrawerItemActive(link.href, pathname ?? '', currentSearch)
                const isCoachGordonAction = link.href === '#coach-gordon'
                const itemKey = `${section.title}-${link.href}-${link.label}`

                if (isCoachGordonAction) {
                  return (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => {
                        onClose()
                        openCoachGordon()
                      }}
                      className="tactile-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 8,
                        width: '100%',
                        textAlign: 'left',
                        background: 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(14,23,36,0.85) 100%)',
                        border: '1px solid rgba(212,160,23,0.5)',
                        transition: 'all 0.15s ease',
                        minHeight: 48,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: 'rgba(197, 160, 89, 0.25)',
                          border: '1px solid var(--gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <GaaIcon name="message" tone="gold" size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontFamily: 'Raleway, sans-serif',
                              fontSize: 13.5,
                              fontWeight: 800,
                              color: 'var(--gold-lt)',
                            }}
                          >
                            {link.label}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: '#22c55e',
                              color: '#080E14',
                            }}
                          >
                            Live AI
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--gray)',
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {link.desc}
                        </div>
                      </div>
                      <span style={{ color: 'var(--gold-lt)', fontSize: 13, flexShrink: 0 }}>
                        →
                      </span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={itemKey}
                    href={link.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      background: isActive ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.03)',
                      border: isActive ? '1px solid rgba(212,160,23,0.45)' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.15s ease',
                      minHeight: 48,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: isActive ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <GaaIcon name={link.icon} tone={isActive ? 'gold' : 'slate'} size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: 13.5,
                            fontWeight: isActive ? 800 : 700,
                            color: isActive ? 'var(--gold-lt)' : 'var(--white)',
                          }}
                        >
                          {link.label}
                        </span>
                        {link.badge && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'var(--gold)',
                              color: 'var(--navy)',
                            }}
                          >
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--gray)',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {link.desc}
                      </div>
                    </div>
                    <span style={{ color: isActive ? 'var(--gold-lt)' : 'rgba(255,255,255,0.25)', fontSize: 13, flexShrink: 0 }}>
                      →
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Help footer: app guide + release notes */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.4)',
            display: 'grid',
            gridTemplateColumns: onOpenTutorial ? '1fr 1fr' : '1fr',
            gap: 8,
          }}
        >
          {onOpenTutorial && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenTutorial() }}
              className="tactile-btn mobile-drawer-footer-btn"
              style={footerButtonStyle}
            >
              <GaaIcon name="lightbulb" tone="gold" size={14} />
              <span>App Guide</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => { onClose(); openWhatsNew() }}
            className="tactile-btn mobile-drawer-footer-btn"
            aria-label={`What's new in version ${APP_VERSION}`}
            style={footerButtonStyle}
          >
            <span className="status-dot-pulse" />
            <span>What&apos;s New</span>
            <span style={{ color: 'var(--gray)', fontWeight: 600 }}>v{APP_VERSION}</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

const footerButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 8,
  background: 'rgba(197, 160, 89, 0.1)',
  border: '1px solid rgba(197, 160, 89, 0.35)',
  color: 'var(--gold-lt)',
  fontFamily: 'Raleway, sans-serif',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
}
