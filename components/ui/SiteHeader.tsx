'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GlobalCommandPalette from '@/components/ui/GlobalCommandPalette'
import MobileNavigationDrawer from '@/components/ui/MobileNavigationDrawer'
import InteractiveFeatureTutorialModal from '@/components/tutorials/InteractiveFeatureTutorialModal'
import GaaIcon from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { createClient } from '@/lib/supabase-browser'
import { isCompanionApp, useHelperAppMode } from '@/lib/native-companion'
import ForgeBrandMark from '@/components/ui/ForgeBrandMark'

type NavLink = {
  label: string
  href: string
}

type SiteHeaderProps = {
  fixed?: boolean
  links?: NavLink[]
  actions?: React.ReactNode
  badgeText?: string
}

export default function SiteHeader({
  fixed = false,
  links = [],
  actions,
  badgeText,
}: SiteHeaderProps) {
  const pathname = usePathname() || ''
  const isCoach = pathname.startsWith('/coach')
  const isDashboard = pathname.startsWith('/dashboard')
  const isPrivatePortal = isCoach || isDashboard
  const { isHelper } = useHelperAppMode()
  const isCompanion = isCompanionApp() || isHelper
  const displayLinks = isCompanion
    ? links.filter(l =>
        l.href !== '/packages' &&
        l.href !== '/apply' &&
        l.href !== '/intake' &&
        l.href !== '/corporate' &&
        l.href !== '/audit' &&
        l.href !== '/async-coaching'
      )
    : links
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser({ id: data.user.id, email: data.user.email })
      } else {
        setCurrentUser(null)
      }
    }).catch(() => {
      setCurrentUser(null)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email })
      } else {
        setCurrentUser(null)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const handleOpenDrawer = () => {
    triggerHaptic('tap')
    setDrawerOpen(true)
  }

  // Global Cmd+K / Ctrl+K keyboard shortcut listener (Only active on private coach/client surfaces)
  useEffect(() => {
    if (!isPrivatePortal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPrivatePortal])

  return (
    <>
      <header className={`site-header ${fixed ? 'site-header-fixed' : ''}`}>
        <div
          className="site-header-inner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 1440,
            margin: '0 auto',
            minHeight: 64,
            padding: '0 12px',
            boxSizing: 'border-box',
          }}
        >
          <Link
            href={isCompanion ? (isCoach ? '/coach' : '/dashboard/fitness') : '/'}
            className="site-brand-link"
            aria-label={isCompanion ? 'Forge Athletic Companion' : 'Forge Athletic home'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textDecoration: 'none',
              minWidth: 0,
              flexShrink: 1,
              overflow: 'hidden',
            }}
          >
            <span
              aria-hidden
              className="site-brand-mark"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ForgeBrandMark size={52} variant="raster" />
            </span>
            <span className="site-brand-meta" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <span className="site-brand-text font-serif" style={{ fontSize: '1.18rem', letterSpacing: '0.08em', color: '#FFFFFF', whiteSpace: 'nowrap', fontWeight: 700 }}>
                Forge <span style={{ color: 'var(--gold)' }}>Athletic</span>
              </span>
              <span className="site-brand-subtitle" style={{ fontSize: '0.68rem', letterSpacing: '0.14em', color: 'var(--gray)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Precision Sports Science · NASM OPT™
              </span>
            </span>
          </Link>

          <div
            className="site-header-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {/* Desktop Navigation Links */}
            {displayLinks.length > 0 && (
              <nav className="site-header-links desktop-nav-links" aria-label="Primary">
                {displayLinks.map(link => (
                  <Link key={`${link.href}-${link.label}`} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Desktop / Large screen actions */}
            {(badgeText || actions || isCompanion) && (
              <div
                className="desktop-header-actions"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'nowrap',
                }}
              >
                {(badgeText || (isCompanion && isPrivatePortal)) && (
                  <p
                    className="site-header-badge"
                    style={{
                      margin: 0,
                      fontSize: '0.62rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: isCompanion ? 'var(--gold-lt)' : 'var(--gray)',
                      border: isCompanion ? '1px solid rgba(212,160,23,0.4)' : '1px solid var(--navy-lt)',
                      background: isCompanion ? 'rgba(212,160,23,0.1)' : 'rgba(13, 27, 42, 0.55)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '2px',
                    }}
                  >
                    {badgeText || 'Gym Companion'}
                  </p>
                )}

                {actions && (
                  <div
                    className="desktop-header-auth-actions"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      paddingLeft: '0.5rem',
                      borderLeft: '1px solid var(--navy-lt)',
                    }}
                  >
                    {actions}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Header Controls: Search trigger & Hamburger menu */}
            <div className="mobile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isPrivatePortal && (
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="mobile-header-search-btn tactile-btn"
                  aria-label="Search Features"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: 'rgba(212, 160, 23, 0.12)',
                    border: '1px solid rgba(212, 160, 23, 0.4)',
                    color: 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <GaaIcon name="search" size={15} tone="gold" />
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenDrawer}
                className="mobile-hamburger-btn tactile-btn"
                aria-label="Open Navigation Menu"
                aria-expanded={drawerOpen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 36,
                  padding: '0 9px',
                  borderRadius: 6,
                  background: 'rgba(212, 160, 23, 0.15)',
                  border: '1px solid rgba(212, 160, 23, 0.5)',
                  color: 'var(--gold-lt)',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <GaaIcon name="menu" size={16} tone="gold" />
                <span>MENU</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search / Command Palette Modal (Only for private portals) */}
      {isPrivatePortal && (
        <GlobalCommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      )}

      {/* Mobile High-End Drawer */}
      <MobileNavigationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={isCoach ? 'coach' : 'client'}
        actions={actions}
        currentUser={currentUser}
        onOpenTutorial={isPrivatePortal ? () => setTutorialOpen(true) : undefined}
      />

      {/* Interactive Feature Tutorial Modal */}
      <InteractiveFeatureTutorialModal
        isOpen={tutorialOpen}
        initialAudience={isCoach ? 'coach' : 'client'}
        onClose={() => setTutorialOpen(false)}
      />
    </>
  )
}
